FROM python:3.13-slim

# HF Spaces erwartet Port 7860
ENV PORT=7860
ENV PYTHONUNBUFFERED=1
ENV TRANSFORMERS_CACHE=/tmp/hf_cache

WORKDIR /app

# System-Dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Python Dependencies zuerst (Docker Cache nutzen)
COPY requirements.txt pyproject.toml* ./
RUN pip install --no-cache-dir -r requirements.txt 2>/dev/null || true
RUN pip install --no-cache-dir fastapi uvicorn python-dotenv python-multipart \
    gensim pandas openpyxl supabase statsmodels \
    torch --index-url https://download.pytorch.org/whl/cpu \
    transformers sentencepiece

# App kopieren
COPY . .

# Models-Verzeichnis erstellen
RUN mkdir -p models/saved_models

# HF Spaces braucht einen User mit Schreibrechten
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app /tmp
USER appuser

EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]