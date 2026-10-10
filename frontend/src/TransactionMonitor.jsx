
import { useState } from "react";

const API_URL =
  `${API_BASE_URL}/api/scam/analyze`;

export default function TransactionMonitor({ onAnalysis }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload() {
    if (!file) {
      setError("Please select a CSV file first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          typeof data.detail === "string"
            ? data.detail
            : "Could not analyze the file.";
        throw new Error(message);
      }

      setResult(data);

      if (onAnalysis) {
        onAnalysis(data);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Analysis failed."
      );
    } finally {
      setLoading(false);
    }
  }

  const money = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  return (
    <div className="scanner-layout">
      <div className="panel">
        <h3>Transaction Fraud Detection</h3>

        <p>
          Upload a CSV file to analyze spending patterns,
          possible duplicate payments, and unusual charges.
        </p>

        <p>
          Use fictional data for testing. Do not upload
          account numbers or other sensitive banking details.
        </p>

        <div className="upload-zone">
          <div className="upload-icon">▤</div>

          <h3>Upload Financial Transactions</h3>

          <p>Accepted format: CSV (maximum 1 MB)</p>

          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setResult(null);
              setError("");
            }}
          />

          <p className="file-name">
            {file
              ? `Selected: ${file.name}`
              : "No file selected"}
          </p>
        </div>

        <button
          className="primary-btn"
          disabled={loading || !file}
          onClick={handleUpload}
        >
          {loading
            ? "Analyzing Transactions..."
            : "Analyze Transactions →"}
        </button>

        {error && (
          <p className="scan-error" role="alert">
            {error}
          </p>
        )}
      </div>

      {result && (
        <>
          <div className="stats">
            <div className="stat-card">
              <span>Transactions Analyzed</span>
              <strong>{result.total_transactions}</strong>
              <small>Records processed</small>
            </div>

            <div className="stat-card">
              <span>Flagged Transactions</span>
              <strong>{result.flagged_count}</strong>
              <small>Require review</small>
            </div>

            <div className="stat-card">
              <span>Total Expenses</span>
              <strong className="money-stat">
                {money(result.total_spending)}
              </strong>
              <small>Positive CSV amounts</small>
            </div>
          </div>

          <div className="panel">
            <h3>Financial Security Analysis</h3>

            <p>
              {result.flagged_count === 0
                ? "No anomalies were detected by the current rules."
                : `${result.flagged_count} transactions were flagged for review.`}
            </p>

            <div className="transaction-table-wrap">
              <table className="transaction-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Merchant</th>
                    <th>Amount</th>
                    <th>Risk</th>
                    <th>Score</th>
                  </tr>
                </thead>

                <tbody>
                  {result.transactions.map((t) => (
                    <tr key={t.id}>
                      <td>{t.date}</td>
                      <td>{t.merchant}</td>
                      <td>{money(t.amount)}</td>
                      <td>
                        <span
                          className={`risk-badge ${
                            t.risk_level.toLowerCase()
                          }`}
                        >
                          {t.risk_level}
                        </span>
                      </td>
                      <td>{t.risk_score}/100</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <h3>Transaction Investigation Findings</h3>

            {result.transactions
              .filter((t) => t.alerts.length > 0)
              .map((t) => (
                <div className="transaction-alert" key={t.id}>
                  <div className="alert-heading">
                    <strong>{t.merchant}</strong>
                    <span>{money(t.amount)}</span>
                  </div>

                  <p>{t.date}</p>

                  <ul className="finding-list">
                    {t.alerts.map((alert, index) => (
                      <li key={index}>{alert}</li>
                    ))}
                  </ul>
                </div>
              ))}

            {result.flagged_count === 0 && (
              <p>No flagged transactions in this file.</p>
            )}

            <div className="recommendation">
              <h4>FraudShield Recommendation</h4>
              <p>
                Review flagged transactions against your
                original statements. Contact the financial
                institution through its official website or
                phone number if you suspect an unauthorized
                charge.
              </p>
            </div>

            <p className="disclaimer">
              {result.disclaimer}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
