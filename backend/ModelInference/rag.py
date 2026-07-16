"""
rag.py — RAG engine for Visa Guide Chatbot
==========================================
Embeddings: sentence-transformers (FREE, runs locally, no API key)
Vector DB:  ChromaDB (FREE, stores on your hard drive)
LLM:        Groq (FREE tier) — used in app.py

Pipeline:
  Documents (PDF / Markdown / TXT) → extract text → chunk → embed locally
  → store in ChromaDB → retrieve top-K → build a numbered, cited context.

Up-to-date syncing:
  On startup the engine hashes every file in data/ and re-ingests only the
  files that are new or changed (see sync_documents). This keeps the vector
  store current whenever you add/edit a document.
"""

import os
import re
import json
import hashlib
from pathlib import Path

from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings
from logger import logger

logger.info("Generating embeddings...")
logger.info("Searching ChromaDB...")
logger.info("Calling Groq...")

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR      = Path(__file__).parent
DATA_DIR      = BASE_DIR / "data"
CHROMA_DIR    = BASE_DIR / "chroma_db"
MANIFEST_PATH = CHROMA_DIR / "ingest_manifest.json"

# ── Settings ──────────────────────────────────────────────────────────────────
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
COLLECTION_NAME = "visa_docs"
CHUNK_SIZE      = 800
CHUNK_OVERLAP   = 150
TOP_K           = 8
# Greetings / small talk / off-topic messages score ~0.04-0.21 against the visa
# docs, while real visa questions score ~0.55-0.75, so 0.35 cleanly separates them.
RELEVANCE_THRESHOLD = 0.35
SUPPORTED_EXTS  = {".pdf", ".md", ".markdown", ".txt"}

# Official government websites, surfaced in citations
OFFICIAL_URLS = {
    "USA":       "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html",
    "Australia": "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500",
    "Canada":    "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html",
}

# Known documents → (country, human-friendly title).
# Any file in data/ not listed here is still ingested; country/title are inferred.
DOC_REGISTRY = {
    "usa_f1_student_visa.md":   ("USA",       "USA F-1 Student Visa Guide (2026)"),
    "australia_subclass_500.md":("Australia", "Australia Subclass 500 Guide (2026)"),
    "canada_study_permit.md":   ("Canada",    "Canada Study Permit Guide (2026)"),
    "usa_visa.pdf":             ("USA",       "USA F-1 Visa Guide"),
    "australia_visa.pdf":       ("Australia", "Australia Student Visa Guide"),
    "canada_visa.pdf":          ("Canada",    "Canada Study Permit Guide"),
}

# Keywords to detect which country a question is about
COUNTRY_KEYWORDS = {
    "USA":       ["usa", "united states", "america", "american", "f-1", "f1", "m-1", "sevis",
                  "i-20", "ds-160", "opt", "cpt", "stem", "uscis"],
    "Australia": ["australia", "australian", "subclass 500", "oshc", "gte", "genuine student",
                  "coe", "cricos", "immiaccount"],
    "Canada":    ["canada", "canadian", "study permit", "dli", "gic", "pgwp", "ircc", "pal",
                  "attestation", "quebec"],
}

# ── Load embedding model once at module level ─────────────────────────────────
print("[rag] Loading embedding model (sentence-transformers)...")
embedder = SentenceTransformer(EMBEDDING_MODEL)
print("[rag] Embedding model ready ✓")


# ── ChromaDB setup ────────────────────────────────────────────────────────────
def get_chroma_collection():
    client = chromadb.PersistentClient(
        path=str(CHROMA_DIR),
        settings=Settings(anonymized_telemetry=False),
    )
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
        embedding_function=None,
    )


# ── Document metadata helpers ─────────────────────────────────────────────────
def country_for(filename: str) -> str:
    if filename in DOC_REGISTRY:
        return DOC_REGISTRY[filename][0]
    stem = filename.lower()
    for country, keywords in COUNTRY_KEYWORDS.items():
        if any(k in stem for k in keywords) or country.lower() in stem:
            return country
    return "General"


def title_for(filename: str) -> str:
    if filename in DOC_REGISTRY:
        return DOC_REGISTRY[filename][1]
    return Path(filename).stem.replace("_", " ").replace("-", " ").title()


# ── Text helpers ──────────────────────────────────────────────────────────────
def extract_text(path: Path) -> str:
    """Pull text out of a document (PDF, Markdown, or plain text)."""
    ext = path.suffix.lower()
    if ext == ".pdf":
        reader = PdfReader(str(path))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    if ext in {".md", ".markdown", ".txt"}:
        return path.read_text(encoding="utf-8", errors="ignore")
    raise ValueError(f"Unsupported file type: {ext}")


# Backwards-compatible alias
def extract_text_from_pdf(path: Path) -> str:
    return extract_text(path)


