# -*- coding: utf-8 -*-
import json
import os

from categories_data import CATEGORIES
from exercises_part1 import EXERCISES_PART1
from exercises_part1_back import EXERCISES_BACK
from exercises_part2 import EXERCISES_PART2
from exercises_part3 import EXERCISES_PART3
from exercises_part4_core import EXERCISES_CORE
from exercises_part4_legs import EXERCISES_LEGS
from exercises_part5 import EXERCISES_PART5
from additional_exercises import ADDITIONAL_EXERCISES

# Additional rich exercises to complete full 60+ catalog across all equipment & categories
EXTRA_EXERCISES = [
    # Chest
    {
        'category_id': 1,
        'category_name': 'Chest',
        'slug': 'resistance_band_pushup',
        'name': 'Resistance Band Push-up',
        'name_en': 'Resistance Band Push-up',
        'name_ru': 'Отжимания с фитнес-резинкой',
        'name_kk': 'Резеңке таспамен сығылу',
        'target_muscles': 'Pectoralis Major, Triceps',
        'target_muscles_en': 'Pectoralis Major, Triceps Brachii',
        'target_muscles_ru': 'Большая грудная, трицепс',
        'target_muscles_kk': 'Үлкен кеуде бұлшықеті, трицепс',
        'secondary_muscles_en': 'Core, Anterior Deltoids',
        'secondary_muscles_ru': 'Мышцы кора, передняя дельта',
        'secondary_muscles_kk': 'Кор, алдыңғы дельта',
        'equipment': 'Resistance Bands',
        'equipment_en': 'Resistance Band',
        'equipment_ru': 'Фитнес-резинка',
        'equipment_kk': 'Резеңке таспа',
        'difficulty': 'Intermediate',
        'difficulty_en': 'Intermediate',
        'difficulty_ru': 'Средний',
        'difficulty_kk': 'Орташа',
        'description': 'Accommodating resistance push-up increasing lockout chest tension.',
        'description_en': 'Accommodating resistance push-up increasing pectoral lockout tension.',
        'description_ru': 'Отжимания с дополнительным нарастающим сопротивлением резиновой ленты в верхней точке.',
        'description_kk': 'Жоғарғы нүктеде кеудеге түсетін салмақты арттыратын резеңкемен сығылу.',
        'starting_position_en': 'Loop resistance band across upper back and hold ends under palms in high plank.',
        'starting_position_ru': 'Накиньте резинку на верх спины, прижмите концы ладонями к полу в упоре лежа.',
        'starting_position_kk': 'Резеңкені арқаға кигізіп, екі ұшын алақанмен еденге басып планкаға тұрыңыз.',
        'instructions_en': '1. Lower chest under control to floor against reducing band tension.\n2. Drive powerfully upward through increasing band resistance to full lockout.\n3. Keep core rigid throughout.',
        'instructions_ru': '1. Плавно опуститесь к полу.\n2. Мощно выжмите себя вверх против возрастающего сопротивления ленты.\n3. Держите корпус ровно.',
        'instructions_kk': '1. Кеудені еденге баяу түсіріңіз.\n2. Резеңке қарсылығына қарсы жоғары қарай күшпен итеріліңіз.\n3. Денені түзу ұстаңыз.',
        'breathing_en': 'Inhale down; exhale powerfully on press.',
        'breathing_ru': 'Вдох вниз; мощный выдох вверх.',
        'breathing_kk': 'Төменде тыныс алыңыз; жоғарыда тыныс шығарыңыз.',
        'common_mistakes_en': 'Sagging hips, letting band slip off back.',
        'common_mistakes_ru': 'Провисание таза, соскальзывание ленты.',
        'common_mistakes_kk': 'Белдің салбырауы, резеңкенің сырғып кетуі.',
        'camera_angle_en': 'Side View (90°)',
        'camera_angle_ru': 'Вид сбоку (90°)',
        'camera_angle_kk': 'Бүйірден көрініс (90°)',
        'camera_height_en': 'Floor Level',
        'camera_height_ru': 'На уровне пола',
        'camera_height_kk': 'Еден деңгейінде',
        'camera_distance_en': '2.5 meters',
        'camera_distance_ru': '2.5 метра',
        'camera_distance_kk': '2.5 метр',
        'body_visibility_en': 'Full body plank profile in frame',
        'body_visibility_ru': 'Тело в планке полностью в кадре',
        'body_visibility_kk': 'Планкадағы толық дене көрінуі керек',
        'camera_instructions_en': 'Position camera horizontally at ground level.',
        'camera_instructions_ru': 'Установите камеру на полу сбоку.',
        'camera_instructions_kk': 'Камераны еденге бүйір жақтан қойыңыз.',
        'youtube_id': 'IODxDxX7oi4',
        'video_url': 'https://www.youtube.com/watch?v=IODxDxX7oi4',
        'ideal_rom_degrees': 90.0,
        'normative_cadence_seconds': 2.5,
        'analysis_supported': False,
    },
    # Back / Lats
    {
        'category_id': 2,
        'category_name': 'Back',
        'slug': 'seated_cable_row',
        'name': 'Seated Cable Row',
        'name_en': 'Seated Cable Row',
        'name_ru': 'Горизонтальная тяга блока к поясу сидя',
        'name_kk': 'Отырып блокты белге тарту',
        'target_muscles': 'Rhomboids, Latissimus Dorsi, Traps',
        'target_muscles_en': 'Rhomboids, Latissimus Dorsi, Middle Trapezius',
        'target_muscles_ru': 'Ромбовидные, широчайшие, средняя трапеция',
        'target_muscles_kk': 'Ромб тәрізді, жалпақ бұлшықеттер, трапеция',
        'secondary_muscles_en': 'Biceps Brachii, Posterior Deltoids',
        'secondary_muscles_ru': 'Бицепсы, задние дельты',
        'secondary_muscles_kk': 'Бицепстер, артқы дельталар',
        'equipment': 'Cables',
        'equipment_en': 'Seated Cable Row Machine',
        'equipment_ru': 'Блочный тренажер горизонтальной тяги',
        'equipment_kk': 'Көлденең блокты тарту тренажеры',
        'difficulty': 'Beginner',
        'difficulty_en': 'Beginner',
        'difficulty_ru': 'Начинающий',
        'difficulty_kk': 'Бастаушы',
        'description': 'Horizontal cable row building mid-back thickness, posture, and scapular retraction.',
        'description_en': 'Horizontal pulling machine exercise developing dense mid-back musculature and scapular retraction.',
        'description_ru': 'Базовое движение на блоке для развития толщины середины спины и ровной осанки.',
        'description_kk': 'Арқаның ортаңғы бөлігін қалыңдатуға және жауырынды жиыруға арналған жаттығу.',
        'starting_position_en': 'Sit with feet on footrests, knees slightly bent, back straight, holding V-handle with arms extended.',
        'starting_position_ru': 'Сядьте, упритесь стопами в подставки, колени чуть согнуты. Спина прямая, руки вытянуты вперед.',
        'starting_position_kk': 'Тіреуішке аяқты қойып отырыңыз, тізе сәл бүгілген. Арқа түзу, қол алға созылған.',
        'instructions_en': '1. Pull handle into lower abdomen while driving elbows back.\n2. Retract shoulder blades firmly and pause 1 second.\n3. Release slowly forward to a full lat stretch without excessive forward rounding.',
        'instructions_ru': '1. Тяните рукоять к низу живота, уводя локти назад.\n2. Мощно сведите лопатки и удержите 1 секунду.\n3. Плавно вернитесь вперед до растяжения широчайших.',
        'instructions_kk': '1. Шынтақты артқа бағыттап, тұтқаны іштің төменгі жағына тартыңыз.\n2. Жауырынды 1 секунд жиырып ұстаңыз.\n3. Қолды баяу алға созып бастапқы қалыпқа қайтыңыз.',
        'breathing_en': 'Exhale on the pull; inhale as weight extends forward.',
        'breathing_ru': 'Выдох при тяге к себе; вдох при возврате вперед.',
        'breathing_kk': 'Өзіңізге тартқанда тыныс шығарыңыз; алға жібергенде тыныс алыңыз.',
        'common_mistakes_en': 'Rocking excessively back and forth with lower back, shrugging shoulders up.',
        'common_mistakes_ru': 'Сильная раскачка корпусом вперед-назад, подъем плеч к ушам.',
        'common_mistakes_kk': 'Денемен алға-артқа қатты шайқалу, иықты көтеру.',
        'camera_angle_en': 'Side View (90°)',
        'camera_angle_ru': 'Вид сбоку (90°)',
        'camera_angle_kk': 'Бүйірден көрініс (90°)',
        'camera_height_en': 'Chest Height',
        'camera_height_ru': 'На уровне груди',
        'camera_height_kk': 'Кеуде деңгейінде',
        'camera_distance_en': '2.5 meters',
        'camera_distance_ru': '2.5 метра',
        'camera_distance_kk': '2.5 метр',
        'body_visibility_en': 'Torso, machine, and cable path must be framed',
        'body_visibility_ru': 'Корпус, тренажер и трос в кадре',
        'body_visibility_kk': 'Дене, тренажер және трос анық көрінуі керек',
        'camera_instructions_en': 'Position camera from the side to check upright spine neutrality.',
        'camera_instructions_ru': 'Установите камеру сбоку для контроля неподвижности поясницы.',
        'camera_instructions_kk': 'Белдің түзулігін бақылау үшін камераны бүйірден қойыңыз.',
        'youtube_id': 'GZbfZ033f74',
        'video_url': 'https://www.youtube.com/watch?v=GZbfZ033f74',
        'ideal_rom_degrees': 90.0,
        'normative_cadence_seconds': 2.5,
        'analysis_supported': False,
    },
    # Shoulders
    {
        'category_id': 6,
        'category_name': 'Shoulders',
        'slug': 'arnold_press',
        'name': 'Dumbbell Arnold Press',
        'name_en': 'Dumbbell Arnold Press',
        'name_ru': 'Жим Арнольда с гантелями',
        'name_kk': 'Арнольд жимі (гантельмен)',
        'target_muscles': 'Anterior & Lateral Deltoids',
        'target_muscles_en': 'Anterior & Lateral Deltoids',
        'target_muscles_ru': 'Передняя и средняя дельтовидные мышцы',
        'target_muscles_kk': 'Алдыңғы және ортаңғы дельталар',
        'secondary_muscles_en': 'Triceps Brachii, Upper Traps',
        'secondary_muscles_ru': 'Трицепс, верх трапеции',
        'secondary_muscles_kk': 'Трицепс, жоғарғы трапеция',
        'equipment': 'Dumbbells',
        'equipment_en': 'Dumbbells & Bench',
        'equipment_ru': 'Гантели и скамья',
        'equipment_kk': 'Гантельдер және орындық',
        'difficulty': 'Intermediate',
        'difficulty_en': 'Intermediate',
        'difficulty_ru': 'Средний',
        'difficulty_kk': 'Орташа',
        'description': 'Rotational overhead shoulder press hitting all 3 deltoid heads through continuous rotation.',
        'description_en': 'Rotational overhead shoulder press hitting anterior and lateral deltoid heads.',
        'description_ru': 'Жимовое упражнение с вращением кистей для комплексной проработки всех пучков дельт.',
        'description_kk': 'Қолды айналдыра көтеретін иықтың барлық бөліктерін дамытатын жаттығу.',
        'starting_position_en': 'Sit with dumbbells at chest height, palms facing toward you (supinated), elbows tucked in.',
        'starting_position_ru': 'Сядьте, гантели перед грудью, ладони развернуты к себе, локти прижаты к корпусу.',
        'starting_position_kk': 'Отырып, гантельдерді кеуде алдында ұстаңыз, алақан өзіңізге қараған.',
        'instructions_en': '1. Press dumbbells upward while rotating wrists outwards 180 degrees.\n2. At top lockout, palms face forward.\n3. Reverse rotation smoothly on descent back to starting position.',
        'instructions_ru': '1. Выжимайте гантели вверх, одновременно разворачивая кисти наружу на 180°.\n2. В верхней точке ладони смотрят вперед.\n3. Плавно вернитесь вниз с обратным разворотом кистей.',
        'instructions_kk': '1. Гантельдерді жоғары көтере отырып, білекті 180 градусқа сыртқа бұрыңыз.\n2. Жоғарғы нүктеде алақан алға қарайды.\n3. Бастапқы қалыпқа баяу қайтыңыз.',
        'breathing_en': 'Exhale on the upward rotational press; inhale on descent.',
        'breathing_ru': 'Выдох при жиме вверх; вдох при опускании.',
        'breathing_kk': 'Жоғары көтергенде тыныс шығарыңыз; түсіргенде тыныс алыңыз.',
        'common_mistakes_en': 'Jerking dumbbells, overarching lower back, rotating too late at the top.',
        'common_mistakes_ru': 'Резкие рывки, сильный прогиб в пояснице, запоздалый разворот кистей.',
        'common_mistakes_kk': 'Жұлқып көтеру, белді қайқайту, білекті кеш бұру.',
        'camera_angle_en': 'Front View (0°)',
        'camera_angle_ru': 'Вид спереди (0°)',
        'camera_angle_kk': 'Алдыңғы көрініс (0°)',
        'camera_height_en': 'Chest Height',
        'camera_height_ru': 'На уровне груди',
        'camera_height_kk': 'Кеуде деңгейінде',
        'camera_distance_en': '2.5 meters',
        'camera_distance_ru': '2.5 метра',
        'camera_distance_kk': '2.5 метр',
        'body_visibility_en': 'Upper body, arms, and overhead reach in frame',
        'body_visibility_ru': 'Верхняя часть тела и руки над головой в кадре',
        'body_visibility_kk': 'Дененің жоғарғы бөлігі мен көтерілген қолдар көрінуі керек',
        'camera_instructions_en': 'Position camera directly in front to observe bilateral wrist rotation symmetry.',
        'camera_instructions_ru': 'Установите камеру спереди для контроля синхронности вращения кистей.',
        'camera_instructions_kk': 'Екі қолдың бірдей айналуын көру үшін камераны алдыңыздан қойыңыз.',
        'youtube_id': '2yjwHevKmT0',
        'video_url': 'https://www.youtube.com/watch?v=2yjwHevKmT0',
        'ideal_rom_degrees': 160.0,
        'normative_cadence_seconds': 3.0,
        'analysis_supported': False,
    },
    # Quadriceps & Legs
    {
        'category_id': 19,
        'category_name': 'Quadriceps',
        'slug': 'goblet_squat',
        'name': 'Dumbbell Goblet Squat',
        'name_en': 'Dumbbell Goblet Squat',
        'name_ru': 'Гоблет-приседания с гантелью / гирей',
        'name_kk': 'Гоблет-отыру (гантельмен / гирмен)',
        'target_muscles': 'Quadriceps, Glutes, Core',
        'target_muscles_en': 'Quadriceps, Glutes, Core Stabilizers',
        'target_muscles_ru': 'Квадрицепсы, ягодицы, кор',
        'target_muscles_kk': 'Квадрицепстер, бөксе, кор',
        'secondary_muscles_en': 'Adductors, Calves',
        'secondary_muscles_ru': 'Приводящие, икры',
        'secondary_muscles_kk': 'Жанастырушы, балтыр',
        'equipment': 'Dumbbells',
        'equipment_en': 'Dumbbell / Kettlebell',
        'equipment_ru': 'Гантель / гиря',
        'equipment_kk': 'Гантель / гир',
        'difficulty': 'Beginner',
        'difficulty_en': 'Beginner',
        'difficulty_ru': 'Начинающий',
        'difficulty_kk': 'Бастаушы',
        'description': 'Front-loaded squat teaching upright torso mechanics and deep hip mobility.',
        'description_en': 'Front-loaded squat variation reinforcing upright torso mechanics and deep hip mobility.',
        'description_ru': 'Отличное упражнение для отработки глубокого приседа с вертикальной спиной и подвижности таза.',
        'description_kk': 'Арқаны тік ұстап терең отыруды үйрететін тиімді жаттығу.',
        'starting_position_en': 'Hold dumbbell vertically against chest with both hands under bell. Feet shoulder-width, toes turned out 15°.',
        'starting_position_ru': 'Удерживайте гантель вертикально обеими руками у груди. Стопы на ширине плеч, носки развернуты на 15°.',
        'starting_position_kk': 'Гантельді екі қолмен кеуде тұсында тік ұстаңыз. Аяқ иық енінде, ұшы 15° сыртқа.',
        'instructions_en': '1. Sit down between knees, keeping chest tall and elbows inside knees at bottom.\n2. Descend until thighs pass parallel.\n3. Drive through midfoot to stand up tall.',
        'instructions_ru': '1. Опускайтесь вниз между коленями, держа спину вертикально.\n2. Присядьте до параллели или глубже.\n3. Оттолкнитесь стопами и вернитесь вверх.',
        'instructions_kk': '1. Арқаны тік ұстап, тізелер арасына қарай отырыңыз.\n2. Сан параллельден төмен түскенше отырыңыз.\n3. Табанмен итеріліп, тік тұрыңыз.',
        'breathing_en': 'Inhale down; exhale up.',
        'breathing_ru': 'Вдох вниз; выдох вверх.',
        'breathing_kk': 'Төмен түскенде тыныс алыңыз; көтерілгенде тыныс шығарыңыз.',
        'common_mistakes_en': 'Rounding upper back, letting elbows flare outside knees, rising onto toes.',
        'common_mistakes_ru': 'Скругление спины, завал на носки, сведение коленей.',
        'common_mistakes_kk': 'Арқаны бүкірейту, өкшені көтеру, тізені ішке майыстыру.',
        'camera_angle_en': 'Side View (90°)',
        'camera_angle_ru': 'Вид сбоку (90°)',
        'camera_angle_kk': 'Бүйірден көрініс (90°)',
        'camera_height_en': 'Hip Height',
        'camera_height_ru': 'На уровне бедер',
        'camera_height_kk': 'Жамбас деңгейінде',
        'camera_distance_en': '2.5 - 3.5 meters',
        'camera_distance_ru': '2.5 - 3.5 метра',
        'camera_distance_kk': '2.5 - 3.5 метр',
        'body_visibility_en': 'Full body from head to feet in frame',
        'body_visibility_ru': 'Все тело в полный рост в кадре',
        'body_visibility_kk': 'Бастан аяққа дейін толық көрінуі тиіс',
        'camera_instructions_en': 'Position camera from the side to check upright spine and knee depth.',
        'camera_instructions_ru': 'Установите камеру сбоку для контроля вертикали спины и глубины приседа.',
        'camera_instructions_kk': 'Арқа түзулігі мен отыру тереңдігін көру үшін камераны бүйірден қойыңыз.',
        'youtube_id': 'aclH2T8NY5I',
        'video_url': 'https://www.youtube.com/watch?v=aclH2T8NY5I',
        'ideal_rom_degrees': 90.0,
        'normative_cadence_seconds': 2.5,
        'analysis_supported': False,
    },
    # Leg Extension Machine
    {
        'category_id': 19,
        'category_name': 'Quadriceps',
        'slug': 'leg_extension_machine',
        'name': 'Leg Extension Machine',
        'name_en': 'Leg Extension Machine',
        'name_ru': 'Разгибание ног в тренажере сидя',
        'name_kk': 'Тренажерде отырып аяқты жазу (квадрицепс)',
        'target_muscles': 'Quadriceps (Rectus Femoris, Vastus Lateralis)',
        'target_muscles_en': 'Quadriceps (Direct Isolation)',
        'target_muscles_ru': 'Квадрицепсы (изолированная нагрузка)',
        'target_muscles_kk': 'Квадрицепстер (оқшауланған күш)',
        'secondary_muscles_en': 'Tibialis Anterior',
        'secondary_muscles_ru': 'Передняя большеберцовая мышца',
        'secondary_muscles_kk': 'Алдыңғы асықты жілік бұлшықеті',
        'equipment': 'Machines',
        'equipment_en': 'Leg Extension Machine',
        'equipment_ru': 'Тренажер для разгибания ног',
        'equipment_kk': 'Аяқты жазу тренажеры',
        'difficulty': 'Beginner',
        'difficulty_en': 'Beginner',
        'difficulty_ru': 'Начинающий',
        'difficulty_kk': 'Бастаушы',
        'description': 'Pure isolated knee extension focusing high tension on quadriceps teardrop and rectus femoris.',
        'description_en': 'Pure isolated knee extension focusing high tension on all 4 quadriceps heads.',
        'description_ru': 'Изолированное упражнение на тренажере для детальной прорисовки и накачки квадрицепсов.',
        'description_kk': 'Квадрицепсті оқшаулап қатайтуға және пішінін айқындауға арналған тренажер жаттығуы.',
        'starting_position_en': 'Sit with back against pad, knees aligned with machine pivot point. Shin pad rests just above ankles.',
        'starting_position_ru': 'Сядьте, плотно прижав спину к подушке. Колени на оси вращения тренажера. Валик на нижней части голени.',
        'starting_position_kk': 'Арқаны нық басып отырыңыз. Тізе тренажер осімен бір сызықта. Тіреуіш толарсақ үстінде.',
        'instructions_en': '1. Grip handles on the sides.\n2. Extend legs smoothly until knees are nearly fully extended.\n3. Hold peak contraction for 1 second.\n4. Lower weight under 2-second control without letting stack slam.',
        'instructions_ru': '1. Возьмитесь за боковые рукояти.\n2. Разгибайте ноги вверх силой квадрицепсов.\n3. Зафиксируйте пиковое напряжение вверху на 1 секунду.\n4. Плавно опустите ноги за 2 секунды.',
        'instructions_kk': '1. Бүйірлік тұтқаларды ұстаңыз.\n2. Квадрицепс күшімен аяқты жоғары қарай толық жазыңыз.\n3. Жоғарғы нүктеде 1 секунд қатайтып ұстаңыз.\n4. Баяу төмен түсіріңіз.',
        'breathing_en': 'Exhale on extension; inhale on lowering.',
        'breathing_ru': 'Выдох при разгибании; вдох при опускании.',
        'breathing_kk': 'Жазғанда тыныс шығарыңыз; бүккенде тыныс алыңыз.',
        'common_mistakes_en': 'Kicking weight up with momentum, lifting hips off seat, slamming weights.',
        'common_mistakes_ru': 'Резкие рывки ногами, отрыв таза от сиденья, бросок веса.',
        'common_mistakes_kk': 'Аяқты сермеп көтеру, бөксені орындықтан көтеру, салмақты тастай салу.',
        'camera_angle_en': 'Side View (90°)',
        'camera_angle_ru': 'Вид сбоку (90°)',
        'camera_angle_kk': 'Бүйірден көрініс (90°)',
        'camera_height_en': 'Knee Height',
        'camera_height_ru': 'На уровне коленей',
        'camera_height_kk': 'Тізе деңгейінде',
        'camera_distance_en': '2.0 - 2.8 meters',
        'camera_distance_ru': '2.0 - 2.8 метра',
        'camera_distance_kk': '2.0 - 2.8 метр',
        'body_visibility_en': 'Machine, legs, and knee angle in frame',
        'body_visibility_ru': 'Тренажер, ноги и угол коленей в кадре',
        'body_visibility_kk': 'Тренажер, аяқтар және тізе бұрышы көрінуі тиіс',
        'camera_instructions_en': 'Position camera from the side to verify full knee extension and steady cadence.',
        'camera_instructions_ru': 'Установите камеру сбоку для контроля полного выпрямления ног.',
        'camera_instructions_kk': 'Аяқтың толық жазылуын бақылау үшін камераны бүйірден қойыңыз.',
        'youtube_id': 'YyvSfV510ok',
        'video_url': 'https://www.youtube.com/watch?v=YyvSfV510ok',
        'ideal_rom_degrees': 90.0,
        'normative_cadence_seconds': 2.5,
        'analysis_supported': False,
    },
    # Cardio: Mountain Climbers
    {
        'category_id': 25,
        'category_name': 'Cardio',
        'slug': 'mountain_climbers',
        'name': 'Speed Mountain Climbers',
        'name_en': 'Speed Mountain Climbers',
        'name_ru': 'Упражнение Скалолаз (Mountain Climbers)',
        'name_kk': 'Тауға өрмелеуші жаттығуы (Mountain Climbers)',
        'target_muscles': 'Cardiovascular System, Core, Hip Flexors',
        'target_muscles_en': 'Cardiovascular Endurance, Core, Hip Flexors',
        'target_muscles_ru': 'Сердечно-сосудистая система, кор, сгибатели бедер',
        'target_muscles_kk': 'Жүрек-қан тамырлары, кор, жамбас бұлшықеттері',
        'secondary_muscles_en': 'Shoulders, Quadriceps, Calves',
        'secondary_muscles_ru': 'Плечи, квадрицепсы, икры',
        'secondary_muscles_kk': 'Иық, квадрицепс, балтыр',
        'equipment': 'Bodyweight',
        'equipment_en': 'Bodyweight',
        'equipment_ru': 'Свой вес',
        'equipment_kk': 'Өз салмағы',
        'difficulty': 'Beginner',
        'difficulty_en': 'Beginner',
        'difficulty_ru': 'Начинающий',
        'difficulty_kk': 'Бастаушы',
        'description': 'High-tempo dynamic plank drill firing up heart rate and core stabilizers.',
        'description_en': 'High-intensity dynamic plank exercise boosting cardiovascular conditioning and core endurance.',
        'description_ru': 'Динамическое упражнение в планке для интенсивного сжигания калорий и укрепления пресса.',
        'description_kk': 'Жүрек соғысын жеделдетуге және іш бұлшықеттерін қатайтуға арналған қарқынды планка жаттығуы.',
        'starting_position_en': 'Start in a rigid high plank position with hands under shoulders, glutes tight, neutral head.',
        'starting_position_ru': 'Упор лежа на прямых руках, ладони под плечами, тело образует прямую линию.',
        'starting_position_kk': 'Қолға сүйеніп түзу планкаға тұрыңыз, алақан иық астында, дене түзу.',
        'instructions_en': '1. Drive right knee rapidly forward toward chest without letting hips bounce up.\n2. Quickly switch legs in a running cadence, driving left knee forward as right returns.\n3. Maintain rapid, rhythmic pace while keeping shoulders stable over hands.',
        'instructions_ru': '1. Быстро подтяните правое колено к груди, не задирая таз вверх.\n2. В прыжке смените ноги, подтягивая левое колено к груди.\n3. Сохраняйте быстрый непрерывный беговой ритм, удерживая плечи над ладонями.',
        'instructions_kk': '1. Жамбасты көтермей, оң тізені кеудеге қарай жылдам тартыңыз.\n2. Аяқтарды кезек-кезек ауыстырып, жүгіру ырғағымен сол тізені тартыңыз.\n3. Денені түзу ұстап, қарқынды ырғақты сақтаңыз.',
        'breathing_en': 'Rhythmic continuous breathing synchronized with alternating knee drives.',
        'breathing_ru': 'Ритмичное частое дыхание в такт смене ног.',
        'breathing_kk': 'Аяқ қозғалысымен бірге ырғақты тыныс алыңыз.',
        'common_mistakes_en': 'Piking hips up toward ceiling, bouncing upper body, letting hands slide forward.',
        'common_mistakes_ru': 'Задирание таза вверх домиком, подпрыгивание корпусом, увод плеч назад от ладоней.',
        'common_mistakes_kk': 'Жамбасты жоғары көтеріп кету, денені селкілдету.',
        'camera_angle_en': 'Side View (90°)',
        'camera_angle_ru': 'Вид сбоку (90°)',
        'camera_angle_kk': 'Бүйірден көрініс (90°)',
        'camera_height_en': 'Floor Level',
        'camera_height_ru': 'На уровне пола',
        'camera_height_kk': 'Еден деңгейінде',
        'camera_distance_en': '2.0 - 3.0 meters',
        'camera_distance_ru': '2.0 - 3.0 метра',
        'camera_distance_kk': '2.0 - 3.0 метр',
        'body_visibility_en': 'Full lateral plank profile and running legs must be in frame',
        'body_visibility_ru': 'Тело в планке сбоку и ноги в движении должны быть в кадре',
        'body_visibility_kk': 'Планкадағы толық дене мен аяқ қозғалысы анық көрінуі тиіс',
        'camera_instructions_en': 'Position camera horizontally at ground level to monitor flat back alignment.',
        'camera_instructions_ru': 'Установите камеру на полу сбоку для контроля стабильной высоты таза.',
        'camera_instructions_kk': 'Жамбас биіктігінің тұрақтылығын көру үшін камераны еденге бүйірден қойыңыз.',
        'youtube_id': 'nmwgirgXLYM',
        'video_url': 'https://www.youtube.com/watch?v=nmwgirgXLYM',
        'ideal_rom_degrees': 90.0,
        'normative_cadence_seconds': 0.8,
        'analysis_supported': False,
    }
]

