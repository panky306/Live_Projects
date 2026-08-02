# DisCouponGen — Discount Coupon Generator (SaaS)

# Live link: https://genaiapp-psi.vercel.app/

DisCouponGen is a small SaaS demo that generates curated discount coupons for Indian domestic flight bookings using Google Gemini (via google-generativeai). The frontend is a Next.js (Pages Router) app and the backend is a minimal FastAPI service that streams model output to the client.

🚀 Quick summary
- Authenticated users (via Clerk) can request AI-generated discount coupons.
- The frontend opens a server-sent-events (SSE) stream to the FastAPI backend which proxies streaming responses from the Gemini model.
- Streaming reduces perceived latency by rendering markdown as chunks arrive.

## Tech stack
- Languages: TypeScript (frontend), Python (backend), CSS (Tailwind)
- Frameworks / runtimes:
  - Frontend: Next.js (Pages Router; Next v16)
  - Backend: FastAPI served with Uvicorn
- Notable libraries:
  - Clerk (authentication & subscription protection) — `@clerk/nextjs`
  - Google Generative AI (`google-generativeai`) — Gemini model integration
  - fetch-event-source (`@microsoft/fetch-event-source`) — SSE client
  - React Markdown + remark plugins for rendering streamed markdown
  - Tailwind CSS for styling

## What it does (short)
The Next.js UI authenticates users via Clerk and (for premium users) lets them request AI-generated discount coupons. The frontend opens a server-sent-events (SSE) stream to a FastAPI endpoint that drives the Gemini model in streaming mode and forwards model output to the client.

## Repo layout (relevant files in `saas/`)
```
saas/
  pages/
    index.tsx         # Landing page & sign-in UI
    product.tsx       # Protected app page; SSE consumer, renders markdown
    _app.tsx          # ClerkProvider wrapper
    _document.tsx     # Document (title/meta)
  api/
    index.py          # FastAPI app: SSE endpoint that calls Gemini (google-generativeai)
  styles/
    globals.css       # Tailwind + markdown styles
  package.json        # Frontend deps & scripts
  requirements.txt    # Python backend dependencies
  next.config.ts
  middleware.ts       # Clerk middleware / route protection
  postcss.config.mjs
  tsconfig.json
  README.md (this file)
```

## How it fits together
- The frontend (Next) handles auth and subscription gating via Clerk. When a signed-in, authorized user visits `/product`, the UI requests a JWT from Clerk and calls the SSE endpoint.
- The backend (FastAPI) validates the Clerk JWT (using fastapi-clerk-auth) and streams content from the Google Generative AI model to the client using SSE.
- The frontend accumulates SSE chunks and renders them as Markdown using `react-markdown`.

## Design and architecture details

High-level components:
- Frontend (Next.js Pages)
  - Responsible for user-facing UI, authentication flow with Clerk, subscription gating using Clerk's Protect component, and consuming SSE to render streaming content.
  - Key files: `pages/index.tsx`, `pages/product.tsx`, `pages/_app.tsx`, `middleware.ts`.
- Authentication & Authorization (Clerk)
  - Clerk provides sign-in, session management, and plan/entitlement checks on the frontend via `@clerk/nextjs`.
  - Middleware (`middleware.ts`) applies route protection on supported routes.
- Backend (FastAPI + Uvicorn)
  - Exposes a single SSE endpoint (`/api`) implemented in `api/index.py` which expects a validated Clerk JWT and then drives the Gemini model to generate content.
  - Uses `fastapi-clerk-auth` to validate the incoming JWT via the Clerk JWKS URL.
- AI Model (Google Gemini)
  - Invoked via `google-generativeai` in streaming mode to produce incremental text. The FastAPI endpoint yields SSE chunks as the model produces text.
- SSE transport
  - The server yields lines prefixed with `data: ` and the frontend uses `fetchEventSource` (from `@microsoft/fetch-event-source`) to connect and incrementally append content into a buffer for rendering.
- Rendering
  - The frontend uses `react-markdown` with `remark-gfm` and `remark-breaks` to render streaming markdown into formatted HTML.

## Data & control flow (request lifecycle)
1. User signs in on the frontend via Clerk and navigates to `/product`.
2. Frontend obtains a JWT via `getToken()` from Clerk.
3. Frontend opens an SSE connection to `/api` including Authorization: `Bearer <jwt>` header.
4. FastAPI endpoint validates the JWT and, if valid, calls Gemini in stream mode.
5. FastAPI yields incoming model text as SSE `data:` messages to the client.
6. The frontend appends chunks, decodes escaped newlines, and re-renders the accumulated markdown to the user.

## Scalability and operational notes
- The streaming approach reduces client-perceived latency (users see output incrementally) but increases connection-time state on the server; consider scaling workers or using an async server (Uvicorn with multiple workers or a process manager) if you expect many concurrent streams.
- Model API usage is the primary cost driver; consider batching, caching, or prompt engineering to limit tokens.
- The backend currently assumes a single `/api` endpoint; for production, split responsibilities (auth, usage accounting, rate limiting) into separate services or middleware.

## How to run it (development)
The shortest path from a fresh clone to a running development environment.

Prerequisites:
- Node 18+ and npm/yarn/pnpm
- Python 3.10+
- A Clerk project and Google Gemini API key (GEMINI_API_KEY) — set these in your environment when running locally

1) Clone and install
```bash
git clone https://github.com/panky306/Live_Projects.git
cd Live_Projects/saas
# Frontend deps
npm install
```

2) Backend (Python) — create venv and install
```bash
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

3) Required environment variables (example)
```bash
export GEMINI_API_KEY="sk-..."
export CLERK_JWKS_URL="https://clerk.example/.well-known/jwks.json"
```

4) Run the backend
From `saas/`:
```bash
uvicorn api.index:app --reload --host 0.0.0.0 --port 8000
```
This exposes the API endpoint at `http://localhost:8000/api`.

5) Run the frontend
From `saas/`:
```bash
npm run dev
```
Next runs on http://localhost:3000 by default.

Notes about local wiring:
- The frontend currently calls `/api` (a relative path) using SSE. In local development the frontend (port 3000) and backend (port 8000) are on different origins; either enable CORS and call the absolute backend URL from the frontend, or run a proxy during development.

## Vercel deployment (cloud)
Want to deploy the frontend quickly to Vercel and run the backend as a separate service (recommended for production)? Here's a straightforward approach.

A) Frontend on Vercel (recommended)
1. Push your repo to GitHub (it already is).
2. Go to https://vercel.com/new and import the repository `panky306/Live_Projects`.
3. During import, set the Project Path to `saas/` so Vercel builds the Next.js app inside that folder.
4. Environment variables (set these in Vercel Project Settings → Environment Variables):
   - GEMINI_API_KEY (if calling model from frontend — not recommended; prefer backend)
   - CLERK_FRONTEND_API (your Clerk frontend configuration values) — see Clerk docs
   - NEXT_PUBLIC_API_BASE_URL — set to the backend's public URL (see section B)
5. Build & Output Settings: Vercel automatically detects Next.js; use the default build command (`npm run build`) and output directory.
6. Deploy. The site will be available at `https://<your-vercel-project>.vercel.app`.


## *Feel free to suggest changes/enhancements -Pankaj*




