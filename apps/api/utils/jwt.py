"""
MY-DOGE-MACRO JWT Utilities
Token generation, validation, and refresh
Version: v2.0.0
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import os
import hashlib
import secrets

from jose import jwt, JWTError
from pydantic import BaseModel

# Configuration from environment
JWT_SECRET = os.getenv("JWT_SECRET", "mydoge_jwt_secret_dev_key")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
REFRESH_TOKEN_EXPIRE_DAYS = 7


class TokenPayload(BaseModel):
    """JWT token payload"""
    sub: str  # user_id
    exp: datetime
    iat: datetime
    type: str  # 'access' or 'refresh'


def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token
    
    Args:
        user_id: User UUID as string
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    
    now = datetime.utcnow()
    
    payload = {
        "sub": user_id,
        "exp": expire,
        "iat": now,
        "type": "access"
    }
    
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """
    Create refresh token
    
    Args:
        user_id: User UUID as string
        
    Returns:
        Refresh token (random string, stored in DB)
    """
    # Generate secure random token
    token = secrets.token_urlsafe(32)
    return token


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate JWT access token
    
    Args:
        token: Encoded JWT token
        
    Returns:
        Decoded payload or None if invalid
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


def get_token_expiry(token: str) -> Optional[datetime]:
    """
    Get expiration time from token
    
    Args:
        token: Encoded JWT token
        
    Returns:
        Expiration datetime or None
    """
    payload = decode_access_token(token)
    if payload:
        return datetime.fromtimestamp(payload.get("exp", 0))
    return None


def hash_token(token: str) -> str:
    """
    Hash token for storage
    
    Args:
        token: Plain token
        
    Returns:
        Hashed token
    """
    return hashlib.sha256(token.encode()).hexdigest()


def verify_token_hash(token: str, token_hash: str) -> bool:
    """
    Verify token against hash
    
    Args:
        token: Plain token
        token_hash: Stored hash
        
    Returns:
        True if matches
    """
    return hash_token(token) == token_hash


def get_expires_in_seconds() -> int:
    """Get access token expiry in seconds"""
    return JWT_EXPIRE_MINUTES * 60