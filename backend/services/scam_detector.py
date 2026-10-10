
import re
from urllib.parse import urlparse


def analyze_scam(content: str):
    text = content.lower().strip()
    score = 0
    findings = []

    if not text:
        raise ValueError("Please enter a URL or message.")

    urgent_words = [
        "urgent", "immediately", "act now",
        "suspended", "within 24 hours",
        "final warning", "account locked"
    ]

    payment_words = [
        "wire transfer", "gift card",
        "crypto payment", "send money",
        "pay now", "deposit required"
    ]

    for word in urgent_words:
        if word in text:
            score += 12
            findings.append(
                f"Uses urgency or pressure: '{word}'"
            )

    for word in payment_words:
        if word in text:
            score += 15
            findings.append(
                f"Contains a potentially risky payment request: '{word}'"
            )

    urls = re.findall(r'https?://[^\s<>"\']+', content, re.I)

    for raw_url in urls:
        parsed = urlparse(raw_url)
        hostname = (parsed.hostname or "").lower()

        if parsed.scheme == "http":
            score += 15
            findings.append(
                "Link does not use HTTPS encryption."
            )

        if "@" in parsed.netloc:
            score += 25
            findings.append(
                "URL contains an @ symbol that may hide its destination."
            )

        if "xn--" in hostname:
            score += 20
            findings.append(
                "Domain uses Punycode; verify it is not impersonating a brand."
            )

        if re.fullmatch(r"\d{1,3}(\.\d{1,3}){3}", hostname):
            score += 20
            findings.append(
                "URL uses an IP address instead of a typical domain."
            )

    score = min(score, 100)

    if score >= 70:
        level = "High Risk"
        recommendation = (
            "Do not send money or enter financial information. "
            "Verify the request through an independently trusted channel."
        )
    elif score >= 30:
        level = "Medium Risk"
        recommendation = (
            "Proceed cautiously. Verify the sender and payment destination "
            "before taking action."
        )
    else:
        level = "Low Detected Risk"
        recommendation = (
            "No major indicators were identified by these basic rules. "
            "This does not prove the request is legitimate."
        )

    return {
        "risk_score": score,
        "risk_level": level,
        "findings": findings,
        "recommendation": recommendation,
        "disclaimer": "Experimental heuristic assessment, not a safety guarantee."
    }
