"""
app/rag/ingest.py
──────────────────
Document ingestion pipeline for CareerVerse AI RAG.

Supported input types
─────────────────────
- PDF files          → parsed with PyMuPDF (fitz)
- Markdown / .txt    → read directly as text
- Web URLs           → downloaded and cleaned with trafilatura

Chunking strategy
──────────────────
1. Try heading-based splitting first (Markdown ## / ### headings or PDF
   section boundaries created by font-size heuristic).
2. If a section is still larger than `chunk_tokens` after heading split,
   fall back to token-aware sliding-window chunking with ~12% overlap.
3. Empty chunks are discarded.

Token counting
──────────────
Uses tiktoken (cl100k_base encoder — model-agnostic, compatible with both
GPT-4o and Llama tokenizers for approximate counting).

Idempotency / change detection
───────────────────────────────
Before upsert, the pipeline:
1. Computes SHA-256 of the full document text.
2. Checks whether doc_id already exists in Qdrant with the same hash.
3. If hash matches → skips entirely (returns summary with chunks_skipped=N).
4. If hash differs or doc is new → deletes old vectors for doc_id, then
   upserts fresh chunks.

Usage
─────
    result = await ingest_document(
        path_or_url="sample_docs/jee_guide.md",
        metadata={
            "doc_id":       "jee_guide_v1",
            "title":        "JEE Mains & Advanced Complete Guide",
            "source_url":   "https://example.com/jee",
            "category":     "exam",
            "stage":        "school",
            "last_verified": "2025-01-15",
        },
        store=my_rag_store,   # optional; creates a new RagStore if not passed
    )
    print(result)
    # IngestResult(doc_id='jee_guide_v1', chunks_created=12, chunks_skipped=0, changed=True)
"""
from __future__ import annotations

import hashlib
import logging
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# ── Lazy imports so the module loads fast even if deps are missing ─────────────
try:
    import fitz  # PyMuPDF
    _HAS_PYMUPDF = True
except ImportError:
    _HAS_PYMUPDF = False
    logger.warning("PyMuPDF not installed — PDF parsing disabled. pip install pymupdf")

try:
    import trafilatura
    _HAS_TRAFILATURA = True
except ImportError:
    _HAS_TRAFILATURA = False
    logger.warning("trafilatura not installed — web page parsing disabled. pip install trafilatura")

try:
    import tiktoken
    _ENCODER = tiktoken.get_encoding("cl100k_base")
    _HAS_TIKTOKEN = True
except ImportError:
    _ENCODER = None
    _HAS_TIKTOKEN = False
    logger.warning("tiktoken not installed — using word count as fallback. pip install tiktoken")


# ── Constants ─────────────────────────────────────────────────────────────────

DEFAULT_CHUNK_TOKENS = 500    # target tokens per chunk
DEFAULT_OVERLAP_RATIO = 0.12  # 12% overlap between consecutive chunks

# Markdown heading pattern (## Section or ### Sub-section)
_HEADING_RE = re.compile(r"^#{1,6}\s+.+", re.MULTILINE)


# ── Result dataclass ──────────────────────────────────────────────────────────


@dataclass
class IngestResult:
    """Summary returned after ingesting one document."""

    doc_id: str
    chunks_created: int       # new chunks written to Qdrant
    chunks_skipped: int       # 0 if doc was new/changed; N if unchanged
    changed: bool             # True if content_hash differed (or doc was new)
    message: str = ""


# ── Text extraction ───────────────────────────────────────────────────────────


def _extract_text_from_pdf(path: Path) -> str:
    """Extract all text from a PDF file using PyMuPDF."""
    if not _HAS_PYMUPDF:
        raise RuntimeError("PyMuPDF is required to parse PDFs. pip install pymupdf")
    doc = fitz.open(str(path))
    pages = []
    for page in doc:
        text = page.get_text("text")
        if text.strip():
            pages.append(text)
    doc.close()
    return "\n\n".join(pages)


def _extract_text_from_url(url: str) -> str:
    """Download and extract main text content from a web page."""
    if not _HAS_TRAFILATURA:
        raise RuntimeError("trafilatura is required to parse URLs. pip install trafilatura")
    downloaded = trafilatura.fetch_url(url)
    if not downloaded:
        raise ValueError(f"Failed to download URL: {url}")
    text = trafilatura.extract(
        downloaded,
        include_comments=False,
        include_tables=True,
        no_fallback=False,
    )
    if not text:
        raise ValueError(f"trafilatura could not extract text from: {url}")
    return text


def _is_url(value: str) -> bool:
    try:
        parsed = urlparse(value)
        return parsed.scheme in ("http", "https")
    except Exception:
        return False


