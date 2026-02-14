"""ML Studio LLM Adapter

ML Studio OpenAI-compatible interface adapter implementation.
ML Studio provides OpenAI-compatible /v1/chat interface.
"""

import logging
from typing import Optional
from langchain_openai import ChatOpenAI

from ..base import BaseLLMAdapter, LLMResponse, check_base_url

logger = logging.getLogger(__name__)


class MLStudioAdapter(BaseLLMAdapter):
    """
    ML Studio Adapter - OpenAI-compatible interface
    
    Supports:
    - ML Studio platform deployed models
    - OpenAI-compatible API interface
    """
    
    def _setup_client(self) -> None:
        """Set up the ML Studio client"""
        # Process base_url
        self.base_url = check_base_url(self.base_url) if self.base_url else None
        
        self._client = ChatOpenAI(
            model=self.model_name,
            api_key=self.api_key,
            base_url=self.base_url,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            timeout=self.timeout
        )
        
        logger.debug(f"MLStudioAdapter initialized: model={self.model_name}, base_url={self.base_url}")

    def invoke(self, prompt: str, **kwargs) -> str:
        """Invoke ML Studio and return response"""
        try:
            response = self._client.invoke(prompt)
            if not response:
                logger.warning("No response from MLStudioAdapter.")
                return ""
            
            content = response.content
            logger.debug(f"MLStudioAdapter response length: {len(content)} characters")
            return content
            
        except Exception as e:
            logger.error(f"ML Studio API call timeout or failed: {e}")
            return ""

    def invoke_with_metadata(self, prompt: str, **kwargs) -> LLMResponse:
        """Invoke ML Studio and return full response with metadata"""
        import time
        start_time = time.time()
        
        content = self.invoke(prompt, **kwargs)
        latency_ms = (time.time() - start_time) * 1000
        
        return LLMResponse(
            content=content,
            model=self.model_name,
            provider="ml_studio",
            latency_ms=latency_ms
        )


def create_ml_studio_adapter(
    api_key: str,
    base_url: str,
    model_name: str,
    max_tokens: int,
    temperature: float = 0.7,
    timeout: int = 600
) -> MLStudioAdapter:
    """Create ML Studio adapter (backward compatible function)"""
    return MLStudioAdapter(api_key, base_url, model_name, max_tokens, temperature, timeout)