# 🎬 IMDB RAG Chatbot — Simple Frontend + Bedrock Lambda Bridge

A small, easy-to-run movie assistant: a Streamlit frontend (RAG_Chatbot/app.py) that sends user queries to an AWS Lambda bridge which calls an agent/runtime (Amazon Bedrock style) and returns short, sourced answers. This README is short and focused — what you need to run and tie the pieces together.

🚀 Highlights
- Frontend: Streamlit UI (RAG_Chatbot/app.py)
- Backend: AWS Lambda (Python) calling Bedrock-style `retrieve_and_generate`
- API gateway: AWS API Gateway exposes POST /chat
- Vector store: OpenSearch Serverless (stores IMDB vectors)
- Embeddings: Tital text embeddings (used to create vectors)
- LLM / Inference profile: Amazon Nova lite v1.0 (apac region example)
- Contract: POST /chat { "query": "...", "session_id": "<opt>" } → { "response", "session_id", "citations" }

---

Architecture (short)
1. Streamlit UI collects a question and POSTs /chat.
2. API Gateway forwards the request to Lambda.
3. Lambda calls the agent runtime (`retrieve_and_generate`) on Bedrock:
   - retrieval: OpenSearch Serverless (IMDB vector store)
   - embedding model used to index content: Tital text embeddings
   - generation: Amazon Nova lite v1.0 inference profile
4. Agent returns text + session id + citations; Lambda returns JSON to frontend.

Simple flow (one line): Streamlit → API Gateway → Lambda → Bedrock Agent → OpenSearch Serverless

---

Quick start (frontend only)
1. Clone and open the frontend folder:
   git clone https://github.com/panky306/Live_Projects.git
   cd Live_Projects/RAG_Chatbot
2. Create venv and install:
   python -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
3. Configure API_URL in `app.py` or `.streamlit/secrets.toml`:
   API_URL = "https://<api-gateway-id>.execute-api.<region>.amazonaws.com/<stage>/chat"
4. Run:
   streamlit run app.py

---

API (contract)
- POST /chat
  - Request JSON: { "query": "Tell me about The Godfather", "session_id": "optional" }
  - Success (200): { "response": "...", "session_id": "...", "citations": [...] }
  - Errors: 400 for missing query; 500 for backend/Bedrock errors

Example curl:

curl -X POST "https://<api-gateway>.execute-api.<region>.amazonaws.com/prod/chat" \
  -H "Content-Type: application/json" \
  -d '{"query":"Who directed Parasite?"}'

---

Deployment notes (backend)
- Lambda environment variables to set:
  - MODEL_ARN (e.g. Amazon Nova lite v1.0 inference profile ARN)
  - KNOWLEDGE_BASE_ID (your Bedrock knowledge base id)
  - AWS_REGION (where Bedrock & OpenSearch Serverless run, e.g. ap-south-1)
- Required AWS pieces:
  - OpenSearch Serverless collection (vector store for IMDB docs)
  - Bedrock knowledge base + inference profile (Nova lite v1.0)
  - API Gateway (POST /chat) wired to Lambda
  - Lambda execution role with Bedrock and OpenSearch access + CloudWatch logs
- Security: use IAM roles, Secrets Manager for sensitive config, and protect the API (API key or JWT) in production.

---

Example prompts (user-friendly)
- "Summarize The Godfather in 2 sentences and list director and top 3 cast."
- "Recommend a thriller from the IMDB top 1000 for a small group — explain why in one sentence."
- "Who won Best Actor for The King's Speech and which year? Provide an IMDB URL."

Improved prompt (short template to send to the agent)

You can send this text as the query to get structured, reliable answers:

"You are a concise movie assistant. Use the IMDB knowledge base only. Return a short summary (1-3 sentences), a facts block (year, director, top_cast up to 3), and any citations (source id or URL). Keep language simple.\nQuestion: <user question>"

Why use this: it encourages short, factual answers and citations (easy for frontend parsing).

---

Keep it simple: the frontend is a lightweight demo — the backend pieces (OpenSearch Serverless, Tital embeddings, Nova lite v1.0, Bedrock knowledge) are where production work happens (indexing, embeddings, and model tuning). Use this repo as the UI + integration example and wire your own Bedrock/OpenSearch infra for a full RAG system.

---

License: MIT
