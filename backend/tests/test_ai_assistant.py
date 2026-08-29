import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.api.v1.endpoints.ai_assistant import deterministic_fitness_response

client = TestClient(app)

def test_deterministic_fitness_response_on_topic():
    # Squats
    resp = deterministic_fitness_response("How should I perform squats?")
    assert "Squat" in resp or "Foot" in resp
    assert "90" in resp or "depth" in resp.lower()

    # Pushups
    resp_pushup = deterministic_fitness_response("What is the right elbow angle for push ups?")
    assert "Push-up" in resp_pushup or "45" in resp_pushup

def test_deterministic_fitness_response_off_topic_refusal():
    # Off-topic coding question
    resp_code = deterministic_fitness_response("Write python code for a binary search tree")
    assert resp_code == "I can only help with exercise technique, training, workouts, and fitness-related questions."

    # Off-topic history / general question
    resp_hist = deterministic_fitness_response("Who was the first president of the United States?")
    assert resp_hist == "I can only help with exercise technique, training, workouts, and fitness-related questions."

def test_ai_chat_api_endpoint():
    response = client.post(
        "/api/ai/chat",
        json={
            "message": "How do I avoid knee valgus during squats?",
            "user_context": {
                "sport": "Powerlifting",
                "training_level": "Intermediate",
                "overall_score": 88
            }
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "assistant"
    assert len(data["content"]) > 20
