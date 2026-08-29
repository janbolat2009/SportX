import os
import csv
import json
import re
from typing import Dict, Any, List, Optional

# Constants
RAW_TSV_PATH = os.path.join("backend", "app", "ml", "datasets", "en.openfoodfacts.org.products.tsv")
OUTPUT_DIR = os.path.join("data", "nutrition")
CLEAN_CSV_PATH = os.path.join(OUTPUT_DIR, "clean_nutrition_database.csv")
CLEAN_JSON_PATH = os.path.join(OUTPUT_DIR, "clean_nutrition_database.json")
SUMMARY_REPORT_PATH = os.path.join(OUTPUT_DIR, "dataset_inspection_report.json")

# Curated high-frequency fitness, international & local traditional dishes (Russian, Kazakh, Central Asian, Global)
CURATED_MULTILINGUAL_FOODS = [
    # Proteins & Meats
    {"name_en": "Chicken Breast (Cooked)", "name_ru": "Куриная грудка (вареная)", "name_kk": "Тауық төс еті (пісірілген)", "aliases": ["chicken breast", "boiled chicken", "куриная грудка", "куриное филе", "курица", "тауық", "тауық еті", "филе"], "serving_g": 150, "calories_100g": 165.0, "protein_100g": 31.0, "carbs_100g": 0.0, "fat_100g": 3.6, "fiber_100g": 0.0, "category": "Poultry"},
    {"name_en": "Chicken Thigh (Skinless)", "name_ru": "Куриное бедро (без кожи)", "name_kk": "Тауық саны", "aliases": ["chicken thigh", "куриное бедро", "куриные бедрышки", "тауық саны"], "serving_g": 150, "calories_100g": 209.0, "protein_100g": 26.0, "carbs_100g": 0.0, "fat_100g": 10.9, "fiber_100g": 0.0, "category": "Poultry"},
    {"name_en": "Whole Egg (Boiled)", "name_ru": "Яйцо куриное (вареное)", "name_kk": "Жұмыртқа (пісірілген)", "aliases": ["egg", "boiled egg", "eggs", "яйцо", "яйца", "вареное яйцо", "жұмыртқа", "жұмыртқалар"], "serving_g": 55, "calories_100g": 155.0, "protein_100g": 13.0, "carbs_100g": 1.1, "fat_100g": 11.0, "fiber_100g": 0.0, "category": "Eggs"},
    {"name_en": "Egg Whites", "name_ru": "Яичный белок", "name_kk": "Жұмыртқа ағы", "aliases": ["egg whites", "egg white", "яичный белок", "белок яичный", "жұмыртқа ағы"], "serving_g": 100, "calories_100g": 52.0, "protein_100g": 11.0, "carbs_100g": 0.7, "fat_100g": 0.2, "fiber_100g": 0.0, "category": "Eggs"},
    {"name_en": "Lean Beef / Steak (Cooked)", "name_ru": "Говядина нежирная (вареная/гриль)", "name_kk": "Сиыр еті", "aliases": ["beef", "steak", "lean beef", "говядина", "стейк", "мясо говядины", "сиыр еті", "ет"], "serving_g": 150, "calories_100g": 215.0, "protein_100g": 26.0, "carbs_100g": 0.0, "fat_100g": 12.0, "fiber_100g": 0.0, "category": "Meat"},
    {"name_en": "Minced Beef (Lean 90/10)", "name_ru": "Фарш говяжий нежирный", "name_kk": "Сиыр тартылған еті", "aliases": ["ground beef", "minced beef", "фарш", "говяжий фарш", "тартылған ет"], "serving_g": 150, "calories_100g": 217.0, "protein_100g": 24.5, "carbs_100g": 0.0, "fat_100g": 13.0, "fiber_100g": 0.0, "category": "Meat"},
    {"name_en": "Horse Meat (Kazy / Zhaya)", "name_ru": "Конина / Казы / Жая", "name_kk": "Жылқы еті / Қазы / Жая", "aliases": ["horse meat", "kazy", "zhaya", "конина", "казы", "жая", "жылқы еті", "қазы", "жая"], "serving_g": 150, "calories_100g": 215.0, "protein_100g": 28.0, "carbs_100g": 0.0, "fat_100g": 11.0, "fiber_100g": 0.0, "category": "Meat"},
    {"name_en": "Salmon Fillet (Baked/Grilled)", "name_ru": "Лосось / Семга (запеченная)", "name_kk": "Алабұға / Лосось (пісірілген)", "aliases": ["salmon", "salmon fillet", "лосось", "семга", "красная рыба", "балық", "лосось балығы"], "serving_g": 150, "calories_100g": 208.0, "protein_100g": 20.0, "carbs_100g": 0.0, "fat_100g": 13.0, "fiber_100g": 0.0, "category": "Seafood"},
    {"name_en": "Canned Tuna (in Water)", "name_ru": "Тунец консервированный в собственном соку", "name_kk": "Тунец консервісі", "aliases": ["tuna", "canned tuna", "тунец", "тунец в собственном соку", "тунец консервы"], "serving_g": 120, "calories_100g": 116.0, "protein_100g": 26.0, "carbs_100g": 0.0, "fat_100g": 1.0, "fiber_100g": 0.0, "category": "Seafood"},
    {"name_en": "White Fish / Cod Fillet", "name_ru": "Белая рыба / Треска / Минтай", "name_kk": "Ақ балық / Минтай", "aliases": ["cod", "white fish", "pollock", "треска", "минтай", "судак", "хек", "ақ балық"], "serving_g": 150, "calories_100g": 82.0, "protein_100g": 18.0, "carbs_100g": 0.0, "fat_100g": 0.7, "fiber_100g": 0.0, "category": "Seafood"},
    {"name_en": "Turkey Breast", "name_ru": "Грудка индейки", "name_kk": "Күркетауық төс еті", "aliases": ["turkey", "turkey breast", "индейка", "филе индейки", "грудка индейки", "күркетауық"], "serving_g": 150, "calories_100g": 135.0, "protein_100g": 30.0, "carbs_100g": 0.0, "fat_100g": 1.5, "fiber_100g": 0.0, "category": "Poultry"},
    {"name_en": "Cottage Cheese (Tvorog 5%)", "name_ru": "Творог 5%", "name_kk": "Сүзбе 5%", "aliases": ["cottage cheese", "curd", "tvorog", "творог", "творог 5%", "сүзбе", "сүзбе 5%"], "serving_g": 200, "calories_100g": 121.0, "protein_100g": 17.0, "carbs_100g": 3.0, "fat_100g": 5.0, "fiber_100g": 0.0, "category": "Dairy"},
    {"name_en": "Low Fat Cottage Cheese (Tvorog 0-2%)", "name_ru": "Творог обезжиренный 0-2%", "name_kk": "Майсыз сүзбе", "aliases": ["low fat curd", "fat free tvorog", "творог обезжиренный", "творог 2%", "майсыз сүзбе"], "serving_g": 200, "calories_100g": 86.0, "protein_100g": 18.0, "carbs_100g": 3.3, "fat_100g": 0.5, "fiber_100g": 0.0, "category": "Dairy"},
    {"name_en": "Greek Yogurt (Plain)", "name_ru": "Греческий йогурт натуральный", "name_kk": "Грек йогурты", "aliases": ["greek yogurt", "yogurt", "греческий йогурт", "йогурт натуральный", "йогурт", "грек йогурты"], "serving_g": 170, "calories_100g": 73.0, "protein_100g": 10.0, "carbs_100g": 3.6, "fat_100g": 2.0, "fiber_100g": 0.0, "category": "Dairy"},
    {"name_en": "Whey Protein Shake", "name_ru": "Протеин сывороточный (коктейль)", "name_kk": "Протеин коктейлі", "aliases": ["protein", "whey protein", "protein shake", "протеин", "сывороточный протеин", "протеиновый коктейль", "протеин коктейлі"], "serving_g": 30, "calories_100g": 390.0, "protein_100g": 78.0, "carbs_100g": 8.0, "fat_100g": 5.0, "fiber_100g": 2.0, "category": "Supplements"},
    {"name_en": "Tofu (Firm)", "name_ru": "Тофу соевый", "name_kk": "Тофу", "aliases": ["tofu", "soy tofu", "тофу", "соевый сыр тофу"], "serving_g": 120, "calories_100g": 83.0, "protein_100g": 10.0, "carbs_100g": 1.5, "fat_100g": 4.8, "fiber_100g": 0.5, "category": "Plant-based"},

    # Carbohydrates & Grains
    {"name_en": "White Rice (Boiled/Steamed)", "name_ru": "Рис белый (вареный)", "name_kk": "Ақ күріш (пісірілген)", "aliases": ["white rice", "rice", "steamed rice", "рис", "белый рис", "рис вареный", "күріш", "ақ күріш"], "serving_g": 180, "calories_100g": 130.0, "protein_100g": 2.7, "carbs_100g": 28.2, "fat_100g": 0.3, "fiber_100g": 0.4, "category": "Grains"},
    {"name_en": "Brown Rice (Cooked)", "name_ru": "Бурый / коричневый рис", "name_kk": "Қоңыр күріш", "aliases": ["brown rice", "бурый рис", "коричневый рис", "қоңыр күріш"], "serving_g": 180, "calories_100g": 111.0, "protein_100g": 2.6, "carbs_100g": 23.0, "fat_100g": 0.9, "fiber_100g": 1.8, "category": "Grains"},
    {"name_en": "Buckwheat (Boiled Grechka)", "name_ru": "Гречка (вареная)", "name_kk": "Қарақұмық (пісірілген)", "aliases": ["buckwheat", "grechka", "гречка", "гречневая каша", "гречневая крупа", "қарақұмық", "қарақұмық ботқасы"], "serving_g": 180, "calories_100g": 110.0, "protein_100g": 4.2, "carbs_100g": 21.3, "fat_100g": 1.3, "fiber_100g": 2.7, "category": "Grains"},
    {"name_en": "Oatmeal / Rolled Oats (Cooked with Water)", "name_ru": "Овсянка / Геркулес на воде", "name_kk": "Сұлы жармасы / Овсянка", "aliases": ["oatmeal", "oats", "porridge", "овсянка", "геркулес", "овсяная каша", "овсяные хлопья", "сұлы ботқасы", "сұлы"], "serving_g": 200, "calories_100g": 71.0, "protein_100g": 2.5, "carbs_100g": 12.0, "fat_100g": 1.4, "fiber_100g": 1.7, "category": "Grains"},
    {"name_en": "Durum Wheat Pasta / Macaroni (Boiled)", "name_ru": "Макароны твердых сортов / Паста", "name_kk": "Макарон / Паста (пісірілген)", "aliases": ["pasta", "spaghetti", "macaroni", "noodles", "макароны", "паста", "спагетти", "макарон", "макарондар"], "serving_g": 180, "calories_100g": 158.0, "protein_100g": 5.8, "carbs_100g": 31.0, "fat_100g": 0.9, "fiber_100g": 1.8, "category": "Grains"},
    {"name_en": "Boiled / Baked Potato", "name_ru": "Картофель вареный / печеный", "name_kk": "Картоп (пісірілген)", "aliases": ["potato", "boiled potato", "baked potato", "картошка", "картофель", "картофель вареный", "пюре", "картоп"], "serving_g": 200, "calories_100g": 86.0, "protein_100g": 2.0, "carbs_100g": 19.5, "fat_100g": 0.1, "fiber_100g": 2.0, "category": "Vegetables"},
    {"name_en": "Whole Wheat Bread", "name_ru": "Хлеб цельнозерновой", "name_kk": "Қара нан / Дәнді нан", "aliases": ["whole wheat bread", "brown bread", "хлеб цельнозерновой", "черный хлеб", "ржаной хлеб", "қара нан", "нан"], "serving_g": 40, "calories_100g": 247.0, "protein_100g": 9.0, "carbs_100g": 44.0, "fat_100g": 3.0, "fiber_100g": 6.0, "category": "Bakery"},
    {"name_en": "White Bread / Toast", "name_ru": "Хлеб белый / Тост", "name_kk": "Ақ нан / Тост", "aliases": ["white bread", "toast", "хлеб белый", "белый хлеб", "тост", "батон", "ақ нан"], "serving_g": 35, "calories_100g": 265.0, "protein_100g": 8.0, "carbs_100g": 50.0, "fat_100g": 3.2, "fiber_100g": 2.7, "category": "Bakery"},
    {"name_en": "Lentils (Cooked)", "name_ru": "Чечевица вареная", "name_kk": "Жасымық (пісірілген)", "aliases": ["lentils", "чечевица", "чечевичный суп", "жасымық"], "serving_g": 180, "calories_100g": 116.0, "protein_100g": 9.0, "carbs_100g": 20.0, "fat_100g": 0.4, "fiber_100g": 7.9, "category": "Legumes"},
    {"name_en": "Chickpeas (Boiled/Garbanzo)", "name_ru": "Нут вареный", "name_kk": "Нұт (пісірілген)", "aliases": ["chickpeas", "garbanzo", "нут", "турецкий горох", "нұт"], "serving_g": 160, "calories_100g": 164.0, "protein_100g": 8.9, "carbs_100g": 27.4, "fat_100g": 2.6, "fiber_100g": 7.6, "category": "Legumes"},

    # Traditional & Prepared Dishes
    {"name_en": "Borscht Soup with Beef", "name_ru": "Борщ с говядиной", "name_kk": "Борщ (етпен)", "aliases": ["borscht", "borsch", "борщ", "борщ со сметаной", "борщ с говядиной", "борщ етпен"], "serving_g": 350, "calories_100g": 58.0, "protein_100g": 3.5, "carbs_100g": 5.2, "fat_100g": 2.6, "fiber_100g": 1.5, "category": "Soups"},
    {"name_en": "Traditional Plov (Pilaf with Rice & Beef)", "name_ru": "Плов с говядиной", "name_kk": "Палау (етпен)", "aliases": ["plov", "pilaf", "плов", "плов с мясом", "узбекский плов", "палау", "ет палауы"], "serving_g": 300, "calories_100g": 185.0, "protein_100g": 7.5, "carbs_100g": 22.0, "fat_100g": 7.2, "fiber_100g": 1.2, "category": "Dishes"},
    {"name_en": "Beshbarmak (Meat with Dough & Broth)", "name_ru": "Бешбармак", "name_kk": "Бесбармақ / Ет", "aliases": ["beshbarmak", "besbarmak", "бешбармак", "бесбармақ", "қазақша ет", "ет асы"], "serving_g": 350, "calories_100g": 210.0, "protein_100g": 14.5, "carbs_100g": 18.2, "fat_100g": 9.0, "fiber_100g": 1.0, "category": "Dishes"},
    {"name_en": "Kespe / Noodle Soup with Beef", "name_ru": "Кеспе (суп-лапша с мясом)", "name_kk": "Кеспе (сорпа)", "aliases": ["kespe", "noodle soup", "кеспе", "суп с домашней лапшой", "сорпа", "кеспе сорпа"], "serving_g": 350, "calories_100g": 65.0, "protein_100g": 4.8, "carbs_100g": 7.5, "fat_100g": 2.2, "fiber_100g": 0.8, "category": "Soups"},
    {"name_en": "Manti with Beef & Onions", "name_ru": "Манты с говядиной", "name_kk": "Мәнті", "aliases": ["manti", "manty", "dumplings", "манты", "манты с мясом", "мәнті"], "serving_g": 250, "calories_100g": 195.0, "protein_100g": 8.5, "carbs_100g": 21.0, "fat_100g": 8.5, "fiber_100g": 1.1, "category": "Dishes"},
    {"name_en": "Lagman (Hand-pulled Noodles with Meat & Veg)", "name_ru": "Лагман с говядиной и овощами", "name_kk": "Лағман", "aliases": ["lagman", "laghman", "лагман", "лағман"], "serving_g": 350, "calories_100g": 145.0, "protein_100g": 7.0, "carbs_100g": 18.0, "fat_100g": 5.0, "fiber_100g": 1.5, "category": "Dishes"},
    {"name_en": "Samsa with Meat", "name_ru": "Самса с мясом", "name_kk": "Самса (етпен)", "aliases": ["samsa", "somsa", "самса", "самса с мясом", "ет самса"], "serving_g": 120, "calories_100g": 290.0, "protein_100g": 10.0, "carbs_100g": 28.0, "fat_100g": 15.0, "fiber_100g": 1.0, "category": "Bakery"},
    {"name_en": "Shorpa / Clear Meat Broth", "name_ru": "Шурпа / Сорпа мясная", "name_kk": "Сорпа / Шұрпа", "aliases": ["shorpa", "sorpa", "shurpa", "сорпа", "шурпа", "шұрпа", "бульон"], "serving_g": 350, "calories_100g": 45.0, "protein_100g": 4.0, "carbs_100g": 2.0, "fat_100g": 2.2, "fiber_100g": 0.5, "category": "Soups"},

    # Fruits & Vegetables & Healthy Fats
    {"name_en": "Fresh Banana", "name_ru": "Банан свежий", "name_kk": "Банан", "aliases": ["banana", "bananas", "банан", "бананы"], "serving_g": 120, "calories_100g": 89.0, "protein_100g": 1.1, "carbs_100g": 22.8, "fat_100g": 0.3, "fiber_100g": 2.6, "category": "Fruit"},
    {"name_en": "Fresh Apple", "name_ru": "Яблоко свежее", "name_kk": "Алма", "aliases": ["apple", "apples", "яблоко", "яблоки", "алма"], "serving_g": 150, "calories_100g": 52.0, "protein_100g": 0.3, "carbs_100g": 13.8, "fat_100g": 0.2, "fiber_100g": 2.4, "category": "Fruit"},
    {"name_en": "Fresh Avocado", "name_ru": "Авокадо", "name_kk": "Авокадо", "aliases": ["avocado", "авокадо"], "serving_g": 100, "calories_100g": 160.0, "protein_100g": 2.0, "carbs_100g": 8.5, "fat_100g": 14.7, "fiber_100g": 6.7, "category": "Fruit"},
    {"name_en": "Broccoli (Steamed)", "name_ru": "Брокколи на пару", "name_kk": "Брокколи", "aliases": ["broccoli", "брокколи", "брокколи вареная"], "serving_g": 100, "calories_100g": 35.0, "protein_100g": 2.4, "carbs_100g": 7.0, "fat_100g": 0.4, "fiber_100g": 2.6, "category": "Vegetables"},
    {"name_en": "Fresh Cucumber", "name_ru": "Огурец свежий", "name_kk": "Қияр", "aliases": ["cucumber", "огурец", "огурцы", "қияр"], "serving_g": 100, "calories_100g": 15.0, "protein_100g": 0.7, "carbs_100g": 3.6, "fat_100g": 0.1, "fiber_100g": 0.5, "category": "Vegetables"},
    {"name_en": "Fresh Tomato", "name_ru": "Помидор / Томат", "name_kk": "Қызанақ", "aliases": ["tomato", "tomatoes", "помидор", "томат", "помидоры", "қызанақ"], "serving_g": 100, "calories_100g": 18.0, "protein_100g": 0.9, "carbs_100g": 3.9, "fat_100g": 0.2, "fiber_100g": 1.2, "category": "Vegetables"},
    {"name_en": "Almonds / Walnuts", "name_ru": "Миндаль / Грецкие орехи", "name_kk": "Бадам / Жаңғақ", "aliases": ["almonds", "walnuts", "nuts", "миндаль", "грецкий орех", "орехи", "жаңғақ", "бадам"], "serving_g": 30, "calories_100g": 579.0, "protein_100g": 21.0, "carbs_100g": 21.6, "fat_100g": 49.9, "fiber_100g": 12.5, "category": "Nuts & Seeds"},
    {"name_en": "Peanut Butter (100% Natural)", "name_ru": "Арахисовая паста натуральная", "name_kk": "Жержаңғақ майы", "aliases": ["peanut butter", "арахисовая паста", "арахисовое масло", "жержаңғақ пастасы"], "serving_g": 30, "calories_100g": 588.0, "protein_100g": 25.0, "carbs_100g": 20.0, "fat_100g": 50.0, "fiber_100g": 6.0, "category": "Nuts & Seeds"},
    {"name_en": "Olive Oil (Extra Virgin)", "name_ru": "Оливковое масло", "name_kk": "Зәйтүн майы", "aliases": ["olive oil", "oil", "оливковое масло", "растительное масло", "масло", "зәйтүн майы"], "serving_g": 15, "calories_100g": 884.0, "protein_100g": 0.0, "carbs_100g": 0.0, "fat_100g": 100.0, "fiber_100g": 0.0, "category": "Fats & Oils"},
]

