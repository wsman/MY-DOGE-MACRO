# T-04b-ext: 数据仓库与 GitHub 同步架构

**版本**: v1.0.0  
**创建日期**: 2026-02-06 12:26  
**规划者**: Clawd 🦞 (架构师)  
**关联任务**: T-1.9.0-04b 研报历史存储

---

## 📊 需求分析

### 核心目标

1. **双层存储架构**: SQLite (结构化查询) + 文件系统 (源文件仓库)
2. **GitHub 同步**: 支持从指定仓库拉取/推送数据
3. **权限控制**: 管理员 (读写) / 用户 (只读)
4. **数据格式**: CSV (市场数据) + Markdown (研报)

### 数据流架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         数据仓库架构                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────────────┐      │
│  │   GitHub     │◄────►│   data/      │◄────►│     SQLite DB        │      │
│  │   Remote     │ sync │   (本地仓库)  │ index│  (结构化索引)         │      │
│  └──────────────┘      └──────────────┘      └──────────────────────┘      │
│        │                      │                        │                    │
│        │                      ▼                        ▼                    │
│        │               ┌──────────────┐        ┌──────────────┐            │
│        │               │  CSV 文件    │        │  快速查询    │            │
│        │               │  MD 研报     │        │  全文搜索    │            │
│        │               └──────────────┘        └──────────────┘            │
│        │                                                                    │
│        ▼                                                                    │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │                     权限控制层                                  │        │
│  ├─────────────────────────┬──────────────────────────────────────┤        │
│  │  管理员 (Admin)          │  用户 (User)                         │        │
│  │  ─────────────────────  │  ──────────────────────────────────  │        │
│  │  ✅ 读取本地数据         │  ✅ 读取本地数据                      │        │
│  │  ✅ 生成研报 → 写入      │  ✅ 生成研报 (仅本地缓存)             │        │
│  │  ✅ 推送到 GitHub        │  ❌ 推送到 GitHub                     │        │
│  │  ✅ 从 GitHub 拉取       │  ✅ 从 GitHub 拉取 (公开仓库)         │        │
│  │  ✅ 配置远程仓库         │  ❌ 配置远程仓库                      │        │
│  └─────────────────────────┴──────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 目录结构设计

```
data/
├── .gitkeep
├── .gitignore                    # 本地敏感数据排除
├── sync.json                     # 同步配置 (远程仓库、权限)
├── sync.lock                     # 同步锁文件
│
├── reports/                      # 📝 研报仓库
│   ├── index.json                # 研报索引 (快速检索)
│   ├── 2026/
│   │   ├── 02/
│   │   │   ├── 20260206_QQQ_策略分析.md
│   │   │   ├── 20260206_BTC_宏观报告.md
│   │   │   └── ...
│   │   └── ...
│   └── templates/                # 研报模板
│       ├── strategy_report.md
│       └── macro_analysis.md
│
├── market/                       # 📈 市场数据仓库
│   ├── index.json                # 数据索引
│   ├── daily/                    # 日线数据
│   │   ├── CN/                   # A股
│   │   │   ├── 000001.csv
│   │   │   ├── 600000.csv
│   │   │   └── ...
│   │   └── US/                   # 美股
│   │       ├── AAPL.csv
│   │       ├── QQQ.csv
│   │       └── ...
│   ├── indicators/               # 指标数据
│   │   ├── rsrs.csv
│   │   └── volatility.csv
│   └── macro/                    # 宏观数据
│       ├── correlation_matrix.csv
│       └── global_assets.csv
│
├── alerts/                       # 🔔 警报历史
│   └── history.csv
│
└── cache/                        # 🗑️ 本地缓存 (不同步)
    ├── reports.db                # SQLite 索引
    └── temp/
```

---

## 🔧 技术方案

### 1. 同步配置 (`data/sync.json`)

```json
{
  "version": "1.0.0",
  "remote": {
    "enabled": true,
    "repository": "wsman/my-doge-data",
    "branch": "main",
    "token_env": "GITHUB_PAT",
    "auto_sync": {
      "enabled": true,
      "interval_minutes": 60,
      "on_startup": true
    }
  },
  "permissions": {
    "role": "admin",
    "can_push": true,
    "can_configure": true
  },
  "sync_rules": {
    "reports": {
      "pull": true,
      "push": true,
      "conflict_strategy": "keep_both"
    },
    "market": {
      "pull": true,
      "push": false,
      "max_age_days": 365
    },
    "alerts": {
      "pull": false,
      "push": false
    }
  },
  "last_sync": {
    "timestamp": "2026-02-06T12:00:00Z",
    "status": "success",
    "files_pulled": 15,
    "files_pushed": 3
  }
}
```

