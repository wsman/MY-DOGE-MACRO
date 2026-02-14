"""Tests for AI adapter factory."""

import pytest
from unittest.mock import patch, MagicMock


class TestCreateLLMAdapter:
    """Tests for create_llm_adapter function."""
    
    def test_create_openai_adapter(self):
        """Test creating OpenAI adapter."""
        from ai_adapters import create_llm_adapter
        
        with patch('ai_adapters.llm.openai.OpenAI') as mock_openai:
            mock_client = MagicMock()
            mock_openai.return_value = mock_client
            
            adapter = create_llm_adapter(
                provider="openai",
                model="gpt-4",
                api_key="test-key"
            )
            
            assert adapter is not None
    
    def test_create_deepseek_adapter(self):
        """Test creating DeepSeek adapter."""
        from ai_adapters import create_llm_adapter
        
        with patch('ai_adapters.llm.deepseek.OpenAI') as mock_openai:
            mock_client = MagicMock()
            mock_openai.return_value = mock_client
            
            adapter = create_llm_adapter(
                provider="deepseek",
                model="deepseek-chat",
                api_key="test-key"
            )
            
            assert adapter is not None
    
    def test_create_ollama_adapter(self):
        """Test creating Ollama adapter."""
        from ai_adapters import create_llm_adapter
        
        with patch('ai_adapters.llm.ollama.ollama') as mock_ollama:
            mock_client = MagicMock()
            mock_ollama.Client.return_value = mock_client
            
            adapter = create_llm_adapter(
                provider="ollama",
                model="llama2",
                base_url="http://localhost:11434"
            )
            
            assert adapter is not None
    
    def test_unsupported_provider_raises_error(self):
        """Test that unsupported provider raises ValueError."""
        from ai_adapters import create_llm_adapter
        
        with pytest.raises(ValueError, match="Unsupported LLM provider"):
            create_llm_adapter(
                provider="unknown",
                model="unknown-model",
                api_key="test-key"
            )


class TestCreateEmbeddingAdapter:
    """Tests for create_embedding_adapter function."""
    
    def test_create_openai_embedding(self):
        """Test creating OpenAI embedding adapter."""
        from ai_adapters import create_embedding_adapter
        
        with patch('ai_adapters.embedding.openai.OpenAI') as mock_openai:
            mock_client = MagicMock()
            mock_openai.return_value = mock_client
            
            adapter = create_embedding_adapter(
                provider="openai",
                model="text-embedding-3-small",
                api_key="test-key"
            )
            
            assert adapter is not None
    
    def test_unsupported_embedding_provider_raises_error(self):
        """Test that unsupported embedding provider raises ValueError."""
        from ai_adapters import create_embedding_adapter
        
        with pytest.raises(ValueError, match="Unsupported embedding provider"):
            create_embedding_adapter(
                provider="unknown",
                model="unknown-model",
                api_key="test-key"
            )


class TestBaseAdapter:
    """Tests for base adapter functionality."""
    
    def test_adapter_invoke_returns_response(self):
        """Test that adapter invoke returns a response."""
        from ai_adapters.llm.openai import OpenAILLMAdapter
        
        with patch('ai_adapters.llm.openai.OpenAI') as mock_openai:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.choices = [MagicMock(message=MagicMock(content="Test response"))]
            mock_client.chat.completions.create.return_value = mock_response
            mock_openai.return_value = mock_client
            
            adapter = OpenAILLMAdapter(model="gpt-4", api_key="test-key")
            response = adapter.invoke("Hello")
            
            assert response == "Test response"