def clean_and_build_dataset():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(os.path.join("ml", "nutrition", "data"), exist_ok=True)

    print("Step 1: Inspecting OpenFoodFacts Raw TSV...")
    total_raw_rows = 0
    valid_raw_extracted = 0
    extracted_items = []
    seen_names = set()

    # Pre-populate with curated multilingual records
    for item in CURATED_MULTILINGUAL_FOODS:
        extracted_items.append(item)
        seen_names.add(item["name_en"].lower())
        for a in item.get("aliases", []):
            seen_names.add(a.lower())

    if os.path.exists(RAW_TSV_PATH):
        print(f"Reading from {RAW_TSV_PATH}...")
        with open(RAW_TSV_PATH, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f, delimiter='\t')
            for row in reader:
                total_raw_rows += 1
                name = (row.get('product_name') or row.get('generic_name') or '').strip()
                if not name or len(name) < 3 or len(name) > 80:
                    continue

                # Energy conversion: kJ to kcal or kcal
                energy_str = (row.get('energy_100g') or '').strip()
                protein_str = (row.get('proteins_100g') or '').strip()
                carbs_str = (row.get('carbohydrates_100g') or '').strip()
                fat_str = (row.get('fat_100g') or '').strip()
                fiber_str = (row.get('fiber_100g') or '').strip()

                try:
                    energy_val = float(energy_str) if energy_str else 0.0
                    # If energy is over 900, it is stored in kJ in OpenFoodFacts
                    calories_100g = round(energy_val / 4.184, 1) if energy_val > 900 else round(energy_val, 1)
                    
                    protein_100g = round(float(protein_str), 1) if protein_str else 0.0
                    carbs_100g = round(float(carbs_str), 1) if carbs_str else 0.0
                    fat_100g = round(float(fat_str), 1) if fat_str else 0.0
                    fiber_100g = round(float(fiber_str), 1) if fiber_str else 0.0

                    # Basic sanity filters
                    if (calories_100g < 0 or calories_100g > 950 or
                        protein_100g < 0 or protein_100g > 100 or
                        carbs_100g < 0 or carbs_100g > 100 or
                        fat_100g < 0 or fat_100g > 100):
                        continue

                    # At least one macro should be present
                    if calories_100g == 0 and protein_100g == 0 and carbs_100g == 0 and fat_100g == 0:
                        continue

                    clean_name_key = re.sub(r'[^a-zA-Z0-9а-яА-ЯёЁ\s]', '', name).lower().strip()
                    if clean_name_key in seen_names:
                        continue
                    seen_names.add(clean_name_key)

                    # Extract serving size
                    serving_str = row.get('serving_size') or ''
                    serving_g = 100
                    serv_match = re.search(r'(\d+(?:\.\d+)?)\s*g', serving_str, re.I)
                    if serv_match:
                        serving_g = int(float(serv_match.group(1)))
                        if serving_g < 5 or serving_g > 1000:
                            serving_g = 100

                    category = (row.get('categories_en') or 'General Food').split(',')[0].strip()[:30]

                    extracted_items.append({
                        "name_en": name,
                        "name_ru": name,
                        "name_kk": name,
                        "aliases": [name.lower(), clean_name_key],
                        "serving_g": serving_g,
                        "calories_100g": calories_100g,
                        "protein_100g": protein_100g,
                        "carbs_100g": carbs_100g,
                        "fat_100g": fat_100g,
                        "fiber_100g": fiber_100g,
                        "category": category
                    })
                    valid_raw_extracted += 1

                    # Keep a balanced, high-performance dataset (top 5,000 clean items)
                    if valid_raw_extracted >= 5000:
                        break
                except Exception:
                    continue
    else:
        print(f"Warning: {RAW_TSV_PATH} not found. Proceeding with comprehensive curated dataset.")

    print(f"Extracted {len(extracted_items)} clean, validated food items.")

    # Save to JSON
    with open(CLEAN_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(extracted_items, f, indent=2, ensure_ascii=False)

    # Save to CSV
    fieldnames = ["name_en", "name_ru", "name_kk", "serving_g", "calories_100g", "protein_100g", "carbs_100g", "fat_100g", "fiber_100g", "category"]
    with open(CLEAN_CSV_PATH, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        for item in extracted_items:
            writer.writerow(item)

    # Save copy into ml/nutrition/data/
    with open(os.path.join("ml", "nutrition", "data", "clean_nutrition_database.json"), 'w', encoding='utf-8') as f:
        json.dump(extracted_items, f, indent=2, ensure_ascii=False)

    # Inspection Report
    report = {
        "dataset_name": "SportX Nutrition Cleaned Multi-Lingual Dataset",
        "raw_source": "en.openfoodfacts.org.products.tsv & Curated Sports Nutrition Database",
        "total_samples": len(extracted_items),
        "columns": fieldnames,
        "languages": ["en", "ru", "kk"],
        "macro_ranges": {
            "calories_100g": [min(x["calories_100g"] for x in extracted_items), max(x["calories_100g"] for x in extracted_items)],
            "protein_100g": [min(x["protein_100g"] for x in extracted_items), max(x["protein_100g"] for x in extracted_items)],
            "carbs_100g": [min(x["carbs_100g"] for x in extracted_items), max(x["carbs_100g"] for x in extracted_items)],
            "fat_100g": [min(x["fat_100g"] for x in extracted_items), max(x["fat_100g"] for x in extracted_items)],
        },
        "clean_duplicates_removed": True,
        "units_normalized": "100g basis (kcal, grams)",
        "status": "ready_for_training"
    }

    with open(SUMMARY_REPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)

    print(f"Preprocessing completed successfully! Report saved to {SUMMARY_REPORT_PATH}")
    return report

if __name__ == "__main__":
    clean_and_build_dataset()