all_exercises = []
seen_slugs = set()

AI_SUPPORTED_SLUGS = {
    'squat', 'barbell_squat', 'goblet_squat',
    'pushup', 'push_up', 'push-up', 'resistance_band_pushup',
    'pullup', 'pull_up', 'pull-up', 'chinup', 'chin_up',
    'bicep_curl', 'bicep-curl', 'dumbbell_curl', 'barbell_bicep_curl', 'hammer_curl',
    'shoulder_press', 'overhead_press', 'military_press', 'arnold_press',
    'plank', 'forearm_plank', 'side_plank', 'copenhagen_plank',
    'lunge', 'bulgarian_split_squat', 'walking_lunges', 'split_squat',
    'lateral_raise', 'dumbbell_lateral_raise', 'cable_lateral_raise', 'side_lateral_raise'
}

# Combine lists in priority order
for ex_list in [ADDITIONAL_EXERCISES, EXERCISES_PART1, EXERCISES_BACK, EXERCISES_PART2, EXERCISES_PART3, EXERCISES_CORE, EXERCISES_LEGS, EXERCISES_PART5, EXTRA_EXERCISES]:
    for ex in ex_list:
        slug = ex['slug']
        if slug in AI_SUPPORTED_SLUGS:
            ex['analysis_supported'] = True
            ex['analysis_available'] = True
        if slug not in seen_slugs:
            seen_slugs.add(slug)
            all_exercises.append(ex)

