export interface FoodItem {
  id: string | number;
  nameEn: string;
  nameRu: string;
  nameKk: string;
  aliases: string[];
  defaultPortionGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  category: string;
}

export interface EstimatedMealComponent {
  foodItem: FoodItem;
  quantity: number;
  unit: string;
  gramsEstimated: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  isEstimated: boolean;
}

export interface MealEstimationResult {
  rawQuery: string;
  components: EstimatedMealComponent[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalGrams: number;
  modelVersion: string;
  isEstimated: boolean;
}

// Curated Sports Nutrition & Cultural Food Knowledge Base (English, Russian, Kazakh)
export const STRUCTURED_FOOD_DATABASE: FoodItem[] = [
  // Proteins & Meats
  {
    id: 'chicken_breast',
    nameEn: 'Chicken Breast (Cooked)',
    nameRu: 'Куриная грудка (вареная)',
    nameKk: 'Тауық төс еті (пісірілген)',
    aliases: ['chicken', 'chicken breast', 'boiled chicken', 'курица', 'куриная грудка', 'куриное филе', 'тауық', 'тауық еті', 'филе'],
    defaultPortionGrams: 150,
    caloriesPer100g: 165.0,
    proteinPer100g: 31.0,
    carbsPer100g: 0.0,
    fatPer100g: 3.6,
    fiberPer100g: 0.0,
    category: 'Poultry'
  },
  {
    id: 'chicken_thigh',
    nameEn: 'Chicken Thigh (Skinless)',
    nameRu: 'Куриное бедро (без кожи)',
    nameKk: 'Тауық саны',
    aliases: ['chicken thigh', 'куриное бедро', 'куриные бедрышки', 'тауық саны'],
    defaultPortionGrams: 150,
    caloriesPer100g: 209.0,
    proteinPer100g: 26.0,
    carbsPer100g: 0.0,
    fatPer100g: 10.9,
    fiberPer100g: 0.0,
    category: 'Poultry'
  },
  {
    id: 'egg',
    nameEn: 'Whole Egg (Boiled/Fried)',
    nameRu: 'Яйцо куриное',
    nameKk: 'Жұмыртқа',
    aliases: ['egg', 'eggs', 'boiled egg', 'яйцо', 'яйца', 'вареное яйцо', 'яичница', 'жұмыртқа', 'жұмыртқалар', 'қуырылған жұмыртқа'],
    defaultPortionGrams: 55,
    caloriesPer100g: 155.0,
    proteinPer100g: 13.0,
    carbsPer100g: 1.1,
    fatPer100g: 11.0,
    fiberPer100g: 0.0,
    category: 'Eggs'
  },
  {
    id: 'egg_white',
    nameEn: 'Egg Whites',
    nameRu: 'Яичный белок',
    nameKk: 'Жұмыртқа ағы',
    aliases: ['egg whites', 'egg white', 'яичный белок', 'белок яичный', 'жұмыртқа ағы'],
    defaultPortionGrams: 100,
    caloriesPer100g: 52.0,
    proteinPer100g: 11.0,
    carbsPer100g: 0.7,
    fatPer100g: 0.2,
    fiberPer100g: 0.0,
    category: 'Eggs'
  },
  {
    id: 'beef_steak',
    nameEn: 'Lean Beef Steak (Cooked)',
    nameRu: 'Говядина нежирная / Стейк',
    nameKk: 'Сиыр еті',
    aliases: ['beef', 'steak', 'lean beef', 'говядина', 'стейк', 'мясо говядины', 'сиыр еті', 'ет'],
    defaultPortionGrams: 150,
    caloriesPer100g: 215.0,
    proteinPer100g: 26.0,
    carbsPer100g: 0.0,
    fatPer100g: 12.0,
    fiberPer100g: 0.0,
    category: 'Meat'
  },
  {
    id: 'minced_beef',
    nameEn: 'Minced Beef (90/10)',
    nameRu: 'Фарш говяжий нежирный',
    nameKk: 'Сиыр тартылған еті',
    aliases: ['minced beef', 'ground beef', 'фарш', 'говяжий фарш', 'тартылған ет'],
    defaultPortionGrams: 150,
    caloriesPer100g: 217.0,
    proteinPer100g: 24.5,
    carbsPer100g: 0.0,
    fatPer100g: 13.0,
    fiberPer100g: 0.0,
    category: 'Meat'
  },
  {
    id: 'kazy_horsemeat',
    nameEn: 'Horse Meat (Kazy / Zhaya)',
    nameRu: 'Конина / Казы / Жая',
    nameKk: 'Жылқы еті / Қазы / Жая',
    aliases: ['horse meat', 'kazy', 'zhaya', 'конина', 'казы', 'жая', 'жылқы еті', 'қазы', 'жая'],
    defaultPortionGrams: 150,
    caloriesPer100g: 215.0,
    proteinPer100g: 28.0,
    carbsPer100g: 0.0,
    fatPer100g: 11.0,
    fiberPer100g: 0.0,
    category: 'Meat'
  },
  {
    id: 'salmon',
    nameEn: 'Salmon Fillet (Baked/Grilled)',
    nameRu: 'Лосось / Семга',
    nameKk: 'Алабұға / Лосось',
    aliases: ['salmon', 'salmon fillet', 'лосось', 'семга', 'красная рыба', 'балық'],
    defaultPortionGrams: 150,
    caloriesPer100g: 208.0,
    proteinPer100g: 20.0,
    carbsPer100g: 0.0,
    fatPer100g: 13.0,
    fiberPer100g: 0.0,
    category: 'Seafood'
  },
  {
    id: 'tuna',
    nameEn: 'Canned Tuna (in Water)',
    nameRu: 'Тунец консервированный в собственном соку',
    nameKk: 'Тунец консервісі',
    aliases: ['tuna', 'canned tuna', 'тунец', 'тунец в собственном соку'],
    defaultPortionGrams: 120,
    caloriesPer100g: 116.0,
    proteinPer100g: 26.0,
    carbsPer100g: 0.0,
    fatPer100g: 1.0,
    fiberPer100g: 0.0,
    category: 'Seafood'
  },
  {
    id: 'tvorog_5',
    nameEn: 'Cottage Cheese (Tvorog 5%)',
    nameRu: 'Творог 5%',
    nameKk: 'Сүзбе 5%',
    aliases: ['cottage cheese', 'tvorog', 'curd', 'творог', 'творог 5%', 'сүзбе', 'сүзбе 5%'],
    defaultPortionGrams: 200,
    caloriesPer100g: 121.0,
    proteinPer100g: 17.0,
    carbsPer100g: 3.0,
    fatPer100g: 5.0,
    fiberPer100g: 0.0,
    category: 'Dairy'
  },
  {
    id: 'tvorog_0',
    nameEn: 'Low Fat Cottage Cheese (0-2%)',
    nameRu: 'Творог обезжиренный 0-2%',
    nameKk: 'Майсыз сүзбе',
    aliases: ['low fat tvorog', 'творог обезжиренный', 'творог 2%', 'майсыз сүзбе'],
    defaultPortionGrams: 200,
    caloriesPer100g: 86.0,
    proteinPer100g: 18.0,
    carbsPer100g: 3.3,
    fatPer100g: 0.5,
    fiberPer100g: 0.0,
    category: 'Dairy'
  },
  {
    id: 'greek_yogurt',
    nameEn: 'Greek Yogurt (Plain)',
    nameRu: 'Греческий йогурт натуральный',
    nameKk: 'Грек йогурты',
    aliases: ['greek yogurt', 'yogurt', 'греческий йогурт', 'йогурт', 'грек йогурты'],
    defaultPortionGrams: 170,
    caloriesPer100g: 73.0,
    proteinPer100g: 10.0,
    carbsPer100g: 3.6,
    fatPer100g: 2.0,
    fiberPer100g: 0.0,
    category: 'Dairy'
  },
  {
    id: 'whey_protein',
    nameEn: 'Whey Protein Shake',
    nameRu: 'Протеин сывороточный (коктейль)',
    nameKk: 'Протеин коктейлі',
    aliases: ['protein', 'whey', 'protein shake', 'протеин', 'протеиновый коктейль', 'протеин коктейлі'],
    defaultPortionGrams: 30,
    caloriesPer100g: 390.0,
    proteinPer100g: 78.0,
    carbsPer100g: 8.0,
    fatPer100g: 5.0,
    fiberPer100g: 2.0,
    category: 'Supplements'
  },

  // Carbohydrates & Grains
  {
    id: 'white_rice',
    nameEn: 'White Rice (Cooked)',
    nameRu: 'Рис белый (вареный)',
    nameKk: 'Ақ күріш (пісірілген)',
    aliases: ['white rice', 'rice', 'steamed rice', 'рис', 'белый рис', 'күріш', 'ақ күріш'],
    defaultPortionGrams: 180,
    caloriesPer100g: 130.0,
    proteinPer100g: 2.7,
    carbsPer100g: 28.2,
    fatPer100g: 0.3,
    fiberPer100g: 0.4,
    category: 'Grains'
  },
  {
    id: 'buckwheat',
    nameEn: 'Buckwheat (Grechka Cooked)',
    nameRu: 'Гречка (вареная)',
    nameKk: 'Қарақұмық (пісірілген)',
    aliases: ['buckwheat', 'grechka', 'гречка', 'гречневая каша', 'қарақұмық', 'қарақұмық ботқасы'],
    defaultPortionGrams: 180,
    caloriesPer100g: 110.0,
    proteinPer100g: 4.2,
    carbsPer100g: 21.3,
    fatPer100g: 1.3,
    fiberPer100g: 2.7,
    category: 'Grains'
  },
  {
    id: 'oatmeal',
    nameEn: 'Oatmeal / Rolled Oats',
    nameRu: 'Овсянка / Геркулес',
    nameKk: 'Сұлы жармасы / Овсянка',
    aliases: ['oatmeal', 'oats', 'porridge', 'овсянка', 'геркулес', 'овсяная каша', 'сұлы ботқасы'],
    defaultPortionGrams: 200,
    caloriesPer100g: 71.0,
    proteinPer100g: 2.5,
    carbsPer100g: 12.0,
    fatPer100g: 1.4,
    fiberPer100g: 1.7,
    category: 'Grains'
  },
  {
    id: 'pasta',
    nameEn: 'Pasta / Macaroni (Cooked)',
    nameRu: 'Макароны / Паста',
    nameKk: 'Макарон / Паста (пісірілген)',
    aliases: ['pasta', 'macaroni', 'noodles', 'spaghetti', 'макароны', 'паста', 'спагетти', 'макарон'],
    defaultPortionGrams: 180,
    caloriesPer100g: 158.0,
    proteinPer100g: 5.8,
    carbsPer100g: 31.0,
    fatPer100g: 0.9,
    fiberPer100g: 1.8,
    category: 'Grains'
  },
  {
    id: 'potato',
    nameEn: 'Boiled / Baked Potato',
    nameRu: 'Картофель вареный / печеный',
    nameKk: 'Картоп (пісірілген)',
    aliases: ['potato', 'potatoes', 'картошка', 'картофель', 'пюре', 'картоп'],
    defaultPortionGrams: 200,
    caloriesPer100g: 86.0,
    proteinPer100g: 2.0,
    carbsPer100g: 19.5,
    fatPer100g: 0.1,
    fiberPer100g: 2.0,
    category: 'Vegetables'
  },
  {
    id: 'bread_wheat',
    nameEn: 'Whole Wheat Bread',
    nameRu: 'Хлеб цельнозерновой',
    nameKk: 'Қара нан / Дәнді нан',
    aliases: ['whole wheat bread', 'brown bread', 'хлеб цельнозерновой', 'черный хлеб', 'қара нан', 'нан'],
    defaultPortionGrams: 40,
    caloriesPer100g: 247.0,
    proteinPer100g: 9.0,
    carbsPer100g: 44.0,
    fatPer100g: 3.0,
    fiberPer100g: 6.0,
    category: 'Bakery'
  },
  {
    id: 'toast',
    nameEn: 'White Bread / Toast',
    nameRu: 'Хлеб белый / Тост',
    nameKk: 'Ақ нан / Тост',
    aliases: ['white bread', 'toast', 'хлеб', 'хлеб белый', 'белый хлеб', 'тост', 'ақ нан'],
    defaultPortionGrams: 35,
    caloriesPer100g: 265.0,
    proteinPer100g: 8.0,
    carbsPer100g: 50.0,
    fatPer100g: 3.2,
    fiberPer100g: 2.7,
    category: 'Bakery'
  },

  // Traditional Prepared Dishes
  {
    id: 'borscht',
    nameEn: 'Borscht Soup with Beef',
    nameRu: 'Борщ с говядиной',
    nameKk: 'Борщ (етпен)',
    aliases: ['borscht', 'borsch', 'борщ', 'борщ со сметаной', 'борщ с говядиной', 'борщ етпен'],
    defaultPortionGrams: 350,
    caloriesPer100g: 58.0,
    proteinPer100g: 3.5,
    carbsPer100g: 5.2,
    fatPer100g: 2.6,
    fiberPer100g: 1.5,
    category: 'Soups'
  },
  {
    id: 'plov',
    nameEn: 'Traditional Plov (Pilaf with Beef & Rice)',
    nameRu: 'Плов с говядиной',
    nameKk: 'Палау (етпен)',
    aliases: ['plov', 'pilaf', 'плов', 'плов с мясом', 'палау', 'ет палауы'],
    defaultPortionGrams: 300,
    caloriesPer100g: 185.0,
    proteinPer100g: 7.5,
    carbsPer100g: 22.0,
    fatPer100g: 7.2,
    fiberPer100g: 1.2,
    category: 'Dishes'
  },
  {
    id: 'beshbarmak',
    nameEn: 'Beshbarmak (Meat with Dough & Broth)',
    nameRu: 'Бешбармак',
    nameKk: 'Бесбармақ / Ет',
    aliases: ['beshbarmak', 'besbarmak', 'бешбармак', 'бесбармақ', 'қазақша ет', 'ет асы'],
    defaultPortionGrams: 350,
    caloriesPer100g: 210.0,
    proteinPer100g: 14.5,
    carbsPer100g: 18.2,
    fatPer100g: 9.0,
    fiberPer100g: 1.0,
    category: 'Dishes'
  },
  {
    id: 'kespe',
    nameEn: 'Kespe / Noodle Soup with Beef',
    nameRu: 'Кеспе (суп-лапша с мясом)',
    nameKk: 'Кеспе (сорпа)',
    aliases: ['kespe', 'noodle soup', 'кеспе', 'сорпа', 'кеспе сорпа'],
    defaultPortionGrams: 350,
    caloriesPer100g: 65.0,
    proteinPer100g: 4.8,
    carbsPer100g: 7.5,
    fatPer100g: 2.2,
    fiberPer100g: 0.8,
    category: 'Soups'
  },
  {
    id: 'manti',
    nameEn: 'Manti with Beef & Onions',
    nameRu: 'Манты с говядиной',
    nameKk: 'Мәнті',
    aliases: ['manti', 'manty', 'dumplings', 'манты', 'манты с мясом', 'мәнті'],
    defaultPortionGrams: 250,
    caloriesPer100g: 195.0,
    proteinPer100g: 8.5,
    carbsPer100g: 21.0,
    fatPer100g: 8.5,
    fiberPer100g: 1.1,
    category: 'Dishes'
  },

  // Fruits & Vegetables
  {
    id: 'banana',
    nameEn: 'Fresh Banana',
    nameRu: 'Банан свежий',
    nameKk: 'Банан',
    aliases: ['banana', 'bananas', 'банан', 'бананы'],
    defaultPortionGrams: 120,
    caloriesPer100g: 89.0,
    proteinPer100g: 1.1,
    carbsPer100g: 22.8,
    fatPer100g: 0.3,
    fiberPer100g: 2.6,
    category: 'Fruit'
  },
  {
    id: 'apple',
    nameEn: 'Fresh Apple',
    nameRu: 'Яблоко свежее',
    nameKk: 'Алма',
    aliases: ['apple', 'apples', 'яблоко', 'яблоки', 'алма'],
    defaultPortionGrams: 150,
    caloriesPer100g: 52.0,
    proteinPer100g: 0.3,
    carbsPer100g: 13.8,
    fatPer100g: 0.2,
    fiberPer100g: 2.4,
    category: 'Fruit'
  },
  {
    id: 'salad',
    nameEn: 'Fresh Vegetable Salad (Cucumber & Tomato)',
    nameRu: 'Свежий овощной салат',
    nameKk: 'Жаңа піскен көкөніс салаты',
    aliases: ['salad', 'vegetables', 'салат', 'овощи', 'овощной салат', 'қияр қызанақ салаты'],
    defaultPortionGrams: 150,
    caloriesPer100g: 35.0,
    proteinPer100g: 1.2,
    carbsPer100g: 4.5,
    fatPer100g: 1.5,
    fiberPer100g: 1.8,
    category: 'Vegetables'
  },
  {
    id: 'almonds',
    nameEn: 'Almonds / Walnuts',
    nameRu: 'Миндаль / Грецкие орехи',
    nameKk: 'Бадам / Жаңғақ',
    aliases: ['almonds', 'walnuts', 'nuts', 'миндаль', 'грецкий орех', 'орехи', 'жаңғақ', 'бадам'],
    defaultPortionGrams: 30,
    caloriesPer100g: 579.0,
    proteinPer100g: 21.0,
    carbsPer100g: 21.6,
    fatPer100g: 49.9,
    fiberPer100g: 12.5,
    category: 'Nuts & Seeds'
  },
];

export class NutritionIntelligence {
  public static async estimateMealAsync(text: string, lang: string = 'en'): Promise<MealEstimationResult> {
    try {
      const response = await fetch('/api/v1/nutrition/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, language: lang }),
      });

      if (response.ok) {
        const data = await response.json();
        const components: EstimatedMealComponent[] = (data.detected_foods || []).map((df: any) => ({
          foodItem: {
            id: df.food_id,
            nameEn: df.original_name_en || df.food_name,
            nameRu: df.food_name,
            nameKk: df.food_name,
            aliases: [],
            defaultPortionGrams: df.portion_grams,
            caloriesPer100g: df.portion_grams > 0 ? (df.calories / df.portion_grams) * 100 : 100,
            proteinPer100g: df.portion_grams > 0 ? (df.protein / df.portion_grams) * 100 : 10,
            carbsPer100g: df.portion_grams > 0 ? (df.carbs / df.portion_grams) * 100 : 10,
            fatPer100g: df.portion_grams > 0 ? (df.fat / df.portion_grams) * 100 : 5,
            fiberPer100g: df.portion_grams > 0 ? (df.fiber / df.portion_grams) * 100 : 2,
            category: df.category || 'General'
          },
          quantity: df.portion_grams,
          unit: 'g',
          gramsEstimated: df.portion_grams,
          calories: df.calories,
          protein: df.protein,
          carbs: df.carbs,
          fat: df.fat,
          fiber: df.fiber,
          isEstimated: df.is_estimated
        }));

        return {
          rawQuery: data.raw_query,
          components,
          totalCalories: data.total_calories,
          totalProtein: data.total_protein,
          totalCarbs: data.total_carbs,
          totalFat: data.total_fat,
          totalFiber: data.total_fiber,
          totalGrams: data.total_grams,
          modelVersion: data.model_version || 'sportx-nutrition-v2.0',
          isEstimated: data.is_estimated
        };
      }
    } catch {
      // Backend not running, gracefully fallback to local knowledge matcher
    }

