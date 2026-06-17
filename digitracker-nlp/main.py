from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import spacy

# 1. Load the NLP Engine
print("🧠 Loading NLP Model...")
nlp = spacy.load("en_core_web_sm")
print("✅ Model Loaded!")

# 2. Initialize the Microservice
app = FastAPI(
    title="DigiTracker NLP Privacy Engine",
    description="Microservice to analyze privacy policies using Natural Language Processing.",
    version="1.0.0"
)

# Open CORS so your React frontend/Extension can talk to this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Define the Expected Input Data
class PolicyData(BaseModel):
    domain: str
    policy_text: str

# 4. The Threat Matrix (Predatory Clauses to hunt for)
RED_FLAGS = [
    "sell your personal information",
    "share with third parties",
    "retain data indefinitely",
    "waive your right to a class action",
    "tracking pixels",
    "without your explicit consent",
    "may transfer your data internationally"
]

# 5. The Core Analysis Route
@app.post("/api/analyze")
async def analyze_privacy_policy(data: PolicyData):
    if not data.policy_text:
        raise HTTPException(status_code=400, detail="Policy text cannot be empty.")

    # Process the massive text block using the spaCy AI
    doc = nlp(data.policy_text.lower())
    
    found_issues = []
    
    # NLP Sentence Tokenization: Break the legal jargon into readable sentences
    for sentence in doc.sents:
        sentence_text = sentence.text.strip()
        # Check if any red flags exist in this specific sentence
        for flag in RED_FLAGS:
            if flag in sentence_text and flag not in [issue['flag'] for issue in found_issues]:
                # We save the exact sentence so the user sees the proof!
                found_issues.append({
                    "flag": flag,
                    "evidence": sentence_text
                })

    # 6. Calculate the Grading Metric
    issue_count = len(found_issues)
    
    if issue_count == 0:
        grade, risk_level = "A", "Safe"
    elif issue_count == 1:
        grade, risk_level = "B", "Low Risk"
    elif issue_count <= 3:
        grade, risk_level = "C", "Moderate Risk"
    else:
        grade, risk_level = "F", "High Risk / Predatory"

    # Return the structured analysis back to the Node backend or React frontend
    return {
        "domain": data.domain,
        "grade": grade,
        "risk_level": risk_level,
        "total_flags_found": issue_count,
        "analysis": found_issues
    }