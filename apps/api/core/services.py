"""
核心服务初始化模块 - 统一共享库集成

依据§152单一真理源公理和§141熵减验证公理，统一所有共享组件的初始化和管理。
"""

import logging
from typing import Optional, Dict, Any
from pathlib import Path

# 导入共享库
try:
    from config_manager import ConfigLoader, load_config, ConfigValidator
    CONFIG_MANAGER_AVAILABLE = True
except ImportError:
    CONFIG_MANAGER_AVAILABLE = False
    print("警告: config_manager 不可用，使用回退配置加载")

try:
    from shared_logger import get_logger
    LOGGER_AVAILABLE = True
except ImportError:
    LOGGER_AVAILABLE = False
    print("警告: shared_logger 不可用，使用标准logging")

try:
    from shared_cache import Cache, cached
    CACHE_AVAILABLE = True
except ImportError:
    CACHE_AVAILABLE = False
    print("警告: shared_cache 不可用，使用回退缓存")

try:
    from websocket_hub import WebSocketHub, ProgressTracker, ChannelManager
    WEBSOCKET_HUB_AVAILABLE = True
except ImportError:
    WEBSOCKET_HUB_AVAILABLE = False
    print("警告: websocket_hub 不可用，使用回退WebSocket")

try:
    from ai_adapters import create_llm_adapter, create_embedding_adapter, TaskRouter
    from ai_adapters.base import LLMProvider, EmbeddingProvider, TaskType
    AI_ADAPTERS_AVAILABLE = True
except ImportError:
    AI_ADAPTERS_AVAILABLE = False
    print("警告: ai_adapters 不可用，AI功能将受限")

try:
    from vector_store import MemoryStore, ChromaStore, StoreConfig, Document
    VECTOR_STORE_AVAILABLE = True
except ImportError:
    VECTOR_STORE_AVAILABLE = False
    print("警告: vector_store 不可用，向量存储功能将受限")


