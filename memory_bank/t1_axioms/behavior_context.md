# Behavior Context - Runtime Assertions

> **Version**: v1.0.0  
> **Last Updated**: 2026-02-01 21:30

## Runtime Behavior Specifications

### Data Acquisition Behavior (v1.5.0 Updated)

1. **Yahoo Finance**
   - Must handle rate limiting (max 5 requests/second)
   - Fallback to cached data on API failure
   - Map ticker symbols (QQQ, BTC → BTC-USD)

2. **通达信 DB**
   - Must parse .day file format correctly
   - Handle both A-share and US stock formats

### Analysis Behavior (v1.5.0 Updated)

1. **RSRS Indicator**
   - Returns value in range [-1.0, 1.0]
   - Score: 0-100 (standardized)
   - Signal: long (≥70), short (≤30), hold (40-60)

2. **Volatility Skew**
   - Short-term: 5-day window
   - Long-term: 20-day window
   - Ratio > 1.5 indicates high volatility

### Report Generation (v1.5.0 Updated)

1. **DeepSeek API**
   - Generate markdown report
   - Archive to `macro_report/` directory
   - Include timestamp in filename
   - Model: deepseek-reasoner

## Tier 3 Verification Targets

```python
# Tier 3 checks (pytest):
# test_rsrs_range(): assert -1.0 <= rsrs <= 1.0
# test_rsrs_score(): assert 0 <= score <= 100
# test_volatility_skew_ratio(): assert 0 < skew < 3.0
# test_report_creation(): assert report file exists
# test_api_endpoints(): assert 200 OK response
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| API timeout | Return cached data, log warning |
| Invalid input | Raise ValueError with message |
| File not found | Return empty DataFrame |
| Yfinance error | Log error, return None |
