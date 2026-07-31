# RAG_Chatbot — Movie Assistant (IMDB)

Live demo: https://pankajimdbchatbot.streamlit.app

A Retrieval‑Augmented Generation (RAG) chatbot that answers questions about the top IMDB movies. Frontend is a Streamlit chat UI. Backend is an AWS API Gateway → Lambda which calls Amazon Bedrock Agent Runtime to retrieve from a registered knowledge base (the IMDB dataset indexed in a vector store) and generate answers via a Bedrock model/inference profile (example: Nova Lite).

Contents
- [Project overview](#project-overview)
- [Features](#features)
- [Architecture](#architecture)
- [Quickstart — Local (frontend only)](#quickstart--local-frontend-only)
- [Deploying frontend on Streamlit Cloud](#deploying-frontend-on-streamlit-cloud)
- [Backend — API Gateway + Lambda + Bedrock (overview & checklist)](#backend---api-gateway--lambda--bedrock-overview--checklist)
- [API specification & testing](#api-specification--testing)
- [Configuration & env values](#configuration--env-values)
- [Production considerations](#production-considerations)
- [Troubleshooting](#troubleshooting)
- [Next steps / improvements](#next-steps--improvements)
- [License](#license)

---

Project overview
----------------
RAG_Chatbot demonstrates an end-to-end Retrieval‑Augmented Generation workflow for a movie assistant:

- User types a question (Streamlit UI).
- Frontend sends POST {"query":"..."} to API Gateway `/chat`.
- Lambda invokes Bedrock Agent Runtime `retrieve_and_generate` against a registered knowledge base (IMDB dataset).
- Bedrock retrieves relevant documents, runs the model, and returns generated text plus citations and a session id.
- Frontend displays the response and preserves chat history.

Features
--------
- Simple Streamlit chat UI (RAG_Chatbot/app.py).
- Lambda backend integrating with Bedrock Agent Runtime for retrieval + generation.
- Example use of Amazon Nova Lite inference profile (replaceable).
- Minimal frontend dependencies: Streamlit + requests.

Architecture
------------
Flow (text):
Streamlit (browser) → API Gateway (POST /chat) → Lambda → Bedrock Agent Runtime (retrieve_and_generate) → Knowledge Base (vector store) + Bedrock Model → Lambda → API Gateway → Streamlit

Mermaid diagram:

```mermaid
flowchart LR
  A[User — Streamlit UI] -->|POST /chat| B[API Gateway]
  B --> C[AWS Lambda (handler)]
  C --> D[Bedrock Agent Runtime (retrieve_and_generate)]
  D --> E[Knowledge Base / Vector store (IMDB dataset)]
  D --> F[Bedrock Model / Inference Profile (e.g., nova-lite)]
  F --> C
  C --> B
  B --> A
```

Quickstart — Local (frontend only)
----------------------------------
These steps run the Streamlit frontend locally. The frontend requires a reachable backend API (API Gateway + Lambda).

1. Clone repository and change directory:
   git clone https://github.com/panky306/Live_Projects.git
   cd Live_Projects/RAG_Chatbot

2. Create & activate a virtual environment:
   - macOS / Linux:
     python -m venv venv
     source venv/bin/activate
   - Windows (PowerShell):
     python -m venv venv
     .\venv\Scripts\Activate.ps1

3. Install dependencies:
   pip install -r requirements.txt

4. Configure API endpoint:
   - Option A (quick edit): open `RAG_Chatbot/app.py` and set:
     API_URL = "https://<api-gateway-id>.execute-api.<region>.amazonaws.com/<stage>/chat"
   - Option B (recommended): use environment variable or Streamlit secrets (see below).

5. Run locally:
   streamlit run RAG_Chatbot/app.py

6. Open the local URL printed by Streamlit and test queries like:
   "Tell me about The Godfather"

Deploying frontend on Streamlit Cloud
------------------------------------
This repo is already deployed to Streamlit Cloud at the Live demo link above. To replicate or deploy a new instance:

1. Ensure the repo contains `RAG_Chatbot/app.py` and `RAG_Chatbot/requirements.txt`.

2. Use Streamlit Secrets to store your backend API URL and other secrets:
   - In your Streamlit app settings (on share.streamlit.io) add:
     API_URL = https://<api-gateway-id>.execute-api.<region>.amazonaws.com/<stage>/chat

   - In code, read the secret:
     import streamlit as st
     API_URL = st.secrets.get("API_URL", "<fallback>")

3. Create a new Streamlit Cloud app:
   - Connect GitHub, choose this repository, select branch and `RAG_Chatbot/app.py` as the entrypoint.
   - Add the secret(s) in the app's settings.
   - Deploy and verify the published URL.

Notes:
- When the Streamlit frontend runs in users' browsers, API Gateway must allow CORS for the Streamlit domain (set via API Gateway CORS settings). Prefer limiting allowed origins rather than using "*".

Backend — API Gateway + Lambda + Bedrock (overview & checklist)
---------------------------------------------------------------
This project depends on a functioning backend. The backend is out-of-repo (not included here) but the README documents what you need.

Essential responsibilities
- Lambda handles POST /chat JSON: {"query": "...", "session_id": "<optional>"}.
- Lambda calls bedrock_agent_runtime.retrieve_and_generate with:
  - input: {"text": "<user query>"}
  - retrieveAndGenerateConfiguration: { type: "KNOWLEDGE_BASE", knowledgeBaseConfiguration: { knowledgeBaseId, modelArn } }
- Lambda returns JSON: {"response": "<text>", "session_id": "<sessionId>", "citations": [...]}

Production checklist
- [ ] Create & index IMDB dataset into a vector store and register it with Bedrock (obtain knowledgeBaseId).
- [ ] Create Lambda (Python 3.9/3.10/3.11) with code that:
    - Parses event['body'], extracts "query".
    - Calls bedrock_agent_runtime.retrieve_and_generate(...) with proper args.
    - Returns JSON with "response", "session_id", and "citations".
- [ ] Configure Lambda execution role with least-privilege permissions to call Bedrock and access any other resources (S3/KMS/Secrets Manager if used).
- [ ] Create API Gateway endpoint (POST /chat) integrated with Lambda, enable CORS (allow Streamlit domain).
- [ ] Deploy API stage and update frontend with API_URL.
- [ ] Monitor CloudWatch logs, test end-to-end.

Recommended Lambda snippet (high-level)
```python
import json
import boto3

bedrock_agent_runtime = boto3.client('bedrock-agent-runtime', region_name='ap-south-1')

def lambda_handler(event, context):
    body = json.loads(event.get('body', '{}'))
    query = body['query']  # validate in production
    session_id = body.get('session_id')

    params = {
      'input': {'text': query},
      'retrieveAndGenerateConfiguration': {
        'type': 'KNOWLEDGE_BASE',
        'knowledgeBaseConfiguration': {
          'knowledgeBaseId': '<YOUR_KB_ID>',
          'modelArn': '<MODEL_OR_INFERENCE_PROFILE_ARN>'
        }
      }
    }
    if session_id:
        params['sessionId'] = session_id

    resp = bedrock_agent_runtime.retrieve_and_generate(**params)
    return {
      'statusCode': 200,
      'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
      'body': json.dumps({
        'response': resp['output']['text'],
        'session_id': resp.get('sessionId'),
        'citations': resp.get('citations', [])
      })
    }
```

API specification & testing
--------------------------
POST /chat
- Headers: Content-Type: application/json
- Body:
  {
    "query": "Tell me about The Godfather",
    "session_id": "<optional>"
  }

Success (200):
{
  "response": "The Godfather (1972) is ...",
  "session_id": "<session-id>",
  "citations": [ ... ]
}

Errors:
- 400 — missing/invalid request fields
- 500 — backend/Bedrock errors; check Lambda CloudWatch logs

Test with curl:
curl -X POST "https://<api-gateway>/chat" \
  -H "Content-Type: application/json" \
  -d '{"query":"Tell me about The Shawshank Redemption"}'

Configuration & env values
--------------------------
Frontend:
- API_URL — backend endpoint for POST /chat (use Streamlit secrets in production)

Backend:
- region_name — AWS region for Bedrock (e.g., ap-south-1)
- knowledgeBaseId — ID of the registered knowledge base in Bedrock
- modelArn — model or inference profile ARN (e.g., nova-lite inference profile)
- Lambda IAM role — attach Bedrock call permissions and any other required permissions

Production considerations
-------------------------
Security
- Do not commit secrets or API URLs to source control.
- Use Streamlit Secrets for frontend and AWS Secrets Manager or Lambda environment variables backed by an encrypted store for backend secrets.
- Use authentication on API Gateway for production (Cognito / Lambda authorizer / API Keys) to prevent unauthorized usage.

Cost control & rate limiting
- Bedrock calls incur cost — monitor usage and set budgets/alerts.
- Rate-limit or require authentication to prevent abuse.

Observability & reliability
- Enable CloudWatch logs and structured logging.
- Consider X-Ray tracing between API Gateway, Lambda, and Bedrock.
- Add CloudWatch alarms for errors and unexpected cost changes.

Scalability
- Use Lambda concurrency controls if needed.
- Cache high-frequency/repetitive answers (DynamoDB or in-memory cache) to reduce repeated Bedrock calls.

Privacy & compliance
- If storing user queries or personal data, document retention and apply encryption/purging policies.

Troubleshooting
---------------
- "Failed to connect to API" (frontend): verify API_URL, API Gateway deployment and stage, and CORS config.
- Lambda 500 / ClientError: check CloudWatch logs and error messages (common causes: invalid modelArn, region mismatch, insufficient IAM permissions, wrong knowledgeBaseId).
- Missing "response" field: ensure Lambda returns JSON with the "response" key.

Next steps / improvements
-------------------------
- Add IaC (SAM / CDK / Terraform) to provision Lambda, API Gateway, IAM roles.
- Add an ingestion pipeline to index IMDB dataset into your vector store and automate registration with Bedrock.
- Persist session state in DynamoDB for long-lived conversations.
- Add authentication and rate limiting for production readiness.
- Add streaming / partial responses (if supported) to improve UX and perceived latency.
- Instrument monitoring dashboards and cost alerts.

Repository files
----------------
- RAG_Chatbot/app.py — Streamlit UI (frontend).
- RAG_Chatbot/requirements.txt — pinned dependencies for frontend.

License
-------
MIT

Acknowledgements
----------------
Built as a production-capable example to demonstrate combining retrieval and generation using Amazon Bedrock with a simple Streamlit frontend. Replace placeholders (knowledgeBaseId, modelArn, API URL) with your deployed values before production use.