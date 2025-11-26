"""
Analytics module for tracking search queries and generating trending data.
Uses a simple JSON file for lightweight persistence.
"""

import os
import json
import time
from typing import List, Dict, Any, Optional
from pathlib import Path
from collections import Counter
from datetime import datetime, timedelta
import threading

#-------------------------------------------------------------------------#
# Configuration
#-------------------------------------------------------------------------#

# Use separate directory for writable persistent data
# This allows /app/data to be read-only (embeddings) and /app/persistent to be mounted volume
PERSISTENT_DIR = Path(__file__).parent / "persistent"
ANALYTICS_FILE = PERSISTENT_DIR / "search_analytics.json"

# Ensure persistent directory exists
PERSISTENT_DIR.mkdir(exist_ok=True)

# Lock for thread-safe file operations
_file_lock = threading.Lock()

#-------------------------------------------------------------------------#
# Data Structure
#-------------------------------------------------------------------------#

# Analytics data structure:
# {
#   "searches": [
#     {"query": "...", "timestamp": 1234567890, "user": "netid", "count": 5},
#     ...
#   ]
# }

_analytics_data: Dict[str, List] = {"searches": []}
_loaded = False


def _load_analytics():
    """Load analytics data from file."""
    global _analytics_data, _loaded
    
    if _loaded:
        return
    
    with _file_lock:
        if ANALYTICS_FILE.exists():
            try:
                with open(ANALYTICS_FILE, 'r') as f:
                    _analytics_data = json.load(f)
            except (json.JSONDecodeError, IOError):
                _analytics_data = {"searches": []}
        else:
            _analytics_data = {"searches": []}
        
        _loaded = True


def _save_analytics():
    """Save analytics data to file."""
    with _file_lock:
        with open(ANALYTICS_FILE, 'w') as f:
            json.dump(_analytics_data, f)


def log_search(query: str, user: Optional[str] = None, result_count: int = 0):
    """
    Log a search query.
    
    Args:
        query: The search query text
        user: The user's netid (optional, None for anonymous)
        result_count: Number of results returned
    """
    _load_analytics()
    
    entry = {
        "query": query.strip().lower(),
        "timestamp": time.time(),
        "user": user,
        "count": result_count
    }
    
    _analytics_data["searches"].append(entry)
    
    # Periodically save (every 10 searches)
    if len(_analytics_data["searches"]) % 10 == 0:
        _save_analytics()


def get_trending_searches(
    period: str = "week",
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Get trending/popular search queries.
    
    Args:
        period: Time period - "day", "week", "month", or "all"
        limit: Maximum number of results
    
    Returns:
        List of dicts with query and count
    """
    _load_analytics()
    
    # Calculate cutoff timestamp
    now = time.time()
    if period == "day":
        cutoff = now - (24 * 60 * 60)
    elif period == "week":
        cutoff = now - (7 * 24 * 60 * 60)
    elif period == "month":
        cutoff = now - (30 * 24 * 60 * 60)
    else:  # all time
        cutoff = 0
    
    # Filter searches by time period
    filtered_searches = [
        s for s in _analytics_data["searches"]
        if s["timestamp"] >= cutoff
    ]
    
    # Count queries
    query_counts = Counter(s["query"] for s in filtered_searches)
    
    # Get top queries
    top_queries = query_counts.most_common(limit)
    
    return [
        {"query": query, "count": count}
        for query, count in top_queries
    ]


def get_popular_colleges(limit: int = 10) -> List[Dict[str, Any]]:
    """
    Get most searched colleges based on filter usage.
    Note: This requires tracking filter selections, which we'll add later.
    For now, returns empty list.
    """
    return []


def get_search_stats() -> Dict[str, Any]:
    """Get overall search statistics."""
    _load_analytics()
    
    total_searches = len(_analytics_data["searches"])
    
    # Unique queries
    unique_queries = len(set(s["query"] for s in _analytics_data["searches"]))
    
    # Searches in last 24 hours
    day_ago = time.time() - (24 * 60 * 60)
    recent_searches = sum(
        1 for s in _analytics_data["searches"]
        if s["timestamp"] >= day_ago
    )
    
    # Unique users (excluding anonymous)
    unique_users = len(set(
        s["user"] for s in _analytics_data["searches"]
        if s["user"]
    ))
    
    return {
        "total_searches": total_searches,
        "unique_queries": unique_queries,
        "searches_last_24h": recent_searches,
        "unique_users": unique_users
    }


def flush():
    """Force save analytics data to disk."""
    _save_analytics()

