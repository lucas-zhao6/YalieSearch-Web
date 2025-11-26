# Yalie Search - Deployment Guide

Complete step-by-step guide to deploy Yalie Search to production with Yale CAS authentication.

## 🚀 TL;DR - Fastest Path to Deployment

**Easiest approach for beginners:**

1. **Split the repo** into two separate GitHub repos (backend & frontend)
2. **Deploy backend** to Railway → Just connect the backend repo
3. **Deploy frontend** to Vercel → Just connect the frontend repo
4. **Set environment variables** in both platforms
5. **Enable DEV_MODE** initially to skip Yale CAS setup
6. **Test locally first** before production

**Skip monorepo complexity!** See **Step 1 - Option B** below for details.

---

## Prerequisites

- [ ] GitHub account
- [ ] Yale NetID (not required for local testing with DEV_MODE)
- [ ] Domain name (optional but recommended: `yaliesearch.com`)
- [ ] `yalie_embedding.json` file (~71MB)
- [ ] OpenAI API key (for content moderation - get from https://platform.openai.com)

## Features

The app includes:

### Core Features
- **AI-powered semantic search** - Find people by describing their appearance
- **Yale CAS authentication** - Secure login with Yale NetID
- **Content moderation** - OpenAI GPT-4o-mini filters inappropriate queries
- **Advanced filters** - Filter by college, year, and major
- **Find Similar** - Find people who look similar to someone

### Social Features
- **Leaderboard** - See who appears most in searches (individuals & colleges)
- **Trending searches** - Popular queries from all users
- **Search history** - Personal history stored locally in browser
- **Anonymous mode** - Search without logging to history/analytics

### Technical Features
- **Lazy loading images** - Efficient image loading for better performance
- **In-memory caching** - Popular searches cached for speed
- **Email contact** - Copy-to-clipboard for contacting people
- **Responsive design** - Works on mobile and desktop

## 🧪 Testing Locally Without Yale CAS

The app includes a **DEV_MODE** that bypasses Yale CAS authentication for local testing:

**Backend** (`backend/.env`):
```bash
DEV_MODE=true
DISABLE_MODERATION=true
```

**Frontend** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_DEV_MODE=true
```

With DEV_MODE enabled:
- ✅ No Yale login required
- ✅ Auto-logged in as `dev_user`
- ✅ Full search functionality works

**⚠️ Important:** In production:
- Set `DEV_MODE=false` after registering with Yale ITS
- Set `DISABLE_MODERATION=false` to enable content filtering
- Add your `OPENAI_API_KEY` for moderation

## Step 1: Prepare Code for Deployment

### Option A: Single Repo (Monorepo) - Current Setup

This is the current setup with both `frontend/` and `backend/` in one repository.

**Pros:** Keep everything together, easier to manage  
**Cons:** Requires configuring root directories in Railway/Vercel

```bash
cd yalies_search_web

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Yalie Search with CAS auth"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/yalie-search.git
git branch -M main
git push -u origin main
```

### Option B: Separate Repos (Simpler for Deployment)

If Railway monorepo configuration is frustrating, split into two repos:

**Backend repo:**
```bash
cd yalies_search_web/backend
git init
git add .
git commit -m "Backend - Yalie Search API"
git remote add origin https://github.com/YOUR_USERNAME/yalie-search-backend.git
git branch -M main
git push -u origin main
```

**Frontend repo:**
```bash
cd yalies_search_web/frontend
git init
git add .
git commit -m "Frontend - Yalie Search UI"
git remote add origin https://github.com/YOUR_USERNAME/yalie-search-frontend.git
git branch -M main
git push -u origin main
```

**Pros:** Railway and Vercel auto-detect everything  
**Cons:** Need to manage two repos

**If you choose Option B:**
- Deploy backend repo to Railway (no root directory config needed)
- Deploy frontend repo to Vercel (no root directory config needed)
- Skip the "Configure Root Directory" steps below

### 1.2 Prepare Embeddings File

The embeddings file is already copied to `backend/data/yalie_embedding.json` and will be included in the Docker build.

**Note:** The file is ~71MB. If you encounter issues pushing to GitHub:
- Use Git LFS: `git lfs track "backend/data/*.json"`
- Or use a `.gitignore` rule and upload to cloud storage instead

## Step 2: Deploy Backend to Railway

### 2.1 Sign Up & Create Project

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (free tier: 500 hours/month, $5 credit)
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your `yalie-search` repository
6. Railway will create a service but **it won't work yet** - we need to configure the root directory

### 2.2 Configure Monorepo for Railway

Since this is a monorepo (both frontend and backend in one repo), Railway needs to know where to find the backend files.

**The Solution:** Use `railway.toml` at the repository ROOT (already created for you!)

The repo now has `railway.toml` at the root that tells Railway:
- Build using Dockerfile at `backend/Dockerfile`
- Watch for changes in `backend/**` folder only
- Start command runs from backend directory

**You don't need to configure anything in the Railway UI!** The `railway.toml` file handles everything automatically.

**If Railway shows build errors:**
1. Make sure `railway.toml` exists at the **root** of your repo (not inside `backend/`)
2. Commit and push it:
   ```bash
   git add railway.toml
   git commit -m "Add Railway config for monorepo"
   git push
   ```
3. Railway will automatically redeploy

**Alternative: Deploy Manually**

If the above doesn't work, you can also:
1. Delete the auto-created service
2. Click **"+ New"** in your Railway project
3. Select **"Empty Service"**
4. Go to Settings → Connect Repo → Select your repo
5. Set Root Directory to `backend`
6. Railway will deploy

**Note:** The backend includes a `railway.toml` file that tells Railway how to build and run the app:
- It will automatically detect the Dockerfile
- Build command: Docker build from `backend/Dockerfile`
- Start command: `uvicorn main:app --host 0.0.0.0 --port 8000`

**Visual Guide to Finding Root Directory Setting:**

```
Railway UI (may vary slightly):

1. Project Dashboard
   └── Your Service Card (click it)
       └── Tabs at top: [Deployments] [Metrics] [Variables] [Settings]
           └── Click [Settings]
               └── Scroll to "Source" or "Build" section
                   └── Field: "Root Directory" (or "Watch Paths")
                       └── Enter: backend
                       └── Changes save automatically or click "Update"
```

If you still can't find it, Railway's UI changes frequently. Try:
- Looking for "Build" or "Source" sections
- Checking the service's dropdown menu (three dots)
- Searching Railway's docs for "monorepo" or "root directory"

### ⚠️ 2.1.1 Important: Data Persistence

The app stores two types of data that will be **lost on container restarts** without proper setup:

1. **Leaderboard data** (`data/leaderboard.db`) - SQLite database tracking popular individuals/colleges
2. **Search analytics** (`data/search_analytics.json`) - Search history and trending queries

**Options:**

**Option A: Accept Data Loss (Simplest)**
- Leaderboard and analytics reset on each deployment
- Acceptable for testing/MVP
- No setup required

**Option B: Use Railway Volume (Recommended for Production)**
1. In Railway dashboard, go to project settings
2. Click **"Add Volume"**
3. Mount path: `/app/persistent`
4. This persists `leaderboard.db` and `search_analytics.json` across deployments
5. Note: `/app/data` contains read-only embeddings and should NOT be mounted

**Option C: Use External Database**
- Use Railway PostgreSQL addon
- Requires code changes to use PostgreSQL instead of SQLite
- Most robust but more complex

### 2.3 Set Environment Variables

In Railway dashboard, go to **"Variables"** tab and add:

```bash
JWT_SECRET=your-random-secret-key-here-make-it-long-and-secure
FRONTEND_URL=https://your-domain.vercel.app
BACKEND_URL=https://your-project.up.railway.app
OPENAI_API_KEY=your-openai-api-key-here
DISABLE_MODERATION=false
DEV_MODE=false
```

**Notes:**
- `EMBEDDINGS_PATH` is optional - the app will automatically find the embeddings file
- `OPENAI_API_KEY`: **Required** for content moderation - Get from https://platform.openai.com/api-keys
  - Uses GPT-4o-mini (~$0.15 per 1M input tokens, very cheap)
  - Without this, set `DISABLE_MODERATION=true` (not recommended for production)
- `DISABLE_MODERATION`: Set to `false` in production to enable content filtering
- `DEV_MODE`: Set to `false` in production to require Yale CAS authentication
- `JWT_SECRET`: Generate with `python -c "import secrets; print(secrets.token_urlsafe(32))"`

Generate a secure JWT secret:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2.4 Get Backend URL

After deployment succeeds:
1. Go to **"Settings"** tab
2. Under **"Domains"**, you'll see your Railway URL
3. Copy it (format: `https://your-project.up.railway.app`)

## Step 3: Register with Yale ITS

### 3.1 Contact Yale ITS

**IMPORTANT:** You must register your app with Yale ITS to use CAS authentication.

1. Email: [its.security@yale.edu](mailto:its.security@yale.edu)
2. Subject: "CAS Application Registration - Yalie Search"
3. Include:
   - App name: Yalie Search
   - App description: AI-powered semantic search for Yalies
   - Callback URL: `https://your-backend.up.railway.app/api/auth/callback`
   - NetID: Your NetID
   - Purpose: Student project

### 3.2 Wait for Approval

Yale ITS will:
- Review your request
- May ask questions about data usage and privacy
- Provide final approval and any specific requirements

**Note:** Without ITS approval, CAS authentication won't work in production.

## Step 4: Deploy Frontend to Vercel

### 4.1 Sign Up & Import Project

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (free tier: unlimited)
3. Click **"Add New Project"**
4. Import your `yalie-search` repository
5. Vercel will auto-detect Next.js

### 4.2 Configure Build Settings

**If using monorepo (Option A):**
1. During import, Vercel will ask for **Framework Preset** → Select "Next.js"
2. **Root Directory:** Set to `frontend` (there's a dropdown/input field)
3. **Build Command:** `npm run build` (auto-detected)
4. **Output Directory:** `.next` (auto-detected)

**If using separate repos (Option B):**
- Vercel auto-detects everything, just click "Deploy"!

### 4.3 Set Environment Variables

In Vercel project settings, add:

```bash
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
```

### 4.4 Deploy

Click **"Deploy"** and wait for build to complete.

### 4.5 Get Frontend URL

After deployment:
- Vercel provides a URL: `https://your-project.vercel.app`
- Copy this URL

### 4.6 Update Backend CORS

Go back to Railway and update `FRONTEND_URL` to your Vercel URL:

```bash
FRONTEND_URL=https://your-project.vercel.app
```

## Step 5: Custom Domain (Optional)

### 5.1 Buy Domain

Purchase `yaliesearch.com` from:
- Namecheap (~$12/year)
- GoDaddy
- Cloudflare

### 5.2 Configure Domain in Vercel

1. In Vercel project, go to **"Settings" → "Domains"**
2. Add your domain: `yaliesearch.com`
3. Vercel will provide DNS records to add

### 5.3 Update DNS

In your domain registrar:
1. Add Vercel's DNS records (usually A and CNAME records)
2. Wait for propagation (5-30 minutes)

### 5.4 Update Environment Variables

Update both Railway (backend) and Vercel (frontend) to use your custom domain:

**Railway:**
```bash
FRONTEND_URL=https://yaliesearch.com
```

**Vercel:**
```bash
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
```

### 5.5 Update CAS Registration

Email Yale ITS to update your callback URL:
```
https://your-backend.up.railway.app/api/auth/callback
```

## Step 6: Testing

### 6.1 Test Authentication

1. Visit your site: `https://yaliesearch.com`
2. Click **"Sign in with Yale CAS"**
3. Should redirect to Yale CAS login
4. After login, should redirect back with auth token
5. Should see your NetID in header
6. **Welcome modal** should appear with user guide (can be dismissed with "Don't show again")

### 6.2 Test Search Features

**Basic Search:**
1. Try searching: "person with glasses"
2. Should return 20 results
3. Check match scores and images load correctly

**Filters:**
1. Click "filters" dropdown below search bar
2. Select a college, year, or major
3. Search results should be filtered accordingly

**Find Similar:**
1. Click "Find Similar" button on any result card
2. Should show 20 people who look similar

**Contact:**
1. Click "Contact" button on a result card
2. Should copy email to clipboard and show "Email copied" toast

### 6.3 Test Content Moderation

1. Try searching inappropriate content (e.g., "ugliest person")
2. Should be blocked with content policy message
3. Try neutral descriptors (e.g., "asian person") - should work fine

### 6.4 Test Leaderboard

1. Click "Leaderboard" tab in header
2. View "Top People" - shows individuals appearing in most unique searches
3. View "Top Colleges" - shows colleges by member appearances
4. College logos should display correctly

### 6.5 Test History & Anonymous Mode

**Search History:**
1. Make a few searches
2. Click in search bar - history dropdown should appear below
3. Click a history item to re-search

**Anonymous Mode:**
1. Toggle "Anonymous Mode" in top right
2. Make searches - they won't be logged to analytics or leaderboard
3. Toggle off to resume normal tracking

### 6.6 Test Trending Searches

1. On initial page load, see "Trending Searches" section
2. Click time period buttons (day/week/month/all)
3. Click a trending query to search it

### 6.7 Test Logout

1. Click logout button
2. Should redirect to CAS logout
3. Then back to your site's login page

## Step 7: Monitoring & Maintenance

### 7.1 Railway Monitoring

- Check logs for errors: Railway dashboard → "Logs"
- Monitor usage: Railway dashboard → "Metrics"
- Free tier: 500 hours/month (enough for ~20 days of continuous running)

### 7.2 Vercel Monitoring

- Check deployments: Vercel dashboard → "Deployments"
- View analytics: Vercel dashboard → "Analytics"
- Free tier: Unlimited (but has bandwidth limits)

### 7.3 Updating the App

To deploy updates:

```bash
# Make changes to code
git add .
git commit -m "Your update message"
git push

# Both Railway and Vercel auto-deploy from GitHub!
```

## Troubleshooting

### CAS Authentication Fails

**Problem:** Redirect loop or "401 Unauthorized"

**Solutions:**
1. Check environment variables are set correctly
2. Verify callback URL matches what you registered with ITS
3. Check Railway logs for errors
4. Ensure CORS is configured for your frontend URL

### Search Returns 401

**Problem:** "Not authenticated" error when searching

**Solutions:**
1. Check JWT_SECRET is set in Railway
2. Verify auth token is being sent in request headers
3. Check browser console for errors
4. Clear browser cache and try again

### Images Not Loading

**Problem:** Result images show broken/don't load

**Solutions:**
1. Check Next.js image configuration in `next.config.js`
2. Verify image URLs in embeddings file are valid
3. Check Vercel logs for errors

### Backend Crashes

**Problem:** Railway service keeps restarting

**Solutions:**
1. Check Railway logs for Python errors
2. Verify embeddings file is in correct location
3. Ensure all dependencies in `requirements.txt` are installed
4. Check memory usage (free tier has limits)

### Leaderboard Always Loading

**Problem:** Leaderboard tab shows perpetual loading

**Solutions:**
1. Check backend logs for SQLite errors
2. Verify `data/` directory has write permissions
3. Check if SQLite database was created successfully
4. Try a test search first to populate some data

### Content Moderation Blocking Valid Searches

**Problem:** Legitimate searches get blocked

**Solutions:**
1. Check OpenAI API key is set correctly
2. Review moderation prompt in `backend/moderation.py`
3. Temporarily set `DISABLE_MODERATION=true` for testing
4. Check backend logs for moderation API errors

### Search History Not Appearing

**Problem:** History dropdown is empty

**Solutions:**
1. Check browser localStorage is enabled
2. Verify searches were successful (not blocked)
3. Make sure Anonymous Mode is OFF
4. Clear browser cache and try again

### Contact Button Not Working

**Problem:** Email doesn't copy to clipboard

**Solutions:**
1. Check browser permissions for clipboard access
2. Try on HTTPS (clipboard API requires secure context)
3. Check browser console for errors
4. Verify person has email in dataset

### Railway Can't Find Backend Files

**Problem:** Railway deploys but says "No Dockerfile found" or builds the wrong directory

**Solutions:**
1. Make sure you set **Root Directory** to `backend` in Settings
2. Check that `backend/Dockerfile` exists in your repo
3. Verify `backend/railway.toml` is committed to git
4. Try redeploying after setting root directory
5. Check Railway logs for build errors

**Alternative Solution - Split into Separate Repos:**
If Railway continues having issues with the monorepo:
1. Create a new repo just for backend
2. Copy `backend/` folder contents to root of new repo
3. Deploy the new repo to Railway
4. Keep original repo for frontend on Vercel

## Cost Breakdown

### Free Tier (Recommended for MVP)

- **Domain:** $12/year (optional)
- **Railway:** Free (500 hours/month, $5 credit)
- **Vercel:** Free (unlimited)
- **OpenAI API:** ~$0.50-2/month for moderation (GPT-4o-mini is very cheap)
  - Based on ~1,000-5,000 searches/month
  - Can set usage limits in OpenAI dashboard
- **Total first year:** ~$12-36 (with domain) or ~$6-24 (without domain)

### If You Exceed Free Tiers

- **Railway:** $5-20/month (pay for what you use)
- **Vercel:** Typically stays free unless huge traffic
- **OpenAI:** Scales with usage, ~$0.15 per 1M tokens
- **Total:** ~$72-264/year + domain

## Security Considerations

### Production Checklist

- [ ] JWT_SECRET is strong and random (32+ characters)
- [ ] CORS is restricted to your domain only
- [ ] CAS is properly configured and approved by Yale ITS
- [ ] Environment variables are not in git
- [ ] Embeddings file is securely stored
- [ ] HTTPS is enabled (automatic with Vercel/Railway)

### Data Privacy

**What's Stored:**
- **Search analytics** - Query text, timestamp, NetID (for trending searches)
- **Leaderboard data** - Which people appear in searches (aggregated, no personal search data)
- **Search history** - Stored locally in browser only (localStorage), not on server

**What's NOT Stored:**
- Passwords (authentication via Yale CAS)
- Search results (only query text logged)
- User profiles or personal info beyond NetID

**Anonymous Mode:**
- Users can enable Anonymous Mode to prevent logging
- Searches in anonymous mode don't contribute to analytics or leaderboard

**Data Persistence:**
- Analytics and leaderboard data stored in backend
- Without Railway Volume: Data resets on each deployment
- With Railway Volume: Data persists indefinitely

**Access Control:**
- Yale only:** Restricted to Yale NetIDs via CAS
- **Read-only embeddings:** App only reads face data, doesn't modify it

## Support

### Need Help?

1. **Yale ITS:** For CAS authentication issues
2. **Railway:** [railway.app/help](https://railway.app/help)
3. **Vercel:** [vercel.com/support](https://vercel.com/support)

### Useful Links

- [Railway Docs](https://docs.railway.app/)
- [Vercel Docs](https://vercel.com/docs)
- [Yale CAS Documentation](https://developers.yale.edu/cas)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## Quick Reference

### Environment Variables Summary

**Backend (Railway):**
```bash
JWT_SECRET=<random-secret>
OPENAI_API_KEY=<your-openai-key>
FRONTEND_URL=<your-frontend-url>
BACKEND_URL=<your-backend-url>
DISABLE_MODERATION=false
DEV_MODE=false
# EMBEDDINGS_PATH is optional - auto-detected
```

**Frontend (Vercel):**
```bash
NEXT_PUBLIC_API_URL=<your-backend-url>
```

### Key URLs

- **Local Backend:** http://localhost:8000
- **Local Frontend:** http://localhost:3000
- **Production Backend:** https://your-project.up.railway.app
- **Production Frontend:** https://your-project.vercel.app
- **Custom Domain:** https://yaliesearch.com
- **Yale CAS:** https://secure.its.yale.edu/cas

---

**Good luck with your deployment! 🚀**

