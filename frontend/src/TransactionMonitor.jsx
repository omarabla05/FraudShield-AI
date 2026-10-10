
import { useMemo, useState } from "react";
import { API_BASE_URL } from "./api";

const API_URL = `${API_BASE_URL}/api/transactions/analyze`;
const MAX_FILE_SIZE = 1024 * 1024;

const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);

function getRiskLevel(transaction) {
  const level = String(transaction?.risk_level || "").toLowerCase();

  if (level.includes("high")) return "high";
  if (level.includes("medium")) return "medium";
  if (level.includes("low")) return "low";

  const score = Number(transaction?.risk_score) || 0;

  if (score >= 70) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function getInitials(merchant) {
  return String(merchant || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

function formatDate(date) {
  if (!date) return "—";

  const match = String(date).match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) return String(date);

  const parsed = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );

  if (Number.isNaN(parsed.getTime())) return String(date);

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function RiskBadge({ transaction }) {
  const level = getRiskLevel(transaction);

  const labels = {
    low: "Low Risk",
    medium: "Medium Risk",
    high: "High Risk",
  };

  return (
    <span className={`fstm-risk fstm-risk-${level}`}>
      <span className="fstm-risk-dot" />
      {labels[level]}
    </span>
  );
}

function SummaryCard({ label, value, detail, icon, tone = "purple" }) {
  return (
    <div className={`fstm-summary-card fstm-summary-${tone}`}>
      <div className="fstm-summary-top">
        <span className="fstm-summary-icon" aria-hidden="true">
          {icon}
        </span>
      </div>
      <p className="fstm-summary-label">{label}</p>
      <strong className="fstm-summary-value">{value}</strong>
      <span className="fstm-summary-detail">{detail}</span>
    </div>
  );
}

export default function TransactionMonitor({ onAnalysis }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState([]);

  const transactions = useMemo(
    () => (Array.isArray(result?.transactions)
      ? result.transactions
      : []),
    [result]
  );

  const flagged = useMemo(
    () => transactions.filter(
      (transaction) =>
        Array.isArray(transaction.alerts) &&
        transaction.alerts.length > 0
    ),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const level = getRiskLevel(transaction);

      const isFlagged =
        Array.isArray(transaction.alerts) &&
        transaction.alerts.length > 0;

      const matchesFilter =
        filter === "all" ||
        (filter === "flagged" && isFlagged) ||
        filter === level;

      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        String(transaction.merchant || "")
          .toLowerCase()
          .includes(query) ||
        String(transaction.date || "")
          .toLowerCase()
          .includes(query) ||
        String(transaction.amount ?? "")
          .toLowerCase()
          .includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [transactions, search, filter]);

  const reportedFlaggedCount = Number(result?.flagged_count) || 0;

  const highRiskCount = transactions.filter(
    (transaction) => getRiskLevel(transaction) === "high"
  ).length;

  function handleFileChange(event) {
    const selected = event.target.files?.[0] || null;

    setFile(null);
    setResult(null);
    setError("");
    setExpanded([]);
    setSearch("");
    setFilter("all");

    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a CSV file.");
      event.target.value = "";
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError("The file must be 1 MB or smaller.");
      event.target.value = "";
      return;
    }

    setFile(selected);
  }

  async function handleUpload() {
    if (!file) {
      setError("Please select a CSV file first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setExpanded([]);
    setSearch("");
    setFilter("all");

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

      // Keep the Investigation Assistant integration.
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

  function toggleExpanded(index) {
    setExpanded((previous) =>
      previous.includes(index)
        ? previous.filter((item) => item !== index)
        : [...previous, index]
    );
  }

  return (
    <div className="fstm-page">

      <style>{`
        .fstm-page {
          width: 100%;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 22px;
          color: #19233a;
          font-family: inherit;
        }

        .fstm-page * {
          box-sizing: border-box;
        }

        .fstm-panel {
          background: #ffffff;
          border: 1px solid #e4e8f1;
          border-radius: 19px;
          padding: 27px;
          box-shadow: 0 4px 18px rgba(25, 35, 58, 0.035);
          min-width: 0;
        }

        .fstm-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 23px;
        }

        .fstm-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 12px;
          color: #7549dd;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.075em;
          text-transform: uppercase;
        }

        .fstm-header h2 {
          margin: 0 0 10px;
          font-size: clamp(24px, 2.5vw, 30px);
          font-weight: 800;
          letter-spacing: -0.035em;
        }

        .fstm-subtitle {
          margin: 0;
          max-width: 650px;
          color: #64748b;
          font-size: 15px;
          line-height: 1.8;
        }

        .fstm-header-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 13px;
          color: #6741c0;
          background: #f3edff;
          border: 1px solid #e7dcff;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .fstm-upload {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 11px;
          padding: 32px 20px;
          text-align: center;
          background: #faf8ff;
          border: 2px dashed #d8c8f3;
          border-radius: 16px;
        }

        .fstm-upload-icon {
          display: grid;
          place-items: center;
          width: 55px;
          height: 55px;
          margin-bottom: 3px;
          color: #7549dd;
          background: #eee6ff;
          border-radius: 15px;
          font-size: 27px;
          font-weight: 700;
        }

        .fstm-upload h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
        }

        .fstm-upload p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .fstm-file-input {
          max-width: 100%;
          margin-top: 9px;
          color: #475569;
          font-size: 14px;
        }

        .fstm-file-input::file-selector-button {
          padding: 11px 15px;
          margin-right: 12px;
          color: #6941c6;
          background: white;
          border: 1px solid #d9c9f5;
          border-radius: 10px;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .fstm-file-selected {
          max-width: 100%;
          overflow-wrap: anywhere;
          color: #6941c6 !important;
          font-weight: 700;
        }

        .fstm-upload-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 20px;
        }

        .fstm-privacy {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          max-width: 560px;
          color: #64748b;
          font-size: 12px;
          line-height: 1.7;
        }

        .fstm-analyze-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 47px;
          padding: 12px 20px;
          color: white;
          background: #7549dd;
          border: 1px solid #7549dd;
          border-radius: 11px;
          font: inherit;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }

        .fstm-analyze-btn:hover:not(:disabled) {
          background: #6338c4;
          transform: translateY(-1px);
        }

        .fstm-analyze-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .fstm-error {
          margin: 15px 0 0;
          padding: 13px 15px;
          color: #b4233f;
          background: #fff0f3;
          border: 1px solid #f4c5cf;
          border-radius: 10px;
          font-size: 14px;
        }

        .fstm-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .fstm-summary-card {
          min-width: 0;
          padding: 20px;
          background: #ffffff;
          border: 1px solid #e4e8f1;
          border-radius: 16px;
          box-shadow: 0 3px 12px rgba(25,35,58,.03);
        }

        .fstm-summary-top {
          margin-bottom: 17px;
        }

        .fstm-summary-icon {
          display: inline-grid;
          place-items: center;
          width: 41px;
          height: 41px;
          border-radius: 12px;
          font-size: 20px;
        }

        .fstm-summary-purple .fstm-summary-icon {
          color: #7549dd;
          background: #f0eaff;
        }

        .fstm-summary-orange .fstm-summary-icon {
          color: #b96b10;
          background: #fff3df;
        }

        .fstm-summary-red .fstm-summary-icon {
          color: #c23a51;
          background: #fff0f3;
        }

        .fstm-summary-blue .fstm-summary-icon {
          color: #376ac3;
          background: #edf3ff;
        }

        .fstm-summary-label {
          margin: 0 0 7px;
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
        }

        .fstm-summary-value {
          display: block;
          color: #19233a;
          font-size: clamp(21px, 2vw, 30px);
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 1.25;
          overflow-wrap: anywhere;
        }

        .fstm-summary-detail {
          display: block;
          margin-top: 7px;
          color: #8491a6;
          font-size: 12px;
        }

        .fstm-section-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .fstm-section-heading h3 {
          margin: 0 0 5px;
          font-size: 21px;
          font-weight: 800;
        }

        .fstm-section-heading p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .fstm-count {
          padding: 7px 11px;
          color: #6941c6;
          background: #f2ecff;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
        }

        .fstm-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 17px;
        }

        .fstm-search {
          flex: 1 1 230px;
          min-width: 0;
          min-height: 45px;
          padding: 11px 14px;
          color: #19233a;
          background: #f9fafe;
          border: 1px solid #dce2ed;
          border-radius: 11px;
          font: inherit;
          font-size: 14px;
        }

        .fstm-filter {
          min-height: 45px;
          padding: 10px 13px;
          color: #475569;
          background: #ffffff;
          border: 1px solid #dce2ed;
          border-radius: 11px;
          font: inherit;
          font-size: 14px;
          cursor: pointer;
        }

        .fstm-search:focus,
        .fstm-filter:focus {
          outline: 2px solid #c4adf8;
          outline-offset: 1px;
        }

        .fstm-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border: 1px solid #e9ecf3;
          border-radius: 13px;
        }

        .fstm-table {
          width: 100%;
          min-width: 640px;
          border-collapse: collapse;
          text-align: left;
        }

        .fstm-table th {
          padding: 15px 17px;
          color: #64748b;
          background: #f8f9fc;
          border-bottom: 1px solid #e9ecf3;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }

        .fstm-table td {
          padding: 15px 17px;
          border-bottom: 1px solid #edf0f5;
          color: #475569;
          font-size: 14px;
          vertical-align: middle;
        }

        .fstm-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .fstm-table tbody tr:hover {
          background: #faf8ff;
        }

        .fstm-table tbody tr.fstm-flagged-row {
          background: #fffdf8;
        }

        .fstm-table tbody tr.fstm-flagged-row:hover {
          background: #fff9ef;
        }

        .fstm-merchant {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 170px;
        }

        .fstm-merchant-avatar {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 37px;
          height: 37px;
          color: #6941c6;
          background: #f0eaff;
          border-radius: 11px;
          font-size: 12px;
          font-weight: 800;
        }

        .fstm-flagged-row .fstm-merchant-avatar {
          color: #b96b10;
          background: #fff0d8;
        }

        .fstm-merchant strong {
          color: #253149;
          font-size: 13px;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .fstm-amount {
          color: #19233a !important;
          font-weight: 800;
          white-space: nowrap;
        }

        .fstm-risk {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .fstm-risk-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
        }

        .fstm-risk-low {
          color: #16834b;
          background: #eaf8f0;
        }

        .fstm-risk-medium {
          color: #a85f09;
          background: #fff3e1;
        }

        .fstm-risk-high {
          color: #b4233f;
          background: #fff0f3;
        }

        .fstm-score {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .fstm-score strong {
          color: #334155;
          font-size: 13px;
        }

        .fstm-score-track {
          width: 56px;
          height: 6px;
          overflow: hidden;
          background: #e8eaf0;
          border-radius: 999px;
        }

        .fstm-score-fill {
          height: 100%;
          border-radius: inherit;
        }

        .fstm-score-fill.low { background: #25a56a; }
        .fstm-score-fill.medium { background: #e1a149; }
        .fstm-score-fill.high { background: #dc4560; }

        .fstm-table-note {
          margin: 13px 0 0;
          color: #8491a6;
          font-size: 12px;
        }

        .fstm-findings {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .fstm-finding-card {
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e4e8f1;
          border-radius: 14px;
        }

        .fstm-finding-card.high {
          border-left: 4px solid #dc4560;
        }

        .fstm-finding-card.medium {
          border-left: 4px solid #e0a044;
        }

        .fstm-finding-card.low {
          border-left: 4px solid #7549dd;
        }

        .fstm-finding-button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          width: 100%;
          padding: 18px;
          text-align: left;
          color: inherit;
          background: transparent;
          border: 0;
          cursor: pointer;
        }

        .fstm-finding-button:hover {
          background: #faf9ff;
        }

        .fstm-finding-main {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .fstm-finding-main strong {
          font-size: 16px;
          font-weight: 800;
        }

        .fstm-finding-main small {
          color: #64748b;
          font-size: 12px;
        }

        .fstm-finding-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 13px;
          flex-wrap: wrap;
        }

        .fstm-finding-amount {
          color: #19233a;
          font-size: 17px;
          font-weight: 800;
          white-space: nowrap;
        }

        .fstm-chevron {
          color: #7549dd;
          font-size: 16px;
        }

        .fstm-finding-content {
          padding: 0 19px 19px;
          border-top: 1px solid #edf0f5;
        }

        .fstm-finding-label {
          margin: 17px 0 10px;
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .06em;
        }

        .fstm-findings-list {
          margin: 0;
          padding-left: 21px;
          color: #475569;
          font-size: 14px;
          line-height: 1.8;
        }

        .fstm-findings-list li {
          margin-bottom: 7px;
        }

        .fstm-empty {
          padding: 28px 18px;
          text-align: center;
          color: #64748b;
          background: #f9fafe;
          border: 1px dashed #dce2ed;
          border-radius: 12px;
          font-size: 14px;
        }

        .fstm-recommendation {
          margin-top: 20px;
          padding: 19px;
          background: #f5f0ff;
          border: 1px solid #e6dcfa;
          border-radius: 13px;
        }

        .fstm-recommendation h4 {
          margin: 0 0 8px;
          color: #5c3aad;
          font-size: 16px;
          font-weight: 800;
        }

        .fstm-recommendation p {
          margin: 0;
          color: #605779;
          font-size: 14px;
          line-height: 1.8;
        }

        .fstm-disclaimer {
          margin: 15px 0 0;
          color: #8491a6;
          font-size: 12px;
          line-height: 1.8;
        }

        @media (max-width: 1250px) {
          .fstm-summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 767px) {
          .fstm-page {
            gap: 14px;
          }

          .fstm-panel {
            padding: 16px;
            border-radius: 14px;
          }

          .fstm-header h2 {
            font-size: 22px;
          }

          .fstm-subtitle {
            font-size: 14px;
          }

          .fstm-header-badge {
            white-space: normal;
          }

          .fstm-upload {
            padding: 23px 12px;
          }

          .fstm-upload h3 {
            font-size: 16px;
          }

          .fstm-file-input {
            width: 100%;
            font-size: 12px;
          }

          .fstm-upload-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .fstm-analyze-btn {
            width: 100%;
          }

          .fstm-summary-grid {
            gap: 9px;
          }

          .fstm-summary-card {
            padding: 13px;
          }

          .fstm-summary-top {
            margin-bottom: 10px;
          }

          .fstm-summary-icon {
            width: 35px;
            height: 35px;
            font-size: 17px;
          }

          .fstm-summary-value {
            font-size: 21px;
          }

          .fstm-summary-label {
            font-size: 11px;
          }

          .fstm-summary-detail {
            font-size: 10px;
          }

          .fstm-section-heading h3 {
            font-size: 19px;
          }

          .fstm-toolbar {
            flex-direction: column;
          }

          .fstm-search {
            flex: auto;
            width: 100%;
            min-height: 45px;
            font-size: 16px;
          }

          .fstm-filter {
            width: 100%;
            font-size: 16px;
          }

          .fstm-table th,
          .fstm-table td {
            padding: 12px;
          }

          .fstm-finding-button {
            align-items: flex-start;
            flex-direction: column;
            padding: 14px;
          }

          .fstm-finding-right {
            justify-content: space-between;
            width: 100%;
          }

          .fstm-finding-amount {
            font-size: 15px;
          }
        }
      `}</style>

      {/* UPLOAD SECTION */}

      <section className="fstm-panel">

        <div className="fstm-header">
          <div>
            <span className="fstm-eyebrow">
              ◈ FINANCIAL SECURITY
            </span>

            <h2>Transaction Fraud Detection</h2>

            <p className="fstm-subtitle">
              Analyze transaction activity, identify unusual
              patterns, and review potential financial risks
              in one secure workspace.
            </p>
          </div>

          <span className="fstm-header-badge">
            ◉ Rule-Based Analysis
          </span>
        </div>

        <div className="fstm-upload">
          <div className="fstm-upload-icon">⇧</div>

          <h3>Upload Your Transactions</h3>

          <p>
            Select a CSV file to begin your financial
            security analysis.
          </p>

          <p>
            CSV format • Maximum file size: 1 MB
          </p>

          <input
            className="fstm-file-input"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            aria-label="Select transaction CSV file"
          />

          <p className="fstm-file-selected">
            {file
              ? `✓ ${file.name} selected`
              : "No file selected"}
          </p>
        </div>

        <div className="fstm-upload-actions">
          <div className="fstm-privacy">
            <span aria-hidden="true">◇</span>
            <span>
              Use fictional or appropriately redacted data.
              Do not upload account numbers, card information,
              or other sensitive banking details.
            </span>
          </div>

          <button
            className="fstm-analyze-btn"
            type="button"
            disabled={loading || !file}
            onClick={handleUpload}
          >
            {loading
              ? "Analyzing Transactions..."
              : "Analyze Transactions →"}
          </button>
        </div>

        {error && (
          <p className="fstm-error" role="alert">
            {error}
          </p>
        )}
      </section>

      {result && (
        <>

          {/* SUMMARY CARDS */}

          <div className="fstm-summary-grid">

            <SummaryCard
              icon="▤"
              label="Transactions Analyzed"
              value={result.total_transactions}
              detail="Records processed"
            />

            <SummaryCard
              icon="⚑"
              label="Flagged for Review"
              value={reportedFlaggedCount}
              detail="Potential anomalies"
              tone="orange"
            />

            <SummaryCard
              icon="!"
              label="High-Risk Transactions"
              value={highRiskCount}
              detail="Based on risk scores"
              tone="red"
            />

            <SummaryCard
              icon="$"
              label="Total Expenses"
              value={money(result.total_spending)}
              detail="Positive CSV amounts"
              tone="blue"
            />

          </div>

          {/* TRANSACTION TABLE */}

          <section className="fstm-panel">

            <div className="fstm-section-heading">
              <div>
                <h3>Transaction Activity</h3>

                <p>
                  Review your analyzed transactions
                  and their assigned risk scores.
                </p>
              </div>

              <span className="fstm-count">
                {filteredTransactions.length} displayed
              </span>
            </div>

            <div className="fstm-toolbar">

              <input
                className="fstm-search"
                type="search"
                placeholder="Search merchant, date, or amount..."
                aria-label="Search transactions"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              <select
                className="fstm-filter"
                aria-label="Filter transactions by risk"
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value)
                }
              >
                <option value="all">
                  All Transactions
                </option>

                <option value="flagged">
                  Flagged for Review
                </option>

                <option value="high">
                  High Risk
                </option>

                <option value="medium">
                  Medium Risk
                </option>

                <option value="low">
                  Low Risk
                </option>
              </select>

            </div>

            <div className="fstm-table-wrap">
              <table className="fstm-table">
                <thead>
                  <tr>
                    <th>Merchant</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Risk Level</th>
                    <th>Risk Score</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map((transaction, index) => {
                    const level = getRiskLevel(transaction);

                    const isFlagged =
                      Array.isArray(transaction.alerts) &&
                      transaction.alerts.length > 0;

                    const score = Math.max(
                      0,
                      Math.min(
                        100,
                        Number(transaction.risk_score) || 0
                      )
                    );

                    return (
                      <tr
                        key={`${transaction.id ?? index}-${index}`}
                        className={
                          isFlagged
                            ? "fstm-flagged-row"
                            : ""
                        }
                      >
                        <td>
                          <div className="fstm-merchant">

                            <span
                              className="fstm-merchant-avatar"
                              aria-hidden="true"
                            >
                              {getInitials(transaction.merchant)}
                            </span>

                            <strong>
                              {transaction.merchant || "Unknown Merchant"}
                            </strong>

                          </div>
                        </td>

                        <td>
                          {formatDate(transaction.date)}
                        </td>

                        <td className="fstm-amount">
                          {money(transaction.amount)}
                        </td>

                        <td>
                          <RiskBadge transaction={transaction} />
                        </td>

                        <td>
                          <div className="fstm-score">
                            <strong>
                              {score}/100
                            </strong>

                            <div
                              className="fstm-score-track"
                              aria-hidden="true"
                            >
                              <div
                                className={`fstm-score-fill ${level}`}
                                style={{
                                  width: `${score}%`
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="fstm-empty">
                No transactions match your current
                search or filter.
              </div>
            )}

            <p className="fstm-table-note">
              Risk scores are rule-based indicators,
              not probabilities of fraud. Scroll horizontally
              on smaller screens to view all columns.
            </p>

          </section>

          {/* INVESTIGATION FINDINGS */}

          <section className="fstm-panel">

            <div className="fstm-section-heading">
              <div>
                <span className="fstm-eyebrow">
                  ◈ INVESTIGATION RESULTS
                </span>

                <h3>Flagged Transactions</h3>

                <p>
                  Expand a transaction to see why
                  it was flagged for review.
                </p>
              </div>

              <span className="fstm-count">
                {flagged.length} findings shown
              </span>
            </div>

            {flagged.length > 0 ? (

              <div className="fstm-findings">
                {flagged.map((transaction, index) => {
                  const level = getRiskLevel(transaction);
                  const isOpen = expanded.includes(index);

                  return (
                    <div
                      key={`${transaction.id ?? index}-${index}`}
                      className={`fstm-finding-card ${level}`}
                    >

                      <button
                        className="fstm-finding-button"
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() =>
                          toggleExpanded(index)
                        }
                      >

                        <div className="fstm-finding-main">
                          <strong>
                            {transaction.merchant || "Unknown Merchant"}
                          </strong>

                          <small>
                            {formatDate(transaction.date)}
                            {" · "}
                            Score: {transaction.risk_score}/100
                          </small>
                        </div>

                        <div className="fstm-finding-right">

                          <span className="fstm-finding-amount">
                            {money(transaction.amount)}
                          </span>

                          <RiskBadge transaction={transaction} />

                          <span
                            className="fstm-chevron"
                            aria-hidden="true"
                          >
                            {isOpen ? "⌃" : "⌄"}
                          </span>

                        </div>

                      </button>

                      {isOpen && (
                        <div className="fstm-finding-content">

                          <p className="fstm-finding-label">
                            Why was this flagged?
                          </p>

                          <ul className="fstm-findings-list">
                            {transaction.alerts.map(
                              (alert, alertIndex) => (
                                <li key={alertIndex}>
                                  {alert}
                                </li>
                              )
                            )}
                          </ul>

                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

            ) : (

              <div className="fstm-empty">
                No transaction warnings were returned
                for this analysis.
              </div>

            )}

            <div className="fstm-recommendation">
              <h4>FraudShield Recommendation</h4>

              <p>
                Review flagged transactions against your
                original financial statements. If you
                suspect an unauthorized payment, contact
                your bank or financial institution through
                its official website, mobile app, or phone
                number. Do not treat an alert as confirmation
                that fraud occurred.
              </p>
            </div>

            {result.disclaimer && (
              <p className="fstm-disclaimer">
                {result.disclaimer}
              </p>
            )}

          </section>

        </>
      )}

    </div>
  );
}