class CoreServices:
    """
    核心服务管理器 - 统一初始化和管理所有共享组件
    
    宪法依据:
    - §152单一真理源公理: 所有组件统一初始化和管理
    - §141熵减验证公理: 减少重复代码，降低系统熵
    - §101功能分层拓扑公理: 清晰的依赖层次结构
    """
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CoreServices, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self._initialize()
            self._initialized = True
    
    def _initialize(self):
        """初始化所有核心服务"""
        self.logger = self._setup_logger()
        self.config = self._load_config()
        self.cache = self._setup_cache()
        self.websocket_hub = self._setup_websocket_hub()
        self.ai_adapters = self._setup_ai_adapters()
        self.vector_stores = self._setup_vector_stores()
        
        self.logger.info("✅ 核心服务初始化完成")
    
    def _setup_logger(self) -> logging.Logger:
        """设置统一的日志系统"""
        if LOGGER_AVAILABLE:
            logger = get_logger("mydoge-api", level="INFO")
        else:
            logger = logging.getLogger("mydoge-api")
            if not logger.handlers:
                handler = logging.StreamHandler()
                formatter = logging.Formatter(
                    "%(asctime)s | %(levelname)s | mydoge-api | %(message)s"
                )
                handler.setFormatter(formatter)
                logger.addHandler(handler)
                logger.setLevel(logging.INFO)
        
        return logger
    
    def _load_config(self) -> Dict[str, Any]:
        """加载统一配置"""
        config_paths = [
            Path("config/app_config.yaml"),
            Path("config/app_config.json"),
            Path(".env"),
        ]
        
        if CONFIG_MANAGER_AVAILABLE:
            # 尝试加载配置文件
            for path in config_paths:
                if path.exists():
                    try:
                        self.logger.info(f"加载配置文件: {path}")
                        return load_config(path, env_prefix="MYDOGE")
                    except Exception as e:
                        self.logger.warning(f"配置文件加载失败 {path}: {e}")
            
            # 使用默认配置
            self.logger.warning("未找到配置文件，使用默认配置")
            return self._get_default_config()
        else:
            # 回退配置
            self.logger.warning("使用回退配置加载")
            return self._get_default_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """获取默认配置"""
        return {
            "api": {
                "host": "0.0.0.0",
                "port": 8765,
                "auth_token": "mydoge-token-123456",
            },
            "database": {
                "url": "sqlite:///data/mydoge.db",
            },
            "ai": {
                "providers": {
                    "openai": {"enabled": False},
                    "deepseek": {"enabled": True},
                    "gemini": {"enabled": False},
                },
                "default_provider": "deepseek",
            },
            "websocket": {
                "heartbeat_interval": 30,
                "timeout": 300,
            },
            "cache": {
                "maxsize": 1000,
                "default_ttl": 3600,
            },
        }
    
    def _setup_cache(self):
        """设置统一缓存"""
        if CACHE_AVAILABLE:
            cache_config = self.config.get("cache", {})
            cache = Cache(
                maxsize=cache_config.get("maxsize", 1000),
                default_ttl=cache_config.get("default_ttl", 3600)
            )
            self.logger.info("✅ 缓存服务已初始化")
            return cache
        else:
            self.logger.warning("⚠️ 使用回退缓存实现")
            # 简单的回退缓存
            class FallbackCache:
                def __init__(self):
                    self._cache = {}
                
                def get(self, key):
                    return self._cache.get(key)
                
                def set(self, key, value, ttl=None):
                    self._cache[key] = value
                
                def delete(self, key):
                    if key in self._cache:
                        del self._cache[key]
                
                def clear(self):
                    self._cache.clear()
                
                def exists(self, key):
                    return key in self._cache
            
            return FallbackCache()
    
    def _setup_websocket_hub(self):
        """设置WebSocket中心"""
        if WEBSOCKET_HUB_AVAILABLE:
            hub = WebSocketHub()
            self.logger.info("✅ WebSocket中心已初始化")
            return hub
        else:
            self.logger.warning("⚠️ WebSocket中心不可用，使用回退模式")
            return None
    
    def _setup_ai_adapters(self) -> Dict[str, Any]:
        """设置AI适配器"""
        if not AI_ADAPTERS_AVAILABLE:
            self.logger.warning("⚠️ AI适配器不可用")
            return {}
        
        ai_config = self.config.get("ai", {})
        providers_config = ai_config.get("providers", {})
        default_provider = ai_config.get("default_provider", "deepseek")
        
        adapters = {}
        router = TaskRouter()
        
        # 初始化已启用的AI提供者
        for provider_name, provider_config in providers_config.items():
            if provider_config.get("enabled", False):
                try:
                    if provider_name == "openai":
                        adapter = create_llm_adapter(
                            provider="openai",
                            model_name=provider_config.get("model", "gpt-4o-mini"),
                            api_key=provider_config.get("api_key"),
                        )
                        router.add_model(
                            "openai",
                            adapter,
                            cost_per_1k_tokens=provider_config.get("cost", 0.001)
                        )
                        adapters["openai"] = adapter
                    
                    elif provider_name == "deepseek":
                        adapter = create_llm_adapter(
                            provider="deepseek",
                            model_name=provider_config.get("model", "deepseek-chat"),
                            api_key=provider_config.get("api_key"),
                        )
                        router.add_model(
                            "deepseek",
                            adapter,
                            cost_per_1k_tokens=provider_config.get("cost", 0.0005)
                        )
                        adapters["deepseek"] = adapter
                    
                    elif provider_name == "gemini":
                        adapter = create_llm_adapter(
                            provider="gemini",
                            model_name=provider_config.get("model", "gemini-pro"),
                            api_key=provider_config.get("api_key"),
                        )
                        router.add_model(
                            "gemini",
                            adapter,
                            cost_per_1k_tokens=provider_config.get("cost", 0.00075)
                        )
                        adapters["gemini"] = adapter
                    
                    self.logger.info(f"✅ AI提供者已初始化: {provider_name}")
                
                except Exception as e:
                    self.logger.error(f"❌ AI提供者初始化失败 {provider_name}: {e}")
        
        return {
            "adapters": adapters,
            "router": router,
            "default_provider": default_provider,
        }
    
    def _setup_vector_stores(self) -> Dict[str, Any]:
        """设置向量存储"""
        if not VECTOR_STORE_AVAILABLE:
            self.logger.warning("⚠️ 向量存储不可用")
            return {}
        
        stores = {}
        
        try:
            # 初始化内存向量存储（用于缓存）
            memory_config = StoreConfig(
                collection_name="memory_cache",
                dimension=1536,
            )
            stores["memory"] = MemoryStore(memory_config)
            self.logger.info("✅ 内存向量存储已初始化")
        except Exception as e:
            self.logger.error(f"❌ 内存向量存储初始化失败: {e}")
        
        return stores
    
    def get_llm_adapter(self, provider: Optional[str] = None):
        """获取LLM适配器"""
        if not AI_ADAPTERS_AVAILABLE:
            return None
        
        if not provider:
            provider = self.ai_adapters.get("default_provider", "deepseek")
        
        return self.ai_adapters.get("adapters", {}).get(provider)
    
    def get_llm_router(self):
        """获取LLM路由器"""
        if not AI_ADAPTERS_AVAILABLE:
            return None
        
        return self.ai_adapters.get("router")
    
    def get_vector_store(self, store_type: str = "memory"):
        """获取向量存储"""
        return self.vector_stores.get(store_type)
    
    def get_progress_tracker(self, progress_callback=None):
        """获取进度追踪器"""
        if not WEBSOCKET_HUB_AVAILABLE:
            return None
        
        return ProgressTracker(progress_callback=progress_callback)


# 全局服务实例
services = CoreServices()

# 导出常用组件
logger = services.logger
config = services.config
cache = services.cache
websocket_hub = services.websocket_hub

# 装饰器导出
cached = cached if CACHE_AVAILABLE else None

# 工具函数
def get_llm_adapter(provider: Optional[str] = None):
    """便捷函数：获取LLM适配器"""
    return services.get_llm_adapter(provider)

def get_llm_router():
    """便捷函数：获取LLM路由器"""
    return services.get_llm_router()

def get_vector_store(store_type: str = "memory"):
    """便捷函数：获取向量存储"""
    return services.get_vector_store(store_type)

__all__ = [
    "services",
    "logger",
    "config",
    "cache",
    "websocket_hub",
    "cached",
    "get_llm_adapter",
    "get_llm_router",
    "get_vector_store",
    "CoreServices",
]