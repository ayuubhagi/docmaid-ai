# DocMaid

Upload a document, ask questions about it, and get answers that cite the passages they came from.

Live at https://docmaid-ai.vercel.app. You can ask the sample lease questions without signing up. The backend is on Render's free tier, so the first request after 15 idle minutes takes about a minute.

## Why I built it

I wanted to drop in a PDF, ask questions about it, and get answers I could check against the document. ChatGPT and similar tools would often answer confidently and be wrong, with no easy way to see where an answer came from. So every answer here shows the passages it was based on.

I built the first version in June 2026. It went live, 33 people signed up, and it broke three times in one week in late September. Those incidents are below, along with what I changed.

## How it works

When you upload a PDF, Word, Markdown or text file, a background task extracts the text, splits it into chunks of about 1,000 characters with 200 characters of overlap, and embeds each chunk locally with all-MiniLM-L6-v2. Chunk text goes into Postgres and vectors go into ChromaDB.

When you ask a question, the backend embeds it, takes the 5 closest chunks from your own documents, puts them in the prompt as numbered excerpts, and streams the model's answer back over Server-Sent Events. The answer cites excerpts as [1], [2] and so on.

React, TypeScript, Vite and Tailwind on Vercel. FastAPI, SQLAlchemy and Alembic on Render. Postgres on Neon. Groq for the model.

## Decisions

- Chunk text lives in Postgres, not only in Chroma. Render's free disk is wiped on every restart, so the Chroma index is disposable. Before a search, the backend rebuilds any missing vectors from the stored chunks.
- Embeddings run locally, so the LLM is the only per-use API and ingestion doesn't depend on another service.
- Streaming uses fetch instead of EventSource, because EventSource can't send an Authorization header. The frontend parses the SSE frames itself.
- Refresh tokens rotate on every use and are stored server-side. If an already-rotated token is used again, I treat it as stolen and revoke all of that user's sessions.
- Tokens are in localStorage. XSS can read them, which httpOnly cookies would prevent, but cookies would mean CSRF handling across two domains. Access tokens last 15 minutes and refresh tokens can be revoked.
- A demo LLM provider streams a canned answer through the real retrieval path, so local dev and CI need no API key.
- All users share one Chroma collection. Every chunk carries a user_id, and every query and delete filters on it.

## What broke

Sept 29: nobody could register or log in. The frontend had moved to docmaid-ai.vercel.app, but `CORS_ORIGINS` on Render still listed the old domain, so the browser blocked every API call. I added the new domain to the variable in the Render dashboard, then to `render.yaml` as well, so a Blueprint sync can't bring the old value back.

Sept 29: a rebuild pulled SQLAlchemy 2.1, which made psycopg 3 the default driver for `postgresql://` URLs. Only psycopg2 was installed, so the backend crashed on boot. I changed `DATABASE_URL` to start with `postgresql+psycopg2://`. The underlying problem is that dependencies aren't pinned yet.

Sept 30: every chat request failed with a 404 from Groq. The default model, `llama-3.3-70b-versatile`, had been retired for free accounts on Aug 16. I set `GROQ_MODEL` to a current model on Render. The code still has one hardcoded default and no fallback.

## Limitations

- Citations point at chunks, not pages.
- A PDF with no text layer fails with "No extractable text found". One that's mostly scanned pages gets indexed with whatever text it has, so questions about the scanned parts find nothing. There's no OCR.
- Indexing runs in the web process. If the server restarts mid-upload, the job is lost and the document is marked failed.
- The embedding model (about 79 MB) downloads on every cold start, so the first upload or question after a deploy takes 15 to 20 seconds longer.
- I haven't measured retrieval quality yet.
- Rate limits are in memory, which only works with one process.
- Stripe billing is in the code but not configured in production.

## Run it locally

```bash
docker compose up --build
```

The app is at http://localhost:3000 and the API docs at http://localhost:8000/docs. It uses the demo provider, so no keys are needed. For real answers, copy `.env.example` to `.env` and set `LLM_PROVIDER=groq` and `GROQ_API_KEY` (free at https://console.groq.com).

Backend tests run against SQLite, so they need no database or keys:

```bash
cd backend
pip install -r requirements-dev.txt
python -m pytest
ruff check app tests
```

Frontend typecheck and build:

```bash
cd frontend
npm ci
npm run build
```

Deployment is in [DEPLOYMENT.md](DEPLOYMENT.md).

## License

MIT, see [LICENSE](LICENSE).
