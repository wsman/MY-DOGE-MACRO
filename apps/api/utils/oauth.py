"""
MY-DOGE-MACRO OAuth Utilities
GitHub OAuth2 client implementation
Version: v2.0.0
"""

import os
import secrets
from typing import Optional, Dict, Any
from urllib.parse import urlencode

import httpx
from pydantic import BaseModel

# Configuration from environment
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
OAUTH_REDIRECT_URI = os.getenv("OAUTH_REDIRECT_URI", "http://localhost:3000/auth/callback")

# GitHub OAuth URLs
GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_API = "https://api.github.com/user"


class GitHubUserInfo(BaseModel):
    """GitHub user information"""
    id: int
    login: str
    email: Optional[str] = None
    name: Optional[str] = None
    avatar_url: Optional[str] = None


def get_github_login_url(state: Optional[str] = None) -> str:
    """
    Generate GitHub OAuth login URL
    
    Args:
        state: Optional state parameter for CSRF protection
        
    Returns:
        GitHub authorization URL
    """
    if not state:
        state = secrets.token_urlsafe(16)
    
    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": OAUTH_REDIRECT_URI,
        "scope": "user:email",
        "state": state
    }
    
    return f"{GITHUB_AUTHORIZE_URL}?{urlencode(params)}", state


async def exchange_code_for_token(code: str) -> Optional[Dict[str, Any]]:
    """
    Exchange authorization code for access token
    
    Args:
        code: Authorization code from GitHub callback
        
    Returns:
        Token response or None on failure
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GITHUB_TOKEN_URL,
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": OAUTH_REDIRECT_URI
            },
            headers={"Accept": "application/json"}
        )
        
        if response.status_code != 200:
            return None
            
        return response.json()


async def get_github_user(access_token: str) -> Optional[GitHubUserInfo]:
    """
    Get GitHub user information using access token
    
    Args:
        access_token: GitHub OAuth access token
        
    Returns:
        GitHubUserInfo or None on failure
    """
    async with httpx.AsyncClient() as client:
        # Get user profile
        response = await client.get(
            GITHUB_USER_API,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json"
            }
        )
        
        if response.status_code != 200:
            return None
            
        data = response.json()
        
        # If email is not public, fetch emails
        email = data.get("email")
        if not email:
            emails = await get_github_emails(client, access_token)
            if emails:
                # Use primary verified email
                for e in emails:
                    if e.get("primary") and e.get("verified"):
                        email = e.get("email")
                        break
                # Fallback to any verified email
                if not email:
                    for e in emails:
                        if e.get("verified"):
                            email = e.get("email")
                            break
        
        return GitHubUserInfo(
            id=data.get("id"),
            login=data.get("login"),
            email=email,
            name=data.get("name"),
            avatar_url=data.get("avatar_url")
        )


async def get_github_emails(client: httpx.AsyncClient, access_token: str) -> Optional[list]:
    """
    Get GitHub user emails
    
    Args:
        client: httpx AsyncClient
        access_token: GitHub OAuth access token
        
    Returns:
        List of emails or None
    """
    response = await client.get(
        "https://api.github.com/user/emails",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json"
        }
    )
    
    if response.status_code == 200:
        return response.json()
    return None


def is_oauth_configured() -> bool:
    """Check if GitHub OAuth is properly configured"""
    return bool(GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET)