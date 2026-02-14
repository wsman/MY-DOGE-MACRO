"""
OpenAI LLM Adapter

Adapter for OpenAI GPT models (GPT-4, GPT-4o, GPT-3.5, etc.)
"""

import time
import logging
from typing import Optional, Dict, Any, List

from openai import OpenAI

from ai_adapters.base import (
    BaseLLMAdapter,
    LLMResponse,
    check_api_key,
    get_env_key,
)

logger = logging.getLogger(__name__)


class OpenAIAdapter(BaseLLMAdapter):
    """
    OpenAI LLM Adapter
    
    Supports all OpenAI chat models:
    - gpt-4, gpt-4-turbo, gpt-4o, gpt-4o-mini
    - gpt-3.5-turbo
    - o1-preview, o1-mini
    
    Example:
        >>> adapter = OpenAIAdapter(
        ...     api_key="sk-...",
        ...     model_name="gpt-4o"
        ... )
        >>> response = adapter.invoke("Hello, world!")
    """
    
    DEFAULT_BASE_URL = "https://api.openai.com/v1"
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model_name: str = "gpt-4o-mini",
        max_tokens: int = 4096,
        temperature: float = 0.7,
        timeout: int = 600,
        **kwargs
    ):
        # Get API key from environment if not provided
        if not api_key:
            api_key = get_env_key("OPENAI_API_KEY")
        
        # Set default base URL if not provided
        if not base_url:
            base_url = self.DEFAULT_BASE_URL
        
        self.extra_params = kwargs
        super().__init__(
            api_key=api_key,
            base_url=base_url,
            model_name=model_name,
            max_tokens=max_tokens,
            temperature=temperature,
            timeout=timeout
        )
    
    def _setup_client(self) -> None:
        """Set up the OpenAI client"""
        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
            timeout=self.timeout
        )
    
    def invoke(self, prompt: str, **kwargs) -> str:
        """Invoke the LLM with a prompt and return just the content"""
        response = self.invoke_with_metadata(prompt, **kwargs)
        return response.content
    
    def invoke_with_metadata(self, prompt: str, **kwargs) -> LLMResponse:
        """Invoke the LLM and return full response with metadata"""
        start_time = time.time()
        
        # Merge parameters
        temperature = kwargs.get("temperature", self.temperature)
        max_tokens = kwargs.get("max_tokens", self.max_tokens)
        system_prompt = kwargs.get("system_prompt")
        messages = kwargs.get("messages", [])
        
        # Build messages
        if not messages:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
        
        # Make API call
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                **{k: v for k, v in self.extra_params.items() if k not in kwargs}
            )
            
            latency_ms = (time.time() - start_time) * 1000
            
            return LLMResponse(
                content=response.choices[0].message.content,
                model=response.model,
                provider="openai",
                usage={
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                } if response.usage else None,
                finish_reason=response.choices[0].finish_reason,
                latency_ms=latency_ms
            )
            
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
            raise
    
    def invoke_stream(self, prompt: str, **kwargs):
        """Stream the response"""
        temperature = kwargs.get("temperature", self.temperature)
        max_tokens = kwargs.get("max_tokens", self.max_tokens)
        system_prompt = kwargs.get("system_prompt")
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        stream = self.client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            stream=True
        )
        
        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content