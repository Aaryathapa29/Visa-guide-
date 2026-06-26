# Document Parser v2 — LanguageTool + spaCy + AI (hybrid)

## Why this version
- LanguageTool = free, rule-based grammar/spelling/punctuation engine (self-hosted, no per-request cost)
- spaCy = free, fast checks for visa-specific structure (dates, money, countries)
- AI (GPT-4o-mini) = only used for tone + "does this sound convincing to a visa officer" — the one thing rule-based tools can't judge

This way you only pay for AI calls on the part AI is actually good at, and get
real grammar-rule accuracy (not an LLM guessing) for the rest.

## Step-by-step setup

### 1. Install Docker Desktop (if you don't have it)
https://www.docker.com/products/docker-desktop/

### 2. Start your own free LanguageTool grammar server
```bash
cd document_parser_v2
docker compose up -d
```
Check it's running: open http://localhost:8010 in your browser — you should see a LanguageTool page.

### 3. Set up the Python backend
```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env
```
Open `.env` and paste your OpenAI key (only needed for the tone/visa-persuasiveness part).

### 4. Run the API
```bash
uvicorn main:app --reload --port 8001
```

### 5. Test it
```
GET http://localhost:8001/api/v1/analyze/demo
```
or open http://localhost:8001/docs for the interactive Swagger UI.

## Folder structure
```
document_parser_v2/
├── docker-compose.yml      ← starts your own LanguageTool server
├── main.py
├── requirements.txt
├── .env.example
└── app/
    ├── schemas.py
    ├── routers/
    │   └── documents.py    ← combines LanguageTool + spaCy + AI
    └── services/
        ├── extractor.py        ← PDF/DOCX/TXT text extraction (unchanged)
        ├── nlp_processor.py    ← spaCy structure checks (unchanged)
        ├── grammar_checker.py  ← NEW: calls LanguageTool
        └── ai_analyzer.py      ← CHANGED: tone + visa issues only, no grammar
```

## Frontend
No changes needed — same response shape (`grammar_errors`, `visa_checklist`,
`tone_analysis`, etc.) as before, so your existing `lib/analyzeDocument.ts` and
all the components you already built keep working as-is.

## If you don't want to use Docker
You can point `LT_API_URL` in `.env` to the public LanguageTool API instead:
```
LT_API_URL=https://api.languagetool.org/v2/check
```
This skips Docker entirely but is rate-limited (~20 requests/minute, 20k
characters per request) — fine for a college project demo, not for real traffic.
