# 🎬 RAG_Chatbot — Movie Assistant (IMDB)

![Streamlit](https://img.shields.io/badge/Streamlit-FF4B4B?style=flat&logo=streamlit&logoColor=white)

A playful Retrieval‑Augmented Generation (RAG) chatbot for exploring the top IMDB movies — ask about plots, trivia, cast, or which film pairs best with popcorn. 🍿✨

Live demo: https://pankajimdbchatbot.streamlit.app

Quick summary
- Frontend: Streamlit app that sends user queries to a backend chat API and renders replies in a chat UI.
- Backend: Any HTTP API compatible with the simple POST /chat contract described below (the repository does not include the backend implementation).
- Purpose: Demonstrate a small, production-like frontend for a RAG-powered movie assistant built with a vectorized IMDB knowledge base and a model/agent runtime.

Quick start (frontend only)

1. Clone & open:
   git clone https://github.com/panky306/Live_Projects.git
   cd Live_Projects/RAG_Chatbot
2. Create venv & install:
   python -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
3. Configure API_URL (Streamlit Secrets recommended):
   API_URL = "https://<api-gateway-id>.execute-api.<region>.amazonaws.com/<stage>/chat"
   Alternatively, set it in `.streamlit/secrets.toml` as `API_URL = "https://..."`.
4. Run:
   streamlit run RAG_Chatbot/app.py

Architecture (high level)

```mermaid
flowchart LR
  A[User — Streamlit UI 🎛️] -->|POST /chat| B[API Gateway 🌐]
  B --> C[Backend API (your choice) 🔁]
  C --> D[Agent runtime / Model 🔍 + 🤖]
  D --> E[Knowledge Base (IMDB vector store) 📚]
  D --> F[Model / Inference Profile 🧠]
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

- Keep secrets out of source control — use Streamlit Secrets or environment variables. 🔐
- Enable CORS for your deployed frontend domain when your backend is hosted separately. 🌍
- The backend implementation is intentionally out-of-repo — any HTTP backend that follows the API contract and calls a model/agent runtime (Bedrock, OpenAI, Google Vertex, etc.) will work.
- Add authentication, rate-limiting, and usage/accounting for production since model calls can incur real cost. 💸

Files
- RAG_Chatbot/app.py — Streamlit frontend
- RAG_Chatbot/requirements.txt — pinned frontend deps

How the frontend works (brief)

- The Streamlit UI uses `st.chat_input` and `st.chat_message` to collect user input and display the conversation history.
- On submit, the app POSTs `{ "query": "..." }` to the configured API_URL and expects a JSON response with a `response` field.
- The app keeps a simple chat history in `st.session_state.messages` so the conversation persists across reruns.

Development & local wiring

- The frontend assumes a single POST /chat endpoint. If you run the backend locally on a different origin, enable CORS on the backend and set `API_URL` to the backend base URL (for example `http://localhost:8000/chat`).

Security & production notes

- Protect the backend API with authentication (API keys, JWTs), rate limits, and usage accounting. Consider adding server-side caching for repeated queries to reduce cost.
- If you use managed model runtimes (Bedrock, Vertex/PaLM, OpenAI), restrict access and store credentials in a secrets manager or environment variables — never check them into Git.

Enhancements & ideas

- Stream responses from the model and render incrementally for lower perceived latency.
- Add a citation panel to surface source documents/URLs used by the RAG retriever.
- Add user sessions and conversation summaries so the agent can better follow long conversations.

License: MIT

Made with ❤️ for movie nerds and builders. Roll credits. 🎞️