### 2. 数据仓库服务 (`apps/api/core/data_repository.py`)

```python
"""
数据仓库服务
支持本地存储 + GitHub 远程同步
"""

import os
import json
import csv
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
import subprocess
import asyncio

class DataRepository:
    """数据仓库管理器"""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.reports_dir = self.data_dir / "reports"
        self.market_dir = self.data_dir / "market"
        self.cache_dir = self.data_dir / "cache"
        self.db_path = self.cache_dir / "reports.db"
        self.sync_config_path = self.data_dir / "sync.json"
        
        self._ensure_structure()
        self._init_db()
    
    def _ensure_structure(self):
        """确保目录结构存在"""
        for d in [self.reports_dir, self.market_dir, self.cache_dir,
                  self.market_dir / "daily" / "CN",
                  self.market_dir / "daily" / "US",
                  self.market_dir / "indicators",
                  self.market_dir / "macro"]:
            d.mkdir(parents=True, exist_ok=True)
    
    def _init_db(self):
        """初始化 SQLite 索引数据库"""
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS reports (
                    id TEXT PRIMARY KEY,
                    file_path TEXT NOT NULL,
                    ticker TEXT,
                    title TEXT,
                    summary TEXT,
                    sentiment TEXT,
                    model TEXT,
                    created_at TIMESTAMP,
                    synced_at TIMESTAMP,
                    checksum TEXT
                );
                
                CREATE TABLE IF NOT EXISTS market_files (
                    id TEXT PRIMARY KEY,
                    file_path TEXT NOT NULL,
                    ticker TEXT,
                    market TEXT,
                    data_type TEXT,
                    start_date DATE,
                    end_date DATE,
                    row_count INTEGER,
                    updated_at TIMESTAMP,
                    checksum TEXT
                );
                
                CREATE INDEX IF NOT EXISTS idx_reports_ticker ON reports(ticker);
                CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_market_ticker ON market_files(ticker);
            """)
    
    # ==================== 研报操作 ====================
    
    def save_report(self, report: Dict[str, Any]) -> str:
        """保存研报 (SQLite + MD 文件)"""
        report_id = report.get('id') or f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{report['ticker']}"
        
        # 生成文件路径
        now = datetime.now()
        year_month = now.strftime("%Y/%m")
        filename = f"{now.strftime('%Y%m%d')}_{report['ticker']}_{self._sanitize_filename(report['title'])}.md"
        rel_path = f"{year_month}/{filename}"
        full_path = self.reports_dir / rel_path
        
        # 确保目录存在
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        # 写入 Markdown 文件
        md_content = self._format_report_md(report)
        full_path.write_text(md_content, encoding='utf-8')
        
        # 更新 SQLite 索引
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO reports 
                (id, file_path, ticker, title, summary, sentiment, model, created_at, checksum)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                report_id,
                rel_path,
                report.get('ticker'),
                report.get('title'),
                report.get('summary'),
                report.get('sentiment'),
                report.get('model'),
                now.isoformat(),
                self._file_checksum(full_path)
            ))
        
        # 更新索引文件
        self._update_reports_index()
        
        return report_id
    
    def get_report(self, report_id: str) -> Optional[Dict]:
        """获取研报"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
            if not row:
                return None
            
            report = dict(row)
            # 读取完整内容
            full_path = self.reports_dir / report['file_path']
            if full_path.exists():
                report['content'] = full_path.read_text(encoding='utf-8')
            return report
    
    def list_reports(self, limit: int = 50, ticker: str = None) -> List[Dict]:
        """列出研报"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            query = "SELECT * FROM reports"
            params = []
            if ticker:
                query += " WHERE ticker = ?"
                params.append(ticker)
            query += " ORDER BY created_at DESC LIMIT ?"
            params.append(limit)
            rows = conn.execute(query, params).fetchall()
            return [dict(row) for row in rows]
    
    # ==================== 市场数据操作 ====================
    
    def save_market_data(self, ticker: str, market: str, data: List[Dict], data_type: str = "daily"):
        """保存市场数据为 CSV"""
        filename = f"{ticker}.csv"
        rel_path = f"{data_type}/{market}/{filename}"
        full_path = self.market_dir / rel_path
        
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        # 写入 CSV
        if data:
            with open(full_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=data[0].keys())
                writer.writeheader()
                writer.writerows(data)
            
            # 更新索引
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO market_files
                    (id, file_path, ticker, market, data_type, start_date, end_date, row_count, updated_at, checksum)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    f"{market}_{ticker}_{data_type}",
                    rel_path,
                    ticker,
                    market,
                    data_type,
                    data[0].get('date') if data else None,
                    data[-1].get('date') if data else None,
                    len(data),
                    datetime.now().isoformat(),
                    self._file_checksum(full_path)
                ))
    
    def load_market_data(self, ticker: str, market: str, data_type: str = "daily") -> List[Dict]:
        """加载市场数据"""
        rel_path = f"{data_type}/{market}/{ticker}.csv"
        full_path = self.market_dir / rel_path
        
        if not full_path.exists():
            return []
        
        with open(full_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            return list(reader)
    
    # ==================== GitHub 同步 ====================
    
    async def sync_with_remote(self, direction: str = "pull") -> Dict[str, Any]:
        """
        与 GitHub 远程仓库同步
        
        Args:
            direction: "pull" (从远程拉取) | "push" (推送到远程) | "both" (双向)
        
        Returns:
            同步结果
        """
        config = self._load_sync_config()
        if not config.get('remote', {}).get('enabled'):
            return {"success": False, "error": "Remote sync not enabled"}
        
        # 检查权限
        if direction in ["push", "both"] and not config.get('permissions', {}).get('can_push'):
            return {"success": False, "error": "No push permission"}
        
        result = {
            "success": True,
            "direction": direction,
            "files_pulled": 0,
            "files_pushed": 0,
            "errors": []
        }
        
        try:
            repo = config['remote']['repository']
            branch = config['remote'].get('branch', 'main')
            token = os.environ.get(config['remote'].get('token_env', 'GITHUB_PAT'))
            
            if not token:
                return {"success": False, "error": "GitHub token not configured"}
            
            if direction in ["pull", "both"]:
                pull_result = await self._git_pull(repo, branch, token, config)
                result['files_pulled'] = pull_result.get('files', 0)
                if pull_result.get('error'):
                    result['errors'].append(pull_result['error'])
            
            if direction in ["push", "both"]:
                push_result = await self._git_push(repo, branch, token, config)
                result['files_pushed'] = push_result.get('files', 0)
                if push_result.get('error'):
                    result['errors'].append(push_result['error'])
            
            # 更新同步状态
            self._update_sync_status(result)
            
            # 重建索引
            await self.rebuild_index()
            
        except Exception as e:
            result['success'] = False
            result['errors'].append(str(e))
        
        return result
    
    async def _git_pull(self, repo: str, branch: str, token: str, config: Dict) -> Dict:
        """从 GitHub 拉取数据"""
        # 使用 GitHub API 或 git sparse-checkout
        # 简化实现：使用 requests 下载特定文件
        
        import aiohttp
        
        files_pulled = 0
        sync_rules = config.get('sync_rules', {})
        
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"token {token}",
                "Accept": "application/vnd.github.v3+json"
            }
            
            # 获取仓库内容树
            api_url = f"https://api.github.com/repos/{repo}/git/trees/{branch}?recursive=1"
            
            async with session.get(api_url, headers=headers) as resp:
                if resp.status != 200:
                    return {"error": f"GitHub API error: {resp.status}"}
                
                tree_data = await resp.json()
                
                for item in tree_data.get('tree', []):
                    if item['type'] != 'blob':
                        continue
                    
                    path = item['path']
                    
                    # 检查同步规则
                    if path.startswith('reports/') and sync_rules.get('reports', {}).get('pull'):
                        await self._download_file(session, repo, branch, path, token)
                        files_pulled += 1
                    elif path.startswith('market/') and sync_rules.get('market', {}).get('pull'):
                        await self._download_file(session, repo, branch, path, token)
                        files_pulled += 1
        
        return {"files": files_pulled}
    
    async def _download_file(self, session, repo: str, branch: str, path: str, token: str):
        """下载单个文件"""
        raw_url = f"https://raw.githubusercontent.com/{repo}/{branch}/{path}"
        headers = {"Authorization": f"token {token}"}
        
        async with session.get(raw_url, headers=headers) as resp:
            if resp.status == 200:
                content = await resp.read()
                local_path = self.data_dir / path
                local_path.parent.mkdir(parents=True, exist_ok=True)
                local_path.write_bytes(content)
    
    async def _git_push(self, repo: str, branch: str, token: str, config: Dict) -> Dict:
        """推送数据到 GitHub"""
        # 实现需要使用 GitHub API 创建 blob/tree/commit
        # 或使用本地 git 命令
        
        # 简化版：使用 subprocess 调用 git
        try:
            cwd = str(self.data_dir)
            
            # 检查是否是 git 仓库
            if not (self.data_dir / ".git").exists():
                # 初始化
                subprocess.run(["git", "init"], cwd=cwd, check=True)
                subprocess.run(["git", "remote", "add", "origin", 
                               f"https://{token}@github.com/{repo}.git"], cwd=cwd, check=True)
            
            # 添加并提交
            subprocess.run(["git", "add", "."], cwd=cwd, check=True)
            subprocess.run(["git", "commit", "-m", f"Sync: {datetime.now().isoformat()}"], 
                          cwd=cwd, capture_output=True)
            
            # 推送
            result = subprocess.run(["git", "push", "-u", "origin", branch], 
                                   cwd=cwd, capture_output=True, text=True)
            
            if result.returncode != 0:
                return {"error": result.stderr}
            
            return {"files": 1}  # 简化
            
        except Exception as e:
            return {"error": str(e)}
    
    async def rebuild_index(self):
        """重建 SQLite 索引 (从文件系统扫描)"""
        # 扫描研报
        for md_file in self.reports_dir.rglob("*.md"):
            if md_file.name.startswith('.'):
                continue
            # 解析并索引
            self._index_report_file(md_file)
        
        # 扫描市场数据
        for csv_file in self.market_dir.rglob("*.csv"):
            if csv_file.name.startswith('.'):
                continue
            self._index_market_file(csv_file)
    
    # ==================== 辅助方法 ====================
    
    def _format_report_md(self, report: Dict) -> str:
        """格式化研报为 Markdown"""
        return f"""---
id: {report.get('id', '')}
ticker: {report.get('ticker', '')}
title: {report.get('title', '')}
sentiment: {report.get('sentiment', '')}
confidence: {report.get('confidence', '')}
model: {report.get('model', '')}
created_at: {report.get('created_at', datetime.now().isoformat())}
---

# {report.get('title', 'Untitled Report')}

**标的**: {report.get('ticker', 'N/A')}  
**生成时间**: {report.get('created_at', '')}  
**模型**: {report.get('model', '')}  
**置信度**: {report.get('confidence', 0) * 100:.0f}%  

---

## 摘要

{report.get('summary', '')}

---

## 详细分析

{report.get('content', '')}
"""
    
    def _sanitize_filename(self, name: str) -> str:
        """清理文件名"""
        return "".join(c for c in name if c.isalnum() or c in "._- ")[:50]
    
    def _file_checksum(self, path: Path) -> str:
        """计算文件校验和"""
        import hashlib
        return hashlib.md5(path.read_bytes()).hexdigest() if path.exists() else ""
    
    def _load_sync_config(self) -> Dict:
        """加载同步配置"""
        if self.sync_config_path.exists():
            return json.loads(self.sync_config_path.read_text())
        return {}
    
    def _update_sync_status(self, result: Dict):
        """更新同步状态"""
        config = self._load_sync_config()
        config['last_sync'] = {
            "timestamp": datetime.now().isoformat(),
            "status": "success" if result.get('success') else "failed",
            "files_pulled": result.get('files_pulled', 0),
            "files_pushed": result.get('files_pushed', 0)
        }
        self.sync_config_path.write_text(json.dumps(config, indent=2))
    
    def _update_reports_index(self):
        """更新研报索引文件"""
        index_path = self.reports_dir / "index.json"
        reports = self.list_reports(limit=1000)
        index = {
            "updated_at": datetime.now().isoformat(),
            "count": len(reports),
            "reports": [
                {
                    "id": r['id'],
                    "ticker": r['ticker'],
                    "title": r['title'],
                    "file": r['file_path'],
                    "created_at": r['created_at']
                }
                for r in reports
            ]
        }
        index_path.write_text(json.dumps(index, indent=2, ensure_ascii=False))
    
    def _index_report_file(self, file_path: Path):
        """索引单个研报文件"""
        # 解析 YAML front matter
        content = file_path.read_text(encoding='utf-8')
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 3:
                import yaml
                meta = yaml.safe_load(parts[1])
                rel_path = str(file_path.relative_to(self.reports_dir))
                
                with sqlite3.connect(self.db_path) as conn:
                    conn.execute("""
                        INSERT OR REPLACE INTO reports
                        (id, file_path, ticker, title, sentiment, model, created_at, checksum)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        meta.get('id', file_path.stem),
                        rel_path,
                        meta.get('ticker'),
                        meta.get('title'),
                        meta.get('sentiment'),
                        meta.get('model'),
                        meta.get('created_at'),
                        self._file_checksum(file_path)
                    ))
    
    def _index_market_file(self, file_path: Path):
        """索引单个市场数据文件"""
        rel_path = str(file_path.relative_to(self.market_dir))
        parts = rel_path.split('/')
        
        if len(parts) >= 3:
            data_type = parts[0]  # daily, indicators, macro
            market = parts[1]     # CN, US
            ticker = file_path.stem
            
            # 读取 CSV 获取行数和日期范围
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                rows = list(reader)
                
                with sqlite3.connect(self.db_path) as conn:
                    conn.execute("""
                        INSERT OR REPLACE INTO market_files
                        (id, file_path, ticker, market, data_type, start_date, end_date, row_count, updated_at, checksum)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        f"{market}_{ticker}_{data_type}",
                        rel_path,
                        ticker,
                        market,
                        data_type,
                        rows[0].get('date') if rows else None,
                        rows[-1].get('date') if rows else None,
                        len(rows),
                        datetime.now().isoformat(),
                        self._file_checksum(file_path)
                    ))


# 便捷单例
_repository: Optional[DataRepository] = None

def get_repository() -> DataRepository:
    global _repository
    if _repository is None:
        _repository = DataRepository()
    return _repository
```

