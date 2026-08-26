"""
Regression tests verifying the no-show model and business case calculation
behave as claimed, against real measured performance — not just "it runs."
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pandas as pd
import pytest

from src.generate_data import generate_appointments, write_csv
from src.model import train_and_evaluate, find_flagging_threshold_for_recall
from src.business_case import compute_business_case, sensitivity_table

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "appointments.csv")


@pytest.fixture(scope="module")
def df():
    rows = generate_appointments()
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------
# Data generation sanity
# ---------------------------------------------------------------------

def test_no_show_rate_is_in_a_realistic_range(df):
    rate = df["no_show"].mean()
    assert 0.10 <= rate <= 0.35, (
        f"No-show rate {rate:.1%} is outside a realistic range for a "
        f"dealer service department — check generator assumptions"
    )


def test_prior_noshows_increases_noshow_probability(df):
    """Sanity check that the generator's directional assumption actually
    shows up in the data — customers with prior no-shows should have a
    meaningfully higher no-show rate than those without."""
    rate_with_history = df[df["prior_noshows_12mo"] > 0]["no_show"].mean()
    rate_without_history = df[df["prior_noshows_12mo"] == 0]["no_show"].mean()
    assert rate_with_history > rate_without_history + 0.05


# ---------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------

def test_model_beats_random_but_is_not_suspiciously_perfect(df):
    """AUC should be meaningfully above 0.5 (random) — the signal is real
    — but nowhere near 1.0, since no-show behavior is genuinely noisy and
    a perfect score would indicate a data-generation artifact, not a
    validated model."""
    _, auc, _ = train_and_evaluate(df)
    assert 0.65 <= auc < 0.95, (
        f"AUC {auc:.3f} is outside the expected realistic range"
    )


def test_flagging_threshold_achieves_target_recall_approximately(df):
    _, _, (X_test, y_test, y_proba) = train_and_evaluate(df)
    threshold, precision, recall = find_flagging_threshold_for_recall(y_test, y_proba, target_recall=0.5)
    assert 0.40 <= recall <= 0.60
    # Precision should beat the base rate meaningfully -- otherwise
    # flagging isn't actually targeting risk better than random.
    base_rate = y_test.mean()
    assert precision > base_rate * 1.5, (
        f"Precision {precision:.3f} does not meaningfully beat the base "
        f"no-show rate {base_rate:.3f} — flagging isn't adding value"
    )


# ---------------------------------------------------------------------
# Business case
# ---------------------------------------------------------------------

def test_business_case_produces_positive_net_benefit(df):
    result = compute_business_case(df)
    assert result["net_benefit"] > 0, (
        "Business case shows a net loss under baseline assumptions — "
        "either the assumptions or the model need revisiting before "
        "this could be presented as a viable use case"
    )


def test_business_case_uses_measured_model_performance_not_assumed(df):
    """Regression guard: precision/recall in the business case must come
    from the actual trained model's held-out performance, not a
    hardcoded/assumed value — otherwise the cost-benefit numbers would be
    fiction dressed up as a calculation."""
    result = compute_business_case(df)
    _, _, (X_test, y_test, y_proba) = train_and_evaluate(df)
    _, expected_precision, expected_recall = find_flagging_threshold_for_recall(y_test, y_proba, target_recall=0.5)
    assert abs(result["precision"] - expected_precision) < 0.05
    assert abs(result["recall"] - expected_recall) < 0.05


def test_net_benefit_stays_positive_across_conservative_sensitivity_range(df):
    """The recovery-rate assumption is the least-grounded number in the
    whole calculation (no real data backs it), so the business case must
    hold up even at the low end of a plausible range — not just at the
    headline assumption. This is what makes the ROI claim defensible
    rather than a single fragile point estimate."""
    rows = sensitivity_table(df, recovery_rates=(0.15, 0.25, 0.35, 0.50))
    for row in rows:
        assert row["net_benefit_eur"] > 0, (
            f"Net benefit turns negative at recovery_rate={row['recovery_rate']} "
            f"— the business case is not robust to this assumption"
        )
    # Sanity: net benefit should increase monotonically with recovery rate
    benefits = [row["net_benefit_eur"] for row in rows]
    assert benefits == sorted(benefits)
