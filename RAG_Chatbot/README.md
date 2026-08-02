# 🎬 IMDB RAG Chatbot — Frontend + Bedrock Lambda Bridge

A playful, production-minded Retrieval‑Augmented Generation (RAG) movie assistant: a Streamlit frontend that sends user queries to a lightweight AWS Lambda bridge which calls an agent/runtime (Bedrock-style retrieve-and-generate) and returns structured JSON replies with optional citations. Perfect for exploring plot, trivia, cast, recommendations, and more — with traceable sources.

🌟 Live demo (example): https://pankajimdbchatbot.streamlit.app

---

## What’s included (short)
- Frontend: Streamlit app — RAG_Chatbot/app.py
- Frontend deps: RAG_Chatbot/requirements.txt
- Backend: Example AWS Lambda handler (Python) that calls an agent/runtime via boto3 (retrieve_and_generate).
- Contract: POST /chat JSON API: { "query": "...", "session_id": "<optional>" } → { "response", "session_id", "citations" }

---

## Stack
- Languages: Python 3.9+
- Frontend runtime: Streamlit (st.chat_input / st.chat_message)
- Backend runtime: AWS Lambda (boto3 calling bedrock-agent-runtime)
- Notable libs (frontend): streamlit, requests
- Notable libs (backend): boto3, botocore

---

## Architecture — components & flow

- Frontend (Streamlit UI)
  - Collects user input
  - POSTs { "query": "...", "session_id": "..." } to Lambda via API Gateway
  - Renders assistant responses and keeps conversation in st.session_state

- API Gateway
  - Exposes POST /chat to the browser
  - CORS must be enabled for the Streamlit app origin

- Lambda bridge (example handler)
  - Parses JSON event.body
  - Builds retrieve_and_generate request for bedrock-agent-runtime
  - Forwards sessionId only if provided
  - Returns JSON { response, session_id, citations } (with CORS headers)
  - Handles ClientError, KeyError (missing query), and generic exceptions with appropriate HTTP codes

- Agent runtime (Bedrock or similar)
  - Retrieve step: query knowledge base (IMDB vector store)
  - Generate step: produce answer + optional citations
  - Returns output.text and sessionId which Lambda proxies to frontend

Mermaid flow:

```mermaid
flowchart LR
  U[User — Streamlit UI 🎛️] -->|POST /chat| G[API Gateway 🌐]
  G --> L[AWS Lambda — Bridge 🪄]
  L --> A[Agent runtime / retrieve_and_generate 🔎🤖]
  A --> K[Knowledge base (IMDB vectors) 📚]
  A --> M[Model/inference profile (nova/gemma/...) 🧠]
  A --> L
  L --> G
  G --> U
```

---

## How the frontend works (app.py highlights)
- File: RAG_Chatbot/app.py
  - Uses st.set_page_config, st.title
  - Initializes st.session_state.messages list
  - Displays conversation history using st.chat_message
  - On st.chat_input submit:
    - Appends user message to session state
    - POSTs JSON payload {"query": prompt} to API_URL (requests.post)
    - Expects HTTP 200 + JSON with `response` field and optional `session_id`, `citations`
    - Appends assistant response to session_state and renders it
  - Error handling: shows response_placeholder.error(...) for non-200 or exceptions

- File: RAG_Chatbot/requirements.txt
  - streamlit==1.46.1
  - requests==2.32.3

---

## Lambda handler (key technical details from provided code)
- Uses boto3 client: boto3.client('bedrock-agent-runtime', region_name='ap-south-1')
- Builds request body for retrieve_and_generate:
  - input: { text: user_query }
  - retrieveAndGenerateConfiguration: type=KNOWLEDGE_BASE, knowledgeBaseConfiguration includes knowledgeBaseId and modelArn
- Only sets sessionId in request if a non-empty session_id is supplied
- Parses response['output']['text'] and response['sessionId']; includes response.get('citations', [])
- Error mapping:
  - missing 'query' → 400 with helpful message
  - boto3 ClientError → 500 with AWS error code and message
  - unexpected exceptions → 500 with message
- Adds CORS header: Access-Control-Allow-Origin: '*'

---

## Quick start (frontend only)
1. Clone & open:
   git clone https://github.com/panky306/Live_Projects.git
   cd Live_Projects/RAG_Chatbot
2. Create venv & install:
   python -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
3. Configure API_URL:
   - In app.py: set API_URL = "https://<api-gateway-id>.execute-api.<region>.amazonaws.com/<stage>/chat"
   - Or use `.streamlit/secrets.toml`:
     API_URL = "https://..."
