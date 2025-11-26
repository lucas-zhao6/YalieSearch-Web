# Yalie Search - Deployment Guide

Complete step-by-step guide to deploy Yalie Search to production with Yale CAS authentication.

## Prerequisites

- [ ] GitHub account
- [ ] Yale NetID (not required for local testing with DEV_MODE)
- [ ] Domain name (optional but recommended: `yaliesearch.com`)
- [ ] `yalie_embedding.json` file (~71MB)

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

### 1.1 Push to GitHub

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
6. Select the `backend` directory

### 2.2 Set Environment Variables

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
- `OPENAI_API_KEY`: Get from https://platform.openai.com/api-keys (required for content moderation)
- `DISABLE_MODERATION`: Set to `false` in production to enable content filtering
- `DEV_MODE`: Set to `false` in production to require Yale CAS authentication

Generate a secure JWT secret:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2.3 Get Backend URL

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

1. **Root Directory:** Set to `frontend`
2. **Build Command:** `npm run build` (default)
3. **Output Directory:** `.next` (default)

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

### 6.2 Test Search

1. Try searching: "person with glasses"
2. Should return 20 results
3. Check match scores and images load correctly

### 6.3 Test Logout

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

## Cost Breakdown

### Free Tier (Recommended for MVP)

- **Domain:** $12/year (one-time)
- **Railway:** Free (500 hours/month, $5 credit)
- **Vercel:** Free (unlimited)
- **Total first year:** ~$12

### If You Exceed Free Tiers

- **Railway:** $5-20/month (pay for what you use)
- **Vercel:** Typically stays free unless huge traffic
- **Total:** ~$60-240/year + domain

## Security Considerations

### Production Checklist

- [ ] JWT_SECRET is strong and random (32+ characters)
- [ ] CORS is restricted to your domain only
- [ ] CAS is properly configured and approved by Yale ITS
- [ ] Environment variables are not in git
- [ ] Embeddings file is securely stored
- [ ] HTTPS is enabled (automatic with Vercel/Railway)

### Data Privacy

- **No data collection:** App doesn't store searches or user activity
- **CAS only:** Authentication via Yale CAS, no passwords stored
- **Read-only:** App only reads embeddings, doesn't modify data
- **Yale only:** Restricted to Yale NetIDs via CAS

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

