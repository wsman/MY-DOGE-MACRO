"""
Vector Store - Unified Vector Storage Library

A unified interface for vector storage and semantic search, supporting:
- ChromaDB for persistent storage
- In-memory storage for testing
- Type-safe document models
- Similarity search utilities

Usage:
    from vector_store import ChromaStore, MemoryStore, Document
    
    # Create store
    store = ChromaStore(collection_name="my_collection")
    
    # Add documents
    store.add([
        Document(id="1", content="Hello world", embedding=[0.1, 0.2, ...]),
        Document(id="2", content="Goodbye world", embedding=[0.3, 0.4, ...])
    ])
    
    # Search
    results = store.search(query_embedding=[0.1, 0.2, ...], top_k=5)
"""

__version__ = "1.0.0"
__author__ = "Auto-Pen & MY-DOGE-MACRO Team"

from vector_store.base import (
    BaseVectorStore,
    Document,
    SearchResult,
    StoreConfig,
)
from vector_store.memory import MemoryStore
from vector_store.utils import (
    cosine_similarity,
    euclidean_distance,
    normalize_vector,
)

# Optional ChromaDB import
try:
    from vector_store.chroma import ChromaStore
    __all__ = [
        "__version__",
        "__author__",
        # Base
        "BaseVectorStore",
        "Document",
        "SearchResult",
        "StoreConfig",
        # Stores
        "ChromaStore",
        "MemoryStore",
        # Utils
        "cosine_similarity",
        "euclidean_distance",
        "normalize_vector",
    ]
except ImportError:
    __all__ = [
        "__version__",
        "__author__",
        "BaseVectorStore",
        "Document",
        "SearchResult",
        "StoreConfig",
        "MemoryStore",
        "cosine_similarity",
        "euclidean_distance",
        "normalize_vector",
    ]