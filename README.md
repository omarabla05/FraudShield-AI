# FraudShield AI

## Financial Cybersecurity and Fraud Investigation Platform

FraudShield AI is a financial cybersecurity application designed to help users identify suspicious payment requests, analyze financial transactions, investigate possible scams, and prepare recovery reports.

Built for the Flex FinTech Challenge, FraudShield combines financial technology and cybersecurity into a single, easy-to-use platform.

## The Problem

Financial scams are becoming increasingly sophisticated. Fraudulent payment requests, phishing messages, suspicious transactions, and university impersonation scams can cause financial losses.

Many users need help understanding why a request is suspicious and what steps they should take after identifying potential fraud.

## Our Solution

FraudShield brings detection, investigation, and recovery together in one application.

### Main Features

**1. Scam Scanner**

Analyzes suspicious payment messages and URLs, calculates a heuristic risk score, identifies warning indicators, and recommends verification steps.

**2. Transaction Monitor**

Allows users to upload transaction CSV files and identify potentially unusual, duplicate, or suspicious financial activity.

**3. Campus Intelligence**

Investigates student-targeted scams, including fraudulent tuition payment requests and university account impersonation.

**4. Investigation Assistant**

Provides rule-based explanations of financial security risks, transaction findings, and potential recovery steps.

**5. Recovery Center**

Helps users generate personalized recovery checklists and incident reports. Findings from previous scans can be imported into recovery reports.

**6. Security Dashboard**

Displays scan activity, high-risk findings, and transaction analysis summaries.

## What Makes FraudShield Different?

FraudShield connects financial fraud detection with a practical response workflow.

Rather than presenting users with only a suspicious activity warning, it explains detected indicators, helps users investigate the situation, and guides them through preparing incident documentation.

Its campus-focused scam investigation feature also addresses risks that students may encounter.

## Technology

- Frontend: React, Vite, JavaScript, CSS
- Backend: Python, FastAPI
- Financial data processing: CSV transaction analysis
- Threat analysis: Rule-based and heuristic detection

## Running Locally

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The backend runs at http://127.0.0.1:8000.

### Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## Demo

You can test FraudShield using fictional scam messages and the included sample transaction CSV.

No real financial information is required.

## Limitations

FraudShield is a development prototype. Risk scores are heuristic assessments rather than verified probabilities of fraud. The application does not directly connect to financial institutions, reverse payments, or guarantee fraud detection.

The investigation assistant currently uses rule-based responses rather than a hosted generative AI model.

Do not submit banking passwords, payment card details, or sensitive financial information.