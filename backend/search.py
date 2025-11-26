"""
Search module for Yalie Search Web App
Adapted from yalie_search_cli/testing_results.py
"""

import os
import json
import hashlib
import time
from typing import Optional, List, Dict, Any
import numpy as np
import torch
from transformers import AutoTokenizer, CLIPTextModelWithProjection
from pathlib import Path

#-------------------------------------------------------------------------#
# Configuration
#-------------------------------------------------------------------------#

default_paths = [
    Path(__file__).parent / "data" / "yalie_embedding.json",
    Path(__file__).parent.parent.parent / "yalie_search_cli" / "yalie_embedding.json",
]

EMBEDDINGS_PATH = os.environ.get("EMBEDDINGS_PATH")
if not EMBEDDINGS_PATH:
    for path in default_paths:
        if path.exists():
            EMBEDDINGS_PATH = str(path)
            break
    else:
        EMBEDDINGS_PATH = str(default_paths[0])

CACHE_TTL_SECONDS = 300
CACHE_MAX_SIZE = 100

#-------------------------------------------------------------------------#
# Device Setup
#-------------------------------------------------------------------------#

if torch.backends.mps.is_available():
    device = "mps"
elif torch.cuda.is_available():
    device = "cuda"
else:
    device = "cpu"

print(f"Search module using device: {device}")

#-------------------------------------------------------------------------#
# Cached Model and Embeddings
#-------------------------------------------------------------------------#

_model = None
_tokenizer = None
_yalies = None
_yalies_by_id = None
_embeddings_normalized = None
_initialized = False

_filter_options = {
    "colleges": [],
    "years": [],
    "majors": []
}

_search_cache: Dict[str, Dict[str, Any]] = {}


def initialize():
    """Initialize model and embeddings."""
    global _model, _tokenizer, _yalies, _yalies_by_id
    global _embeddings_normalized, _initialized, _filter_options
    
    if _initialized:
        return
    
    print("Initializing search module...")
    
    print("Loading CLIP text model...")
    _model = CLIPTextModelWithProjection.from_pretrained(
        "openai/clip-vit-large-patch14"
    )
    
    if device in ("mps", "cuda"):
        _model = _model.half()
    
    _model = _model.to(device)
    _model.eval()
    
    _tokenizer = AutoTokenizer.from_pretrained("openai/clip-vit-large-patch14")
    print("Model loaded!")
    
    print(f"Loading embeddings from {EMBEDDINGS_PATH}...")
    with open(EMBEDDINGS_PATH, 'r') as f:
        _yalies = json.load(f)
    
    embeddings = np.array([y['embedding'] for y in _yalies], dtype=np.float32)
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    _embeddings_normalized = embeddings / norms
    
    _yalies_by_id = {}
    for idx, yalie in enumerate(_yalies):
        yalie_id = yalie.get("id") or yalie.get("netid")
        if yalie_id:
            _yalies_by_id[yalie_id] = idx
    
    colleges = set()
    years = set()
    majors = set()
    
    for yalie in _yalies:
        if yalie.get("college"):
            colleges.add(yalie["college"])
        if yalie.get("year"):
            years.add(yalie["year"])
        if yalie.get("major"):
            majors.add(yalie["major"])
    
    _filter_options["colleges"] = sorted(list(colleges))
    _filter_options["years"] = sorted(list(years), reverse=True)
    _filter_options["majors"] = sorted(list(majors))
    
    print(f"Loaded {len(_yalies)} embeddings!")
    _initialized = True


def _get_cache_key(query: str, k: int, college: Optional[str], 
                   year: Optional[int], major: Optional[str]) -> str:
    key_str = f"{query.lower().strip()}|{k}|{college or ''}|{year or ''}|{major or ''}"
    return hashlib.md5(key_str.encode()).hexdigest()


def _get_from_cache(cache_key: str) -> Optional[List[Dict[str, Any]]]:
    if cache_key in _search_cache:
        cached = _search_cache[cache_key]
        if time.time() - cached["timestamp"] < CACHE_TTL_SECONDS:
            return cached["results"]
        else:
            del _search_cache[cache_key]
    return None


def _set_cache(cache_key: str, results: List[Dict[str, Any]]):
    if len(_search_cache) >= CACHE_MAX_SIZE:
        oldest_key = min(_search_cache.keys(), 
                         key=lambda k: _search_cache[k]["timestamp"])
        del _search_cache[oldest_key]
    
    _search_cache[cache_key] = {
        "results": results,
        "timestamp": time.time()
    }


