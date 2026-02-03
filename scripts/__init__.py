"""
CDD Scripts Package

This package contains command-line tools for Constitution-Driven Development.
Includes audit tools, feature management, and system monitoring utilities.
"""

__version__ = "2.0.0"
__author__ = "CDD Development Team"

# Import key modules to make them available at package level
__all__ = [
    'cdd_audit',
    'cdd_feature', 
    'measure_entropy',
    'verify_versions',
    'utils',
]