import pytest
from app.services.holistic_service import compute_daily_readiness_score


def test_readiness_score_calculation():
    # High recovery scenario
    readiness_high = compute_daily_readiness_score(
        sleep_score=90.0,
        soreness_1_to_10=1,
        fatigue_1_to_10=1,
        stress_1_to_10=1
    )
    assert readiness_high >= 90.0

    # Low recovery scenario
    readiness_low = compute_daily_readiness_score(
        sleep_score=40.0,
        soreness_1_to_10=8,
        fatigue_1_to_10=8,
        stress_1_to_10=9
    )
    assert readiness_low < 40.0
