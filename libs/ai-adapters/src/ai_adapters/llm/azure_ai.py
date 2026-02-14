"""Azure AI LLM Adapter

Azure AI Inference interface adapter implementation.
Uses azure-ai-inference library for API calls.
"""

import logging
import re
from typing import Optional

try:
    from azure.ai.inference import ChatCompletionsClient
    from azure.core.credentials import AzureKeyCredential
    from azure.ai.inference.models import SystemMessage, UserMessage
    AZURE_AI_AVAILABLE = True
except ImportError:
    AZURE_AI_AVAILABLE = False

from ..base import BaseLLMAdapter, LLMResponse

logger = logging.getLogger(__name__)


class AzureAIAdapter(BaseLLMAdapter):
    """
    Azure AI Adapter - Azure AI Inference interface
    
    Supports:
    - Azure AI service deployed models
    - Uses azure-ai-inference library
    """
    
    def _setup_client(self) -> None:
        """Set up the Azure AI client"""
        if not AZURE_AI_AVAILABLE:
            raise ImportError("azure-ai-inference is required. Install with: pip install azure-ai-inference")
        
        # Parse Azure AI endpoint URL
        # Format: https://xxx.services.ai.azure.com/models/chat/completions?api-version=xxx
        match = re.match(
            r'https://(.+?)\.services\.ai\.azure\.com(?:/models)?(?:/chat/completions)?(?:\?api-version=(.+))?',
            self.base_url or ''
        )
        if match:
            self.endpoint = f"https://{match.group(1)}.services.ai.azure.com/models"
            self.api_version = match.group(2) if match.group(2) else "2024-05-01-preview"
        else:
            # Allow direct endpoint format
            self.endpoint = self.base_url
            self.api_version = "2024-05-01-preview"
        
        # Store processed endpoint URL
        self.base_url = self.endpoint
        
        self._client = ChatCompletionsClient(
            endpoint=self.endpoint,
            credential=AzureKeyCredential(self.api_key),
            model=self.model_name,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            timeout=self.timeout
        )
        
        logger.debug(f"AzureAIAdapter initialized: model={self.model_name}, endpoint={self.endpoint}")

    def invoke(self, prompt: str, **kwargs) -> str:
        """Invoke Azure AI Inference and return response"""
        try:
            response = self._client.complete(
                messages=[
                    SystemMessage("You are a helpful assistant."),
                    UserMessage(prompt)
                ]
            )
            
            if response and response.choices:
                content = response.choices[0].message.content
                logger.debug(f"AzureAIAdapter response length: {len(content)} characters")
                return content
            else:
                logger.warning("No response from AzureAIAdapter.")
                return ""
                
        except Exception as e:
            logger.error(f"Azure AI Inference API call failed: {e}")
            return ""

    def invoke_with_metadata(self, prompt: str, **kwargs) -> LLMResponse:
        """Invoke Azure AI and return full response with metadata"""
        import time
        start_time = time.time()
        
        content = self.invoke(prompt, **kwargs)
        latency_ms = (time.time() - start_time) * 1000
        
        return LLMResponse(
            content=content,
            model=self.model_name,
            provider="azure_ai",
            latency_ms=latency_ms
        )


def create_azure_ai_adapter(
    api_key: str,
    base_url: str,
    model_name: str,
    max_tokens: int,
    temperature: float = 0.7,
    timeout: int = 600
) -> AzureAIAdapter:
    """Create Azure AI adapter (backward compatible function)"""
    return AzureAIAdapter(api_key, base_url, model_name, max_tokens, temperature, timeout)