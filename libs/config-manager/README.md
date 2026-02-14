# Config Manager

Unified Configuration Management Library for Auto-Pen and MY-DOGE-MACRO.

## Features

- **Multi-format support**: YAML, JSON, ENV files
- **Environment variables**: Interpolation and overrides
- **Validation**: Pydantic schema validation
- **Deep merging**: Combine multiple configuration sources

## Installation

```bash
pip install -e .
```

## Usage

```python
from config_manager import ConfigLoader, ConfigMerger

# Load configuration
loader = ConfigLoader(env_prefix="APP")
config = loader.load("config.yaml")

# Access values
print(config["database"]["host"])

# Merge configurations
merger = ConfigMerger(strategy="deep")
merged = merger.merge(default_config, user_config, env_config)
```

## License

MIT