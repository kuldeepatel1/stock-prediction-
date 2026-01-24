# Stage 1: build environment
FROM python:3.11-slim AS builder
EXPOSE 8000
WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app source code
COPY app ./app

# Stage 2: production image
FROM python:3.11-slim

WORKDIR /app

# Copy installed dependencies and app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /app/app ./app

# Environment vars (OPTIONAL — override in Render settings if needed)
ENV PYTHONUNBUFFERED=1
ENV FRONTEND_URL="https://stock-price-prediction-system-liart.vercel.app"

# Run FastAPI app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
