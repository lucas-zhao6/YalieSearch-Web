"""
Yalie Search API - FastAPI Backend
"""

import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI, Query, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from contextlib import asynccontextmanager
import urllib.parse
import requests

from search import (
    initialize, 
    search, 
    find_similar,
    get_person_by_id,
    get_filter_options,
    get_total_count,
    get_cache_stats
)
from auth import (
    get_current_user, 
    create_access_token, 
    get_cas_login_url, 
    get_cas_logout_url,
    CAS_SERVER,
    FRONTEND_URL,
    BACKEND_URL
)
from moderation import is_query_allowed
from analytics import (
    log_search,
    get_trending_searches,
    get_search_stats,
    flush as flush_analytics
)
from leaderboard import (
    record_appearances,
    get_individual_leaderboard,
    get_college_leaderboard,
    get_stats as get_leaderboard_stats
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize search module on startup."""
    print("Starting Yalie Search API...")
    initialize()
    print("API ready!")
    yield
    # Flush analytics on shutdown
    flush_analytics()
    print("Shutting down...")


app = FastAPI(
    title="Yalie Search API",
    description="Find Yalies using AI-powered semantic search with CLIP embeddings",
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


#-------------------------------------------------------------------------#
# Health & Info Endpoints
#-------------------------------------------------------------------------#

@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy", 
        "total_people": get_total_count(),
        "cache": get_cache_stats()
    }


@app.get("/api/filters")
async def get_filters():
    """Get available filter options for college, year, and major."""
    return get_filter_options()


#-------------------------------------------------------------------------#
# Authentication Endpoints
#-------------------------------------------------------------------------#

@app.get("/api/auth/login")
async def login():
    """Initiate Yale CAS login."""
    service_url = f"{BACKEND_URL}/api/auth/callback"
    cas_url = get_cas_login_url(service_url)
    return {"login_url": cas_url}


@app.get("/api/auth/callback")
async def auth_callback(ticket: str = Query(...)):
    """CAS callback endpoint - validates ticket and creates session."""
    try:
        service_url = f"{BACKEND_URL}/api/auth/callback"
        validate_url = (
            f"{CAS_SERVER}/serviceValidate?"
            f"ticket={ticket}&service={urllib.parse.quote(service_url)}"
        )
        
        response = requests.get(validate_url, timeout=10)
        response.raise_for_status()
        
        if "cas:authenticationSuccess" in response.text:
            import re
            match = re.search(r'<cas:user>(.*?)</cas:user>', response.text)
            if match:
                netid = match.group(1)
                token = create_access_token(netid)
                redirect_url = f"{FRONTEND_URL}?auth_token={token}"
                return RedirectResponse(url=redirect_url)
        
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


#-------------------------------------------------------------------------#
# Search Endpoints
#-------------------------------------------------------------------------#

@app.get("/api/search")
async def search_endpoint(
    q: str = Query(..., description="Search query"),
    k: int = Query(20, ge=1, le=50, description="Number of results"),
    college: Optional[str] = Query(None, description="Filter by college"),
    year: Optional[int] = Query(None, description="Filter by graduation year"),
    major: Optional[str] = Query(None, description="Filter by major"),
    anonymous: bool = Query(False, description="Don't log this search"),
    netid: str = Depends(get_current_user)
):
    """
    Search for people matching the description.
    Requires authentication.
    
    - **q**: Text description (e.g., "person with glasses and dark hair")
    - **k**: Number of results to return (1-50, default 20)
    - **college**: Filter by college name (optional)
    - **year**: Filter by graduation year (optional)
    - **major**: Filter by major (optional)
    - **anonymous**: If true, search is not logged for analytics
    """
    print(f"Search by {netid}: {q}")
    
    # Content moderation check
    is_allowed, reason = is_query_allowed(q)
    if not is_allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Query not allowed: {reason}"
        )
    
    results = search(q, k=k, college=college, year=year, major=major)
    
    # Log search for analytics (unless anonymous)
    if not anonymous:
        log_search(q, user=netid, result_count=len(results))
        # Record appearances for leaderboard
        record_appearances(q, results)
    
    return {
        "query": q,
        "count": len(results),
        "search_type": "text",
        "filters": {
            "college": college,
            "year": year,
            "major": major
        },
        "results": results
    }


@app.get("/api/similar/{person_id}")
async def similar_endpoint(
    person_id: str,
    k: int = Query(10, ge=1, le=50, description="Number of results"),
    netid: str = Depends(get_current_user)
):
    """
    Find people similar to a specific person.
    Requires authentication.
    
    - **person_id**: The ID of the person to find similar faces to
    - **k**: Number of results to return (1-50, default 10)
    """
    print(f"Find similar to {person_id} by {netid}")
    
    # Get person info
    person = get_person_by_id(person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    results = find_similar(person_id, k=k)
    
    return {
        "person": person,
        "count": len(results),
        "search_type": "similar",
        "results": results
    }


#-------------------------------------------------------------------------#
# Analytics/Trending Endpoints
#-------------------------------------------------------------------------#

@app.get("/api/trending")
async def trending_endpoint(
    period: str = Query("week", description="Time period: day, week, month, all"),
    limit: int = Query(10, ge=1, le=50, description="Number of results")
):
    """
    Get trending search queries.
    
    - **period**: Time period to analyze (day, week, month, all)
    - **limit**: Maximum number of results (1-50, default 10)
    """
    if period not in ("day", "week", "month", "all"):
        period = "week"
    
    trending = get_trending_searches(period=period, limit=limit)
    
    return {
        "period": period,
        "trending": trending
    }


@app.get("/api/stats")
async def stats_endpoint(netid: str = Depends(get_current_user)):
    """Get search statistics. Requires authentication."""
    return get_search_stats()


#-------------------------------------------------------------------------#
# Leaderboard Endpoints
#-------------------------------------------------------------------------#

@app.get("/api/leaderboard/individuals")
async def leaderboard_individuals_endpoint(
    limit: int = Query(20, ge=1, le=100, description="Number of results")
):
    """
    Get the individual leaderboard - people who appear most in search results.
    Each person is counted once per unique query they appear in.
    
    - **limit**: Maximum number of results (1-100, default 20)
    """
    individuals = get_individual_leaderboard(limit=limit)
    stats = get_leaderboard_stats()
    
    return {
        "leaderboard": individuals,
        "stats": stats
    }


@app.get("/api/leaderboard/colleges")
async def leaderboard_colleges_endpoint():
    """
    Get the college leaderboard - colleges ranked by total member appearances.
    Aggregates individual appearances by college.
    """
    colleges = get_college_leaderboard()
    stats = get_leaderboard_stats()
    
    return {
        "leaderboard": colleges,
        "stats": stats
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
