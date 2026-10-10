
import re


def investigate(question, scan=None, transaction=None):
    """
    FraudShield's local investigation assistant.

    Routes questions to evidence-based responses.
    No external AI service is used.
    """

    q = question.lower().strip()
    scan = scan or {}
    transaction = transaction or {}

    if not q:
        return {
            "answer": "Please enter a question.",
            "evidence": []
        }

    evidence = []
    flagged = transaction.get("flagged_transactions") or []

    scan_findings = scan.get("findings") or []

    for finding in scan_findings[:8]:
        evidence.append(f"Payment scan: {finding}")

    for t in flagged[:8]:
        merchant = str(t.get("merchant", "Unknown merchant"))
        amount = t.get("amount", 0)

        for alert in (t.get("alerts") or [])[:3]:
            evidence.append(
                f"{merchant} (${amount:.2f}): {alert}"
            )

    def has_any(*phrases):
        return any(
            re.search(
                r"\b" + re.escape(phrase) + r"\b",
                q
            )
            for phrase in phrases
        )

    def transaction_summary():
        if not transaction:
            return (
                "I don't have a transaction analysis yet. "
                "Open Transaction Monitor and upload "
                "your sample CSV first."
            )

        count = transaction.get("total_transactions", 0)
        flagged_count = transaction.get("flagged_count", 0)

        return (
            f"I analyzed {count} transactions and "
            f"flagged {flagged_count} for review. "
        )

    def payment_summary():
        if not scan:
            return (
                "I don't have a payment scan yet. "
                "Use Scam Scanner to analyze a payment "
                "message or link first."
            )

        score = scan.get("risk_score", 0)
        level = scan.get("risk_level", "Unknown")

        result = (
            f"Your latest payment scan received a "
            f"heuristic risk score of {score}/100 "
            f"({level}). "
        )

        if scan_findings:
            result += (
                "The main warning indicators were: "
                + "; ".join(scan_findings[:5])
                + ". "
            )
        else:
            result += (
                "The current rules did not identify "
                "specific warning indicators. "
            )

        result += (
            "This score is not the probability of fraud "
            "and does not verify that a payment is safe."
        )

        return result

    # 1. Recovery questions get priority
    if has_any(
        "already paid", "already sent", "scammed",
        "scammer", "recover", "recovery", "refund",
        "money stolen", "lost money", "dispute",
        "unauthorized payment"
    ):
        answer = (
            "If you believe you've already sent money "
            "to a scammer, act quickly:\n\n"
            "1. Contact your bank or payment provider "
            "using its official phone number or app.\n"
            "2. Report the suspicious payment and ask "
            "whether a dispute, recall, or other "
            "recovery option is available.\n"
            "3. Save screenshots, receipts, messages, "
            "and transaction details.\n"
            "4. Change any compromised passwords and "
            "enable multifactor authentication.\n"
            "5. Report the scam through official "
            "consumer protection channels.\n\n"
            "Your options depend on how you paid. "
            "Recovery is not guaranteed."
        )

    # 2. Duplicate transaction questions
    elif has_any(
        "duplicate", "duplicates", "charged twice",
        "same charge", "double charged",
        "repeated payment"
    ):
        if not transaction:
            answer = transaction_summary()
        else:
            duplicates = [
                t for t in flagged
                if any(
                    "duplicate" in a.lower()
                    for a in (t.get("alerts") or [])
                )
            ]

            if duplicates:
                examples = [
                    f"{t['merchant']}: ${t['amount']:.2f}"
                    for t in duplicates[:6]
                ]

                answer = (
                    transaction_summary()
                    + "These transactions have possible "
                    "duplicate-charge indicators:\n\n"
                    + "\n".join(
                        f"- {item}" for item in examples
                    )
                    + "\n\nThese may be legitimate separate "
                    "purchases. Check your receipts and "
                    "bank statement before reporting them."
                )
            else:
                answer = (
                    transaction_summary()
                    + "No possible duplicate charges were "
                    "identified by the current rules."
                )

    # 3. Subscription questions
    elif has_any(
        "subscription", "subscriptions",
        "netflix", "recurring", "price increase"
    ):
        if not transaction:
            answer = transaction_summary()
        else:
            recurring = [
                t for t in flagged
                if any(
                    "recurring" in a.lower()
                    for a in (t.get("alerts") or [])
                )
            ]

            if recurring:
                items = [
                    f"{t['merchant']}: ${t['amount']:.2f}"
                    for t in recurring[:6]
                ]

                answer = (
                    "FraudShield detected potential "
                    "recurring payment changes:\n\n"
                    + "\n".join(
                        f"- {item}" for item in items
                    )
                    + "\n\nReview these changes against "
                    "your subscription agreements. "
                    "A price increase alone doesn't "
                    "mean fraud."
                )
            else:
                answer = (
                    "No recurring payment increases "
                    "were flagged in the latest analysis."
                )

    # 4. Transaction risk questions
    elif has_any(
        "transaction", "transactions", "charges",
        "spending", "merchant", "merchants",
        "which payments", "which charges"
    ):
        if not transaction:
            answer = transaction_summary()
        elif flagged:
            sorted_items = sorted(
                flagged,
                key=lambda t: t.get("risk_score", 0),
                reverse=True
            )

            items = [
                (
                    f"- {t['merchant']}: "
                    f"${t['amount']:.2f} "
                    f"(score: {t.get('risk_score', 0)}/100)"
                )
                for t in sorted_items[:6]
            ]

            answer = (
                transaction_summary()
                + "Here are the flagged payments, "
                "ordered by their heuristic risk scores:\n\n"
                + "\n".join(items)
                + "\n\nHigher scores indicate more "
                "rule-based warning signals, not "
                "confirmed fraud. Check the specific "
                "findings for each payment."
            )
        else:
            answer = (
                transaction_summary()
                + "No transactions were flagged by "
                "the current detection rules."
            )

    # 5. Payment scan and risk score questions
    elif has_any(
        "score", "scanned link", "latest scan",
        "payment risk", "high risk", "low risk",
        "why flagged", "why suspicious"
    ):
        if scan:
            answer = payment_summary()
        elif transaction:
            answer = transaction_summary()
        else:
            answer = payment_summary()

    # 6. Payment verification and phishing questions
    elif has_any(
        "verify", "verification", "phishing",
        "suspicious payment", "payment link",
        "university payment", "tuition",
        "website", "suspicious message"
    ):
        answer = (
            "Before making a suspicious payment:\n\n"
            "1. Open the organization's official "
            "website yourself, rather than using "
            "the link in the message.\n"
            "2. Confirm the payment amount and "
            "recipient through an official channel.\n"
            "3. Watch for unexpected domains, "
            "urgency, impersonation, and unusual "
            "payment methods.\n"
            "4. Never share one-time codes or "
            "banking passwords.\n\n"
        )

        if scan:
            answer += payment_summary()
        else:
            answer += (
                "You can paste the message into "
                "Scam Scanner for a preliminary "
                "assessment."
            )

    # 7. General questions about scams
    elif has_any("scam", "fraud", "suspicious", "risk"):
        answer = (
            "FraudShield can help identify warning "
            "indicators in payment requests and "
            "financial transactions.\n\n"
        )

        if scan:
            answer += payment_summary()
        elif transaction:
            answer += transaction_summary()
        else:
            answer += (
                "Start by scanning a suspicious payment "
                "message or uploading sample transactions."
            )

    # 8. Questions the local system cannot understand
    else:
        answer = (
            "I don't have enough information to answer "
            "that question accurately using my current "
            "local investigation rules.\n\n"
            "I can help with:\n"
            "- Suspicious transaction explanations\n"
            "- Duplicate charges\n"
            "- Recurring payment increases\n"
            "- Payment scam risk scores\n"
            "- Scam verification and recovery\n\n"
            "Try asking a more specific question."
        )

    return {
        "answer": answer,
        "evidence": evidence[:12],
        "disclaimer": (
            "FraudShield is an experimental, "
            "rule-based investigation assistant. "
            "Findings are not proof of fraud."
        )
    }
