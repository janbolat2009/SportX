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
        content: String(m.content || '').slice(0, 3000)
      }));
      chatMessages.push(...history);
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
      let errJson = null;
      try { errJson = JSON.parse(errBody); } catch {}
      console.error(`OpenAI API error (${openaiRes.status}):`, errBody);

      if (openaiRes.status === 401) {
        return res.status(401).json({
          error: 'Неверный API ключ OpenAI (Invalid API Key). Пожалуйста, проверьте переменную OPENAI_API_KEY в Vercel Dashboard.'
        });
      }

      if (openaiRes.status === 429) {
        const isQuota =
          errJson?.error?.code === 'insufficient_quota' ||
          errJson?.error?.type === 'insufficient_quota' ||
          errBody.includes('insufficient_quota') ||
          errBody.includes('exceeded your current quota');

        const queryText = message || (Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1].content : '');
        const fallbackAnswer = generateOfflineFitnessResponse(queryText);

        const notice = isQuota
          ? '⚠️ Внимание: Баланс вашего ключа OpenAI исчерпан ($0 / insufficient_quota). Пополните баланс на platform.openai.com/billing. Сейчас ответ сформирован встроенным биомеханическим движком SportX.'
          : '⚠️ Внимание: Превышен лимит запросов OpenAI API (Rate Limit). Ответ предоставлен автономным движком SportX.';

        return res.status(200).json({
          role: 'assistant',
          content: `${fallbackAnswer}\n\n---\n*${notice}*`,
          conversationId: conversationId || null,
          model: 'sportx-offline-knowledge'
        });
      }

      const queryText = message || (Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1].content : '');
      const fallbackAnswer = generateOfflineFitnessResponse(queryText);
      return res.status(200).json({
        role: 'assistant',
        content: `${fallbackAnswer}\n\n---\n*(Автономный режим SportX: OpenAI API вернул статус ${openaiRes.status})*`,
        conversationId: conversationId || null,
        model: 'sportx-offline-knowledge'
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
    const queryText = req.body?.message || '';
    const fallbackAnswer = generateOfflineFitnessResponse(queryText);
    return res.status(200).json({
      role: 'assistant',
      content: `${fallbackAnswer}\n\n---\n*(Автономный режим SportX)*`,
      conversationId: req.body?.conversationId || null,
      model: 'sportx-offline-knowledge'
    });
  }
}