4. Run:
   streamlit run app.py

---

## Deploying the backend (high level)
- Deploy Lambda (Python 3.9+) and attach an execution role with:
  - Permissions to call Bedrock agent runtime (retrieve_and_generate) in your region
  - CloudWatch Logs: CreateLogGroup / CreateLogStream / PutLogEvents
  - Secrets Manager / SSM permissions if using secrets
- Create API Gateway POST /chat, integrate with the Lambda
- Enable CORS for the Streamlit origin (or use '*' for quick testing)
- Environment variables (recommended instead of hardcoding):
  - AWS_REGION
  - MODEL_ARN
  - KNOWLEDGE_BASE_ID

---

## IAM & Security notes
- Least privilege only: grant Bedrock/agent runtime permissions scoped to required resources
- Never commit credentials or secrets to source control
- Protect endpoint in production: API keys, JWT, or Cognito; add rate-limiting and usage accounting
- Consider server-side caching for repeated queries

---

## Observability & hardening
- Add structured logging and request IDs in Lambda
- Add retries with exponential backoff on the frontend for transient network errors
- Consider streaming model outputs (if runtime supports it) to reduce perceived latency

---

## Example prompts (user-facing) — short & fun
- "Tell me the plot of The Godfather in 3 sentences."
- "Who starred in Parasite and what awards did it win?"
- "Recommend a top 10 crime drama from the 1990s similar to Goodfellas."
- "Which movie from the IMDB top 1000 is best to watch with a group of friends who like thrillers?"

---

## Improved prompts — recommended for better, more reproducible answers
Use the following prompt template when sending to the agent runtime. It instructs the model on style, length, and citation needs.

Template (production-ready):
```
You are a concise, factual movie assistant. Use information from the IMDB knowledge base only. Provide:
1) Short answer (1–3 sentences).
2) Key facts list (release year, director, top 3 cast members).
3) Recommendation or follow-up question if helpful.
4) Any citations used (source id or URL). If none, say "No citation available."

User question: "<user_query_here>"
Return JSON with keys: "answer" (string), "facts" (list), "follow_up" (string or null), "citations" (list).
```

Why this helps:
- The agent returns structured data the frontend can parse and render.
- Enforces brevity and factual output.
- Requests citations for traceability.

---

## Example curl (frontend → API)
```bash
curl -X POST "https://<api-gateway-id>.execute-api.ap-south-1.amazonaws.com/prod/chat" \
  -H "Content-Type: application/json" \
  -d '{"query":"Tell me the plot of The Godfather in 3 sentences."}'
```

Expected JSON (example):
```json
{
  "response": "Don Vito Corleone, head of a New York crime family, navigates power and legacy while his youngest son Michael transforms from outsider to ruthless mafia boss. The film explores family, honor, and the corrupting effects of power.",
  "session_id": "abc-123",
  "citations": [
    {"source":"imdb:tt0068646","url":"https://www.imdb.com/title/tt0068646/"}
  ]
}
```

---

## Example conversation prompts — improved (iterations)
1) Raw / simple:
   - "Tell me about Inception."
2) Improved (more explicit):
   - "Summarize Inception in 2 sentences, list director and top 3 actors, and provide any IMDB URLs used."
3) Final production prompt (structured — recommended):
   - (Use the Template above with JSON output requirement.)

---

## Prompt improvement — short evolution & rationale
- Problem: free-form prompts produce variable-length, unstructured answers and may omit citations.
- Fix: instruct the agent to return JSON with deterministic keys, enforce short summary + structured facts + citations.
- Result: frontend can parse reliably and store/display citations and follow-ups.

---

## Troubleshooting tips
- If app shows "API Error: Received status code X":
  - Check API Gateway logs and Lambda CloudWatch logs
  - Confirm CORS is enabled for the Streamlit origin
- If Lambda fails with ClientError:
  - Check IAM permissions for bedrock-agent-runtime
  - Ensure modelArn and knowledgeBaseId are valid in that region
- If no `response` field in the Lambda response:
  - Ensure the agent runtime returns output.text and sessionId keys, or update Lambda parsing accordingly

---

## Enhancements & ideas
- Stream model outputs for incremental rendering in Streamlit.
- Add a citation panel in the UI linking back to source documents.
- Add user accounts and conversation summaries for personalized context.

---

## License
MIT

Made with ❤️ and popcorn 🍿 — built for movie lovers and engineers.
