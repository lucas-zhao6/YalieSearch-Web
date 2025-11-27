"""
Analytics module for tracking search queries and generating trending data.
Uses a simple JSON file for lightweight persistence.
Includes semantic clustering for trending searches using CLIP embeddings.
"""

import os
import json
import time
from typing import List, Dict, Any, Optional
from pathlib import Path
from collections import Counter
from datetime import datetime, timedelta
import threading
import numpy as np

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


def _encode_query(query: str) -> Optional[List[float]]:
    """
    Encode query text using CLIP model for semantic similarity.
    Returns None if encoding fails.
    """
    try:
        # Import here to avoid circular dependency
        from search import _model, _tokenizer, device
        
        if _model is None or _tokenizer is None:
            return None
        
        # Tokenize and encode
        import torch
        inputs = _tokenizer(
            [query],
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=77
        ).to(device)
        
        with torch.no_grad():
            embedding = _model(**inputs).text_embeds[0]
            # Normalize
            embedding = embedding / embedding.norm()
            return embedding.cpu().tolist()
    except Exception as e:
        print(f"Failed to encode query '{query}': {e}")
        return None


def log_search(query: str, user: Optional[str] = None, result_count: int = 0):
    """
    Log a search query with cached embedding for semantic clustering.
    
    Args:
        query: The search query text
        user: The user's netid (optional, None for anonymous)
        result_count: Number of results returned
    """
    _load_analytics()
    
    normalized_query = query.strip().lower()
    
    # Encode query for semantic similarity (cached for trending clustering)
    embedding = _encode_query(query)
    
    entry = {
        "query": normalized_query,
        "timestamp": time.time(),
        "user": user,
        "count": result_count,
    }
    
    # Only add embedding if encoding succeeded
    if embedding is not None:
        entry["embedding"] = embedding
    
    _analytics_data["searches"].append(entry)
    
    # Periodically save (every 10 searches)
    if len(_analytics_data["searches"]) % 10 == 0:
        _save_analytics()


def _cluster_similar_queries(
    queries: List[str],
    embeddings: List[List[float]],
    counts: Dict[str, int],
    similarity_threshold: float = 0.75
) -> List[Dict[str, Any]]:
    """
    Cluster semantically similar queries and aggregate their counts.
    
    Args:
        queries: List of unique query strings
        embeddings: List of embedding vectors (same order as queries)
        counts: Dict mapping query to count
        similarity_threshold: Cosine similarity threshold for clustering (default 0.75)
    
    Returns:
        List of clusters with representative query and total count
    """
    if not queries or not embeddings:
        return []
    
    # Convert to numpy for faster computation
    embeddings_array = np.array(embeddings, dtype=np.float32)
    
    # Track which queries have been assigned to clusters
    assigned = set()
    clusters = []
    
    # Sort queries by count (descending) to prioritize popular queries as representatives
    sorted_queries = sorted(queries, key=lambda q: counts[q], reverse=True)
    
    for i, query in enumerate(sorted_queries):
        if query in assigned:
            continue
        
        # Start a new cluster with this query as representative
        cluster_queries = [query]
        cluster_count = counts[query]
        query_idx = queries.index(query)
        query_embedding = embeddings_array[query_idx]
        
        # Find similar queries
        for j, other_query in enumerate(queries):
            if other_query == query or other_query in assigned:
                continue
            
            # Compute cosine similarity
            other_embedding = embeddings_array[j]
            similarity = np.dot(query_embedding, other_embedding)
            
            if similarity >= similarity_threshold:
                cluster_queries.append(other_query)
                cluster_count += counts[other_query]
                assigned.add(other_query)
        
        assigned.add(query)
        
        clusters.append({
            "query": query,  # Representative query (most popular in cluster)
            "count": cluster_count,  # Total count across all similar queries
            "similar_queries": cluster_queries if len(cluster_queries) > 1 else []  # Show grouped queries
        })
    
    # Sort clusters by count
    clusters.sort(key=lambda c: c["count"], reverse=True)
    
    return clusters


def get_trending_searches(
    period: str = "week",
    limit: int = 10,
    use_clustering: bool = True
) -> List[Dict[str, Any]]:
    """
    Get trending/popular search queries with semantic clustering.
    
    Args:
        period: Time period - "day", "week", "month", or "all"
        limit: Maximum number of results
        use_clustering: If True, groups semantically similar queries (default True)
    
    Returns:
        List of dicts with query, count, and optionally similar_queries
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
    
    # If clustering disabled or no embeddings available, return simple counts
    if not use_clustering:
        top_queries = query_counts.most_common(limit)
        return [
            {"query": query, "count": count}
            for query, count in top_queries
        ]
    
    # Collect unique queries with embeddings
    queries_with_embeddings = {}
    for search in filtered_searches:
        query = search["query"]
        if "embedding" in search and query not in queries_with_embeddings:
            queries_with_embeddings[query] = search["embedding"]
    
    # If we have embeddings, cluster similar queries
    if queries_with_embeddings:
        queries = list(queries_with_embeddings.keys())
        embeddings = [queries_with_embeddings[q] for q in queries]
        
        clusters = _cluster_similar_queries(queries, embeddings, query_counts)
        
        # Return top N clusters
        return clusters[:limit]
    else:
        # Fallback to simple counting if no embeddings
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

