# DS-056: v1.3.0 Security Hardening Plan

**Feature ID**: T-C5  
**Target**: Security加固 based on external audit  
**Version**: v1.0.0  
**Date**: 2026-02-02

## 1. Background

Based on external audit (`dd002951-20260202-v4`), security scored **7.0/10** - the lowest dimension.

### Audit Findings

| Issue | Severity | Current State | Target State |
|-------|----------|---------------|--------------|
| API Key Management | P0-High | Hardcoded/default | Environment variables |
| Rate Limiting | P0-High | None | 100 req/min limit |
| Input Validation | P1-Medium | Basic Pydantic | Enhanced validation |
| Security Headers | P1-Medium | Basic CORS | Full security headers |

## 2. Implementation Tasks

### T-C5.1: API Key Environment Variables
**Priority**: P0  
**Target**: `server/core/config.py`, `config/models_config.json`

#### Actions
1. Create `.env.example` template
2. Remove default API keys from `models_config.json`
3. Update `config.py` to load from environment variables
4. Add validation for required env vars

#### Files Modified
```
config/
├── .env.example          # NEW
├── models_config.json    # MODIFIED (remove defaults)
└── config.py             # MODIFIED (load from env)
```

#### Code Changes
```python
# config.py
importydantic import Base os
from pModel, Field

class Settings(BaseModel):
    DEEPSEEK_API_KEY: str = Field(..., description="DeepSeek API Key")
    TDX_HOST: str = Field(default="localhost")
    TDX_PORT: int = Field(default=7700)
    
    @classmethod
    def from_env(cls):
        return cls(
            DEEPSEEK_API_KEY=os.getenv("DEEPSEEK_API_KEY"),
            TDX_HOST=os.getenv("TDX_HOST", "localhost"),
            TDX_PORT=int(os.getenv("TDX_PORT", 7700)),
        )
```

---

### T-C5.2: Rate Limiting Middleware
**Priority**: P0  
**Target**: `server/server.py`

#### Actions
1. Install `fastapi-limiter`
2. Configure Redis backend (optional) or in-memory
3. Add rate limit decorator to API routes

#### Files Modified
```
server/
└── server.py    # MODIFIED (add rate limiting)
```

#### Code Changes
```python
# server.py
from fastapi_limiter import Limiter
from fastapi_limiter.depends import RateLimiter

limiter = Limiter(key_func=get_remote_address)

@app.get("/market/scanner", dependencies=[Depends(RateLimiter(times=100, minutes=1))])
async def market_scanner():
    return {"status": "ok"}
```

---

### T-C5.3: Enhanced Input Validation
**Priority**: P1  
**Target**: `server/core/api_routes.py`

#### Actions
1. Add Pydantic models for all request bodies
2. Add request validation for stock codes, dates, etc.
3. Add response validation

#### Code Changes
```python
# api_routes.py
from pydantic import BaseModel, Field, validator

class ScannerRequest(BaseModel):
    market: str = Field(..., regex="^(A|US)$")
    limit: int = Field(default=100, ge=1, le=1000)
    include_indices: bool = Field(default=False)
    
    @validator('market')
    def validate_market(cls, v):
        if v not in ['A', 'US']:
            raise ValueError('market must be A or US')
        return v
```

---

### T-C5.4: Security Headers
**Priority**: P1  
**Target**: `server/server.py`

#### Actions
1. Add CORS configuration
2. Add security headers middleware
3. Document security headers

#### Code Changes
```python
# server.py
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response
```

---

## 3. Testing Plan

| Test | Method | Coverage Target |
|------|--------|-----------------|
| Env Var Loading | Unit Test | 100% |
| Rate Limit | Integration Test | 100% |
| Input Validation | Unit Test | 90% |
| Security Headers | Manual/Integration | 100% |

---

## 4. Rollback Plan

If issues arise:
1. Revert config changes
2. Keep fallback to existing config
3. Test in staging before production

---

## 5. Success Criteria

| Metric | Target |
|--------|--------|
| Security Score | ≥ 8.5/10 |
| API Key Exposure | 0 (no hardcoded keys) |
| Rate Limit | 100 req/min enforced |
| Test Coverage | ≥ 70% |

---

## 6. Timeline

| Phase | Duration | Output |
|-------|----------|--------|
| State B (Planning) | 30 min | This document |
| State C (Implementation) | 2-4 hours | Code changes |
| State D (Verification) | 1 hour | Tests passed |
| State E (Convergence) | 30 min | Updated docs |
| **Total** | **4-6 hours** | **v1.3.0 Release** |
