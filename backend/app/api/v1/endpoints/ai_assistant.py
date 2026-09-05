import os
import time
import httpx
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Header, Request, status
from pydantic import BaseModel, Field
from app.core.config import settings
from app.core.database import get_db
from sqlalchemy.orm import Session

router = APIRouter()

# ---------------------------------------------------------------------------
# Rate Limiting (In-Memory Sliding Window)
# ---------------------------------------------------------------------------
_rate_limit_records: Dict[str, List[float]] = {}

def check_rate_limit(client_id: str, limit_per_minute: int = 20) -> bool:
    now = time.time()
    window_start = now - 60.0
    
    if client_id not in _rate_limit_records:
        _rate_limit_records[client_id] = []
    
    # Filter timestamps within current window
    _rate_limit_records[client_id] = [t for t in _rate_limit_records[client_id] if t > window_start]
    
    if len(_rate_limit_records[client_id]) >= limit_per_minute:
        return False
    
    _rate_limit_records[client_id].append(now)
    return True

# ---------------------------------------------------------------------------
# System Prompt & Scope Definition
# ---------------------------------------------------------------------------
SPORTX_SYSTEM_PROMPT = """You are the SportX AI Fitness & Biomechanics Coach.
You provide direct, motivating, expert guidance to athletes on exercise technique, biomechanics, workout programming, sports nutrition, and recovery.

CRITICAL INSTRUCTIONS:
1. DIRECT RESPONSE: Provide your final, practical response directly to the user immediately.
2. NO REASONING OR SCRATCHPAD: Do NOT output internal reasoning, planning steps, drafts, outlines, bulleted checklists, or metadata tags.
3. STRICT LANGUAGE MATCH: Reply in the EXACT same language the user wrote in:
   - Russian -> Natural, fluent Russian.
   - Kazakh -> Natural, fluent Kazakh.
   - English -> Natural, fluent English.
4. SCOPE: Focus strictly on fitness, exercise technique, athletic biomechanics, workouts, and sports nutrition."""

def sanitize_ai_response(raw_text: str) -> str:
    if not raw_text:
        return ""
    import re
    text = str(raw_text).strip()
    # Remove thought tags
    text = re.sub(r'<thought>[\s\S]*?</thought>', '', text, flags=re.IGNORECASE)
    text = re.sub(r'```thought[\s\S]*?```', '', text, flags=re.IGNORECASE)
    
    # Strip planning / reasoning scratchpad blocks if model leaks them
    scratchpad_end_regex = r'^[\s\S]*?(?:Language:\s*(?:Russian|Kazakh|English|RU|KK|EN)[\.\s]*|Check against constraints[^\n]*[\.\s]*|Ensure tone is[^\n]*[\.\s]*)(?=[А-ЯӘІҢҒҮҰҚӨҺA-Z0-9#\n])'
    text = re.sub(scratchpad_end_regex, '', text, flags=re.IGNORECASE)

    # Strip leading bulleted reasoning lists
    text = re.sub(r'^(?:\s*[\*\-]\s*(?:User says:|Topic:|Target Persona:|Greeting:|Key Biomechanical|Setup:|Grip:|Bar Path:|Execution:|Safety:|Common Mistakes:|Closing:|Introduction:)[^\n]*\n*)+', '', text, flags=re.IGNORECASE | re.MULTILINE)

    # Strip any leading translated query echoes
    text = re.sub(r'^[^\n]*\([A-Za-z\s,!\'\?]+\)\.\s*\n+', '', text, flags=re.IGNORECASE)

    return text.strip()

# ---------------------------------------------------------------------------
# Request & Response Schemas
# ---------------------------------------------------------------------------
class ChatMessage(BaseModel):
    role: str = Field(..., description="Role: 'user', 'assistant', or 'system'")
    content: str = Field(..., max_length=4000)

class AssistantChatRequest(BaseModel):
    message: Optional[str] = None
    messages: Optional[List[ChatMessage]] = None
    conversationId: Optional[str] = None
    user_context: Optional[Dict[str, Any]] = None

class AssistantChatResponse(BaseModel):
    role: str = "assistant"
    content: str
    conversationId: Optional[str] = None
    sources_used: Optional[List[str]] = None

