"""
数据仓库服务
支持本地存储 (SQLite + 文件系统) + GitHub 远程同步

Created: 2026-02-06 (v1.9.0)
"""

import os
import json
import csv
import sqlite3
import hashlib
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class DataRepository:
    """
    数据仓库管理器
    
    双层存储架构:
    - SQLite: 结构化索引，支持快速查询
    - 文件系统: 源文件存储 (MD研报, CSV市场数据)
    """
    
    def __init__(self, data_dir: str = None):
        """
        初始化数据仓库
        
        Args:
            data_dir: 数据目录路径，默认为项目根目录下的 data/
        """
        if data_dir is None:
            # 默认使用项目根目录下的 data/
            project_root = Path(__file__).parent.parent.parent.parent
            data_dir = project_root / "data"
        
        self.data_dir = Path(data_dir)
        self.reports_dir = self.data_dir / "reports"
        self.market_dir = self.data_dir / "market"
        self.alerts_dir = self.data_dir / "alerts"
        self.cache_dir = self.data_dir / "cache"
        self.db_path = self.cache_dir / "reports.db"
        self.sync_config_path = self.data_dir / "sync.json"
        
        self._ensure_structure()
        self._init_db()
    
    def _ensure_structure(self):
        """确保目录结构存在"""
        directories = [
            self.reports_dir,
            self.reports_dir / "templates",
            self.market_dir / "daily" / "CN",
            self.market_dir / "daily" / "US",
            self.market_dir / "indicators",
            self.market_dir / "macro",
            self.alerts_dir,
            self.cache_dir,
        ]
        for d in directories:
            d.mkdir(parents=True, exist_ok=True)
    
    def _init_db(self):
        """初始化 SQLite 索引数据库"""
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript("""
                -- 研报索引表
                CREATE TABLE IF NOT EXISTS reports (
                    id TEXT PRIMARY KEY,
                    file_path TEXT NOT NULL,
                    ticker TEXT,
                    title TEXT,
                    summary TEXT,
                    sentiment TEXT,
                    confidence REAL,
                    model TEXT,
                    created_at TIMESTAMP,
                    synced_at TIMESTAMP,
                    checksum TEXT
                );
                
                -- 市场数据文件索引表
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
                
                -- 同步日志表
                CREATE TABLE IF NOT EXISTS sync_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    direction TEXT,
                    status TEXT,
                    files_pulled INTEGER DEFAULT 0,
                    files_pushed INTEGER DEFAULT 0,
                    errors TEXT,
                    started_at TIMESTAMP,
                    completed_at TIMESTAMP
                );
                
                -- 索引
                CREATE INDEX IF NOT EXISTS idx_reports_ticker ON reports(ticker);
                CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_market_ticker ON market_files(ticker);
                CREATE INDEX IF NOT EXISTS idx_market_type ON market_files(data_type, market);
            """)
    
    # ==================== 研报操作 ====================
    
    def save_report(self, report: Dict[str, Any]) -> str:
        """
        保存研报 (SQLite + MD 文件)
        
        Args:
            report: 研报数据，包含 ticker, title, summary, content, sentiment, confidence, model
        
        Returns:
            研报 ID
        """
        now = datetime.now()
        report_id = report.get('id') or f"{now.strftime('%Y%m%d%H%M%S')}_{report.get('ticker', 'UNKNOWN')}"
        
        # 生成文件路径: reports/YYYY/MM/YYYYMMDD_TICKER_title.md
        year_month = now.strftime("%Y/%m")
        safe_title = self._sanitize_filename(report.get('title', 'Untitled'))
        filename = f"{now.strftime('%Y%m%d')}_{report.get('ticker', 'UNKNOWN')}_{safe_title}.md"
        rel_path = f"{year_month}/{filename}"
        full_path = self.reports_dir / rel_path
        
        # 确保目录存在
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        # 写入 Markdown 文件 (带 YAML Front Matter)
        md_content = self._format_report_md(report, report_id, now)
        full_path.write_text(md_content, encoding='utf-8')
        
        # 更新 SQLite 索引
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO reports 
                (id, file_path, ticker, title, summary, sentiment, confidence, model, created_at, checksum)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                report_id,
                rel_path,
                report.get('ticker'),
                report.get('title'),
                report.get('summary', '')[:500],  # 摘要截断
                report.get('sentiment'),
                report.get('confidence'),
                report.get('model'),
                now.isoformat(),
                self._file_checksum(full_path)
            ))
        
        # 更新索引文件
        self._update_reports_index()
        
        logger.info(f"Report saved: {report_id} -> {rel_path}")
        return report_id
    
    def get_report(self, report_id: str) -> Optional[Dict]:
        """
        获取研报
        
        Args:
            report_id: 研报 ID
        
        Returns:
            研报数据（包含完整内容）或 None
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
            if not row:
                return None
            
            report = dict(row)
            
            # 读取完整内容
            full_path = self.reports_dir / report['file_path']
            if full_path.exists():
                content = full_path.read_text(encoding='utf-8')
                # 提取 YAML Front Matter 后的内容
                if content.startswith('---'):
                    parts = content.split('---', 2)
                    if len(parts) >= 3:
                        report['content'] = parts[2].strip()
                    else:
                        report['content'] = content
                else:
                    report['content'] = content
            
            return report
    
    def list_reports(self, limit: int = 50, offset: int = 0, ticker: str = None) -> List[Dict]:
        """
        列出研报
        
        Args:
            limit: 返回数量限制
            offset: 偏移量
            ticker: 可选，按标的筛选
        
        Returns:
            研报列表（不含完整内容）
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            query = "SELECT id, file_path, ticker, title, summary, sentiment, confidence, model, created_at FROM reports"
            params = []
            
            if ticker:
                query += " WHERE ticker = ?"
                params.append(ticker)
            
            query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            rows = conn.execute(query, params).fetchall()
            return [dict(row) for row in rows]
    
    def delete_report(self, report_id: str) -> bool:
        """
        删除研报
        
        Args:
            report_id: 研报 ID
        
        Returns:
            是否成功删除
        """
        with sqlite3.connect(self.db_path) as conn:
            # 获取文件路径
            row = conn.execute("SELECT file_path FROM reports WHERE id = ?", (report_id,)).fetchone()
            if not row:
                return False
            
            file_path = self.reports_dir / row[0]
            
            # 删除文件
            if file_path.exists():
                file_path.unlink()
            
            # 删除索引
            conn.execute("DELETE FROM reports WHERE id = ?", (report_id,))
            
            # 更新索引文件
            self._update_reports_index()
            
            logger.info(f"Report deleted: {report_id}")
            return True
    
    def search_reports(self, query: str, limit: int = 20) -> List[Dict]:
        """
        搜索研报
        
        Args:
            query: 搜索关键词
            limit: 返回数量限制
        
        Returns:
            匹配的研报列表
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            # 简单的 LIKE 搜索
            sql = """
                SELECT id, file_path, ticker, title, summary, sentiment, confidence, model, created_at
                FROM reports
                WHERE title LIKE ? OR ticker LIKE ? OR summary LIKE ?
                ORDER BY created_at DESC
                LIMIT ?
            """
            pattern = f"%{query}%"
            rows = conn.execute(sql, (pattern, pattern, pattern, limit)).fetchall()
            return [dict(row) for row in rows]
    
    # ==================== 市场数据操作 ====================
    
    def save_market_data(self, ticker: str, market: str, data: List[Dict], data_type: str = "daily") -> str:
        """
        保存市场数据为 CSV
        
        Args:
            ticker: 股票代码
            market: 市场 (CN/US)
            data: OHLCV 数据列表
            data_type: 数据类型 (daily/indicators/macro)
        
        Returns:
            文件 ID
        """
        if not data:
            return ""
        
        filename = f"{ticker}.csv"
        rel_path = f"{data_type}/{market}/{filename}"
        full_path = self.market_dir / rel_path
        
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        # 写入 CSV
        with open(full_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        
        # 更新索引
        file_id = f"{market}_{ticker}_{data_type}"
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO market_files
                (id, file_path, ticker, market, data_type, start_date, end_date, row_count, updated_at, checksum)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                file_id,
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
        
        logger.info(f"Market data saved: {file_id} ({len(data)} rows)")
        return file_id
    
    def load_market_data(self, ticker: str, market: str, data_type: str = "daily") -> List[Dict]:
        """
        加载市场数据
        
        Args:
            ticker: 股票代码
            market: 市场 (CN/US)
            data_type: 数据类型
        
        Returns:
            OHLCV 数据列表
        """
        rel_path = f"{data_type}/{market}/{ticker}.csv"
        full_path = self.market_dir / rel_path
        
        if not full_path.exists():
            return []
        
        with open(full_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            return list(reader)
    
    def list_market_files(self, market: str = None, data_type: str = None) -> List[Dict]:
        """
        列出市场数据文件
        
        Args:
            market: 可选，筛选市场
            data_type: 可选，筛选数据类型
        
        Returns:
            文件索引列表
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            query = "SELECT * FROM market_files WHERE 1=1"
            params = []
            
            if market:
                query += " AND market = ?"
                params.append(market)
            if data_type:
                query += " AND data_type = ?"
                params.append(data_type)
            
            query += " ORDER BY updated_at DESC"
            rows = conn.execute(query, params).fetchall()
            return [dict(row) for row in rows]
    
    # ==================== GitHub 同步 ====================
    
    def get_sync_config(self) -> Dict:
        """获取同步配置"""
        if self.sync_config_path.exists():
            return json.loads(self.sync_config_path.read_text(encoding='utf-8'))
        return {
            "version": "1.0.0",
            "remote": {"enabled": False},
            "permissions": {"role": "user", "can_push": False, "can_configure": False}
        }
    
    def update_sync_config(self, updates: Dict) -> Dict:
        """更新同步配置"""
        config = self.get_sync_config()
        
        # 深度合并
        for key, value in updates.items():
            if isinstance(value, dict) and key in config:
                config[key].update(value)
            else:
                config[key] = value
        
        self.sync_config_path.write_text(json.dumps(config, indent=2, ensure_ascii=False), encoding='utf-8')
        return config
    
    async def sync_with_remote(self, direction: str = "pull") -> Dict[str, Any]:
        """
        与 GitHub 远程仓库同步
        
        Args:
            direction: "pull" (从远程拉取) | "push" (推送到远程) | "both" (双向)
        
        Returns:
            同步结果
        """
        config = self.get_sync_config()
        
        if not config.get('remote', {}).get('enabled'):
            return {"success": False, "error": "Remote sync not enabled"}
        
        # 检查权限
        permissions = config.get('permissions', {})
        if direction in ["push", "both"] and not permissions.get('can_push'):
            return {"success": False, "error": "No push permission"}
        
        result = {
            "success": True,
            "direction": direction,
            "files_pulled": 0,
            "files_pushed": 0,
            "errors": [],
            "started_at": datetime.now().isoformat()
        }
        
        try:
            repo = config['remote'].get('repository')
            branch = config['remote'].get('branch', 'main')
            token_env = config['remote'].get('token_env', 'GITHUB_PAT')
            token = os.environ.get(token_env)
            
            if not token:
                return {"success": False, "error": f"GitHub token not found in env: {token_env}"}
            
            if not repo:
                return {"success": False, "error": "Remote repository not configured"}
            
            if direction in ["pull", "both"]:
                pull_result = await self._git_pull(repo, branch, token, config)
                result['files_pulled'] = pull_result.get('files', 0)
                if pull_result.get('error'):
                    result['errors'].append(f"Pull error: {pull_result['error']}")
            
            if direction in ["push", "both"]:
                push_result = await self._git_push(repo, branch, token, config)
                result['files_pushed'] = push_result.get('files', 0)
                if push_result.get('error'):
                    result['errors'].append(f"Push error: {push_result['error']}")
            
            result['success'] = len(result['errors']) == 0
            result['completed_at'] = datetime.now().isoformat()
            
            # 记录同步日志
            self._log_sync(result)
            
            # 更新 sync.json 状态
            self.update_sync_config({
                "last_sync": {
                    "timestamp": result['completed_at'],
                    "status": "success" if result['success'] else "partial",
                    "files_pulled": result['files_pulled'],
                    "files_pushed": result['files_pushed']
                }
            })
            
            # 重建索引
            if result['files_pulled'] > 0:
                await self.rebuild_index()
            
        except Exception as e:
            logger.exception("Sync failed")
            result['success'] = False
            result['errors'].append(str(e))
        
        return result
    
    async def _git_pull(self, repo: str, branch: str, token: str, config: Dict) -> Dict:
        """从 GitHub 拉取数据"""
        try:
            import aiohttp
        except ImportError:
            return {"error": "aiohttp not installed. Run: pip install aiohttp"}
        
        files_pulled = 0
        sync_rules = config.get('sync_rules', {})
        
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"token {token}",
                    "Accept": "application/vnd.github.v3+json"
                }
                
                # 获取仓库内容树
                api_url = f"https://api.github.com/repos/{repo}/git/trees/{branch}?recursive=1"
                
                async with session.get(api_url, headers=headers) as resp:
                    if resp.status == 404:
                        return {"error": f"Repository not found: {repo}"}
                    if resp.status == 401:
                        return {"error": "GitHub authentication failed"}
                    if resp.status != 200:
                        return {"error": f"GitHub API error: {resp.status}"}
                    
                    tree_data = await resp.json()
                    
                    for item in tree_data.get('tree', []):
                        if item['type'] != 'blob':
                            continue
                        
                        path = item['path']
                        
                        # 检查同步规则
                        should_pull = False
                        if path.startswith('reports/') and sync_rules.get('reports', {}).get('pull'):
                            should_pull = True
                        elif path.startswith('market/') and sync_rules.get('market', {}).get('pull'):
                            should_pull = True
                        
                        if should_pull:
                            await self._download_file(session, repo, branch, path, token)
                            files_pulled += 1
            
            return {"files": files_pulled}
            
        except Exception as e:
            return {"error": str(e)}
    
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
                logger.debug(f"Downloaded: {path}")
    
    async def _git_push(self, repo: str, branch: str, token: str, config: Dict) -> Dict:
        """推送数据到 GitHub (使用本地 git 命令)"""
        import subprocess
        
        try:
            cwd = str(self.data_dir)
            
            # 检查是否是 git 仓库
            git_dir = self.data_dir / ".git"
            if not git_dir.exists():
                # 初始化
                subprocess.run(["git", "init"], cwd=cwd, check=True, capture_output=True)
                subprocess.run([
                    "git", "remote", "add", "origin",
                    f"https://{token}@github.com/{repo}.git"
                ], cwd=cwd, check=True, capture_output=True)
            
            # 配置 git
            subprocess.run(["git", "config", "user.email", "mydoge@local"], cwd=cwd, capture_output=True)
            subprocess.run(["git", "config", "user.name", "MY-DOGE-MACRO"], cwd=cwd, capture_output=True)
            
            # 添加文件
            sync_rules = config.get('sync_rules', {})
            paths_to_add = []
            
            if sync_rules.get('reports', {}).get('push'):
                paths_to_add.append("reports/")
            if sync_rules.get('market', {}).get('push'):
                paths_to_add.append("market/")
            
            if not paths_to_add:
                return {"files": 0, "error": "No paths configured for push"}
            
            for path in paths_to_add:
                subprocess.run(["git", "add", path], cwd=cwd, capture_output=True)
            
            # 检查是否有变更
            status = subprocess.run(["git", "status", "--porcelain"], cwd=cwd, capture_output=True, text=True)
            if not status.stdout.strip():
                return {"files": 0}  # 没有变更
            
            # 提交
            commit_msg = f"Sync: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            subprocess.run(["git", "commit", "-m", commit_msg], cwd=cwd, capture_output=True)
            
            # 推送
            result = subprocess.run(
                ["git", "push", "-u", "origin", branch],
                cwd=cwd,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                return {"error": result.stderr or "Push failed"}
            
            # 统计推送的文件数
            files_count = len(status.stdout.strip().split('\n'))
            return {"files": files_count}
            
        except Exception as e:
            return {"error": str(e)}
    
    async def rebuild_index(self):
        """从文件系统重建 SQLite 索引"""
        logger.info("Rebuilding index from file system...")
        
        # 扫描研报
        report_count = 0
        for md_file in self.reports_dir.rglob("*.md"):
            if md_file.name.startswith('.') or 'templates' in str(md_file):
                continue
            try:
                self._index_report_file(md_file)
                report_count += 1
            except Exception as e:
                logger.warning(f"Failed to index report {md_file}: {e}")
        
        # 扫描市场数据
        market_count = 0
        for csv_file in self.market_dir.rglob("*.csv"):
            if csv_file.name.startswith('.'):
                continue
            try:
                self._index_market_file(csv_file)
                market_count += 1
            except Exception as e:
                logger.warning(f"Failed to index market file {csv_file}: {e}")
        
        # 更新索引文件
        self._update_reports_index()
        
        logger.info(f"Index rebuilt: {report_count} reports, {market_count} market files")
    
    def _index_report_file(self, file_path: Path):
        """索引单个研报文件"""
        content = file_path.read_text(encoding='utf-8')
        rel_path = str(file_path.relative_to(self.reports_dir))
        
        # 尝试解析 YAML Front Matter
        meta = {}
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 3:
                try:
                    import yaml
                    meta = yaml.safe_load(parts[1]) or {}
                except:
                    pass
        
        report_id = meta.get('id', file_path.stem)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO reports
                (id, file_path, ticker, title, sentiment, confidence, model, created_at, checksum)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                report_id,
                rel_path,
                meta.get('ticker'),
                meta.get('title', file_path.stem),
                meta.get('sentiment'),
                meta.get('confidence'),
                meta.get('model'),
                meta.get('created_at'),
                self._file_checksum(file_path)
            ))
    
    def _index_market_file(self, file_path: Path):
        """索引单个市场数据文件"""
        rel_path = str(file_path.relative_to(self.market_dir))
        parts = rel_path.replace('\\', '/').split('/')
        
        if len(parts) >= 3:
            data_type = parts[0]  # daily, indicators, macro
            market = parts[1]     # CN, US
            ticker = file_path.stem
            
            # 读取 CSV 获取行数和日期范围
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    rows = list(reader)
                    
                    file_id = f"{market}_{ticker}_{data_type}"
                    
                    with sqlite3.connect(self.db_path) as conn:
                        conn.execute("""
                            INSERT OR REPLACE INTO market_files
                            (id, file_path, ticker, market, data_type, start_date, end_date, row_count, updated_at, checksum)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            file_id,
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
            except Exception as e:
                logger.warning(f"Failed to read CSV {file_path}: {e}")
    
    # ==================== 辅助方法 ====================
    
    def _format_report_md(self, report: Dict, report_id: str, created_at: datetime) -> str:
        """格式化研报为 Markdown (带 YAML Front Matter)"""
        return f"""---
id: {report_id}
ticker: {report.get('ticker', '')}
title: {report.get('title', 'Untitled')}
sentiment: {report.get('sentiment', '')}
confidence: {report.get('confidence', '')}
model: {report.get('model', '')}
created_at: {created_at.isoformat()}
---

# {report.get('title', 'Untitled Report')}

**标的**: {report.get('ticker', 'N/A')}  
**生成时间**: {created_at.strftime('%Y-%m-%d %H:%M:%S')}  
**模型**: {report.get('model', 'N/A')}  
**置信度**: {(report.get('confidence', 0) * 100):.0f}%  
**情感**: {report.get('sentiment', 'N/A')}

---

## 摘要

{report.get('summary', '')}

---

## 详细分析

{report.get('content', '')}
"""
    
    def _sanitize_filename(self, name: str) -> str:
        """清理文件名，移除非法字符"""
        if not name:
            return "Untitled"
        # 只保留字母数字和部分安全字符
        safe_chars = set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._- ')
        result = ''.join(c for c in name if c in safe_chars)
        return result[:50] or "Untitled"
    
    def _file_checksum(self, path: Path) -> str:
        """计算文件 MD5 校验和"""
        if not path.exists():
            return ""
        return hashlib.md5(path.read_bytes()).hexdigest()
    
    def _update_reports_index(self):
        """更新研报索引文件 (reports/index.json)"""
        index_path = self.reports_dir / "index.json"
        reports = self.list_reports(limit=1000)
        
        index = {
            "updated_at": datetime.now().isoformat(),
            "count": len(reports),
            "reports": [
                {
                    "id": r['id'],
                    "ticker": r.get('ticker'),
                    "title": r.get('title'),
                    "sentiment": r.get('sentiment'),
                    "file": r['file_path'],
                    "created_at": r.get('created_at')
                }
                for r in reports
            ]
        }
        
        index_path.write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding='utf-8')
    
    def _log_sync(self, result: Dict):
        """记录同步日志"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO sync_log (direction, status, files_pulled, files_pushed, errors, started_at, completed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                result.get('direction'),
                'success' if result.get('success') else 'failed',
                result.get('files_pulled', 0),
                result.get('files_pushed', 0),
                json.dumps(result.get('errors', [])),
                result.get('started_at'),
                result.get('completed_at')
            ))
    
    def get_sync_history(self, limit: int = 20) -> List[Dict]:
        """获取同步历史"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute("""
                SELECT * FROM sync_log ORDER BY id DESC LIMIT ?
            """, (limit,)).fetchall()
            return [dict(row) for row in rows]


# ==================== 单例访问 ====================

_repository: Optional[DataRepository] = None


def get_repository() -> DataRepository:
    """获取 DataRepository 单例"""
    global _repository
    if _repository is None:
        _repository = DataRepository()
    return _repository


# ==================== 便捷函数 ====================

def save_report(report: Dict) -> str:
    """保存研报的便捷函数"""
    return get_repository().save_report(report)


def get_report(report_id: str) -> Optional[Dict]:
    """获取研报的便捷函数"""
    return get_repository().get_report(report_id)


def list_reports(limit: int = 50, ticker: str = None) -> List[Dict]:
    """列出研报的便捷函数"""
    return get_repository().list_reports(limit=limit, ticker=ticker)
