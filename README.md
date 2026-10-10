
# 🛡️ FraudShield AI

### Detect. Investigate. Recover.

**A Financial Cybersecurity and Fraud Investigation Platform**

FraudShield AI is a full-stack FinTech and cybersecurity web application designed to help users detect suspicious financial activity, investigate potential scams, and prepare practical recovery steps.

Built for the **Hack Midwest 2026 — Flex Best FinTech App Challenge**, FraudShield combines automated fraud analysis, explainable findings, and financial incident response in one accessible platform.

## 🌐 Live Application

**[Launch FraudShield AI](https://fraudshield-ai-web.onrender.com/)**

**[GitHub Repository](https://github.com/omarabla05/FraudShield-AI)**

> Note: The backend uses Render's free hosting tier and may take a short time to start after inactivity.

---

## 🚨 The Problem

Financial fraud is a growing concern for consumers and college students.

Suspicious payment requests, phishing messages, unauthorized charges, and university impersonation scams can create confusion and financial risk.

Even when someone notices suspicious activity, they may not know:

- Is this payment request legitimate?
- Why was my transaction flagged?
- Could this be a duplicate charge?
- What steps should I take after a suspected scam?
- How can I organize information to report the incident?

FraudShield AI was created to make financial security easier to understand and respond to.

---

## 💡 Our Solution

FraudShield AI brings three stages of financial security together:

**DETECT → INVESTIGATE → RECOVER**

Instead of displaying unexplained warnings, the platform helps users understand potential risk indicators and prepare appropriate next steps.

---

## ✨ Main Features

### 1. Scam Scanner

Analyzes suspicious financial messages and payment requests.

- Identifies potential scam warning indicators.
- Calculates heuristic risk scores.
- Displays risk classifications.
- Explains detected warning signs.
- Recommends safer verification steps.
- Supports passing scan findings to the Recovery Center.

### 2. Transaction Monitor

Allows users to upload CSV files containing financial transaction records.

The detection engine evaluates patterns such as:

- Unusually large transactions relative to typical spending.
- Possible duplicate payments to the same merchant.
- Significant recurring-payment price increases.

The interface includes:

- Total transactions analyzed.
- Number of transactions flagged for review.
- Total expenses and high-risk transaction summaries.
- Individual transaction risk scores.
- Searchable transaction activity.
- Risk-level filters.
- Color-coded risk indicators.
- Expandable explanations of flagged transactions.

Transaction results can also be used by the Investigation Assistant.

**Required CSV format:**

```csv
date,merchant,amount
2026-10-01,Starbucks,8.50
2026-10-02,Walmart,45.20
2026-10-03,Online Transfer,2800.00
2026-10-04,Netflix,17.99
```

Use fictional or appropriately redacted data.

### 3. Campus Intelligence

Focuses on financial scams that may target university students.

The tool provides analysis and guidance for situations involving:

- Suspicious tuition payment requests.
- University impersonation.
- Financial aid and scholarship-related scams.
- Other student-focused financial fraud scenarios.

This feature helps make financial cybersecurity guidance relevant to students.

### 4. Investigation Assistant

A rule-based conversational investigation tool that uses available scan and transaction findings.

It can help users:

- Understand why transactions were flagged.
- Review relevant security warning indicators.
- Interpret available risk assessment results.
- Identify practical verification and response steps.
- Review individual flagged transactions when supporting data is available.

The assistant uses structured rules and available evidence rather than a generative language model.

### 5. Recovery Center

Helps users prepare financial incident documentation and recovery guidance.

Features include:

- Incident information form.
- Credit card recovery guidance.
- Debit card recovery guidance.
- Bank transfer response steps.
- Payment app incident guidance.
- Cryptocurrency-related precautions.
- Interactive recovery checklist.
- Recovery progress tracking.
- Importing findings from the Scam Scanner.
- Structured incident report generation.
- Copying completed incident reports.
- Resetting the report to start a new investigation.

FraudShield provides guidance but cannot reverse payments or guarantee recovery.

### 6. Financial Security Dashboard

Provides a central workspace for navigating the application and reviewing available analysis information.

The interface includes:

- Security overview.
- Scan activity summaries.
- Transaction analysis information.
- Navigation between fraud detection and response tools.
- Responsive desktop and mobile layouts.

---

## 🔍 How It Works

FraudShield AI uses a React frontend and Python backend.

**Step 1 — Input**

A user enters a suspicious message or uploads a CSV file.

**Step 2 — Analysis**

The frontend sends the information to the FastAPI backend using REST API requests.

**Step 3 — Detection**

Python processes the input and applies rule-based detection methods.

**Step 4 — Results**

The backend returns structured findings, risk scores, and recommendations.

**Step 5 — Investigation**

The user can review flagged activity and ask the Investigation Assistant questions using available evidence.

**Step 6 — Recovery**

The Recovery Center helps the user prepare response steps and incident documentation.

---

## 🛠️ Technologies Used

| Component | Technology |
|-----------|------------|
| Frontend | React, JavaScript, JSX |
| Frontend build tool | Vite |
| Styling | CSS |
| Backend | Python |
| API framework | FastAPI |
| API communication | REST / JSON |
| Transaction processing | CSV |
| Detection methods | Rule-based heuristics and statistical comparisons |
| Version control and source hosting | GitHub |
| Deployment | Render |

---

## 🏗️ System Architecture

```text
                     USER
                       |
                       v
               React Frontend
                       |
                       | HTTP / JSON
                       v
                FastAPI Backend
                       |
          +------------+------------+
          |            |            |
          v            v            v
     Scam Analysis  Transaction   Campus Scam
                       Analysis     Analysis
          |            |            |
          +------------+------------+
                       |
                       v
             Structured Results
                       |
                       v
             Investigation Assistant
                       |
                       v
                Recovery Center
```

The diagram represents the application's overall workflow. Some connections are user-driven rather than fully automated.

---

## 💻 Running Locally

### Prerequisites

Install:

- Python 3
- Node.js and npm
- Git (if cloning the repository)

### 1. Clone the Repository

```bash
git clone https://github.com/omarabla05/FraudShield-AI.git

cd FraudShield-AI
```

### 2. Start the Backend

Open a terminal:

```bash
cd backend

python3 -m venv .venv

source .venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

The backend runs at:

http://127.0.0.1:8000

Interactive API documentation:

http://127.0.0.1:8000/docs

**Windows virtual environment activation:**

```powershell
.venv\Scripts\Activate.ps1
```

### 3. Start the Frontend

Open a second terminal from the project root:

```bash
cd frontend

npm install

npm run dev
```

Open:

http://localhost:5173

The frontend communicates with the locally running backend by default.

For a separate deployed backend, configure the `VITE_API_URL` environment variable.

---

## 🧪 Testing FraudShield

The application can be tested using fictional financial data.

### Test the Scam Scanner

Enter a fictional financial phishing message containing suspicious payment instructions.

Review its warning indicators and risk assessment.

### Test the Transaction Monitor

Create a CSV file using the required columns:

`date,merchant,amount`

Upload the file and review flagged transactions, risk scores, and explanations.

### Test the Investigation Assistant

After analyzing transactions, open the Investigation Assistant and ask:

- Why were these transactions flagged?
- What should I do about these suspicious payments?
- How can I verify whether a payment was authorized?

### Test the Recovery Center

Enter fictional incident information, generate a report, complete recovery checklist steps, and use **Reset Report** to start again.

---

## 🏆 What Makes FraudShield Different?

FraudShield AI combines financial fraud detection with investigation and incident response.

Its main strengths include:

**1. Connected Financial Security Workflow**

The platform brings detection, investigation, and recovery guidance together.

**2. Explainable Detection**

Flagged transactions include rule-based explanations rather than unexplained warnings.

**3. Student-Focused Security**

Campus Intelligence addresses scam scenarios relevant to college students.

**4. Practical Recovery Guidance**

Users can create structured incident reports and track recommended response steps.

**5. Accessible Interface**

The application uses a responsive white-and-purple design that works on desktop and mobile devices.

---

## ⚠️ Limitations and Responsible Use

FraudShield AI is an experimental financial cybersecurity prototype developed for demonstration and educational purposes.

Important limitations:

- Risk scores are heuristic indicators, not probabilities of fraud.
- Flagged transactions are not proof of criminal or fraudulent activity.
- The current detector uses programmed rules rather than a trained machine-learning model.
- The Investigation Assistant uses rule-based responses, not a hosted generative AI model.
- The application does not connect directly to banks.
- FraudShield cannot reverse transactions or recover stolen funds.
- No automated analysis can guarantee that all fraud will be detected.

**Privacy:** Use fictional or appropriately redacted transaction files. Do not submit passwords, card numbers, bank account numbers, or sensitive personal information.

---

## 🚀 Future Improvements

Potential future developments include:

- Machine-learning-based transaction anomaly detection.
- More advanced financial scam analysis.
- Persistent fraud investigation cases.
- Additional transaction import formats.
- Improved historical transaction comparisons.
- Optional integrations with financial institutions.
- More advanced case reporting and investigation workflows.

---

## 🏁 Hack Midwest 2026

**Competition:** Hack Midwest 2026

**Sponsor Challenge:** Flex — Best FinTech App

**Project:** FraudShield AI

**Category:** Financial Technology / Cybersecurity

**Live Demo:** https://fraudshield-ai-web.onrender.com/

---

## 📌 Project Summary

**FraudShield AI helps users detect suspicious financial activity, understand why it may be risky, and prepare practical next steps.**

Our goal is to make financial cybersecurity more accessible through an integrated platform for detection, investigation, and recovery.
