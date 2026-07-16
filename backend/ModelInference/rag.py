"""
rag.py — RAG engine for Visa Guide Chatbot (College Project)
============================================================
Embeddings: sentence-transformers (FREE, runs locally, no API key)
Vector DB:  ChromaDB (FREE, stores on your hard drive)
LLM:        Groq (FREE tier) — used in app.py

Pipeline for ACCEPTANCE CRITERIA:
  Upload PDF → extract text → chunk → embed locally → store in ChromaDB
"""

import os
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
BASE_DIR   = Path(__file__).parent
DATA_DIR   = BASE_DIR / "data"
CHROMA_DIR = BASE_DIR / "chroma_db"

# ── Settings ──────────────────────────────────────────────────────────────────
# This model downloads once (~90MB), then runs locally forever — no API needed
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
COLLECTION_NAME = "visa_docs"
CHUNK_SIZE      = 800
CHUNK_OVERLAP   = 150
TOP_K           = 5

# Your 3 PDF files mapped to country names
COUNTRY_FILES = {
    "usa_visa.pdf":       "USA",
    "australia_visa.pdf": "Australia",
    "canada_visa.pdf":    "Canada",
}

# Keywords to detect which country a question is about
COUNTRY_KEYWORDS = {
    "USA":       ["usa", "united states", "america", "f-1", "f1", "sevis", "i-20"],
    "Australia": ["australia", "australian", "subclass 500", "oshc", "gte", "coe"],
    "Canada":    ["canada", "canadian", "study permit", "dli", "gic", "pgwp"],
}

# ── Load embedding model once at module level ─────────────────────────────────
# First run downloads the model. After that it's instant.
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
        embedding_function=None
    )
    


# ── Text helpers ──────────────────────────────────────────────────────────────
def extract_text_from_pdf(path: Path) -> str:
    """Pull all text out of a PDF file."""
    reader = PdfReader(str(path))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def chunk_text(text: str) -> list[str]:
    """
    Split text into overlapping chunks.
    Each chunk is ~800 characters, overlapping by 150 characters.
    Tries to break at sentence endings so chunks make sense.
    """
    text = " ".join(text.split())  # clean up whitespace
    if not text:
        return []

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + CHUNK_SIZE, len(text))
        # Try to break at a sentence boundary
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
    """Create a unique ID for each chunk (prevents duplicates on re-upload)."""
    return hashlib.md5(f"{source}:{index}".encode()).hexdigest()


# ── ACCEPTANCE CRITERIA: ingest pipeline ─────────────────────────────────────
def ingest_pdf(pdf_path: Path, country: str, collection) -> int:
    """
    Acceptance criteria — doc upload flow:
      1. Extract text from the PDF
      2. Split into chunks
      3. Generate embeddings locally (no API needed)
      4. Store everything in ChromaDB

    Returns how many chunks were stored.
    Running this twice on the same file is safe — it won't duplicate.
    """
    print(f"\n[rag] === Ingesting: {pdf_path.name} ({country}) ===")

    # Step 1: Extract
    raw_text = extract_text_from_pdf(pdf_path)
    if not raw_text.strip():
        print(f"[rag] Warning: no text found in {pdf_path.name}")
        return 0
    print(f"[rag] Extracted {len(raw_text)} characters")

    # Step 2: Chunk
    chunks = chunk_text(raw_text)
    print(f"[rag] Split into {len(chunks)} chunks")

    # Step 3: Embed (local, free)
    embeddings = embed(chunks)
    print(f"[rag] Generated {len(embeddings)} embeddings locally")

    # Step 4: Store in ChromaDB
    ids       = [chunk_id(pdf_path.name, i) for i in range(len(chunks))]
    metadatas = [
        {"country": country, "source": pdf_path.name, "chunk_index": i}
        for i in range(len(chunks))
    ]
    collection.upsert(ids=ids, embeddings=embeddings, documents=chunks, metadatas=metadatas)
    print(f"[rag] Stored in ChromaDB ✓")
    return len(chunks)


def ingest_all_default_pdfs(collection) -> int:
    """Ingest the 3 bundled PDFs. Runs automatically on first server startup."""
    total = 0
    for filename, country in COUNTRY_FILES.items():
        path = DATA_DIR / filename
        if path.exists():
            total += ingest_pdf(path, country, collection)
        else:
            print(f"[rag] {filename} not found in data/ folder — skipping.")
    return total


# ── Country detection ─────────────────────────────────────────────────────────
def detect_country(message: str) -> str | None:
    """Detect which country the user is asking about."""
    msg = message.lower()
    for country, keywords in COUNTRY_KEYWORDS.items():
        if any(k in msg for k in keywords):
            return country
    return None


# ── RAGEngine — the main class used by app.py ─────────────────────────────────

class RAGEngine:
    """
    Manages ChromaDB collection.
    Used for both:
      - Answering questions (retrieve relevant chunks → pass to Groq LLM)
      - Ingesting uploaded PDFs (acceptance criteria)
    """

    def __init__(self):
        print("RAG 1 - Opening ChromaDB")
        self.collection = get_chroma_collection()

        print("RAG 2 - ChromaDB opened")

        print("RAG 3 - About to count documents")

        count = self.collection.count()

        print(f"RAG 4 - Collection count = {count}")

        if count == 0:
            print("RAG 4 - Starting PDF ingestion")
            ingest_all_default_pdfs(self.collection)
            print("RAG 5 - PDF ingestion finished")
        else:
            print(f"RAG 5 - ChromaDB already has {count} chunks")

        print("RAG 6 - RAG initialization complete")
       

    def retrieve(self, query: str) -> list[dict]:
        """
        Find the most relevant text chunks for a given question.
        Returns a list of dicts with text, country, source, score.
        """
        # Embed the query locally
        query_embedding = embed([query])[0]

        # If question is about a specific country, only search that country
        country = detect_country(query)
        where   = {"country": {"$eq": country}} if country else None

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=min(TOP_K, self.collection.count()),
            where=where,
            include=["documents", "metadatas", "distances"],
        )

        chunks = []
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            chunks.append({
                "text":    doc,
                "country": meta.get("country", "Unknown"),
                "source":  meta.get("source", "unknown"),
                "score":   round(1 - dist, 4),
            })
        return chunks

    def build_context(self, query: str) -> str:
        """Build the context block that gets sent to the LLM."""
        results = self.retrieve(query)
        if not results:
            return "No relevant information found in the knowledge base."
        parts = [
            f"[Source: {r['country']} Visa Guide — relevance: {r['score']}]\n{r['text']}"
            for r in results
        ]
        return "\n\n---\n\n".join(parts)

    def ingest_uploaded_pdf(self, pdf_path: Path, country: str) -> int:
        """Called by the /upload endpoint — accepts criteria flow."""
        return ingest_pdf(pdf_path, country, self.collection)

    def stats(self) -> dict:
        """How many chunks are stored and which countries."""
        count = self.collection.count()
        if count == 0:
            return {"total_chunks": 0, "countries": []}
        sample    = self.collection.get(limit=count, include=["metadatas"])
        countries = list({m.get("country", "?") for m in sample["metadatas"]})
        return {"total_chunks": count, "countries": sorted(countries)}