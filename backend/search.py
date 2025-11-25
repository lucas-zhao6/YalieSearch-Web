"""
Search module for Yalie Search Web App
Adapted from yalie_search_cli/testing_results.py
"""

import os
import json
import numpy as np
import torch
from transformers import AutoTokenizer, CLIPTextModelWithProjection
from pathlib import Path

#-------------------------------------------------------------------------#
# Configuration
#-------------------------------------------------------------------------#

# Path to the embedding file (relative to this file or absolute)
EMBEDDINGS_PATH = os.environ.get(
    "EMBEDDINGS_PATH", 
    str(Path(__file__).parent.parent.parent / "yalie_search_cli" / "yalie_embedding.json")
)

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
_embeddings_normalized = None
_initialized = False


def initialize():
    """Initialize model and embeddings. Call once at startup."""
    global _model, _tokenizer, _yalies, _embeddings_normalized, _initialized
    
    if _initialized:
        return
    
    print("Initializing search module...")
    
    # Load model
    print(f"Loading CLIP text model...")
    _model = CLIPTextModelWithProjection.from_pretrained("openai/clip-vit-large-patch14")
    
    if device in ("mps", "cuda"):
        _model = _model.half()
    
    _model = _model.to(device)
    _model.eval()
    
    _tokenizer = AutoTokenizer.from_pretrained("openai/clip-vit-large-patch14")
    print("Model loaded!")
    
    # Load embeddings
    print(f"Loading embeddings from {EMBEDDINGS_PATH}...")
    with open(EMBEDDINGS_PATH, 'r') as f:
        _yalies = json.load(f)
    
    embeddings = np.array([y['embedding'] for y in _yalies], dtype=np.float32)
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    _embeddings_normalized = embeddings / norms
    
    print(f"Loaded {len(_yalies)} embeddings!")
    _initialized = True


def search(query: str, k: int = 10):
    """
    Search for top-k similar faces given a text query.
    
    Args:
        query: Text description to search for
        k: Number of results to return
    
    Returns:
        List of dicts with person info and similarity score
    """
    if not _initialized:
        initialize()
    
    # Encode query
    inputs = _tokenizer(query, padding=True, return_tensors="pt")
    inputs = {key: val.to(device) for key, val in inputs.items()}
    
    with torch.inference_mode():
        outputs = _model(**inputs)
    
    query_vector = outputs.text_embeds.float().cpu().squeeze().numpy()
    query_norm = query_vector / np.linalg.norm(query_vector)
    
    # Compute similarities
    similarities = np.dot(_embeddings_normalized, query_norm)
    top_indices = np.argsort(similarities)[::-1][:k]
    
    # Build results
    results = []
    for idx in top_indices:
        yalie = _yalies[idx]
        results.append({
            "id": yalie.get("id") or yalie.get("netid"),
            "first_name": yalie.get("first_name", ""),
            "last_name": yalie.get("last_name", ""),
            "image": yalie.get("image"),
            "college": yalie.get("college"),
            "year": yalie.get("year"),
            "major": yalie.get("major"),
            "score": float(similarities[idx])
        })
    
    return results


def get_total_count():
    """Get total number of people in the database."""
    if not _initialized:
        initialize()
    return len(_yalies)

