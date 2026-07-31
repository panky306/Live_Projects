# RAG_Chatbot

A simple Retrieval-Augmented Generation (RAG) chatbot demo that answers questions about movies (top IMDB) via a Streamlit front-end and an AWS Lambda backend that calls Bedrock Agent Runtime (retrieve-and-generate).

This README explains the architecture, how to run the Streamlit app (app.py), how the Lambda handler works, required configuration, and common troubleshooting tips.

---

## Project structure

- RAG_Chatbot/
  - app.py                # Streamlit front-end (client)
  - README.md             # This file
  - (other assets you may add: requirements.txt, static files)

Files referenced:
- app.py: streamlit UI that sends POST requests to an API Gateway endpoint.
- Lambda code (provided separately in this repo or console): Python handler that calls Bedrock Agent Runtime's retrieve_and_generate API.

---

## Overview / Purpose

A minimal RAG chatbot that:
- Accepts a user query in a Streamlit UI (app.py).
- Sends the query to an API Gateway endpoint that invokes an AWS Lambda function.
- Lambda calls Bedrock Agent Runtime `retrieve_and_generate` with a KNOWLEDGE_BASE configuration to return an answer plus citations and session handling.

This pattern keeps the UI simple and stateless while letting the Lambda integrate with Bedrock and a knowledge base (vector store) to perform retrieval + generation.

---

## Architecture

1. Streamlit client (app.py)
   - Renders a chat interface and stores chat history in session state.
   - Sends POST requests to an API endpoint (API Gateway) with payload {"query": "...", "session_id": "..."}.

2. API Gateway
   - Exposes a secure HTTPS endpoint for the Streamlit app.
   - Invokes the Lambda function.

3. AWS Lambda (Python)
   - Uses boto3 `bedrock-agent-runtime` client and calls `retrieve_and_generate`.
   - Passes 'retrieveAndGenerateConfiguration' with type `KNOWLEDGE_BASE` and `knowledgeBaseConfiguration` including `knowledgeBaseId` and `modelArn`.
   - Returns generated text, session_id (if provided/returned), and citations.

4. Bedrock Agent Runtime
   - Orchestrates retrieval from the knowledge base and runs the model to generate the final answer.

Optional: An external vector database/knowledge base (not included here) that Bedrock can access via the `knowledgeBaseId`.

---

## Key configuration in code

Streamlit (RAG_Chatbot/app.py)
- API_URL (line 9): Replace with your API Gateway endpoint.
- Requires: streamlit, requests

Lambda (snippet provided)
- Region: `ap-south-1` (set in boto3 client creation)
- Bedrock Agent Runtime client: `boto3.client('bedrock-agent-runtime', region_name='ap-south-1')`
- Example knowledgeBaseConfiguration (replace `knowledgeBaseId` and `modelArn` with your values):
  - knowledgeBaseId: `xyz` (placeholder)
  - modelArn: `arn:aws:bedrock:ap-south-1:933428634209:inference-profile/apac.amazon.nova-lite-v1:0`
- The Lambda code handles optional `session_id` and returns `response`, `session_id`, and `citations`.

Notes:
- Ensure the model ARN and knowledge base id are correct for your AWS account and region.
- The example modelArn shown in code references an inference-profile with account id `933428634209`. Confirm whether you should use a shared inference profile or your own resource ARN.

---

## Running locally (Streamlit front-end)

1. Create a Python venv and install dependencies:

```
python -m venv venv
source venv/bin/activate    # macOS/Linux
venv\Scripts\activate     # Windows
pip install streamlit requests
```

2. Update API_URL in app.py to point to your deployed API Gateway endpoint.

3. Start the app:

```
streamlit run RAG_Chatbot/app.py
```

4. Use the chat input to send questions. The app will POST JSON {"query": "<text>"} to the API and show the assistant reply.

---

## Deploying the Lambda (high level)

1. Create an AWS Lambda function (Python 3.9/3.10/3.11).
2. Give the Lambda an IAM role with permissions to call Bedrock agent runtime APIs. Example managed policies or custom policy should allow the relevant Bedrock actions and any KMS or other services your knowledge base uses.
3. Use the provided lambda handler code (the code you supplied) as the function body.
4. Set the Lambda timeout and memory according to expected latency for Bedrock calls (e.g., timeout >= 30s).
5. Create an API Gateway (HTTP API or REST API) route that accepts POST and forwards to Lambda. Enable CORS if the Streamlit app is served from a browser origin.
6. Test the endpoint with curl or Postman.

---

## Example request/response

Request (from app.py):

POST /chat
Content-Type: application/json

{
  "query": "Tell me about The Godfather",
  "session_id": null
}

Successful response (200):

{
  "response": "The Godfather (1972) is...",
  "session_id": "<session-id-from-bedrock>",
  "citations": [ ... ]
}

Error responses include:
- 400 Missing required field
- 500 Bedrock / unexpected error

---

## Environment & IAM notes

- IAM role for Lambda must allow Bedrock access (and any other resources like S3/KMS/Secrets Manager if used).
- If your knowledge base is external (S3, OpenSearch, vector DB), ensure network access (VPC, NAT) and that Bedrock can reach the store (or that the knowledge base is registered with Bedrock).
- Keep secrets (API keys, DB credentials) out of code and use environment variables or AWS Secrets Manager.

---

## Troubleshooting

- "Failed to connect to API": Check API_URL in app.py and that API Gateway is deployed and accessible.
- 500 ClientError from AWS calls: Inspect Lambda logs (CloudWatch) for the error code and message. Common issues: invalid modelArn, insufficient IAM permissions, incorrect region.
- Missing or invalid `knowledgeBaseId`: Bedrock will fail retrieval; ensure the KB exists and is registered.
- Timeout: increase Lambda timeout and ensure Bedrock calls do not exceed it.
- CORS errors: Enable CORS for the API Gateway route if the Streamlit app is served from a browser origin.

Lambda-specific tips (based on the provided code):
- Use the correct AWS region for Bedrock and the inference profile (ap-south-1 in the code example).
- Provide `sessionId` only when you have a valid session string; the lambda already checks for this.
- Model ARNs may differ by account and model—verify the correct ARN (the sample uses an inference-profile ARN).

---

## Security

- Do not commit secret keys to the repo.
- Apply least privilege to the Lambda IAM role.
- Use HTTPS endpoints (API Gateway) and consider authentication (API keys, IAM auth, Cognito) before exposing the endpoint publicly.

---

## Next steps / Enhancements

- Add a requirements.txt and Dockerfile or deployment scripts.
- Add unit tests for the Lambda handler and local mocking for Bedrock responses.
- Add a vector store and scripts for indexing the IMDB dataset into the knowledge base used by Bedrock.
- Add authentication to the API Gateway and/or Streamlit app.

---

## License

MIT
