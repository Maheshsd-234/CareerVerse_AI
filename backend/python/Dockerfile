# ── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ── Pre-download the embedding model into the image ───────────────────────────
# This bakes the model weights into the Docker layer so:
#   - No internet needed at runtime
#   - Cold starts are fast (model already on disk)
#   - The model name is read from ARG so it stays configurable
ARG HF_EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
RUN python -c "\
from sentence_transformers import SentenceTransformer; \
import os; \
model_name = os.environ.get('HF_EMBEDDING_MODEL', '${HF_EMBEDDING_MODEL}'); \
print(f'Downloading embedding model: {model_name}'); \
SentenceTransformer(model_name); \
print('Model cached successfully.')"

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy HuggingFace model cache from builder
COPY --from=builder /root/.cache/huggingface /root/.cache/huggingface

# Copy application source
COPY app/ ./app/
COPY scripts/ ./scripts/
COPY data/ ./data/

# Non-root user for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app /root/.cache
USER appuser

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