def chunk_text(text: str) -> list[str]:
    """Split text into overlapping ~800-char chunks, breaking at sentence ends."""
    text = " ".join(text.split())
    if not text:
        return []

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + CHUNK_SIZE, len(text))
        if end < len(text):
            last_period = text.rfind(". ", start, end)
            if last_period > start + 200:
                end = last_period + 1
        chunks.append(text[start:end].strip())
        start = end - CHUNK_OVERLAP if end - CHUNK_OVERLAP > start else end

    return [c for c in chunks if c]


def embed(texts: list[str]) -> list[list[float]]:
    """Turn a list of text strings into embedding vectors (locally, no API)."""
    vectors = embedder.encode(texts, convert_to_numpy=True)
    return vectors.tolist()


def chunk_id(source: str, index: int) -> str:
    return hashlib.md5(f"{source}:{index}".encode()).hexdigest()


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


# ── Ingest pipeline ───────────────────────────────────────────────────────────
def ingest_document(path: Path, country: str, collection, source_name: str | None = None) -> int:
    """
    Extract → chunk → embed locally → upsert into ChromaDB.
    `source_name` is the logical document name recorded in metadata/citations
    (uploads pass the original filename since the file on disk is temporary).
    Returns how many chunks were stored.
    """
    name = source_name or path.name
    print(f"\n[rag] === Ingesting: {name} ({country}) ===")

    raw_text = extract_text(path)
    if not raw_text.strip():
        print(f"[rag] Warning: no text found in {name}")
        return 0
    print(f"[rag] Extracted {len(raw_text)} characters")

    chunks = chunk_text(raw_text)
    print(f"[rag] Split into {len(chunks)} chunks")

    embeddings = embed(chunks)
    print(f"[rag] Generated {len(embeddings)} embeddings locally")

    title = title_for(name)
    url   = OFFICIAL_URLS.get(country, "")
    ids       = [chunk_id(name, i) for i in range(len(chunks))]
    metadatas = [
        {"country": country, "source": name, "title": title, "url": url, "chunk_index": i}
        for i in range(len(chunks))
    ]
    collection.upsert(ids=ids, embeddings=embeddings, documents=chunks, metadatas=metadatas)
    print("[rag] Stored in ChromaDB ✓")
    return len(chunks)


# Backwards-compatible alias
def ingest_pdf(pdf_path: Path, country: str, collection) -> int:
    return ingest_document(pdf_path, country, collection)


# ── Manifest-based syncing ────────────────────────────────────────────────────
def _load_manifest() -> dict:
    if MANIFEST_PATH.exists():
        try:
            return json.loads(MANIFEST_PATH.read_text())
        except Exception:
            return {}
    return {}


def _save_manifest(manifest: dict) -> None:
    try:
        MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
        MANIFEST_PATH.write_text(json.dumps(manifest, indent=2))
    except Exception as e:
        print(f"[rag] Could not write manifest: {e}")


def sync_documents(collection) -> dict:
    """Re-ingest new/changed files in data/, remove chunks for deleted files."""
    manifest = _load_manifest()
    disk_files = {
        p.name: p for p in sorted(DATA_DIR.glob("*"))
        if p.is_file() and p.suffix.lower() in SUPPORTED_EXTS
    }

    added, updated, removed, unchanged = [], [], [], []

    for name, path in disk_files.items():
        h = file_hash(path)
        if manifest.get(name) == h:
            unchanged.append(name)
            continue
        country = country_for(name)
        if name in manifest:
            try:
                collection.delete(where={"source": name})
            except Exception:
                pass
            updated.append(name)
        else:
            added.append(name)
        ingest_document(path, country, collection)
        manifest[name] = h

    for name in list(manifest.keys()):
        if name not in disk_files:
            try:
                collection.delete(where={"source": name})
            except Exception:
                pass
            manifest.pop(name, None)
            removed.append(name)

    _save_manifest(manifest)
    summary = {"added": added, "updated": updated, "removed": removed, "unchanged": unchanged}
    print(f"[rag] Sync complete: {summary}")
    return summary


# ── Country detection ─────────────────────────────────────────────────────────
def detect_country(message: str) -> str | None:
    """Detect which country the user is asking about."""
    msg = message.lower()
    for country, keywords in COUNTRY_KEYWORDS.items():
        if any(k in msg for k in keywords):
            return country
    return None


