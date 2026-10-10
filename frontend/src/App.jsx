import { useState } from "react";
import {
  LayoutDashboard,
  ScanSearch,
  CreditCard,
  GraduationCap,
  Bot,
  LifeBuoy,
  Shield,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Sparkles,
  Activity,
  Upload,
} from "lucide-react";

import TransactionMonitor from "./TransactionMonitor";
import InvestigationAssistant from "./investigationassistant";
import RecoveryCenter from "./RecoveryCenter";
import CampusIntelligence from "./CampusIntelligence";
import "./App.css";
import { API_BASE_URL } from "./api";

const NAV_ITEMS = [
  {
    id: "overview",
    label: "Overview",
    description: "Main dashboard and quick actions",
    icon: LayoutDashboard,
    section: "Main",
  },
  {
    id: "scanner",
    label: "Scam Scanner",
    description: "Analyze suspicious messages or links",
    icon: ScanSearch,
    section: "Detection",
  },
  {
    id: "transactions",
    label: "Transaction Monitor",
    description: "Upload and review transaction CSV files",
    icon: CreditCard,
    section: "Detection",
  },
  {
    id: "campus",
    label: "Campus Intelligence",
    description: "Check university payment scam scenarios",
    icon: GraduationCap,
    section: "Detection",
  },
  {
    id: "assistant",
    label: "AI Assistant",
    description: "Get help understanding results",
    icon: Bot,
    section: "Response",
  },
  {
    id: "recovery",
    label: "Recovery Center",
    description: "Create a response and incident report",
    icon: LifeBuoy,
    section: "Response",
  },
];

const EXAMPLES = [
  {
    label: "Fake tuition alert",
    text: "URGENT! Your university account will be suspended unless you pay your balance immediately using this payment link: http://192.168.1.10/payment",
  },
  {
    label: "Prize payment scam",
    text: "Congratulations! You won a cash reward. Pay now to release your prize. Send money immediately using a gift card.",
  },
  {
    label: "Account verification",
    text: "URGENT! Your bank account is locked. Act now and verify your details immediately to avoid account suspension.",
  },
];

const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);

