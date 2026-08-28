export interface FoodItem {
  id: string;
  nameEn: string;
  nameRu: string;
  nameKk: string;
  aliases: string[];
  defaultPortionGrams: number;
  defaultPortionLabelEn: string;
  defaultPortionLabelRu: string;
  defaultPortionLabelKk: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
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
  isEstimated: boolean;
}

// Structured Multilingual Food Knowledge Base (FDC / OpenFoodFacts / Local culinary database)
export const STRUCTURED_FOOD_DATABASE: FoodItem[] = [
  // Proteins
  {
    id: 'chicken_breast',
    nameEn: 'Chicken Breast (Cooked)',
    nameRu: 'Куриная грудка (вареная/запеченная)',
    nameKk: 'Тауық еті (пісірілген)',
    aliases: ['chicken', 'chicken breast', 'курица', 'куриная грудка', 'куриное филе', 'тауық', 'тауық еті', 'филе'],
    defaultPortionGrams: 150,
    defaultPortionLabelEn: '1 breast fillet (150g)',
    defaultPortionLabelRu: '1 филе (150г)',
    defaultPortionLabelKk: '1 филе (150г)',
    caloriesPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    fatPer100g: 3.6,
    fiberPer100g: 0,
  },
  {
    id: 'egg',
    nameEn: 'Whole Egg (Boiled/Fried)',
    nameRu: 'Куриное яйцо',
    nameKk: 'Жұмыртқа',
    aliases: ['egg', 'eggs', 'яйцо', 'яйца', 'яичница', 'жұмыртқа', 'жұмыртқалар', 'қуырылған жұмыртқа'],
    defaultPortionGrams: 55,
    defaultPortionLabelEn: '1 egg (55g)',
    defaultPortionLabelRu: '1 яйцо (55г)',
    defaultPortionLabelKk: '1 жұмыртқа (55г)',
    caloriesPer100g: 155,
    proteinPer100g: 13,
    carbsPer100g: 1.1,
    fatPer100g: 11,
    fiberPer100g: 0,
  },
  {
    id: 'beef',
    nameEn: 'Lean Beef (Cooked)',
    nameRu: 'Говядина нежирная',
    nameKk: 'Сиыр еті',
    aliases: ['beef', 'steak', 'говядина', 'стейк', 'мясо', 'сиыр еті', 'ет'],
    defaultPortionGrams: 150,
    defaultPortionLabelEn: '1 portion (150g)',
    defaultPortionLabelRu: '1 порция (150г)',
    defaultPortionLabelKk: '1 порция (150г)',
    caloriesPer100g: 215,
    proteinPer100g: 26,
    carbsPer100g: 0,
    fatPer100g: 12,
    fiberPer100g: 0,
  },
  {
    id: 'salmon',
    nameEn: 'Salmon Fillet',
    nameRu: 'Лосось / Семга',
    nameKk: 'Алабұға / Лосось',
    aliases: ['salmon', 'fish', 'лосось', 'семга', 'рыба', 'балық'],
    defaultPortionGrams: 150,
    defaultPortionLabelEn: '1 fillet (150g)',
    defaultPortionLabelRu: '1 филе (150г)',
    defaultPortionLabelKk: '1 филе (150г)',
    caloriesPer100g: 208,
    proteinPer100g: 20,
    carbsPer100g: 0,
    fatPer100g: 13,
    fiberPer100g: 0,
  },
  {
    id: 'tuna',
    nameEn: 'Canned Tuna',
    nameRu: 'Тунец консервированный',
    nameKk: 'Тунец',
    aliases: ['tuna', 'тунец'],
    defaultPortionGrams: 120,
    defaultPortionLabelEn: '1 can (120g)',
    defaultPortionLabelRu: '1 банка (120г)',
    defaultPortionLabelKk: '1 банка (120г)',
    caloriesPer100g: 116,
    proteinPer100g: 26,
    carbsPer100g: 0,
    fatPer100g: 1,
    fiberPer100g: 0,
  },
  {
    id: 'cottage_cheese',
    nameEn: 'Cottage Cheese (5% fat)',
    nameRu: 'Творог 5%',
    nameKk: 'Сүзбе 5%',
    aliases: ['cottage cheese', 'curd', 'творог', 'сүзбе'],
    defaultPortionGrams: 200,
    defaultPortionLabelEn: '1 pack (200g)',
    defaultPortionLabelRu: '1 пачка (200г)',
    defaultPortionLabelKk: '1 бума (200г)',
    caloriesPer100g: 121,
    proteinPer100g: 17,
    carbsPer100g: 3,
    fatPer100g: 5,
    fiberPer100g: 0,
  },
  {
    id: 'protein_shake',
    nameEn: 'Whey Protein Shake',
    nameRu: 'Протеиновый коктейль',
    nameKk: 'Протеин коктейлі',
    aliases: ['protein', 'whey', 'shake', 'протеин', 'коктейль', 'протеиновый коктейль'],
    defaultPortionGrams: 30,
    defaultPortionLabelEn: '1 scoop (30g powder)',
    defaultPortionLabelRu: '1 скуп (30г)',
    defaultPortionLabelKk: '1 скуп (30г)',
    caloriesPer100g: 390,
    proteinPer100g: 78,
    carbsPer100g: 8,
    fatPer100g: 5,
    fiberPer100g: 2,
  },

  // Carbohydrates & Grains
  {
    id: 'white_rice',
    nameEn: 'White Rice (Cooked)',
    nameRu: 'Рис белый (вареный)',
    nameKk: 'Күріш (пісірілген)',
    aliases: ['rice', 'white rice', 'рис', 'белый рис', 'күріш'],
    defaultPortionGrams: 180,
    defaultPortionLabelEn: '1 cup / bowl (180g)',
    defaultPortionLabelRu: '1 порция (180г)',
    defaultPortionLabelKk: '1 табақ (180г)',
    caloriesPer100g: 130,
    proteinPer100g: 2.7,
    carbsPer100g: 28,
    fatPer100g: 0.3,
    fiberPer100g: 0.4,
  },
  {
    id: 'buckwheat',
    nameEn: 'Buckwheat (Cooked)',
    nameRu: 'Гречка (вареная)',
    nameKk: 'Қарақұмық (пісірілген)',
    aliases: ['buckwheat', 'гречка', 'гречневая каша', 'қарақұмық', 'қарақұмық ботқасы'],
    defaultPortionGrams: 180,
    defaultPortionLabelEn: '1 portion (180g)',
    defaultPortionLabelRu: '1 порция (180г)',
    defaultPortionLabelKk: '1 порция (180г)',
    caloriesPer100g: 110,
    proteinPer100g: 4.2,
    carbsPer100g: 21.3,
    fatPer100g: 1.3,
    fiberPer100g: 2.7,
  },
  {
    id: 'oatmeal',
    nameEn: 'Oatmeal / Rolled Oats',
    nameRu: 'Овсянка / Геркулес',
    nameKk: 'Сұлы жармасы / Овсянка',
    aliases: ['oatmeal', 'oats', 'porridge', 'овсянка', 'геркулес', 'овсяная каша', 'сұлы ботқасы'],
    defaultPortionGrams: 60,
    defaultPortionLabelEn: '1 bowl dry oats (60g)',
    defaultPortionLabelRu: '1 порция сухих хлопьев (60г)',
    defaultPortionLabelKk: '1 порция (60г)',
    caloriesPer100g: 370,
    proteinPer100g: 13,
    carbsPer100g: 62,
    fatPer100g: 6.5,
    fiberPer100g: 10,
  },
  {
    id: 'pasta',
    nameEn: 'Pasta / Macaroni (Cooked)',
    nameRu: 'Макароны / Паста',
    nameKk: 'Макарон / Паста',
    aliases: ['pasta', 'macaroni', 'noodles', 'spaghetti', 'макароны', 'паста', 'спагетти'],
    defaultPortionGrams: 180,
    defaultPortionLabelEn: '1 bowl (180g)',
    defaultPortionLabelRu: '1 порция (180г)',
    defaultPortionLabelKk: '1 порция (180г)',
    caloriesPer100g: 158,
    proteinPer100g: 5.8,
    carbsPer100g: 31,
    fatPer100g: 0.9,
    fiberPer100g: 1.8,
  },
  {
    id: 'bread',
    nameEn: 'Whole Wheat / White Bread',
    nameRu: 'Хлеб',
    nameKk: 'Нан',
    aliases: ['bread', 'toast', 'хлеб', 'тост', 'булочка', 'нан', 'тост нан'],
    defaultPortionGrams: 40,
    defaultPortionLabelEn: '1 slice (40g)',
    defaultPortionLabelRu: '1 ломтик (40г)',
    defaultPortionLabelKk: '1 тілім (40г)',
    caloriesPer100g: 250,
    proteinPer100g: 8.5,
    carbsPer100g: 48,
    fatPer100g: 2.5,
    fiberPer100g: 4,
  },
  {
    id: 'potato',
    nameEn: 'Boiled / Baked Potato',
    nameRu: 'Картофель вареный/печеный',
    nameKk: 'Картоп (пісірілген)',
    aliases: ['potato', 'potatoes', 'картошка', 'картофель', 'пюре', 'картоп'],
    defaultPortionGrams: 200,
    defaultPortionLabelEn: '1 medium potato (200g)',
    defaultPortionLabelRu: '1 средняя картофелина (200г)',
    defaultPortionLabelKk: '1 орташа картоп (200г)',
    caloriesPer100g: 86,
    proteinPer100g: 2,
    carbsPer100g: 19.5,
    fatPer100g: 0.1,
    fiberPer100g: 2,
  },

  // Traditional & Popular Dishes
  {
    id: 'borscht',
    nameEn: 'Borscht Soup with Beef',
    nameRu: 'Борщ с говядиной',
    nameKk: 'Борщ (етпен)',
    aliases: ['borscht', 'borsch', 'борщ', 'борщ со сметаной', 'борщ с мясом'],
    defaultPortionGrams: 350,
    defaultPortionLabelEn: '1 bowl (350g)',
    defaultPortionLabelRu: '1 тарелка (350г)',
    defaultPortionLabelKk: '1 табақ (350г)',
    caloriesPer100g: 58,
    proteinPer100g: 3.5,
    carbsPer100g: 5.2,
    fatPer100g: 2.6,
    fiberPer100g: 1.5,
  },
  {
    id: 'plov',
    nameEn: 'Plov (Rice with Meat & Carrots)',
    nameRu: 'Плов с мясом',
    nameKk: 'Палау (етпен)',
    aliases: ['plov', 'pilaf', 'плов', 'палау'],
    defaultPortionGrams: 300,
    defaultPortionLabelEn: '1 plate (300g)',
    defaultPortionLabelRu: '1 порция (300г)',
    defaultPortionLabelKk: '1 табақ (300г)',
    caloriesPer100g: 185,
    proteinPer100g: 7.5,
    carbsPer100g: 22,
    fatPer100g: 7.2,
    fiberPer100g: 1.2,
  },
  {
    id: 'kespe',
    nameEn: 'Kespe (Traditional Noodle Soup)',
    nameRu: 'Кеспе (суп с лапшой и мясом)',
    nameKk: 'Кеспе (сорпа)',
    aliases: ['kespe', 'noodle soup', 'кеспе', 'лапша домашняя', 'сорпа'],
    defaultPortionGrams: 350,
    defaultPortionLabelEn: '1 bowl (350g)',
    defaultPortionLabelRu: '1 порция (350г)',
    defaultPortionLabelKk: '1 кесе (350г)',
    caloriesPer100g: 65,
    proteinPer100g: 4.8,
    carbsPer100g: 7.5,
    fatPer100g: 2.2,
    fiberPer100g: 0.8,
  },
  {
    id: 'beshbarmak',
    nameEn: 'Beshbarmak (Meat with Dough Sheets)',
    nameRu: 'Бешбармак',
    nameKk: 'Бесбармақ / Ет',
    aliases: ['beshbarmak', 'besbarmak', 'бешбармак', 'бесбармақ', 'қазақша ет'],
    defaultPortionGrams: 350,
    defaultPortionLabelEn: '1 plate (350g)',
    defaultPortionLabelRu: '1 порция (350г)',
    defaultPortionLabelKk: '1 табақ (350г)',
    caloriesPer100g: 210,
    proteinPer100g: 14.5,
    carbsPer100g: 18.2,
    fatPer100g: 9.0,
    fiberPer100g: 1.0,
  },
  {
    id: 'manti',
    nameEn: 'Manti (Meat Dumplings)',
    nameRu: 'Манты с мясом',
    nameKk: 'Мәнті',
    aliases: ['manti', 'manty', 'манты', 'мәнті'],
    defaultPortionGrams: 250,
    defaultPortionLabelEn: '4 pieces (250g)',
    defaultPortionLabelRu: '4 штуки (250г)',
    defaultPortionLabelKk: '4 дана (250г)',
    caloriesPer100g: 195,
    proteinPer100g: 8.5,
    carbsPer100g: 21,
    fatPer100g: 8.5,
    fiberPer100g: 1.1,
  },

  // Vegetables & Fruits
  {
    id: 'banana',
    nameEn: 'Fresh Banana',
    nameRu: 'Банан свежий',
    nameKk: 'Банан',
    aliases: ['banana', 'bananas', 'банан', 'бананы'],
    defaultPortionGrams: 120,
    defaultPortionLabelEn: '1 medium banana (120g)',
    defaultPortionLabelRu: '1 средний банан (120г)',
    defaultPortionLabelKk: '1 банан (120г)',
    caloriesPer100g: 89,
    proteinPer100g: 1.1,
    carbsPer100g: 23,
    fatPer100g: 0.3,
    fiberPer100g: 2.6,
  },
  {
    id: 'apple',
    nameEn: 'Fresh Apple',
    nameRu: 'Яблоко свежее',
    nameKk: 'Алма',
    aliases: ['apple', 'apples', 'яблоко', 'яблоки', 'алма'],
    defaultPortionGrams: 150,
    defaultPortionLabelEn: '1 medium apple (150g)',
    defaultPortionLabelRu: '1 яблоко (150г)',
    defaultPortionLabelKk: '1 алма (150г)',
    caloriesPer100g: 52,
    proteinPer100g: 0.3,
    carbsPer100g: 14,
    fatPer100g: 0.2,
    fiberPer100g: 2.4,
  },
  {
    id: 'salad',
    nameEn: 'Fresh Vegetable Salad (Cucumber & Tomato)',
    nameRu: 'Свежий овощной салат',
    nameKk: 'Жаңа піскен көкөніс салаты',
    aliases: ['salad', 'vegetables', 'салат', 'овощи', 'овощной салат', 'қияр қызанақ салаты'],
    defaultPortionGrams: 150,
    defaultPortionLabelEn: '1 bowl (150g)',
    defaultPortionLabelRu: '1 порция (150г)',
    defaultPortionLabelKk: '1 табақ (150г)',
    caloriesPer100g: 35,
    proteinPer100g: 1.2,
    carbsPer100g: 4.5,
    fatPer100g: 1.5,
    fiberPer100g: 1.8,
  },
  {
    id: 'avocado',
    nameEn: 'Fresh Avocado',
    nameRu: 'Авокадо',
    nameKk: 'Авокадо',
    aliases: ['avocado', 'авокадо'],
    defaultPortionGrams: 100,
    defaultPortionLabelEn: 'Half avocado (100g)',
    defaultPortionLabelRu: 'Половина авокадо (100г)',
    defaultPortionLabelKk: 'Жарты авокадо (100г)',
    caloriesPer100g: 160,
    proteinPer100g: 2,
    carbsPer100g: 8.5,
    fatPer100g: 15,
    fiberPer100g: 6.7,
  },
  {
    id: 'nuts',
    nameEn: 'Mixed Nuts / Almonds / Walnuts',
    nameRu: 'Орехи (миндаль / грецкие)',
    nameKk: 'Жаңғақтар',
    aliases: ['nuts', 'almonds', 'walnuts', 'орехи', 'миндаль', 'грецкий орех', 'жаңғақ'],
    defaultPortionGrams: 30,
    defaultPortionLabelEn: '1 handful (30g)',
    defaultPortionLabelRu: '1 горсть (30г)',
    defaultPortionLabelKk: '1 уыс (30г)',
    caloriesPer100g: 607,
    proteinPer100g: 18,
    carbsPer100g: 16,
    fatPer100g: 54,
    fiberPer100g: 7,
  },
];