### 3. API 端点 (`apps/api/core/sync_routes.py`)

```python
"""数据同步 API 路由"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from .data_repository import get_repository
from .api_routes import verify_token

router = APIRouter(prefix="/api/v1/sync", tags=["sync"])

class SyncRequest(BaseModel):
    direction: str = "pull"  # pull | push | both

class SyncConfigUpdate(BaseModel):
    repository: Optional[str] = None
    branch: Optional[str] = None
    auto_sync_enabled: Optional[bool] = None
    auto_sync_interval: Optional[int] = None

@router.get("/status", dependencies=[Depends(verify_token)])
async def get_sync_status():
    """获取同步状态"""
    repo = get_repository()
    config = repo._load_sync_config()
    return {
        "enabled": config.get('remote', {}).get('enabled', False),
        "repository": config.get('remote', {}).get('repository'),
        "last_sync": config.get('last_sync'),
        "permissions": config.get('permissions', {})
    }

@router.post("/trigger", dependencies=[Depends(verify_token)])
async def trigger_sync(request: SyncRequest, background_tasks: BackgroundTasks):
    """触发同步"""
    repo = get_repository()
    config = repo._load_sync_config()
    
    # 检查权限
    if request.direction in ["push", "both"]:
        if not config.get('permissions', {}).get('can_push'):
            raise HTTPException(status_code=403, detail="No push permission")
    
    # 后台执行同步
    background_tasks.add_task(repo.sync_with_remote, request.direction)
    
    return {"status": "sync_started", "direction": request.direction}

@router.post("/config", dependencies=[Depends(verify_token)])
async def update_sync_config(update: SyncConfigUpdate):
    """更新同步配置 (仅管理员)"""
    repo = get_repository()
    config = repo._load_sync_config()
    
    if not config.get('permissions', {}).get('can_configure'):
        raise HTTPException(status_code=403, detail="No configure permission")
    
    if update.repository:
        config.setdefault('remote', {})['repository'] = update.repository
    if update.branch:
        config['remote']['branch'] = update.branch
    if update.auto_sync_enabled is not None:
        config.setdefault('remote', {}).setdefault('auto_sync', {})['enabled'] = update.auto_sync_enabled
    if update.auto_sync_interval:
        config['remote']['auto_sync']['interval_minutes'] = update.auto_sync_interval
    
    repo.sync_config_path.write_text(json.dumps(config, indent=2))
    return {"status": "config_updated"}

@router.post("/rebuild-index", dependencies=[Depends(verify_token)])
async def rebuild_index(background_tasks: BackgroundTasks):
    """重建本地索引"""
    repo = get_repository()
    background_tasks.add_task(repo.rebuild_index)
    return {"status": "rebuild_started"}
```

