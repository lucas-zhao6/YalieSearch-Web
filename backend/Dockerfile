# Dockerfile for Railway/Render deployment
# Note: When deployed via railway.toml, build context is the repository root
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ .

# Embeddings are already included in backend/data/
# No need for separate COPY command

# Expose port (Railway/Render will set PORT env var)
EXPOSE 8000

# Run the application
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}

