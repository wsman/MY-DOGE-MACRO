"""SiliconFlow LLM Adapter

SiliconFlow platform OpenAI-compatible interface adapter.
SiliconFlow provides OpenAI-compatible API interface.
"""

import logging
from typing import Optional
from openai import OpenAI

from ..base import BaseLLMAdapter, LLMResponse, check_base_url

logger = logging.getLogger(__name__)


class SiliconFlowAdapter(BaseLLMAdapter):
    """
    SiliconFlow Adapter - OpenAI-compatible interface
    
    Supports:
    - SiliconFlow AI platform
    - OpenAI-compatible API interface
    """
    
    def _setup_client(self) -> None:
        """Set up the SiliconFlow client"""
        # Process base_url
        self.base_url = check_base_url(self.base_url) if self.base_url else None
        
        self._client = OpenAI(
            base_url=self.base_url,
            api_key=self.api_key,
            timeout=self.timeout
        )
        
        logger.debug(f"SiliconFlowAdapter initialized: model={self.model_name}, base_url={self.base_url}")

    def invoke(self, prompt: str, **kwargs) -> str:
        """Invoke SiliconFlow and return response"""
        try:
            response = self._client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are an AI assistant"},
                    {"role": "user", "content": prompt},
                ],
                timeout=self.timeout,
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            
            if not response:
                logger.warning("No response from SiliconFlowAdapter.")
                return ""
            
            content = response.choices[0].message.content
            logger.debug(f"SiliconFlowAdapter response length: {len(content)} characters")
            return content
            
        except Exception as e:
            logger.error(f"SiliconFlow API call timeout or failed: {e}")
            return ""

    def invoke_with_metadata(self, prompt: str, **kwargs) -> LLMResponse:
        """Invoke SiliconFlow and return full response with metadata"""
        import time
        start_time = time.time()
        
        content = self.invoke(prompt, **kwargs)
        latency_ms = (time.time() - start_time) * 1000
        
        return LLMResponse(
            content=content,
            model=self.model_name,
            provider="siliconflow",
            latency_ms=latency_ms
        )


def create_silicon_flow_adapter(
    api_key: str,
    base_url: str,
    model_name: str,
    max_tokens: int,
    temperature: float = 0.7,
    timeout: int = 600
) -> SiliconFlowAdapter:
    """Create SiliconFlow adapter (backward compatible function)"""
    return SiliconFlowAdapter(api_key, base_url, model_name, max_tokens, temperature, timeout)