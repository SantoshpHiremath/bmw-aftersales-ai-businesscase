"""
Cost-benefit calculation for the no-show risk flagging use case, using the
classifier's actual measured precision/recall rather than invented numbers.

Assumptions are stated explicitly and are illustrative, not sourced from
any real BMW or dealer financial data — this is a synthetic-data project
demonstrating how to structure a business case, not a real cost estimate.
"""
import pandas as pd
from src.model import train_and_evaluate, find_flagging_threshold_for_recall

# --- Illustrative assumptions (stated explicitly, not real BMW data) ---
SERVICE_SLOT_VALUE_EUR = 180        # avg revenue at risk per idle service-bay slot
INTERVENTION_COST_EUR = 3           # cost of an extra reminder call/SMS per flagged appointment
INTERVENTION_RECOVERY_RATE = 0.35   # share of flagged true no-shows who show up anyway after intervention
ANNUAL_APPOINTMENTS = 40000         # illustrative single-region dealer-network volume


def compute_business_case(df, target_recall=0.5, annual_appointments=ANNUAL_APPOINTMENTS):
    pipeline, auc, (X_test, y_test, y_proba) = train_and_evaluate(df)
    threshold, precision, recall = find_flagging_threshold_for_recall(y_test, y_proba, target_recall)

    flagged_share = (y_proba >= threshold).mean()
    base_no_show_rate = df["no_show"].mean()

    # Scale test-set behavior to the illustrative annual volume
    annual_no_shows = annual_appointments * base_no_show_rate
    annual_flagged = annual_appointments * flagged_share
    annual_true_no_shows_caught = annual_no_shows * recall  # by definition of recall

    intervention_cost_total = annual_flagged * INTERVENTION_COST_EUR
    recovered_appointments = annual_true_no_shows_caught * INTERVENTION_RECOVERY_RATE
    value_recovered = recovered_appointments * SERVICE_SLOT_VALUE_EUR

    net_benefit = value_recovered - intervention_cost_total
    roi = (net_benefit / intervention_cost_total) if intervention_cost_total > 0 else float("nan")

    return {
        "auc": auc,
        "threshold": threshold,
        "precision": precision,
        "recall": recall,
        "flagged_share": flagged_share,
        "base_no_show_rate": base_no_show_rate,
        "annual_appointments": annual_appointments,
        "annual_no_shows": annual_no_shows,
        "annual_flagged": annual_flagged,
        "annual_true_no_shows_caught": annual_true_no_shows_caught,
        "recovered_appointments": recovered_appointments,
        "intervention_cost_total": intervention_cost_total,
        "value_recovered": value_recovered,
        "net_benefit": net_benefit,
        "roi": roi,
    }


def sensitivity_table(df, recovery_rates=(0.15, 0.25, 0.35, 0.50)):
    """Because INTERVENTION_RECOVERY_RATE is the least-grounded assumption
    (no real data backs it), report net benefit across a plausible range
    rather than a single point estimate — a single number invites false
    confidence a real business case shouldn't project."""
    import src.business_case as bc
    rows = []
    original = bc.INTERVENTION_RECOVERY_RATE
    for rate in recovery_rates:
        bc.INTERVENTION_RECOVERY_RATE = rate
        result = compute_business_case(df)
        rows.append({"recovery_rate": rate, "net_benefit_eur": result["net_benefit"], "roi": result["roi"]})
    bc.INTERVENTION_RECOVERY_RATE = original
    return rows


if __name__ == "__main__":
    df = pd.read_csv("data/appointments.csv")
    result = compute_business_case(df)
    for k, v in result.items():
        if isinstance(v, float):
            print(f"{k}: {v:,.2f}")
        else:
            print(f"{k}: {v}")

    print("\nSensitivity (net benefit across recovery-rate assumptions):")
    for row in sensitivity_table(df):
        print(f"  recovery_rate={row['recovery_rate']}: "
              f"net_benefit={row['net_benefit_eur']:,.0f} EUR, ROI={row['roi']:.2f}x")
