import os
import json
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors

DATASET_PATH = os.path.join("data", "nutrition", "clean_nutrition_database.json")
MODEL_DIR = os.path.join("models", "nutrition")
ML_MODEL_DIR = os.path.join("ml", "nutrition", "models")
BACKEND_MODEL_DIR = os.path.join("backend", "app", "ml", "models", "weights", "nutrition")

def train_nutrition_model():
    os.makedirs(MODEL_DIR, exist_ok=True)
    os.makedirs(ML_MODEL_DIR, exist_ok=True)
    os.makedirs(BACKEND_MODEL_DIR, exist_ok=True)

    print("Step 1: Loading cleaned nutrition dataset...")
    with open(DATASET_PATH, 'r', encoding='utf-8') as f:
        foods = json.load(f)

    print(f"Loaded {len(foods)} food items for training.")

    # Build corpus for each item combining English, Russian, Kazakh names and aliases
    corpus = []
    metadata = []

    for idx, item in enumerate(foods):
        name_en = item.get("name_en", "")
        name_ru = item.get("name_ru", "")
        name_kk = item.get("name_kk", "")
        aliases = " ".join(item.get("aliases", []))
        category = item.get("category", "")

        combined_text = f"{name_en} {name_ru} {name_kk} {aliases} {category}".lower()
        corpus.append(combined_text)

        metadata.append({
            "id": idx,
            "name_en": name_en,
            "name_ru": name_ru,
            "name_kk": name_kk,
            "aliases": item.get("aliases", []),
            "serving_g": item.get("serving_g", 100),
            "calories_100g": item.get("calories_100g", 0.0),
            "protein_100g": item.get("protein_100g", 0.0),
            "carbs_100g": item.get("carbs_100g", 0.0),
            "fat_100g": item.get("fat_100g", 0.0),
            "fiber_100g": item.get("fiber_100g", 0.0),
            "category": category
        })

    print("Step 2: Training Multilingual TF-IDF N-gram Feature Extractor...")
    # Using word and char_wb n-grams for typo resilience across Cyrillic and Latin
    vectorizer = TfidfVectorizer(
        analyzer='char_wb',
        ngram_range=(2, 5),
        max_features=25000,
        sublinear_tf=True
    )
    X_vectors = vectorizer.fit_transform(corpus)
    print(f"TF-IDF feature matrix shape: {X_vectors.shape}")

    print("Step 3: Fitting Cosine Distance Nearest Neighbors Model...")
    nn_model = NearestNeighbors(
        n_neighbors=5,
        metric='cosine',
        algorithm='brute'
    )
    nn_model.fit(X_vectors)

    # Save artifacts
    model_payload = {
        "model_version": "sportx-nutrition-v2.0",
        "algorithm": "TF-IDF N-gram + Cosine NearestNeighbors Hybrid Retrieval",
        "num_items": len(foods),
        "feature_dim": X_vectors.shape[1],
        "metadata": metadata
    }

    print("Step 4: Saving model weights and artifacts...")
    for target_dir in [MODEL_DIR, ML_MODEL_DIR, BACKEND_MODEL_DIR]:
        joblib.dump(vectorizer, os.path.join(target_dir, "tfidf_vectorizer.joblib"))
        joblib.dump(nn_model, os.path.join(target_dir, "nn_model.joblib"))
        joblib.dump(X_vectors, os.path.join(target_dir, "food_vectors.joblib"))
        with open(os.path.join(target_dir, "model_manifest.json"), 'w', encoding='utf-8') as f:
            json.dump(model_payload, f, indent=2, ensure_ascii=False)

    print("Training complete! Model artifacts successfully saved.")
    return model_payload

if __name__ == "__main__":
    train_nutrition_model()
