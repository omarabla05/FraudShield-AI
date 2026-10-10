
import { useState } from "react";
import { API_BASE_URL } from "./api";

const API_URL = `${API_BASE_URL}/api/scam/analyze`;

const scenarios = [
  {
    id: "tuition",
    name: "University Tuition",
    icon: "🎓",
    message:
      "URGENT! Your student account will be suspended. " +
      "Pay now to avoid cancellation of your enrollment. " +
      "Send money immediately to the personal account " +
      "provided in this message."
  },
  {
    id: "scholarship",
    name: "Scholarship Award",
    icon: "🏆",
    message:
      "Congratulations! You have been selected for a " +
      "guaranteed scholarship. Pay a processing fee " +
      "immediately to receive your financial aid."
  },
  {
    id: "job",
    name: "Student Job Offer",
    icon: "💼",
    message:
      "You have received a remote job offer! Deposit " +
      "the check we send you and purchase equipment " +
      "from our approved supplier before starting."
  },
  {
    id: "housing",
    name: "Student Housing",
    icon: "🏠",
    message:
      "This apartment is available for rent. " +
      "Send your deposit before viewing the property " +
      "because other applicants are interested."
  }
];

export default function CampusIntelligence({
  onScan,
  onRecovery,
}) {
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function selectScenario(scenario) {
    setSelected(scenario.id);
    setContent(scenario.message);
    setResult(null);
    setError("");
  }

  async function analyze() {
    if (!content.trim()) {
      setError("Enter a message or select a scenario.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Campus analysis failed."
        );
      }

      setResult(data);

      if (onScan) {
        onScan(data);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not complete the analysis."
      );
    } finally {
      setLoading(false);
    }
  }

  const riskClass = result
    ? result.risk_score >= 70
      ? "high"
      : result.risk_score >= 30
      ? "medium"
      : "low"
    : "";

  return (
    <div className="campus-container">
      <div className="panel">
        <span className="hero-tag">
          STUDENT FINANCIAL PROTECTION
        </span>

        <h2>Campus Scam Intelligence</h2>

        <p>
          Investigate suspicious financial messages
          related to tuition, scholarships, student
          employment, and housing.
        </p>

        <p className="disclaimer">
          The examples below are fictional.
          FraudShield does not contact or verify
          real universities or payment providers.
        </p>
      </div>

      <div className="campus-scenarios">
        {scenarios.map((scenario) => (
          <button
            type="button"
            key={scenario.id}
            className={
              "campus-scenario " +
              (selected === scenario.id ? "selected" : "")
            }
            onClick={() => selectScenario(scenario)}
          >
            <span className="campus-scenario-icon">
              {scenario.icon}
            </span>

            <strong>{scenario.name}</strong>

            <small>Try example →</small>
          </button>
        ))}
      </div>

      <div className="panel">
        <h3>Investigate a Campus Payment Request</h3>

        <p>
          Choose an example above or paste a suspicious
          message below.
        </p>

        <textarea
          className="scan-textarea"
          value={content}
          maxLength={10000}
          placeholder="Paste a suspicious tuition, scholarship, job, or housing message..."
          onChange={(event) => {
            setContent(event.target.value);
            setSelected("");
            setResult(null);
            setError("");
          }}
        />

        <button
          type="button"
          className="primary-btn"
          onClick={analyze}
          disabled={loading || !content.trim()}
        >
          {loading
            ? "Investigating..."
            : "Analyze Campus Threat →"}
        </button>

        {error && (
          <p className="scan-error" role="alert">
            {error}
          </p>
        )}
      </div>

      {result && (
        <div className="panel result-panel">
          <h3>Campus Investigation Results</h3>

          <p>
            Detected category:{" "}
            <strong>{result.category}</strong>
          </p>

          <div className="result-top">
            <div>
              <span className="result-label">
                HEURISTIC RISK SCORE
              </span>

              <div className="risk-number">
                {result.risk_score}
                <small>/100</small>
              </div>
            </div>

            <span className={`risk-badge ${riskClass}`}>
              {result.risk_level}
            </span>
          </div>

          <div className="risk-track">
            <div
              className="risk-fill"
              style={{
                width: `${result.risk_score}%`,
                background:
                  riskClass === "high"
                    ? "#ef6464"
                    : riskClass === "medium"
                    ? "#f0b74f"
                    : "#40d9aa"
              }}
            />
          </div>

          <h4>Detected Warning Indicators</h4>

          {result.findings.length > 0 ? (
            <ul className="finding-list">
              {result.findings.map((finding, index) => (
                <li key={index}>{finding}</li>
              ))}
            </ul>
          ) : (
            <p>
              No warning indicators matched the current
              detection rules.
            </p>
          )}

          <div className="recommendation">
            <h4>Recommended Next Steps</h4>

            <ul className="campus-advice-list">
              {result.recommendations.map(
                (advice, index) => (
                  <li key={index}>{advice}</li>
                )
              )}
            </ul>
          </div>

          
          <p className="disclaimer">
            {result.disclaimer}
          </p>

          <button
            type="button"
            className="primary-btn"
            onClick={() => onRecovery?.(result)}
          >
            Create Recovery Report →
          </button>
        </div>
      )}
    </div>
  );
}
