
import { useEffect, useState } from "react";

const methods = {
  credit: {
    label: "Credit Card",
    steps: [
      "Contact your card issuer through its official app or the number on your card.",
      "Report the suspicious charge and ask about dispute options.",
      "Ask whether your card should be locked or replaced.",
      "Preserve screenshots, receipts, messages, and payment confirmations."
    ]
  },
  debit: {
    label: "Debit Card",
    steps: [
      "Contact your bank immediately through an official channel.",
      "Report suspected unauthorized payments and ask about applicable deadlines.",
      "Ask whether your card or account should be secured.",
      "Review other recent payments for suspicious activity."
    ]
  },
  transfer: {
    label: "Bank Transfer",
    steps: [
      "Contact your bank immediately about the suspected scam.",
      "Ask whether a transfer recall or recovery procedure is available.",
      "Provide transaction references securely to your bank.",
      "Preserve payment confirmations and related communications."
    ]
  },
  paymentapp: {
    label: "Payment App",
    steps: [
      "Report the payment through the app's official support service.",
      "Ask whether cancellation, dispute, or recovery is possible.",
      "Report the suspected scammer through the platform.",
      "Secure your account and review other transactions."
    ]
  },
  crypto: {
    label: "Cryptocurrency",
    steps: [
      "Contact the exchange or wallet provider if applicable.",
      "Preserve transaction hashes, wallet addresses, and communications.",
      "Report the incident through official fraud-reporting channels.",
      "Avoid recovery services that demand advance payments."
    ]
  }
};

