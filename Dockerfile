# Dockerfile for Railway deployment
# Builds the backend from the backend/ subdirectory

FROM python:3.10-slim

WORKDIR /app

# Copy backend requirements and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/ .

# Expose port (Railway will set PORT env var)
EXPOSE 8000

# Run the application
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}

