"""
Vector Store Base - Interfaces and Models

Type-safe base classes and protocols for vector storage.
Following CDD §114: Type-first principle.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Protocol, runtime_checkable
from pydantic import BaseModel, Field


class DistanceMetric(str, Enum):
    """Distance metrics for vector similarity"""
    COSINE = "cosine"
    EUCLIDEAN = "euclidean"
    DOT_PRODUCT = "dot_product"


class StoreConfig(BaseModel):
    """Vector store configuration"""
    collection_name: str
    dimension: int = 1536  # OpenAI embedding dimension
    metric: DistanceMetric = DistanceMetric.COSINE
    persist_directory: Optional[str] = None
    
    # Index settings
    index_type: str = "auto"  # auto, ivf, hnsw
    n_clusters: int = 10  # For IVF index
    
    # Search settings
    default_top_k: int = 10


class Document(BaseModel):
    """A document with embedding"""
    id: str
    content: str
    embedding: List[float]
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class SearchResult(BaseModel):
    """A search result with similarity score"""
    document: Document
    score: float
    distance: Optional[float] = None
    
    @property
    def id(self) -> str:
        return self.document.id
    
    @property
    def content(self) -> str:
        return self.document.content
    
    @property
    def metadata(self) -> Dict[str, Any]:
        return self.document.metadata


@runtime_checkable
class BaseVectorStore(Protocol):
    """
    Protocol for vector store implementations.
    
    Any class implementing these methods can be used as a vector store.
    """
    
    def add(
        self,
        documents: List[Document],
        batch_size: int = 100
    ) -> int:
        """
        Add documents to the store.
        
        Args:
            documents: List of documents to add
            batch_size: Batch size for bulk insertion
            
        Returns:
            Number of documents added
        """
        ...
    
    def get(self, ids: List[str]) -> List[Document]:
        """
        Get documents by IDs.
        
        Args:
            ids: List of document IDs
            
        Returns:
            List of found documents
        """
        ...
    
    def search(
        self,
        query_embedding: List[float],
        top_k: int = 10,
        filter: Optional[Dict[str, Any]] = None
    ) -> List[SearchResult]:
        """
        Search for similar documents.
        
        Args:
            query_embedding: Query vector
            top_k: Number of results
            filter: Optional metadata filter
            
        Returns:
            List of search results
        """
        ...
    
    def delete(self, ids: List[str]) -> int:
        """
        Delete documents by IDs.
        
        Args:
            ids: List of document IDs
            
        Returns:
            Number of documents deleted
        """
        ...
    
    def count(self) -> int:
        """Get total number of documents"""
        ...
    
    def clear(self) -> None:
        """Clear all documents"""
        ...


class AbstractVectorStore(ABC):
    """
    Abstract base class for vector stores.
    
    Provides common utilities and requires implementation of core methods.
    """
    
    def __init__(self, config: StoreConfig):
        self.config = config
    
    @abstractmethod
    def add(
        self,
        documents: List[Document],
        batch_size: int = 100
    ) -> int:
        """Add documents to the store"""
        pass
    
    @abstractmethod
    def get(self, ids: List[str]) -> List[Document]:
        """Get documents by IDs"""
        pass
    
    @abstractmethod
    def search(
        self,
        query_embedding: List[float],
        top_k: int = 10,
        filter: Optional[Dict[str, Any]] = None
    ) -> List[SearchResult]:
        """Search for similar documents"""
        pass
    
    @abstractmethod
    def delete(self, ids: List[str]) -> int:
        """Delete documents by IDs"""
        pass
    
    @abstractmethod
    def count(self) -> int:
        """Get total number of documents"""
        pass
    
    @abstractmethod
    def clear(self) -> None:
        """Clear all documents"""
        pass
    
    # Utility methods
    
    def _validate_embedding(self, embedding: List[float]) -> bool:
        """Validate embedding dimension"""
        return len(embedding) == self.config.dimension
    
    def _validate_documents(self, documents: List[Document]) -> List[Document]:
        """Filter documents with valid embeddings"""
        valid = []
        for doc in documents:
            if self._validate_embedding(doc.embedding):
                valid.append(doc)
        return valid
    
    def get_stats(self) -> Dict[str, Any]:
        """Get store statistics"""
        return {
            "collection_name": self.config.collection_name,
            "dimension": self.config.dimension,
            "metric": self.config.metric.value,
            "document_count": self.count(),
        }