import pytest
from ml.nutrition.inference.nutrition_matcher import NutritionInferenceEngine

def test_nutrition_inference_engine_initialization():
    engine = NutritionInferenceEngine()
    assert engine is not None
    assert engine.model_version == "sportx-nutrition-v2.0"
    assert len(engine.metadata) > 0

def test_nutrition_inference_single_item():
    engine = NutritionInferenceEngine()
    res = engine.predict("200g chicken breast", lang="en")
    assert len(res["detected_foods"]) >= 1
    assert res["total_calories"] > 0
    assert res["total_protein"] > 0
    assert res["total_grams"] == 200

def test_nutrition_inference_multilingual():
    engine = NutritionInferenceEngine()
    # Russian
    res_ru = engine.predict("Куриная грудка с рисом", lang="ru")
    assert len(res_ru["detected_foods"]) >= 2
    assert res_ru["total_calories"] > 200

    # Kazakh
    res_kk = engine.predict("Тауық еті", lang="kk")
    assert len(res_kk["detected_foods"]) >= 1
    assert res_kk["total_protein"] > 20

def test_nutrition_inference_composite_dishes():
    engine = NutritionInferenceEngine()
    res = engine.predict("Борщ с говядиной + 2 яйца", lang="ru")
    assert len(res["detected_foods"]) >= 2
    assert res["total_calories"] > 0
