# Backend API Reference (T3 Reference)

> **Source**: `../../../memory_bank/t3_documentation/api/backend-api.md`  
> **Version**: v1.8.1  
> **Last Updated**: 2026-02-07  
> **Category**: API Reference  
> **Audience**: Developers, API Consumers  
> **Status**: ✅ Current

## Overview

Reference document for the MY-DOGE Quant API v1.8.1 (FastAPI) backend services.

This document provides a structured reference to the complete API documentation, which covers quantitative market data, macro analysis, and system management endpoints.

## Key Content Summary

### API Overview
- **Service Address**: `http://localhost:8765` (default)
- **API Prefix**: `/api/v1`
- **Authentication**: Token-based (Header: `x-auth-token`)
- **Data Formats**: JSON (most endpoints), Split-format columnar transmission (large data endpoints)

### Authentication Mechanism
All API endpoints require a valid authentication token in the request headers.

#### Request Header Requirements
```http
x-auth-token: your-api-token
```

#### Server Startup
```bash
cd server
python server.py --host 0.0.0.0 --port 8765 --token your-secret-token
```

## Quantitative API

### Health Checks
- **GET `/health`**: Check server status and system information
- **GET `/health_check`**: Simplified health check for frontend connection testing

### Market Data Endpoints
- **GET `/api/v1/market/kline/{symbol}`**: Get OHLC data for specific symbol
- **GET `/api/v1/market/test/bulk`**: Performance testing with bulk data generation

### Market Scanning Management
- **POST `/api/v1/scan/start`**: Start market scanning task (asynchronous)
- **GET `/api/v1/scan/status/{task_id}`**: Get scanning task status
- **GET `/api/v1/scan/status/stream`**: Server-Sent Events real-time progress stream
- **POST `/api/v1/scan/cancel/{task_id}`**: Cancel scanning task

### Market Snapshot
- **GET `/api/v1/market/snapshot`**: Get latest market-wide trading snapshots

### System Information
- **GET `/api/v1/system/info`**: Get system information and performance statistics

## Macro API

### Macro Market Data
- **GET `/api/v1/macro/market/data`**: Get global core asset data (tech stocks, gold, crypto, A-shares)
- **GET `/api/v1/macro/metrics`**: Calculate macro indicators (volatility, trend, momentum, RSRS, VolSkew)

### Momentum Analysis
- **POST `/api/v1/momentum/analyze/{market_type}`**: Analyze market momentum, generate TOP 200 momentum stock rankings
- **GET `/api/v1/momentum/results/latest/{market_type}`**: Get latest momentum analysis results

### Industry Analysis
- **POST `/api/v1/industry/analyze`**: Perform industry clustering analysis
- **GET `/api/v1/industry/reports/latest`**: Get latest industry analysis reports
- **GET `/api/v1/industry/report/content/{filename}`**: Get specific industry analysis report content

### System Status and Configuration
- **GET `/api/v1/macro/system/status`**: Get financial analysis system status
- **GET `/api/v1/macro/config`**: Get current macro configuration

## Performance Optimization Features

### 1. Columnar Transmission (Split Format)
Large data interfaces use `orient="split"` format, reducing transmission size by 30-50% compared to traditional `records` format.

### 2. Response Caching
Hotspot data interfaces automatically cache:
- K-line data: 60 second TTL
- Market snapshots: 3 second TTL
- Macro data: 300 second TTL

### 3. GZIP Compression
All responses automatically enable GZIP compression (data larger than 1KB).

### 4. Rate Limiting
- Maximum 100 requests per minute per IP address
- Local addresses (127.0.0.1, localhost) have no rate limits

## Error Handling

### HTTP Status Codes
- `200`: Success
- `401`: Authentication failed (invalid token)
- `404`: Resource not found
- `429`: Rate limit exceeded
- `500`: Server internal error

### Error Response Format
```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "detail": "Optional technical details"
}
```

## Data File Structure
```
data/
├── market_data.db           # SQLite database (market data)
├── reports/
│   ├── macro/              # Macro analysis reports
│   └── micro/              # Momentum analysis results
└── research_report/        # Industry analysis reports
```

## Quick Examples

### Python Client Example
```python
import requests

# Configuration
BASE_URL = "http://localhost:8765"
TOKEN = "your-api-token"

headers = {
    "x-auth-token": TOKEN
}

# Get market snapshot
response = requests.get(f"{BASE_URL}/api/v1/market/snapshot", headers=headers)
data = response.json()

# Get macro data
response = requests.get(f"{BASE_URL}/api/v1/macro/market/data", headers=headers)
macro_data = response.json()
```

### JavaScript/TypeScript Frontend Example
```typescript
const fetchMarketData = async () => {
  const response = await fetch('http://localhost:8765/api/v1/market/snapshot', {
    headers: {
      'x-auth-token': 'your-api-token'
    }
  });
  const data = await response.json();
  return data;
};
```

## Related Documents

### Within T3 Documentation
- [Architecture Guide](../architecture/v1.6.0-modular-architecture.md)
- [Development Guide](../development/getting-started.md)
- [Deployment Guide](../deployment/deployment-guide.md)

### CDD Internal Documents
- **Technical Law Index**: `../../t0_core/technical_law_index.md` - Overview of all standards
- **Project Readme**: `../../t0_core/project_readme.md` - T0 seed document
- **Active Context**: `../../t0_core/active_context.md` - Current system state

### External Documents
- **Full API Document**: [../../../memory_bank/t3_documentation/api/backend-api.md](../../../memory_bank/t3_documentation/api/backend-api.md)
- **Root README**: `../../../README.md` - Complete project overview
- **CHANGELOG**: `../../../CHANGELOG.md` - Version history and changes

## Access Methods

### For Detailed Information
- **Primary Source**: [Complete API Document](../../../memory_bank/t3_documentation/api/backend-api.md)
- **GitHub**: https://github.com/wsman/MY-DOGE-MACRO/tree/main/memory_bank/t3_documentation/api
- **Documentation Center**: `../../../memory_bank/t3_documentation/README.md`

### For AI Agents
- **CDD Path**: `memory_bank/t3_documentation/api/`
- **Structured Metadata**: Version, category, audience, status
- **Relationship Context**: Links to related T0-T2 documents

### For Developers
- **Quick Reference**: This document provides key API information
- **Implementation Details**: Full document for complete API specifications
- **Integration Examples**: Code examples for common integrations

---

**Document Status**: ✅ Current (v1.8.1)  
**Maintained by**: Negentropy Lab AI Agent System  
**CDD Framework**: v1.6.1  
**API Version**: v1.8.1  
**Last Verified**: 2026-02-07
