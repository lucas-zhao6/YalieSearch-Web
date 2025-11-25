"""
Yalie Search API - FastAPI Backend
"""

import os
from fastapi import FastAPI, Query, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from contextlib import asynccontextmanager
import urllib.parse
import requests

from search import initialize, search, get_total_count
from auth import (
    get_current_user, 
    create_access_token, 
    get_cas_login_url, 
    get_cas_logout_url,
    CAS_SERVER,
    FRONTEND_URL,
    BACKEND_URL
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize search module on startup."""
    print("Starting Yalie Search API...")
    initialize()
    print("API ready!")
    yield
    print("Shutting down...")


app = FastAPI(
    title="Yalie Search API",
    description="Search for Yale students by description using CLIP embeddings",
    version="1.0.0",
    lifespan=lifespan
)

# CORS for frontend
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Add production frontend URL if set
if FRONTEND_URL and FRONTEND_URL not in allowed_origins:
    allowed_origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "total_people": get_total_count()}


@app.get("/api/auth/login")
async def login():
    """Initiate Yale CAS login."""
    service_url = f"{BACKEND_URL}/api/auth/callback"
    cas_url = get_cas_login_url(service_url)
    return {"login_url": cas_url}


@app.get("/api/auth/callback")
async def auth_callback(ticket: str = Query(...)):
    """
    CAS callback endpoint - validates ticket and creates session.
    """
    try:
        # Validate ticket with CAS server
        service_url = f"{BACKEND_URL}/api/auth/callback"
        validate_url = f"{CAS_SERVER}/serviceValidate?ticket={ticket}&service={urllib.parse.quote(service_url)}"
        
        response = requests.get(validate_url, timeout=10)
        response.raise_for_status()
        
        # Parse CAS response (XML)
        # For simplicity, we'll do basic string parsing
        # In production, use proper XML parser
        if "cas:authenticationSuccess" in response.text:
            # Extract netid from response
            import re
            match = re.search(r'<cas:user>(.*?)</cas:user>', response.text)
            if match:
                netid = match.group(1)
                
                # Create JWT token
                token = create_access_token(netid)
                
                # Redirect to frontend with token
                redirect_url = f"{FRONTEND_URL}?auth_token={token}"
                return RedirectResponse(url=redirect_url)
        
        # Authentication failed
        raise HTTPException(status_code=401, detail="CAS authentication failed")
        
    except Exception as e:
        print(f"Auth callback error: {e}")
        raise HTTPException(status_code=500, detail="Authentication error")


@app.get("/api/auth/logout")
async def logout():
    """Logout and redirect to CAS logout."""
    cas_logout = get_cas_logout_url(FRONTEND_URL)
    return {"logout_url": cas_logout}


@app.get("/api/auth/user")
async def get_user(netid: str = Depends(get_current_user)):
    """Get current authenticated user info."""
    return {
        "netid": netid,
        "authenticated": True
    }


@app.get("/api/search")
async def search_endpoint(
    q: str = Query(..., description="Search query"),
    k: int = Query(10, ge=1, le=50, description="Number of results"),
    netid: str = Depends(get_current_user)
):
    """
    Search for people matching the description.
    Requires authentication.
    
    - **q**: Text description (e.g., "person with glasses and dark hair")
    - **k**: Number of results to return (1-50, default 10)
    """
    print(f"Search by {netid}: {q}")
    results = search(q, k=k)
    return {
        "query": q,
        "count": len(results),
        "results": results
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
