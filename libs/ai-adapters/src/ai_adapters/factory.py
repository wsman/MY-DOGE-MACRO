"""
AI Adapters Factory Module

Factory functions for creating LLM and Embedding adapters.
Following CDD principles:
- §193: Model Selector Axiom - Dynamic model selection
- §302: Multi-Model Collaboration - Support for multiple providers
"""

import logging
from typing import Dict, List, Optional, Type

from ai_adapters.base import (
    BaseLLMAdapter,
    BaseEmbeddingAdapter,
    LLMProvider,
    EmbeddingProvider,
)

logger = logging.getLogger(__name__)


# ==================== Provider Registry ====================

_LLM_ADAPTERS: Dict[str, Type[BaseLLMAdapter]] = {}
_EMBEDDING_ADAPTERS: Dict[str, Type[BaseEmbeddingAdapter]] = {}


def register_llm_adapter(provider: str):
    """Decorator to register an LLM adapter class"""
    def decorator(cls: Type[BaseLLMAdapter]) -> Type[BaseLLMAdapter]:
        _LLM_ADAPTERS[provider.lower()] = cls
        return cls
    return decorator


def register_embedding_adapter(provider: str):
    """Decorator to register an Embedding adapter class"""
    def decorator(cls: Type[BaseEmbeddingAdapter]) -> Type[BaseEmbeddingAdapter]:
        _EMBEDDING_ADAPTERS[provider.lower()] = cls
        return cls
    return decorator


# ==================== LLM Adapters ====================

# Import and register LLM adapters
def _import_llm_adapters():
    """Lazy import of LLM adapters"""
    try:
        from ai_adapters.llm.openai import OpenAIAdapter
        _LLM_ADAPTERS["openai"] = OpenAIAdapter
    except ImportError:
        logger.debug("OpenAI adapter not available")
    
    try:
        from ai_adapters.llm.deepseek import DeepSeekAdapter
        _LLM_ADAPTERS["deepseek"] = DeepSeekAdapter
    except ImportError:
        logger.debug("DeepSeek adapter not available")
    
    try:
        from ai_adapters.llm.azure_openai import AzureOpenAIAdapter
        _LLM_ADAPTERS["azure_openai"] = AzureOpenAIAdapter
        _LLM_ADAPTERS["azure openai"] = AzureOpenAIAdapter
    except ImportError:
        logger.debug("Azure OpenAI adapter not available")
    
    try:
        from ai_adapters.llm.azure_ai import AzureAIAdapter
        _LLM_ADAPTERS["azure_ai"] = AzureAIAdapter
        _LLM_ADAPTERS["azure ai"] = AzureAIAdapter
    except ImportError:
        logger.debug("Azure AI adapter not available")
    
    try:
        from ai_adapters.llm.gemini import GeminiLLMAdapter
        _LLM_ADAPTERS["gemini"] = GeminiLLMAdapter
    except ImportError:
        logger.debug("Gemini adapter not available")
    
    try:
        from ai_adapters.llm.grok import GrokLLMAdapter
        _LLM_ADAPTERS["grok"] = GrokLLMAdapter
    except ImportError:
        logger.debug("Grok adapter not available")
    
    try:
        from ai_adapters.llm.ollama import OllamaAdapter
        _LLM_ADAPTERS["ollama"] = OllamaAdapter
    except ImportError:
        logger.debug("Ollama adapter not available")
    
    try:
        from ai_adapters.llm.silicon_flow import SiliconFlowAdapter
        _LLM_ADAPTERS["siliconflow"] = SiliconFlowAdapter
        _LLM_ADAPTERS["silicon_flow"] = SiliconFlowAdapter
        _LLM_ADAPTERS["硅基流动"] = SiliconFlowAdapter
    except ImportError:
        logger.debug("SiliconFlow adapter not available")
    
    try:
        from ai_adapters.llm.volcano import VolcanoEngineAIAdapter
        _LLM_ADAPTERS["volcano"] = VolcanoEngineAIAdapter
        _LLM_ADAPTERS["火山引擎"] = VolcanoEngineAIAdapter
    except ImportError:
        logger.debug("Volcano adapter not available")
    
    try:
        from ai_adapters.llm.ml_studio import MLStudioAdapter
        _LLM_ADAPTERS["ml_studio"] = MLStudioAdapter
        _LLM_ADAPTERS["ml studio"] = MLStudioAdapter
    except ImportError:
        logger.debug("ML Studio adapter not available")


# ==================== Embedding Adapters ====================