# Re-index IDs consecutively
for i, ex in enumerate(all_exercises, start=1):
    ex['id'] = i

print(f'Catalog assembled: {len(CATEGORIES)} categories and {len(all_exercises)} exercises.')

# 1. Output frontend/src/services/exerciseData.ts
ts_content = 'import { Exercise, ExerciseCategory } from \'../types\';\n\nexport const FALLBACK_CATEGORIES: ExerciseCategory[] = ' + json.dumps(CATEGORIES, ensure_ascii=False, indent=2) + ';\n\nexport const FALLBACK_EXERCISES: Exercise[] = ' + json.dumps(all_exercises, ensure_ascii=False, indent=2) + ';\n'

with open('frontend/src/services/exerciseData.ts', 'w', encoding='utf-8') as f_ts:
    f_ts.write(ts_content)
print('Successfully generated frontend/src/services/exerciseData.ts')

# 2. Output supabase/migrations/20260831_expanded_exercise_library.sql
sql_lines = [
    '-- ==============================================================================',
    '-- SPORTX EXPANDED TRILINGUAL EXERCISE LIBRARY MIGRATION',
    '-- File: supabase/migrations/20260831_expanded_exercise_library.sql',
    '-- Description: 26 muscle group categories and complete trilingual exercises',
    '-- ==============================================================================',
    '',
    '-- 1. Ensure Table Schema has All Multi-language & Biomechanics Columns',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS name_en TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS name_ru TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS name_kk TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS description_en TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS description_ru TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS description_kk TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS starting_position_en TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS starting_position_ru TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS starting_position_kk TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS instructions_en TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS instructions_ru TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS instructions_kk TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS breathing_en TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS breathing_ru TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS breathing_kk TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS common_mistakes_en TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS common_mistakes_ru TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS common_mistakes_kk TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS target_muscles_en TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS target_muscles_ru TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS target_muscles_kk TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS secondary_muscles_en TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS secondary_muscles_ru TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS secondary_muscles_kk TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS equipment_en TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS equipment_ru TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS equipment_kk TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS difficulty_en TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS difficulty_ru TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS difficulty_kk TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS camera_angle_en TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS camera_angle_ru TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS camera_angle_kk TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS camera_height_en TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS camera_height_ru TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS camera_height_kk TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS camera_distance_en TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS camera_distance_ru TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS camera_distance_kk TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS body_visibility_en TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS body_visibility_ru TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS body_visibility_kk TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS camera_instructions_en TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS camera_instructions_ru TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS camera_instructions_kk TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS youtube_id TEXT;',
    'ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS analysis_supported BOOLEAN DEFAULT FALSE;',
    '',
    '-- 2. Upsert All Categories',
    'INSERT INTO public.exercise_categories (id, name, slug, icon, display_order)',
    'VALUES'
]

