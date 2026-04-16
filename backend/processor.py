import os
import re
import numpy as np
from typing import List, Dict, Any
import pdfplumber
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
try:
    from langchain_classic.chains import ConversationalRetrievalChain
    from langchain_classic.memory import ConversationBufferMemory
except ImportError:
    from langchain.chains import ConversationalRetrievalChain
    from langchain.memory import ConversationBufferMemory
from sklearn.metrics.pairwise import cosine_similarity
from transformers import pipeline

class ResumeProcessor:
    def __init__(self, groq_api_key: str = None):
        # Initialize Embeddings
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        
        # Initialize LLM (Groq)
        try:
            self.llm = ChatGroq(
                groq_api_key=groq_api_key or os.getenv("GROQ_API_KEY", "mock"),
                model_name="llama-3.3-70b-versatile"
            )
        except:
            self.llm = None
            print("Warning: Groq API Key missing or invalid. Using Mock LLM.")
        
        # Initialize Zero-Shot Classifier for Section Classification (Advanced AI Concept)
        # We wrap this in try-except as well in case torch/transformers are missing
        try:
            self.classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
        except:
            self.classifier = None
            print("Warning: BERT Classifier not initialized. Using keyword heuristics.")
        self.sections = ["Skills", "Education", "Experience", "Projects", "Summary"]
        
        # Vector Store Placeholder
        self.vector_store = None
        self.memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

    def extract_text(self, pdf_path: str) -> str:
        """Extract text from PDF using pdfplumber for better formatting retention."""
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"
        return text

    def classify_sections(self, text: str) -> Dict[str, str]:
        """
        Advanced Section Classification:
        Chops text into paragraphs and uses BERT-based zero-shot classification
        to group them into Skills, Experience, etc.
        """
        lines = text.split('\n')
        classified_data = {s: "" for s in self.sections}
        
        current_section = "Summary"
        for line in lines:
            if not line.strip(): continue
            
            # Simple heuristic check first for efficiency
            clean_line = line.strip().upper()
            found_header = False
            for s in self.sections:
                if clean_line == s.upper() or f" {s.upper()} " in f" {clean_line} ":
                    current_section = s
                    found_header = True
                    break
            
            if not found_header and len(line.split()) < 10:
                # Use AI to classify ambiguous headers
                result = self.classifier(line, candidate_labels=self.sections)
                if result['scores'][0] > 0.8:
                    current_section = result['labels'][0]
            
            classified_data[current_section] += line + "\n"
            
        return classified_data

    def process_resumes(self, pdf_paths: List[str], job_description: str):
        """
        Core RAG Pipeline:
        1. Multi-resume processing
        2. Chunking & Embedding
        3. ChromaDB storage
        """
        all_chunks = []
        resume_metadata = []
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        
        for path in pdf_paths:
            filename = os.path.basename(path)
            raw_text = self.extract_text(path)
            chunks = text_splitter.split_text(raw_text)
            
            for chunk in chunks:
                all_chunks.append(chunk)
                resume_metadata.append({"source": filename})
        
        # Initialize/Rebuild ChromaDB
        self.vector_store = Chroma.from_texts(
            texts=all_chunks,
            embedding=self.embeddings,
            metadatas=resume_metadata,
            persist_directory="./chroma_db"
        )
        
        return "Resumes processed and indexed successfully."

    def analyze_match(self, job_description: str, resume_text: str) -> Dict[str, Any]:
        """
        Semantic Match Scoring & Gap Analysis.
        Uses Cosine Similarity on embeddings for the score.
        """
        # 1. Cosine Similarity Score
        jd_emb = self.embeddings.embed_query(job_description)
        res_emb = self.embeddings.embed_query(resume_text)
        
        score = cosine_similarity([jd_emb], [res_emb])[0][0] * 100
        
        # 2. LLM Analysis for Strengths/Weaknesses
        if self.llm:
            try:
                prompt = f"""
                Analyze the following Resume against the Job Description.
                
                Job Description: {job_description}
                Resume: {resume_text}
                
                Provide a JSON response with:
                - strengths: list of strings
                - weaknesses: list of strings
                - missing_skills: list of strings
                - suggestions: list of strings
                """
                response = self.llm.invoke(prompt)
                ai_content = response.content
                
                # Cleanup markdown code blocks if AI wrapped the JSON
                if "```" in ai_content:
                    ai_content = ai_content.split("```")[1]
                    if ai_content.startswith("json"):
                        ai_content = ai_content[4:]
                
                # Try to parse and format nicely
                import json
                try:
                    data = json.loads(ai_content)
                    formatted = ""
                    if "strengths" in data:
                        formatted += "✅ **Strengths:**\n" + "\n".join([f"• {s}" for s in data["strengths"]]) + "\n\n"
                    if "weaknesses" in data:
                        formatted += "⚠️ **Weaknesses:**\n" + "\n".join([f"• {w}" for w in data["weaknesses"]]) + "\n\n"
                    if "missing_skills" in data:
                        formatted += "❌ **Missing Skills:**\n" + "\n".join([f"• {m}" for m in data["missing_skills"]]) + "\n\n"
                    if "suggestions" in data:
                        formatted += "💡 **Suggestions:**\n" + "\n".join([f"• {s}" for s in data["suggestions"]])
                    ai_content = formatted
                except:
                    pass # Keep as is if parsing fails
            except Exception as e:
                ai_content = f"Error communicating with AI: {str(e)}"
        else:
            ai_content = "LLM (Groq) is not initialized. Please check your API key in the .env file."
        
        return {
            "match_score": round(float(score), 2),
            "analysis": ai_content
        }

    def get_chat_chain(self):
        """Build a conversational RAG chain."""
        if not self.vector_store:
            return None
            
        return ConversationalRetrievalChain.from_llm(
            llm=self.llm,
            retriever=self.vector_store.as_retriever(),
            memory=self.memory
        )
