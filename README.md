# Yalie Search Web App

A modern web application for finding Yalies using AI-powered semantic search with CLIP embeddings.

## Architecture

```
yalies_search_web/
├── backend/              # FastAPI Python API
│   ├── main.py           # API endpoints
│   ├── search.py         # Search logic
│   └── requirements.txt
├── frontend/             # Next.js React app
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   └── package.json
└── README.md
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- The `yalie_embedding.json` file from `yalie_search_cli/`

## Quick Start

### 1. Start the Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the API
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### 2. Start the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:3000`

## API Endpoints

### `GET /api/health`
Health check endpoint.

### `GET /api/search`
Search for people by description.

**Query Parameters:**
- `q` (required): Search query text
- `k` (optional): Number of results (1-50, default 10)

**Example:**
```
GET /api/search?q=person with glasses&k=10
```

## Features

- 🔍 **Semantic Search**: Find people by natural language descriptions
- ⚡ **Fast**: Pre-loaded embeddings for instant search
- 🎨 **Beautiful UI**: Dark theme with glassmorphism design
- 📱 **Responsive**: Works on desktop and mobile
- 🖼️ **Photo Grid**: Visual results with match scores
- 🔒 **Yale CAS Authentication**: Secure login for Yale students
- 🛡️ **Content Moderation**: AI-powered filtering of inappropriate queries

## Tech Stack

**Backend:**
- FastAPI
- PyTorch
- Transformers (CLIP)
- NumPy

**Frontend:**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion

## Development

### Backend Development

```bash
cd backend
uvicorn main:app --reload
```

### Frontend Development

```bash
cd frontend
npm run dev
```

## Deployment

### Backend
Deploy to any Python hosting (Railway, Render, Fly.io, etc.)

### Frontend
Deploy to Vercel:
```bash
cd frontend
npx vercel
```

## Environment Variables

**Backend:**
- `EMBEDDINGS_PATH`: Path to yalie_embedding.json (default: ../yalie_search_cli/yalie_embedding.json)

**Frontend:**
- Configure API URL in `next.config.js` for production