def extract_text(path_or_url: str) -> str:
    """
    Extract raw text from a PDF, Markdown, TXT file, or web URL.

    Parameters
    ----------
    path_or_url : File path string or HTTP(S) URL.
    """
    if _is_url(path_or_url):
        return _extract_text_from_url(path_or_url)

    path = Path(path_or_url)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return _extract_text_from_pdf(path)
    elif suffix in (".md", ".markdown", ".txt", ".rst"):
        return path.read_text(encoding="utf-8")
    else:
        # Try to read as plain text for unknown extensions
        logger.warning("Unknown file extension '%s' — reading as plain text.", suffix)
        return path.read_text(encoding="utf-8")


# ── Text cleaning ─────────────────────────────────────────────────────────────


def clean_text(text: str) -> str:
    """
    Normalize and clean extracted text.

    - Unicode normalize to NFC (handles ligatures, combining chars).
    - Collapse 3+ consecutive newlines to 2 (preserve paragraph breaks).
    - Remove trailing whitespace per line.
    - Strip leading/trailing whitespace overall.
    """
    # Unicode normalization
    text = unicodedata.normalize("NFC", text)
    # Normalize line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Remove non-printable control characters (except newlines and tabs)
    text = re.sub(r"[^\x09\x0A\x20-\x7E\u00A0-\uFFFF]", "", text)
    # Strip trailing whitespace per line
    lines = [line.rstrip() for line in text.split("\n")]
    text = "\n".join(lines)
    # Collapse 3+ consecutive blank lines to 2 (preserve paragraph spacing)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# ── Token counting ────────────────────────────────────────────────────────────


def count_tokens(text: str) -> int:
    """Count tokens using tiktoken (or fall back to word count)."""
    if _HAS_TIKTOKEN and _ENCODER:
        return len(_ENCODER.encode(text))
    # Fallback: approximate with whitespace-split word count
    return len(text.split())


# ── Chunking ──────────────────────────────────────────────────────────────────


def _split_by_headings(text: str) -> List[str]:
    """
    Split Markdown text at heading boundaries (## or ###).
    Returns a list of sections. Each section includes its heading line.
    Falls back to the entire text as one section if no headings found.
    """
    positions = [m.start() for m in _HEADING_RE.finditer(text)]
    if not positions:
        return [text]

    sections = []
    for i, pos in enumerate(positions):
        end = positions[i + 1] if i + 1 < len(positions) else len(text)
        section = text[pos:end].strip()
        if section:
            sections.append(section)

    # If there is text before the first heading, prepend it
    if positions[0] > 0:
        preamble = text[:positions[0]].strip()
        if preamble:
            sections.insert(0, preamble)

    return sections


def _sliding_window(
    text: str,
    chunk_tokens: int = DEFAULT_CHUNK_TOKENS,
    overlap_ratio: float = DEFAULT_OVERLAP_RATIO,
) -> List[str]:
    """
    Split `text` into token-bounded chunks with overlap.

    Parameters
    ----------
    text         : Text to split.
    chunk_tokens : Maximum tokens per chunk.
    overlap_ratio: Fraction of chunk_tokens to repeat in the next chunk.
    """
    if _HAS_TIKTOKEN and _ENCODER:
        tokens = _ENCODER.encode(text)
        overlap = max(1, int(chunk_tokens * overlap_ratio))
        step = chunk_tokens - overlap

        chunks = []
        for start in range(0, len(tokens), step):
            end = start + chunk_tokens
            chunk_tokens_slice = tokens[start:end]
            chunk_text = _ENCODER.decode(chunk_tokens_slice).strip()
            if chunk_text:
                chunks.append(chunk_text)
            if end >= len(tokens):
                break
        return chunks
    else:
        # Word-based fallback
        words = text.split()
        overlap = max(1, int(chunk_tokens * overlap_ratio))
        step = chunk_tokens - overlap
        chunks = []
        for start in range(0, len(words), step):
            chunk = " ".join(words[start:start + chunk_tokens]).strip()
            if chunk:
                chunks.append(chunk)
        return chunks


def chunk_text(
    text: str,
    chunk_tokens: int = DEFAULT_CHUNK_TOKENS,
    overlap_ratio: float = DEFAULT_OVERLAP_RATIO,
) -> List[str]:
    """
    Split text into chunks:
    1. Split at Markdown headings first.
    2. Any section exceeding chunk_tokens is further split with sliding window.
    3. Drop any empty chunks.

    Parameters
    ----------
    text          : Clean document text.
    chunk_tokens  : Target tokens per chunk.
    overlap_ratio : Fraction of overlap between sliding window chunks.
    """
    sections = _split_by_headings(text)

    final_chunks: List[str] = []
    for section in sections:
        token_count = count_tokens(section)
        if token_count <= chunk_tokens:
            stripped = section.strip()
            if stripped:
                final_chunks.append(stripped)
        else:
            # Section too large — apply sliding window
            sub_chunks = _sliding_window(section, chunk_tokens, overlap_ratio)
            final_chunks.extend(sub_chunks)

    # Remove empty strings (safety net)
    return [c for c in final_chunks if c.strip()]


