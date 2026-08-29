export type Language = 'en' | 'ru' | 'kk';

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    ru: string;
    kk: string;
  };
}

export const translations: TranslationDictionary = {
  // Brand & Slogan
  'brand.name': {
    en: 'SportX',
    ru: 'SportX',
    kk: 'SportX',
  },
  'brand.tagline': {
    en: 'AI Biomechanics & Fitness Platform',
    ru: 'Платформа ИИ-биомеханики и фитнеса',
    kk: 'ЖИ биомеханикасы және фитнес платформасы',
  },
  'brand.footer': {
    en: '© 2026 SportX AI Biomechanical Platform. Engineered for young athletes & coaches.',
    ru: '© 2026 SportX ИИ-Биомеханическая платформа. Разработано для юных атлетов и тренеров.',
    kk: '© 2026 SportX ЖИ Биомеханикалық платформасы. Жас спортшылар мен жаттықтырушыларға арналған.',
  },
  'brand.principle': {
    en: 'Principle: Objective kinematic technique analysis without medical injury diagnoses.',
    ru: 'Принцип: Объективный кинематический анализ техники без медицинских диагнозов.',
    kk: 'Қағида: Медициналық диагноздарсыз техниканы объективті кинематикалық талдау.',
  },

  // Navigation
  'nav.train': {
    en: 'Train',
    ru: 'Тренировка',
    kk: 'Жаттығу',
  },
  'nav.home': {
    en: 'Dashboard',
    ru: 'Главная',
    kk: 'Басты бет',
  },
  'nav.progress': {
    en: 'Progress',
    ru: 'Прогресс',
    kk: 'Прогресс',
  },
  'nav.nutrition': {
    en: 'Nutrition',
    ru: 'Питание',
    kk: 'Тамақтану',
  },
  'nav.sleep': {
    en: 'Sleep',
    ru: 'Сон',
    kk: 'Ұйқы',
  },
  'nav.assistant': {
    en: 'AI Assistant',
    ru: 'ИИ Ассистент',
    kk: 'ЖИ Бапкер',
  },
  'nav.coach': {
    en: 'Coach Hub',
    ru: 'Тренер',
    kk: 'Бапкер',
  },
  'nav.profile': {
    en: 'Profile',
    ru: 'Профиль',
    kk: 'Профиль',
  },
  'nav.settings': {
    en: 'Settings',
    ru: 'Настройки',
    kk: 'Баптаулар',
  },
  'nav.login': {
    en: 'Log In',
    ru: 'Войти',
    kk: 'Кіру',
  },
  'nav.signup': {
    en: 'Sign Up',
    ru: 'Регистрация',
    kk: 'Тіркелу',
  },
  'nav.logout': {
    en: 'Sign Out',
    ru: 'Выйти',
    kk: 'Шығу',
  },
  'nav.camera': {
    en: 'AI Camera',
    ru: 'ИИ Камера',
    kk: 'ЖИ Камера',
  },

  // Auth Modal & Screen
  'auth.welcomeBack': {
    en: 'Welcome Back',
    ru: 'С возвращением',
    kk: 'Қош келдіңіз',
  },
  'auth.createAccount': {
    en: 'Create Your Account',
    ru: 'Создать аккаунт',
    kk: 'Тіркелгі жасау',
  },
  'auth.resetPassword': {
    en: 'Reset Password',
    ru: 'Сброс пароля',
    kk: 'Құпиясөзді қайта орнату',
  },
  'auth.loginSubtitle': {
    en: 'Log in to track workouts and evaluate real-time kinematics',
    ru: 'Войдите, чтобы отслеживать тренировки и технику в реальном времени',
    kk: 'Жаттығуларды бақылау және нақты уақытта техниканы бағалау үшін кіріңіз',
  },
  'auth.signupSubtitle': {
    en: 'Join the scientific AI fitness platform',
    ru: 'Присоединяйтесь к платформе ИИ-анализа движений',
    kk: 'Ғылыми ЖИ фитнес платформасына қосылыңыз',
  },
  'auth.resetSubtitle': {
    en: 'Enter your email to receive recovery instructions',
    ru: 'Введите почту для получения инструкций по сбросу',
    kk: 'Қалпына келтіру нұсқауларын алу үшін электрондық поштаңызды енгізіңіз',
  },
  'auth.role': {
    en: 'I am a',
    ru: 'Я являюсь',
    kk: 'Мен',
  },
  'auth.athlete': {
    en: 'Athlete',
    ru: 'Атлет / Спортсмен',
    kk: 'Спортшы',
  },
  'auth.coach': {
    en: 'Coach',
    ru: 'Тренер / Наставник',
    kk: 'Жаттықтырушы',
  },
  'auth.fullName': {
    en: 'Full Name',
    ru: 'Полное имя',
    kk: 'Толық аты-жөні',
  },
  'auth.fullNamePlaceholder': {
    en: 'e.g. Alex Rivera',
    ru: 'например, Арман Сериков',
    kk: 'мысалы, Арман Серіков',
  },
  'auth.email': {
    en: 'Email Address',
    ru: 'Электронная почта',
    kk: 'Электрондық пошта',
  },
  'auth.emailPlaceholder': {
    en: 'athlete@example.com',
    ru: 'athlete@example.com',
    kk: 'athlete@example.com',
  },
  'auth.password': {
    en: 'Password',
    ru: 'Пароль',
    kk: 'Құпиясөз',
  },
  'auth.forgotPassword': {
    en: 'Forgot?',
    ru: 'Забыли?',
    kk: 'Ұмыттыңыз ба?',
  },
  'auth.sport': {
    en: 'Primary Sport',
    ru: 'Основной вид спорта',
    kk: 'Негізгі спорт түрі',
  },
  'auth.sportPlaceholder': {
    en: 'e.g. Track & Field, Football, Swimming',
    ru: 'например, Футбол, Плавание, Легкая атлетика',
    kk: 'мысалы, Футбол, Жүзу, Жеңіл атлетика',
  },
  'auth.specialization': {
    en: 'Coaching Specialization',
    ru: 'Специализация тренера',
    kk: 'Жаттықтырушының мамандануы',
  },
  'auth.specializationPlaceholder': {
    en: 'e.g. Sprint Mechanics, Strength & Conditioning',
    ru: 'например, Силовая подготовка, Биомеханика',
    kk: 'мысалы, Күштік дайындық, Биомеханика',
  },
  'auth.submitLogin': {
    en: 'Log In to SportX',
    ru: 'Войти в SportX',
    kk: 'SportX жүйесіне кіру',
  },
  'auth.submitSignup': {
    en: 'Create Free Account',
    ru: 'Создать бесплатный аккаунт',
    kk: 'Тегін тіркелгі жасау',
  },
  'auth.submitReset': {
    en: 'Send Reset Link',
    ru: 'Отправить ссылку для сброса',
    kk: 'Қалпына келтіру сілтемесін жіберу',
  },
  'auth.haveAccount': {
    en: 'Already have an account?',
    ru: 'Уже есть аккаунт?',
    kk: 'Тіркелгіңіз бар ма?',
  },
  'auth.noAccount': {
    en: "Don't have an account?",
    ru: 'Нет аккаунта?',
    kk: 'Тіркелгіңіз жоқ па?',
  },
  'auth.signInLink': {
    en: 'Sign In',
    ru: 'Войти',
    kk: 'Кіру',
  },
  'auth.signUpLink': {
    en: 'Sign Up',
    ru: 'Зарегистрироваться',
    kk: 'Тіркелу',
  },
  'auth.backToLogin': {
    en: 'Back to Sign In',
    ru: 'Вернуться ко входу',
    kk: 'Кіруге оралу',
  },
  'auth.loginRequired': {
    en: 'Authentication Required',
    ru: 'Требуется авторизация',
    kk: 'Авторизация қажет',
  },
  'auth.loginRequiredDesc': {
    en: 'Please sign in or create an account to view your personalized dashboard, nutrition, sleep, and progress.',
    ru: 'Пожалуйста, войдите или зарегистрируйтесь, чтобы просмотреть тренировки, питание, сон и прогресс.',
    kk: 'Жеке жаттығуларыңызды, тамақтануды, ұйқыны және прогресті көру үшін жүйеге кіріңіз.',
  },

  // Train Section
  'train.title': {
    en: 'What do you want to train today?',
    ru: 'Что вы хотите тренировать сегодня?',
    kk: 'Бүгін нені жаттықтырғыңыз келеді?',
  },
  'train.subtitle': {
    en: 'Pick a target muscle group to see exercises and check your technique in real time.',
    ru: 'Выберите целевую группу мышц, чтобы увидеть упражнения и проверить технику.',
    kk: 'Жаттығуларды көру және нақты уақытта техниканы тексеру үшін бұлшықет тобын таңдаңыз.',
  },
  'train.searchPlaceholder': {
    en: 'Search by exercise name or equipment...',
    ru: 'Поиск по названию упражнения или инвентарю...',
    kk: 'Жаттығу атауы немесе құрал-жабдық бойынша іздеу...',
  },
  'train.allCategories': {
    en: 'All Muscles',
    ru: 'Все мышцы',
    kk: 'Барлық бұлшықеттер',
  },
  'train.availableExercises': {
    en: 'Available Exercises',
    ru: 'Доступные упражнения',
    kk: 'Қолжетімді жаттығулар',
  },
  'train.aiReady': {
    en: 'AI Ready',
    ru: 'ИИ Анализ',
    kk: 'ЖИ Қолдауы',
  },
  'train.noExercises': {
    en: 'No exercises found matching your search.',
    ru: 'По вашему запросу упражнений не найдено.',
    kk: 'Іздеу бойынша жаттығулар табылмады.',
  },
  'train.resetFilters': {
    en: 'Reset Filters',
    ru: 'Сбросить фильтры',
    kk: 'Сүзгілерді қайтару',
  },
  'train.checkTechnique': {
    en: 'Check Technique',
    ru: 'Проверить технику',
    kk: 'Техниканы тексеру',
  },

  // Muscle Categories
  'muscle.chest': {
    en: 'Chest',
    ru: 'Грудь',
    kk: 'Кеуде',
  },
  'muscle.back': {
    en: 'Back',
    ru: 'Спина',
    kk: 'Арқа',
  },
  'muscle.shoulders': {
    en: 'Shoulders',
    ru: 'Плечи',
    kk: 'Иық',
  },
  'muscle.biceps': {
    en: 'Biceps',
    ru: 'Бицепс',
    kk: 'Бицепс',
  },
  'muscle.triceps': {
    en: 'Triceps',
    ru: 'Трицепс',
    kk: 'Трицепс',
  },
  'muscle.forearms': {
    en: 'Forearms',
    ru: 'Предплечья',
    kk: 'Білек',
  },
  'muscle.core': {
    en: 'Core',
    ru: 'Кор и пресс',
    kk: 'Кор және баспасөз',
  },
  'muscle.traps': {
    en: 'Traps',
    ru: 'Трапеция',
    kk: 'Трапеция',
  },
  'muscle.neck': {
    en: 'Neck',
    ru: 'Шея',
    kk: 'Мойын',
  },
  'muscle.glutes': {
    en: 'Glutes',
    ru: 'Ягодицы',
    kk: 'Бөксе',
  },
  'muscle.quadriceps': {
    en: 'Quadriceps',
    ru: 'Квадрицепс',
    kk: 'Квадрицепс',
  },
  'muscle.hamstrings': {
    en: 'Hamstrings',
    ru: 'Бицепс бедра',
    kk: 'Санның артқы жағы',
  },
  'muscle.calves': {
    en: 'Calves',
    ru: 'Икры',
    kk: 'Балтыр',
  },
  'muscle.adductors': {
    en: 'Adductors',
    ru: 'Приводящие',
    kk: 'Жанастырушы',
  },
  'muscle.full_body': {
    en: 'Full Body',
    ru: 'Все тело',
    kk: 'Толық дене',
  },
  'muscle.cardio': {
    en: 'Cardio',
    ru: 'Кардио',
    kk: 'Кардио',
  },
  'muscle.mobility': {
    en: 'Mobility',
    ru: 'Мобильность',
    kk: 'Ұтқырлық',
  },

  // Exercise Detail Modal
  'detail.target': {
    en: 'Target',
    ru: 'Целевые',
    kk: 'Мақсатты',
  },
  'detail.secondary': {
    en: 'Secondary',
    ru: 'Вторичные',
    kk: 'Қосымша',
  },
  'detail.demonstration': {
    en: 'Technique Demonstration',
    ru: 'Демонстрация техники',
    kk: 'Техниканы көрсету',
  },
  'detail.videoComingSoon': {
    en: 'Demonstration video coming soon.',
    ru: 'Видео-демонстрация скоро появится.',
    kk: 'Бейне нұсқаулық жақында қосылады.',
  },
  'detail.videoComingSoonDesc': {
    en: 'Follow the verified biomechanical steps below or launch the AI camera to check your form.',
    ru: 'Следуйте шагам ниже или запустите ИИ-камеру для анализа формы.',
    kk: 'Төмендегі биомеханикалық қадамдарды орындаңыз немесе пішінді тексеру үшін ЖИ камерасын іске қосыңыз.',
  },
  'detail.howToPerform': {
    en: 'How to Perform',
    ru: 'Как выполнять',
    kk: 'Қалай орындау керек',
  },
  'detail.commonMistakes': {
    en: 'Common Mistakes to Avoid',
    ru: 'Типичные ошибки',
    kk: 'Жиі кездесетін қателіктер',
  },
  'detail.aiMetrics': {
    en: 'AI Technique Metrics',
    ru: 'Метрики ИИ-анализа',
    kk: 'ЖИ техникалық көрсеткіштері',
  },
  'detail.targetRom': {
    en: 'Target ROM',
    ru: 'Целевая амплитуда',
    kk: 'Мақсатты амплитуда',
  },
  'detail.symmetry': {
    en: 'Bilateral Symmetry',
    ru: 'Симметрия сторон',
    kk: 'Екі жақты симметрия',
  },
  'detail.checkMyTechnique': {
    en: 'CHECK MY TECHNIQUE',
    ru: 'ПРОВЕРИТЬ МОЮ ТЕХНИКУ',
    kk: 'ТЕХНИКАМДЫ ТЕКСЕРУ',
  },

  // Live Camera Studio
  'camera.exitStudio': {
    en: 'Exit Studio',
    ru: 'Выйти из студии',
    kk: 'Студиядан шығу',
  },
  'camera.flipCamera': {
    en: 'Flip Camera',
    ru: 'Сменить камеру',
    kk: 'Камераны ауыстыру',
  },
  'camera.mute': {
    en: 'Mute Audio Cues',
    ru: 'Выключить звук',
    kk: 'Дыбысты өшіру',
  },
  'camera.unmute': {
    en: 'Unmute Audio Cues',
    ru: 'Включить звук',
    kk: 'Дыбысты қосу',
  },
  'camera.setup': {
    en: 'Camera Setup',
    ru: 'Настройка камеры',
    kk: 'Камераны баптау',
  },
  'camera.startWorkout': {
    en: 'Start Workout',
    ru: 'Начать тренировку',
    kk: 'Жаттығуды бастау',
  },
  'camera.finishSet': {
    en: 'Finish Set',
    ru: 'Завершить подход',
    kk: 'Жаттығуды аяқтау',
  },
  'camera.reps': {
    en: 'Reps',
    ru: 'Повторы',
    kk: 'Қайталау',
  },
  'camera.jointAngle': {
    en: 'Joint Angle',
    ru: 'Угол сустава',
    kk: 'Буын бұрышы',
  },
  'camera.symmetryScore': {
    en: 'Symmetry',
    ru: 'Симметрия',
    kk: 'Симметрия',
  },
  'camera.connecting': {
    en: 'Connecting camera & AI pose tracker...',
    ru: 'Подключение камеры и ИИ-трекера...',
    kk: 'Камера және ЖИ трекері қосылуда...',
  },
  'camera.permissionNeeded': {
    en: 'Camera Permission Needed',
    ru: 'Нужен доступ к камере',
    kk: 'Камераға рұқсат қажет',
  },
  'camera.permissionDesc': {
    en: 'Camera access is required for real-time form tracking. Please allow camera permissions in your browser.',
    ru: 'Доступ к камере необходим для отслеживания движений. Пожалуйста, разрешите доступ в браузере.',
    kk: 'Қозғалысты нақты уақытта бақылау үшін камераға рұқсат қажет. Браузерде рұқсат беріңіз.',
  },
  'camera.retryPermission': {
    en: 'Retry Permission',
    ru: 'Повторить запрос',
    kk: 'Қайта сұрау',
  },
  'camera.trackingReady': {
    en: 'Full Body Tracking Ready',
    ru: 'Трекинг всего тела готов',
    kk: 'Денені толық бақылау дайын',
  },

  // Movement Phases
  'phase.ready': {
    en: 'READY',
    ru: 'ГОТОВНОСТЬ',
    kk: 'ДАЙЫНДЫҚ',
  },
  'phase.standing': {
    en: 'STANDING',
    ru: 'СТОЙКА',
    kk: 'ТІК ТҰРУ',
  },
  'phase.descent': {
    en: 'DESCENT',
    ru: 'ОПУСКАНИЕ',
    kk: 'ТӨМЕНДЕУ',
  },
  'phase.bottom': {
    en: 'BOTTOM DEPTH',
    ru: 'НИЖНЯЯ ТОЧКА',
    kk: 'ТӨМЕНГІ НҮКТЕ',
  },
  'phase.ascent': {
    en: 'ASCENT',
    ru: 'ПОДЪЕМ',
    kk: 'КӨТЕРІЛУ',
  },
  'phase.plank': {
    en: 'PLANK',
    ru: 'ПЛАНКА',
    kk: 'ПЛАНКА',
  },
  'phase.hang': {
    en: 'HANG',
    ru: 'ВИС',
    kk: 'АСЫЛУ',
  },
  'phase.pulling': {
    en: 'PULLING',
    ru: 'ТЯГА',
    kk: 'ТАРТУ',
  },
  'phase.top': {
    en: 'TOP POSITION',
    ru: 'ВЕРХНЯЯ ТОЧКА',
    kk: 'ЖОҒАРҒЫ НҮКТЕ',
  },
  'phase.curling': {
    en: 'CURLING',
    ru: 'ПОДЪЕМ',
    kk: 'КӨТЕРУ',
  },
  'phase.peak': {
    en: 'PEAK SQUEEZE',
    ru: 'ПИК СОКРАЩЕНИЯ',
    kk: 'ШЫҢҒЫ ҚЫСУ',
  },
  'phase.lowering': {
    en: 'LOWERING',
    ru: 'ОПУСКАНИЕ',
    kk: 'ТҮСІРУ',
  },
  'phase.extended': {
    en: 'EXTENDED',
    ru: 'РАСХОД',
    kk: 'СОЗЫЛУ',
  },
  'phase.rack': {
    en: 'RACK POSITION',
    ru: 'ИСХОДНАЯ',
    kk: 'БАСТАПҚЫ ОРЫН',
  },
  'phase.pressing': {
    en: 'PRESSING',
    ru: 'ЖИМ',
    kk: 'СЫҒУ',
  },
  'phase.lockout': {
    en: 'LOCKOUT',
    ru: 'ФИКСАЦИЯ',
    kk: 'БЕКІТУ',
  },

  // AI Real-time Cues
  'cue.standInFrame': {
    en: 'Stand so your whole body is in frame',
    ru: 'Встаньте так, чтобы все тело было в кадре',
    kk: 'Бүкіл денеңіз кадрда көрінетіндей тұрыңыз',
  },
  'cue.stepBackFullBody': {
    en: 'Step back so your full body from hips to feet is visible',
    ru: 'Отойдите назад, чтобы были видны бедра и стопы',
    kk: 'Жамбас пен аяқтарыңыз көрінетіндей артқа шегініңіз',
  },
  'cue.ensureArmsVisible': {
    en: 'Ensure your arms and torso are in frame',
    ru: 'Убедитесь, что руки и корпус в кадре',
    kk: 'Қолдарыңыз бен кеудеңіздің кадрда екеніне көз жеткізіңіз',
  },
  'cue.controlDescent': {
    en: 'Control descent smoothly',
    ru: 'Контролируйте опускание плавно',
    kk: 'Төмендеуді бірқалыпты бақылаңыз',
  },
  'cue.goodDepth': {
    en: 'Good depth — drive up through midfoot',
    ru: 'Отличная глубина — толкайтесь всей стопой',
    kk: 'Керемет тереңдік — толық табанмен итеріліңіз',
  },
  'cue.balanceWeight': {
    en: 'Balance weight evenly between both legs',
    ru: 'Равномерно распределяйте вес на обе ноги',
    kk: 'Салмақты екі аяққа біркелкі бөліңіз',
  },
  'cue.driveHipsUp': {
    en: 'Drive hips and chest up together',
    ru: 'Поднимайте таз и грудь синхронно',
    kk: 'Жамбас пен кеудені бірдей көтеріңіз',
  },
  'cue.repComplete': {
    en: 'Rep completed! Great form.',
    ru: 'Повтор засчитан! Отличная форма.',
    kk: 'Қайталау есептелді! Керемет техника.',
  },
  'cue.lowerChestControl': {
    en: 'Lower chest with control',
    ru: 'Опускайте грудь под контролем',
    kk: 'Кеудені бақылаумен түсіріңіз',
  },
  'cue.targetDepthPress': {
    en: 'Target depth reached — press up powerfully',
    ru: 'Глубина достигнута — жмите вверх',
    kk: 'Тереңдікке жеттіңіз — жоғары итеріңіз',
  },
  'cue.curlNoSwing': {
    en: 'Curl smoothly without swinging',
    ru: 'Сгибайте плавно без раскачки корпуса',
    kk: 'Денені шайқамай, бірқалыпты бүгіңіз',
  },
  'cue.peakSqueeze': {
    en: 'Peak contraction — lower with control',
    ru: 'Пик сокращения — опускайте плавно',
    kk: 'Шыңғы жиырылу — бақылаумен түсіріңіз',
  },
  'cue.pressVertical': {
    en: 'Press vertically overhead',
    ru: 'Жмите строго вертикально над головой',
    kk: 'Тікелей жоғары қарай сығыңыз',
  },
  'cue.lockoutReached': {
    en: 'Full overhead lockout reached',
    ru: 'Полная фиксация вверху достигнута',
    kk: 'Жоғарғы толық бекіту орындалды',
  },
  'cue.pullVertical': {
    en: 'Pull chest up to bar smoothly',
    ru: 'Подтягивайте грудь к перекладине плавно',
    kk: 'Кеудеңізді турникке бірқалыпты тартыңыз',
  },
  'cue.topReach': {
    en: 'Top reached! Lower with control into full extension',
    ru: 'Верхняя точка! Опускайтесь плавно до полного виса',
    kk: 'Жоғарғы нүкте! Толық созылуға дейін бірқалыпты түсіңіз',
  },

  // Nutrition
  'nutrition.title': {
    en: 'Nutrition Intelligence',
    ru: 'Умный учет питания',
    kk: 'Тамақтануды талдау',
  },
  'nutrition.subtitle': {
    en: 'Type your meal in English, Russian or Kazakh to estimate calories and macronutrients.',
    ru: 'Введите прием пищи на русском, казахском или английском для расчета КБЖУ.',
    kk: 'Калория мен макронутриенттерді есептеу үшін тағамыңызды қазақша, орысша немесе ағылшынша жазыңыз.',
  },
  'nutrition.logMeal': {
    en: 'Log Meal with Natural Language',
    ru: 'Записать прием пищи',
    kk: 'Тамақтануды жазу',
  },
  'nutrition.calories': {
    en: 'Calories',
    ru: 'Калории',
    kk: 'Калориялар',
  },
  'nutrition.protein': {
    en: 'Protein',
    ru: 'Белки',
    kk: 'Ақуыздар',
  },
  'nutrition.carbs': {
    en: 'Carbohydrates',
    ru: 'Углеводы',
    kk: 'Көмірсулар',
  },
  'nutrition.fats': {
    en: 'Fats',
    ru: 'Жиры',
    kk: 'Майлар',
  },
  'nutrition.energy': {
    en: 'Energy & Recovery',
    ru: 'Энергия и восстановление',
    kk: 'Энергия және қалпына келу',
  },
  'nutrition.hormones': {
    en: 'Hormonal Balance',
    ru: 'Гормональный баланс',
    kk: 'Гормоналды тепе-теңдік',
  },
  'nutrition.breakfast': {
    en: 'Breakfast',
    ru: 'Завтрак',
    kk: 'Таңғы ас',
  },
  'nutrition.lunch': {
    en: 'Lunch',
    ru: 'Обед',
    kk: 'Түскі ас',
  },
  'nutrition.dinner': {
    en: 'Dinner',
    ru: 'Ужин',
    kk: 'Кешкі ас',
  },
  'nutrition.snack': {
    en: 'Snack',
    ru: 'Перекус',
    kk: 'Жеңіл тамақ',
  },
  'nutrition.placeholder': {
    en: 'e.g. Chicken breast with rice + 2 eggs (or Борщ с хлебом / Кеспе)',
    ru: 'например, Куриная грудка с рисом + 2 яйца (или Борщ с хлебом / Кеспе)',
    kk: 'мысалы, Тауық еті мен күріш + 2 жұмыртқа (немесе Борщ / Кеспе)',
  },
  'nutrition.detectedFoods': {
    en: 'Detected Foods & Portions',
    ru: 'Распознанные продукты и порции',
    kk: 'Анықталған тағамдар мен порциялар',
  },
  'nutrition.saveMeal': {
    en: 'Log This Meal',
    ru: 'Записать прием пищи',
    kk: 'Тамақтануды сақтау',
  },
  'nutrition.savedSuccess': {
    en: 'Meal logged successfully to your daily nutrition log.',
    ru: 'Прием пищи успешно записан в ваш дневник питания.',
    kk: 'Тамақтану күнделігіңізге сәтті сақталды.',
  },
  'nutrition.todayHistory': {
    en: "Today's Meal Log",
    ru: 'Дневник питания за сегодня',
    kk: 'Бүгінгі тамақтану журналы',
  },
  'nutrition.loadingHistory': {
    en: 'Loading meal history...',
    ru: 'Загрузка истории питания...',
    kk: 'Тамақтану тарихы жүктелуде...',
  },
  'nutrition.noMealsYet': {
    en: 'No meals logged yet today.',
    ru: 'Сегодня приемов пищи еще не записано.',
    kk: 'Бүгінге әлі тамақтану жазылмаған.',
  },
  'nutrition.noMealsDesc': {
    en: 'Type your breakfast, lunch, dinner or snack above to keep track of your daily calories & macros.',
    ru: 'Введите завтрак, обед, ужин или перекус выше для автоматического подсчета калорий и БЖУ.',
    kk: 'Калория мен БЖУ-ды автоматты түрде есептеу үшін таңғы, түскі, кешкі асыңызды жоғарыда жазыңыз.',
  },

  // Sleep
  'sleep.title': {
    en: 'Sleep & Recovery Insights',
    ru: 'Сон и восстановление',
    kk: 'Ұйқы және қалпына келу',
  },
  'sleep.subtitle': {
    en: 'Track sleep and wake times to calculate objective sleep duration and evaluate training readiness.',
    ru: 'Отслеживайте время сна для расчета длительности и оценки готовности к тренировкам.',
    kk: 'Ұйқы ұзақтығын есептеу және жаттығуға дайындықты бағалау үшін ұйқы уақытын бақылаңыз.',
  },

  // AI Assistant
  'assistant.title': {
    en: 'SportX AI Assistant',
    ru: 'ИИ-Ассистент SportX',
    kk: 'SportX ЖИ Бапкері',
  },
  'assistant.subtitle': {
    en: 'Biomechanical analysis, training advice, and recovery guidance.',
    ru: 'Биомеханический анализ, тренировочные программы и советы по восстановлению.',
    kk: 'Биомеханикалық талдау, жаттығу бағдарламалары және қалпына келу кеңестері.',
  },

  // Profile
  'profile.title': {
    en: 'Athlete Profile & Settings',
    ru: 'Профиль и настройки атлета',
    kk: 'Спортшының профилі және баптаулары',
  },
  'profile.saveChanges': {
    en: 'Save Profile Changes',
    ru: 'Сохранить изменения',
    kk: 'Өзгерістерді сақтау',
  },
  'profile.saving': {
    en: 'Saving...',
    ru: 'Сохранение...',
    kk: 'Сақталуда...',
  },
  'profile.saved': {
    en: 'Profile Saved',
    ru: 'Профиль сохранен',
    kk: 'Профиль сақталды',
  },
  'profile.height': {
    en: 'Height (cm)',
    ru: 'Рост (см)',
    kk: 'Бойы (см)',
  },
  'profile.weight': {
    en: 'Weight (kg)',
    ru: 'Вес (кг)',
    kk: 'Салмағы (кг)',
  },
  'profile.trainingLevel': {
    en: 'Training Level',
    ru: 'Уровень подготовки',
    kk: 'Дайындық деңгейі',
  },
  'profile.language': {
    en: 'Interface Language',
    ru: 'Язык интерфейса',
    kk: 'Интерфейс тілі',
  },

  // Progress
  'progress.title': {
    en: 'Biomechanical Progress',
    ru: 'Биомеханический прогресс',
    kk: 'Биомеханикалық прогресс',
  },
  'progress.noDataYet': {
    en: 'No technique analysis yet.',
    ru: 'Данных анализа пока нет.',
    kk: 'Талдау деректері әзірге жоқ.',
  },

  // Coach
  'coach.title': {
    en: 'Coach Supervision Hub',
    ru: 'Панель тренера',
    kk: 'Бапкер орталығы',
  },
  'coach.noAthletes': {
    en: 'No athletes connected yet.',
    ru: 'Пока нет подключенных атлетов.',
    kk: 'Әзірге байланысқан спортшылар жоқ.',
  },
};

export const getTranslation = (key: string, lang: Language): string => {
  const item = translations[key];
  if (!item) return key;
  return item[lang] || item['en'] || key;
};
