"""
Yale CAS Authentication Module
"""

import os
from typing import Optional
from fastapi import HTTPException, Request
import jwt
from datetime import datetime, timedelta

# CAS Configuration
CAS_SERVER = "https://secure.its.yale.edu/cas"
CAS_VERSION = 3

# JWT Configuration
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Application URLs (will be set from environment)
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")


def create_access_token(netid: str) -> str:
    """Create a JWT token for authenticated user."""
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": netid,
        "exp": expire,
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> Optional[str]:
    """Verify JWT token and return netid if valid."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        netid: str = payload.get("sub")
        return netid
    except jwt.ExpiredSignatureError:
        return None
    except jwt.JWTError:
        return None


def get_current_user(request: Request) -> str:
    """Get current authenticated user from request."""
    # Check for auth token in cookie or header
    token = request.cookies.get("auth_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    netid = verify_token(token)
    if not netid:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return netid


def get_cas_login_url(service_url: str) -> str:
    """Generate CAS login URL."""
    return f"{CAS_SERVER}/login?service={service_url}"


def get_cas_logout_url(service_url: str) -> str:
    """Generate CAS logout URL."""
    return f"{CAS_SERVER}/logout?service={service_url}"

