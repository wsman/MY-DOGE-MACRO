"""
AI Adapters - Unified AI Model Adapters Library

A unified interface for multiple AI model providers, supporting:
- 10+ LLM providers (OpenAI, DeepSeek, Gemini, Azure, Ollama, etc.)
- 6+ Embedding models
- Smart routing and cost optimization
- Fallback and retry mechanisms

Usage:
    from ai_adapters import create_llm_adapter, create_embedding_adapter
    
    # Create LLM adapter
    llm = create_llm_adapter(
        provider="deepseek",
        api_key="your-api-key",
        model_name="deepseek-chat"
    )
    response = llm.invoke("Hello, world!")
    
    # Create embedding adapter
    embedder = create_embedding_adapter(
        provider="openai",
        api_key="your-api-key",
        model_name="text-embedding-3-small"
    )
    vectors = embedder.embed_documents(["Hello", "World"])
"""

__version__ = "1.0.0"
__author__ = "Auto-Pen & MY-DOGE-MACRO Team"

from ai_adapters.base import (
    BaseLLMAdapter,
    BaseEmbeddingAdapter,
    LLMAdapterProtocol,
    EmbeddingAdapterProtocol,
)
from ai_adapters.factory import (
    create_llm_adapter,
    create_embedding_adapter,
    list_llm_providers,
    list_embedding_providers,
)
from ai_adapters.routing import TaskRouter, RoutingStrategy

__all__ = [
    # Version
    "__version__",
    "__author__",
    # Base classes
    "BaseLLMAdapter",
    "BaseEmbeddingAdapter",
    "LLMAdapterProtocol",
    "EmbeddingAdapterProtocol",
    # Factory functions
    "create_llm_adapter",
    "create_embedding_adapter",
    "list_llm_providers",
    "list_embedding_providers",
    # Routing
    "TaskRouter",
    "RoutingStrategy",
]