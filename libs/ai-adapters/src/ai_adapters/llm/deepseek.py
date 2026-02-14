"""
DeepSeek LLM Adapter

Adapter for DeepSeek models (deepseek-chat, deepseek-reasoner, deepseek-coder)
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


class DeepSeekAdapter(BaseLLMAdapter):
    """
    DeepSeek LLM Adapter
    
    Supports DeepSeek models:
    - deepseek-chat: General chat model
    - deepseek-reasoner: Advanced reasoning model (R1)
    - deepseek-coder: Code generation model
    
    DeepSeek API is compatible with OpenAI format.
    
    Example:
        >>> adapter = DeepSeekAdapter(
        ...     api_key="sk-...",
        ...     model_name="deepseek-chat"
        ... )
        >>> response = adapter.invoke("你好，世界！")
    """
    
    DEFAULT_BASE_URL = "https://api.deepseek.com/v1"
    
    # Model pricing per 1M tokens (as of 2025)
    MODEL_PRICING = {
        "deepseek-chat": {"input": 0.5, "output": 1.5},
        "deepseek-reasoner": {"input": 0.5, "output": 2.0},
        "deepseek-coder": {"input": 0.5, "output": 1.5},
    }
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model_name: str = "deepseek-chat",
        max_tokens: int = 4096,
        temperature: float = 0.7,
        timeout: int = 600,
        **kwargs
    ):
        # Get API key from environment if not provided
        if not api_key:
            api_key = get_env_key("DEEPSEEK_API_KEY")
        
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
        """Set up the DeepSeek client (OpenAI-compatible)"""
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
            
            # Calculate cost
            usage = None
            if response.usage:
                pricing = self.MODEL_PRICING.get(self.model_name, {"input": 0.5, "output": 1.5})
                input_cost = (response.usage.prompt_tokens / 1_000_000) * pricing["input"]
                output_cost = (response.usage.completion_tokens / 1_000_000) * pricing["output"]
                
                usage = {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                    "estimated_cost_usd": input_cost + output_cost,
                }
            
            return LLMResponse(
                content=response.choices[0].message.content,
                model=response.model,
                provider="deepseek",
                usage=usage,
                finish_reason=response.choices[0].finish_reason,
                latency_ms=latency_ms
            )
            
        except Exception as e:
            logger.error(f"DeepSeek API call failed: {e}")
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