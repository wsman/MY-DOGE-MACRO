"""
Config Manager - Unified Configuration Management Library

A unified configuration management system supporting:
- YAML, JSON, and ENV file loading
- Configuration validation with Pydantic
- Configuration merging and overriding
- Environment variable interpolation

Usage:
    from config_manager import ConfigLoader
    
    # Load configuration
    loader = ConfigLoader()
    config = loader.load("config.yaml")
    
    # Access configuration
    print(config.database.host)
"""

__version__ = "1.0.0"
__author__ = "Auto-Pen & MY-DOGE-MACRO Team"

from config_manager.loader import ConfigLoader, load_config
from config_manager.validator import ConfigValidator, validate_config
from config_manager.merger import ConfigMerger, merge_configs

__all__ = [
    "__version__",
    "__author__",
    "ConfigLoader",
    "load_config",
    "ConfigValidator",
    "validate_config",
    "ConfigMerger",
    "merge_configs",
]