# 🎬 RAG_Chatbot — Movie Assistant (IMDB)

![Streamlit](https://img.shields.io/badge/Streamlit-FF4B4B?style=flat&logo=streamlit&logoColor=white) ![Bedrock](https://img.shields.io/badge/Amazon%20Bedrock-232F3E?style=flat&logo=amazonaws&logoColor=white) ![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)

A playful Retrieval‑Augmented Generation chatbot for top IMDB movies — ask plots, trivia, or which film pairs best with popcorn. 🍿✨

Live demo: https://pankajimdbchatbot.streamlit.app

Quick start (frontend only)

1. Clone & open:
   git clone https://github.com/panky306/Live_Projects.git
   cd Live_Projects/RAG_Chatbot
2. Create venv & install:
   python -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
3. Configure API_URL (Streamlit Secrets recommended):
   API_URL = "https://<api-gateway-id>.execute-api.<region>.amazonaws.com/<stage>/chat"
4. Run:
   streamlit run RAG_Chatbot/app.py

Architecture

```mermaid
flowchart LR
  A[User — Streamlit UI 🎛️] -->|POST /chat| B[API Gateway 🌐]
  B --> C[Backend API (your choice) 🔁]
  C --> D[Bedrock Agent Runtime 🔍 + 🤖]
  D --> E[Knowledge Base (IMDB vector store) 📚]
  D --> F[Bedrock Model / Inference Profile 🧠]
  F --> C
  C --> B
  B --> A
```

API (short)

POST /chat
- Content-Type: application/json
- Body: { "query": "Tell me about The Godfather", "session_id": "<optional>" }
- Success: { "response": "...", "session_id": "...", "citations": [...] }

Notes & tips

- Keep secrets out of source control — use Streamlit Secrets or env vars. 🔐
- Enable CORS for your deployed frontend domain. 🌍
- Bedrock calls cost real money — add auth/rate-limiting for production. 💸
- Backend implementation is intentionally out-of-repo — any HTTP backend that calls Bedrock Agent Runtime (or equivalent) works.

Files
- RAG_Chatbot/app.py — Streamlit frontend
- RAG_Chatbot/requirements.txt — pinned frontend deps

License: MIT

Made with ❤️ for movie nerds and builders. Roll credits. 🎞️
