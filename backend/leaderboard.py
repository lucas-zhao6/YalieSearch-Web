"""
Leaderboard Module
Tracks which people appear in search results and provides aggregated leaderboards.
Uses SQLite with WAL mode for concurrent access in production.
"""

import os
import sqlite3
import hashlib
import time
import threading
from typing import List, Dict, Any, Optional
from pathlib import Path

#-------------------------------------------------------------------------#
# Configuration
#-------------------------------------------------------------------------#

# Use separate directory for writable persistent data
# This allows /app/data to be read-only (embeddings) and /app/persistent to be mounted volume
PERSISTENT_DIR = Path(__file__).parent / "persistent"
DB_PATH = PERSISTENT_DIR / "leaderboard.db"

# Ensure persistent directory exists
PERSISTENT_DIR.mkdir(exist_ok=True)

# Thread-local storage for database connections
_local = threading.local()

#-------------------------------------------------------------------------#
# Database Setup
#-------------------------------------------------------------------------#

def _get_connection() -> sqlite3.Connection:
    """Get a thread-local database connection."""
    if not hasattr(_local, 'connection') or _local.connection is None:
        _local.connection = sqlite3.connect(
            str(DB_PATH),
            timeout=30.0,
            check_same_thread=False
        )
        _local.connection.row_factory = sqlite3.Row
        # Enable WAL mode for better concurrent access
        _local.connection.execute("PRAGMA journal_mode=WAL")
        _local.connection.execute("PRAGMA busy_timeout=30000")
    return _local.connection


def initialize_db():
    """Initialize the database schema."""
    conn = _get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS query_appearances (
            query_hash TEXT NOT NULL,
            person_id TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            image TEXT,
            college TEXT,
            year INTEGER,
            first_seen INTEGER NOT NULL,
            PRIMARY KEY (query_hash, person_id)
        )
    """)
    # Index for fast leaderboard queries
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_person_id 
        ON query_appearances(person_id)
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_college 
        ON query_appearances(college)
    """)
    conn.commit()
    print("Leaderboard database initialized")


def _normalize_query(query: str) -> str:
    """Normalize a query for deduplication."""
    return query.lower().strip()


def _hash_query(query: str) -> str:
    """Create a hash of the normalized query."""
    normalized = _normalize_query(query)
    return hashlib.md5(normalized.encode()).hexdigest()


#-------------------------------------------------------------------------#
# Recording Appearances
#-------------------------------------------------------------------------#

def record_appearances(query: str, results: List[Dict[str, Any]]) -> int:
    """
    Record which people appeared in search results for a query.
    Uses INSERT OR IGNORE to only count each query-person pair once.
    
    Args:
        query: The search query
        results: List of search result dicts with person info
        
    Returns:
        Number of new appearances recorded
    """
    if not results:
        return 0
    
    query_hash = _hash_query(query)
    timestamp = int(time.time())
    
    conn = _get_connection()
    cursor = conn.cursor()
    
    new_count = 0
    for result in results:
        person_id = str(result.get("id", ""))
        if not person_id:
            continue
        
        try:
            cursor.execute("""
                INSERT OR IGNORE INTO query_appearances 
                (query_hash, person_id, first_name, last_name, image, college, year, first_seen)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                query_hash,
                person_id,
                result.get("first_name", ""),
                result.get("last_name", ""),
                result.get("image"),
                result.get("college"),
                result.get("year"),
                timestamp
            ))
            if cursor.rowcount > 0:
                new_count += 1
        except sqlite3.Error as e:
            print(f"Error recording appearance: {e}")
    
    conn.commit()
    return new_count


#-------------------------------------------------------------------------#
# Leaderboard Queries
#-------------------------------------------------------------------------#

def get_individual_leaderboard(limit: int = 20) -> List[Dict[str, Any]]:
    """
    Get the top individuals by number of unique queries they appeared in.
    
    Args:
        limit: Maximum number of results
        
    Returns:
        List of dicts with person info and appearance count
    """
    conn = _get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            person_id,
            first_name,
            last_name,
            image,
            college,
            year,
            COUNT(DISTINCT query_hash) as appearance_count
        FROM query_appearances
        GROUP BY person_id
        ORDER BY appearance_count DESC, first_name ASC
        LIMIT ?
    """, (limit,))
    
    results = []
    for row in cursor.fetchall():
        results.append({
            "id": row["person_id"],
            "first_name": row["first_name"],
            "last_name": row["last_name"],
            "image": row["image"],
            "college": row["college"],
            "year": row["year"],
            "appearance_count": row["appearance_count"]
        })
    
    return results


def get_college_leaderboard() -> List[Dict[str, Any]]:
    """
    Get colleges ranked by total appearances of their members.
    
    Returns:
        List of dicts with college name, total appearances, and member count
    """
    conn = _get_connection()
    cursor = conn.cursor()
    
    # First get individual counts, then aggregate by college
    cursor.execute("""
        SELECT 
            college,
            SUM(person_appearances) as total_appearances,
            COUNT(DISTINCT person_id) as unique_members
        FROM (
            SELECT 
                person_id,
                college,
                COUNT(DISTINCT query_hash) as person_appearances
            FROM query_appearances
            WHERE college IS NOT NULL AND college != ''
            GROUP BY person_id, college
        )
        GROUP BY college
        ORDER BY total_appearances DESC
    """)
    
    results = []
    for row in cursor.fetchall():
        results.append({
            "college": row["college"],
            "total_appearances": row["total_appearances"],
            "unique_members": row["unique_members"]
        })
    
    return results


def get_stats() -> Dict[str, Any]:
    """Get overall leaderboard statistics."""
    conn = _get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(DISTINCT query_hash) as unique_queries FROM query_appearances")
    unique_queries = cursor.fetchone()["unique_queries"]
    
    cursor.execute("SELECT COUNT(DISTINCT person_id) as unique_people FROM query_appearances")
    unique_people = cursor.fetchone()["unique_people"]
    
    cursor.execute("SELECT COUNT(*) as total_appearances FROM query_appearances")
    total_appearances = cursor.fetchone()["total_appearances"]
    
    return {
        "unique_queries": unique_queries,
        "unique_people": unique_people,
        "total_appearances": total_appearances
    }


def clear_leaderboard():
    """Clear all leaderboard data. Use with caution."""
    conn = _get_connection()
    conn.execute("DELETE FROM query_appearances")
    conn.commit()


# Initialize database on module load
initialize_db()