export class NutritionIntelligence {
  /**
   * Parses natural language meal text (e.g. "Chicken breast + rice + 2 eggs", "Борщ с хлебом")
   */
  public static estimateMeal(text: string): MealEstimationResult {
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
        isEstimated: true,
      };
    }

    // Split by connectors: +, and, with, с, және, +, ,
    const segments = text
      .split(/(?:\s*\+\s*|\s+and\s+|\s+with\s+|\s+с\s+|\s+және\s+|\s*,\s*)/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const components: EstimatedMealComponent[] = [];

    for (const segment of segments) {
      const match = this.matchSegmentToFood(segment);
      if (match) {
        components.push(match);
      }
    }

    // If nothing matched directly, do a broad token match
    if (components.length === 0) {
      const fallbackMatch = this.fuzzySearch(text);
      if (fallbackMatch) {
        const grams = fallbackMatch.defaultPortionGrams;
        const factor = grams / 100;
        components.push({
          foodItem: fallbackMatch,
          quantity: 1,
          unit: 'portion',
          gramsEstimated: grams,
          calories: Math.round(fallbackMatch.caloriesPer100g * factor),
          protein: Math.round(fallbackMatch.proteinPer100g * factor * 10) / 10,
          carbs: Math.round(fallbackMatch.carbsPer100g * factor * 10) / 10,
          fat: Math.round(fallbackMatch.fatPer100g * factor * 10) / 10,
          fiber: Math.round(fallbackMatch.fiberPer100g * factor * 10) / 10,
          isEstimated: true,
        });
      }
    }

    const totalCalories = components.reduce((sum, c) => sum + c.calories, 0);
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
      isEstimated: true,
    };
  }

  private static matchSegmentToFood(segment: string): EstimatedMealComponent | null {
    const clean = segment.toLowerCase().trim();

    // Look for leading numeric quantities: e.g. "2 eggs", "200g chicken", "3 slices bread", "200 гр риса"
    const gramMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:g|г|гр|grams|грамм|граммдар)\s+(.*)$/i);
    if (gramMatch) {
      const grams = parseFloat(gramMatch[1]);
      const foodQuery = gramMatch[2].trim();
      const food = this.fuzzySearch(foodQuery);
      if (food) {
        const factor = grams / 100;
        return {
          foodItem: food,
          quantity: grams,
          unit: 'g',
          gramsEstimated: grams,
          calories: Math.round(food.caloriesPer100g * factor),
          protein: Math.round(food.proteinPer100g * factor * 10) / 10,
          carbs: Math.round(food.carbsPer100g * factor * 10) / 10,
          fat: Math.round(food.fatPer100g * factor * 10) / 10,
          fiber: Math.round(food.fiberPer100g * factor * 10) / 10,
          isEstimated: false,
        };
      }
    }

    const countMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:pcs|шт|дана|штук|кусочка|кусок|slices|slice)?\s*(.*)$/i);
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

    const grams = Math.round(food.defaultPortionGrams * quantity);
    const factor = grams / 100;

    return {
      foodItem: food,
      quantity,
      unit: quantity > 1 ? 'portions' : 'portion',
      gramsEstimated: grams,
      calories: Math.round(food.caloriesPer100g * factor),
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

    // 2. Substring / Includes match
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
