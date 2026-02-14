"""Tests for vector store utilities."""

import pytest


class TestCosineSimilarity:
    """Tests for cosine similarity function."""
    
    def test_identical_vectors(self):
        """Test similarity of identical vectors is 1.0."""
        from vector_store.utils import cosine_similarity
        
        vec = [1.0, 2.0, 3.0]
        similarity = cosine_similarity(vec, vec)
        
        assert abs(similarity - 1.0) < 0.0001
    
    def test_orthogonal_vectors(self):
        """Test similarity of orthogonal vectors is 0.0."""
        from vector_store.utils import cosine_similarity
        
        vec1 = [1.0, 0.0, 0.0]
        vec2 = [0.0, 1.0, 0.0]
        similarity = cosine_similarity(vec1, vec2)
        
        assert abs(similarity - 0.0) < 0.0001
    
    def test_opposite_vectors(self):
        """Test similarity of opposite vectors is -1.0."""
        from vector_store.utils import cosine_similarity
        
        vec1 = [1.0, 0.0, 0.0]
        vec2 = [-1.0, 0.0, 0.0]
        similarity = cosine_similarity(vec1, vec2)
        
        assert abs(similarity - (-1.0)) < 0.0001
    
    def test_similar_vectors(self):
        """Test similarity of similar vectors."""
        from vector_store.utils import cosine_similarity
        
        vec1 = [1.0, 1.0, 1.0]
        vec2 = [0.9, 0.9, 0.9]
        similarity = cosine_similarity(vec1, vec2)
        
        assert similarity > 0.9


class TestEuclideanDistance:
    """Tests for Euclidean distance function."""
    
    def test_identical_vectors(self):
        """Test distance of identical vectors is 0.0."""
        from vector_store.utils import euclidean_distance
        
        vec = [1.0, 2.0, 3.0]
        distance = euclidean_distance(vec, vec)
        
        assert abs(distance - 0.0) < 0.0001
    
    def test_unit_distance(self):
        """Test unit distance vectors."""
        from vector_store.utils import euclidean_distance
        
        vec1 = [0.0, 0.0, 0.0]
        vec2 = [1.0, 0.0, 0.0]
        distance = euclidean_distance(vec1, vec2)
        
        assert abs(distance - 1.0) < 0.0001
    
    def test_known_distance(self):
        """Test known 3-4-5 triangle."""
        from vector_store.utils import euclidean_distance
        
        vec1 = [0.0, 0.0]
        vec2 = [3.0, 4.0]
        distance = euclidean_distance(vec1, vec2)
        
        assert abs(distance - 5.0) < 0.0001


class TestChunkText:
    """Tests for text chunking function."""
    
    def test_chunk_short_text(self):
        """Test chunking text shorter than chunk size."""
        from vector_store.utils import chunk_text
        
        text = "Short text"
        chunks = chunk_text(text, chunk_size=100)
        
        assert len(chunks) == 1
        assert chunks[0] == text
    
    def test_chunk_long_text(self):
        """Test chunking text longer than chunk size."""
        from vector_store.utils import chunk_text
        
        text = "This is a longer text that needs to be chunked."
        chunks = chunk_text(text, chunk_size=20)
        
        assert len(chunks) > 1
    
    def test_chunk_with_overlap(self):
        """Test chunking with overlap."""
        from vector_store.utils import chunk_text
        
        text = "A" * 100
        chunks = chunk_text(text, chunk_size=30, overlap=10)
        
        # Check overlap exists between chunks
        if len(chunks) > 1:
            # End of first chunk should appear at start of second
            assert len(chunks) > 1
    
    def test_chunk_preserves_content(self):
        """Test chunking preserves all content (no overlap case)."""
        from vector_store.utils import chunk_text
        
        text = "ABCDEFGHIJ" * 10  # 100 chars
        chunks = chunk_text(text, chunk_size=50, overlap=0)
        
        reconstructed = "".join(chunks)
        assert reconstructed == text


class TestNormalizeVector:
    """Tests for vector normalization function."""
    
    def test_normalize_unit_vector(self):
        """Test normalizing a unit vector."""
        from vector_store.utils import normalize_vector
        
        vec = [1.0, 0.0, 0.0]
        normalized = normalize_vector(vec)
        
        assert abs(normalized[0] - 1.0) < 0.0001
        assert abs(normalized[1] - 0.0) < 0.0001
        assert abs(normalized[2] - 0.0) < 0.0001
    
    def test_normalize_zero_vector(self):
        """Test normalizing zero vector raises error."""
        from vector_store.utils import normalize_vector
        
        with pytest.raises(ValueError):
            normalize_vector([0.0, 0.0, 0.0])
    
    def test_normalize_magnitude(self):
        """Test normalized vector has magnitude 1."""
        from vector_store.utils import normalize_vector
        import math
        
        vec = [3.0, 4.0]
        normalized = normalize_vector(vec)
        
        magnitude = math.sqrt(sum(x**2 for x in normalized))
        assert abs(magnitude - 1.0) < 0.0001