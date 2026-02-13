"""
MY-DOGE-MACRO Password Utilities
Password hashing and verification using bcrypt
Version: v2.0.0
"""

from passlib.context import CryptContext

# Password context with bcrypt
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12
)


def hash_password(password: str) -> str:
    """
    Hash password using bcrypt
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against hash
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Stored password hash
        
    Returns:
        True if password matches
    """
    return pwd_context.verify(plain_password, hashed_password)


def needs_rehash(hashed_password: str) -> bool:
    """
    Check if password hash needs to be updated
    
    Args:
        hashed_password: Current password hash
        
    Returns:
        True if hash should be updated
    """
    return pwd_context.needs_update(hashed_password)