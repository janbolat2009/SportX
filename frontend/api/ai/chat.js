// Vercel Serverless Function: POST /api/ai/chat
// Secure server-side OpenAI proxy for SportX II Fitness Assistant

const SPORTX_SYSTEM_PROMPT = `You are the SportX AI Fitness & Biomechanics Assistant, an elite artificial intelligence coach specialized exclusively in exercise technique, athletic biomechanics, strength training, workout recovery, sports nutrition, sets, reps, mobility, and sleep optimization.

ALLOWED TOPICS (ONLY answer these):
1. Exercise technique and movement mechanics (squat depth, push-up hand width, bench press bar path, bicep curl elbow drift, shoulder press lockout, etc.).
2. Workout programming, sets, reps, tempo, rest periods, progressive overload, and training splits.
3. Strength training, cardiovascular conditioning, mobility drills, warm-ups, and cool-downs.
4. Sports nutrition (macronutrients, protein intake timing, hydration, meal planning for training).
5. Sleep and athletic recovery optimization.
6. SportX platform features and biomechanical computer-vision metrics (ROM, symmetry, stability).

STRICT OFF-TOPIC REFUSAL RULE:
You must strictly refuse any question unrelated to fitness, workouts, training, exercises, nutrition, sleep, or biomechanics.
If the user asks about anything off-topic (e.g. coding, math, general science, politics, news, religion, homework, movies, gaming, entertainment, finance, business, general chit-chat):
You MUST IMMEDIATELY respond with ONLY this exact brief sentence:
"i can only help with exercise technique, training, workouts, and fitness-related questions."
Do NOT answer the question. Do NOT apologize. Do NOT elaborate.

MULTILINGUAL SUPPORT:
Respond in the language of the user's message (English, Russian, or Kazakh). Ensure natural, professional terminology for all three languages.

SAFETY & MEDICAL BOUNDARIES:
- Never provide clinical or medical diagnoses for injuries, pathologies, or pain.
- Always recommend consulting a qualified physician or physical therapist for acute or chronic pain.
- Keep explanations evidence-based, concise, practical, and encouraging.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json( { error: `Method ${req.method} Not Allowed` });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    console.error('OPENAI_API_KEY is not configured on the server.');
    return res.status(500).json({
      error: 'OpenAI API key is not configured on the server. Please set the OPENAI_API_KEY environment variable in your Vercel Dashboard.'
    });
  }

  try {
    const { message, messages, conversationId, user_context } = req.body || {};

    if (!message && (!messages || messages.length === 0)) {
      return res.status(400).json({ error: 'Message or messages array is required.' });
    }

    const chatMessages = [
      { role: 'system', content: SPORTX_SYSTEM_PROMPT }
    ];

    if (user_context) {
      chatMessages.push({
        role: 'system',
        content: `User Context: Sport: ${user_context.sport || 'Fitness'}, Level: ${user_context.training_level || 'Intermediate'}, Goal: ${user_context.fitness_goal || 'General Fitness'}`
      });
    }

    if (Array.isArray(messages) && messages.length > 0) {
      const history = messages.slice(-10).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || '%).slice(0, 3000)
      }));
      chatMessages.push(.history);
    } else if (message) {
      chatMessages.push({
        role: 'user',
        content: String(message).slice(0, 3000)
      });
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: model,
        messages: chatMessages,
        temperature: 0.5,
        max_tokens: 800
      })
    });

    if (!openaiRes.ok) {
      const errBody = await openaiRes.text();
      console.error('OpenAI API error (' + openaiRes.status + '):', errBody);

      if (openaiRes.status === 401) {
        return res.status(401).json({ error: 'Invalid OpenAI API key. Please check the server configuration.' });
      }
      if (openaiRes.status === 429) {
        return res.status(429).json({ error: 'OpenAI rate limit exceeded. Please wait a moment and try again.' });
      }
      return res.status(openaiRes.status).json({
        error: 'OpenAI API returned status ' + openaiRes.status + '.'
      });
    }

    const data = await openaiRes.json();
    const assistantContent = data.choices?.[0]?.message?.content || 'I can only help with exercise technique, training, workouts, and fitness-related questions.';

    return res.status(200).json({
      role: 'assistant',
      content: assistantContent,
      conversationId: conversationId || null,
      model: model
    });

  } catch (error) {
    console.error('Server error processing AI chat:', error);
    return res.status(500).json({
      error: 'An internal server error occurred while processing the AI request.'
    });
  }
}
