# Yalie Search

<!-- **Find Yalies using AI-powered semantic search** -->
**Find Yalies using semantic search**

🔗 **Live at:** [www.yaliesearch.com](https://www.yaliesearch.com)

A modern web application that uses CLIP (Contrastive Language-Image Pre-training) to search through Yale student profiles using natural language descriptions. Search for people by describing their appearance, style, or characteristics - no names needed!

---

## ✨ Features

### Core Functionality
- 🔍 **Semantic Search** - Find people using natural language ("curly red hair and freckles")
- 🎯 **Advanced Filters** - Filter by college, year, and major
- 🔄 **Find Similar** - Click any result to find visually similar people
- 📧 **Contact** - Copy email addresses with one click
- 📊 **Leaderboards** - See most popular individuals and colleges in searches
- 📈 **Trending Searches** - Discover what others are searching for
- 📜 **Search History** - Track your past searches (with optional anonymous mode)

### User Experience
- 🛡️ **Content Moderation** - AI-powered filtering using GPT-4o-mini
- 🔒 **Yale CAS Authentication** - Secure login for Yale community
- 🎨 **Beautiful UI** - Dark theme with glassmorphism and smooth animations
- 📱 **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile
- ⚡ **Fast** - In-memory search with LRU caching for popular queries
- 🖼️ **Lazy Loading** - Images load progressively for better performance

### Privacy & Analytics
- 🕵️ **Anonymous Mode** - Search without logging to history or analytics
- 📊 **Usage Analytics** - Track popular searches and trends
- 🔐 **Secure** - HTTPS everywhere, JWT authentication

---

## 🏗️ Architecture

```
yalies_search_web/
├── backend/                      # FastAPI Python API (Railway)
│   ├── main.py                   # API endpoints & routing
│   ├── search.py                 # CLIP-based semantic search
│   ├── auth.py                   # Yale CAS authentication
│   ├── moderation.py             # Content filtering with OpenAI
│   ├── analytics.py              # Search logging & trending
│   ├── leaderboard.py            # Appearance tracking (SQLite)
│   ├── data/
│   │   └── yalie_embedding.json  # Pre-computed CLIP embeddings (5,800 people)
│   ├── persistent/               # Runtime data (mounted volume)
│   │   ├── leaderboard.db        # SQLite database
│   │   └── search_analytics.json # Search logs
│   ├── Dockerfile                # Docker configuration
│   ├── railway.toml              # Railway deployment config
│   └── requirements.txt          # Python dependencies
│
├── frontend/                     # Next.js React app (Vercel)
│   ├── app/
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Main search interface
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   ├── SearchBar.tsx         # Search input with history
│   │   ├── FilterBar.tsx         # College/year/major filters
│   │   ├── ResultsGrid.tsx       # Search results grid
│   │   ├── ResultCard.tsx        # Individual result card
│   │   ├── LeaderboardFullView.tsx # Leaderboard tab
│   │   ├── TrendingSearches.tsx  # Popular searches widget
│   │   └── WelcomeModal.tsx      # User guide modal
│   ├── contexts/
│   │   └── AuthContext.tsx       # Authentication state
│   ├── lib/
│   │   ├── auth.ts               # Auth utilities
│   │   └── searchHistory.ts      # Local storage utilities
│   ├── college_logos/            # Yale college logos
│   ├── next.config.js            # Next.js configuration
│   ├── vercel.json               # Vercel deployment config
│   └── package.json              # Node dependencies
│
├── yalie_search_cli/             # Original CLI tool (local only)
│   ├── model.py                  # Generate embeddings
│   └── yalie_embedding.json      # Embeddings file (copied to backend)
│
├── DEPLOYMENT.md                 # Detailed deployment guide
└── README.md                     # This file
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.10+
- Node.js 18+
- The `yalie_embedding.json` file (generated from `yalie_search_cli/model.py`)

### 1. Start the Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (create .env file)
cat > .env << EOF
JWT_SECRET=your-dev-secret-key
DEV_MODE=true
DISABLE_MODERATION=true
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
EOF

# Run the API
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
- Health check: `http://localhost:8000/api/health`
- API docs: `http://localhost:8000/docs`

### 2. Start the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set environment variables (create .env.local file)
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_DEV_MODE=true
EOF

# Run development server
npm run dev
```

The app will be available at `http://localhost:3000`

---

## 🌐 Production Deployment

The app is deployed using:
- **Backend:** Railway (Docker container with PyTorch CPU)
- **Frontend:** Vercel (Next.js with edge functions)
- **Domain:** Namecheap DNS → Vercel

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Environment Variables

**Backend (Railway):**
```bash
JWT_SECRET=<long-random-string>
BACKEND_URL=https://yaliesearch-web-production.up.railway.app
FRONTEND_URL=https://yaliesearch.com,https://yalie-search-web.vercel.app
OPENAI_API_KEY=sk-proj-xxxxx
DEV_MODE=false          # true for testing without CAS
DISABLE_MODERATION=false # true to skip content filtering
```

**Frontend (Vercel):**
```bash
NEXT_PUBLIC_API_URL=https://yaliesearch-web-production.up.railway.app
NEXT_PUBLIC_DEV_MODE=false  # true for testing without CAS
```

---

## 📡 API Reference

### Authentication
- `GET /api/auth/login` - Get CAS login URL
- `GET /api/auth/logout` - Get CAS logout URL
- `GET /api/auth/callback` - Handle CAS callback

### Search
- `GET /api/search` - Search by text description
  - Query params: `q` (query), `k` (results, default 20), `college`, `year`, `major`, `anonymous`
- `GET /api/similar/{person_id}` - Find visually similar people
  - Query params: `k` (results, default 20), `college`, `year`, `major`
- `GET /api/person/{person_id}` - Get person details by ID

### Metadata
- `GET /api/filters` - Get available filter options (colleges, years, majors)
- `GET /api/health` - Health check with system stats

### Analytics
- `GET /api/trending` - Get trending searches
  - Query params: `period` (day/week/month), `limit` (default 10)
- `GET /api/stats` - Get search statistics

### Leaderboards
- `GET /api/leaderboard/individuals` - Get individual appearance leaderboard
  - Query params: `limit` (default 50)
- `GET /api/leaderboard/colleges` - Get college leaderboard
  - Query params: `limit` (default 14)
- `GET /api/leaderboard/stats` - Get leaderboard statistics

---

## 🧠 How It Works

### 1. Embedding Generation (One-time, Local)
```python
# yalie_search_cli/model.py
# Uses CLIP ViT-Large-Patch14 with MPS/CUDA acceleration
for yalie in yalies:
    image → CLIP → 768-dim embedding → save to JSON
```

### 2. Search (Runtime, Backend)
```python
# backend/search.py
1. User query → CLIP text encoder → 768-dim query embedding
2. Compute cosine similarity with all pre-computed embeddings
3. Sort by similarity, apply filters, return top K matches
4. Cache popular queries in LRU cache (100 entries, 5min TTL)
```

### 3. Content Moderation (Runtime, Backend)
```python
# backend/moderation.py
1. User query → OpenAI GPT-4o-mini
2. Semantic analysis for harmful/defamatory content
3. Allow: positive, playful, celebrity lookalikes
4. Block: derogatory, sexual, criminal implications
```

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PyTorch** (CPU) - Deep learning framework
- **Transformers** - Hugging Face CLIP implementation
- **NumPy** - Efficient array operations
- **SQLite** - Leaderboard persistence (WAL mode)
- **OpenAI API** - Content moderation (GPT-4o-mini)
- **python-cas** - Yale CAS authentication
- **PyJWT** - Token-based authentication

### Frontend
- **Next.js 14** - React framework with app router
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **Lucide React** - Icon library

### Infrastructure
- **Railway** - Backend hosting (Docker)
- **Vercel** - Frontend hosting (Edge network)
- **Namecheap** - Domain registration
- **GitHub** - Version control & CI/CD

---

## 📊 Dataset

- **Source:** Yale Faces (public Yale directory data)
- **Size:** 5,800 students with profile images
- **Embeddings:** 768-dimensional vectors from CLIP ViT-Large-Patch14
- **Data:** First name, last name, college, year, major, email, image URL, NetID
- **File Size:** ~71 MB (yalie_embedding.json)

---

## 🔒 Privacy & Security

- **Authentication:** Yale CAS (NetID required in production)
- **Data Storage:** 
  - Embeddings: Read-only in Docker image
  - Search logs: Persistent volume (opt-out via anonymous mode)
  - Leaderboard: Aggregated, non-personally-identifiable
- **Content Moderation:** Automatic filtering of malicious queries
- **HTTPS:** All traffic encrypted via Vercel/Railway
- **No PII Storage:** Only NetID for auth, no additional personal data collected

---

## 🎨 UI/UX Highlights

- **Glassmorphism Design** - Modern frosted glass effects
- **Yale Branding** - Official Yale blue (#0F4D92) color scheme
- **Responsive Grid** - Adaptive layout for all screen sizes
- **Smooth Animations** - Framer Motion for polished interactions
- **Keyboard Shortcuts** - Press `/` to focus search
- **Match Scores** - Visual confidence indicators (50-100%)
- **Lazy Loading** - Progressive image loading for performance
- **Toast Notifications** - Feedback for actions (email copied, etc.)

---

## 📈 Performance

- **Search Latency:** ~500-800ms (CPU inference on Railway)
- **Cache Hit Rate:** Popular queries return instantly
- **Image Optimization:** Next.js Image component with lazy loading
- **CDN:** Vercel Edge network for global low latency
- **Bundle Size:** Frontend < 500KB gzipped

---

## 🚧 Future Enhancements

- [ ] Add GPU support for faster search (~200-300ms)
- [ ] Implement image upload for "find people like this photo"
- [ ] Add social features (favorites, collections)
- [ ] Support for alumni search (expand dataset)
- [ ] Mobile app (React Native)
- [ ] A/B testing for search relevance
- [ ] Multi-language support

---

## 📝 License

This project is for educational purposes. Student data is sourced from publicly available Yale directories and is used in accordance with Yale's data policies.

---

## 👥 Credits

**Developer:** Lucas Zhao (lz588@yale.edu)

**Built with:**
- [OpenAI CLIP](https://github.com/openai/CLIP) - Vision-language model
- [Hugging Face Transformers](https://huggingface.co/transformers/) - ML library
- [FastAPI](https://fastapi.tiangolo.com/) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework

---

## 🐛 Troubleshooting

**Search not working?**
- Check that backend is running at `http://localhost:8000/api/health`
- Verify CORS is configured correctly in `backend/main.py`
- Check browser console for API errors

**CAS login not working?**
- Ensure `DEV_MODE=true` for local testing
- Verify CAS is registered with Yale ITS for production

**Slow search?**
- Check Railway instance resources
- Verify embeddings are loaded (check startup logs)
- Consider upgrading to GPU instance

**Images not loading?**
- Check Next.js Image component configuration
- Verify image URLs are accessible
- Check CORS for image domains

See [DEPLOYMENT.md](DEPLOYMENT.md) for more detailed troubleshooting.

---

**🎓 Made with ❤️ for the Yale community**