# ---------------------------------------------------------------------------
# Offline Deterministic Biomechanical Knowledge Engine (Fallback)
# ---------------------------------------------------------------------------
def deterministic_fitness_response(query: str, lang: str = "en") -> str:
    q = query.lower().strip()

    # Off-topic filter for offline fallback
    off_topic_triggers = [
        "python", "javascript", "code", "html", "css", "programming", "math",
        "calculate 2", "derivative", "integral", "history", "president",
        "election", "war", "movie", "actor", "game", "gta", "crypto", "bitcoin",
        "stock", "invest", "recipe for cake", "how to fly"
    ]
    if any(trigger in q for trigger in off_topic_triggers):
        return "I can only help with exercise technique, training, workouts, and fitness-related questions."

    if any(k in q for k in ["squat", "присед", "отырып"]):
        return (
            "### Squat Biomechanics & Technique Guide\n\n"
            "1. **Foot Stance & Setup**: Place feet shoulder-width apart with toes turned outward 15–30°. Ensure tripod foot contact (heel, big toe base, pinky toe base).\n"
            "2. **Descent Phase**: Inhale and brace your core. Initiate movement by breaking at the hips and knees simultaneously. Keep torso angle steady.\n"
            "3. **Target Depth**: Descend until hip crease is level with or below knee joint (ideal knee angle $\\approx 90^\\circ - 100^\\circ$).\n"
            "4. **Knee Tracking**: Drive knees out in line with second and third toes to prevent valgus collapse.\n"
            "5. **Ascent**: Drive evenly through midfoot while maintaining thoracic extension to full hip lockout."
        )
    elif any(k in q for k in ["pushup", "push-up", "push up", "отжиман"]):
        return (
            "### Push-up Biomechanics & Technique Guide\n\n"
            "1. **Hand Placement**: Position hands slightly wider than shoulder-width, fingers pointing forward or slightly outward.\n"
            "2. **Elbow Path**: Angle elbows at approximately $45^\\circ$ relative to torso. Avoid flared $90^\\circ$ alignment to prevent shoulder impingement.\n"
            "3. **Rigid Plank Line**: Squeeze glutes and engage transverse abdominis to prevent anterior pelvic tilt and sagging hips.\n"
            "4. **Depth & Lockout**: Lower chest until 2–3 inches above floor, then press up smoothly to full arm extension."
        )
    elif any(k in q for k in ["pullup", "pull-up", "pull up", "подтягиван", "тартылу"]):
        return (
            "### Pull-up Biomechanics Guide\n\n"
            "1. **Grip**: Overhand grip slightly wider than shoulder-width.\n"
            "2. **Scapular Depression**: Initiate every repetition by depressing and retracting shoulder blades before flexing elbows.\n"
            "3. **Vertical Path**: Pull chest toward the bar without excessive backward swinging or leg kicking.\n"
            "4. **Full ROM**: Lower under control into a dead hang to ensure full latissimus stretch."
        )
    elif any(k in q for k in ["bicep", "curl", "бицепс", "бүгу"]):
        return (
            "### Dumbbell Bicep Curl Guide\n\n"
            "1. **Upper-Arm Isolation**: Keep elbows pinned securely beside your ribcage without letting them drift forward.\n"
            "2. **Supination**: Rotate wrists outward at mid-ascent to maximize peak biceps brachii contraction.\n"
            "3. **Momentum Control**: Avoid swinging your lumbar spine or leaning backwards.\n"
            "4. **Eccentric Cadence**: Lower weights with a 2-second controlled tempo."
        )
    elif any(k in q for k in ["shoulder press", "overhead press", "жим стоя", "иық"]):
        return (
            "### Overhead Shoulder Press Guide\n\n"
            "1. **Core Bracing**: Lock your ribcage down to protect your lower back from hyperextension.\n"
            "2. **Bar Path**: Press straight up, clearing your chin, and lock out with arms inline with ears overhead.\n"
            "3. **Symmetry**: Ensure equal bilateral pressing speed and vertical lockout height."
        )
    elif any(k in q for k in ["nutrition", "protein", "diet", "калори", "питан", "тамақ", "белок"]):
        return (
            "### Athletic Nutrition Principles\n\n"
            "• **Protein Intake**: 1.6–2.2g per kg of bodyweight per day for strength and muscle recovery.\n"
            "• **Carbohydrates**: 3–6g per kg of bodyweight depending on training volume to replenish glycogen.\n"
            "• **Post-Workout Window**: 25–40g of protein within 2 hours of training with complex carbs.\n"
            "• **Hydration**: Minimum 35–45ml of water per kg daily."
        )
    elif any(k in q for k in ["sleep", "recovery", "сон", "ұйқы", "қалпына"]):
        return (
            "### Sleep & Recovery Guide\n\n"
            "• **Optimal Duration**: 7.5–9 hours of continuous sleep for youth and athletic growth hormone release.\n"
            "• **Sleep Schedule**: Maintain wake and bedtimes within a 30-minute consistency window.\n"
            "• **Environment**: Room temperature between 18–20°C and zero blue-light exposure 45 minutes before sleep."
        )
    else:
        return (
            "Hello! I am your SportX AI Fitness Assistant. I can analyze your exercise technique, evaluate range of motion and symmetry, suggest training sets and repetitions, and provide sports nutrition and recovery recommendations. How can I help with your training today?"
        )

