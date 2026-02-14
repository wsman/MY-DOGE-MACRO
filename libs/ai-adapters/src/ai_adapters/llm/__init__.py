"""
LLM Adapters Module

Contains implementations for all supported LLM providers.

Supported providers:
- OpenAI
- DeepSeek
- Azure OpenAI
- Azure AI
- Gemini
- Grok
- Ollama
- SiliconFlow
- Volcano Engine
- ML Studio
"""

from .openai import OpenAIAdapter
from .deepseek import DeepSeekAdapter
from .ollama import OllamaAdapter
from .gemini import GeminiAdapter
from .grok import GrokAdapter
from .azure_openai import AzureOpenAIAdapter
from .azure_ai import AzureAIAdapter
from .ml_studio import MLStudioAdapter
from .volcano import VolcanoEngineAIAdapter
from .silicon_flow import SiliconFlowAdapter

__all__ = [
    "OpenAIAdapter",
    "DeepSeekAdapter",
    "OllamaAdapter",
    "GeminiAdapter",
    "GrokAdapter",
    "AzureOpenAIAdapter",
    "AzureAIAdapter",
    "MLStudioAdapter",
    "VolcanoEngineAIAdapter",
    "SiliconFlowAdapter",
]
