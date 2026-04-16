from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import uvicorn
from typing import List
from processor import ResumeProcessor
from pydantic import BaseModel

from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env

app = FastAPI(title="Context-Aware AI Resume Analyser API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI Processor
# In production, use environment variables for API keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "gsk_vC8X6X8X6X8X6X8X6X8X")
processor = ResumeProcessor(groq_api_key=GROQ_API_KEY)

UPLOAD_DIR = "uploaded_resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ChatRequest(BaseModel):
    message: str

@app.post("/upload")
async def upload_resumes(files: List[UploadFile] = File(...)):
    saved_paths = []
    for file in files:
        path = os.path.join(UPLOAD_DIR, file.filename)
        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        saved_paths.append(path)
    
    return {"message": f"Uploaded {len(files)} resumes", "files": saved_paths}

@app.post("/analyze")
async def analyze(job_description: str = Form(...)):
    files = [os.path.join(UPLOAD_DIR, f) for f in os.listdir(UPLOAD_DIR) if f.endswith('.pdf')]
    if not files:
        raise HTTPException(status_code=400, detail="No resumes uploaded.")
    
    # Process for RAG
    processor.process_resumes(files, job_description)
    
    # Simple multi-candidate analysis
    results = []
    for file_path in files:
        text = processor.extract_text(file_path)
        analysis = processor.analyze_match(job_description, text)
        results.append({
            "filename": os.path.basename(file_path),
            "score": analysis["match_score"],
            "analysis": analysis["analysis"]
        })
    
    # Sort by score
    results.sort(key=lambda x: x["score"], reverse=True)
    return results

@app.post("/chat")
async def chat(request: ChatRequest):
    chain = processor.get_chat_chain()
    if not chain:
        raise HTTPException(status_code=400, detail="Please upload and analyze resumes first to initialize RAG.")
    
    response = chain.invoke({"question": request.message})
    return {"answer": response["answer"]}

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
