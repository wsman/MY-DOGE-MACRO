"""
Configuration Merger Module

Provides deep merging of configuration dictionaries.
"""

from typing import Any, Dict, List, Optional


class ConfigMerger:
    """Configuration merger for combining multiple configs.
    
    Supports deep merging with strategies for conflict resolution.
    """
    
    def __init__(
        self,
        strategy: str = "override",
        list_strategy: str = "replace",
    ):
        """Initialize the merger.
        
        Args:
            strategy: Merge strategy for dict conflicts
                - "override": Later value wins (default)
                - "deep": Deep merge nested dicts
            list_strategy: Merge strategy for lists
                - "replace": Replace list (default)
                - "extend": Extend list
                - "prepend": Prepend list
        """
        self.strategy = strategy
        self.list_strategy = list_strategy
    
    def merge(
        self,
        *configs: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Merge multiple configuration dictionaries.
        
        Args:
            *configs: Configuration dictionaries to merge
            
        Returns:
            Merged configuration dictionary
        """
        result = {}
        
        for config in configs:
            result = self._merge_two(result, config)
        
        return result
    
    def _merge_two(
        self,
        base: Dict[str, Any],
        override: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Merge two configuration dictionaries.
        
        Args:
            base: Base configuration
            override: Override configuration
            
        Returns:
            Merged configuration
        """
        result = base.copy()
        
        for key, value in override.items():
            if key in result:
                result[key] = self._merge_values(result[key], value)
            else:
                result[key] = value
        
        return result
    
    def _merge_values(
        self,
        base: Any,
        override: Any,
    ) -> Any:
        """Merge two values based on strategy.
        
        Args:
            base: Base value
            override: Override value
            
        Returns:
            Merged value
        """
        # Both are dicts - deep merge
        if isinstance(base, dict) and isinstance(override, dict):
            if self.strategy == "deep":
                return self._merge_two(base, override)
            return override
        
        # Both are lists - apply list strategy
        if isinstance(base, list) and isinstance(override, list):
            if self.list_strategy == "extend":
                return base + override
            elif self.list_strategy == "prepend":
                return override + base
            return override
        
        # Default: override wins
        return override
    
    def merge_with_env(
        self,
        config: Dict[str, Any],
        env_prefix: str = "",
    ) -> Dict[str, Any]:
        """Merge configuration with environment variables.
        
        Args:
            config: Base configuration
            env_prefix: Environment variable prefix
            
        Returns:
            Merged configuration
        """
        import os
        
        result = config.copy()
        prefix = f"{env_prefix}_" if env_prefix else ""
        
        for key, value in os.environ.items():
            if prefix and not key.startswith(prefix):
                continue
            
            config_key = key[len(prefix):].lower() if prefix else key.lower()
            result[config_key] = self._parse_env_value(value)
        
        return result
    
    def _parse_env_value(self, value: str) -> Any:
        """Parse environment variable value to appropriate type."""
        if value.lower() in ("true", "yes", "1"):
            return True
        if value.lower() in ("false", "no", "0"):
            return False
        if value.lower() in ("null", "none", ""):
            return None
        try:
            if "." in value:
                return float(value)
            return int(value)
        except ValueError:
            return value


def merge_configs(
    *configs: Dict[str, Any],
    strategy: str = "override",
) -> Dict[str, Any]:
    """Convenience function to merge configurations.
    
    Args:
        *configs: Configuration dictionaries to merge
        strategy: Merge strategy
        
    Returns:
        Merged configuration dictionary
    """
    merger = ConfigMerger(strategy=strategy)
    return merger.merge(*configs)