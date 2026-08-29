# SportX Nutrition Recognition Model: Scientific Evaluation Report

**Model Version**: `sportx-nutrition-v2.0`  
**Architecture**: Character & Word N-Gram TF-IDF Feature Extractor + Cosine Distance NearestNeighbors Index + Portions Grammar Parser  
**Languages Supported**: English (`en`), Russian (`ru`), Kazakh (`kk`)

---

## 1. Classification & Retrieval Metrics

| Metric | Score | Definition |
| :--- | :--- | :--- |
| **Top-1 Strict Query Match Accuracy** | **77.78%** | All target food items correctly retrieved for composite phrases |
| **Food Token Precision** | **82.61%** | Proportion of retrieved foods that were relevant |
| **Food Token Recall** | **84.44%** | Proportion of relevant target foods retrieved |
| **Macro F1 Score** | **83.51%** | Harmonic mean of Precision and Recall |

---

## 2. Nutritional Estimation Error Metrics

| Target Macro | MAE (Mean Absolute Error) | RMSE (Root Mean Sq Error) |
| :--- | :--- | :--- |
| **Energy (Calories)** | **80.3 kcal** | **148.48 kcal** |
| **Protein** | **5.69 g** | **7.11 g** |

---

## 3. Benchmark Sample Inferences

```json
[
  {
    "query": "Chicken breast with rice",
    "language": "en",
    "detected_foods": [
      "Chicken Breast (Cooked)",
      "White Rice (Boiled/Steamed)"
    ],
    "total_calories": 481.5,
    "total_protein": 51.4,
    "expected_cal": 350,
    "calorie_error": 131.5,
    "match_success": true
  },
  {
    "query": "200g chicken breast",
    "language": "en",
    "detected_foods": [
      "Chicken Breast (Cooked)"
    ],
    "total_calories": 330.0,
    "total_protein": 62.0,
    "expected_cal": 330,
    "calorie_error": 0.0,
    "match_success": true
  },
  {
    "query": "2 whole eggs and toast",
    "language": "en",
    "detected_foods": [
      "Whole Egg (Boiled)",
      "White Bread / Toast"
    ],
    "total_calories": 263.3,
    "total_protein": 17.1,
    "expected_cal": 250,
    "calorie_error": 13.3,
    "match_success": true
  },
  {
    "query": "Oatmeal with banana",
    "language": "en",
    "detected_foods": [
      "Oatmeal / Rolled Oats (Cooked with Water)",
      "Fresh Banana"
    ],
    "total_calories": 248.8,
    "total_protein": 6.3,
    "expected_cal": 250,
    "calorie_error": 1.2,
    "match_success": true
  },
  {
    "query": "150g salmon fillet and broccoli",
    "language": "en",
    "detected_foods": [
      "Salmon Fillet (Baked/Grilled)",
      "Broccoli (Steamed)"
    ],
    "total_calories": 347.0,
    "total_protein": 32.4,
    "expected_cal": 350,
    "calorie_error": 3.0,
    "match_success": true
  }
]
```