cat_values = []
for c in CATEGORIES:
    cat_values.append('    (' + str(c['id']) + ', \'' + c['name'] + '\', \'' + c['slug'] + '\', \'' + c['icon_name'] + '\', ' + str(c['display_order']) + ')')
sql_lines.append(',\n'.join(cat_values))
sql_lines.append('ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, display_order = EXCLUDED.display_order;')
sql_lines.append('')
sql_lines.append('-- 3. Upsert All Exercises')

for ex in all_exercises:
    name_escaped = ex['name'].replace("'", "''")
    name_en = ex.get('name_en', ex['name']).replace("'", "''")
    name_ru = ex.get('name_ru', ex['name']).replace("'", "''")
    name_kk = ex.get('name_kk', ex['name']).replace("'", "''")
    desc_en = ex.get('description_en', ex.get('description', '')).replace("'", "''")
    desc_ru = ex.get('description_ru', ex.get('description', '')).replace("'", "''")
    desc_kk = ex.get('description_kk', ex.get('description', '')).replace("'", "''")
    instr_en = ex.get('instructions_en', ex.get('instructions', '')).replace("'", "''")
    instr_ru = ex.get('instructions_ru', ex.get('instructions', '')).replace("'", "''")
    instr_kk = ex.get('instructions_kk', ex.get('instructions', '')).replace("'", "''")
    target_en = ex.get('target_muscles_en', ex.get('target_muscles', '')).replace("'", "''")
    target_ru = ex.get('target_muscles_ru', ex.get('target_muscles', '')).replace("'", "''")
    target_kk = ex.get('target_muscles_kk', ex.get('target_muscles', '')).replace("'", "''")
    equip_en = ex.get('equipment_en', ex.get('equipment', 'Bodyweight')).replace("'", "''")
    equip_ru = ex.get('equipment_ru', ex.get('equipment', 'Bodyweight')).replace("'", "''")
    equip_kk = ex.get('equipment_kk', ex.get('equipment', 'Bodyweight')).replace("'", "''")
    mistakes_en = ex.get('common_mistakes_en', ex.get('common_mistakes', '')).replace("'", "''")
    mistakes_ru = ex.get('common_mistakes_ru', ex.get('common_mistakes', '')).replace("'", "''")
    mistakes_kk = ex.get('common_mistakes_kk', ex.get('common_mistakes', '')).replace("'", "''")
    yid = ex.get('youtube_id', '') or ''
    vurl = ex.get('video_url', '') or ''
    analysis_supp = 'TRUE' if ex.get('analysis_supported') else 'FALSE'
    
    sql_lines.append('INSERT INTO public.exercises (id, category_id, name, slug, name_en, name_ru, name_kk, description, description_en, description_ru, description_kk, target_muscle, target_muscles_en, target_muscles_ru, target_muscles_kk, equipment, equipment_en, equipment_ru, equipment_kk, difficulty, instructions_en, instructions_ru, instructions_kk, common_mistakes_en, common_mistakes_ru, common_mistakes_kk, youtube_id, video_url, analysis_supported, analysis_available)')
    sql_lines.append('VALUES (' + str(ex['id']) + ', ' + str(ex['category_id']) + ', \'' + name_escaped + '\', \'' + ex['slug'] + '\', \'' + name_en + '\', \'' + name_ru + '\', \'' + name_kk + '\', \'' + desc_en + '\', \'' + desc_en + '\', \'' + desc_ru + '\', \'' + desc_kk + '\', \'' + target_en + '\', \'' + target_en + '\', \'' + target_ru + '\', \'' + target_kk + '\', \'' + equip_en + '\', \'' + equip_en + '\', \'' + equip_ru + '\', \'' + equip_kk + '\', \'' + ex['difficulty'] + '\', \'' + instr_en + '\', \'' + instr_ru + '\', \'' + instr_kk + '\', \'' + mistakes_en + '\', \'' + mistakes_ru + '\', \'' + mistakes_kk + '\', \'' + yid + '\', \'' + vurl + '\', ' + analysis_supp + ', ' + analysis_supp + ')')
    sql_lines.append('ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_en = EXCLUDED.name_en, name_ru = EXCLUDED.name_ru, name_kk = EXCLUDED.name_kk, description_en = EXCLUDED.description_en, description_ru = EXCLUDED.description_ru, description_kk = EXCLUDED.description_kk, target_muscles_en = EXCLUDED.target_muscles_en, target_muscles_ru = EXCLUDED.target_muscles_ru, target_muscles_kk = EXCLUDED.target_muscles_kk, instructions_en = EXCLUDED.instructions_en, instructions_ru = EXCLUDED.instructions_ru, instructions_kk = EXCLUDED.instructions_kk, youtube_id = EXCLUDED.youtube_id, video_url = EXCLUDED.video_url, analysis_supported = EXCLUDED.analysis_supported;')
    sql_lines.append('')

with open('supabase/migrations/20260831_expanded_exercise_library.sql', 'w', encoding='utf-8') as f_sql:
    f_sql.write('\n'.join(sql_lines))
print('Successfully generated supabase/migrations/20260831_expanded_exercise_library.sql')
