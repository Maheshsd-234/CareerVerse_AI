"""
app/rag/doc_analyzer.py
─────────────────────────
Document analysis engine for user-uploaded PDFs, text, and markdown files.

Extracts text in-memory via PyMuPDF (fitz) without persisting to disk,
formats grounded prompts for academic/exam question generation and summarization,
and streams the analysis via Groq with Gemini fallback.
"""
from __future__ import annotations

import logging
from typing import AsyncIterator, Dict, Any, Optional

import fitz  # PyMuPDF

from app.config import get_settings
from app.llm.gemini_llm import stream_gemini
from app.llm.groq_llm import stream_groq

logger = logging.getLogger(__name__)

MAX_PAGES_TO_EXTRACT = 30
MAX_TEXT_CHARS = 40_000

_DOC_SYSTEM_PROMPT = """\
You are CareerVerse AI's Academic & Career Document Analyst, an expert career counselor and exam strategist.

The user has uploaded a document for analysis: "{filename}" ({page_count} pages/sections).

ANALYSIS & QUESTION GENERATION GUIDELINES:
1. Base your answers and analysis directly on the extracted document content in the <document_content> block.
2. If the user asks for questions (e.g. "top 5 questions", "exam questions", "mock questions"):
   - For each question, provide:
     • **Question [Number]**: The clear, well-phrased question.
     • **Core Topic / Concept Tested**: What fundamental knowledge is evaluated.
     • **Model Answer & Key Points**: Detailed, high-yield explanation grounded in the text.
     • **Yield / Difficulty**: (e.g., High-Yield, Medium, Advanced).
     • **Document Reference**: Cite the section or page (e.g., [Page X]).
3. If the user asks for a summary or specific queries:
   - Provide clean, structured insights with bold headings, bullet points, and key takeaways.
4. If certain requested details are not present in the document, explicitly note that it was not mentioned in the provided document.
5. Format your output strictly using clean GitHub-flavored Markdown. Do NOT use raw HTML.
"""


def extract_text_from_file(filename: str, content: bytes) -> tuple[str, int]:
    """
    Extract readable text from a PDF, text, or markdown file.

    Returns
    -------
    tuple[str, int]
        (extracted_text, page_count)
    """
    lower_name = filename.lower()

    if lower_name.endswith(".pdf"):
        try:
            doc = fitz.open(stream=content, filetype="pdf")
            total_pages = len(doc)
            pages_to_process = min(total_pages, MAX_PAGES_TO_EXTRACT)
            extracted: list[str] = []

            for idx in range(pages_to_process):
                page = doc[idx]
                page_text = page.get_text("text").strip()
                if page_text:
                    extracted.append(f"--- [Page {idx + 1}] ---\n{page_text}")

            doc.close()

            if not extracted:
                raise ValueError(
                    "No readable text found in the PDF. The file might contain only scanned images or be password protected."
                )

            full_text = "\n\n".join(extracted)
            if len(full_text) > MAX_TEXT_CHARS:
                full_text = full_text[:MAX_TEXT_CHARS] + "\n\n... [Document truncated for context length]"

            return full_text, total_pages
        except Exception as exc:
            if "No readable text" in str(exc):
                raise
            logger.error("Failed to parse PDF '%s': %s", filename, exc)
            raise ValueError(f"Could not parse PDF file: {exc}") from exc

    elif lower_name.endswith((".txt", ".md")):
        try:
            text = content.decode("utf-8", errors="replace").strip()
            if not text:
                raise ValueError("The uploaded text document is empty.")
            if len(text) > MAX_TEXT_CHARS:
                text = text[:MAX_TEXT_CHARS] + "\n\n... [Document truncated for context length]"
            return text, 1
        except Exception as exc:
            raise ValueError(f"Could not read text file: {exc}") from exc

    else:
        raise ValueError("Unsupported file format. Please upload a PDF (.pdf), Text (.txt), or Markdown (.md) file.")


async def stream_document_analysis(
    filename: str,
    text: str,
    page_count: int,
    user_prompt: Optional[str] = None,
    uid: str = "",
) -> AsyncIterator[Dict[str, Any]]:
    """
    Stream document analysis using Groq primary, falling back to Gemini on pre-stream failure.
    Yields events according to the SSE contract.
    """
    effective_prompt = (
        user_prompt.strip()
        if user_prompt and user_prompt.strip()
        else "Analyze this document and provide the top 5 most important, high-yield exam/interview questions with detailed model answers and key concepts tested."
    )

    system_prompt = _DOC_SYSTEM_PROMPT.format(
        filename=filename,
        page_count=page_count,
    )

    user_message = (
        f"<document_content>\n{text}\n</document_content>\n\n"
        f"User Request:\n{effective_prompt}"
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]

    # Emit mode
    yield {"event": "mode", "data": {"mode": "document_analysis"}}

    # Emit sources
    yield {
        "event": "sources",
        "data": [
            {
                "index": 1,
                "title": filename,
                "category": "document",
                "last_verified": f"Uploaded ({page_count} pages)",
                "url": None,
            }
        ],
    }

    # Primary LLM: Groq
    tokens_yielded = 0
    groq_failed_pre_stream = False
    cfg = get_settings()

    try:
        async for chunk in stream_groq(messages):
            tokens_yielded += 1
            yield {"event": "token", "data": {"text": chunk}}
    except Exception as exc:
        if tokens_yielded == 0:
            logger.warning(
                "Groq streaming encountered an error for doc analysis (tokens_yielded=0): %s",
                exc,
            )
            groq_failed_pre_stream = True
        else:
            logger.error(
                "Groq streaming failed mid-stream during doc analysis (tokens_yielded=%d): %s",
                tokens_yielded,
                exc,
            )
            yield {
                "event": "error",
                "data": {"message": "Streaming interrupted while analyzing the document. Please try again."},
            }
            return

    # Fallback to Gemini if Groq failed before any tokens
    if groq_failed_pre_stream:
        logger.info("Engaging Gemini fallback for document analysis model=%s", cfg.gemini_model)
        try:
            async for chunk in stream_gemini(messages):
                yield {"event": "token", "data": {"text": chunk}}
        except Exception as exc:
            logger.error("Gemini fallback also failed for doc analysis: %s", exc)
            yield {
                "event": "error",
                "data": {"message": "Both AI models were unable to analyze the document. Please try again in a moment."},
            }
            return

    yield {"event": "done", "data": {}}
