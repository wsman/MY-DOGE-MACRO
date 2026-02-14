"""
Vector Store Utils - Similarity Functions

Utility functions for vector operations and similarity calculations.
"""

import numpy as np
from typing import List, Union


def normalize_vector(vector: List[float]) -> List[float]:
    """
    Normalize a vector to unit length.
    
    Args:
        vector: Input vector
        
    Returns:
        Normalized vector
    """
    arr = np.array(vector, dtype=np.float32)
    norm = np.linalg.norm(arr)
    if norm == 0:
        return vector
    return (arr / norm).tolist()


def cosine_similarity(
    vec1: List[float],
    vec2: List[float]
) -> float:
    """
    Calculate cosine similarity between two vectors.
    
    Args:
        vec1: First vector
        vec2: Second vector
        
    Returns:
        Similarity score (0 to 1)
    """
    a = np.array(vec1, dtype=np.float32)
    b = np.array(vec2, dtype=np.float32)
    
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
    
    return float(np.dot(a, b) / (norm_a * norm_b))


def euclidean_distance(
    vec1: List[float],
    vec2: List[float]
) -> float:
    """
    Calculate Euclidean distance between two vectors.
    
    Args:
        vec1: First vector
        vec2: Second vector
        
    Returns:
        Distance (0 = identical, higher = more different)
    """
    a = np.array(vec1, dtype=np.float32)
    b = np.array(vec2, dtype=np.float32)
    return float(np.linalg.norm(a - b))


def dot_product(
    vec1: List[float],
    vec2: List[float]
) -> float:
    """
    Calculate dot product between two vectors.
    
    Args:
        vec1: First vector
        vec2: Second vector
        
    Returns:
        Dot product
    """
    a = np.array(vec1, dtype=np.float32)
    b = np.array(vec2, dtype=np.float32)
    return float(np.dot(a, b))


def batch_cosine_similarity(
    query: List[float],
    vectors: List[List[float]]
) -> List[float]:
    """
    Calculate cosine similarity between a query and multiple vectors.
    
    Args:
        query: Query vector
        vectors: List of vectors to compare against
        
    Returns:
        List of similarity scores
    """
    query_arr = np.array(query, dtype=np.float32)
    query_norm = np.linalg.norm(query_arr)
    
    if query_norm == 0:
        return [0.0] * len(vectors)
    
    query_normalized = query_arr / query_norm
    
    similarities = []
    for vec in vectors:
        vec_arr = np.array(vec, dtype=np.float32)
        vec_norm = np.linalg.norm(vec_arr)
        
        if vec_norm == 0:
            similarities.append(0.0)
        else:
            vec_normalized = vec_arr / vec_norm
            sim = float(np.dot(query_normalized, vec_normalized))
            similarities.append(sim)
    
    return similarities


def top_k_indices(
    scores: List[float],
    k: int,
    descending: bool = True
) -> List[int]:
    """
    Get indices of top-k scores.
    
    Args:
        scores: List of scores
        k: Number of top items
        descending: If True, return highest scores first
        
    Returns:
        List of indices
    """
    arr = np.array(scores)
    if descending:
        indices = np.argsort(arr)[::-1][:k]
    else:
        indices = np.argsort(arr)[:k]
    return indices.tolist()


def chunk_text(
    text: str,
    chunk_size: int = 500,
    overlap: int = 50
) -> List[str]:
    """
    Split text into overlapping chunks.
    
    Args:
        text: Input text
        chunk_size: Maximum chunk size in characters
        overlap: Overlap between chunks
        
    Returns:
        List of text chunks
    """
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        
        # Try to break at sentence boundary
        if end < len(text):
            # Look for sentence end
            last_period = text.rfind('。', start, end)
            last_newline = text.rfind('\n', start, end)
            break_point = max(last_period, last_newline)
            
            if break_point > start + chunk_size // 2:
                end = break_point + 1
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        
        start = end - overlap
        if start < 0:
            start = 0
    
    return chunks