def search(
    query: str, 
    k: int = 10,
    college: Optional[str] = None,
    year: Optional[int] = None,
    major: Optional[str] = None,
    use_cache: bool = True
) -> List[Dict[str, Any]]:
    """Search for top-k similar faces given a text query."""
    if not _initialized:
        initialize()
    
    cache_key = _get_cache_key(query, k, college, year, major)
    if use_cache:
        cached_results = _get_from_cache(cache_key)
        if cached_results is not None:
            return cached_results
    
    inputs = _tokenizer(query, padding=True, return_tensors="pt")
    inputs = {key: val.to(device) for key, val in inputs.items()}
    
    with torch.inference_mode():
        outputs = _model(**inputs)
    
    query_vector = outputs.text_embeds.float().cpu().squeeze().numpy()
    query_norm = query_vector / np.linalg.norm(query_vector)
    
    similarities = np.dot(_embeddings_normalized, query_norm)
    
    if college or year or major:
        filter_mask = np.ones(len(_yalies), dtype=bool)
        for idx, yalie in enumerate(_yalies):
            if college and yalie.get("college") != college:
                filter_mask[idx] = False
            if year and yalie.get("year") != year:
                filter_mask[idx] = False
            if major and yalie.get("major") != major:
                filter_mask[idx] = False
        
        filtered_similarities = np.where(filter_mask, similarities, -np.inf)
        top_indices = np.argsort(filtered_similarities)[::-1][:k]
    else:
        top_indices = np.argsort(similarities)[::-1][:k]
    
    results = []
    for idx in top_indices:
        if similarities[idx] == -np.inf:
            continue
        
        yalie = _yalies[idx]
        results.append({
            "id": yalie.get("id") or yalie.get("netid"),
            "first_name": yalie.get("first_name", ""),
            "last_name": yalie.get("last_name", ""),
            "image": yalie.get("image"),
            "college": yalie.get("college"),
            "year": yalie.get("year"),
            "major": yalie.get("major"),
            "email": yalie.get("email"),
            "score": float(similarities[idx])
        })
    
    if use_cache:
        _set_cache(cache_key, results)
    
    return results


def find_similar(person_id: str, k: int = 10) -> List[Dict[str, Any]]:
    """Find people with similar faces to a given person."""
    if not _initialized:
        initialize()
    
    # Try to find the person by ID (could be int or string)
    lookup_id = person_id
    if person_id not in _yalies_by_id:
        # Try converting to int (IDs from yalies API are integers)
        try:
            lookup_id = int(person_id)
        except ValueError:
            pass
    
    if lookup_id not in _yalies_by_id:
        return []
    
    person_idx = _yalies_by_id[lookup_id]
    person_embedding = _embeddings_normalized[person_idx]
    
    similarities = np.dot(_embeddings_normalized, person_embedding)
    top_indices = np.argsort(similarities)[::-1][:k+1]
    
    results = []
    for idx in top_indices:
        if idx == person_idx:
            continue
        
        yalie = _yalies[idx]
        results.append({
            "id": yalie.get("id") or yalie.get("netid"),
            "first_name": yalie.get("first_name", ""),
            "last_name": yalie.get("last_name", ""),
            "image": yalie.get("image"),
            "college": yalie.get("college"),
            "year": yalie.get("year"),
            "major": yalie.get("major"),
            "email": yalie.get("email"),
            "score": float(similarities[idx])
        })
        
        if len(results) >= k:
            break
    
    return results


def get_person_by_id(person_id: str) -> Optional[Dict[str, Any]]:
    """Get a person's info by their ID."""
    if not _initialized:
        initialize()
    
    # Try to find the person by ID (could be int or string)
    lookup_id = person_id
    if person_id not in _yalies_by_id:
        try:
            lookup_id = int(person_id)
        except ValueError:
            pass
    
    if lookup_id not in _yalies_by_id:
        return None
    
    idx = _yalies_by_id[lookup_id]
    yalie = _yalies[idx]
    
    return {
        "id": yalie.get("id") or yalie.get("netid"),
        "first_name": yalie.get("first_name", ""),
        "last_name": yalie.get("last_name", ""),
        "image": yalie.get("image"),
        "college": yalie.get("college"),
        "year": yalie.get("year"),
        "major": yalie.get("major"),
        "email": yalie.get("email"),
    }


def get_filter_options() -> Dict[str, List]:
    """Get available filter options."""
    if not _initialized:
        initialize()
    return _filter_options


def get_total_count():
    """Get total number of people in the database."""
    if not _initialized:
        initialize()
    return len(_yalies)


def get_cache_stats() -> Dict[str, Any]:
    """Get cache statistics."""
    return {
        "size": len(_search_cache),
        "max_size": CACHE_MAX_SIZE,
        "ttl_seconds": CACHE_TTL_SECONDS
    }


def clear_cache():
    """Clear the search cache."""
    global _search_cache
    _search_cache = {}
