"""
Configuration Validator Module

Provides validation using Pydantic models.
"""

from typing import Any, Dict, Optional, Type
from pydantic import BaseModel, ValidationError


class ConfigValidator:
    """Configuration validator using Pydantic.
    
    Validates configuration against a schema.
    """
    
    def __init__(self, schema: Optional[Type[BaseModel]] = None):
        """Initialize the validator.
        
        Args:
            schema: Pydantic model for validation
        """
        self.schema = schema
    
    def validate(
        self,
        config: Dict[str, Any],
        schema: Optional[Type[BaseModel]] = None,
    ) -> BaseModel:
        """Validate configuration against schema.
        
        Args:
            config: Configuration dictionary
            schema: Optional schema override
            
        Returns:
            Validated Pydantic model instance
            
        Raises:
            ValidationError: If validation fails
        """
        use_schema = schema or self.schema
        if use_schema is None:
            raise ValueError("No schema provided for validation")
        
        return use_schema(**config)
    
    def is_valid(
        self,
        config: Dict[str, Any],
        schema: Optional[Type[BaseModel]] = None,
    ) -> bool:
        """Check if configuration is valid.
        
        Args:
            config: Configuration dictionary
            schema: Optional schema override
            
        Returns:
            True if valid, False otherwise
        """
        try:
            self.validate(config, schema)
            return True
        except (ValidationError, ValueError):
            return False
    
    def get_errors(
        self,
        config: Dict[str, Any],
        schema: Optional[Type[BaseModel]] = None,
    ) -> list:
        """Get validation errors.
        
        Args:
            config: Configuration dictionary
            schema: Optional schema override
            
        Returns:
            List of error messages
        """
        try:
            self.validate(config, schema)
            return []
        except ValidationError as e:
            return [str(err) for err in e.errors()]


def validate_config(
    config: Dict[str, Any],
    schema: Type[BaseModel],
) -> BaseModel:
    """Convenience function to validate configuration.
    
    Args:
        config: Configuration dictionary
        schema: Pydantic model for validation
        
    Returns:
        Validated Pydantic model instance
    """
    validator = ConfigValidator(schema)
    return validator.validate(config)