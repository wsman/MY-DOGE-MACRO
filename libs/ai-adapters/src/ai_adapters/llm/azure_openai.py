"""Azure OpenAI LLM Adapter

Azure OpenAI interface adapter implementation.
"""

import re
import logging
from typing import Optional
from langchain_openai import AzureChatOpenAI

from ..base import BaseLLMAdapter, LLMResponse

logger = logging.getLogger(__name__)


class AzureOpenAIAdapter(BaseLLMAdapter):
    """Azure OpenAI LLM Adapter"""

    def _setup_client(self) -> None:
        """Set up the Azure OpenAI client"""
        # Parse Azure OpenAI URL format
        match = re.match(
            r'https://(.+?)/openai/deployments/(.+?)/chat/completions\?api-version=(.+)',
            self.base_url or ''
        )
        if match:
            self.azure_endpoint = f"https://{match.group(1)}"
            self.azure_deployment = match.group(2)
            self.api_version = match.group(3)
        else:
            # Allow direct endpoint/deployment format
            self.azure_endpoint = self.base_url
            self.azure_deployment = self.model_name
            self.api_version = "2024-02-15-preview"
        
        # Update model name to deployment name
        self.model_name = self.azure_deployment
        
        self._client = AzureChatOpenAI(
            azure_endpoint=self.azure_endpoint,
            azure_deployment=self.azure_deployment,
            api_version=self.api_version,
            api_key=self.api_key,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            timeout=self.timeout
        )
        
        logger.debug(f"AzureOpenAIAdapter initialized: endpoint={self.azure_endpoint}, deployment={self.azure_deployment}")

    def invoke(self, prompt: str, **kwargs) -> str:
        """Invoke Azure OpenAI and return response"""
        try:
            response = self._client.invoke(prompt)
            if not response:
                logger.warning("No response from AzureOpenAIAdapter.")
                return ""
            
            content = response.content
            logger.debug(f"AzureOpenAIAdapter response length: {len(content)} characters")
            return content
            
        except Exception as e:
            logger.error(f"Azure OpenAI API call failed: {e}")
            return ""

    def invoke_with_metadata(self, prompt: str, **kwargs) -> LLMResponse:
        """Invoke Azure OpenAI and return full response with metadata"""
        import time
        start_time = time.time()
        
        content = self.invoke(prompt, **kwargs)
        latency_ms = (time.time() - start_time) * 1000
        
        return LLMResponse(
            content=content,
            model=self.model_name,
            provider="azure_openai",
            latency_ms=latency_ms
        )


def create_azure_openai_adapter(
    api_key: str,
    base_url: str,
    model_name: str,
    max_tokens: int,
    temperature: float = 0.7,
    timeout: int = 600
) -> AzureOpenAIAdapter:
    """Create Azure OpenAI adapter (backward compatible function)"""
    return AzureOpenAIAdapter(api_key, base_url, model_name, max_tokens, temperature, timeout)