export default function RecoveryCenter({ scan = null }) {
  const [method, setMethod] = useState("credit");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [paymentSent, setPaymentSent] = useState("unknown");

  const [generated, setGenerated] = useState(false);
  const [completed, setCompleted] = useState([]);
  const [copyStatus, setCopyStatus] = useState("");

  // Keep imported scan separate so Reset can clear it.
  const [activeScan, setActiveScan] = useState(scan);

  // New incoming scans can still be imported after a reset.
  useEffect(() => {
    setActiveScan(scan);
    setGenerated(false);
    setCompleted([]);
    setCopyStatus("");
  }, [scan]);

  const plan = methods[method];

  const importedFindings = Array.isArray(activeScan?.findings)
    ? activeScan.findings
    : [];

  function updateForm(setter, value) {
    setter(value);
    setGenerated(false);
    setCompleted([]);
    setCopyStatus("");
  }

  function resetReport() {
    setMethod("credit");
    setAmount("");
    setDate("");
    setDescription("");
    setPaymentSent("unknown");

    setGenerated(false);
    setCompleted([]);
    setCopyStatus("");

    // Remove the current imported investigation.
    setActiveScan(null);

    // Move back to the recovery form.
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function generatePlan(event) {
    event.preventDefault();

    if (
      amount &&
      (
        !Number.isFinite(Number(amount)) ||
        Number(amount) < 0 ||
        Number(amount) > 100000000
      )
    ) {
      return;
    }

    setCompleted([]);
    setCopyStatus("");
    setGenerated(true);
  }

  function toggleCompleted(index) {
    setCompleted((previous) =>
      previous.includes(index)
        ? previous.filter((item) => item !== index)
        : [...previous, index]
    );
  }

  function buildReport() {
    const paymentStatus =
      paymentSent === "yes"
        ? "User reports payment was sent"
        : paymentSent === "no"
        ? "User reports payment was not sent"
        : "Payment status not confirmed";

    const lines = [
      "FRAUDSHIELD AI - FINANCIAL INCIDENT REPORT",
      "==========================================",
      "",
      "INCIDENT DETAILS",
      "",
      `Payment status: ${paymentStatus}`,
      `Payment method: ${plan.label}`,
      `Amount: ${
        amount
          ? "$" + Number(amount).toFixed(2)
          : "Not provided"
      }`,
      `Payment date: ${date || "Not provided"}`,
      "",
      "USER DESCRIPTION",
      description || "No description provided.",
      "",
      "FRAUDSHIELD SECURITY INVESTIGATION",
      ""
    ];

    if (activeScan) {
      lines.push(
        `Source: ${
          activeScan.source || "FraudShield Scanner"
        }`,
        `Heuristic risk score: ${
          activeScan.risk_score
        }/100`,
        `Risk classification: ${
          activeScan.risk_level
        }`,
        "",
        "DETECTED WARNING INDICATORS"
      );

      if (importedFindings.length > 0) {
        importedFindings.forEach((finding, index) => {
          lines.push(`${index + 1}. ${finding}`);
        });
      } else {
        lines.push(
          "No warning indicators matched the current rules."
        );
      }

      lines.push(
        "",
        "ORIGINAL SCANNER RECOMMENDATION",
        activeScan.recommendation ||
          "Verify the payment request independently."
      );
    } else {
      lines.push(
        "No FraudShield investigation was imported."
      );
    }

    lines.push(
      "",
      "RECOMMENDED RESPONSE ACTIONS",
      ""
    );

    if (paymentSent === "no") {
      lines.push(
        "1. Do not send money until the request is verified.",
        "2. Contact the organization through its official website.",
        "3. Do not use payment details from suspicious messages.",
        "4. Preserve the suspicious message as evidence."
      );
    } else {
      plan.steps.forEach((step, index) => {
        lines.push(`${index + 1}. ${step}`);
      });
    }

    lines.push(
      "",
      "IMPORTANT INFORMATION",
      "",
      "This report was prepared using FraudShield AI.",
      "Scanner findings are experimental and rule-based.",
      "Risk scores are not probabilities of fraud.",
      "A suspicious indicator does not prove fraud occurred.",
      "User-provided information was not independently verified.",
      "FraudShield cannot reverse payments or guarantee recovery."
    );

    return lines.join("\n");
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(buildReport());

      setCopyStatus(
        "Incident report copied successfully."
      );
    } catch {
      setCopyStatus(
        "Could not copy automatically. Check your browser permissions."
      );
    }
  }

  return (
    <div className="recovery-container">

      {/* STEP 1: RECOVERY FORM */}

      <div className="panel">

        <span className="hero-tag">
          FINANCIAL INCIDENT RESPONSE
        </span>

        <h2 style={{ marginTop: "15px" }}>
          Financial Incident Recovery
        </h2>

        <p>
          Complete the details below to prepare your
          financial incident report. Any imported
          FraudShield scan findings will be included
          automatically.
        </p>

        {/* Imported scan confirmation */}

        {activeScan && (
          <div className="recovery-import-notice">

            <strong>
              ✓ Investigation Imported Successfully
            </strong>

            <p>
              Source:{" "}
              {activeScan.source || "FraudShield Scanner"}
            </p>

            <p>
              Risk Score: {activeScan.risk_score}/100
              {" — "}
              {activeScan.risk_level}
            </p>

            <small>
              Full scan evidence will appear after
              generating your report.
            </small>

          </div>
        )}

        <form
          onSubmit={generatePlan}
          className="recovery-form"
        >

          <label>
            Have you already sent money?

            <select
              value={paymentSent}
              onChange={(event) =>
                updateForm(
                  setPaymentSent,
                  event.target.value
                )
              }
            >
              <option value="unknown">
                Not sure / prefer not to say
              </option>

              <option value="yes">
                Yes, I sent money
              </option>

              <option value="no">
                No, I have not paid
              </option>
            </select>
          </label>

          <label>
            Payment Method

            <select
              value={method}
              onChange={(event) =>
                updateForm(
                  setMethod,
                  event.target.value
                )
              }
            >
              {Object.entries(methods).map(
                ([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            Amount (USD)

            <input
              type="number"
              min="0"
              max="100000000"
              step="0.01"
              value={amount}
              onChange={(event) =>
                updateForm(
                  setAmount,
                  event.target.value
                )
              }
              placeholder="Example: 450.00"
            />
          </label>

          <label>
            Payment Date

            <input
              type="date"
              value={date}
              onChange={(event) =>
                updateForm(
                  setDate,
                  event.target.value
                )
              }
            />
          </label>

          <label>
            Describe What Happened

            <textarea
              value={description}
              onChange={(event) =>
                updateForm(
                  setDescription,
                  event.target.value
                )
              }
              rows={5}
              maxLength={2000}
              placeholder="Describe the incident. Do not include passwords, account numbers, or card details."
            />
          </label>

          {/* REPORT ACTION BUTTONS */}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "12px"
            }}
          >

            <button
              className="primary-btn"
              type="submit"
            >
              Generate Incident Report →
            </button>

            <button
              className="secondary-btn"
              type="button"
              onClick={resetReport}
            >
              ↻ Reset Report
            </button>

          </div>

        </form>
      </div>

      {/* STEP 2: GENERATED RESULTS */}

      {generated && (
        <>

          {/* Imported scan findings */}

          {activeScan && (
            <div className="panel result-panel">

              <span className="hero-tag">
                IMPORTED SECURITY INVESTIGATION
              </span>

              <h3 style={{ marginTop: "15px" }}>
                FraudShield Scan Results
              </h3>

              <p>
                Source:{" "}
                <strong>
                  {activeScan.source || "FraudShield Scanner"}
                </strong>
              </p>

              <div className="result-top">

                <div>
                  <span className="result-label">
                    HEURISTIC RISK SCORE
                  </span>

                  <div className="risk-number">
                    {activeScan.risk_score}
                    <small>/100</small>
                  </div>
                </div>

                <span
                  className={`risk-badge ${
                    activeScan.risk_score >= 70
                      ? "high"
                      : activeScan.risk_score >= 30
                      ? "medium"
                      : "low"
                  }`}
                >
                  {activeScan.risk_level}
                </span>

              </div>

              <div className="risk-track">
                <div
                  className="risk-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        activeScan.risk_score || 0
                      )
                    )}%`,
                    background:
                      activeScan.risk_score >= 70
                        ? "#ef6464"
                        : activeScan.risk_score >= 30
                        ? "#f0b74f"
                        : "#40d9aa"
                  }}
                />
              </div>

              <h4>
                Detected Warning Indicators
              </h4>

              {importedFindings.length > 0 ? (
                <ul className="finding-list">
                  {importedFindings.map(
                    (finding, index) => (
                      <li key={index}>
                        {finding}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p>
                  No warning indicators matched
                  the current rules.
                </p>
              )}

              <div className="recommendation">
                <h4>
                  Scanner Recommendation
                </h4>

                <p>
                  {activeScan.recommendation ||
                    "Verify the request independently."}
                </p>
              </div>

              <p className="disclaimer">
                These findings are automated indicators,
                not proof that fraud occurred.
              </p>

            </div>
          )}

          {/* FINAL INCIDENT REPORT */}

          <div className="panel">

            <span className="hero-tag">
              FRAUDSHIELD INCIDENT RESPONSE
            </span>

            <h2 style={{ marginTop: "15px" }}>
              Your Financial Incident Report
            </h2>

            <p>
              Your report combines your incident
              information, available security findings,
              and recommended response actions.
            </p>

            {paymentSent === "no" ? (

              <div className="recommendation">
                <h4>
                  Prevention Guidance
                </h4>

                <p>
                  You indicated that you have not
                  sent money. Independently verify
                  the request before making a payment.
                  Avoid using suspicious links.
                </p>
              </div>

            ) : (

              <>

                <h3>
                  Recovery Checklist
                </h3>

                {paymentSent === "unknown" && (
                  <p className="disclaimer">
                    You haven't confirmed whether
                    money was sent. These steps are
                    provided as precautions.
                  </p>
                )}

                <div className="recovery-progress">
                  {completed.length} of{" "}
                  {plan.steps.length} steps completed
                </div>

                <div className="recovery-steps">

                  {plan.steps.map((step, index) => (

                    <label
                      className="recovery-step"
                      key={index}
                    >

                      <input
                        type="checkbox"
                        checked={completed.includes(
                          index
                        )}
                        onChange={() =>
                          toggleCompleted(index)
                        }
                      />

                      <span>
                        {step}
                      </span>

                    </label>

                  ))}

                </div>

              </>

            )}

            <h3 style={{ marginTop: "30px" }}>
              Incident Report Preview
            </h3>

            <pre className="incident-report-preview">
              {buildReport()}
            </pre>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                alignItems: "center"
              }}
            >

              <button
                type="button"
                className="primary-btn"
                onClick={copyReport}
              >
                Copy Full Incident Report →
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={resetReport}
              >
                ↻ Start New Report
              </button>

            </div>

            {copyStatus && (
              <p role="status">
                {copyStatus}
              </p>
            )}

          </div>

        </>
      )}

    </div>
  );
}
