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
  'nav.messages': {
    en: 'Messages',
    ru: 'Сообщения',
    kk: 'Хабарламалар',
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

  // Notifications & Alerts Dropdown
  'notifications.title': {
    en: 'Alerts & Notifications',
    ru: 'Уведомления и сигналы',
    kk: 'Хабарландырулар мен белгілер',
  },
  'notifications.subtitle': {
    en: 'Real-time biomechanical analysis & alerts',
    ru: 'Биомеханический анализ и важные сигналы',
    kk: 'Нақты уақыттағы биомеханикалық талдау мен белгілер',
  },
  'notifications.emptyTitle': {
    en: 'All metrics on track',
    ru: 'Все показатели в норме',
    kk: 'Барлық көрсеткіштер қалыпты',
  },
  'notifications.emptySubtitle': {
    en: 'No critical technique deviations or active warnings detected.',
    ru: 'Критичных отклонений техники или активных предупреждений нет.',
    kk: 'Маңызды техникалық ауытқулар немесе белсенді ескертулер жоқ.',
  },
  'notifications.loading': {
    en: 'Loading notifications...',
    ru: 'Загрузка уведомлений...',
    kk: 'Хабарландырулар жүктелуде...',
  },
  'notifications.close': {
    en: 'Close',
    ru: 'Закрыть',
    kk: 'Жабу',
  },
  'notifications.clearAll': {
    en: 'Mark all as read',
    ru: 'Прочитано',
    kk: 'Барлығын оқылды деп белгілеу',
  },

  // Direct Messages & Chat System
  'chat.directMessages': {
    en: 'Direct Messages',
    ru: 'Личные сообщения',
    kk: 'Жеке хабарламалар',
  },
  'chat.trainerHub': {
    en: 'Trainer Hub',
    ru: 'Центр тренера',
    kk: 'Жаттықтырушы орталығы',
  },
  'chat.athleteChat': {
    en: 'Athlete Chat',
    ru: 'Чат атлета',
    kk: 'Атлет чаты',
  },
  'chat.searchAthletes': {
    en: 'Search athletes...',
    ru: 'Поиск атлетов...',
    kk: 'Атлеттерді іздеу...',
  },
  'chat.searchTrainers': {
    en: 'Search coaches...',
    ru: 'Поиск тренеров...',
    kk: 'Жаттықтырушыларды іздеу...',
  },
  'chat.searchContacts': {
    en: 'Search contacts...',
    ru: 'Поиск контактов...',
    kk: 'Контактілерді іздеу...',
  },
  'chat.loadingConversations': {
    en: 'Loading conversations...',
    ru: 'Загрузка диалогов...',
    kk: 'Сұхбаттар жүктелуде...',
  },
  'chat.noConversations': {
    en: 'No active conversations yet',
    ru: 'Нет активных диалогов',
    kk: 'Белсенді сұхбаттар жоқ',
  },
  'chat.noConversationsDesc': {
    en: 'Start a conversation with a coach or athlete to discuss technique and training plans.',
    ru: 'Начните диалог с тренером или атлетом для обсуждения техники и плана тренировок.',
    kk: 'Техника мен жаттығу жоспарын талқылау үшін жаттықтырушы немесе атлетпен сұхбат бастаңыз.',
  },
  'chat.selectConversation': {
    en: 'Select a conversation',
    ru: 'Выберите диалог',
    kk: 'Сұхбатты таңдаңыз',
  },
  'chat.selectConversationDesc': {
    en: 'Connect directly between athlete and coach, exchange exercise advice, and review live kinematic progress.',
    ru: 'Общайтесь напрямую между атлетом и тренером, обменивайтесь рекомендациями и разбирайте технику.',
    kk: 'Атлет пен жаттықтырушы арасында тікелей байланысып, ұсыныстармен бөлісіңіз және техниканы талдаңыз.',
  },
  'chat.startConversationTitle': {
    en: 'Start the conversation',
    ru: 'Начните разговор',
    kk: 'Әңгімені бастаңыз',
  },
  'chat.startConversationDesc': {
    en: 'Send real-time feedback, workout recommendations, or ask your coach questions about technique.',
    ru: 'Отправляйте советы, рекомендации по тренировкам или задавайте вопросы тренеру.',
    kk: 'Кері байланыс, жаттығу ұсыныстарын жіберіңіз немесе жаттықтырушыға сұрақ қойыңыз.',
  },
  'chat.typePlaceholder': {
    en: 'Type a message...',
    ru: 'Введите сообщение...',
    kk: 'Хабарлама жазыңыз...',
  },
  'chat.viewTelemetry': {
    en: 'View Telemetry',
    ru: 'Телеметрия',
    kk: 'Телеметрия',
  },
  'chat.coach': {
    en: 'Coach',
    ru: 'Тренер',
    kk: 'Жаттықтырушы',
  },
  'chat.athlete': {
    en: 'Athlete',
    ru: 'Атлет',
    kk: 'Атлет',
  },
  'chat.allUsers': {
    en: 'All Contacts',
    ru: 'Все контакты',
    kk: 'Барлық контактілер',
  },
  'chat.recent': {
    en: 'Recent',
    ru: 'Недавно',
    kk: 'Жақында',
  },
  'chat.unread': {
    en: 'unread',
    ru: 'новые',
    kk: 'жаңа',
  },
  'chat.readyToConnect': {
    en: 'Ready to connect',
    ru: 'Готов к общению',
    kk: 'Байланысуға дайын',
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
  'auth.trainer': {
    en: 'Trainer',
    ru: 'Тренер',
    kk: 'Бапкер',
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
  'train.analyzeTechnique': {
    en: 'Analyze Technique',
    ru: 'Анализировать технику',
    kk: 'Техниканы талдау',
  },
  'train.viewDetails': {
    en: 'View Details & Video',
    ru: 'Подробнее и видео',
    kk: 'Толығырақ және бейне',
  },

  // Muscle Categories (All 26 requested muscle groups)
  'muscle.chest': {
    en: 'Chest',
    ru: 'Грудные мышцы',
    kk: 'Кеуде бұлшықеттері',
  },
  'muscle.back': {
    en: 'Back',
    ru: 'Спина',
    kk: 'Арқа',
  },
  'muscle.lats': {
    en: 'Lats',
    ru: 'Широчайшие мышцы',
    kk: 'Жалпақ бұлшықеттер',
  },
  'muscle.upper_back': {
    en: 'Upper Back',
    ru: 'Верх спины',
    kk: 'Арқаның жоғарғы бөлігі',
  },
  'muscle.lower_back': {
    en: 'Lower Back',
    ru: 'Поясница',
    kk: 'Бел бұлшықеттері',
  },
  'muscle.shoulders': {
    en: 'Shoulders',
    ru: 'Плечи',
    kk: 'Иық',
  },
  'muscle.front_delts': {
    en: 'Front Delts',
    ru: 'Передние дельты',
    kk: 'Алдыңғы дельталар',
  },
  'muscle.lateral_delts': {
    en: 'Lateral Delts',
    ru: 'Средние дельты',
    kk: 'Ортаңғы дельталар',
  },
  'muscle.rear_delts': {
    en: 'Rear Delts',
    ru: 'Задние дельты',
    kk: 'Артқы дельталар',
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
  'muscle.traps': {
    en: 'Traps',
    ru: 'Трапеции',
    kk: 'Трапеция',
  },
  'muscle.neck': {
    en: 'Neck',
    ru: 'Шея',
    kk: 'Мойын',
  },
  'muscle.abs': {
    en: 'Abs',
    ru: 'Пресс',
    kk: 'Іш бұлшықеттері',
  },
  'muscle.obliques': {
    en: 'Obliques',
    ru: 'Косые мышцы живота',
    kk: 'Қиғаш іш бұлшықеттері',
  },
  'muscle.core': {
    en: 'Core',
    ru: 'Кор и стабилизаторы',
    kk: 'Кор және тұрақтандырғыштар',
  },
  'muscle.glutes': {
    en: 'Glutes',
    ru: 'Ягодицы',
    kk: 'Бөксе бұлшықеттері',
  },
  'muscle.quadriceps': {
    en: 'Quadriceps',
    ru: 'Квадрицепс',
    kk: 'Квадрицепс',
  },
  'muscle.hamstrings': {
    en: 'Hamstrings',
    ru: 'Бицепс бедра',
    kk: 'Санның артқы бұлшықеті',
  },
  'muscle.adductors': {
    en: 'Adductors',
    ru: 'Приводящие мышцы',
    kk: 'Жанастырушы бұлшықеттер',
  },
  'muscle.calves': {
    en: 'Calves',
    ru: 'Икры',
    kk: 'Балтыр',
  },
  'muscle.tibialis': {
    en: 'Tibialis',
    ru: 'Большеберцовая мышца',
    kk: 'Асықты жілік бұлшықеті',
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
    ru: 'Мобильность и гибкость',
    kk: 'Ұтқырлық және икемділік',
  },

  // Equipment Types
  'equipment.all': {
    en: 'All Equipment',
    ru: 'Весь инвентарь',
    kk: 'Барлық жабдықтар',
  },
  'equipment.bodyweight': {
    en: 'Bodyweight',
    ru: 'Свой вес',
    kk: 'Өз салмағы',
  },
  'equipment.dumbbells': {
    en: 'Dumbbells',
    ru: 'Гантели',
    kk: 'Гантельдер',
  },
  'equipment.barbell': {
    en: 'Barbell',
    ru: 'Штанга',
    kk: 'Штанга',
  },
  'equipment.cables': {
    en: 'Cables',
    ru: 'Блочный тренажер',
    kk: 'Блоктық тренажер',
  },
  'equipment.machines': {
    en: 'Machines',
    ru: 'Тренажеры',
    kk: 'Тренажерлер',
  },
  'equipment.kettlebells': {
    en: 'Kettlebells',
    ru: 'Гири',
    kk: 'Гирлер',
  },
  'equipment.resistance_bands': {
    en: 'Resistance Bands',
    ru: 'Фитнес-резинки',
    kk: 'Резеңке таспалар',
  },

  // Difficulty Levels
  'difficulty.all': {
    en: 'All Levels',
    ru: 'Все уровни',
    kk: 'Барлық деңгейлер',
  },
  'difficulty.beginner': {
    en: 'Beginner',
    ru: 'Начинающий',
    kk: 'Бастаушы',
  },
  'difficulty.intermediate': {
    en: 'Intermediate',
    ru: 'Средний',
    kk: 'Орташа',
  },
  'difficulty.advanced': {
    en: 'Advanced',
    ru: 'Продвинутый',
    kk: 'Жоғары',
  },
  'difficulty.elite': {
    en: 'Elite',
    ru: 'Элитный',
    kk: 'Кәсіби',
  },

  // Train Library Filter Labels
  'train.filterByEquipment': {
    en: 'Equipment',
    ru: 'Инвентарь',
    kk: 'Жабдық',
  },
  'train.filterByDifficulty': {
    en: 'Difficulty',
    ru: 'Сложность',
    kk: 'Күрделілігі',
  },
  'train.filterAiOnly': {
    en: 'AI Vision Ready',
    ru: 'С ИИ-анализом',
    kk: 'ЖИ қолдауымен',
  },
  'train.showingExercises': {
    en: 'Showing exercises',
    ru: 'Отображено упражнений',
    kk: 'Көрсетілген жаттығулар',
  },

  // Exercise Detail Modal Complete Sections
  'detail.target': {
    en: 'Target Muscles',
    ru: 'Целевые мышцы',
    kk: 'Негізгі бұлшықеттер',
  },
  'detail.secondary': {
    en: 'Secondary Muscles',
    ru: 'Вторичные мышцы',
    kk: 'Қосымша бұлшықеттер',
  },
  'detail.equipment': {
    en: 'Equipment',
    ru: 'Инвентарь',
    kk: 'Жабдық',
  },
  'detail.difficulty': {
    en: 'Difficulty Level',
    ru: 'Уровень сложности',
    kk: 'Күрделілік деңгейі',
  },
  'detail.demonstration': {
    en: 'Correct Technique Video',
    ru: 'Видео правильной техники',
    kk: 'Дұрыс техника бейнебаяны',
  },
  'detail.videoComingSoon': {
    en: 'Video Demonstration Unavailable',
    ru: 'Видео-демонстрация временно недоступна',
    kk: 'Бейне нұсқаулық уақытша қолжетімсіз',
  },
  'detail.videoComingSoonDesc': {
    en: 'Follow the step-by-step biomechanical guide below or launch the AI Camera to check your form.',
    ru: 'Следуйте пошаговому руководству по биомеханике ниже или запустите ИИ-камеру.',
    kk: 'Төмендегі қадамдық биомеханикалық нұсқаулықты орындаңыз немесе ЖИ камерасын қосыңыз.',
  },
  'detail.startingPosition': {
    en: 'Starting Position & Posture',
    ru: 'Исходное положение и осанка',
    kk: 'Бастапқы қалып және дене түзулігі',
  },
  'detail.howToPerform': {
    en: 'Step-by-Step Instructions',
    ru: 'Пошаговое выполнение',
    kk: 'Қадамдық орындау тәртібі',
  },
  'detail.breathing': {
    en: 'Breathing & Range of Motion',
    ru: 'Дыхание и амплитуда (ROM)',
    kk: 'Тыныс алу және қозғалыс ауқымы',
  },
  'detail.commonMistakes': {
    en: 'Common Mistakes & What to Avoid',
    ru: 'Типичные ошибки и чего избегать',
    kk: 'Жиі кездесетін қателер және нені болдырмау керек',
  },
  'detail.cameraSetupTitle': {
    en: 'How to Position Your Camera',
    ru: 'Как установить камеру',
    kk: 'Камераны қалай орналастыру керек',
  },
  'detail.cameraSetupSubtitle': {
    en: 'Optimal camera placement ensures high computer vision joint detection accuracy.',
    ru: 'Правильный ракурс камеры обеспечивает максимальную точность распознавания суставов ИИ.',
    kk: 'Камераның дұрыс бұрышы ЖИ арқылы буындарды дәл анықтауды қамтамасыз етеді.',
  },
  'detail.cameraAngle': {
    en: 'Angle',
    ru: 'Ракурс',
    kk: 'Бұрыш',
  },
  'detail.cameraHeight': {
    en: 'Height',
    ru: 'Высота',
    kk: 'Биіктік',
  },
  'detail.cameraDistance': {
    en: 'Distance',
    ru: 'Дистанция',
    kk: 'Қашықтық',
  },
  'detail.bodyVisibility': {
    en: 'Body Visibility',
    ru: 'Видимость тела',
    kk: 'Дене көрінуі',
  },
  'detail.cameraAdvice': {
    en: 'Setup Instructions',
    ru: 'Инструкции по установке',
    kk: 'Орнату нұсқаулары',
  },
  'detail.aiMetrics': {
    en: 'AI Computer Vision Metrics',
    ru: 'Метрики компьютерного зрения ИИ',
    kk: 'ЖИ компьютерлік көру метрикалары',
  },
  'detail.targetRom': {
    en: 'Target ROM Angle',
    ru: 'Целевой угол амплитуды',
    kk: 'Мақсатты бұрыш амплитудасы',
  },
  'detail.normCadence': {
    en: 'Normative Cadence',
    ru: 'Нормативный темп',
    kk: 'Нормативті қарқын',
  },
  'detail.symmetry': {
    en: 'Bilateral Joint Symmetry',
    ru: 'Симметрия суставов',
    kk: 'Буындар симметриясы',
  },
  'detail.checkMyTechnique': {
    en: 'Check My Technique with AI Camera',
    ru: 'Проверить технику через ИИ-Камеру',
    kk: 'Техниканы ЖИ Камерамен тексеру',
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
  'cue.plankAlign': {
    en: 'Hold a rigid straight line from head to heels',
    ru: 'Держите прямую линию от головы до пяток',
    kk: 'Бастан өкшеге дейін түзу сызықты сақтаңыз',
  },
  'cue.plankHipSag': {
    en: 'Squeeze glutes and raise hips — avoid sagging in lower back',
    ru: 'Напрягите ягодицы — не прогибайтесь в пояснице',
    kk: 'Бөксені қатайтыңыз — белді салбыратпаңыз',
  },
  'cue.plankHipPike': {
    en: 'Lower hips down into a flat neutral line',
    ru: 'Опустите таз до ровной линии',
    kk: 'Жамбасты түзу сызыққа дейін түсіріңіз',
  },
  'cue.lungeDescend': {
    en: 'Descend smoothly until front thigh reaches parallel',
    ru: 'Опускайтесь в выпад до параллели бедра с полом',
    kk: 'Алдыңғы сан еденге параллель болғанша отырыңыз',
  },
  'cue.lungeKneeAlign': {
    en: 'Keep front knee tracked over toes without caving in',
    ru: 'Колено передней ноги смотрит строго на носок',
    kk: 'Алдыңғы тізені ішке майыстырмай ұстаңыз',
  },
  'cue.lungeDrive': {
    en: 'Drive through front midfoot and heel',
    ru: 'Толкайтесь пяткой передней ноги',
    kk: 'Алдыңғы аяқтың өкшесімен күшпен итеріліңіз',
  },
  'cue.lateralRaiseAscent': {
    en: 'Raise arms laterally to shoulder level',
    ru: 'Поднимайте руки через стороны до уровня плеч',
    kk: 'Қолды жан-жақпен иық деңгейіне дейін көтеріңіз',
  },
  'cue.lateralRaiseNoTrap': {
    en: 'Top reach — hold and squeeze lateral delts',
    ru: 'Пик подъема — прожмите средние дельты',
    kk: 'Жоғарғы нүкте — ортаңғы дельталарды қатайтыңыз',
  },
  'cue.lateralRaiseControl': {
    en: 'Lower weights slowly under eccentric control',
    ru: 'Опускайте плавно за 2-3 секунды под контролем',
    kk: '2-3 секунд ішінде баяу түсіріңіз',
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

  'nutrition.amount': {
    en: 'Amount',
    ru: 'Количество',
    kk: 'Мөлшері',
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
  'assistant.placeholder': {
    en: 'Ask about squat form, push-up depth, protein timing, or recovery...',
    ru: 'Спросите о технике приседаний, отжиманий, питании или восстановлении...',
    kk: 'Отырып-тұру, сығылу техникасы, тамақтану немесе қалпына келу туралы сұраңыз...',
  },
  'assistant.analyzing': {
    en: 'SportX AI is thinking...',
    ru: 'SportX ИИ анализирует...',
    kk: 'SportX ЖИ талдауда...',
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

  // Dashboard
  'dashboard.readyTitle': {
    en: 'Ready to train with real-time AI technique feedback?',
    ru: 'Готовы к тренировке с мгновенным ИИ-анализом техники?',
    kk: 'Нақты уақыттағы ЖИ бапкерімен жаттығуға дайынсыз ба?',
  },
  'dashboard.readySubtitle': {
    en: 'Position your phone, start the camera, and receive instant biomechanical form coaching.',
    ru: 'Установите телефон, включите камеру и получайте мгновенные подсказки по технике.',
    kk: 'Телефонды қойып, камераны қосыңыз және техника бойынша бірден нұсқаулар алыңыз.',
  },
  'dashboard.startCameraWorkout': {
    en: 'Start Camera Workout',
    ru: 'Начать с камерой',
    kk: 'Камерамен бастау',
  },
  'dashboard.uploadVideo': {
    en: 'Upload Video',
    ru: 'Загрузить видео',
    kk: 'Бейне жүктеу',
  },
  'dashboard.readiness': {
    en: 'Readiness',
    ru: 'Готовность',
    kk: 'Дайындық',
  },
  'dashboard.primeCondition': {
    en: 'Prime Condition',
    ru: 'Отличная форма',
    kk: 'Тамаша бап',
  },
  'dashboard.assignedWorkouts': {
    en: 'Assigned Workouts',
    ru: 'Назначенные тренировки',
    kk: 'Тағайындалған жаттығулар',
  },
  'dashboard.noAssignedWorkouts': {
    en: 'No assigned workouts from your coach today.',
    ru: 'На сегодня нет тренировок от тренера.',
    kk: 'Бүгінге бапкерден тағайындалған жаттығулар жоқ.',
  },
  'dashboard.recentActivity': {
    en: 'Recent Sessions',
    ru: 'Недавние тренировки',
    kk: 'Соңғы жаттығулар',
  },
  'dashboard.noRecentActivity': {
    en: 'No recorded sessions yet. Start your first camera workout!',
    ru: 'Пока нет записей тренировок. Начните свою первую тренировку с камерой!',
    kk: 'Әзірге жаттығу жазбалары жоқ. Камерамен алғашқы жаттығуыңызды бастаңыз!',
  },
  'dashboard.quickStart': {
    en: 'Quick Start Exercises',
    ru: 'Быстрый старт',
    kk: 'Жылдам бастау',
  },

  // Post-Workout Report
  'report.workoutCompleted': {
    en: 'Workout Completed',
    ru: 'Тренировка завершена',
    kk: 'Жаттығу аяқталды',
  },
  'report.duration': {
    en: 'Duration',
    ru: 'Длительность',
    kk: 'Ұзақтығы',
  },
  'report.model': {
    en: 'Model',
    ru: 'Модель',
    kk: 'Модель',
  },
  'report.techniqueScore': {
    en: 'Technique Score',
    ru: 'Оценка техники',
    kk: 'Техника бағасы',
  },
  'report.repetitions': {
    en: 'Repetitions',
    ru: 'Повторения',
    kk: 'Қайталаулар',
  },
  'report.allValid': {
    en: 'All reps valid',
    ru: 'Все повторы зачтены',
    kk: 'Барлық қайталаулар есептелді',
  },
  'report.incompleteRom': {
    en: 'incomplete ROM',
    ru: 'неполная амплитуда',
    kk: 'толық емес амплитуда',
  },
  'report.kinematicBreakdown': {
    en: 'Kinematic Breakdown',
    ru: 'Биомеханический анализ',
    kk: 'Биомеханикалық талдау',
  },
  'report.alignment': {
    en: 'Alignment',
    ru: 'Выравнивание',
    kk: 'Түзулік',
  },
  'report.rom': {
    en: 'Range of Motion',
    ru: 'Амплитуда (ROM)',
    kk: 'Қозғалыс ауқымы',
  },
  'report.symmetry': {
    en: 'Symmetry',
    ru: 'Симметрия',
    kk: 'Симметрия',
  },
  'report.tempo': {
    en: 'Tempo Cadence',
    ru: 'Темп движения',
    kk: 'Қозғалыс қарқыны',
  },
  'report.saveAndClose': {
    en: 'Save & Continue',
    ru: 'Сохранить и продолжить',
    kk: 'Сақтау және жалғастыру',
  },
  'report.techniqueFeedback': {
    en: 'Technique Feedback',
    ru: 'Замечания и оценка техники',
    kk: 'Техникалық кері байланыс',
  },
  'report.howToImprove': {
    en: 'How to Improve',
    ru: 'Как исправить технику',
    kk: 'Техниканы қалай жақсартуға болады',
  },
  'report.aiInterpretation': {
    en: 'AI Coach Interpretation',
    ru: 'Интерпретация AI-тренера',
    kk: 'AI-бапкердің қорытындысы',
  },
  'report.askAiCoach': {
    en: 'Ask AI Coach follow-up question',
    ru: 'Задать вопрос AI-тренеру',
    kk: 'AI-бапкерге сұрақ қою',
  },
  'report.generatingAiSummary': {
    en: 'Synthesizing kinematic telemetry...',
    ru: 'Анализ биомеханических данных...',
    kk: 'Биомеханикалық деректерді өңдеу...',
  },
  'report.excellent': {
    en: 'Excellent Technique',
    ru: 'Отличная техника',
    kk: 'Керемет техника',
  },
  'report.solid': {
    en: 'Solid Movement Form',
    ru: 'Хорошая форма',
    kk: 'Жақсы техника',
  },
  'report.minorAdjustments': {
    en: 'Minor Adjustments Needed',
    ru: 'Требуются небольшие правки',
    kk: 'Шағын түзетулер қажет',
  },
  'report.deviationsDetected': {
    en: 'Technique Deviations Detected',
    ru: 'Обнаружены отклонения в технике',
    kk: 'Техникалық ауытқулар анықталды',
  },

  // Camera Readiness Check
  'camera.readinessCheck': {
    en: 'Camera Readiness Check',
    ru: 'Проверка готовности камеры',
    kk: 'Камера дайындығын тексеру',
  },
  'camera.readinessDesc': {
    en: 'Ensures accurate kinematic tracking',
    ru: 'Обеспечивает точный трекинг суставов',
    kk: 'Буындарды дәл қадағалауды қамтамасыз етеді',
  },
  'camera.personDetected': {
    en: 'Person Detected',
    ru: 'Человек в кадре',
    kk: 'Адам анықталды',
  },
  'camera.searching': {
    en: 'Searching...',
    ru: 'Поиск...',
    kk: 'Іздеуде...',
  },
  'camera.detected': {
    en: 'Detected',
    ru: 'Обнаружен',
    kk: 'Анықталды',
  },
  'camera.fullBodyFraming': {
    en: 'Full Body Framing',
    ru: 'Полный рост в кадре',
    kk: 'Толық бой көрінісі',
  },
  'camera.inFrame': {
    en: 'In Frame',
    ru: 'В кадре',
    kk: 'Кадрда',
  },
  'camera.stepBackPrompt': {
    en: 'Step Back',
    ru: 'Отойдите назад',
    kk: 'Артқа шегініңіз',
  },
  'camera.envLighting': {
    en: 'Environment Lighting',
    ru: 'Освещение',
    kk: 'Жарықтандыру',
  },
  'camera.goodLight': {
    en: 'Good Light',
    ru: 'Хороший свет',
    kk: 'Жақсы жарық',
  },
  'camera.lowLight': {
    en: 'Low Light',
    ru: 'Слабый свет',
    kk: 'Әлсіз жарық',
  },
  'camera.startTraining': {
    en: 'Start Workout',
    ru: 'Начать тренировку',
    kk: 'Жаттығуды бастау',
  },
  'camera.cancel': {
    en: 'Cancel',
    ru: 'Отмена',
    kk: 'Бас тарту',
  },
  'camera.promptPosition': {
    en: 'Position yourself in front of the camera.',
    ru: 'Встаньте перед камерой.',
    kk: 'Камераның алдына тұрыңыз.',
  },
  'camera.promptStepBack': {
    en: 'Step back 2–3 steps so your entire body is in frame.',
    ru: 'Отойдите на 2–3 шага назад, чтобы все тело было в кадре.',
    kk: 'Бүкіл денеңіз көрінуі үшін 2-3 қадам артқа шегініңіз.',
  },
  'camera.promptMoveCloser': {
    en: 'Move slightly closer to the camera.',
    ru: 'Подойдите немного ближе к камере.',
    kk: 'Камераға сәл жақындаңыз.',
  },
  'camera.promptEnsureJoints': {
    en: 'Ensure your hips, knees, and feet are clearly visible.',
    ru: 'Убедитесь, что бедра, колени и стопы четко видны.',
    kk: 'Жамбас, тізе және аяқтарыңыз анық көрінетініне көз жеткізіңіз.',
  },
  'camera.promptReady': {
    en: 'Framing is optimal. You are ready to start training.',
    ru: 'Расположение оптимально. Можно начинать тренировку.',
    kk: 'Орналасу өте жақсы. Жаттығуды бастауға болады.',
  },
  'camera.promptStandInFront': {
    en: 'Stand in front of the camera so AI can detect your pose.',
    ru: 'Встаньте перед камерой для распознавания позы.',
    kk: 'ЖИ сіздің қалпыңызды тану үшін камера алдына тұрыңыз.',
  },

  // AI Assistant
  'ai.title': {
    en: 'SportX AI Assistant',
    ru: 'ИИ Ассистент SportX',
    kk: 'SportX ЖИ Бапкері',
  },
  'ai.subtitle': {
    en: 'Specialized strictly in exercise biomechanics, training, sets, reps, mobility, and recovery.',
    ru: 'Специализируется исключительно на биомеханике упражнений, тренировках, сетах, повторах, мобильности и восстановлении.',
    kk: 'Тек жаттығулар биомеханикасы, жаттығу бағдарламалары, қайталаулар, созылу және қалпына келу бойынша көмектеседі.',
  },
  'ai.placeholder': {
    en: 'Ask about exercise technique, sets & reps, warm-ups, or form cues...',
    ru: 'Спросите о технике, сетах, повторах, разминке или ошибках...',
    kk: 'Техника, сетиялар, қайталаулар, қыздырыну немесе қателіктер туралы сұраңыз...',
  },
  'ai.send': {
    en: 'Send',
    ru: 'Отправить',
    kk: 'Жіберу',
  },
  'ai.clearChat': {
    en: 'Clear Chat',
    ru: 'Очистить чат',
    kk: 'Чатты тазалау',
  },
  'ai.offTopicNotice': {
    en: 'Note: Off-topic questions will be politely refused.',
    ru: 'Примечание: Вопросы не о фитнесе будут отклонены.',
    kk: 'Ескерту: Фитнеске қатысы жоқ сұрақтар қабылданбайды.',
  },
  'ai.errorApiKey': {
    en: 'Google Gemini API key is not configured on the server. Please add GEMINI_API_KEY to environment variables.',
    ru: 'API ключ Google Gemini не настроен на сервере. Добавьте GEMINI_API_KEY в переменные окружения.',
    kk: 'Google Gemini API кілті серверде бапталмаған. GEMINI_API_KEY орта айнымалыларына қосыңыз.',
  },
  'ai.errorNetwork': {
    en: 'Unable to connect to AI server. Please check your internet connection.',
    ru: 'Не удалось подключиться к серверу ИИ. Проверьте соединение.',
    kk: 'ЖИ серверіне қосылу мүмкін болмады. Интернет байланысын тексеріңіз.',
  },
  'ai.defaultGreeting': {
    en: 'Hello! I am your SportX AI Fitness Coach. Ask me anything about exercise technique, workout programming, sets, reps, mobility, or recovery!',
    ru: 'Здравствуйте! Я ваш ИИ-тренер SportX. Спросите меня о технике упражнений, программах тренировок, сетах, повторениях, мобильности или восстановлении!',
    kk: 'Сәлеметсіз бе! Мен сіздің SportX ЖИ Бапкеріңізбін. Жаттығу техникасы, жаттығу жоспары, сетиялар, қайталаулар, созылу немесе қалпына келу туралы кез келген сұрақ қойыңыз!',
  },

  // Navigation additions
  'nav.athletes': {
    en: 'Athletes',
    ru: 'Атлеты',
    kk: 'Спортшылар',
  },

  // Theme support
  'theme.title': {
    en: 'Appearance',
    ru: 'Оформление',
    kk: 'Сыртқы түрі',
  },
  'theme.light': {
    en: 'Light Mode',
    ru: 'Светлая тема',
    kk: 'Ашық тақырып',
  },
  'theme.dark': {
    en: 'Dark Mode',
    ru: 'Тёмная тема',
    kk: 'Күңгірт тақырып',
  },
  'theme.switchToLight': {
    en: 'Switch to light mode',
    ru: 'Переключить на светлую тему',
    kk: 'Ашық тақырыпқа ауысу',
  },
  'theme.switchToDark': {
    en: 'Switch to dark mode',
    ru: 'Переключить на тёмную тему',
    kk: 'Күңгірт тақырыпқа ауысу',
  },

  // Trainer & Coach Hub
  'trainer.title': {
    en: 'Trainer Dashboard',
    ru: 'Кабинет тренера',
    kk: 'Бапкер кабинеті',
  },
  'trainer.subtitle': {
    en: 'Supervised athletes, movement telemetry & technique feedback',
    ru: 'Спортсмены, биомеханика движений и персональные отзывы',
    kk: 'Спортшылар, қозғалыс биомеханикасы және жеке пікірлер',
  },
  'trainer.activeAthletes': {
    en: 'Active Athletes',
    ru: 'Активные атлеты',
    kk: 'Белсенді спортшылар',
  },
  'trainer.searchPlaceholder': {
    en: 'Search athlete or sport...',
    ru: 'Поиск спортсмена или спорта...',
    kk: 'Спортшыны немесе спорт түрін іздеу...',
  },
  'trainer.noAthletes': {
    en: 'No connected athletes yet',
    ru: 'Подключённых атлетов пока нет',
    kk: 'Әзірге қосылған спортшылар жоқ',
  },
  'trainer.noAthletesDesc': {
    en: 'When athletes connect to your trainer account, their technique telemetry and workout history will appear here.',
    ru: 'Когда спортсмены подключатся к вашему аккаунту тренера, их тренировки и анализ техники появятся здесь.',
    kk: 'Спортшылар сіздің бапкерлік аккаунтыңызға қосылғанда, олардың жаттығулары мен техникалық талдауы осында шығады.',
  },
  'trainer.avgScore': {
    en: 'Avg Score',
    ru: 'Средний балл',
    kk: 'Орташа балл',
  },
  'trainer.assign': {
    en: 'Assign Workout',
    ru: 'Назначить',
    kk: 'Жаттығу тағайындау',
  },
  'trainer.viewDetails': {
    en: 'View Telemetry',
    ru: 'Подробнее',
    kk: 'Толығырақ',
  },
  'trainer.techniqueAlerts': {
    en: 'Technique Alerts',
    ru: 'Предупреждения по технике',
    kk: 'Техникалық ескертулер',
  },
  'trainer.noAlerts': {
    en: 'No active technique warnings.',
    ru: 'Нет активных предупреждений по технике.',
    kk: 'Белсенді техникалық ескертулер жоқ.',
  },
  'trainer.loading': {
    en: 'Loading supervised athlete roster & technique telemetry...',
    ru: 'Загрузка списка спортсменов и биомеханики...',
    kk: 'Спортшылар тізімі мен биомеханиканы жүктеу...',
  },
  'trainer.addFeedbackTab': {
    en: 'Add Feedback',
    ru: 'Добавить отзыв',
    kk: 'Пікір қосу',
  },
  'trainer.addNoteTab': {
    en: 'Add Note',
    ru: 'Добавить заметку',
    kk: 'Жазба қосу',
  },
  'trainer.addRecommendationTab': {
    en: 'Add Recommendation',
    ru: 'Добавить рекомендацию',
    kk: 'Ұсыныс қосу',
  },
  'trainer.feedbackPlaceholder': {
    en: 'Write personal observation, technique advice or recommendation (e.g. Keep your knees aligned with your feet during squats)...',
    ru: 'Напишите персональные наблюдения или совет (напр., Держите колени сонаправленно стопам во время приседаний)...',
    kk: 'Жеке бақылауыңызды немесе кеңесіңізді жазыңыз (мыс., Отырып-тұру кезінде тізелерді аяқ бағытымен тура ұстаңыз)...',
  },
  'trainer.sendFeedback': {
    en: 'Send to Athlete',
    ru: 'Отправить атлету',
    kk: 'Спортшыға жіберу',
  },
  'trainer.feedbackSaved': {
    en: 'Feedback successfully delivered to athlete',
    ru: 'Отзыв успешно передан спортсмену',
    kk: 'Пікір спортшыға сәтті жеткізілді',
  },
  'trainer.history': {
    en: 'Training History',
    ru: 'История тренировок',
    kk: 'Жаттығулар тарихы',
  },
  'trainer.deviations': {
    en: 'Detected Technique Problems',
    ru: 'Выявленные ошибки техники',
    kk: 'Анықталған техникалық қателер',
  },
  'trainer.noDeviations': {
    en: 'No frequent deviations detected. Form is consistent.',
    ru: 'Частых отклонений не обнаружено. Техника стабильна.',
    kk: 'Жиі қателер анықталмады. Техника тұрақты.',
  },

  // Athlete Trainer Feedback View
  'athleteFeedback.title': {
    en: 'Trainer Feedback & Notes',
    ru: 'Отзывы и рекомендации тренера',
    kk: 'Бапкердің пікірлері мен ұсыныстары',
  },
  'athleteFeedback.empty': {
    en: 'No notes from your trainer yet. Complete a workout to receive guidance!',
    ru: 'Заметок от тренера пока нет. Завершите тренировку, чтобы получить обратную связь!',
    kk: 'Бапкеріңізден әлі жазбалар жоқ. Пікір алу үшін жаттығуды орындаңыз!',
  },
  'athleteFeedback.noteBadge': {
    en: 'Note',
    ru: 'Заметка',
    kk: 'Жазба',
  },
  'athleteFeedback.recBadge': {
    en: 'Recommendation',
    ru: 'Рекомендация',
    kk: 'Ұсыныс',
  },
  'athleteFeedback.feedbackBadge': {
    en: 'Feedback',
    ru: 'Отзыв',
    kk: 'Пікір',
  },

  // Progress View
  'progress.subtitle': {
    en: 'Biomechanics and holistic readiness metrics',
    ru: 'Биомеханика и показатели готовности',
    kk: 'Биомеханика және дайындық көрсеткіштері',
  },
  'progress.avgScore': {
    en: 'Average Score',
    ru: 'Средний балл',
    kk: 'Орташа балл',
  },
  'progress.analyzedReps': {
    en: 'Analyzed Reps',
    ru: 'Проанализировано повторений',
    kk: 'Талданған қайталаулар',
  },
  'progress.acrossSessions': {
    en: 'Across sessions',
    ru: 'За все сессии',
    kk: 'Барлық сессиялар бойынша',
  },
  'progress.avgSymmetry': {
    en: 'Avg Symmetry',
    ru: 'Средняя симметрия',
    kk: 'Орташа симметрия',
  },
  'progress.optimalBalance': {
    en: 'Optimal Balance',
    ru: 'Оптимальный баланс',
    kk: 'Оңтайлы теңгерім',
  },
  'progress.readinessScore': {
    en: 'Readiness Score',
    ru: 'Индекс готовности',
    kk: 'Дайындық индексі',
  },
  'progress.readyHighLoad': {
    en: 'Ready for High Load',
    ru: 'Готов к нагрузкам',
    kk: 'Жоғары жүктемеге дайын',
  },
  'progress.techniqueTrend': {
    en: 'Technique Score Trend',
    ru: 'Динамика качества техники',
    kk: 'Техника сапасының динамикасы',
  },
  'progress.target': {
    en: 'Target: 85%+',
    ru: 'Цель: 85%+',
    kk: 'Мақсат: 85%+',
  },
  'progress.sessionHistory': {
    en: 'Session History',
    ru: 'История тренировок',
    kk: 'Жаттығулар тарихы',
  },
  'progress.noSessions': {
    en: 'No completed workouts yet. Start an exercise session to track technique progress!',
    ru: 'Пока нет завершённых тренировок. Начните упражнение для отслеживания прогресса техники!',
    kk: 'Әзірге аяқталған жаттығулар жоқ. Техника прогресін бақылау үшін жаттығуды бастаңыз!',
  },
  'progress.solidForm': {
    en: 'Solid Form',
    ru: 'Отличная техника',
    kk: 'Жақсы техника',
  },
  'progress.needsWork': {
    en: 'Needs Work',
    ru: 'Требует внимания',
    kk: 'Назар аудару керек',
  },
  'progress.vsLastWeek': {
    en: 'vs last week',
    ru: 'по сравнению с прошлой неделей',
    kk: 'өткен аптамен салыстырғанда',
  },

  // Nutrition View
  'nutrition.today': {
    en: 'Today\x27s Nutrition',
    ru: 'Питание за сегодня',
    kk: 'Бүгінгі тамақтану',
  },
  'nutrition.fat': {
    en: 'Fat',
    ru: 'Жиры',
    kk: 'Майлар',
  },
  'nutrition.fiber': {
    en: 'Fiber',
    ru: 'Клетчатка',
    kk: 'Талшық',
  },
  'nutrition.mealSaved': {
    en: 'Meal logged successfully!',
    ru: 'Приём пищи успешно записан!',
    kk: 'Тағам сәтті жазылды!',
  },
  'nutrition.history': {
    en: 'Recent Food Logs',
    ru: 'История питания',
    kk: 'Тамақтану тарихы',
  },
  'nutrition.noLogs': {
    en: 'No meals logged yet today.',
    ru: 'За сегодня пока нет записей о питании.',
    kk: 'Бүгінге әлі тағам жазбалары жоқ.',
  },

  // Sleep View
  'sleep.logTitle': {
    en: 'Log Sleep Session',
    ru: 'Записать сон',
    kk: 'Ұйқыны жазу',
  },
  'sleep.bedtime': {
    en: 'Bedtime',
    ru: 'Отход ко сну',
    kk: 'Ұйықтау уақыты',
  },
  'sleep.wakeUp': {
    en: 'Wake Up',
    ru: 'Подъём',
    kk: 'Ояну уақыты',
  },
  'sleep.quality': {
    en: 'Quality Rating',
    ru: 'Качество сна',
    kk: 'Ұйқы сапасы',
  },
  'sleep.feeling': {
    en: 'Morning Feeling',
    ru: 'Самочувствие утром',
    kk: 'Таңертеңгі сезім',
  },
  'sleep.refreshed': {
    en: 'Refreshed',
    ru: 'Бодрый',
    kk: 'Сергек',
  },
  'sleep.normal': {
    en: 'Normal',
    ru: 'Нормальное',
    kk: 'Қалыпты',
  },
  'sleep.tired': {
    en: 'Tired',
    ru: 'Уставший',
    kk: 'Шаршаған',
  },
  'sleep.saveSleep': {
    en: 'Log Sleep Record',
    ru: 'Сохранить запись сна',
    kk: 'Ұйқыны сақтау',
  },
  'sleep.savedSuccess': {
    en: 'Sleep record saved successfully!',
    ru: 'Сон успешно сохранён!',
    kk: 'Ұйқы сәтті сақталды!',
  },
  'sleep.pastHistory': {
    en: 'Past Sleep History',
    ru: 'История сна',
    kk: 'Ұйқы тарихы',
  },
  'sleep.noHistory': {
    en: 'No sleep logs recorded yet.',
    ru: 'Записей о сне пока нет.',
    kk: 'Ұйқы жазбалары әлі жоқ.',
  },
  'sleep.optimalRecovery': {
    en: 'Optimal Recovery',
    ru: 'Оптимальное восстановление',
    kk: 'Оңтайлы қалпына келу',
  },
  'sleep.needsRest': {
    en: 'Needs Rest',
    ru: 'Нужен отдых',
    kk: 'Демалыс қажет',
  },
  'sleep.goodRecovery': {
    en: 'Good Recovery',
    ru: 'Хорошее восстановление',
    kk: 'Жақсы қалпына келу',
  },
  'sleep.insightsNotice': {
    en: 'Insights & Tips',
    ru: 'Советы и рекомендации',
    kk: 'Кеңестер мен ұсыныстар',
  },
  'sleep.hoursShort': {
    en: 'h',
    ru: 'ч',
    kk: 'сағ',
  },
  'sleep.minsShort': {
    en: 'm',
    ru: 'мин',
    kk: 'мин',
  },

  // Auth additions
  'auth.trainerDesc': {
    en: 'Manage athletes, analyze biomechanics and send feedback',
    ru: 'Курируйте атлетов, анализируйте технику и давайте обратную связь',
    kk: 'Спортшыларды бақылау, техниканы талдау және кері байланыс беру',
  },
  'auth.athleteDesc': {
    en: 'Workout with AI camera, track nutrition, sleep and progress',
    ru: 'Тренируйтесь с ИИ камерой, следите за сном, питанием и прогрессом',
    kk: 'ЖИ камерасымен жаттығу, ұйқы, тамақтану және прогресті бақылау',
  },

  // Video Upload additions
  'video.back': {
    en: 'Back to Dashboard',
    ru: 'Назад на главную',
    kk: 'Басты бетке қайту',
  },
  'video.studioTitle': {
    en: 'Video Technique Analysis Studio',
    ru: 'Студия видеоанализа техники',
    kk: 'Техниканы бейнетаңдау студиясы',
  },
  'video.selectExercise': {
    en: 'Select Exercise to Analyze',
    ru: 'Выберите упражнение для анализа',
    kk: 'Талдау үшін жаттығуды таңдаңыз',
  },
  'video.dragDrop': {
    en: 'Drag & drop exercise video',
    ru: 'Перетащите видео с упражнением',
    kk: 'Жаттығу бейнесін осында сүйреңіз',
  },
  'video.formats': {
    en: 'Supports MP4, MOV, or WEBM format (recommended max duration: 60s).',
    ru: 'Поддерживаются форматы MP4, MOV или WEBM (рекомендуется до 60 сек).',
    kk: 'MP4, MOV немесе WEBM пішімдері (ұсынылатын ұзақтық: 60 сек дейін).',
  },
  'video.runAnalysis': {
    en: 'Run AI Technique Analysis',
    ru: 'Запустить ИИ анализ техники',
    kk: 'ЖИ техникалық талдауын бастау',
  },
  'video.analyzing': {
    en: 'Analyzing Kinematics & Pose Estimation...',
    ru: 'Анализ кинематики и скелетных точек...',
    kk: 'Кинематика мен дене нүктелерін талдау...',
  },
  'video.reportTitle': {
    en: 'Biomechanical Assessment Report',
    ru: 'Отчёт биомеханического анализа',
    kk: 'Биомеханикалық бағалау есебі',
  },
  'video.aiFeedback': {
    en: 'Automated Biomechanical Feedback',
    ru: 'Автоматический анализ техники от ИИ',
    kk: 'ЖИ автоматтандырылған техникалық пікірі',
  },

  // QR Code Trainer-Athlete Connection
  'qr.myCode': {
    en: 'My QR Code',
    ru: 'Мой QR-код',
    kk: 'Менің QR-кодым',
  },
  'qr.scanToConnect': {
    en: 'Scan to connect with me',
    ru: 'Отсканируйте, чтобы подключиться ко мне',
    kk: 'Маған қосылу үшін сканерлеңіз',
  },
  'qr.enlarge': {
    en: 'Enlarge QR',
    ru: 'Увеличить QR',
    kk: 'QR үлкейту',
  },
  'qr.shareLink': {
    en: 'Share Connection Link',
    ru: 'Поделиться ссылкой',
    kk: 'Сілтемені бөлісу',
  },
  'qr.copied': {
    en: 'Link Copied!',
    ru: 'Ссылка скопирована!',
    kk: 'Сілтеме көшірілді!',
  },
  'qr.copySuccess': {
    en: 'Trainer link copied to clipboard',
    ru: 'Ссылка на тренера скопирована в буфер обмена',
    kk: 'Бапкер сілтемесі алмасу буферіне көшірілді',
  },
  'qr.instruction': {
    en: 'Show this QR code to your athletes so they can scan it from their phone and connect directly to your coaching dashboard.',
    ru: 'Покажите этот QR-код вашим спортсменам: они смогут отсканировать его с телефона и сразу подключиться к вам.',
    kk: 'Бұл QR-кодты спортшыларыңызға көрсетіңіз: олар телефоннан сканерлеп, сіздің бапкерлік панеліңізге бірден қосылады.',
  },
  'qr.connectTitle': {
    en: 'Connect with Trainer',
    ru: 'Подключение к тренеру',
    kk: 'Бапкерге қосылу',
  },
  'qr.scanInstruction': {
    en: 'Point your camera at your trainer’s SportX QR code',
    ru: 'Наведите камеру на QR-код вашего тренера в SportX',
    kk: 'Камераны бапкеріңіздің SportX QR-кодына бағыттаңыз',
  },
  'qr.manualPrompt': {
    en: 'Or enter trainer code manually',
    ru: 'Или введите код тренера вручную',
    kk: 'Немесе бапкер кодын қолмен енгізіңіз',
  },
  'qr.confirmConnect': {
    en: 'Connect with {name}?',
    ru: 'Подключиться к тренеру {name}?',
    kk: '{name} бапкеріне қосылу керек пе?',
  },
  'qr.connectBtn': {
    en: 'Connect',
    ru: 'Подключиться',
    kk: 'Қосылу',
  },
  'qr.connectedSuccess': {
    en: 'Connected with Trainer!',
    ru: 'Вы успешно подключились к тренеру!',
    kk: 'Бапкерге сәтті қосылдыңыз!',
  },
  'qr.viewProfile': {
    en: 'View Trainer',
    ru: 'Профиль тренера',
    kk: 'Бапкер профилі',
  },
  'qr.openChat': {
    en: 'Message Trainer',
    ru: 'Написать тренеру',
    kk: 'Бапкерге хат жазу',
  },
  'qr.myTrainer': {
    en: 'My Trainer',
    ru: 'Мой тренер',
    kk: 'Менің бапкерім',
  },
  'qr.noTrainer': {
    en: 'No Trainer Connected',
    ru: 'Тренер не подключен',
    kk: 'Бапкер қосылмаған',
  },
  'qr.connectPrompt': {
    en: 'Connect with your coach to receive direct biomechanical feedback, video reviews, and customized plans.',
    ru: 'Подключите личного тренера, чтобы получать персональные замечания по технике, разбор видео и индивидуальные планы.',
    kk: 'Техника бойынша тікелей пікірлер, бейне талдаулар және жеке бағдарламалар алу үшін бапкеріңізге қосылыңыз.',
  },
  'qr.connectNow': {
    en: 'Connect with Trainer',
    ru: 'Подключить тренера',
    kk: 'Бапкерді қосу',
  },
  'qr.changeTrainer': {
    en: 'Change / Connect Another Trainer',
    ru: 'Сменить / подключить тренера',
    kk: 'Бапкерді ауыстыру / қосу',
  },
  'qr.disconnect': {
    en: 'Disconnect',
    ru: 'Отключиться',
    kk: 'Ажырату',
  },
  'qr.confirmDisconnect': {
    en: 'Are you sure you want to disconnect from this trainer?',
    ru: 'Вы уверены, что хотите отключиться от этого тренера?',
    kk: 'Бұл бапкерден ажыратуды растайсыз ба?',
  },
  'qr.cameraAccessError': {
    en: 'Unable to access device camera. Please grant camera permission or enter the code manually.',
    ru: 'Не удалось получить доступ к камере. Пожалуйста, разрешите доступ к камере или введите код вручную.',
    kk: 'Камераға қол жеткізу мүмкін болмады. Камераға рұқсат беріңіз немесе кодты қолмен енгізіңіз.',
  },
  'qr.enterTrainerIdPlaceholder': {
    en: 'Paste trainer code or ID here...',
    ru: 'Вставьте код или ID тренера...',
    kk: 'Бапкер кодын немесе ID осында жазыңыз...',
  },
  'qr.findTrainer': {
    en: 'Find Trainer',
    ru: 'Найти тренера',
    kk: 'Бапкерді табу',
  },
};

export const getTranslation = (key: string, lang: Language): string => {
  const item = translations[key];
  if (!item) return key;
  return item[lang] || item['en'] || key;
};