# ---------------------------------------------------------------------------
# POST /api/ai/chat & /api/v1/ai-assistant/chat Endpoint
# ---------------------------------------------------------------------------
@router.post("/chat", response_model=AssistantChatResponse)
async def chat_with_assistant(
    request: AssistantChatRequest,
    raw_req: Request,
    authorization: Optional[str] = Header(None)
):
    """
    Secure backend proxy for SportX AI Assistant.
    - Validates user rate limits.
    - Uses server-side GEMINI_API_KEY without exposing it to the frontend.
    - Enforces strict fitness-only scope via dedicated system prompt.
    - Seamlessly falls back to deterministic biomechanical knowledge engine if Gemini is unavailable.
    """
    # 1. Rate Limiting Check
    client_ip = raw_req.client.host if raw_req.client else "unknown"
    if not check_rate_limit(client_ip, settings.AI_MAX_REQUESTS_PER_MINUTE):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a moment before sending another message."
        )

    # 2. Extract query text
    user_query = ""
    history_messages: List[Dict[str, str]] = []

    if request.message and request.message.strip():
        user_query = request.message.strip()
    elif request.messages and len(request.messages) > 0:
        user_query = request.messages[-1].content.strip()
        for m in request.messages[:-1]:
            if m.role in ["user", "assistant"]:
                history_messages.append({"role": m.role, "content": m.content})

    if not user_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty."
        )

    # 3. User Context Enrichment
    context_str = ""
    if request.user_context:
        sport = request.user_context.get("sport", "General Fitness")
        level = request.user_context.get("training_level", "Intermediate")
        goal = request.user_context.get("fitness_goal", "Strength & Technique")
        score = request.user_context.get("overall_score")
        issues = request.user_context.get("recent_issues")

        context_str = f"\n\nATHLETE CONTEXT:\n- Sport: {sport}\n- Training Level: {level}\n- Goal: {goal}"
        if score is not None:
            context_str += f"\n- Recent Technique Score: {score}%"
        if issues:
            context_str += f"\n- Recent Detected Technique Flaws: {issues}"

    # 4. Query Google Gemini if configured
    api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
    raw_model = settings.GEMINI_MODEL or os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    clean_model = (raw_model or "gemini-1.5-flash").strip().replace("models/", "")

    if api_key and not api_key.startswith("your-") and len(api_key) > 10:
        try:
            full_system = SPORTX_SYSTEM_PROMPT + context_str
            gemini_contents = []
            
            # Add up to 6 recent history messages formatted for Gemini
            for h in history_messages[-6:]:
                role = "model" if h.get("role") == "assistant" else "user"
                gemini_contents.append({
                    "role": role,
                    "parts": [{"text": str(h.get("content", ""))[:3000]}]
                })
            
            gemini_contents.append({
                "role": "user",
                "parts": [{"text": user_query[:3000]}]
            })

            gemini_payload = {
                "system_instruction": {
                    "parts": [{"text": full_system}]
                },
                "contents": gemini_contents,
                "generationConfig": {
                    "temperature": 0.3,
                    "maxOutputTokens": 1000,
                    "thinkingConfig": {"thinkingBudget": 0},
                    "thinking_config": {"thinking_budget": 0}
                }
            }

            candidate_models = [
                (clean_model, "v1beta"),
                ("gemini-2.0-flash", "v1beta"),
                ("gemini-1.5-flash", "v1beta"),
                ("gemini-1.5-flash-latest", "v1beta"),
                ("gemini-1.5-flash-002", "v1beta"),
                ("gemini-1.5-flash-001", "v1beta"),
                ("gemini-1.5-flash-8b", "v1beta"),
                ("gemini-1.5-pro", "v1beta"),
                ("gemini-1.5-pro-002", "v1beta"),
                ("gemini-pro", "v1"),
                ("gemini-1.0-pro", "v1"),
            ]
            seen_models = set()
            unique_candidates = [m for m in candidate_models if not (m[0] in seen_models or seen_models.add(m[0]))]

            async with httpx.AsyncClient(timeout=25.0) as client:
                for target_model, api_ver in unique_candidates:
                    url = f"https://generativelanguage.googleapis.com/{api_ver}/models/{target_model}:generateContent?key={api_key}"
                    resp = await client.post(
                        url,
                        headers={"Content-Type": "application/json"},
                        json=gemini_payload,
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = [p for p in candidates[0].get("content", {}).get("parts", []) if not p.get("thought")]
                            raw_ai_content = "".join([p.get("text", "") for p in parts]).strip()
                            ai_content = sanitize_ai_response(raw_ai_content)
                            if ai_content:
                                return AssistantChatResponse(
                                    role="assistant",
                                    content=ai_content,
                                    conversationId=request.conversationId,
                                    sources_used=[f"SportX Gemini Biomechanics Engine ({target_model})"]
                                )
                    elif resp.status_code == 404:
                        continue
                    else:
                        break

                # Dynamic discovery fallback via ListModels if static candidates were 404
                for list_ep in ["https://generativelanguage.googleapis.com/v1beta/models", "https://generativelanguage.googleapis.com/v1/models"]:
                    try:
                        list_res = await client.get(f"{list_ep}?key={api_key}")
                        if list_res.status_code == 200:
                            models_data = list_res.json().get("models", [])
                            available = [
                                m.get("name", "").replace("models/", "")
                                for m in models_data
                                if "generateContent" in m.get("supportedGenerationMethods", [])
                            ]
                            api_ver = "v1beta" if "v1beta" in list_ep else "v1"
                            for discovered_m in available:
                                url = f"https://generativelanguage.googleapis.com/{api_ver}/models/{discovered_m}:generateContent?key={api_key}"
                                disc_resp = await client.post(
                                    url,
                                    headers={"Content-Type": "application/json"},
                                    json=gemini_payload,
                                )
                                if disc_resp.status_code == 200:
                                    data = disc_resp.json()
                                    candidates = data.get("candidates", [])
                                    if candidates:
                                        parts = candidates[0].get("content", {}).get("parts", [])
                                        raw_disc_content = "".join([p.get("text", "") for p in parts]).strip()
                                        ai_content = sanitize_ai_response(raw_disc_content)
                                        if ai_content:
                                            return AssistantChatResponse(
                                                role="assistant",
                                                content=ai_content,
                                                conversationId=request.conversationId,
                                                sources_used=[f"SportX Gemini Biomechanics Engine ({discovered_m})"]
                                            )
                    except Exception:
                        pass
        except Exception as e:
            # Fallback to local rules engine on upstream network/API issue
            pass

    # 5. Deterministic Knowledge Engine Fallback
    fallback_answer = deterministic_fitness_response(user_query)
    return AssistantChatResponse(
        role="assistant",
        content=fallback_answer,
        conversationId=request.conversationId,
        sources_used=["SportX Biomechanical Knowledge Base"]
    )
