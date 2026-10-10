
import csv
import io
import statistics
from collections import defaultdict
from datetime import datetime
from decimal import Decimal, InvalidOperation


def analyze_transactions(csv_content: str):
    reader = csv.DictReader(io.StringIO(csv_content))

    if not reader.fieldnames:
        raise ValueError("CSV file has no headers.")

    fields = {
        name.strip().lower(): name
        for name in reader.fieldnames
        if name
    }

    required = ["date", "merchant", "amount"]

    for field in required:
        if field not in fields:
            raise ValueError(
                "CSV must contain: date, merchant, amount"
            )

    transactions = []

    for row_number, row in enumerate(reader, start=2):
        if not any(str(v or "").strip() for v in row.values()):
            continue

        if len(transactions) >= 1000:
            raise ValueError(
                "Maximum 1000 transactions per upload."
            )

        try:
            date = datetime.strptime(
                row[fields["date"]].strip(),
                "%Y-%m-%d"
            ).date()

            merchant = row[fields["merchant"]].strip()

            amount = Decimal(
                row[fields["amount"]].strip()
                .replace("$", "")
                .replace(",", "")
            )

            if not merchant or len(merchant) > 150:
                raise ValueError("Invalid merchant")

            if not amount.is_finite():
                raise ValueError("Invalid amount")

            if abs(amount) > 1000000:
                raise ValueError("Amount too large")

            amount = amount.quantize(Decimal("0.01"))

        except (
            ValueError, InvalidOperation,
            AttributeError, TypeError, KeyError
        ):
            raise ValueError(
                f"Invalid transaction at CSV row {row_number}."
            )

        transactions.append({
            "id": len(transactions) + 1,
            "date": date.isoformat(),
            "merchant": merchant,
            "amount": float(amount),
            "alerts": [],
            "risk_score": 0,
        })

    if not transactions:
        raise ValueError("No transactions found.")

    # This demo expects positive expenses.
    expenses = [
        t["amount"]
        for t in transactions
        if t["amount"] > 0
    ]

    median_amount = (
        statistics.median(expenses)
        if expenses else 0
    )

    def add_alert(transaction, message, points):
        transaction["alerts"].append(message)
        transaction["risk_score"] = min(
            100,
            transaction["risk_score"] + points
        )

    # Rule 1: Unusually large transactions
    if len(expenses) >= 5 and median_amount > 0:
        for t in transactions:
            if (
                t["amount"] > 0
                and t["amount"] >= 100
                and t["amount"] > median_amount * 3
            ):
                add_alert(
                    t,
                    "Unusually large compared with "
                    "the median expense",
                    45
                )

    # Rule 2: Same merchant, amount, and date
    seen = defaultdict(list)

    for t in transactions:
        if t["amount"] <= 0:
            continue

        key = (
            t["date"],
            t["merchant"].casefold(),
            t["amount"],
        )
        seen[key].append(t)

    for group in seen.values():
        if len(group) > 1:
            for t in group:
                add_alert(
                    t,
                    "Possible duplicate charge",
                    45
                )

    # Rule 3: Recurring merchant amount changes
    merchants = defaultdict(list)

    for t in transactions:
        if t["amount"] > 0:
            merchants[t["merchant"].casefold()].append(t)

    for group in merchants.values():
        group.sort(key=lambda t: (t["date"], t["id"]))

        for index in range(1, len(group)):
            previous = group[index - 1]
            current = group[index]

            previous_date = datetime.fromisoformat(
                previous["date"]
            ).date()
            current_date = datetime.fromisoformat(
                current["date"]
            ).date()

            days_apart = (current_date - previous_date).days

            if not 25 <= days_apart <= 35:
                continue

            if previous["amount"] <= 0:
                continue

            increase = (
                current["amount"] - previous["amount"]
            ) / previous["amount"]

            if increase >= 0.30 and (
                current["amount"] - previous["amount"]
            ) >= 5:
                add_alert(
                    current,
                    "Possible recurring payment increase "
                    "of 30% or more",
                    35
                )

    for t in transactions:
        if t["risk_score"] >= 70:
            t["risk_level"] = "High"
        elif t["risk_score"] >= 30:
            t["risk_level"] = "Medium"
        else:
            t["risk_level"] = "Low"

    flagged = [
        t for t in transactions
        if t["alerts"]
    ]

    total_spending = round(sum(expenses), 2)

    return {
        "total_transactions": len(transactions),
        "total_spending": total_spending,
        "flagged_count": len(flagged),
        "high_risk_count": sum(
            t["risk_level"] == "High"
            for t in transactions
        ),
        "transactions": transactions,
        "disclaimer": (
            "Alerts are rule-based anomalies, not proof "
            "of fraud. Confirm flagged charges with "
            "trusted financial records."
        ),
    }
