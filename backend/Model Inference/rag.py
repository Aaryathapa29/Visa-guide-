"""
rag.py — Retrieval-Augmented Generation layer for the Visa Guide Chatbot.

Pipeline:
1. Load PDFs from backend/data/
2. Split each into overlapping text chunks
3. Embed each chunk with OpenAI's embedding model (cached to backend/embeddings/)
4. At query time, embed the user's question and retrieve the top-K most
   similar chunks via cosine similarity
"""

import json
import os
from pathlib import Path
from typing import NamedTuple

import numpy as np
from pypdf import PdfReader
from openai import OpenAI

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
EMBEDDINGS_DIR = BASE_DIR / "embeddings"
EMBEDDINGS_CACHE = EMBEDDINGS_DIR / "chunks_index.json"

EMBEDDING_MODEL = "text-embedding-3-small"
CHUNK_SIZE = 800          # characters per chunk
CHUNK_OVERLAP = 150       # overlap between consecutive chunks
TOP_K = 4                 # number of chunks to retrieve per query

# Maps source PDF filename -> country label used in the chatbot
COUNTRY_FILES = {
    "usa_visa.pdf": "USA",
    "uk_visa.pdf": "UK",
    "canada_visa.pdf": "Canada",
}


class Chunk(NamedTuple):
    text: str
    country: str
    source: str
    embedding: list[float]


# ── PDF loading & chunking ───────────────────────────────────────────────────
def extract_text_from_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages)


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Simple sliding-window chunker over raw text, breaking on whitespace where possible."""
    text = " ".join(text.split())  # normalize whitespace
    if not text:
        return []

    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        # try to break at the last sentence boundary inside the window
        if end < len(text):
            last_period = text.rfind(". ", start, end)
            if last_period > start + 200:
                end = last_period + 1
        chunks.append(text[start:end].strip())
        start = end - overlap if end - overlap > start else end
    return [c for c in chunks if c]


def load_and_chunk_pdfs() -> list[dict]:
    """Returns list of {text, country, source} dicts for every chunk across all PDFs."""
    all_chunks = []
    for filename, country in COUNTRY_FILES.items():
        pdf_path = DATA_DIR / filename
        if not pdf_path.exists():
            print(f"[rag] Warning: {pdf_path} not found, skipping.")
            continue
        raw_text = extract_text_from_pdf(pdf_path)
        for chunk in chunk_text(raw_text):
            all_chunks.append({"text": chunk, "country": country, "source": filename})
    return all_chunks


# ── Embeddings ────────────────────────────────────────────────────────────────
def embed_texts(client: OpenAI, texts: list[str]) -> list[list[float]]:
    """Batch-embed a list of texts via the OpenAI embeddings API."""
    if not texts:
        return []
    response = client.embeddings.create(model=EMBEDDING_MODEL, input=texts)
    return [item.embedding for item in response.data]


def build_or_load_index(client: OpenAI, force_rebuild: bool = False) -> list[Chunk]:
    """
    Builds the embedding index from PDFs, or loads it from cache if available
    and the source PDFs haven't changed since the cache was built.
    """
    EMBEDDINGS_DIR.mkdir(exist_ok=True)

    pdf_signature = _pdf_signature()

    if not force_rebuild and EMBEDDINGS_CACHE.exists():
        try:
            with open(EMBEDDINGS_CACHE, "r", encoding="utf-8") as f:
                cached = json.load(f)
            if cached.get("signature") == pdf_signature:
                print(f"[rag] Loaded {len(cached['chunks'])} cached chunks from {EMBEDDINGS_CACHE}")
                return [
                    Chunk(c["text"], c["country"], c["source"], c["embedding"])
                    for c in cached["chunks"]
                ]
            else:
                print("[rag] Source PDFs changed — rebuilding embedding index.")
        except (json.JSONDecodeError, KeyError):
            print("[rag] Cache file corrupted — rebuilding embedding index.")

    print("[rag] Building embedding index from PDFs...")
    raw_chunks = load_and_chunk_pdfs()
    if not raw_chunks:
        print("[rag] No PDF content found in backend/data/. Index is empty.")
        return []

    texts = [c["text"] for c in raw_chunks]
    embeddings = embed_texts(client, texts)

    chunks = [
        Chunk(c["text"], c["country"], c["source"], emb)
        for c, emb in zip(raw_chunks, embeddings)
    ]

    # Persist to cache
    cache_data = {
        "signature": pdf_signature,
        "chunks": [
            {"text": c.text, "country": c.country, "source": c.source, "embedding": c.embedding}
            for c in chunks
        ],
    }
    with open(EMBEDDINGS_CACHE, "w", encoding="utf-8") as f:
        json.dump(cache_data, f)

    print(f"[rag] Built and cached {len(chunks)} chunks -> {EMBEDDINGS_CACHE}")
    return chunks


def _pdf_signature() -> str:
    """A cheap fingerprint of the data/ folder (filenames + sizes + mtimes) to detect changes."""
    parts = []
    for filename in sorted(COUNTRY_FILES.keys()):
        path = DATA_DIR / filename
        if path.exists():
            stat = path.stat()
            parts.append(f"{filename}:{stat.st_size}:{int(stat.st_mtime)}")
        else:
            parts.append(f"{filename}:missing")
    return "|".join(parts)


# ── Retrieval ────────────────────────────────────────────────────────────────
def cosine_similarity(a: list[float], b: list[float]) -> float:
    a_arr, b_arr = np.array(a), np.array(b)
    denom = np.linalg.norm(a_arr) * np.linalg.norm(b_arr)
    if denom == 0:
        return 0.0
    return float(np.dot(a_arr, b_arr) / denom)


def detect_country_filter(message: str) -> str | None:
    """If the question clearly names one country, restrict retrieval to that country."""
    msg = message.lower()
    if any(k in msg for k in ["usa", "united states", "u.s.", "america", "f-1", "f1 visa"]):
        return "USA"
    if any(k in msg for k in ["uk", "united kingdom", "britain", "england", "tier 4"]):
        return "UK"
    if any(k in msg for k in ["canada", "canadian"]):
        return "Canada"
    return None


class RAGEngine:
    def __init__(self, client: OpenAI, force_rebuild: bool = False):
        self.client = client
        self.chunks: list[Chunk] = build_or_load_index(client, force_rebuild=force_rebuild)

    def retrieve(self, query: str, top_k: int = TOP_K) -> list[Chunk]:
        if not self.chunks:
            return []

        country_filter = detect_country_filter(query)
        candidates = (
            [c for c in self.chunks if c.country == country_filter]
            if country_filter else self.chunks
        )
        if not candidates:
            candidates = self.chunks

        query_embedding = embed_texts(self.client, [query])[0]
        scored = [
            (cosine_similarity(query_embedding, c.embedding), c)
            for c in candidates
        ]
        scored.sort(key=lambda x: x[0], reverse=True)
        return [c for _, c in scored[:top_k]]

    def build_context(self, query: str, top_k: int = TOP_K) -> str:
        results = self.retrieve(query, top_k=top_k)
        if not results:
            return "No relevant information found in the knowledge base."

        parts = []
        for chunk in results:
            parts.append(f"[Source: {chunk.country} visa guide]\n{chunk.text}")
        return "\n\n---\n\n".join(parts)