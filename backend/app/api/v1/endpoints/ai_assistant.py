import os
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class AssistantRequest(BaseModel):
    messages: List[ChatMessage]
    user_context: Optional[dict] = None

class AssistantResponse(BaseModel):
    role: str
    content: str
    sources_used: Optional[List[str]] = None

@router.post("/chat", response_model=AssistantResponse)
async def chat_with_assistant(request: AssistantRequest):
    """
    Secure backend proxy for AI Fitness Assistant.
    Protects OPENAI_API_KEY on the server side.
    """
    api_key = os.getenv("OPENAI_API_KEY")

    # If OpenAI API key is configured, query OpenAI
    if api_key and not api_key.startswith("your-") and len(api_key) > 10:
        try:
            import httpx
            system_prompt = (
                "You are the SportX AI Fitness Assistant. You provide objective, scientific biomechanical advice, "
                "training recommendations, exercise technique guidance, nutrition advice, and sleep insights. "
                "Never provide clinical or medical diagnoses. Recommend consulting a physician for medical symptoms."
            )

            # Build context
            if request.user_context:
                ctx_summary = f"\nUser Context: Goal={request.user_context.get('fitness_goal', 'Fitness')}, Recent Reps={request.user_context.get('total_reps', 0)}, Recent Score={request.user_context.get('overall_score', 85)}%"
                system_prompt += ctx_summary

            openai_messages = [{"role": "system", "content": system_prompt}]
            for msg in request.messages:
                openai_messages.append({"role": msg.role, "content": msg.content})

            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "gpt-4o-mini",
                        "messages": openai_messages,
                        "temperature": 0.7,
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    answer = data["choices"][0]["message"]["content"]
                    return AssistantResponse(role="assistant", content=answer)
        except Exception as e:
            # Fall back to structured rules engine below if upstream times out
            pass

    # High-quality structured fallback engine based on biomechanics & training science
    last_query = request.messages[-1].content.lower() if request.messages else ""

    if "push-up" in last_query or "push up" in last_query or "отжиман" in last_query:
        answer = (
            "For optimal push-up biomechanics:\n\n"
            "1. **Hand Placement**: Position hands slightly wider than shoulder-width, fingers pointing forward or slightly outward.\n"
            "2. **Elbow Path**: Keep elbows tucked at approximately a 45-degree angle to your torso (avoid flaring them out to 90 degrees to protect shoulders).\n"
            "3. **Core & Hip Alignment**: Squeeze glutes and brace abdominals to maintain a rigid plank line without lower back sagging.\n"
            "4. **Depth**: Lower until your chest is approximately 2-3 inches from the floor (elbows at ~90 degrees), then press up to full elbow extension."
        )
    elif "squat" in last_query or "присед" in last_query or "отырып" in last_query:
        answer = (
            "For squat technique and range of motion:\n\n"
            "1. **Footing**: Set feet shoulder-width apart with toes flared 15-30 degrees outward.\n"
            "2. **Descent**: Initiate by hinging at the hips and bending knees simultaneously, keeping weight balanced across your whole foot.\n"
            "3. **Depth**: Descend until hip crease is level with or slightly below the top of the knee (sub-parallel, knee angle ~95-105°).\n"
            "4. **Knee Tracking**: Ensure knees track in line with your second and third toes without caving inward (valgus collapse)."
        )
    elif "eat" in last_query or "nutrition" in last_query or "protein" in last_query or "питан" in last_query or "тамақ" in last_query:
        answer = (
            "Post-workout nutrition guidelines:\n\n"
            "• **Protein**: Consume 20-35g of high-quality protein within 1-2 hours post-workout to stimulate muscle protein synthesis (e.g. chicken breast, eggs, whey, cottage cheese).\n"
            "• **Carbohydrates**: Pair with 30-50g of complex carbs (rice, oats, potatoes, or bananas) to replenish muscle glycogen stores.\n"
            "• **Hydration**: Drink 500-750ml of water with electrolytes to restore fluid balance."
        )
    elif "sleep" in last_query or "сон" in last_query or "ұйқы" in last_query:
        answer = (
            "Sleep and athletic recovery principles:\n\n"
            "• **Duration**: Aim for 7.5 to 9 hours of uninterrupted sleep for optimal growth hormone secretion and central nervous system recovery.\n"
            "• **Consistency**: Keep bedtime and wake-up times within a 30-minute window every day.\n"
            "• **Sleep Hygiene**: Maintain a dark, cool room (18-20°C) and avoid screens/bright blue light for 45 minutes prior to sleep."
        )
    else:
        answer = (
            "Hello! I am your SportX AI Fitness Assistant. I can analyze your exercise kinematics, suggest training set/rep schemes, "
            "evaluate muscle balance, and recommend nutrition and recovery strategies based on your workout history. "
            "How can I help you optimize your training today?"
        )

    return AssistantResponse(role="assistant", content=answer)