# ── Content hash ──────────────────────────────────────────────────────────────


def content_hash(text: str) -> str:
    """Return SHA-256 hex digest of the document text (for change detection)."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


# ── Main ingest function ──────────────────────────────────────────────────────


async def ingest_document(
    path_or_url: str,
    metadata: Dict[str, Any],
    store: Optional[Any] = None,
    chunk_tokens: int = DEFAULT_CHUNK_TOKENS,
    overlap_ratio: float = DEFAULT_OVERLAP_RATIO,
    force: bool = False,
) -> IngestResult:
    """
    Parse, chunk, and upsert a document into Qdrant.

    Parameters
    ----------
    path_or_url  : Absolute file path, relative path, or HTTP(S) URL.
    metadata     : Must contain 'doc_id'. Optional: title, source_url,
                   category, stage, last_verified.
    store        : RagStore instance. If None, creates one (uses .env config).
    chunk_tokens : Target tokens per chunk.
    overlap_ratio: Sliding-window overlap fraction.
    force        : If True, bypass hash check and force re-ingestion.

    Returns
    -------
    IngestResult with doc_id, chunks_created, chunks_skipped, and changed flag.
    """
    # Lazy import here to avoid circular imports at module load
    from app.rag.store import RagChunk, RagStore  # noqa: PLC0415

    if store is None:
        store = RagStore()
        await store.ensure_collection()

    doc_id = metadata.get("doc_id")
    if not doc_id:
        raise ValueError("metadata must contain 'doc_id'")

    # 1. Extract and clean text
    logger.info("Extracting text from '%s'…", path_or_url)
    raw_text = extract_text(path_or_url)
    cleaned = clean_text(raw_text)

    if not cleaned:
        return IngestResult(
            doc_id=doc_id,
            chunks_created=0,
            chunks_skipped=0,
            changed=False,
            message="No text could be extracted — document may be empty or image-only.",
        )

    # 2. Compute content hash
    doc_hash = content_hash(cleaned)

    # 3. Check if document has changed (idempotency)
    existing_hash = await store.get_content_hash(doc_id)
    if not force and existing_hash == doc_hash:
        chunk_count = len(chunk_text(cleaned, chunk_tokens, overlap_ratio))
        logger.info(
            "doc_id='%s' unchanged (hash match) — skipping %d chunks.", doc_id, chunk_count
        )
        return IngestResult(
            doc_id=doc_id,
            chunks_created=0,
            chunks_skipped=chunk_count,
            changed=False,
            message="Document unchanged — skipped.",
        )

    # 4. If changed (or new, or force), delete old vectors first
    if existing_hash is not None or force:
        logger.info("doc_id='%s' updating — deleting old vectors before ingest.", doc_id)
        await store.delete_by_doc_id(doc_id)

    # 5. Chunk the document
    chunks_text = chunk_text(cleaned, chunk_tokens, overlap_ratio)
    logger.info("doc_id='%s' → %d chunks.", doc_id, len(chunks_text))

    # 6. Build RagChunk objects with document context preservation
    title = metadata.get("title", Path(path_or_url).stem if not _is_url(path_or_url) else doc_id)
    doc_prefix = f"[{title}]\n"

    rag_chunks = []
    for chunk in chunks_text:
        chunk_clean = chunk.strip()
        if not chunk_clean:
            continue
        # Skip pure HTML comments
        if chunk_clean.startswith("<!--") and chunk_clean.endswith("-->"):
            continue
        # Prepend document title context so every chunk retains document domain/topic
        if not chunk_clean.startswith(f"[{title}]") and not chunk_clean.startswith(f"# {title}"):
            text_with_context = f"{doc_prefix}{chunk_clean}"
        else:
            text_with_context = chunk_clean

        rag_chunks.append(
            RagChunk(
                text=text_with_context,
                doc_id=doc_id,
                chunk_index=len(rag_chunks),
                source_url=metadata.get("source_url", path_or_url if _is_url(path_or_url) else ""),
                title=title,
                category=metadata.get("category", "other"),
                stage=metadata.get("stage", "all"),
                last_verified=metadata.get("last_verified", ""),
                content_hash=doc_hash,
            )
        )

    # 7. Upsert
    await store.upsert_chunks(rag_chunks)

    return IngestResult(
        doc_id=doc_id,
        chunks_created=len(rag_chunks),
        chunks_skipped=0,
        changed=True,
        message=f"Ingested {len(rag_chunks)} chunks.",
    )
