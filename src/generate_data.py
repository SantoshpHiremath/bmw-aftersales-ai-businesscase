"""
Synthetic Aftersales service-appointment data generator.

Models a common automotive aftersales problem: customers booking a
service appointment (maintenance, repair, recall) who then don't show up,
leaving the service bay idle and wasting technician capacity that could
have been used for another customer. This is a real, well-known
operational problem in dealer service departments, used here as the
subject of a small, honestly-evaluated AI use case for a business case.

All data is synthetic. No real BMW, dealer, or customer data is used or
implied anywhere in this project.
"""
import csv
import random

RNG_SEED = 42

SERVICE_TYPES = ["Scheduled Maintenance", "Recall Service", "Repair — Customer Reported",
                  "Warranty Repair", "Tire Service", "Software Update"]

CHANNELS = ["Online Portal", "Phone", "Dealer Walk-in", "Mobile App"]


def generate_appointments(n=6000, seed=RNG_SEED):
    """Generate synthetic service-appointment records with a realistic,
    noisy no-show outcome.

    No-show probability is driven by a handful of directionally realistic
    factors (lead time, prior no-show history, reminder sent, appointment
    day) plus substantial random noise — deliberately not a clean rule,
    so a classifier has to learn from genuinely imperfect signal.
    """
    rng = random.Random(seed)
    rows = []

    for i in range(n):
        service_type = rng.choice(SERVICE_TYPES)
        channel = rng.choice(CHANNELS)
        lead_time_days = rng.choice([0, 1, 2, 3, 5, 7, 10, 14, 21, 30])
        prior_noshows = rng.choices([0, 0, 0, 0, 1, 1, 2, 3], k=1)[0]
        reminder_sent = rng.random() < 0.65
        weekday = rng.choice(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"])
        distance_km = round(rng.uniform(1, 45), 1)
        is_loaner_requested = rng.random() < 0.22

        # Base no-show probability, then adjusted by realistic factors
        p = 0.04
        p += 0.015 * lead_time_days if lead_time_days > 7 else 0.0
        p += 0.12 * prior_noshows
        p -= 0.05 if reminder_sent else 0.0
        p += 0.03 if weekday == "Sat" else 0.0
        p += 0.002 * distance_km
        p -= 0.03 if is_loaner_requested else 0.0  # loaner requests correlate with real intent
        p += rng.uniform(-0.05, 0.05)  # noise
        p = max(0.01, min(0.85, p))

        no_show = rng.random() < p

        rows.append({
            "appointment_id": f"APT-{100000+i}",
            "service_type": service_type,
            "booking_channel": channel,
            "lead_time_days": lead_time_days,
            "prior_noshows_12mo": prior_noshows,
            "reminder_sent": int(reminder_sent),
            "weekday": weekday,
            "distance_to_dealer_km": distance_km,
            "loaner_requested": int(is_loaner_requested),
            "no_show": int(no_show),
        })

    rng.shuffle(rows)
    return rows


def write_csv(rows, path):
    fieldnames = list(rows[0].keys())
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


if __name__ == "__main__":
    rows = generate_appointments()
    write_csv(rows, "data/appointments.csv")
    no_show_rate = sum(r["no_show"] for r in rows) / len(rows)
    print(f"Generated {len(rows)} appointments, no-show rate: {no_show_rate:.1%}")
