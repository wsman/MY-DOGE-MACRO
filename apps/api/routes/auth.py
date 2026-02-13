"""
MY-DOGE-MACRO Authentication Routes
Login, logout, OAuth, token refresh endpoints
Version: v2.0.0
"""

from datetime import datetime, timedelta
from typing import Optional
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import select

from ..core.database import get_db
from ..models.user import User, OAuthAccount, RefreshToken
from ..models.schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    AuthResponse, RefreshTokenRequest
)
from ..utils.jwt import (
    create_access_token, create_refresh_token, decode_access_token,
    hash_token, verify_token_hash, get_expires_in_seconds
)
from ..utils.password import hash_password, verify_password
from ..utils.oauth import (
    get_github_login_url, exchange_code_for_token, get_github_user,
    is_oauth_configured
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)

# OAuth state storage (in production, use Redis)
oauth_states: dict = {}


# ==================== Dependencies ====================

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current authenticated user from JWT token"""
    if not credentials:
        return None
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
    
    user = db.execute(
        select(User).where(User.id == uuid.UUID(user_id))
    ).scalar_one_or_none()
    
    return user


async def require_auth(
    user: Optional[User] = Depends(get_current_user)
) -> User:
    """Require authenticated user"""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return user


# ==================== Registration & Login ====================

@router.post("/register", response_model=AuthResponse)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Register new user with email and password"""
    # Check if user exists
    existing = db.execute(
        select(User).where(
            (User.email == user_data.email) | (User.username == user_data.username)
        )
    ).scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )
    
    # Create user
    user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=hash_password(user_data.password),
        display_name=user_data.username,
        is_active=True,
        is_verified=False
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Generate tokens
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    
    # Store refresh token
    rt = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(rt)
    db.commit()
    
    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=get_expires_in_seconds()
        )
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """Login with username and password"""
    # Find user
    user = db.execute(
        select(User).where(
            (User.username == credentials.username) | 
            (User.email == credentials.username)
        )
    ).scalar_one_or_none()
    
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )
    
    # Generate tokens
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    
    # Store refresh token
    rt = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(rt)
    db.commit()
    
    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=get_expires_in_seconds()
        )
    )


@router.post("/logout")
async def logout(
    user: User = Depends(require_auth),
    db: Session = Depends(get_db)
):
    """Logout current user (revoke all refresh tokens)"""
    # Revoke all refresh tokens for user
    db.execute(
        RefreshToken.__table__.update()
        .where(RefreshToken.user_id == user.id)
        .values(revoked=True)
    )
    db.commit()
    
    return {"message": "Logged out successfully"}


# ==================== Token Refresh ====================

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token"""
    # Find refresh token
    rt = db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == hash_token(data.refresh_token),
            RefreshToken.revoked == False
        )
    ).scalar_one_or_none()
    
    if not rt:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    if rt.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired"
        )
    
    # Get user
    user = db.get(User, rt.user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or disabled"
        )
    
    # Revoke old refresh token
    rt.revoked = True
    
    # Generate new tokens
    access_token = create_access_token(str(user.id))
    new_refresh_token = create_refresh_token(str(user.id))
    
    # Store new refresh token
    new_rt = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(new_refresh_token),
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(new_rt)
    db.commit()
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=get_expires_in_seconds()
    )


# ==================== OAuth - GitHub ====================

@router.get("/oauth/github")
async def github_login():
    """Start GitHub OAuth flow"""
    if not is_oauth_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub OAuth not configured"
        )
    
    login_url, state = get_github_login_url()
    oauth_states[state] = datetime.utcnow()
    
    return {"login_url": login_url, "state": state}


@router.get("/oauth/callback", response_model=AuthResponse)
async def github_callback(
    code: str,
    state: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Handle GitHub OAuth callback"""
    # Validate state (optional but recommended)
    if state and state in oauth_states:
        del oauth_states[state]
    
    # Exchange code for token
    token_data = await exchange_code_for_token(code)
    if not token_data or "access_token" not in token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to exchange code for token"
        )
    
    access_token = token_data["access_token"]
    
    # Get GitHub user info
    github_user = await get_github_user(access_token)
    if not github_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get GitHub user info"
        )
    
    # Find or create OAuth account
    oauth_account = db.execute(
        select(OAuthAccount).where(
            OAuthAccount.provider == "github",
            OAuthAccount.provider_user_id == str(github_user.id)
        )
    ).scalar_one_or_none()
    
    if oauth_account:
        # Existing user - update token
        user = oauth_account.user
        oauth_account.access_token = access_token
    else:
        # Check if user exists with same email
        user = db.execute(
            select(User).where(User.email == github_user.email)
        ).scalar_one_or_none()
        
        if not user:
            # Create new user
            user = User(
                email=github_user.email or f"{github_user.login}@users.noreply.github.com",
                username=github_user.login,
                display_name=github_user.name or github_user.login,
                avatar_url=github_user.avatar_url,
                is_active=True,
                is_verified=True  # GitHub verified
            )
            db.add(user)
            db.flush()
        
        # Create OAuth account
        oauth_account = OAuthAccount(
            user_id=user.id,
            provider="github",
            provider_user_id=str(github_user.id),
            access_token=access_token
        )
        db.add(oauth_account)
    
    db.commit()
    db.refresh(user)
    
    # Generate tokens
    jwt_access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    
    # Store refresh token
    rt = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(rt)
    db.commit()
    
    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=TokenResponse(
            access_token=jwt_access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=get_expires_in_seconds()
        )
    )


# ==================== User Info ====================

@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(require_auth)):
    """Get current authenticated user"""
    return UserResponse.model_validate(user)


@router.get("/check")
async def check_auth(user: Optional[User] = Depends(get_current_user)):
    """Check if user is authenticated"""
    if user:
        return {
            "authenticated": True,
            "user": {
                "id": str(user.id),
                "username": user.username,
                "email": user.email
            }
        }
    return {"authenticated": False}