"""
Shared Cache - Unified Caching Library

Supports in-memory and Redis caching.

Usage:
    from shared_cache import Cache
    
    cache = Cache()
    cache.set("key", "value", ttl=3600)
    value = cache.get("key")
"""

__version__ = "1.0.0"

from typing import Any, Optional
from cachetools import TTLCache
import functools
import hashlib
import json


class Cache:
    """Unified cache with TTL support."""
    
    def __init__(self, maxsize: int = 1000, default_ttl: int = 3600):
        """Initialize cache.
        
        Args:
            maxsize: Maximum number of items
            default_ttl: Default TTL in seconds
        """
        self._cache = TTLCache(maxsize=maxsize, ttl=default_ttl)
        self.default_ttl = default_ttl
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        return self._cache.get(key)
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Set value in cache."""
        self._cache[key] = value
        if ttl:
            self._cache.expire()
    
    def delete(self, key: str):
        """Delete value from cache."""
        if key in self._cache:
            del self._cache[key]
    
    def clear(self):
        """Clear all cache."""
        self._cache.clear()
    
    def exists(self, key: str) -> bool:
        """Check if key exists."""
        return key in self._cache


def cached(ttl: int = 3600, key_prefix: str = ""):
    """Decorator for caching function results.
    
    Args:
        ttl: Time to live in seconds
        key_prefix: Prefix for cache key
        
    Returns:
        Decorated function
    """
    cache = TTLCache(maxsize=1000, ttl=ttl)
    
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            key_data = json.dumps({"args": str(args), "kwargs": str(kwargs)})
            cache_key = f"{key_prefix}:{func.__name__}:{hashlib.md5(key_data.encode()).hexdigest()}"
            
            # Check cache
            if cache_key in cache:
                return cache[cache_key]
            
            # Execute and cache
            result = func(*args, **kwargs)
            cache[cache_key] = result
            return result
        
        return wrapper
    return decorator


__all__ = ["Cache", "cached"]