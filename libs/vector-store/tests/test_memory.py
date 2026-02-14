"""Tests for Memory Vector Store."""

import pytest
import numpy as np


class TestMemoryStore:
    """Tests for MemoryStore class."""
    
    def test_store_initialization(self):
        """Test store can be initialized."""
        from vector_store import MemoryStore, StoreConfig
        
        store = MemoryStore(StoreConfig(
            collection_name="test",
            dimension=128
        ))
        
        assert store is not None
        assert store.config.collection_name == "test"
        assert store.config.dimension == 128
    
    def test_add_single_document(self):
        """Test adding a single document."""
        from vector_store import MemoryStore, Document, StoreConfig
        
        store = MemoryStore(StoreConfig(collection_name="test", dimension=3))
        
        doc = Document(
            id="doc-1",
            content="Hello world",
            embedding=[0.1, 0.2, 0.3]
        )
        
        count = store.add([doc])
        
        assert count == 1
        assert store.count() == 1
    
    def test_add_multiple_documents(self):
        """Test adding multiple documents."""
        from vector_store import MemoryStore, Document, StoreConfig
        
        store = MemoryStore(StoreConfig(collection_name="test", dimension=3))
        
        docs = [
            Document(id="doc-1", content="Hello", embedding=[0.1, 0.2, 0.3]),
            Document(id="doc-2", content="World", embedding=[0.4, 0.5, 0.6]),
            Document(id="doc-3", content="Test", embedding=[0.7, 0.8, 0.9]),
        ]
        
        count = store.add(docs)
        
        assert count == 3
        assert store.count() == 3
    
    def test_get_document_by_id(self):
        """Test getting document by ID."""
        from vector_store import MemoryStore, Document, StoreConfig
        
        store = MemoryStore(StoreConfig(collection_name="test", dimension=3))
        
        doc = Document(
            id="doc-1",
            content="Hello world",
            embedding=[0.1, 0.2, 0.3],
            metadata={"source": "test"}
        )
        
        store.add([doc])
        retrieved = store.get(["doc-1"])
        
        assert len(retrieved) == 1
        assert retrieved[0].id == "doc-1"
        assert retrieved[0].content == "Hello world"
        assert retrieved[0].metadata["source"] == "test"
    
    def test_get_multiple_documents(self):
        """Test getting multiple documents by IDs."""
        from vector_store import MemoryStore, Document, StoreConfig
        
        store = MemoryStore(StoreConfig(collection_name="test", dimension=3))
        
        docs = [
            Document(id="doc-1", content="Hello", embedding=[0.1, 0.2, 0.3]),
            Document(id="doc-2", content="World", embedding=[0.4, 0.5, 0.6]),
        ]
        
        store.add(docs)
        retrieved = store.get(["doc-1", "doc-2"])
        
        assert len(retrieved) == 2
    
    def test_search_returns_results(self):
        """Test search returns similar documents."""
        from vector_store import MemoryStore, Document, StoreConfig
        
        store = MemoryStore(StoreConfig(collection_name="test", dimension=3))
        
        docs = [
            Document(id="doc-1", content="Cat", embedding=[1.0, 0.0, 0.0]),
            Document(id="doc-2", content="Dog", embedding=[0.0, 1.0, 0.0]),
            Document(id="doc-3", content="Bird", embedding=[0.0, 0.0, 1.0]),
        ]
        
        store.add(docs)
        
        # Search with vector similar to doc-1
        results = store.search(query_embedding=[0.9, 0.1, 0.0], top_k=2)
        
        assert len(results) == 2
        assert results[0].document.id == "doc-1"  # Most similar
    
    def test_search_with_top_k(self):
        """Test search respects top_k parameter."""
        from vector_store import MemoryStore, Document, StoreConfig
        
        store = MemoryStore(StoreConfig(collection_name="test", dimension=3))
        
        docs = [
            Document(id=f"doc-{i}", content=f"Doc {i}", embedding=[i/10, i/10, i/10])
            for i in range(10)
        ]
        
        store.add(docs)
        results = store.search(query_embedding=[0.5, 0.5, 0.5], top_k=3)
        
        assert len(results) == 3
    
    def test_delete_documents(self):
        """Test deleting documents."""
        from vector_store import MemoryStore, Document, StoreConfig
        
        store = MemoryStore(StoreConfig(collection_name="test", dimension=3))
        
        doc = Document(id="doc-1", content="Hello", embedding=[0.1, 0.2, 0.3])
        store.add([doc])
        
        deleted = store.delete(["doc-1"])
        
        assert deleted == 1
        assert store.count() == 0
    
    def test_clear_store(self):
        """Test clearing all documents."""
        from vector_store import MemoryStore, Document, StoreConfig
        
        store = MemoryStore(StoreConfig(collection_name="test", dimension=3))
        
        docs = [
            Document(id="doc-1", content="Hello", embedding=[0.1, 0.2, 0.3]),
            Document(id="doc-2", content="World", embedding=[0.4, 0.5, 0.6]),
        ]
        
        store.add(docs)
        store.clear()
        
        assert store.count() == 0
    
    def test_get_stats(self):
        """Test getting store statistics."""
        from vector_store import MemoryStore, Document, StoreConfig
        
        store = MemoryStore(StoreConfig(collection_name="test", dimension=3))
        
        docs = [
            Document(id="doc-1", content="Hello", embedding=[0.1, 0.2, 0.3]),
            Document(id="doc-2", content="World", embedding=[0.4, 0.5, 0.6]),
        ]
        
        store.add(docs)
        stats = store.get_stats()
        
        assert stats["count"] == 2
        assert stats["dimension"] == 3
        assert stats["metric"] == "cosine"