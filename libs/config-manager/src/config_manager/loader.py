"""
Configuration Loader Module

Supports loading configuration from:
- YAML files
- JSON files
- Environment variables
- .env files
"""

import os
import json
from pathlib import Path
from typing import Any, Dict, Optional, Union

import yaml
from dotenv import load_dotenv


class ConfigLoader:
    """Unified configuration loader.
    
    Supports multiple configuration sources with priority:
    1. Environment variables (highest)
    2. .env files
    3. JSON/YAML files
    4. Default values (lowest)
    """
    
    def __init__(
        self,
        env_prefix: str = "",
        env_file: Optional[str] = None,
        interpolate_env: bool = True,
    ):
        """Initialize the configuration loader.
        
        Args:
            env_prefix: Prefix for environment variables
            env_file: Path to .env file
            interpolate_env: Whether to interpolate environment variables
        """
        self.env_prefix = env_prefix
        self.interpolate_env = interpolate_env
        self._env_loaded = False
        
        if env_file:
            load_dotenv(env_file)
            self._env_loaded = True
    
    def load(
        self,
        path: Union[str, Path],
        schema: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """Load configuration from a file.
        
        Args:
            path: Path to configuration file
            schema: Optional Pydantic model for validation
            
        Returns:
            Configuration dictionary
        """
        path = Path(path)
        
        if not path.exists():
            raise FileNotFoundError(f"Configuration file not found: {path}")
        
        # Load based on file extension
        suffix = path.suffix.lower()
        
        if suffix in (".yaml", ".yml"):
            config = self._load_yaml(path)
        elif suffix == ".json":
            config = self._load_json(path)
        else:
            raise ValueError(f"Unsupported configuration format: {suffix}")
        
        # Interpolate environment variables
        if self.interpolate_env:
            config = self._interpolate(config)
        
        # Apply environment variable overrides
        config = self._apply_env_overrides(config)
        
        # Validate with schema if provided
        if schema:
            config = schema(**config).model_dump()
        
        return config
    
    def _load_yaml(self, path: Path) -> Dict[str, Any]:
        """Load YAML configuration file."""
        with open(path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    
    def _load_json(self, path: Path) -> Dict[str, Any]:
        """Load JSON configuration file."""
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    
    def _interpolate(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Interpolate environment variables in configuration.
        
        Supports ${VAR_NAME} and ${VAR_NAME:default} syntax.
        """
        import re
        
        def interpolate_value(value: Any) -> Any:
            if isinstance(value, str):
                # Match ${VAR} or ${VAR:default}
                pattern = r'\$\{([^}:]+)(?::([^}]*))?\}'
                
                def replace(match):
                    var_name = match.group(1)
                    default = match.group(2)
                    return os.environ.get(var_name, default or "")
                
                return re.sub(pattern, replace, value)
            elif isinstance(value, dict):
                return {k: interpolate_value(v) for k, v in value.items()}
            elif isinstance(value, list):
                return [interpolate_value(item) for item in value]
            return value
        
        return interpolate_value(config)
    
    def _apply_env_overrides(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Apply environment variable overrides to configuration.
        
        Converts PREFIX_SECTION_KEY to config.section.key
        """
        if not self.env_prefix:
            return config
        
        result = config.copy()
        prefix = f"{self.env_prefix}_"
        
        for key, value in os.environ.items():
            if not key.startswith(prefix):
                continue
            
            # Parse the key path
            parts = key[len(prefix):].lower().split("_")
            
            # Navigate to the nested location
            current = result
            for part in parts[:-1]:
                if part not in current:
                    current[part] = {}
                current = current[part]
            
            # Set the value
            current[parts[-1]] = self._parse_env_value(value)
        
        return result
    
    def _parse_env_value(self, value: str) -> Any:
        """Parse environment variable value to appropriate type."""
        # Boolean
        if value.lower() in ("true", "yes", "1"):
            return True
        if value.lower() in ("false", "no", "0"):
            return False
        
        # None
        if value.lower() in ("null", "none", ""):
            return None
        
        # Number
        try:
            if "." in value:
                return float(value)
            return int(value)
        except ValueError:
            pass
        
        # String
        return value


def load_config(
    path: Union[str, Path],
    env_prefix: str = "",
    schema: Optional[Any] = None,
) -> Dict[str, Any]:
    """Convenience function to load configuration.
    
    Args:
        path: Path to configuration file
        env_prefix: Prefix for environment variables
        schema: Optional Pydantic model for validation
        
    Returns:
        Configuration dictionary
    """
    loader = ConfigLoader(env_prefix=env_prefix)
    return loader.load(path, schema=schema)