### 4. 前端同步面板 (`src/components/organisms/SyncPanel.tsx`)

```tsx
import React, { useState, useEffect } from 'react';
import { Card, CardTitle, CardContent } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { apiClient } from '../../services/api';

interface SyncStatus {
  enabled: boolean;
  repository: string;
  last_sync: {
    timestamp: string;
    status: string;
    files_pulled: number;
    files_pushed: number;
  };
  permissions: {
    role: string;
    can_push: boolean;
    can_configure: boolean;
  };
}

export const SyncPanel: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  
  useEffect(() => {
    fetchStatus();
  }, []);
  
  const fetchStatus = async () => {
    const data = await apiClient.get('/api/v1/sync/status');
    setStatus(data);
  };
  
  const triggerSync = async (direction: 'pull' | 'push' | 'both') => {
    setSyncing(true);
    try {
      await apiClient.post('/api/v1/sync/trigger', { direction });
      // 轮询状态直到完成
      setTimeout(fetchStatus, 3000);
    } finally {
      setSyncing(false);
    }
  };
  
  if (!status) return <div>Loading...</div>;
  
  return (
    <Card className="sync-panel">
      <CardTitle>
        数据同步
        <Badge variant={status.enabled ? 'success' : 'secondary'}>
          {status.enabled ? '已启用' : '未启用'}
        </Badge>
      </CardTitle>
      
      <CardContent>
        <div className="sync-info">
          <p><strong>仓库:</strong> {status.repository || '未配置'}</p>
          <p><strong>角色:</strong> {status.permissions.role}</p>
          {status.last_sync && (
            <>
              <p><strong>上次同步:</strong> {new Date(status.last_sync.timestamp).toLocaleString()}</p>
              <p><strong>状态:</strong> {status.last_sync.status}</p>
              <p><strong>拉取:</strong> {status.last_sync.files_pulled} 文件</p>
              <p><strong>推送:</strong> {status.last_sync.files_pushed} 文件</p>
            </>
          )}
        </div>
        
        <div className="sync-actions">
          <Button 
            onClick={() => triggerSync('pull')} 
            disabled={syncing || !status.enabled}
          >
            从 GitHub 拉取
          </Button>
          
          {status.permissions.can_push && (
            <Button 
              onClick={() => triggerSync('push')} 
              disabled={syncing || !status.enabled}
              variant="secondary"
            >
              推送到 GitHub
            </Button>
          )}
          
          <Button 
            onClick={() => triggerSync('both')} 
            disabled={syncing || !status.enabled || !status.permissions.can_push}
            variant="primary"
          >
            双向同步
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
```

