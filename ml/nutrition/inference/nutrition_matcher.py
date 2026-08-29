import os
import re
import json
import joblib
from typing import Dict, Any, List, Optional

class NutritionInferenceEngine:
    def __init__(self, model_dir: Optional[str] = None):
        if model_dir is None:
            candidates = [
                os.path.join("models", "nutrition"),
                os.path.join("ml", "nutrition", "models"),
                os.path.join("backend", "app", "ml", "models", "weights", "nutrition")
            ]
            for c in candidates:
                if os.path.exists(os.path.join(c, "tfidf_vectorizer.joblib")):
                    model_dir = c
                    break

        self.model_dir = model_dir
        self.vectorizer = None
        self.nn_model = None
        self.metadata = []
        self.model_version = "sportx-nutrition-v2.0"
        self.alias_map = {}

        if model_dir and os.path.exists(os.path.join(model_dir, "tfidf_vectorizer.joblib")):
            self.vectorizer = joblib.load(os.path.join(model_dir, "tfidf_vectorizer.joblib"))
            self.nn_model = joblib.load(os.path.join(model_dir, "nn_model.joblib"))
            with open(os.path.join(model_dir, "model_manifest.json"), 'r', encoding='utf-8') as f:
                manifest = json.load(f)
                self.metadata = manifest.get("metadata", [])
                self.model_version = manifest.get("model_version", "sportx-nutrition-v2.0")

            # Build fast exact alias lookup table
            for item in self.metadata:
                for alias in item.get("aliases", []):
                    self.alias_map[alias.lower().strip()] = item
                self.alias_map[item.get("name_en", "").lower().strip()] = item
                self.alias_map[item.get("name_ru", "").lower().strip()] = item
                self.alias_map[item.get("name_kk", "").lower().strip()] = item

    def parse_portions_and_segments(self, text: str) -> List[Dict[str, Any]]:
        """
        Splits natural language text into component phrases and extracts portions.
        """
        if not text or not text.strip():
            return []

        # Split by conjunctions: +, and, with, с, со, мен, пен, бен, және, да, де, &
        delimiters = r'(?:\s*\+\s*|\s+and\s+|\s+with\s+|\s+с\s+|\s+со\s+|\s+мен\s+|\s+пен\s+|\s+бен\s+|\s+және\s+|\s*,\s*|\s*&\s*)'
        raw_segments = [s.strip() for s in re.split(delimiters, text, flags=re.IGNORECASE) if s.strip()]

        results = []
        for segment in raw_segments:
            portion_g, unit, clean_query, is_explicit = self._extract_portion(segment)
            results.append({
                "raw_segment": segment,
                "clean_query": clean_query,
                "portion_g": portion_g,
                "unit": unit,
                "is_explicit_portion": is_explicit
            })

        return results

    def _extract_portion(self, segment: str):
        clean = segment.lower().strip()

        # 1. Grams / kg / ml
        g_match = re.match(r'^(\d+(?:\.\d+)?)\s*(?:g|г|гр|grams|грамм|граммдар)\s+(.*)$', clean, re.IGNORECASE)
        if g_match:
            g = float(g_match.group(1))
            return max(5, min(2000, g)), 'g', g_match.group(2).strip(), True

        kg_match = re.match(r'^(\d+(?:\.\d+)?)\s*(?:kg|кг|килограмм)\s+(.*)$', clean, re.IGNORECASE)
        if kg_match:
            g = float(kg_match.group(1)) * 1000
            return max(5, min(2000, g)), 'g', kg_match.group(2).strip(), True

        ml_match = re.match(r'^(\d+(?:\.\d+)?)\s*(?:ml|мл|миллилитр)\s+(.*)$', clean, re.IGNORECASE)
        if ml_match:
            g = float(ml_match.group(1))
            return max(5, min(2000, g)), 'ml', ml_match.group(2).strip(), True

        # 2. Count / pieces
        count_match = re.match(r'^(\d+(?:\.\d+)?)\s*(?:pcs|pc|шт|дана|штук|штуки|кусочка|кусок|slices|slice|eggs|яйца|жұмыртқа|whole)?\s+(.*)$', clean, re.IGNORECASE)
        if count_match:
            count = float(count_match.group(1))
            rest = count_match.group(2).strip()
            if count > 0 and count <= 20:
                return count * 1.0, 'count', rest, True

        # 3. Cups / Bowls
        cup_match = re.match(r'^(\d+(?:\.\d+)?)\s*(?:cup|cups|bowl|bowls|стакан|тарелка|кесе)\s+(.*)$', clean, re.IGNORECASE)
        if cup_match:
            cups = float(cup_match.group(1))
            return cups * 1.0, 'cup', cup_match.group(2).strip(), True

        return 100.0, 'default', clean, False

    def predict(self, text: str, lang: str = "en") -> Dict[str, Any]:
        segments = self.parse_portions_and_segments(text)
        if not segments:
            return {
                "raw_query": text,
                "detected_foods": [],
                "total_calories": 0.0,
                "total_protein": 0.0,
                "total_carbs": 0.0,
                "total_fat": 0.0,
                "total_fiber": 0.0,
                "total_grams": 0,
                "model_version": self.model_version,
                "is_estimated": True
            }

        detected_foods = []

        for seg in segments:
            query = seg["clean_query"]
            if not query:
                continue

            match = self._match_food_item(query)
            if not match:
                continue

            food_item = match["food"]
            confidence = match["confidence"]

            # Calculate scaled portion grams
            unit = seg["unit"]
            if unit == 'g' or unit == 'ml':
                final_grams = seg["portion_g"]
            elif unit == 'count':
                count = seg["portion_g"]
                single_serving = food_item.get("serving_g", 100)
                name_lower = food_item["name_en"].lower()
                if "egg" in name_lower:
                    single_serving = 55
                elif "bread" in name_lower or "toast" in name_lower:
                    single_serving = 40
                elif "banana" in name_lower:
                    single_serving = 120
                final_grams = round(count * single_serving)
            elif unit == 'cup':
                cups = seg["portion_g"]
                final_grams = round(cups * 180)
            else:
                final_grams = food_item.get("serving_g", 100)

            factor = final_grams / 100.0

            calories = round(food_item["calories_100g"] * factor, 1)
            protein = round(food_item["protein_100g"] * factor, 1)
            carbs = round(food_item["carbs_100g"] * factor, 1)
            fat = round(food_item["fat_100g"] * factor, 1)
            fiber = round(food_item.get("fiber_100g", 0.0) * factor, 1)

            display_name = food_item["name_en"]
            if lang == "ru":
                display_name = food_item.get("name_ru", food_item["name_en"])
            elif lang == "kk":
                display_name = food_item.get("name_kk", food_item["name_en"])

            detected_foods.append({
                "food_id": food_item.get("id", 0),
                "food_name": display_name,
                "original_name_en": food_item["name_en"],
                "category": food_item.get("category", "General"),
                "portion_grams": final_grams,
                "calories": calories,
                "protein": protein,
                "carbs": carbs,
                "fat": fat,
                "fiber": fiber,
                "confidence": round(confidence, 3),
                "is_estimated": not seg["is_explicit_portion"]
            })

        total_calories = round(sum(f["calories"] for f in detected_foods), 1)
        total_protein = round(sum(f["protein"] for f in detected_foods), 1)
        total_carbs = round(sum(f["carbs"] for f in detected_foods), 1)
        total_fat = round(sum(f["fat"] for f in detected_foods), 1)
        total_fiber = round(sum(f["fiber"] for f in detected_foods), 1)
        total_grams = int(sum(f["portion_grams"] for f in detected_foods))

        return {
            "raw_query": text,
            "detected_foods": detected_foods,
            "total_calories": total_calories,
            "total_protein": total_protein,
            "total_carbs": total_carbs,
            "total_fat": total_fat,
            "total_fiber": total_fiber,
            "total_grams": total_grams,
            "model_version": self.model_version,
            "is_estimated": any(f["is_estimated"] for f in detected_foods)
        }

    def _match_food_item(self, query: str):
        q_clean = query.lower().strip()

        # 1. Fast exact alias match
        if q_clean in self.alias_map:
            return {"food": self.alias_map[q_clean], "confidence": 1.0}

        # 2. Exact token substring match in alias map
        for alias, item in self.alias_map.items():
            if len(alias) >= 3 and (q_clean == alias or q_clean.startswith(alias) or alias in q_clean):
                return {"food": item, "confidence": 0.95}

        # 3. TF-IDF Cosine Nearest Neighbors retrieval
        if self.vectorizer and self.nn_model:
            q_vec = self.vectorizer.transform([q_clean])
            distances, indices = self.nn_model.kneighbors(q_vec, n_neighbors=1)
            dist = distances[0][0]
            idx = indices[0][0]
            similarity = max(0.0, 1.0 - dist)
            if similarity >= 0.12:
                matched_food = self.metadata[idx]
                return {"food": matched_food, "confidence": similarity}

        return None
