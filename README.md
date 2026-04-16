# RE-LYSER AI: Context-Aware Resume Analyser

An advanced AI-powered recruitment tool that uses **RAG (Retrieval-Augmented Generation)**, **BERT-based classification**, and **Large Language Models (Llama 3.3)** to transform how hiring is done.

## 🚀 Key Features
- **Intelligent Ranking:** Semantic similarity scoring (beyond keyword matching).
- **AI Gap Analysis:** Instant insights into candidate strengths, weaknesses, and missing skills.
- **Agentic Chat:** Talk to your resume database using natural language.
- **Rich Analytics:** Visual matching score distribution for candidate pools.
- **Section Classification:** BERT-powered zero-shot classification for resumes.

## 🛠 Tech Stack
- **Frontend:** React.js, Vite, Framer Motion, Lucide Icons.
- **Backend:** FastAPI (Python), LangChain.
- **AI/ML:** Groq (Llama 3.3), HuggingFace Transformers (BART), Sentence-Transformers.
- **Vector DB:** ChromaDB.

## 📥 Installation & Setup

### 1. Clone the repository
```bash
git clone <your-repo-link>
cd <folder-name>
```

### 2. Backend Setup
1. Open a terminal in the `backend` folder.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file and add your Groq API Key:
   ```text
   GROQ_API_KEY=gsk_your_key_here
   ```
4. Run the server:
   ```bash
   python main.py
   ```

### 3. Frontend Setup
1. Open another terminal in the `frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🎯 Target Audience
Designed for **HR Professionals**, **Recruiters**, and **Hiring Managers** who deal with large candidate pools and need data-driven insights to make faster, better hiring decisions.

---
Built with ❤️ by AI Enthusiasts.
