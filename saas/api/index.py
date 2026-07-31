from fastapi import FastAPI, Depends
from fastapi.responses import StreamingResponse
import google.generativeai as genai
import os
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials


app = FastAPI()

clerk_config = ClerkConfig(jwks_url=os.getenv("CLERK_JWKS_URL"))
clerk_guard = ClerkHTTPBearer(clerk_config)

genai.configure(
    api_key=os.environ.get("GEMINI_API_KEY")
)


model = genai.GenerativeModel(
    "gemini-3.1-flash-lite"
)


@app.get("/api")
def idea(creds: HTTPAuthorizationCredentials = Depends(clerk_guard)):
    user_id = creds.decoded["sub"]  # User ID from JWT - available for future use
#def idea():

    def stream_response():
        response = model.generate_content(
            "You are Internet search expert.Search all major flight booking websites and Reply with 5 discount coupons applicable for Indian domestic Flight booking with details , formatted with new lines,headings, sub-headings and bullet points.Don't hallucinate if you don't find a match",
            stream=True
        )
        for chunk in response:
            if chunk.text:
                # Encode newlines so they survive SSE transport (a raw \n would break the data field)
                encoded = chunk.text.replace("\n", "\\n")
                yield f"data: {encoded}\n\n"

    return StreamingResponse(stream_response(), media_type="text/event-stream")
