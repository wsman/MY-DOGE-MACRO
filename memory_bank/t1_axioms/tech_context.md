# Tech Context - Interface Definitions

> **Version**: v2.0.0-alpha  
> **Last Updated**: 2026-02-13

## Docker Containerization (v2.0.0)

### Development Environment
```yaml
# docker-compose.dev.yml
services:
  api:
    build: ./apps/api (target: development)
    port: 8765 (internal)
    hot_reload: Uvicorn --reload
    
  web:
    build: ./apps/desktop (Dockerfile.dev)
    port: 1420 (internal)
    hot_reload: Vite HMR
    
  nginx:
    image: nginx:alpine
    port: 3000 (external)
    proxy:
      - / → web:1420
      - /api/ → api:8765
      - /ws/ → api:8765
```

### Production Environment
```yaml
# docker-compose.yml
services:
  api:
    build: ./apps/api (target: production)
    port: 8765 (internal)
    
  web:
    build: ./apps/desktop (Dockerfile)
    port: 80 (external)
    nginx_proxy: enabled
```

### Key Configuration Files
| File | Purpose |
|------|---------|
| `docker-compose.yml` | 生产环境配置 (端口80) |
| `docker-compose.dev.yml` | 开发环境配置 (端口3000，热重载) |
| `apps/api/Dockerfile` | 后端多阶段构建 |
| `apps/desktop/Dockerfile` | 前端生产镜像 |
| `apps/desktop/Dockerfile.dev` | 前端开发镜像 |
| `nginx/nginx.dev.conf` | 开发Nginx配置 |

---

## API Interfaces

### Frontend API Service (src/services/api.ts)

```typescript
// 市场数据API
const marketApi = {
  getQuote(ticker: string): Promise<MarketData>
  getHistorical(ticker: string, period: string): Promise<KLine[]>
  search(query: string): Promise<SearchResult[]>
  getIndices(): Promise<IndexData[]>
}

// 分析API
const analysisApi = {
  calculateRSRS(ticker: string, period: number): Promise<RSRSResult>
  calculateVolatilitySkew(ticker: string): Promise<VolatilityResult>
  analyze(ticker: string): Promise<AnalysisResult>
  getRiskSignals(): Promise<RiskSignal[]>
}

// 报告API
const reportApi = {
  generateReport(ticker: string, context: string): Promise<Report>
  getReports(limit: number): Promise<Report[]>
  getReport(id: string): Promise<Report>
}

// 投资组合API
const portfolioApi = {
  getPositions(): Promise<Position[]>
  addPosition(position: PositionInput): Promise<Position>
  getSummary(): Promise<PortfolioSummary>
}
```

### Backend API Endpoints (python_service/)

| Module | File | Functions |
|--------|------|------------|
| **Data Acquisition** | `data_acquisition.py` | `fetch_quote()`, `fetch_historical()`, `get_market_indices()` |
| **Analysis RSRS** | `analysis_rsrs.py` | `calculate()`, `calculate_from_dataframe()` |
| **Analysis Volatility** | `analysis_volatility.py` | `calculate()`, `analyze_market_sentiment()` |
| **Report Generator** | `report_generator.py` | `analyze_market()`, `generate_strategy_report()` |

### Python Module Interfaces

```python
# 数据采集
def fetch_quote(symbol: str) -> Dict[str, Any]:
    """获取实时报价"""
    
def fetch_historical(symbol: str, period: str, interval: str) -> List[Dict]:
    """获取历史K线"""

# 分析算法
def calculate_rsRS(df, ticker='', lookback=20) -> Dict:
    """计算RSRS指标"""
    
def calculate_volatility_skew(df, ticker='', short_period=5, long_period=20) -> Dict:
    """计算波动率偏度"""

# AI报告
def analyze_market(market_data, rsrs_data, volatility_data) -> Dict:
    """市场分析"""
    
def generate_strategy_report(ticker: str, context: Dict) -> Dict:
    """生成策略报告"""
```

### Frontend State (Zustand)

```typescript
// UI Store
interface UIStore {
  theme: 'dark' | 'light' | 'system'
  sidebarOpen: boolean
  toggleTheme: () => void
  // ...
}

// Analysis Store (v1.5.0新增)
interface AnalysisStore {
  marketData: Record<string, MarketData>
  rsrsIndicators: Record<string, RSRSIndicator>
  volatilitySkews: Record<string, VolatilitySkew>
  setMarketData: (ticker, data) => void
  setRSRSIndicator: (indicator) => void
  setVolatilitySkew: (skew) => void
}
```

## Tier 2 Verification Target

```python
# Tier 2 checks:
# 1. Backend endpoints defined in python_service/
# 2. Data functions accept correct types
# 3. Frontend state matches Zustand interface
```
