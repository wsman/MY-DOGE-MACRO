"""
Ollama LLM Adapter

Adapter for local models via Ollama (Llama, Mistral, Gemma, etc.)
"""

import time
import logging
from typing import Optional, Dict, Any, List, Generator

import httpx

from ai_adapters.base import (
    BaseLLMAdapter,
    LLMResponse,
    get_env_key,
)

logger = logging.getLogger(__name__)


class OllamaAdapter(BaseLLMAdapter):
    """
    Ollama LLM Adapter for local models
    
    Supports all Ollama models:
    - llama3, llama3.1, llama3.2
    - mistral, mixtral
    - gemma, gemma2
    - qwen, qwen2
    - codellama
    - And many more...
    
    No API key required - runs locally via Ollama server.
    
    Example:
        >>> adapter = OllamaAdapter(
        ...     base_url="http://localhost:11434",
        ...     model_name="llama3.1"
        ... )
        >>> response = adapter.invoke("Hello, world!")
    """
    
    DEFAULT_BASE_URL = "http://localhost:11434/v1"
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model_name: str = "llama3.1",
        max_tokens: int = 4096,
        temperature: float = 0.7,
        timeout: int = 600,
        **kwargs
    ):
        # Get base URL from environment if not provided
        if not base_url:
            base_url = get_env_key("OLLAMA_BASE_URL") or self.DEFAULT_BASE_URL
        
        # Ollama doesn't require API key, but accept it for compatibility
        self.extra_params = kwargs
        super().__init__(
            api_key=api_key or "ollama",  # Dummy key for validation
            base_url=base_url,
            model_name=model_name,
            max_tokens=max_tokens,
            temperature=temperature,
            timeout=timeout
        )
    
    def _validate_config(self) -> None:
        """Override validation - Ollama doesn't require API key"""
        if self.temperature < 0 or self.temperature > 2:
            raise ValueError("temperature must be between 0 and 2")
        if self.max_tokens <= 0:
            raise ValueError("max_tokens must be greater than 0")
        if self.timeout <= 0:
            raise ValueError("timeout must be greater than 0")
    
    def _setup_client(self) -> None:
        """Set up the HTTP client for Ollama"""
        self.client = httpx.Client(
            base_url=self.base_url.rstrip('/v1'),  # Use base Ollama URL
            timeout=self.timeout
        )
    
    def _check_model_available(self) -> bool:
        """Check if the model is available locally"""
        try:
            response = self.client.get("/api/tags")
            if response.status_code == 200:
                models = response.json().get("models", [])
                return any(m["name"].startswith(self.model_name) for m in models)
        except Exception as e:
            logger.warning(f"Failed to check model availability: {e}")
        return True  # Assume available if check fails
    
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
        
        # Build request for Ollama API
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            }
        }
        
        if system_prompt:
            payload["system"] = system_prompt
        
        # Make API call
        try:
            response = self.client.post("/api/generate", json=payload)
            response.raise_for_status()
            
            result = response.json()
            latency_ms = (time.time() - start_time) * 1000
            
            return LLMResponse(
                content=result.get("response", ""),
                model=self.model_name,
                provider="ollama",
                usage={
                    "prompt_tokens": result.get("prompt_eval_count", 0),
                    "completion_tokens": result.get("eval_count", 0),
                    "total_tokens": result.get("prompt_eval_count", 0) + result.get("eval_count", 0),
                } if result.get("prompt_eval_count") else None,
                finish_reason="stop" if result.get("done") else None,
                latency_ms=latency_ms
            )
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Ollama API error: {e}")
            raise RuntimeError(f"Ollama API error: {e.response.text}")
        except Exception as e:
            logger.error(f"Ollama request failed: {e}")
            raise
    
    def invoke_stream(self, prompt: str, **kwargs) -> Generator[str, None, None]:
        """Stream the response"""
        temperature = kwargs.get("temperature", self.temperature)
        max_tokens = kwargs.get("max_tokens", self.max_tokens)
        system_prompt = kwargs.get("system_prompt")
        
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": True,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            }
        }
        
        if system_prompt:
            payload["system"] = system_prompt
        
        with self.client.stream("POST", "/api/generate", json=payload) as response:
            for line in response.iter_lines():
                if line:
                    import json
                    data = json.loads(line)
                    if "response" in data:
                        yield data["response"]
    
    def __del__(self):
        """Clean up HTTP client"""
        if hasattr(self, "client"):
            self.client.close()