    return this.estimateMealLocal(text);
  }

  public static estimateMealLocal(text: string): MealEstimationResult {
    if (!text || !text.trim()) {
      return {
        rawQuery: text,
        components: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        totalGrams: 0,
        modelVersion: 'sportx-nutrition-v2.0-client',
        isEstimated: true,
      };
    }

    const segments = text
      .split(/(?:\s*\+\s*|\s+and\s+|\s+with\s+|\s+с\s+|\s+со\s+|\s+мен\s+|\s+пен\s+|\s+бен\s+|\s+және\s+|\s*,\s*|\s*&\s*)/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const components: EstimatedMealComponent[] = [];

    for (const segment of segments) {
      const match = this.matchSegmentToFood(segment);
      if (match) {
        components.push(match);
      }
    }

    if (components.length === 0) {
      const fallbackMatch = this.fuzzySearch(text);
      if (fallbackMatch) {
        const grams = fallbackMatch.defaultPortionGrams;
        const factor = grams / 100.0;
        components.push({
          foodItem: fallbackMatch,
          quantity: 1,
          unit: 'portion',
          gramsEstimated: grams,
          calories: Math.round(fallbackMatch.caloriesPer100g * factor * 10) / 10,
          protein: Math.round(fallbackMatch.proteinPer100g * factor * 10) / 10,
          carbs: Math.round(fallbackMatch.carbsPer100g * factor * 10) / 10,
          fat: Math.round(fallbackMatch.fatPer100g * factor * 10) / 10,
          fiber: Math.round(fallbackMatch.fiberPer100g * factor * 10) / 10,
          isEstimated: true,
        });
      }
    }

    const totalCalories = Math.round(components.reduce((sum, c) => sum + c.calories, 0) * 10) / 10;
    const totalProtein = Math.round(components.reduce((sum, c) => sum + c.protein, 0) * 10) / 10;
    const totalCarbs = Math.round(components.reduce((sum, c) => sum + c.carbs, 0) * 10) / 10;
    const totalFat = Math.round(components.reduce((sum, c) => sum + c.fat, 0) * 10) / 10;
    const totalFiber = Math.round(components.reduce((sum, c) => sum + c.fiber, 0) * 10) / 10;
    const totalGrams = components.reduce((sum, c) => sum + c.gramsEstimated, 0);

    return {
      rawQuery: text,
      components,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalFiber,
      totalGrams,
      modelVersion: 'sportx-nutrition-v2.0-client',
      isEstimated: anyEstimated(components),
    };
  }

  private static matchSegmentToFood(segment: string): EstimatedMealComponent | null {
    const clean = segment.toLowerCase().trim();

    // 1. Grams / ml
    const gramMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:g|г|гр|grams|грамм|граммдар|ml|мл)\s+(.*)$/i);
    if (gramMatch) {
      const grams = parseFloat(gramMatch[1]);
      const foodQuery = gramMatch[2].trim();
      const food = this.fuzzySearch(foodQuery);
      if (food) {
        const factor = grams / 100.0;
        return {
          foodItem: food,
          quantity: grams,
          unit: 'g',
          gramsEstimated: grams,
          calories: Math.round(food.caloriesPer100g * factor * 10) / 10,
          protein: Math.round(food.proteinPer100g * factor * 10) / 10,
          carbs: Math.round(food.carbsPer100g * factor * 10) / 10,
          fat: Math.round(food.fatPer100g * factor * 10) / 10,
          fiber: Math.round(food.fiberPer100g * factor * 10) / 10,
          isEstimated: false,
        };
      }
    }

