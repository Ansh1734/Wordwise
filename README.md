
# WordWise

WordWise is an English-learning app for vocabulary, word structure, grammar, and speaking practice. The frontend is built with React, TypeScript, and Vite; its optional NLP and speech-analysis API is built with FastAPI.

## Run the frontend

Requirements: Node.js 18 or newer.

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Set the optional Supabase and Gemini values in `.env` to enable the features that use those services. Values prefixed with `VITE_` are included in browser code; never put private or service-role credentials there.

## Run the backend

The backend is optional for browsing the app, but is used for local speech analysis.

```powershell
Set-Location backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `JWT_SECRET` in `backend\.env`, then start the API:

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The frontend expects the API at `http://localhost:8000/api/v1` by default. Speech models download on first use and are stored under `backend/models_cache`; this cache is intentionally excluded from Git.

## Recent updates

- Pronunciation practice records microphone audio, submits it to the speech-analysis backend, and handles recording, permission, and analysis errors without showing fabricated scores.
- Local pronunciation analysis uses optimized Whisper transcription settings and handles silence explicitly.
- Word decomposition has stronger offline morphology fallbacks for common words and spelling changes.
- Gemini pronunciation feedback reports missing or rejected API keys with actionable setup guidance.
- Added frontend and backend tests for these flows.

Run frontend checks with `npm test` and `npm run lint`. Run backend tests from `backend` with `python -m pytest`.
