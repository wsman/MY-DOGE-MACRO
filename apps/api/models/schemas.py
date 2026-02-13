"""
MY-DOGE-MACRO Pydantic Schemas
Request/Response schemas for authentication API
Version: v2.0.0
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
import uuid


# ==================== User Schemas ====================

class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)


class UserCreate(UserBase):
    """User registration schema"""
    password: str = Field(..., min_length=8, max_length=128)


class UserLogin(BaseModel):
    """User login schema"""
    username: str
    password: str


class UserResponse(BaseModel):
    """User response schema"""
    id: uuid.UUID
    email: str
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== Token Schemas ====================

class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


# ==================== OAuth Schemas ====================

class OAuthCallback(BaseModel):
    """OAuth callback schema"""
    code: str
    state: Optional[str] = None


class OAuthProvider(BaseModel):
    """OAuth provider info"""
    name: str
    login_url: str
    icon: Optional[str] = None


# ==================== GitHub OAuth Response ====================

class GitHubUser(BaseModel):
    """GitHub user data from API"""
    id: int
    login: str
    email: Optional[str] = None
    name: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class GitHubTokenResponse(BaseModel):
    """GitHub OAuth token response"""
    access_token: str
    token_type: str
    scope: str


# ==================== Auth Response ====================

class AuthResponse(BaseModel):
    """Combined auth response with user and tokens"""
    user: UserResponse
    tokens: TokenResponse


# ==================== Error Schemas ====================

class AuthError(BaseModel):
    """Authentication error response"""
    error: str
    detail: str
    error_code: Optional[str] = None


# ==================== Session Schemas ====================

class SessionResponse(BaseModel):
    """Session information"""
    id: uuid.UUID
    user_agent: Optional[str]
    ip_address: Optional[str]
    last_activity: datetime
    created_at: datetime

    class Config:
        from_attributes = True