---

## 📋 子任务更新

在 T-1.9.0-04 中新增/修改：

| ID | 任务 | 描述 | 预计 |
|----|------|------|------|
| **T-04b** | ~~研报历史存储~~ → **数据仓库核心** | DataRepository + SQLite + 文件系统 | 90min |
| **T-04b-1** | GitHub 同步服务 | 拉取/推送 + 权限控制 | 60min |
| **T-04b-2** | 同步 API + 前端面板 | SyncPanel + 状态显示 | 45min |
| **T-04b-3** | 索引重建 + 启动检查 | 文件系统 → SQLite 索引 | 30min |

**新增总工时**: +3.75h (可选功能，不阻塞主流程)

---

## ✅ 验收标准

### 核心功能

- [ ] 研报保存同时写入 SQLite + MD 文件
- [ ] 市场数据保存为 CSV + 索引记录
- [ ] `data/` 目录结构符合规范

### GitHub 同步

- [ ] 可从配置的 GitHub 仓库拉取数据
- [ ] 管理员可推送本地数据到远程
- [ ] 用户角色只能拉取，不能推送
- [ ] 同步状态在 UI 可见

### 权限控制

- [ ] `sync.json` 正确配置角色权限
- [ ] API 端点检查权限后再执行
- [ ] 未授权操作返回 403

---

*规划基于 CDD v1.6.1 架构标准 | 2026-02-06 12:26*
