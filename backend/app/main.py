
from fastapi import UploadFile, File, HTTPException
from services.transaction_detector import analyze_transactions
from pydantic import BaseModel, Field
from services.scam_detector import analyze_scam
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from services.investigation_assistant import investigate
from services.campus_detector import analyze_campus_scam

app = FastAPI(
    title="FraudShield AI",
    description="AI-powered financial cybersecurity platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"]
)

@app.get("/")
def home():
    return {
        "app": "FraudShield AI",
        "status": "online",
        "message": "FraudShield AI backend is running!"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }

class ScamRequest(BaseModel):
    content: str = Field(min_length=1, max_length=10000)


@app.post("/api/scam/analyze")
def scan_payment(request: ScamRequest):
    return analyze_scam(request.content)

@app.post("/api/transactions/analyze")
async def analyze_transaction_file(
    file: UploadFile = File(...)
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a CSV file."
        )

    # Limit uploads to 1 MB.
    content = await file.read(1024 * 1024 + 1)

    if len(content) > 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="CSV file exceeds the 1 MB limit."
        )

    try:
        csv_text = content.decode("utf-8-sig")
        return analyze_transactions(csv_text)

    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="CSV file must use UTF-8 encoding."
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

class AssistantRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    scan: Optional[dict] = None
    transaction: Optional[dict] = None


@app.post("/api/assistant/investigate")
def investigate_payment(request: AssistantRequest):
    return investigate(
        question=request.question,
        scan=request.scan,
        transaction=request.transaction
    )

class CampusScamRequest(BaseModel):
    content: str = Field(
        min_length=1,
        max_length=10000
    )


@app.post("/api/campus/analyze")
def scan_campus_payment(request: CampusScamRequest):
    return analyze_campus_scam(request.content)
