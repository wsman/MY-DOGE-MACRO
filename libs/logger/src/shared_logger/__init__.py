"""
Shared Logger - Unified Logging Library

Based on loguru with pre-configured formatters.

Usage:
    from shared_logger import get_logger
    
    logger = get_logger("myapp")
    logger.info("Hello, world!")
"""

__version__ = "1.0.0"

from loguru import logger
import sys

def get_logger(name: str = None, level: str = "INFO"):
    """Get a configured logger instance.
    
    Args:
        name: Logger name (optional)
        level: Log level (DEBUG, INFO, WARNING, ERROR)
        
    Returns:
        Configured logger
    """
    # Remove default handler
    logger.remove()
    
    # Add custom handler
    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        f"<cyan>{name or 'app'}</cyan> | "
        "<level>{message}</level>"
    )
    
    logger.add(
        sys.stderr,
        format=log_format,
        level=level,
        colorize=True,
    )
    
    return logger

__all__ = ["get_logger", "logger"]