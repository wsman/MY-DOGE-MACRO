"""
Vector Store ChromaDB - ChromaDB Implementation

Persistent vector store using ChromaDB.
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

logger = logging.getLogger(__name__)

# ChromaDB distance metric mapping
METRIC_MAP = {
    DistanceMetric.COSINE: "cosine",
    DistanceMetric.EUCLIDEAN: "l2",
    DistanceMetric.DOT_PRODUCT: "ip",
}


class ChromaStore(AbstractVectorStore):
    """
    ChromaDB vector store.
    
    Persistent storage with automatic indexing.
    Requires: pip install vector-store[chromadb]
    
    Example:
        >>> store = ChromaStore(StoreConfig(
        ...     collection_name="my_collection",
        ...     dimension=1536,
        ...     persist_directory="./data/chroma"
        ... ))
        >>> 
        >>> store.add([Document(id="1", content="Hello", embedding=[...])])
        >>> results = store.search(query_embedding=[...], top_k=5)
    """
    
    def __init__(self, config: StoreConfig):
        super().__init__(config)
        
        try:
            import chromadb
            from chromadb.config import Settings
        except ImportError:
            raise ImportError(
                "ChromaDB is required. Install with: pip install vector-store[chromadb]"
            )
        
        # Create client
        if config.persist_directory:
            self._client = chromadb.PersistentClient(
                path=config.persist_directory
            )
        else:
            self._client = chromadb.Client()
        
        # Create or get collection
        self._collection = self._client.get_or_create_collection(
            name=config.collection_name,
            metadata={
                "hnsw:space": METRIC_MAP.get(config.metric, "cosine"),
                "dimension": config.dimension,
            }
        )
        
        logger.info(f"ChromaDB store initialized: {config.collection_name}")
    
    def add(
        self,
        documents: List[Document],
        batch_size: int = 100
    ) -> int:
        """Add documents to the store"""
        valid_docs = self._validate_documents(documents)
        if not valid_docs:
            return 0
        
        # Process in batches
        total_added = 0
        for i in range(0, len(valid_docs), batch_size):
            batch = valid_docs[i:i + batch_size]
            
            ids = [doc.id for doc in batch]
            embeddings = [doc.embedding for doc in batch]
            contents = [doc.content for doc in batch]
            metadatas = [self._prepare_metadata(doc) for doc in batch]
            
            self._collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=contents,
                metadatas=metadatas
            )
            
            total_added += len(batch)
        
        logger.debug(f"Added {total_added} documents to ChromaDB")
        return total_added
    
    def _prepare_metadata(self, doc: Document) -> Dict[str, Any]:
        """Prepare metadata for ChromaDB (must be simple types)"""
        metadata = {
            "created_at": doc.created_at.isoformat(),
            "updated_at": doc.updated_at.isoformat(),
        }
        
        # Add custom metadata (only simple types)
        for key, value in doc.metadata.items():
            if isinstance(value, (str, int, float, bool)):
                metadata[key] = value
            elif value is not None:
                metadata[key] = str(value)
        
        return metadata
    
    def get(self, ids: List[str]) -> List[Document]:
        """Get documents by IDs"""
        if not ids:
            return []
        
        try:
            result = self._collection.get(ids=ids)
        except Exception as e:
            logger.warning(f"Error getting documents: {e}")
            return []
        
        documents = []
        for i, doc_id in enumerate(result["ids"]):
            doc = Document(
                id=doc_id,
                content=result["documents"][i] if result["documents"] else "",
                embedding=result["embeddings"][i] if result.get("embeddings") else [],
                metadata=result["metadatas"][i] if result.get("metadatas") else {}
            )
            documents.append(doc)
        
        return documents
    
    def search(
        self,
        query_embedding: List[float],
        top_k: int = 10,
        filter: Optional[Dict[str, Any]] = None
    ) -> List[SearchResult]:
        """Search for similar documents"""
        try:
            result = self._collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=filter
            )
        except Exception as e:
            logger.error(f"Search error: {e}")
            return []
        
        if not result["ids"] or not result["ids"][0]:
            return []
        
        results = []
        for i, doc_id in enumerate(result["ids"][0]):
            doc = Document(
                id=doc_id,
                content=result["documents"][0][i] if result.get("documents") else "",
                embedding=result["embeddings"][0][i] if result.get("embeddings") else [],
                metadata=result["metadatas"][0][i] if result.get("metadatas") else {}
            )
            
            distance = result["distances"][0][i] if result.get("distances") else 0.0
            
            # Convert distance to similarity score
            if self.config.metric == DistanceMetric.COSINE:
                score = 1.0 - distance
            elif self.config.metric == DistanceMetric.EUCLIDEAN:
                score = 1.0 / (1.0 + distance)
            else:
                score = 1.0 - (distance / 2.0)  # Approximate for dot product
            
            results.append(SearchResult(
                document=doc,
                score=max(0.0, min(1.0, score)),
                distance=distance
            ))
        
        return results
    
    def delete(self, ids: List[str]) -> int:
        """Delete documents by IDs"""
        if not ids:
            return 0
        
        try:
            self._collection.delete(ids=ids)
            return len(ids)
        except Exception as e:
            logger.warning(f"Error deleting documents: {e}")
            return 0
    
    def count(self) -> int:
        """Get total number of documents"""
        return self._collection.count()
    
    def clear(self) -> None:
        """Clear all documents"""
        # Get all IDs
        all_ids = self._collection.get()["ids"]
        if all_ids:
            self._collection.delete(ids=all_ids)
        logger.info(f"Cleared collection: {self.config.collection_name}")
    
    def delete_collection(self) -> None:
        """Delete the entire collection"""
        self._client.delete_collection(self.config.collection_name)
        logger.info(f"Deleted collection: {self.config.collection_name}")