"""
数据同步 API 路由
提供 GitHub 远程同步和索引管理接口

Created: 2026-02-06 (v1.9.0)
"""

import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

from .data_repository import get_repository
from .api_routes import verify_token

router = APIRouter(prefix="/api/v1/sync", tags=["sync"])


# ==================== 请求/响应模型 ====================

class SyncTriggerRequest(BaseModel):
    """同步触发请求"""
    direction: str = Field(default="pull", pattern="^(pull|push|both)$", description="同步方向")


class SyncConfigUpdate(BaseModel):
    """同步配置更新请求"""
    repository: Optional[str] = Field(None, description="GitHub 仓库 (格式: owner/repo)")
    branch: Optional[str] = Field(None, description="分支名")
    auto_sync_enabled: Optional[bool] = Field(None, description="启用自动同步")
    auto_sync_interval: Optional[int] = Field(None, ge=5, le=1440, description="自动同步间隔(分钟)")
    enabled: Optional[bool] = Field(None, description="启用远程同步")


class SyncStatusResponse(BaseModel):
    """同步状态响应"""
    enabled: bool
    repository: Optional[str]
    branch: str
    last_sync: Optional[dict]
    permissions: dict
    auto_sync: Optional[dict]


# ==================== API 端点 ====================

@router.get("/status", response_model=SyncStatusResponse)
async def get_sync_status(token: str = Depends(verify_token)):
    """
    获取同步状态
    
    返回当前同步配置、权限和最后同步信息
    """
    repo = get_repository()
    config = repo.get_sync_config()
    
    remote = config.get('remote', {})
    
    return SyncStatusResponse(
        enabled=remote.get('enabled', False),
        repository=remote.get('repository'),
        branch=remote.get('branch', 'main'),
        last_sync=config.get('last_sync'),
        permissions=config.get('permissions', {}),
        auto_sync=remote.get('auto_sync')
    )


@router.post("/trigger")
async def trigger_sync(
    request: SyncTriggerRequest,
    background_tasks: BackgroundTasks,
    token: str = Depends(verify_token)
):
    """
    触发同步任务
    
    Args:
        direction: pull (拉取), push (推送), both (双向)
    
    同步任务在后台执行，立即返回状态
    """
    repo = get_repository()
    config = repo.get_sync_config()
    
    # 检查是否启用
    if not config.get('remote', {}).get('enabled'):
        raise HTTPException(status_code=400, detail="Remote sync not enabled. Configure repository first.")
    
    # 检查权限
    permissions = config.get('permissions', {})
    if request.direction in ["push", "both"]:
        if not permissions.get('can_push'):
            raise HTTPException(status_code=403, detail="No push permission. Admin role required.")
    
    # 后台执行同步
    async def run_sync():
        result = await repo.sync_with_remote(request.direction)
        return result
    
    background_tasks.add_task(run_sync)
    
    return {
        "status": "sync_started",
        "direction": request.direction,
        "message": f"Sync task started in background. Direction: {request.direction}"
    }


@router.post("/config")
async def update_sync_config(
    update: SyncConfigUpdate,
    token: str = Depends(verify_token)
):
    """
    更新同步配置 (仅管理员)
    
    可更新: repository, branch, auto_sync 设置, enabled 状态
    """
    repo = get_repository()
    config = repo.get_sync_config()
    
    # 检查配置权限
    if not config.get('permissions', {}).get('can_configure'):
        raise HTTPException(status_code=403, detail="No configure permission. Admin role required.")
    
    # 构建更新
    updates = {}
    
    if update.enabled is not None:
        updates.setdefault('remote', {})['enabled'] = update.enabled
    
    if update.repository is not None:
        # 验证格式
        if '/' not in update.repository:
            raise HTTPException(status_code=400, detail="Invalid repository format. Use: owner/repo")
        updates.setdefault('remote', {})['repository'] = update.repository
    
    if update.branch is not None:
        updates.setdefault('remote', {})['branch'] = update.branch
    
    if update.auto_sync_enabled is not None:
        updates.setdefault('remote', {}).setdefault('auto_sync', {})['enabled'] = update.auto_sync_enabled
    
    if update.auto_sync_interval is not None:
        updates.setdefault('remote', {}).setdefault('auto_sync', {})['interval_minutes'] = update.auto_sync_interval
    
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    # 应用更新
    new_config = repo.update_sync_config(updates)
    
    return {
        "status": "config_updated",
        "config": {
            "enabled": new_config.get('remote', {}).get('enabled'),
            "repository": new_config.get('remote', {}).get('repository'),
            "branch": new_config.get('remote', {}).get('branch'),
            "auto_sync": new_config.get('remote', {}).get('auto_sync')
        }
    }


