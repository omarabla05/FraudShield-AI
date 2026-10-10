
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Bot,
  Check,
  CheckCircle2,
  Clipboard,
  CreditCard,
  FileSearch,
  HelpCircle,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const API_URL =
  "http://127.0.0.1:8000/api/assistant/investigate";

const SUGGESTIONS = [
  "Why were my transactions flagged?",
  "Explain my latest payment risk score",
  "What should I do if I already paid a scammer?",
  "How can I verify a suspicious payment?",
];

function formattedLines(content) {
  return String(content || "")
    .split("\n")
    .flatMap((line) => {
      // Some local responses have multiple numbered steps
      // on one line. Display them as separate paragraphs.
      return line
        .replace(/\s+(?=\d+\.\s+[A-Z])/g, "\n")
        .split("\n");
    });
}

function FormattedResponse({ content }) {
  const lines = formattedLines(content);

  return (
    <div className="fs-chat-answer">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return (
            <div
              className="fs-chat-paragraph-gap"
              key={index}
            />
          );
        }

        const numbered = trimmed.match(/^(\d+)\.\s+(.+)$/);

        if (numbered) {
          return (
            <div className="fs-chat-step" key={index}>
              <span className="fs-chat-step-number">
                {numbered[1]}
              </span>
              <p>{numbered[2]}</p>
            </div>
          );
        }

        if (trimmed.startsWith("- ")) {
          return (
            <div className="fs-chat-bullet" key={index}>
              <span className="fs-chat-bullet-dot" />
              <p>{trimmed.slice(2)}</p>
            </div>
          );
        }

        return <p key={index}>{trimmed}</p>;
      })}
    </div>
  );
}

