"""
AI Adapters Base Classes and Protocols

This module defines the foundational interfaces for all AI adapters.
Following CDD (Constitutional-Driven Development) principles:
- §101: Functional Layer Topology - Clear interface hierarchy
- §121: Multi-Model Collaboration - Support for multiple AI models
"""

import re
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Protocol, runtime_checkable
from pydantic import BaseModel, Field
from enum import Enum

logger = logging.getLogger(__name__)


# ==================== Enums ====================

class LLMProvider(str, Enum):
    """Supported LLM providers"""
    OPENAI = "openai"
    DEEPSEEK = "deepseek"
    AZURE_OPENAI = "azure_openai"
    AZURE_AI = "azure_ai"
    GEMINI = "gemini"
    GROK = "grok"
    OLLAMA = "ollama"
    SILICONFLOW = "siliconflow"
    VOLCANO = "volcano"
    MLSTUDIO = "ml_studio"


class EmbeddingProvider(str, Enum):
    """Supported Embedding providers"""
    OPENAI = "openai"
    AZURE_OPENAI = "azure_openai"
    GEMINI = "gemini"
    OLLAMA = "ollama"
    SILICONFLOW = "siliconflow"
    MLSTUDIO = "ml_studio"


class TaskType(str, Enum):
    """Task types for intelligent routing"""
    CREATIVE_WRITING = "creative_writing"
    ANALYSIS = "analysis"
    SUMMARIZATION = "summarization"
    CODE_GENERATION = "code_generation"
    TRANSLATION = "translation"
    EMBEDDING = "embedding"
    REASONING = "reasoning"
    CHAT = "chat"


# ==================== Models ====================

class LLMConfig(BaseModel):
    """LLM adapter configuration"""
    provider: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model_name: str
    max_tokens: int = Field(default=4096, ge=1)
    temperature: float = Field(default=0.7, ge=0, le=2)
    timeout: int = Field(default=600, ge=1)
    
    class Config:
        extra = "allow"


class EmbeddingConfig(BaseModel):
    """Embedding adapter configuration"""
    provider: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model_name: str
    batch_size: int = Field(default=100, ge=1)
    
    class Config:
        extra = "allow"


class LLMResponse(BaseModel):
    """Standard LLM response"""
    content: str
    model: str
    provider: str
    usage: Optional[Dict[str, int]] = None
    finish_reason: Optional[str] = None
    latency_ms: Optional[float] = None


class EmbeddingResponse(BaseModel):
    """Standard Embedding response"""
    embeddings: List[List[float]]
    model: str
    provider: str
    usage: Optional[Dict[str, int]] = None


# ==================== Protocols ====================

@runtime_checkable
class LLMAdapterProtocol(Protocol):
    """
    LLM Adapter Protocol (§114: Type-first principle)
    
    Defines the interface that all LLM adapters must implement.
    """
    
    def invoke(self, prompt: str, **kwargs) -> str:
        """Invoke the LLM with a prompt and return the response"""
        ...
    
    def invoke_with_metadata(self, prompt: str, **kwargs) -> LLMResponse:
        """Invoke the LLM and return full response with metadata"""
        ...


@runtime_checkable
class EmbeddingAdapterProtocol(Protocol):
    """
    Embedding Adapter Protocol (§114: Type-first principle)
    
    Defines the interface that all Embedding adapters must implement.
    """
    
    def embed_query(self, text: str) -> List[float]:
        """Generate embedding for a single query"""
        ...
    
    def embed_documents(self, documents: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple documents"""
        ...


# ==================== Base Classes ====================

class BaseLLMAdapter(ABC):
    """
    Base class for all LLM adapters (§101: Layer topology)
    
    Provides common functionality and interface for LLM adapters.
    """
    
    def __init__(
        self,
        api_key: Optional[str],
        base_url: Optional[str],
        model_name: str,
        max_tokens: int = 4096,
        temperature: float = 0.7,
        timeout: int = 600
    ):
        self.api_key = api_key
        self.base_url = self._process_base_url(base_url) if base_url else None
        self.model_name = model_name
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.timeout = timeout
        
        self._validate_config()
        self._setup_client()
    
    def _process_base_url(self, url: str) -> str:
        """
        Process base URL according to standard rules:
        1. If url ends with #, remove # and use as-is
        2. Otherwise, add /v1 suffix if not present
        """
        url = url.strip()
        if not url:
            return url
            
        if url.endswith('#'):
            return url.rstrip('#')
            
        if not re.search(r'/v\d+$', url):
            if '/v1' not in url:
                url = url.rstrip('/') + '/v1'
        return url
    
    def _validate_config(self) -> None:
        """Validate configuration parameters"""
        if self.temperature < 0 or self.temperature > 2:
            raise ValueError("temperature must be between 0 and 2")
        if self.max_tokens <= 0:
            raise ValueError("max_tokens must be greater than 0")
        if self.timeout <= 0:
            raise ValueError("timeout must be greater than 0")
    
    @abstractmethod
    def _setup_client(self) -> None:
        """Set up the API client"""
        pass
    
    @abstractmethod
    def invoke(self, prompt: str, **kwargs) -> str:
        """Invoke the LLM with a prompt"""
        pass
    
    @abstractmethod
    def invoke_with_metadata(self, prompt: str, **kwargs) -> LLMResponse:
        """Invoke the LLM and return full response with metadata"""
        pass
    
    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(model={self.model_name})"


class BaseEmbeddingAdapter(ABC):
    """
    Base class for all Embedding adapters (§101: Layer topology)
    
    Provides common functionality and interface for Embedding adapters.
    """
    
    def __init__(
        self,
        api_key: Optional[str],
        base_url: Optional[str],
        model_name: str,
        batch_size: int = 100
    ):
        self.api_key = api_key
        self.base_url = base_url
        self.model_name = model_name
        self.batch_size = batch_size
        
        self._validate_config()
        self._setup_client()
    
    def _validate_config(self) -> None:
        """Validate configuration parameters"""
        if self.batch_size <= 0:
            raise ValueError("batch_size must be greater than 0")
    
    @abstractmethod
    def _setup_client(self) -> None:
        """Set up the API client"""
        pass
    
    @abstractmethod
    def embed_query(self, text: str) -> List[float]:
        """Generate embedding for a single query"""
        pass
    
    @abstractmethod
    def embed_documents(self, documents: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple documents"""
        pass
    
    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(model={self.model_name})"


# ==================== Utility Functions ====================

def check_api_key(api_key: Optional[str], provider: str) -> str:
    """Check and return API key, raise error if missing"""
    if not api_key:
        raise ValueError(f"API key is required for {provider}")
    return api_key


def get_env_key(key_name: str) -> Optional[str]:
    """Get API key from environment variable"""
    import os
    return os.getenv(key_name)


def check_base_url(url: str) -> str:
    """
    Process base URL according to standard rules:
    1. If url ends with #, remove # and use as-is
    2. Otherwise, add /v1 suffix if not present
    
    Alias for _process_base_url for backward compatibility.
    """
    if not url:
        return url
    return BaseLLMAdapter._process_base_url(url)
