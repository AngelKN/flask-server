FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY app.py .
COPY templates ./templates
COPY static ./static

# Gunicorn para producción
CMD ["gunicorn", "-b", "0.0.0.0:5000", "--workers", "2", "--threads", "4", "--timeout", "90", "app:app"]
