// Vercel Serverless Function: POST /api/ai/chat
// Secure server-side Google Gemini proxy for SportX AI Fitness Assistant

const SPORTX_SYSTEM_PROMPT = `You are the SportX AI Fitness & Biomechanics Coach.
You provide direct, motivating, expert guidance to athletes on exercise technique, biomechanics, workout programming, sports nutrition, and recovery.

CRITICAL INSTRUCTIONS:
1. DIRECT RESPONSE: Provide your final, practical response directly to the user immediately.
2. NO REASONING OR SCRATCHPAD: Do NOT output internal reasoning, planning steps, drafts, outlines, bulleted checklists, or metadata tags.
3. STRICT LANGUAGE MATCH: Reply in the EXACT same language the user wrote in:
   - Russian -> Natural, fluent Russian.
   - Kazakh -> Natural, fluent Kazakh.
   - English -> Natural, fluent English.
4. SCOPE: Focus strictly on fitness, exercise technique, athletic biomechanics, workouts, and sports nutrition.`;

function sanitizeAIResponse(rawText) {
  if (!rawText) return '';
  let text = String(rawText).trim();

  // 1. Remove XML/HTML thought tags
  text = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
  text = text.replace(/```thought[\s\S]*?```/gi, '');

  // 2. Strip planning / reasoning scratchpad blocks if model leaks them
  const scratchpadEndRegex = /^[\s\S]*?(?:Language:\s*(?:Russian|Kazakh|English|RU|KK|EN)[\.\s]*|Check against constraints[^\n]*[\.\s]*|Ensure tone is[^\n]*[\.\s]*)(?=[А-ЯӘІҢҒҮҰҚӨҺA-Z0-9#\n])/i;
  if (scratchpadEndRegex.test(text)) {
    text = text.replace(scratchpadEndRegex, '');
  }

  // 3. Strip leading bulleted reasoning lists
  text = text.replace(/^(?:\s*[\*\-]\s*(?:User says:|Topic:|Target Persona:|Greeting:|Key Biomechanical|Setup:|Grip:|Bar Path:|Execution:|Safety:|Common Mistakes:|Closing:|Introduction:)[^\n]*\n*)+/gim, '');

  // 4. Strip any leading translated query echoes
  text = text.replace(/^[^\n]*\([A-Za-z\s,!'\?]+\)\.\s*\n+/i, '');

  return text.trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json( { error: `Method ${req.method} Not Allowed` });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    console.error('GEMINI_API_KEY is not configured on the server.');
    return res.status(500).json({
      error: 'Google Gemini API key is not configured on the server. Please set the GEMINI_API_KEY environment variable in your Vercel Dashboard.'
    });
  }

  try {
    const { message, messages, conversationId, user_context } = req.body || {};

    if (!message && (!messages || messages.length === 0)) {
      return res.status(400).json({ error: 'Message or messages array is required.' });
    }

    let systemContent = SPORTX_SYSTEM_PROMPT;
    if (user_context) {
      systemContent += `\n\nATHLETE CONTEXT:\n- Sport: ${user_context.sport || 'Fitness'}\n- Training Level: ${user_context.training_level || 'Intermediate'}\n- Goal: ${user_context.fitness_goal || 'General Fitness'}`;
      if (user_context.overall_score) systemContent += `\n- Recent Technique Score: ${user_context.overall_score}%`;
      if (user_context.recent_issues) systemContent += `\n- Recent Detected Flaws: ${user_context.recent_issues}`;
    }

    const geminiContents = [];
    if (Array.isArray(messages) && messages.length > 0) {
      const history = messages.slice(-10).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: sanitizeAIResponse(String(m.content || '')).slice(0, 3000) }]
      }));
      geminiContents.push(...history);
    } else if (message) {
      geminiContents.push({
        role: 'user',
        parts: [{ text: String(message).slice(0, 3000) }]
      });
    }

    // Sanitize configured model
    let configuredModel = (process.env.GEMINI_MODEL || 'gemini-1.5-flash').trim().replace(/^models\//, '');
    
    // Prioritized candidate list
    const candidateModels = [
      { name: configuredModel, apiVersion: 'v1beta' },
      { name: 'gemini-2.0-flash', apiVersion: 'v1beta' },
      { name: 'gemini-1.5-flash', apiVersion: 'v1beta' },
      { name: 'gemini-1.5-flash-latest', apiVersion: 'v1beta' },
      { name: 'gemini-1.5-flash-002', apiVersion: 'v1beta' },
      { name: 'gemini-1.5-flash-001', apiVersion: 'v1beta' },
      { name: 'gemini-1.5-flash-8b', apiVersion: 'v1beta' },
      { name: 'gemini-1.5-pro', apiVersion: 'v1beta' },
      { name: 'gemini-1.5-pro-002', apiVersion: 'v1beta' },
      { name: 'gemini-pro', apiVersion: 'v1' },
      { name: 'gemini-1.0-pro', apiVersion: 'v1' }
    ];

    let geminiRes = null;
    let lastErrBody = '';
    let usedModel = configuredModel;

    // Helper to attempt generateContent on a specific model and API version
    async function attemptGenerate(targetModel, apiVer) {
      const isLegacy = targetModel.includes('gemini-1.0') || targetModel === 'gemini-pro';
      let payloadObj;

      const genConfig = {
        temperature: 0.3,
        maxOutputTokens: 1000,
        thinkingConfig: { thinkingBudget: 0 },
        thinking_config: { thinking_budget: 0 }
      };

      if (isLegacy) {
        // Legacy models expect system instruction as first user message
        payloadObj = {
          contents: [
            { role: 'user', parts: [{ text: `System Instruction:\n${systemContent}\n\nPlease acknowledge and follow these instructions.` }] },
            { role: 'model', parts: [{ text: 'Understood. I will act strictly as the SportX Biomechanical AI Coach.' }] },
            ...geminiContents
          ],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1000 }
        };
      } else {
        payloadObj = {
          system_instruction: { parts: [{ text: systemContent }] },
          contents: geminiContents,
          generationConfig: genConfig
        };
      }

      const url = `https://generativelanguage.googleapis.com/${apiVer}/models/${encodeURIComponent(targetModel)}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
      return await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadObj)
      });
    }

    // 1. Try candidates in order
    for (const item of candidateModels) {
      try {
        geminiRes = await attemptGenerate(item.name, item.apiVersion);
        if (geminiRes.ok) {
          usedModel = item.name;
          break;
        }

        lastErrBody = await geminiRes.text();
        console.warn(`Gemini API attempt (${item.apiVersion}/${item.name}) failed (${geminiRes.status}):`, lastErrBody);

        // If status is 401, 403, 429, switching models won't help
        if (geminiRes.status === 401 || geminiRes.status === 403 || geminiRes.status === 429) {
          break;
        }
      } catch (networkErr) {
        console.error(`Network error on ${item.name}:`, networkErr);
      }
    }

    // 2. If candidates returned 404, query ListModels directly to discover available models on this key
    if ((!geminiRes || geminiRes.status === 404) && geminiRes?.status !== 401 && geminiRes?.status !== 403) {
      try {
        console.info('Attempting dynamic model discovery via ListModels...');
        const listEndpoints = [
          'https://generativelanguage.googleapis.com/v1beta/models',
          'https://generativelanguage.googleapis.com/v1/models'
        ];

        for (const listEp of listEndpoints) {
          const listRes = await fetch(`${listEp}?key=${encodeURIComponent(apiKey.trim())}`);
          if (listRes.ok) {
            const listData = await listRes.json();
            const available = (listData.models || [])
              .filter((m) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
              .map((m) => (m.name || '').replace(/^models\//, ''));

            const apiVer = listEp.includes('v1beta') ? 'v1beta' : 'v1';

            for (const discoveredModel of available) {
              const res = await attemptGenerate(discoveredModel, apiVer);
              if (res.ok) {
                geminiRes = res;
                usedModel = discoveredModel;
                break;
              }
            }
          }
          if (geminiRes && geminiRes.ok) break;
        }
      } catch (listErr) {
        console.warn('Model discovery failed:', listErr);
      }
    }

    if (!geminiRes || !geminiRes.ok) {
      let googleErrorMsg = '';
      try {
        const parsed = JSON.parse(lastErrBody);
        googleErrorMsg = parsed?.error?.message || '';
      } catch (e) {
        googleErrorMsg = (lastErrBody || '').slice(0, 150);
      }

      if (geminiRes?.status === 401 || geminiRes?.status === 403) {
        return res.status(geminiRes.status).json({
          error: `Неверный API ключ Gemini (Invalid API Key): ${googleErrorMsg || 'Проверьте переменную GEMINI_API_KEY в Vercel Dashboard.'}`
        });
      }

      if (geminiRes?.status === 429) {
        const queryText = message || (Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1].content : '');
        const fallbackAnswer = generateOfflineFitnessResponse(queryText);

        return res.status(200).json({
          role: 'assistant',
          content: `${fallbackAnswer}\n\n---\n*⚠️ Превышен лимит запросов Gemini API (Rate Limit). Ответ предоставлен встроенным биомеханическим движком SportX.*`,
          conversationId: conversationId || null,
          model: 'sportx-offline-knowledge'
        });
      }

      const queryText = message || (Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1].content : '');
      const fallbackAnswer = generateOfflineFitnessResponse(queryText);
      const detailSuffix = googleErrorMsg ? ` — ${googleErrorMsg}` : '';
      return res.status(200).json({
        role: 'assistant',
        content: `${fallbackAnswer}\n\n---\n*(Автономный режим SportX: Gemini API статус ${geminiRes ? geminiRes.status : 'Network Error'}${detailSuffix})*`,
        conversationId: conversationId || null,
        model: 'sportx-offline-knowledge'
      });
    }

    const data = await geminiRes.json();
    const candidateParts = (data.candidates?.[0]?.content?.parts || []).filter((p) => !p.thought);
    const rawContent = candidateParts.map((p) => p.text || '').join('').trim() || 'I can only help with exercise technique, training, workouts, and fitness-related questions.';
    const assistantContent = sanitizeAIResponse(rawContent);

    return res.status(200).json({
      role: 'assistant',
      content: assistantContent,
      conversationId: conversationId || null,
      model: usedModel
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

  const isKk = q.includes('қалай') || q.includes('жаттығу') || q.includes('неше') || q.includes('бұлшық') || q.includes('тамақ') || q.includes('сәлем') || q.includes('қалайсың');
  const isRu = /[а-яё]/i.test(q) && !isKk;

  // 1. Greetings & Casual Status
  if (q === 'привет' || q === 'здравствуйте' || q === 'хай' || q === 'салам' || q.includes('добрый день') || q.includes('добрый вечер')) {
    if (isKk) return 'Сәлем! Мен SportX жасанды интеллект бапкерімін. Бүгін қандай жаттығу техникасын, жаттығу жоспарын немесе тамақтануды талқылаймыз?';
    return 'Привет! Я спортивный ИИ-ассистент SportX. Готов разобрать биомеханику упражнений, подобрать нагрузку или составить рекомендации по питанию. Какой вопрос разберем сегодня?';
  }

  if (q.includes('как дела') || q.includes('как ты') || q.includes('қалайсың') || q.includes('how are you')) {
    if (isKk) return 'Керемет! Жаттығуға толық дайынмын. Сізге қандай жаттығу немесе бағдарлама бойынша көмек қажет?';
    return 'Отлично, готов к продуктивной тренировке! Могу подсказать по технике любого упражнения, составить тренировочный сплит или рассчитать норму белка. О чем хотите узнать?';
  }

  // 2. Squats
  if (q.includes('присед') || q.includes('squat') || q.includes('отырып')) {
    if (isKk) {
      return `**Отырып-тұру (Squat) дұрыс биомеханикасы:**
1. **Бастапқы қалып:** Аяқты иық еніне қойып, башайларды 15-30° сыртқа бағыттаңыз.
2. **Қозғалыс:** Терең дем алып, жамбасты артқа және тізені бірге бүгіңіз.
3. **Тереңдік:** Жамбас тізеден сәл төмен немесе параллель түсуі керек (~90-100°).
4. **Тізе бағыты:** Тізелерді ішке құлатпай, башайлардың сызығымен ұстаңыз.
5. **Көтерілу:** Толық табанмен еденді итеріп, дем шығарып бастапқы қалыпқа келіңіз.
*Кеңес:* Бұлшықет өсіру үшін 3-4 тәсіл (подход), 8-12 қайталау жасаңыз.`;
    }
    if (isRu) {
      return `**Биомеханика идеальных приседаний (Squat):**
1. **Исходное положение:** Стопы на ширине плеч, носки развернуты наружу на 15–30°.
2. **Движение:** На вдохе напрягите мышцы кора, одновременно сгибайте тазобедренные и коленные суставы.
3. **Глубина:** Опускайтесь до параллели бедра с полом (угол в коленях 90–100°), удерживая нейтральный прогиб в пояснице.
4. **Колени:** Направляйте строго по линии носков, не допуская завала внутрь (вальгуса).
5. **Подъем:** Мощно толкайтесь всей плоскостью стопы, выдыхая в верхней трети движения.
*Рекомендуемый объем:* 3–4 подхода по 8–12 повторений с отдыхом 90–120 секунд.`;
    }
    return `**Squat Biomechanics & Technique:**
1. **Stance:** Feet shoulder-width apart, toes flared 15-30°.
2. **Descent:** Inhale, brace core, hinge at hips and knees simultaneously.
3. **Depth:** Reach at least parallel (femur parallel to ground, ~90-100° knee flexion).
4. **Knee Alignment:** Track knees in line with toes, preventing valgus collapse.
5. **Ascent:** Drive through midfoot and heel to return to standing lockout.`;
  }

  // 3. Push-ups
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
1. **Постановка рук:** Чуть шире плеч, пальцы направлены вперед.
2. **Траектория локтей:** Локти держите под углом 45° к корпусу (стреловидная позиция, не разводите на 90°).
3. **Корпус:** Держите прямую линию от макушки до пяток, пресс и ягодицы напряжены.
4. **Глубина:** Опускайтесь до расстояния 3–5 см от пола, затем мощно выжимайте себя вверх на выдохе.
*Режим:* 3–4 подхода до отказа или по 12–20 повторений.`;
    }
    return `**Push-Up Biomechanics:**
1. **Hand Placement:** Slightly wider than shoulder-width, fingers pointing forward.
2. **Elbow Path:** Keep elbows at a ~45° angle to your torso.
3. **Core Tension:** Maintain a rigid straight line from head to heels.
4. **Depth:** Lower until chest is 2-3 inches above the floor, then press to full lockout.`;
  }

  // 4. Pull-ups
  if (q.includes('подтягиван') || q.includes('турник') || q.includes('pull') || q.includes('тартылу')) {
    if (isKk) {
      return `**Турникке тартылу (Pull-Up) техникасы:**
1. **Ұстау:** Иықтан сәл кеңірек үстінен ұстаңыз (пронация).
2. **Бастау:** Қозғалысты иықты төмен түсіріп, жауырынды жиюдан бастаңыз.
3. **Тарту:** Кеудеңізді турникке қарай бағыттап, шынтақты төмен тартыңыз.
4. **Фиксация:** Иегіңіз турник деңгейінен асқанда 1 секунд кідіріп, баяу төмен түсіңіз.`;
    }
    if (isRu) {
      return `**Биомеханика подтягиваний на турнике (Pull-Up):**
1. **Хват:** Чуть шире плеч прямым хватом (ладони от себя).
2. **Инициация движения:** Начните с депрессии и ретракции лопаток (опустите и сведите лопатки), а не с простого сгибания рук.
3. **Тяга:** Направляйте грудь к перекладине, ведя локти вниз и к корпусу.
4. **Верхняя точка:** Подбородок выше перекладины, без раскачки (киппинга). Опускайтесь подконтрольно за 2–3 секунды.
*Режим:* 3–4 подхода по 6–10 чистых повторений.`;
    }
    return `**Pull-Up Technique:**
1. **Grip:** Slightly wider than shoulder-width, overhand grip.
2. **Scapular Engagement:** Initiate by depressing and retracting scapulae before elbow flexion.
3. **Pull:** Drive elbows down and back toward your ribcage, bringing upper chest to the bar.
4. **Control:** Avoid swinging; lower under control for 2-3 seconds.`;
  }

  // 5. Biceps
  if (q.includes('бицепс') || q.includes('curl') || q.includes('қол бүгу')) {
    if (isKk) {
      return `**Бицепске арналған жаттығу техникасы:**
1. **Қолдың тұрақтылығы:** Шынтақты денеге жақын бекітіңіз, алға немесе артқа жылжытпаңыз.
2. **Қозғалыс:** Шынтақ буынынан ғана бүгіп, гантельді жоғары көтеріңіз.
3. **Супинация:** Жоғары көтерілгенде білекті сыртқа қарай бұрыңыз (супинация).
4. **Түсіру:** Салмақты 2-3 секунд баяу түсіріп, бұлшықетті бақылауда ұстаңыз.`;
    }
    if (isRu) {
      return `**Идеальная техника сгибаний на бицепс:**
1. **Фиксация локтей:** Прижмите локти к бокам корпуса и не выводите их вперед при подъеме (избегайте читинга).
2. **Амплитуда:** Сгибайте предплечье до пикового сокращения бицепса, не помогая корпусом.
3. **Супинация:** При подъеме гантелей разворачивайте кисть мизинцем наружу в верхней точке.
4. **Эксцентрика:** Опускайте вес медленно (2–3 секунды) для максимального микротравмирования волокон.
*Режим:* 3 подхода по 10–12 повторений с весом 70% от 1ПМ.`;
    }
    return `**Bicep Curl Biomechanics:**
1. **Elbow Stability:** Lock elbows at your sides; avoid forward drift.
2. **Supination:** Rotate wrists outward as you curl for peak peak activation.
3. **Tempo:** 1s concentric contraction, 2-3s controlled eccentric lowering.`;
  }

  // 6. Bench Press / Chest
  if (q.includes('жим') || q.includes('грудь') || q.includes('bench') || q.includes('кеуде')) {
    if (isKk) {
      return `**Жатқан күйде штанга/гантель сығу (Bench Press):**
1. **Нүктелер:** Бас, жауырын және бөксе орындықта, ал табан еденге нық басылған болуы керек.
2. **Жауырын:** Жауырынды артқа жиып, кеудені алға көтеріңіз.
3. **Түсіру:** Штанганы кеуденің ортасына (емшек сызығына) баяу түсіріңіз.
4. **Шынтақ:** Шынтақты денеге 45–60° бұрышта ұстаңыз, 90° жаймаңыз.`;
    }
    if (isRu) {
      return `**Техника жима штанги лежа (Bench Press):**
1. **Точки опоры:** Затылок, сведенные лопатки и ягодицы плотно на скамье, стопы жестко упираются в пол.
2. **Арка и лопатки:** Сведите лопатки вместе и опустите вниз (депрессия лопаток) для стабилизации плечевых суставов.
3. **Траектория грифа:** Опускайте гриф на нижнюю часть груди (по дуге), локти под углом 45–60° к корпусу.
4. **Выжим:** Толкайте гриф вверх и чуть назад (к линии глаз), выдыхая после прохождения мертвой точки.`;
    }
    return `**Bench Press Biomechanics:**
1. **Setup:** Retract and depress scapulae, plant feet firmly.
2. **Bar Path:** Lower bar to mid/lower sternum in a slight diagonal arc.
3. **Elbow Angle:** Keep elbows at 45-60° relative to torso.
4. **Press:** Drive through legs and press bar up and slightly back toward eye line.`;
  }

  // 7. Training Program / Split
  if (q.includes('программ') || q.includes('план') || q.includes('сплит') || q.includes('бағдарлама') || q.includes('split') || q.includes('routine')) {
    if (isKk) {
      return `**Апталық тиімді жаттығу бағдарламасы (Full Body 3 күн):**

**Дүйсенбі (А Күні):**
- Отырып-тұру (Squat): 3 подход x 8-10 рет
- Жатқан күйде сығу (Bench Press): 3 x 8-10
- Турникке тартылу (Pull-ups): 3 x 6-10
- Планка: 3 x 45 сек

**Сәрсенбі (В Күні):**
- Тік тұрып көтеру (Deadlift): 3 x 6-8
- Иықтан тік сығу (Overhead Press): 3 x 8-10
- Гантельмен махи: 3 x 12-15
- Бицепс / Трицепс: 3 x 12

**Жұма (А Күні қайталау немесе жаңа басымдық):**
- Выпады (Өкшелеп отыру): 3 x 10 әр аяққа
- Еденнен сығылу: 3 x 15-20
- Блоктағы тартылу: 3 x 10-12
- Пресс: 3 x 15`;
    }
    if (isRu) {
      return `**Оптимальная тренировочная программа на 3 дня (Full-Body / Full Split):**

**Понедельник (День A — Сила & База):**
1. Приседания со штангой / гантелями: 3–4 подхода × 8–10 повторений (отдых 2 мин)
2. Жим лежа / отжимания с весом: 3–4 подхода × 8–10 повторений
3. Подтягивания / тяга штанги в наклоне: 3–4 подхода × 8–10 повторений
4. Планка на локтях: 3 подхода × 45–60 секунд

**Среда (День B — Плечи & Задняя цепь):**
1. Румынская / Становая тяга: 3 подхода × 6–8 повторений (отдых 2.5 мин)
2. Армейский жим стоя: 3–4 подхода × 8–10 повторений
3. Выпады с гантелями: 3 подхода × 10–12 повторений на ногу
4. Сгибания на бицепс + Французский жим: 3 подхода × 12 повторений

**Пятница (День C — Объем & Гипертрофия):**
1. Жим ногами / Гоблет-присед: 3–4 подхода × 10–12 повторений
2. Жим гантелей под углом 30°: 3–4 подхода × 10–12 повторений
3. Горизонтальная тяга блока к поясу: 3–4 подхода × 10–12 повторений
4. Махи гантелями в стороны + Пресс: 3 подхода × 15 повторений`;
    }
    return `**Science-Backed 3-Day Full-Body Workout Routine:**
- **Day A:** Squats (3x8-10), Bench Press (3x8-10), Pull-ups (3x8-10), Plank (3x60s).
- **Day B:** Deadlift (3x6-8), Overhead Press (3x8-10), Walking Lunges (3x10/leg), Bicep/Tricep superset (3x12).
- **Day C:** Incline DB Press (3x10-12), Cable Row (3x10-12), Leg Press (3x10-12), Lateral Raises (3x15).`;
  }

  // 8. Nutrition & Protein
  if (q.includes('питан') || q.includes('белок') || q.includes('nutrition') || q.includes('protein') || q.includes('тамақ') || q.includes('калори')) {
    if (isKk) {
      return `**Спорттық тамақтану және ақуыз қабылдау негіздері:**
1. **Ақуыз нормасы:** Бұлшықет өсіру мен қалпына келу үшін тәулігіне дене салмағының 1 кг-на 1.6–2.2 г ақуыз қажет.
2. **Жаттығудан кейін:** Жаттығу аяқталған соң 1–2 сағат ішінде 25–35 г ақуыз және күрделі көмірсулар қабылдаған жөн.
3. **Су режимі:** Жаттығу кезінде әр 15-20 минут сайын 150-200 мл су ішіңіз.`;
    }
    if (isRu) {
      return `**Основы спортивного питания и восстановления:**
1. **Суточная норма белка:** Для набора мышечной массы и восстановления требуется 1.6–2.2 г белка на 1 кг массы тела в день (куриная грудка, яйца, творог, рыба, сывороточный протеин).
2. **Углеводы:** 3–5 г на 1 кг веса (сложные углеводы: овсянка, рис, гречка, макароны твердых сортов).
3. **Жиры:** 0.8–1.0 г на 1 кг веса (орехи, оливковое масло, жирная рыба, авокадо).
4. **Тайминг:** Равномерно распределяйте белок на 3–4 приема пищи (по 25–40 г белка за прием) для поддержания синтеза мышечного белка.
5. **Гидратация:** 30–40 мл воды на 1 кг массы тела ежедневно.`;
    }
    return `**Sports Nutrition Guidelines:**
1. **Protein:** 1.6-2.2g per kg bodyweight daily.
2. **Carbohydrates:** 3-5g per kg for high-intensity training energy.
3. **Fats:** 0.8-1.0g per kg for hormonal health.
4. **Distribution:** 25-40g protein every 3-4 hours to maximize muscle protein synthesis.`;
  }

  // 9. Creatine & Supplements
  if (q.includes('креатин') || q.includes('creatine') || q.includes('добавк') || q.includes('бцаа') || q.includes('bcaa')) {
    if (isKk) {
      return `**Креатин моногидраты бойынша нұсқаулық:**
1. **Мөлшері:** Күн сайын 3-5 грамм қабылдау жеткілікті («загрузка» жасау міндетті емес).
2. **Уақыты:** Жаттығудан кейін сумен немесе шырынмен ішкен ең тиімді.
3. **Әсері:** Күш көрсеткіштерін 10-15%-ға арттырады және бұлшықетте суды ұстап, көлем береді.`;
    }
    if (isRu) {
      return `**Гид по приему Креатина Моногидрата (наиболее изученная добавка):**
1. **Дозировка:** 3–5 грамм ежедневно в одно и то же время. Фаза загрузки (по 20 г в день) не обязательна — накопительный эффект достигается за 3–4 недели стандартного приема.
2. **Время приема:** В дни тренировок — сразу после тренировки вместе с белком и углеводами (инсулин улучшает транспорт креатина в мышцы). В дни отдыха — утром с приемом пищи.
3. **Водный баланс:** Пейте на 500 мл больше воды в день, так как креатин задерживает внутриклеточную воду в саркоплазме мышц.
4. **Результат:** Рост силовой выносливости на 10–15% и ускорение восстановления АТФ между подходами.`;
    }
    return `**Creatine Monohydrate Guidelines:**
- **Dose:** 3-5 grams daily consistently. No loading phase needed.
- **Timing:** Post-workout with carbohydrates and protein for optimal uptake.
- **Benefits:** Increases phosphocreatine stores, boosting ATP regeneration, power output, and training volume.`;
  }

  // Default localized responses
  if (isKk) {
    return `**SportX AI Бапкері көмектесуге дайын!**
Мен мына тақырыптар бойынша толық жауап бере аламын:
- **Жаттығу техникасы:** Отырып-тұру, еденнен сығылу, турникке тартылу, жим, становая тяга, планка және т.б.
- **Жаттығу жоспары:** 3 күндік немесе 4 күндік сплит, қайталау және подход саны;
- **Тамақтану және қоспалар:** Ақуыз нормасы, креатин, салмақ қосу немесе арықтау;
- **Қалпына келу:** Ұйқы сапасы және бұлшықет ауырсынуын басу.

Қай тақырыпты толығырақ талқылаймыз?`;
  }

  if (isRu) {
    return `**Спортивный ИИ-ассистент SportX готов помочь!**
Я могу подробно разобрать любую тему тренировочного процесса:
- **Биомеханика и техника:** Приседания, отжимания, подтягивания, жим лежа, становая тяга, планки, выпады, плечи, бицепс;
- **Программирование:** Составление тренировочных сплитов, прогрессивная перегрузка, подходы и повторения;
- **Спортивное питание:** Расчет белков, жиров, углеводов, тайминг приемов пищи, креатин и спортивные добавки;
- **Восстановление:** Качественный сон, разминка, растяжка и снятие мышечной крепатуры.

Напишите конкретное упражнение или вашу цель, и я дам подробную инструкцию!`;
  }

  return `**SportX AI Fitness Assistant is ready to assist!**
I can help you with:
- Biomechanical form cues and technique corrections for any movement;
- Training programming, sets, reps, tempo, and rest intervals;
- Dynamic warm-ups, mobility, and post-workout recovery;
- Sports nutrition, protein timing, and sleep optimization.

What exercise or fitness goal would you like to discuss?`;
}
