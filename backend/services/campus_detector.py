
import re

from services.scam_detector import analyze_scam


CATEGORIES = {
    "tuition": {
        "name": "University Payment Scam",
        "keywords": [
            r"\btuition\b",
            r"\bbursar\b",
            r"\bstudent account\b",
            r"\buniversity fees?\b",
            r"\bsemester fees?\b",
        ],
        "signals": [
            (
                r"\b(account|enrollment|registration)"
                r".{0,35}\b(suspend|suspended|blocked)\b",
                "Threatens suspension or blocked enrollment",
                20,
            ),
            (
                r"\b(pay|payment|transfer)"
                r".{0,45}\b(personal account|gift card|crypto)\b",
                "Requests an unusual tuition payment method",
                25,
            ),
        ],
        "advice": (
            "Verify the balance through your university's "
            "official student portal. Contact the bursar "
            "or student accounts office using independently "
            "verified contact details."
        ),
    },
    "scholarship": {
        "name": "Scholarship Scam",
        "keywords": [
            r"\bscholarship\b",
            r"\bfinancial aid\b",
            r"\bgrant award\b",
        ],
        "signals": [
            (
                r"\b(processing|application|release)"
                r".{0,20}\bfee\b",
                "Requests a fee related to a scholarship",
                30,
            ),
            (
                r"\b(guaranteed|selected|won)"
                r".{0,45}\b(scholarship|grant)\b",
                "Claims a guaranteed or unexpected award",
                15,
            ),
        ],
        "advice": (
            "Verify the award through your school's "
            "financial aid office or the provider's "
            "independently verified website. Be cautious "
            "about paying to receive scholarship money."
        ),
    },
    "job": {
        "name": "Student Job Scam",
        "keywords": [
            r"\bjob offer\b",
            r"\bremote job\b",
            r"\bpart.time job\b",
            r"\bcampus employment\b",
            r"\bhiring\b",
        ],
        "signals": [
            (
                r"\b(deposit|cash)"
                r".{0,30}\b(check|cheque)\b",
                "Mentions depositing or cashing a check",
                20,
            ),
            (
                r"\b(buy|purchase|pay)"
                r".{0,30}\b(equipment|supplies|software)\b",
                "Requests an equipment or supplies purchase",
                20,
            ),
        ],
        "advice": (
            "Confirm the employer through its official "
            "careers page. Never send money back from "
            "a deposited check or pay an unknown "
            "recruiter to receive a job."
        ),
    },
    "housing": {
        "name": "Student Housing Scam",
        "keywords": [
            r"\bapartment\b",
            r"\brent(al)?\b",
            r"\blandlord\b",
            r"\bhousing\b",
            r"\blease\b",
        ],
        "signals": [
            (
                r"\b(deposit|send money|pay)"
                r".{0,45}\b(before viewing|before tour|"
                r"without viewing)\b",
                "Requests money before viewing the property",
                30,
            ),
            (
                r"\b(another renter|other applicants|"
                r"someone else)\b",
                "Uses competition or scarcity pressure",
                10,
            ),
        ],
        "advice": (
            "Verify the landlord and property independently. "
            "Inspect the property or arrange a trusted "
            "verification process before paying a deposit."
        ),
    },
}


def analyze_campus_scam(content):
    text = content.strip()

    if not text:
        raise ValueError("Please enter a message.")

    if len(text) > 10000:
        raise ValueError("Message exceeds 10,000 characters.")

    lowered = text.lower()

    # Existing payment scam detection
    base = analyze_scam(text)

    matched_categories = []

    for category_id, category in CATEGORIES.items():
        if not any(
            re.search(pattern, lowered)
            for pattern in category["keywords"]
        ):
            continue

        findings = []
        extra_score = 0

        for pattern, explanation, points in category["signals"]:
            if re.search(pattern, lowered):
                findings.append(explanation)
                extra_score += points

        matched_categories.append({
            "id": category_id,
            "name": category["name"],
            "findings": findings,
            "extra_score": extra_score,
            "advice": category["advice"],
        })

    # This is one heuristic score, not a probability.
    # Avoid adding the score from every category,
    # which would exaggerate multi-category messages.
    strongest_extra = max(
        (
            c["extra_score"]
            for c in matched_categories
        ),
        default=0,
    )

    score = min(
        100,
        base["risk_score"] + strongest_extra
    )

    if score >= 70:
        level = "High Risk"
    elif score >= 30:
        level = "Medium Risk"
    else:
        level = "Low Detected Risk"

    findings = list(base["findings"])

    for category in matched_categories:
        for finding in category["findings"]:
            if finding not in findings:
                findings.append(finding)

    if not matched_categories:
        category_label = "Unclassified Payment Request"
    else:
        category_label = ", ".join(
            c["name"] for c in matched_categories
        )

    advice = [
        c["advice"] for c in matched_categories
    ]

    if score >= 70:
        advice.insert(
            0,
            "Do not send money until the request "
            "has been independently verified."
        )
    else:
        advice.insert(
            0,
            "Check the sender and recipient independently "
            "before making a financial decision."
        )

    return {
        "category": category_label,
        "categories": [
            c["id"] for c in matched_categories
        ],
        "risk_score": score,
        "risk_level": level,
        "findings": findings,
        "recommendations": advice,
        "disclaimer": (
            "Experimental rule-based assessment. "
            "Category matches do not establish fraud. "
            "A low score does not confirm safety."
        ),
    }
