# RAG_Chatbot

A simple Retrieval-Augmented Generation (RAG) chatbot that answers questions about top IMDB movies.

Purpose
-------
Give a high-level, easy-to-understand example of how a small chat app can combine a UI with a backend that performs retrieval from a knowledge base and generation via Bedrock.

Architecture flow (high level)
------------------------------
Streamlit app (client)  ->  API Gateway (HTTPS)  ->  AWS Lambda (Python)  ->  Bedrock Agent Runtime (retrieve_and_generate)
                                                                                  ↳ knowledge base / vector store (retrieval)

Short description of components
-------------------------------
- Streamlit app (RAG_Chatbot/app.py)
  - Chat UI. Sends POST {"query": "..."} to the API endpoint and shows replies.

- API Gateway
  - Exposes a POST /chat endpoint and forwards requests to Lambda. Enable CORS if needed.

- AWS Lambda
  - Receives the request, builds the Bedrock `retrieve_and_generate` call, and returns the generated text, session id, and citations.
  - Uses boto3 client: `boto3.client('bedrock-agent-runtime', region_name='ap-south-1')` (example).

- Bedrock Agent Runtime
  - Does retrieval from the registered knowledge base and runs the model to generate the answer.

How it works (step-by-step)
---------------------------
1. User types a question in the Streamlit UI and hits send.
2. The Streamlit app posts JSON {"query": "..."} to the API Gateway endpoint.
3. API Gateway invokes the Lambda function with the request body.
4. Lambda calls Bedrock Agent Runtime `retrieve_and_generate` with:
   - input: { text: user query }
   - retrieveAndGenerateConfiguration: type = KNOWLEDGE_BASE, knowledgeBaseConfiguration with `knowledgeBaseId` and `modelArn`.
5. Bedrock retrieves relevant documents from the KB, runs the model, and returns a generated response plus citations and a session id.
6. Lambda returns a JSON response to the Streamlit app which displays it to the user.

Quick setup (front-end)
-----------------------
1. Create venv and install:

   python -m venv venv
   source venv/bin/activate   # macOS/Linux
   venv\Scripts\activate    # Windows
   pip install streamlit requests

2. Edit `RAG_Chatbot/app.py` and set `API_URL` to your deployed API Gateway URL.
3. Run locally:

   streamlit run RAG_Chatbot/app.py

Quick deploy notes (backend)
----------------------------
- Create a Lambda (Python 3.9/3.10/3.11) and paste the provided handler code.
- Lambda needs an IAM role with permissions to call Bedrock and any other used services (S3, KMS, Secrets Manager).
- Configure Lambda region and model ARNs correctly (example uses `ap-south-1`).
- Create an API Gateway POST /chat route that calls Lambda and enable CORS.

Important config values
-----------------------
- API_URL in app.py — the API Gateway endpoint
- region_name when creating `bedrock-agent-runtime` client (example: ap-south-1)
- knowledgeBaseId — the registered knowledge base id used for retrieval
- modelArn — the Bedrock model or inference profile ARN to use
- IAM role — Lambda should use least-privilege IAM permissions and no hard-coded credentials

Example request / response
--------------------------
Request:
POST /chat
Content-Type: application/json

{ "query": "Tell me about The Godfather" }

Response (200):
{
  "response": "The Godfather (1972) is...",
  "session_id": "<session-id>",
  "citations": [ ... ]
}

Troubleshooting (short)
-----------------------
- "Failed to connect to API": check API_URL and API Gateway deployment.
- 500 errors: check CloudWatch logs for Lambda and inspect AWS ClientError messages (invalid modelArn, permissions, or region).
- No response field: ensure Lambda returns JSON with `response` key.
- CORS issues: enable CORS on API Gateway.

Next steps / improvements
------------------------
- Add requirements.txt and deployment scripts (SAM/CDK/Terraform).
- Add indexing scripts to populate the knowledge base (vector DB) with the IMDB dataset.
- Add authentication to the API Gateway (API keys, Cognito, or IAM).

License
-------
MIT
