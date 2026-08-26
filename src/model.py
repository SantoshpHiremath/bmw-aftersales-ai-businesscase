"""
No-show risk classifier: predicts which booked service appointments are
likely to be no-shows, so the service department can act (send an extra
reminder, offer a reschedule, or overbook that slot) — the AI use case
underneath the business case.
"""
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import roc_auc_score, precision_recall_curve, classification_report


NUMERIC_FEATURES = ["lead_time_days", "prior_noshows_12mo", "reminder_sent",
                     "distance_to_dealer_km", "loaner_requested"]
CATEGORICAL_FEATURES = ["service_type", "booking_channel", "weekday"]


def build_pipeline(seed=42):
    preprocessor = ColumnTransformer([
        ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
    ], remainder="passthrough")
    model = Pipeline([
        ("preprocess", preprocessor),
        ("clf", LogisticRegression(max_iter=1000, random_state=seed)),
    ])
    return model


def train_and_evaluate(df, seed=42):
    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df["no_show"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=seed, stratify=y
    )

    pipeline = build_pipeline(seed)
    pipeline.fit(X_train, y_train)

    y_proba = pipeline.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, y_proba)

    return pipeline, auc, (X_test, y_test, y_proba)


def find_flagging_threshold_for_recall(y_test, y_proba, target_recall=0.5):
    """Find the probability threshold that flags roughly the top
    target_recall share of true no-shows, for a realistic 'flag the
    riskiest N% of appointments' operational policy rather than an
    arbitrary 0.5 cutoff."""
    precision, recall, thresholds = precision_recall_curve(y_test, y_proba)
    # thresholds has len = len(precision) - 1
    best_idx = None
    for i, r in enumerate(recall[:-1]):
        if r <= target_recall:
            best_idx = i
            break
    if best_idx is None:
        best_idx = len(thresholds) - 1
    return thresholds[best_idx], precision[best_idx], recall[best_idx]


if __name__ == "__main__":
    df = pd.read_csv("data/appointments.csv")
    pipeline, auc, (X_test, y_test, y_proba) = train_and_evaluate(df)
    print(f"Held-out ROC-AUC: {auc:.3f}")

    threshold, precision, recall = find_flagging_threshold_for_recall(y_test, y_proba, target_recall=0.5)
    print(f"Threshold flagging ~50% of true no-shows: {threshold:.3f} "
          f"(precision={precision:.3f}, recall={recall:.3f})")

    flagged_share = (y_proba >= threshold).mean()
    print(f"Share of all appointments flagged at this threshold: {flagged_share:.1%}")