def _import_embedding_adapters():
    """Lazy import of Embedding adapters"""
    try:
        from ai_adapters.embedding.openai import OpenAIEmbeddingAdapter
        _EMBEDDING_ADAPTERS["openai"] = OpenAIEmbeddingAdapter
    except ImportError:
        logger.debug("OpenAI embedding adapter not available")
    
    try:
        from ai_adapters.embedding.azure_openai import AzureOpenAIEmbeddingAdapter
        _EMBEDDING_ADAPTERS["azure_openai"] = AzureOpenAIEmbeddingAdapter
        _EMBEDDING_ADAPTERS["azure openai"] = AzureOpenAIEmbeddingAdapter
    except ImportError:
        logger.debug("Azure OpenAI embedding adapter not available")
    
    try:
        from ai_adapters.embedding.gemini import GeminiEmbeddingAdapter
        _EMBEDDING_ADAPTERS["gemini"] = GeminiEmbeddingAdapter
    except ImportError:
        logger.debug("Gemini embedding adapter not available")
    
    try:
        from ai_adapters.embedding.ollama import OllamaEmbeddingAdapter
        _EMBEDDING_ADAPTERS["ollama"] = OllamaEmbeddingAdapter
    except ImportError:
        logger.debug("Ollama embedding adapter not available")
    
    try:
        from ai_adapters.embedding.siliconflow import SiliconFlowEmbeddingAdapter
        _EMBEDDING_ADAPTERS["siliconflow"] = SiliconFlowEmbeddingAdapter
    except ImportError:
        logger.debug("SiliconFlow embedding adapter not available")
    
    try:
        from ai_adapters.embedding.ml_studio import MLStudioEmbeddingAdapter
        _EMBEDDING_ADAPTERS["ml_studio"] = MLStudioEmbeddingAdapter
        _EMBEDDING_ADAPTERS["ml studio"] = MLStudioEmbeddingAdapter
    except ImportError:
        logger.debug("ML Studio embedding adapter not available")


# ==================== Factory Functions ====================

def create_llm_adapter(
    provider: str,
    model_name: str,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    max_tokens: int = 4096,
    temperature: float = 0.7,
    timeout: int = 600,
    **kwargs
) -> BaseLLMAdapter:
    """
    Create an LLM adapter based on the provider.
    
    Args:
        provider: The LLM provider name (e.g., "openai", "deepseek", "gemini")
        model_name: The model name to use
        api_key: API key (optional, will use env var if not provided)
        base_url: Custom base URL (optional)
        max_tokens: Maximum tokens for response
        temperature: Temperature for generation
        timeout: Request timeout in seconds
        **kwargs: Additional provider-specific arguments
    
    Returns:
        An LLM adapter instance
    
    Raises:
        ValueError: If provider is not supported
    
    Example:
        >>> llm = create_llm_adapter(
        ...     provider="deepseek",
        ...     model_name="deepseek-chat",
        ...     api_key="your-api-key"
        ... )
        >>> response = llm.invoke("Hello, world!")
    """
    # Ensure adapters are imported
    if not _LLM_ADAPTERS:
        _import_llm_adapters()
    
    provider_lower = provider.lower().strip()
    
    # Handle common aliases
    alias_map = {
        "azure openai": "azure_openai",
        "azure ai": "azure_ai",
        "ml studio": "ml_studio",
        "硅基流动": "siliconflow",
        "火山引擎": "volcano",
    }
    provider_lower = alias_map.get(provider_lower, provider_lower)
    
    if provider_lower not in _LLM_ADAPTERS:
        available = list_llm_providers()
        raise ValueError(
            f"Unknown LLM provider: '{provider}'. "
            f"Available providers: {available}"
        )
    
    adapter_class = _LLM_ADAPTERS[provider_lower]
    
    return adapter_class(
        api_key=api_key,
        base_url=base_url,
        model_name=model_name,
        max_tokens=max_tokens,
        temperature=temperature,
        timeout=timeout,
        **kwargs
    )


def create_embedding_adapter(
    provider: str,
    model_name: str,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    batch_size: int = 100,
    **kwargs
) -> BaseEmbeddingAdapter:
    """
    Create an Embedding adapter based on the provider.
    
    Args:
        provider: The Embedding provider name (e.g., "openai", "gemini")
        model_name: The model name to use
        api_key: API key (optional, will use env var if not provided)
        base_url: Custom base URL (optional)
        batch_size: Batch size for embedding documents
        **kwargs: Additional provider-specific arguments
    
    Returns:
        An Embedding adapter instance
    
    Raises:
        ValueError: If provider is not supported
    
    Example:
        >>> embedder = create_embedding_adapter(
        ...     provider="openai",
        ...     model_name="text-embedding-3-small",
        ...     api_key="your-api-key"
        ... )
        >>> vectors = embedder.embed_documents(["Hello", "World"])
    """
    # Ensure adapters are imported
    if not _EMBEDDING_ADAPTERS:
        _import_embedding_adapters()
    
    provider_lower = provider.lower().strip()
    
    # Handle common aliases
    alias_map = {
        "azure openai": "azure_openai",
        "ml studio": "ml_studio",
    }
    provider_lower = alias_map.get(provider_lower, provider_lower)
    
    if provider_lower not in _EMBEDDING_ADAPTERS:
        available = list_embedding_providers()
        raise ValueError(
            f"Unknown Embedding provider: '{provider}'. "
            f"Available providers: {available}"
        )
    
    adapter_class = _EMBEDDING_ADAPTERS[provider_lower]
    
    return adapter_class(
        api_key=api_key,
        base_url=base_url,
        model_name=model_name,
        batch_size=batch_size,
        **kwargs
    )


def list_llm_providers() -> List[str]:
    """List all available LLM providers"""
    if not _LLM_ADAPTERS:
        _import_llm_adapters()
    return sorted(set(_LLM_ADAPTERS.keys()))


def list_embedding_providers() -> List[str]:
    """List all available Embedding providers"""
    if not _EMBEDDING_ADAPTERS:
        _import_embedding_adapters()
    return sorted(set(_EMBEDDING_ADAPTERS.keys()))