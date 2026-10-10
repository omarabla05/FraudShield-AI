
import re


def investigate(question, scan=None, transaction=None):
    """
    FraudShield AI Investigation Assistant.

    Provides evidence-based, rule-based financial
    cybersecurity guidance without external AI services.
    """

    q = str(question or "").lower().strip()
    scan = scan if isinstance(scan, dict) else {}
    transaction = transaction if isinstance(transaction, dict) else {}

    if not q:
        return {
            "answer": "Please enter a question.",
            "evidence": []
        }

    def to_number(value, default=0):
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    def to_count(value, default=0):
        try:
            return max(0, int(value))
        except (TypeError, ValueError):
            return default

    def money(value):
        return f"${to_number(value):,.2f}"

    def has_any(*phrases):
        return any(
            re.search(
                r"\b" + re.escape(phrase) + r"\b",
                q
            )
            for phrase in phrases
        )

    # ==========================================
    # TRANSACTION DATA
    # ==========================================

    raw_flagged = transaction.get("flagged_transactions")

    flagged = (
        raw_flagged
        if isinstance(raw_flagged, list)
        else []
    )

    flagged = [
        item for item in flagged
        if isinstance(item, dict)
    ]

    total_transactions = to_count(
        transaction.get("total_transactions", 0)
    )

    reported_flagged = to_count(
        transaction.get("flagged_count"),
        default=len(flagged)
    )

    flagged_count = max(reported_flagged, len(flagged))

    def transaction_summary():
        if not transaction:
            return (
                "I don't have a transaction analysis yet. "
                "Open Transaction Monitor and upload a CSV "
                "file first."
            )

        return (
            f"I analyzed {total_transactions} transactions "
            f"and flagged {flagged_count} for review. "
        )

    def flagged_details():
        if not flagged:
            if flagged_count > 0:
                return (
                    "The analysis reports flagged transactions, "
                    "but their individual details were not "
                    "included in the investigation data. "
                    "Open Transaction Monitor to review them."
                )

            return (
                "No transactions were flagged by the "
                "current detection rules."
            )

        sorted_items = sorted(
            flagged,
            key=lambda item: to_number(
                item.get("risk_score", 0)
            ),
            reverse=True
        )

        lines = []

        for item in sorted_items[:10]:
            merchant = str(
                item.get("merchant") or "Unknown merchant"
            )

            amount = money(item.get("amount"))

            score = to_number(
                item.get("risk_score", 0)
            )

            score_text = (
                f"{score:g}/100"
            )

            lines.append(
                f"- {merchant}: {amount} "
                f"(risk score: {score_text})"
            )

            alerts = item.get("alerts") or []

            if isinstance(alerts, list):
                for alert in alerts[:3]:
                    lines.append(f"  Reason: {alert}")

        return (
            "Here are the available flagged transactions, "
            "ordered by their risk scores:\n\n"
            + "\n".join(lines)
            + "\n\nThese are warning indicators, "
            "not confirmed cases of fraud."
        )

    # ==========================================
    # PAYMENT SCAN DATA
    # ==========================================

    scan_findings = scan.get("findings") or []

    if not isinstance(scan_findings, list):
        scan_findings = []

    def payment_summary():
        if not scan:
            return (
                "I don't have a payment scan yet. "
                "Use Scam Scanner or Campus Intelligence "
                "to analyze a suspicious message first."
            )

        score = scan.get("risk_score", 0)
        level = scan.get("risk_level", "Unknown")

        answer = (
            f"Your latest payment scan received a "
            f"heuristic risk score of {score}/100 "
            f"({level}). "
        )

        if scan_findings:
            answer += (
                "The main warning indicators were: "
                + "; ".join(
                    str(item) for item in scan_findings[:5]
                )
                + ". "
            )
        else:
            answer += (
                "The current rules did not identify "
                "specific warning indicators. "
            )

        answer += (
            "This score is not the probability of fraud "
            "and does not guarantee that a payment is safe."
        )

        return answer

    # ==========================================
    # SUPPORTING EVIDENCE
    # ==========================================

    evidence = []

    for finding in scan_findings[:8]:
        evidence.append(
            f"Payment scan: {finding}"
        )

    for item in flagged[:8]:
        merchant = str(
            item.get("merchant") or "Unknown merchant"
        )

        amount = money(item.get("amount"))

        alerts = item.get("alerts") or []

        if isinstance(alerts, list):
            for alert in alerts[:3]:
                evidence.append(
                    f"{merchant} ({amount}): {alert}"
                )

    # ==========================================
    # 1. RECOVERY QUESTIONS
    # ==========================================

    if has_any(
        "already paid",
        "already sent",
        "scammed",
        "scammer",
        "recover",
        "recovery",
        "refund",
        "money stolen",
        "lost money",
        "dispute",
        "unauthorized payment"
    ):
        answer = (
            "If you believe you've already sent money "
            "to a scammer, act quickly:\n\n"
            "1. Contact your bank or payment provider "
            "using its official phone number or app.\n"
            "2. Report the suspicious payment and ask "
            "whether a dispute, recall, or recovery "
            "option is available.\n"
            "3. Save screenshots, receipts, messages, "
            "and transaction details.\n"
            "4. Change compromised passwords and "
            "enable multifactor authentication.\n"
            "5. Report the scam through official "
            "consumer protection channels.\n\n"
            "Recovery depends on how the money was sent "
            "and is not guaranteed."
        )

    # ==========================================
    # 2. DUPLICATE TRANSACTIONS
    # ==========================================

    elif has_any(
        "duplicate",
        "duplicates",
        "charged twice",
        "same charge",
        "double charged",
        "repeated payment"
    ):
        if not transaction:
            answer = transaction_summary()

        else:
            duplicates = [
                item for item in flagged
                if any(
                    "duplicate" in str(alert).lower()
                    for alert in (item.get("alerts") or [])
                )
            ]

            if duplicates:
                examples = [
                    f"- {item.get('merchant', 'Unknown')}: "
                    f"{money(item.get('amount'))}"
                    for item in duplicates[:6]
                ]

                answer = (
                    transaction_summary()
                    + "These transactions contain possible "
                    "duplicate-charge indicators:\n\n"
                    + "\n".join(examples)
                    + "\n\nCheck your receipts and bank "
                    "statement before reporting them."
                )

            elif flagged_count > 0:
                answer = (
                    transaction_summary()
                    + "No duplicate-charge indicators were "
                    "found in the available transaction "
                    "details. Some flagged records may not "
                    "have been included in the assistant's "
                    "investigation data."
                )

            else:
                answer = (
                    transaction_summary()
                    + "No possible duplicate charges were "
                    "identified by the current rules."
                )

    # ==========================================
    # 3. SUBSCRIPTIONS
    # ==========================================

    elif has_any(
        "subscription",
        "subscriptions",
        "netflix",
        "recurring",
        "price increase"
    ):
        if not transaction:
            answer = transaction_summary()

        else:
            recurring = [
                item for item in flagged
                if any(
                    "recurring" in str(alert).lower()
                    for alert in (item.get("alerts") or [])
                )
            ]

            if recurring:
                items = [
                    f"- {item.get('merchant', 'Unknown')}: "
                    f"{money(item.get('amount'))}"
                    for item in recurring[:6]
                ]

                answer = (
                    transaction_summary()
                    + "FraudShield detected possible "
                    "recurring payment changes:\n\n"
                    + "\n".join(items)
                    + "\n\nReview these against your "
                    "subscription agreements. A price "
                    "increase alone does not mean fraud."
                )

            elif flagged_count > 0:
                answer = (
                    transaction_summary()
                    + "No recurring payment increases were "
                    "identified in the available transaction "
                    "details. Other flagged activity may "
                    "still need review."
                )

            else:
                answer = (
                    "No recurring payment increases were "
                    "flagged in the latest analysis."
                )

    # ==========================================
    # 4. TRANSACTION INVESTIGATION
    # ==========================================

    elif has_any(
        "transaction",
        "transactions",
        "charges",
        "spending",
        "merchant",
        "merchants",
        "which payments",
        "which charges",
        "flagged",
        "flags"
    ):
        if not transaction:
            answer = transaction_summary()

        elif flagged_count > 0:
            answer = (
                transaction_summary()
                + flagged_details()
                + "\n\nReview unfamiliar payments through "
                "your bank's official app or website. "
                "Do not assume that a flagged transaction "
                "is automatically fraudulent."
            )

        else:
            answer = (
                transaction_summary()
                + "No transactions were flagged by "
                "the current detection rules."
            )

    # ==========================================
    # 5. PAYMENT RISK SCORES
    # ==========================================

    elif has_any(
        "score",
        "scanned link",
        "latest scan",
        "payment risk",
        "high risk",
        "low risk",
        "why suspicious"
    ):
        if scan:
            answer = payment_summary()

        elif transaction:
            answer = (
                transaction_summary()
                + flagged_details()
            )

        else:
            answer = payment_summary()

    # ==========================================
    # 6. VERIFYING SUSPICIOUS PAYMENTS
    # ==========================================

    elif has_any(
        "verify",
        "verification",
        "phishing",
        "suspicious payment",
        "payment link",
        "university payment",
        "tuition",
        "website",
        "suspicious message"
    ):
        answer = (
            "Before making a suspicious payment:\n\n"
            "1. Open the organization's official website "
            "yourself rather than using a message link.\n"
            "2. Confirm the payment amount and recipient "
            "through an official channel.\n"
            "3. Watch for unusual domains, urgency, "
            "impersonation, and unexpected payment methods.\n"
            "4. Never share banking passwords or "
            "one-time verification codes.\n\n"
        )

        if scan:
            answer += payment_summary()

        else:
            answer += (
                "You can paste the suspicious message "
                "into Scam Scanner for a preliminary "
                "assessment."
            )

    # ==========================================
    # 7. GENERAL SCAM QUESTIONS
    # ==========================================

    elif has_any(
        "scam",
        "fraud",
        "suspicious",
        "risk"
    ):
        answer = (
            "FraudShield can identify warning indicators "
            "in payment messages and financial transactions.\n\n"
        )

        if scan:
            answer += payment_summary()

        elif transaction:
            answer += (
                transaction_summary()
                + flagged_details()
            )

        else:
            answer += (
                "Start by scanning a suspicious payment "
                "message or uploading a transaction CSV."
            )

    # ==========================================
    # 8. OTHER QUESTIONS
    # ==========================================

    else:
        answer = (
            "I don't have enough information to answer "
            "that question accurately using my current "
            "local investigation rules.\n\n"
            "I can help with:\n"
            "- Suspicious transactions\n"
            "- Duplicate charges\n"
            "- Recurring payments\n"
            "- Payment scam risk scores\n"
            "- Scam verification and recovery\n\n"
            "Try asking a more specific question."
        )

    return {
        "answer": answer,
        "evidence": evidence[:12],
        "disclaimer": (
            "FraudShield is an experimental, rule-based "
            "investigation assistant. Its findings are "
            "not proof of fraud."
        )
    }