@router.post("/rebuild-index")
async def rebuild_index(
    background_tasks: BackgroundTasks,
    token: str = Depends(verify_token)
):
    """
    重建本地索引
    
    从文件系统扫描所有研报和市场数据文件，重建 SQLite 索引
    """
    repo = get_repository()
    
    async def run_rebuild():
        await repo.rebuild_index()
    
    background_tasks.add_task(run_rebuild)
    
    return {
        "status": "rebuild_started",
        "message": "Index rebuild task started in background"
    }


@router.get("/history")
async def get_sync_history(
    limit: int = 20,
    token: str = Depends(verify_token)
):
    """
    获取同步历史记录
    
    Args:
        limit: 返回记录数量 (默认 20)
    """
    repo = get_repository()
    history = repo.get_sync_history(limit=limit)
    
    return {
        "history": history,
        "count": len(history)
    }


# ==================== 研报相关端点 (扩展) ====================

@router.get("/reports")
async def list_reports(
    limit: int = 50,
    offset: int = 0,
    ticker: Optional[str] = None,
    token: str = Depends(verify_token)
):
    """
    列出研报
    
    Args:
        limit: 返回数量
        offset: 偏移量
        ticker: 可选，按标的筛选
    """
    repo = get_repository()
    reports = repo.list_reports(limit=limit, offset=offset, ticker=ticker)
    
    return {
        "reports": reports,
        "count": len(reports),
        "limit": limit,
        "offset": offset
    }


@router.get("/reports/{report_id}")
async def get_report(
    report_id: str,
    token: str = Depends(verify_token)
):
    """
    获取研报详情
    
    Args:
        report_id: 研报 ID
    """
    repo = get_repository()
    report = repo.get_report(report_id)
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return report


@router.delete("/reports/{report_id}")
async def delete_report(
    report_id: str,
    token: str = Depends(verify_token)
):
    """
    删除研报
    
    Args:
        report_id: 研报 ID
    """
    repo = get_repository()
    config = repo.get_sync_config()
    
    # 检查权限
    if not config.get('permissions', {}).get('can_push'):
        raise HTTPException(status_code=403, detail="No delete permission. Admin role required.")
    
    success = repo.delete_report(report_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return {"status": "deleted", "report_id": report_id}


@router.get("/reports/search/{query}")
async def search_reports(
    query: str,
    limit: int = 20,
    token: str = Depends(verify_token)
):
    """
    搜索研报
    
    Args:
        query: 搜索关键词
        limit: 返回数量
    """
    repo = get_repository()
    reports = repo.search_reports(query, limit=limit)
    
    return {
        "query": query,
        "reports": reports,
        "count": len(reports)
    }


# ==================== 市场数据端点 (扩展) ====================

@router.get("/market/files")
async def list_market_files(
    market: Optional[str] = None,
    data_type: Optional[str] = None,
    token: str = Depends(verify_token)
):
    """
    列出市场数据文件
    
    Args:
        market: 可选，筛选市场 (CN/US)
        data_type: 可选，筛选数据类型 (daily/indicators/macro)
    """
    repo = get_repository()
    files = repo.list_market_files(market=market, data_type=data_type)
    
    return {
        "files": files,
        "count": len(files)
    }


@router.get("/market/{market}/{ticker}")
async def get_market_data(
    market: str,
    ticker: str,
    data_type: str = "daily",
    token: str = Depends(verify_token)
):
    """
    获取市场数据
    
    Args:
        market: 市场 (CN/US)
        ticker: 股票代码
        data_type: 数据类型 (默认 daily)
    """
    repo = get_repository()
    data = repo.load_market_data(ticker, market, data_type)
    
    if not data:
        raise HTTPException(status_code=404, detail=f"No data found for {market}/{ticker}")
    
    return {
        "ticker": ticker,
        "market": market,
        "data_type": data_type,
        "rows": len(data),
        "data": data
    }