# ── Small-talk detection ──────────────────────────────────────────────────────
SMALLTALK_PHRASES = {
    "hi", "hii", "hiya", "hey", "heya", "hello", "helo", "yo", "sup", "wassup",
    "hi there", "hello there", "hey there", "good morning", "good afternoon",
    "good evening", "good day", "greetings", "howdy",
    "how are you", "how are you doing", "how r u", "how are u", "hows it going",
    "how is it going", "whats up", "what is up", "how do you do",
    "thanks", "thank you", "thankyou", "thx", "ty", "cheers", "much appreciated",
    "thanks a lot", "thank you so much", "great thanks", "ok thanks", "okay thanks",
    "ok", "okay", "kk", "cool", "nice", "great", "awesome", "got it", "alright",
    "bye", "goodbye", "good night", "goodnight", "see you", "see ya", "take care",
    "who are you", "what are you", "what can you do", "what do you do",
    "what is this", "help", "who made you",
}


def is_smalltalk(message: str) -> bool:
    """True for greetings / thanks / farewells / meta questions (no retrieval)."""
    m = re.sub(r"[^\w\s]", " ", message.lower())
    m = re.sub(r"\s+", " ", m).strip()
    if not m:
        return True
    if detect_country(message):
        return False
    if any(w in m for w in ("visa", "study", "student", "permit", "passport",
                            "document", "fee", "work", "apply", "sevis")):
        return False
    words = m.split()
    if m in SMALLTALK_PHRASES:
        return True
    if len(words) <= 5 and any(m == p or m.startswith(p + " ") or m.endswith(" " + p)
                               or (" " + p + " ") in (" " + m + " ")
                               for p in SMALLTALK_PHRASES):
        return True
    return False


# ── RAGEngine — the main class used by app.py ─────────────────────────────────
class RAGEngine:
    """Manages the ChromaDB collection (retrieval + document ingest)."""

    def __init__(self):
        print("RAG 1 - Opening ChromaDB")
        self.collection = get_chroma_collection()
        print("RAG 2 - ChromaDB opened")
        print("RAG 3 - Syncing documents (add/update/remove as needed)")
        sync_documents(self.collection)
        count = self.collection.count()
        print(f"RAG 4 - Collection ready with {count} chunks")
        print("RAG 5 - RAG initialization complete")

    def retrieve(self, query: str) -> list[dict]:
        """Return sufficiently-relevant chunks (text, country, source, title, url, score)."""
        total = self.collection.count()
        if total == 0:
            return []

        query_embedding = embed([query])[0]
        country = detect_country(query)

        def _query(where):
            res = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=min(TOP_K, total),
                where=where,
                include=["documents", "metadatas", "distances"],
            )
            out = []
            for doc, meta, dist in zip(
                res["documents"][0], res["metadatas"][0], res["distances"][0]
            ):
                out.append({
                    "text":    doc,
                    "country": meta.get("country", "Unknown"),
                    "source":  meta.get("source", "unknown"),
                    "title":   meta.get("title", meta.get("source", "Document")),
                    "url":     meta.get("url", ""),
                    "score":   round(1 - dist, 4),
                })
            return out

        results = _query({"country": {"$eq": country}} if country else None)
        if country and not results:
            results = _query(None)
        return [r for r in results if r["score"] >= RELEVANCE_THRESHOLD]

    def build_context(self, query: str) -> tuple[str, list[dict]]:
        """
        Build numbered context for the LLM and the matching source list.
        Greetings / small talk skip retrieval (no context, no sources).
        """
        if is_smalltalk(query):
            return "", []

        results = self.retrieve(query)
        if not results:
            return "No relevant information found in the knowledge base.", []

        context_parts, sources = [], []
        for i, r in enumerate(results, start=1):
            label = f"{r['title']} ({r['country']})"
            context_parts.append(f"[{i}] Source: {label}\n{r['text']}")
            snippet = r["text"][:220].rsplit(" ", 1)[0] + "..." if len(r["text"]) > 220 else r["text"]
            snippet = snippet.replace("—", "-").replace("–", "-")
            sources.append({
                "n":       i,
                "title":   r["title"],
                "source":  r["source"],
                "country": r["country"],
                "url":     r["url"],
                "score":   r["score"],
                "snippet": snippet,
            })

        return "\n\n---\n\n".join(context_parts), sources

    def ingest_uploaded_document(self, path: Path, country: str, original_name: str | None = None) -> int:
        """Uploaded docs live only in ChromaDB and are NOT tracked in the sync manifest."""
        return ingest_document(path, country, self.collection, source_name=original_name or path.name)

    def ingest_uploaded_pdf(self, pdf_path: Path, country: str, original_name: str | None = None) -> int:
        return self.ingest_uploaded_document(pdf_path, country, original_name)

    def stats(self) -> dict:
        """How many chunks are stored, which countries, and which documents."""
        count = self.collection.count()
        if count == 0:
            return {"total_chunks": 0, "countries": [], "documents": []}
        sample    = self.collection.get(limit=count, include=["metadatas"])
        countries = sorted({m.get("country", "?") for m in sample["metadatas"]})
        documents = sorted({m.get("source", "?") for m in sample["metadatas"]})
        return {"total_chunks": count, "countries": countries, "documents": documents}
