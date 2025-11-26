# Dockerfile for Railway/Render deployment
# Note: When deployed via railway.toml, build context is the repository root
# Optimized for smaller image size (<4GB for Railway free tier)

FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (minimal)
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY backend/requirements.txt .

# Install PyTorch CPU-only (much smaller than CUDA version)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Install other dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Clean up pip cache to reduce image size
RUN pip cache purge && \
    rm -rf /root/.cache/pip

# Copy application code
COPY backend/ .

# Note: /app/data/ contains read-only embeddings (yalie_embedding.json)
# Runtime persistent data (leaderboard.db, search_analytics.json) goes to /app/persistent/
# Mount a Railway Volume to /app/persistent/ for data persistence across deployments

# Expose port (Railway/Render will set PORT env var)
EXPOSE 8000

# Run the application
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}

