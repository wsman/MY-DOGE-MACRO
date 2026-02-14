"""
OpenAI Embedding Adapter

Adapter for OpenAI embedding models (text-embedding-3-small, text-embedding-3-large, etc.)
"""

import time
import logging
from typing import Optional, List

from openai import OpenAI

from ai_adapters.base import (
    BaseEmbeddingAdapter,
    EmbeddingResponse,
    get_env_key,
)

logger = logging.getLogger(__name__)


class OpenAIEmbeddingAdapter(BaseEmbeddingAdapter):
    """
    OpenAI Embedding Adapter
    
    Supports OpenAI embedding models:
    - text-embedding-3-small (1536 dimensions, efficient)
    - text-embedding-3-large (3072 dimensions, high quality)
    - text-embedding-ada-002 (1536 dimensions, legacy)
    
    Example:
        >>> adapter = OpenAIEmbeddingAdapter(
        ...     api_key="sk-...",
        ...     model_name="text-embedding-3-small"
        ... )
        >>> vectors = adapter.embed_documents(["Hello", "World"])
    """
    
    DEFAULT_BASE_URL = "https://api.openai.com/v1"
    
    # Pricing per 1M tokens (as of 2025)
    MODEL_PRICING = {
        "text-embedding-3-small": 0.02,
        "text-embedding-3-large": 0.13,
        "text-embedding-ada-002": 0.10,
    }
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model_name: str = "text-embedding-3-small",
        batch_size: int = 100,
        **kwargs
    ):
        if not api_key:
            api_key = get_env_key("OPENAI_API_KEY")
        
        if not base_url:
            base_url = self.DEFAULT_BASE_URL
        
        self.extra_params = kwargs
        super().__init__(
            api_key=api_key,
            base_url=base_url,
            model_name=model_name,
            batch_size=batch_size
        )
    
    def _setup_client(self) -> None:
        """Set up the OpenAI client"""
        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
        )
    
    def embed_query(self, text: str) -> List[float]:
        """Generate embedding for a single query"""
        response = self.client.embeddings.create(
            model=self.model_name,
            input=text
        )
        return response.data[0].embedding
    
    def embed_documents(self, documents: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple documents"""
        all_embeddings = []
        
        # Process in batches
        for i in range(0, len(documents), self.batch_size):
            batch = documents[i:i + self.batch_size]
            
            response = self.client.embeddings.create(
                model=self.model_name,
                input=batch
            )
            
            # Sort by index to ensure correct order
            sorted_data = sorted(response.data, key=lambda x: x.index)
            batch_embeddings = [item.embedding for item in sorted_data]
            all_embeddings.extend(batch_embeddings)
        
        return all_embeddings
    
    def embed_with_metadata(self, texts: List[str]) -> EmbeddingResponse:
        """Generate embeddings with full metadata"""
        start_time = time.time()
        
        response = self.client.embeddings.create(
            model=self.model_name,
            input=texts
        )
        
        latency_ms = (time.time() - start_time) * 1000
        
        # Calculate cost
        pricing = self.MODEL_PRICING.get(self.model_name, 0.02)
        cost = (response.usage.total_tokens / 1_000_000) * pricing
        
        sorted_data = sorted(response.data, key=lambda x: x.index)
        
        return EmbeddingResponse(
            embeddings=[item.embedding for item in sorted_data],
            model=response.model,
            provider="openai",
            usage={
                "prompt_tokens": response.usage.prompt_tokens,
                "total_tokens": response.usage.total_tokens,
                "estimated_cost_usd": cost,
            }
        )