function generateOfflineFitnessResponse(query) {
  const q = String(query || '').toLowerCase().trim();

  // Strict off-topic refusal
  const offTopics = ['python', 'javascript', 'html', 'code', 'math', 'calc', 'history', 'movie', 'game', 'president', 'war', 'crypto', 'bitcoin', 'song', 'joke'];
  if (offTopics.some(t => q.includes(t))) {
    return 'I can only help with exercise technique, training, workouts, and fitness-related questions.';
  }

  const isKk = q.includes('қалай') || q.includes('жаттығу') || q.includes('неше') || q.includes('бұлшық') || q.includes('тамақ');
  const isRu = /[а-яё]/i.test(q) && !isKk;

  if (q.includes('присед') || q.includes('squat') || q.includes('отырып')) {
    if (isKk) {
      return `**Отырып-тұру (Squat) дұрыс биомеханикасы:**
1. **Бастапқы қалып:** Аяқты иық еніне қойып, башайларды 15-30° сыртқа бағыттаңыз.
2. **Қозғалыс:** Терең дем алып, жамбасты артқа және тізені бірге бүгіңіз.
3. **Тереңдік:** Жамбас тізеден сәл төмен немесе параллель түсуі керек (~90-100°).
4. **Тізе бағыты:** Тізелерді ішке құлатпай, башайлардың сызығымен ұстаңыз.
5. **Көтерілу:** Толық табанмен еденді итеріп, дем шығарып бастапқы қалыпқа келіңіз.`;
    }
    if (isRu) {
      return `**Биомеханика идеальных приседаний (Squat):**
1. **Исходное положение:** Стопы на ширине плеч, носки развернуты наружу на 15–30°.
2. **Движение:** На вдохе напрягите мышцы кора, одновременно сгибайте тазобедренные и коленные суставы.
3. **Глубина:** Опускайтесь до параллели бедра с полом (угол в коленях 90–100°), удерживая нейтральный прогиб в пояснице.
4. **Колени:** Направляйте строго по линии носков, не допуская завала внутрь (вальгуса).
5. **Подъем:** Мощно толкайтесь всей плоскостью стопы, выдыхая в верхней трети движения.`;
    }
    return `**Squat Biomechanics & Technique:**
1. **Stance:** Feet shoulder-width apart, toes flared 15-30°.
2. **Descent:** Inhale, brace core, hinge at hips and knees simultaneously.
3. **Depth:** Reach at least parallel (femur parallel to ground, ~90-100° knee flexion).
4. **Knee Alignment:** Track knees in line with toes, preventing valgus collapse.
5. **Ascent:** Drive through midfoot and heel to return to standing lockout.`;
  }

  if (q.includes('отжиман') || q.includes('push') || q.includes('сығылу')) {
    if (isKk) {
      return `**Еденнен сығылу (Push-Up) техникасы:**
1. **Қол қойылымы:** Қолдарды иықтан сәл кеңірек қойып, саусақтарды алға қаратыңыз.
2. **Шынтақ бұрышы:** Шынтақты денеге 45° бұрышта ұстаңыз (90° жаймаңыз).
3. **Дене сызығы:** Пресс пен бөксе бұлшықеттерін қатайтып, денені түп-түзу ұстаңыз.
4. **Тереңдік:** Кеудені еденге 3-5 см жеткізбей түсіріп, дем шығара жоғары итеріңіз.`;
    }
    if (isRu) {
      return `**Техника классических отжиманий (Push-Up):**
1. **Постановка рук:** Чуть шире плеч, пальцы направлены вперед или слегка разведены.
2. **Траектория локтей:** Локти держите под углом 45° к корпусу (стреловидная позиция, не 90°).
3. **Корпус:** Держите прямую линию от макушки до пяток, пресс и ягодицы напряжены.
4. **Глубина:** Опускайтесь до расстояния 3–5 см от пола, затем мощно выжимайте себя вверх на выдохе.`;
    }
    return `**Push-Up Biomechanics:**
1. **Hand Placement:** Slightly wider than shoulder-width, fingers pointing forward.
2. **Elbow Path:** Keep elbows at a ~45° angle to your torso (arrow shape).
3. **Core Tension:** Maintain a rigid straight line from head to heels.
4. **Depth:** Lower until chest is 2-3 inches above the floor, then press to full lockout.`;
  }

  if (q.includes('питан') || q.includes('белок') || q.includes('nutrition') || q.includes('protein') || q.includes('тамақ')) {
    if (isKk) {
      return `**Спорттық тамақтану және ақуыз қабылдау негіздері:**
1. **Ақуыз нормасы:** Бұлшықет өсіру мен қалпына келу үшін тәулігіне дене салмағының 1 кг-на 1.6–2.2 г ақуыз қажет.
2. **Жаттығудан кейін:** Жаттығу аяқталған соң 1–2 сағат ішінде 25–35 г ақуыз және күрделі көмірсулар қабылдаған жөн.
3. **Су режимі:** Жаттығу кезінде әр 15-20 минут сайын 150-200 мл су ішіңіз.`;
    }
    if (isRu) {
      return `**Основы спортивного питания и восстановления:**
1. **Суточная норма белка:** Для набора мышечной массы и восстановления требуется 1.6–2.2 г белка на 1 кг массы тела в день.
2. **Тайминг после тренировки:** В течение 1–2 часов после тренировки примите 25–35 г качественного белка и порцию сложных углеводов для восполнения гликогена.
3. **Гидратация:** Пейте по 150–250 мл воды каждые 15–20 минут активной тренировки.`;
    }
    return `**Sports Nutrition & Protein Timing:**
1. **Protein Intake:** Aim for 1.6–2.2g of protein per kg of bodyweight daily for optimal muscle protein synthesis.
2. **Post-Workout Window:** Consume 25-35g of complete protein with complex carbohydrates within 1-2 hours after training.
3. **Hydration:** Drink 150-250ml of water every 15-20 minutes during training sessions.`;
  }

  if (isKk) {
    return `**SportX AI Бапкері көмектесуге дайын!**
Мен сізге мына сұрақтар бойынша көмектесе аламын:
- Кез келген жаттығудың биомеханикасы мен дұрыс орындалу техникасы;
- Қайталаулар, тәсілдер (подходтар) мен демалыс уақыты;
- Қыздырыну (разминка), созылу және бұлшықетті қалпына келтіру;
- Спорттық тамақтану және ұйқы режимі.

Қандай жаттығу немесе тақырып бойынша кеңес алғыңыз келеді?`;
  }

  if (isRu) {
    return `**Спортивный ИИ-ассистент SportX готов помочь!**
Я специализируюсь на биомеханике и тренировочном процессе:
- Разбор правильной техники любых упражнений (приседания, жимы, тяги, планки и др.);
- Подбор подходов, повторений, темпа и периодов отдыха;
- Программы разминки, мобильности и заминки;
- Спортивное питание, расчет белка и оптимизация сна.

Задайте вопрос по конкретному упражнению или вашей цели!`;
  }

  return `**SportX AI Fitness Assistant is ready to assist!**
I can help you with:
- Biomechanical form cues and technique corrections for any movement;
- Training programming, sets, reps, tempo, and rest intervals;
- Dynamic warm-ups, mobility, and post-workout recovery;
- Sports nutrition, protein timing, and sleep optimization.

What exercise or fitness goal would you like to discuss?`;
}