    // 2. Count / pieces
    const countMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:pcs|pc|шт|дана|штук|штуки|кусочка|кусок|slices|slice|eggs|яйца|жұмыртқа|whole)?\s+(.*)$/i);
    let quantity = 1;
    let foodQuery = clean;

    if (countMatch && countMatch[1] && countMatch[2]) {
      const parsedNum = parseFloat(countMatch[1]);
      if (!isNaN(parsedNum) && parsedNum > 0 && parsedNum <= 20) {
        quantity = parsedNum;
        foodQuery = countMatch[2].trim();
      }
    }

    const food = this.fuzzySearch(foodQuery);
    if (!food) return null;

    let singleGrams = food.defaultPortionGrams;
    if (food.id === 'egg') singleGrams = 55;
    else if (food.id === 'toast' || food.id === 'bread_wheat') singleGrams = 40;
    else if (food.id === 'banana') singleGrams = 120;

    const grams = Math.round(singleGrams * quantity);
    const factor = grams / 100.0;

    return {
      foodItem: food,
      quantity,
      unit: quantity > 1 ? 'portions' : 'portion',
      gramsEstimated: grams,
      calories: Math.round(food.caloriesPer100g * factor * 10) / 10,
      protein: Math.round(food.proteinPer100g * factor * 10) / 10,
      carbs: Math.round(food.carbsPer100g * factor * 10) / 10,
      fat: Math.round(food.fatPer100g * factor * 10) / 10,
      fiber: Math.round(food.fiberPer100g * factor * 10) / 10,
      isEstimated: true,
    };
  }

  public static fuzzySearch(query: string): FoodItem | null {
    const q = query.toLowerCase().trim();
    if (!q) return null;

    // 1. Exact alias match
    for (const food of STRUCTURED_FOOD_DATABASE) {
      if (food.aliases.some((alias) => alias.toLowerCase() === q)) {
        return food;
      }
      if (
        food.nameEn.toLowerCase() === q ||
        food.nameRu.toLowerCase() === q ||
        food.nameKk.toLowerCase() === q
      ) {
        return food;
      }
    }

    // 2. Substring match
    for (const food of STRUCTURED_FOOD_DATABASE) {
      if (food.aliases.some((alias) => q.includes(alias.toLowerCase()) || alias.toLowerCase().includes(q))) {
        return food;
      }
      if (
        q.includes(food.nameEn.toLowerCase()) ||
        q.includes(food.nameRu.toLowerCase()) ||
        q.includes(food.nameKk.toLowerCase())
      ) {
        return food;
      }
    }

    // 3. Token match
    const tokens = q.split(/\s+/).filter((t) => t.length > 2);
    for (const food of STRUCTURED_FOOD_DATABASE) {
      for (const token of tokens) {
        if (food.aliases.some((alias) => alias.toLowerCase().includes(token))) {
          return food;
        }
      }
    }

    return null;
  }
}

function anyEstimated(components: EstimatedMealComponent[]): boolean {
  return components.some((c) => c.isEstimated);
}
