# Person B - Document parser work area

This folder is reserved for the document parser stream owned by Person B.

The live document parser implementation remains in the existing backend module:
- backend/document_parser_v2/

## Local setup

### 1. Install Docker Desktop (if you want Grammar API checks)
https://www.docker.com/products/docker-desktop/

### 2. Start the LanguageTool grammar server
```bash
cd backend/document_parser_v2
docker compose up -d
```
Check it is running by opening http://localhost:8010.

### 3. Set up the Python backend
```bash
cd backend/document_parser_v2
python -m pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env
```
Open `.env` and add your Gemini key if you want AI tone and visa analysis.

### 4. Run the API
```bash
cd backend/document_parser_v2
uvicorn main:app --reload --port 8002
```

### 5. Test it
```bash
GET http://localhost:8002/api/v1/analyze/demo
```
Or open http://localhost:8002/docs for the Swagger UI.

## Folder structure
```text
document_parser_v2/
├── docker-compose.yml
├── main.py
├── requirements.txt
├── .env.example
└── app/
    ├── schemas.py
    ├── routers/
    │   └── documents.py
    └── services/
        ├── extractor.py
        ├── nlp_processor.py
        ├── grammar_checker.py
        └── ai_analyzer.py
```

## Frontend
The frontend can continue to use the same response shape for grammar errors, visa checks, tone analysis, and strengths/improvements.

## If you do not want to use Docker
You can point `LT_API_URL` in `.env` to the public LanguageTool API instead:
```bash
LT_API_URL=https://api.languagetool.org/v2/check
```
This is rate-limited, so it is best for demos rather than heavy traffic.