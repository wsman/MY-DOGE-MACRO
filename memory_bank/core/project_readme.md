# My Doge Macro - Project Seed Document

> **Created**: 2026-02-03
> **Version**: v1.2.0-performance
> **Type**: AI-Driven Quantitative Analysis System

## 🎯 Project Overview

My Doge Macro 是一个基于 AI Agent 的全栈量化情报与研报生成系统。

### Core Purpose
- 全球宏观资产联动分析 (Gold, Bitcoin, NASDAQ, A-Shares)
- 基于 LLM 的自动化研报生成
- 内置高级量化指标 (RSRS, 波动率偏度)

### Tech Stack
- **Frontend**: React 19 + TypeScript + Tauri v2 (Rust)
- **Backend**: Python FastAPI
- **Data**: pandas, numpy, scipy, yfinance, 通达信 DB
- **AI**: DeepSeek API

## 📁 Directory Structure

```
MY-DOGE-MACRO/
├── client/           # 前端 (React 19 + Tauri v2)
├── server/           # 后端 (FastAPI)
├── engine/           # 量化引擎
├── memory_bank/      # CDD 文档体系
├── config/           # 配置
├── data/             # 数据和报告
└── specs/            # 功能规格文档
```

## 🛠 Quick Start

### Backend
```bash
cd server
pip install -r requirements.txt
python server.py --host 0.0.0.0 --port 8765
```

### Frontend
```bash
cd client
npm install
npm run tauri dev
```

## 📊 Key Metrics

| Metric | Value |
|--------|-------|
| Version | v1.2.0-performance |
| RSRS Speedup | 50x |
| UI FPS | 60+ |
| Scanner Concurrency | 10 parallel |

## 🔗 References

- **GitHub**: https://github.com/wsman/MY-DOGE-MACRO
- **License**: Apache 2.0
- **Status**: Stable
