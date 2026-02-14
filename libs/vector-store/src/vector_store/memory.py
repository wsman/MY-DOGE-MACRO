"""
Vector Store Memory - In-Memory Implementation

Simple in-memory vector store for testing and small datasets.
"""

import logging
from typing import Any, Dict, List, Optional

from vector_store.base import (
    AbstractVectorStore,
    Document,
    SearchResult,
    StoreConfig,
    DistanceMetric,
)
from vector_store.utils import (
    cosine_similarity,
    euclidean_distance,
    batch_cosine_similarity,
    top_k_indices,
)

logger = logging.getLogger(__name__)


class MemoryStore(AbstractVectorStore):
    """
    In-memory vector store.
    
    Simple implementation for testing and small datasets.
    Data is lost when the store is destroyed.
    
    Example:
        >>> store = MemoryStore(StoreConfig(
        ...     collection_name="test",
        ...     dimension=1536
        ... ))
        >>> 
        >>> store.add([Document(id="1", content="Hello", embedding=[...])])
        >>> results = store.search(query_embedding=[...], top_k=5)
    """
    
    def __init__(self, config: StoreConfig):
        super().__init__(config)
        self._documents: Dict[str, Document] = {}
        self._embeddings: List[List[float]] = []
        self._ids: List[str] = []
    
    def add(
        self,
        documents: List[Document],
        batch_size: int = 100
    ) -> int:
        """Add documents to the store"""
        valid_docs = self._validate_documents(documents)
        added = 0
        
        for doc in valid_docs:
            if doc.id in self._documents:
                # Update existing document
                idx = self._ids.index(doc.id)
                self._embeddings[idx] = doc.embedding
                self._documents[doc.id] = doc
            else:
                # Add new document
                self._documents[doc.id] = doc
                self._embeddings.append(doc.embedding)
                self._ids.append(doc.id)
            added += 1
        
        logger.debug(f"Added {added} documents to memory store")
        return added
    
    def get(self, ids: List[str]) -> List[Document]:
        """Get documents by IDs"""
        return [self._documents[id] for id in ids if id in self._documents]
    
    def search(
        self,
        query_embedding: List[float],
        top_k: int = 10,
        filter: Optional[Dict[str, Any]] = None
    ) -> List[SearchResult]:
        """Search for similar documents"""
        if not self._embeddings:
            return []
        
        # Calculate similarities
        if self.config.metric == DistanceMetric.COSINE:
            scores = batch_cosine_similarity(query_embedding, self._embeddings)
        elif self.config.metric == DistanceMetric.EUCLIDEAN:
            scores = [
                1.0 / (1.0 + euclidean_distance(query_embedding, emb))
                for emb in self._embeddings
            ]
        else:
            scores = batch_cosine_similarity(query_embedding, self._embeddings)
        
        # Apply filter if provided
        if filter:
            filtered_indices = []
            for i, doc_id in enumerate(self._ids):
                doc = self._documents[doc_id]
                if self._matches_filter(doc.metadata, filter):
                    filtered_indices.append(i)
            
            if filtered_indices:
                filtered_scores = [scores[i] for i in filtered_indices]
                top_indices = [filtered_indices[i] for i in top_k_indices(filtered_scores, top_k)]
            else:
                return []
        else:
            top_indices = top_k_indices(scores, top_k)
        
        # Build results
        results = []
        for idx in top_indices:
            doc = self._documents[self._ids[idx]]
            score = scores[idx]
            
            results.append(SearchResult(
                document=doc,
                score=score,
                distance=euclidean_distance(query_embedding, doc.embedding)
            ))
        
        return results
    
    def _matches_filter(
        self,
        metadata: Dict[str, Any],
        filter: Dict[str, Any]
    ) -> bool:
        """Check if metadata matches filter"""
        for key, value in filter.items():
            if key not in metadata:
                return False
            if isinstance(value, dict):
                # Handle operators
                if "$eq" in value and metadata[key] != value["$eq"]:
                    return False
                if "$ne" in value and metadata[key] == value["$ne"]:
                    return False
                if "$in" in value and metadata[key] not in value["$in"]:
                    return False
            elif metadata[key] != value:
                return False
        return True
    
    def delete(self, ids: List[str]) -> int:
        """Delete documents by IDs"""
        deleted = 0
        for id in ids:
            if id in self._documents:
                del self._documents[id]
                idx = self._ids.index(id)
                self._ids.pop(idx)
                self._embeddings.pop(idx)
                deleted += 1
        return deleted
    
    def count(self) -> int:
        """Get total number of documents"""
        return len(self._documents)
    
    def clear(self) -> None:
        """Clear all documents"""
        self._documents.clear()
        self._embeddings.clear()
        self._ids.clear()