export default function App() {
  const [active, setActive] = useState("overview");

  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const [scanning, setScanning] = useState(false);

  const [scanCount, setScanCount] = useState(0);
  const [threatCount, setThreatCount] = useState(0);
  const [transactionResult, setTransactionResult] = useState(null);
  const [recoveryScan, setRecoveryScan] = useState(null);
  const [activityLog, setActivityLog] = useState([]);

  const currentPage =
    NAV_ITEMS.find((item) => item.id === active) || NAV_ITEMS[0];

  function goTo(page) {
    setActive(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addActivity(type, message, score = null) {
    setActivityLog((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        type,
        message,
        score,
        time: new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      },
      ...prev,
    ].slice(0, 6));
  }

  function severity(score) {
    if (score >= 70) return "high";
    if (score >= 30) return "medium";
    return "low";
  }

  function recordScan(result, typeLabel) {
    setScanCount((prev) => prev + 1);

    if (result.risk_score >= 70) {
      setThreatCount((prev) => prev + 1);
    }

    addActivity(
      typeLabel,
      result.category || "Suspicious payment analyzed",
      result.risk_score
    );
  }

  function sendToRecovery(result, source) {
    setRecoveryScan({
      source,
      risk_score: result.risk_score,
      risk_level: result.risk_level,
      findings: result.findings || [],
      recommendation:
        result.recommendation ||
        (result.recommendations || []).join(" "),
      disclaimer: result.disclaimer || "",
    });

    goTo("recovery");
  }

  async function analyzeScan() {
    if (scanning) return;

    if (!scanInput.trim()) {
      setScanError("Please enter a suspicious message or link first.");
      return;
    }

    setScanning(true);
    setScanError("");
    setScanResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/scam/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: scanInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Analysis failed."
        );
      }

      setScanResult(data);
      recordScan(data, "Scam scan");
    } catch (error) {
      setScanError(
        error instanceof Error
          ? error.message
          : "Could not connect to the backend."
      );
    } finally {
      setScanning(false);
    }
  }

  function selectExample(example) {
    setScanInput(example.text);
    setScanError("");
    setScanResult(null);
  }

  function renderOverview() {
    return (
      <div className="page-stack">
        <section className="hero-card">
          <div className="hero-text">
            <div className="badge">FraudShield AI</div>
            <h1>Protect your money from scams and suspicious payments.</h1>
            <p>
              FraudShield helps users detect risky payment requests, review
              transactions, investigate scam scenarios, and prepare recovery
              steps when something looks wrong.
            </p>

            <div className="hero-actions">
              <button className="primary-btn" onClick={() => goTo("scanner")}>
                Open Scam Scanner
                <ArrowRight size={18} />
              </button>

              <button
                className="secondary-btn"
                onClick={() => goTo("transactions")}
              >
                Open Transaction Monitor
              </button>
            </div>
          </div>

          <div className="hero-panel">
            <h3>What you can do</h3>
            <ul className="feature-list">
              <li>Scan suspicious payment messages and links</li>
              <li>Review transaction CSV files for unusual activity</li>
              <li>Investigate university payment scams</li>
              <li>Create a recovery plan and incident report</li>
            </ul>
          </div>
        </section>

        <section className="stats-grid">
          <div className="stat-card large">
            <span className="stat-label">Scans completed</span>
            <strong>{scanCount}</strong>
            <small>Total scans in this session</small>
          </div>

          <div className="stat-card">
            <span className="stat-label">High-risk results</span>
            <strong>{threatCount}</strong>
            <small>Results that scored 70 or above</small>
          </div>

          <div className="stat-card">
            <span className="stat-label">Transactions analyzed</span>
            <strong>{transactionResult?.total_transactions || 0}</strong>
            <small>From the latest uploaded CSV file</small>
          </div>

          <div className="stat-card">
            <span className="stat-label">Latest total spending</span>
            <strong className="money-value">
              {money(transactionResult?.total_spending)}
            </strong>
            <small>From the latest uploaded CSV file</small>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="panel">
            <div className="panel-header">
              <h2>Quick actions</h2>
              <p>Open the most important tools directly.</p>
            </div>

            <div className="quick-actions-grid">
              <button className="action-tile" onClick={() => goTo("scanner")}>
                <ScanSearch size={26} />
                <div>
                  <strong>Scam Scanner</strong>
                  <span>Check a suspicious message or payment link</span>
                </div>
              </button>

              <button
                className="action-tile"
                onClick={() => goTo("transactions")}
              >
                <Upload size={26} />
                <div>
                  <strong>Transaction Monitor</strong>
                  <span>Upload a CSV file and inspect transactions</span>
                </div>
              </button>

              <button className="action-tile" onClick={() => goTo("campus")}>
                <GraduationCap size={26} />
                <div>
                  <strong>Campus Intelligence</strong>
                  <span>Review university-related scam examples</span>
                </div>
              </button>

              <button className="action-tile" onClick={() => goTo("recovery")}>
                <FileText size={26} />
                <div>
                  <strong>Recovery Center</strong>
                  <span>Create a recovery plan or incident report</span>
                </div>
              </button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Recent activity</h2>
              <p>Your most recent analysis results will appear here.</p>
            </div>

            {activityLog.length === 0 ? (
              <div className="empty-state">
                <Activity size={28} />
                <strong>No activity yet</strong>
                <span>
                  Start by using the Scam Scanner or Transaction Monitor.
                </span>
              </div>
            ) : (
              <div className="activity-list">
                {activityLog.map((item) => (
                  <div className="activity-row" key={item.id}>
                    <div className="activity-main">
                      <strong>{item.message}</strong>
                      <span>
                        {item.type} • {item.time}
                      </span>
                    </div>

                    {item.score !== null ? (
                      <span
                        className={`status-pill ${severity(item.score)}`}
                      >
                        {item.score}/100
                      </span>
                    ) : (
                      <span className="status-pill neutral">Saved</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  function renderScanner() {
    return (
      <div className="page-stack">
        <section className="scanner-header-card">
          <div>
            <div className="badge">Scam Scanner</div>
            <h1>Analyze a suspicious message or payment link</h1>
            <p>
              Paste the message or URL below, then click <strong>Analyze Scam</strong>.
              FraudShield will explain why the content may be risky.
            </p>
          </div>
        </section>

        <section className="scanner-layout-new">
          <div className="panel">
            <div className="panel-header">
              <h2>Step 1 — Enter the suspicious message</h2>
              <p>
                Paste a payment request, SMS, email text, or suspicious link.
              </p>
            </div>

            <label className="input-label">
              Payment message or URL
              <textarea
                className="scan-textarea"
                value={scanInput}
                maxLength={10000}
                placeholder="Paste the suspicious message or payment link here..."
                onChange={(e) => {
                  setScanInput(e.target.value);
                  setScanResult(null);
                  setScanError("");
                }}
              />
            </label>

            <div className="helper-row">
              <span>{scanInput.length} / 10,000 characters</span>
            </div>

            <div className="panel-header small-gap">
              <h3>Try a demo scenario</h3>
              <p>Click one of these to quickly test the scanner.</p>
            </div>

            <div className="example-grid">
              {EXAMPLES.map((example) => (
                <button
                  key={example.label}
                  className="example-btn"
                  onClick={() => selectExample(example)}
                >
                  {example.label}
                </button>
              ))}
            </div>

            <div className="big-action-row">
              <button className="primary-btn large-btn" onClick={analyzeScan}>
                {scanning ? "Analyzing..." : "Analyze Scam"}
                <ArrowRight size={18} />
              </button>

              <button
                className="secondary-btn large-btn"
                onClick={() => {
                  setScanInput("");
                  setScanError("");
                  setScanResult(null);
                }}
              >
                Clear Input
              </button>
            </div>

            {scanError && <p className="error-text">{scanError}</p>}

            <p className="info-note">
              Do not enter passwords, account numbers, or full card details.
            </p>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Step 2 — Review the result</h2>
              <p>
                After you click Analyze Scam, the results will appear here.
              </p>
            </div>

            {!scanResult ? (
              <div className="empty-result-card">
                <Shield size={34} />
                <strong>No result yet</strong>
                <span>
                  Enter a suspicious message and click Analyze Scam.
                </span>
              </div>
            ) : (
              <div className="results-stack">
                <div className="result-summary-card">
                  <div>
                    <span className="stat-label">Risk score</span>
                    <div className="big-score">
                      {scanResult.risk_score}
                      <small>/100</small>
                    </div>
                  </div>

                  <span className={`status-pill ${severity(scanResult.risk_score)}`}>
                    {scanResult.risk_level}
                  </span>
                </div>

                <div className="progress-track">
                  <div
                    className={`progress-fill ${severity(scanResult.risk_score)}`}
                    style={{ width: `${Math.min(scanResult.risk_score, 100)}%` }}
                  />
                </div>

                <div className="panel-header small-gap">
                  <h3>Why it was flagged</h3>
                  <p>These are the warning indicators detected by FraudShield.</p>
                </div>

                <ul className="findings-list">
                  {(scanResult.findings || []).length > 0 ? (
                    scanResult.findings.map((finding, index) => (
                      <li key={index}>{finding}</li>
                    ))
                  ) : (
                    <li>No clear warning indicators were detected.</li>
                  )}
                </ul>

                <div className="recommendation-box">
                  <h3>Recommended next step</h3>
                  <p>{scanResult.recommendation}</p>
                </div>

                <p className="info-note">
                  {scanResult.disclaimer ||
                    "This is an experimental heuristic assessment, not a guarantee."}
                </p>

                <div className="big-action-row">
                  <button
                    className="primary-btn large-btn"
                    onClick={() =>
                      sendToRecovery(scanResult, "Scam Scanner")
                    }
                  >
                    Create Recovery Report
                    <ArrowRight size={18} />
                  </button>

                  <button
                    className="secondary-btn large-btn"
                    onClick={() => goTo("assistant")}
                  >
                    Open AI Assistant
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-box">
          <div className="brand-icon">
            <Shield size={24} />
          </div>
          <div>
            <h2>FraudShield AI</h2>
            <p>Financial security workspace</p>
          </div>
        </div>

        <div className="nav-sections">
          {["Main", "Detection", "Response"].map((sectionName) => (
            <div className="nav-group" key={sectionName}>
              <span className="nav-group-title">{sectionName}</span>

              {NAV_ITEMS.filter((item) => item.section === sectionName).map(
                (item) => {
                  const Icon = item.icon;
                  const activeClass = active === item.id ? "active" : "";

                  return (
                    <button
                      key={item.id}
                      className={`nav-item ${activeClass}`}
                      onClick={() => goTo(item.id)}
                    >
                      <div className="nav-item-icon">
                        <Icon size={20} />
                      </div>

                      <div className="nav-item-text">
                        <strong>{item.label}</strong>
                        <span>{item.description}</span>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="demo-badge">
            <Sparkles size={16} />
            <span>Demo mode</span>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div>
            <span className="topbar-label">Current page</span>
            <h1>{currentPage.label}</h1>
          </div>

          <div className="topbar-info">
            <div className="topbar-chip">
              <CheckCircle2 size={16} />
              Local backend
            </div>
            <div className="topbar-chip subtle-chip">
              FraudShield prototype
            </div>
          </div>
        </header>

        <main className="content-area">
          {active === "overview" && renderOverview()}

          {active === "scanner" && renderScanner()}

          {active === "transactions" && (
            <div className="page-stack">
              <section className="simple-intro-card">
                <div className="badge">Transaction Monitor</div>
                <h1>Upload a transaction CSV file and review suspicious activity</h1>
                <p>
                  This tool helps users inspect transactions, see totals, and
                  identify flagged records from uploaded data.
                </p>
              </section>

              <TransactionMonitor
                onAnalysis={(data) => {
                  setTransactionResult(data);
                  addActivity(
                    "Transaction analysis",
                    `${data.total_transactions} transactions reviewed`
                  );
                }}
              />
            </div>
          )}

          {active === "campus" && (
            <div className="page-stack">
              <section className="simple-intro-card">
                <div className="badge">Campus Intelligence</div>
                <h1>Investigate university payment scam scenarios</h1>
                <p>
                  This tool focuses on student-targeted scams such as tuition
                  payment fraud and fake university account warnings.
                </p>
              </section>

              <CampusIntelligence
                onScan={(data) => {
                  setScanResult({
                    risk_score: data.risk_score,
                    risk_level: data.risk_level,
                    findings: data.findings,
                    recommendation: (data.recommendations || []).join(" "),
                    disclaimer: data.disclaimer,
                  });

                  recordScan(data, "Campus scam scan");
                }}
                onRecovery={(data) =>
                  sendToRecovery(data, "Campus Intelligence")
                }
              />
            </div>
          )}

          {active === "assistant" && (
            <div className="page-stack">
              <section className="simple-intro-card">
                <div className="badge">AI Assistant</div>
                <h1>Get help understanding your results</h1>
                <p>
                  Ask questions about scan findings, suspicious activity, or
                  what to do next.
                </p>
              </section>

              <InvestigationAssistant
                scanResult={scanResult}
                transactionResult={transactionResult}
              />
            </div>
          )}

          {active === "recovery" && (
            <div className="page-stack">
              <section className="simple-intro-card">
                <div className="badge">Recovery Center</div>
                <h1>Create a recovery plan and incident report</h1>
                <p>
                  Use imported scan findings or enter incident details manually
                  to prepare next steps.
                </p>
              </section>

              <RecoveryCenter scan={recoveryScan} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}