function ContextPanel({ scanResult, transactionResult }) {
  const score = scanResult?.risk_score;
  const hasScore = typeof score === "number";

  const flagged =
    transactionResult?.flagged_count ??
    transactionResult?.flagged_transactions?.length ??
    0;

  return (
    <aside className="fs-context-panel">
      <div className="fs-context-title">
        <FileSearch size={19} />
        <div>
          <h3>Investigation context</h3>
          <p>Evidence available to this chat</p>
        </div>
      </div>

      <section className="fs-context-section">
        <div className="fs-context-section-heading">
          <ShieldAlert size={18} />
          <strong>Latest payment scan</strong>
        </div>

        {hasScore ? (
          <>
            <div className="fs-context-risk">
              <strong>{score}<small>/100</small></strong>
              <span
                className={`fs-context-risk-label ${
                  score >= 70
                    ? "high"
                    : score >= 30
                    ? "medium"
                    : "low"
                }`}
              >
                {scanResult.risk_level}
              </span>
            </div>

            <div className="fs-context-progress">
              <div
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, score)
                  )}%`,
                  background:
                    score >= 70
                      ? "#FF718C"
                      : score >= 30
                      ? "#F3BD73"
                      : "#A178FF",
                }}
              />
            </div>

            <p className="fs-context-small">
              {scanResult.findings?.length || 0} warning
              indicators detected
            </p>
          </>
        ) : (
          <div className="fs-context-empty">
            <HelpCircle size={22} />
            <p>
              No payment scan available. Run Scam Scanner
              or Campus Intelligence to provide evidence.
            </p>
          </div>
        )}
      </section>

      <section className="fs-context-section">
        <div className="fs-context-section-heading">
          <CreditCard size={18} />
          <strong>Transaction analysis</strong>
        </div>

        {transactionResult ? (
          <div className="fs-context-stats">
            <div>
              <strong>
                {transactionResult.total_transactions ?? 0}
              </strong>
              <span>Analyzed</span>
            </div>

            <div>
              <strong>{flagged}</strong>
              <span>Flagged</span>
            </div>
          </div>
        ) : (
          <div className="fs-context-empty">
            <p>
              No transaction CSV analysis loaded yet.
            </p>
          </div>
        )}
      </section>

      <div className="fs-context-privacy">
        <ShieldCheck size={19} />
        <p>
          FraudShield uses your current session's analysis
          results. This assistant provides rule-based
          guidance, not confirmed fraud findings.
        </p>
      </div>
    </aside>
  );
}

export default function InvestigationAssistant({
  scanResult = null,
  transactionResult = null,
}) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content:
        "Welcome to FraudShield. I can help explain payment risk scores, suspicious transactions, duplicate charges, and recovery steps.\n\nWhat would you like to investigate?",
      evidence: [],
      welcome: true,
    },
  ]);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const requestLock = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages, loading]);

  async function sendMessage(text = question) {
    const submitted = String(text).trim();

    if (!submitted || requestLock.current) {
      return;
    }

    requestLock.current = true;
    setLoading(true);
    setError("");
    setQuestion("");

    const userMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: submitted,
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: submitted,
          scan: scanResult,
          transaction: transactionResult,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "The investigation assistant could not respond."
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: data.answer || "No answer was returned.",
          evidence: Array.isArray(data.evidence)
            ? data.evidence
            : [],
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to contact the assistant."
      );
      // Keep the question accessible for retry.
      setQuestion(submitted);
    } finally {
      requestLock.current = false;
      setLoading(false);
    }
  }

  async function copyResponse(message) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
    } catch {
      setError("Unable to copy the response.");
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="fs-assistant-layout">
      <section className="fs-chat-window">
        <header className="fs-chat-header">
          <div className="fs-chat-brand">
            <div className="fs-chat-logo">
              <ShieldCheck size={26} />
            </div>

            <div>
              <h2>FraudShield Assistant</h2>
              <p>Financial cybersecurity guidance</p>
            </div>
          </div>

          <div className="fs-chat-mode">
            <span className="fs-chat-status-dot" />
            Local assistant
          </div>
        </header>

        <div
          className="fs-chat-messages"
          aria-live="polite"
          aria-label="Investigation conversation"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`fs-chat-message ${
                message.role === "user"
                  ? "is-user"
                  : "is-assistant"
              }`}
            >
              {message.role === "assistant" && (
                <div className="fs-chat-avatar">
                  <ShieldCheck size={21} />
                </div>
              )}

              <div className="fs-chat-message-body">
                <div className="fs-chat-message-meta">
                  {message.role === "user"
                    ? "You"
                    : "FraudShield"}
                </div>

                <div className="fs-chat-bubble">
                  {message.role === "assistant" ? (
                    <FormattedResponse
                      content={message.content}
                    />
                  ) : (
                    <p>{message.content}</p>
                  )}

                  {message.evidence?.length > 0 && (
                    <details className="fs-chat-evidence">
                      <summary>
                        <FileSearch size={16} />
                        View supporting indicators (
                        {message.evidence.length})
                      </summary>

                      <ul>
                        {message.evidence.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>

                {message.role === "assistant" &&
                  !message.welcome && (
                    <button
                      type="button"
                      className="fs-chat-copy"
                      onClick={() => copyResponse(message)}
                    >
                      {copiedId === message.id ? (
                        <Check size={15} />
                      ) : (
                        <Clipboard size={15} />
                      )}
                      {copiedId === message.id
                        ? "Copied"
                        : "Copy response"}
                    </button>
                  )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="fs-chat-message is-assistant">
              <div className="fs-chat-avatar">
                <Bot size={20} />
              </div>

              <div className="fs-chat-message-body">
                <div className="fs-chat-message-meta">
                  FraudShield
                </div>

                <div className="fs-chat-typing">
                  <span />
                  <span />
                  <span />
                  <p>Analyzing your question...</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <footer className="fs-chat-footer">
          <div className="fs-chat-suggestions">
            {SUGGESTIONS.map((suggestion) => (
              <button
                type="button"
                key={suggestion}
                disabled={loading}
                onClick={() => sendMessage(suggestion)}
              >
                <Sparkles size={14} />
                {suggestion}
              </button>
            ))}
          </div>

          <div className="fs-chat-composer">
            <textarea
              ref={textareaRef}
              aria-label="Ask FraudShield a question"
              placeholder="Ask a question about a payment or transaction..."
              value={question}
              rows={2}
              maxLength={1000}
              disabled={loading}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              onKeyDown={handleKeyDown}
            />

            <button
              type="button"
              aria-label="Send message"
              title="Send message"
              disabled={loading || !question.trim()}
              onClick={() => sendMessage()}
            >
              <ArrowUp size={21} />
            </button>
          </div>

          {error && (
            <p className="fs-chat-error" role="alert">
              {error}
            </p>
          )}

          <p className="fs-chat-disclaimer">
            Press Enter to send · Shift + Enter for a new
            line. FraudShield's local assistant is
            rule-based and may be inaccurate. Never enter
            passwords or banking credentials.
          </p>
        </footer>
      </section>

      <ContextPanel
        scanResult={scanResult}
        transactionResult={transactionResult}
      />
    </div>
  );
}
