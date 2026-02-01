"""
宏观分析API路由模块 - 集成legacy_quarantine金融分析功能
包含全球资产数据加载、RSRS/VolSkew指标计算、DeepSeek策略分析等API
"""

import sys
import json
import uuid
import time
import asyncio
import os
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.responses import StreamingResponse, JSONResponse, Response
import pandas as pd

try:
    from macro.config import MacroConfig
    from macro.data_loader import GlobalMacroLoader
    from macro.strategist import DeepSeekStrategist
    from micro.momentum_scanner import MomentumRanker
    from micro.industry_analyzer import IndustryAnalyzer
except ImportError:
    # Fallback for direct module execution
    from server.macro.config import MacroConfig
    from server.macro.data_loader import GlobalMacroLoader
    from server.macro.strategist import DeepSeekStrategist
    from server.micro.momentum_scanner import MomentumRanker
    from server.micro.industry_analyzer import IndustryAnalyzer

from .async_wrapper import get_task_manager, run_in_thread
from .api_routes import verify_token, FastJsonResponse

router = APIRouter(prefix="/api/v1", tags=["macro"])

# 全局缓存和状态
_task_manager = get_task_manager()

# ==================== 宏观数据接口 ====================

@router.get("/macro/market/data", dependencies=[Depends(verify_token)])
async def get_macro_market_data():
    """
    获取全球核心资产数据
    
    返回科技股(QQQ)、黄金(GLD)、数字货币(BTC-USD)及A股(000300.SS)的历史价格数据
    """
    try:
        config = MacroConfig()
        loader = GlobalMacroLoader(config)
        
        # 获取数据
        data = loader.fetch_combined_data()
        
        if data is None or data.empty:
            raise HTTPException(status_code=500, detail="获取市场数据失败")
        
        # 转换为列式传输格式
        df_response = data.reset_index()
        df_response.columns = df_response.columns.astype(str)
        
        # 获取数据摘要
        summary = loader.get_market_summary(data)
        
        response_data = {
            "summary": summary,
            "data": {
                "columns": df_response.columns.tolist(),
                "data": df_response.values.tolist()
            }
        }
        
        return FastJsonResponse(response_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取宏观数据失败: {str(e)}")

@router.get("/macro/metrics", dependencies=[Depends(verify_token)])
async def get_macro_metrics():
    """
    计算宏观指标
    
    返回包括:
    - 波动率 (Volatility)
    - 中期趋势 (Medium Trend)
    - 短期动量 (Short Momentum)
    - RSRS趋势强度指标
    - VolSkew波动率偏度风险指标
    """
    try:
        config = MacroConfig()
        loader = GlobalMacroLoader(config)
        
        # 获取数据
        data = loader.fetch_combined_data()
        
        if data is None or data.empty:
            raise HTTPException(status_code=500, detail="获取市场数据失败")
        
        # 计算指标
        metrics = loader.calculate_metrics(data)
        
        # 添加资产名称映射
        asset_names = config.get_asset_names()
        
        response_data = {
            "metrics": metrics,
            "asset_names": asset_names,
            "data_points": len(data),
            "period": {
                "start": data.index[0].strftime('%Y-%m-%d'),
                "end": data.index[-1].strftime('%Y-%m-%d'),
                "days": len(data)
            }
        }
        
        return FastJsonResponse(response_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"计算宏观指标失败: {str(e)}")

@router.post("/macro/analysis/generate", dependencies=[Depends(verify_token)])
async def generate_macro_analysis():
    """
    生成宏观策略分析报告 (DeepSeek AI分析)
    
    基于当前市场数据和指标，调用DeepSeek API生成专业的宏观策略报告
    """
    try:
        config = MacroConfig()
        loader = GlobalMacroLoader(config)
        strategist = DeepSeekStrategist(config)
        
        # 获取数据
        data = loader.fetch_combined_data()
        
        if data is None or data.empty:
            raise HTTPException(status_code=500, detail="获取市场数据失败")
        
        # 计算指标
        metrics = loader.calculate_metrics(data)
        
        # 生成报告
        report_content = strategist.generate_strategy_report(metrics, data)
        
        if not report_content:
            raise HTTPException(status_code=500, detail="生成策略报告失败")
        
        response_data = {
            "report": report_content,
            "metrics": metrics,
            "generated_at": datetime.now().isoformat(),
            "model": config.model
        }
        
        return FastJsonResponse(response_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成宏观分析报告失败: {str(e)}")

# ==================== 动量分析接口 ====================

@router.post("/momentum/analyze/{market_type}", dependencies=[Depends(verify_token)])
async def analyze_market_momentum(
    market_type: str,
    db_path: str = Query(..., description="数据库文件路径"),
):
    """
    分析市场动量，生成TOP 200动量股票榜单
    
    参数:
        market_type: 'CN' 或 'US'
        db_path: 数据库文件路径
    """
    try:
        # 创建异步任务
        task_id = str(uuid.uuid4())
        
        @run_in_thread
        def wrapped_analysis():
            def progress_callback(progress: int, message: str):
                _task_manager.update_progress(task_id, progress, message)
            
            ranker = MomentumRanker()
            results = ranker.analyze_market_momentum(
                market_type=market_type,
                db_path=db_path,
                progress_callback=progress_callback
            )
            
            # 保存结果
            output_dir = os.path.join(os.getcwd(), "data/reports/micro")
            save_path = ranker.save_momentum_results(results, market_type, output_dir)
            
            return {
                "results": results.to_dict(orient="records") if not results.empty else [],
                "save_path": save_path,
                "count": len(results)
            }
        
        # 启动任务
        _task_manager.create_task(task_id, wrapped_analysis)
        
        return FastJsonResponse({
            "task_id": task_id,
            "status": "started",
            "message": f"开始{market_type}市场动量分析",
            "started_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"启动动量分析失败: {str(e)}")

@router.get("/momentum/results/latest/{market_type}", dependencies=[Depends(verify_token)])
async def get_latest_momentum_results(
    market_type: str,
    limit: int = Query(50, ge=1, le=200, description="返回结果数量")
):
    """
    获取最新的动量分析结果
    
    参数:
        market_type: 'CN' 或 'US'
        limit: 返回结果数量
    """
    try:
        ranker = MomentumRanker()
        
        # 查找最新的CSV文件
        import glob
        pattern = f"Top200_Momentum_{market_type}_*.csv"
        files = glob.glob(os.path.join("data/reports/micro", pattern))
        
        if not files:
            return FastJsonResponse({
                "results": [],
                "message": "未找到动量分析结果文件"
            })
        
        # 获取最新的文件
        latest_file = max(files, key=os.path.getctime)
        
        # 读取CSV文件
        df = pd.read_csv(latest_file)
        
        # 限制返回数量
        if len(df) > limit:
            df = df.head(limit)
        
        response_data = {
            "file": os.path.basename(latest_file),
            "results": df.to_dict(orient="records"),
            "count": len(df),
            "generated_at": datetime.fromtimestamp(os.path.getctime(latest_file)).isoformat()
        }
        
        return FastJsonResponse(response_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取动量结果失败: {str(e)}")

# ==================== 行业分析接口 ====================

@router.post("/industry/analyze", dependencies=[Depends(verify_token)])
async def analyze_industry_trends(
    data/reports/macro_path: Optional[str] = Query(None, description="宏观报告路径"),
    cn_momentum_path: Optional[str] = Query(None, description="A股动量数据路径"),
    us_momentum_path: Optional[str] = Query(None, description="美股动量数据路径"),
):
    """
    执行行业聚类分析
    
    基于宏观报告和动量数据，进行行业聚类和产业链分析
    """
    try:
        # 创建异步任务
        task_id = str(uuid.uuid4())
        
        @run_in_thread
        def wrapped_analysis():
            def progress_callback(progress: int, message: str):
                _task_manager.update_progress(task_id, progress, message)
            
            analyzer = IndustryAnalyzer()
            report_content, filename = analyzer.run_industry_analysis(
                data/reports/macro_path=data/reports/macro_path,
                cn_momentum_path=cn_momentum_path,
                us_momentum_path=us_momentum_path,
                progress_callback=progress_callback
            )
            
            return {
                "report_content": report_content,
                "filename": filename,
                "success": report_content is not None
            }
        
        # 启动任务
        _task_manager.create_task(task_id, wrapped_analysis)
        
        return FastJsonResponse({
            "task_id": task_id,
            "status": "started",
            "message": "开始行业聚类分析",
            "started_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"启动行业分析失败: {str(e)}")

@router.get("/industry/reports/latest", dependencies=[Depends(verify_token)])
async def get_latest_industry_report(
    limit: int = Query(5, ge=1, le=20, description="返回报告数量")
):
    """
    获取最新的行业分析报告
    
    参数:
        limit: 返回报告数量
    """
    try:
        import glob
        report_dir = "research_report"
        pattern = os.path.join(report_dir, "industry_analysis_*.md")
        files = glob.glob(pattern)
        
        if not files:
            return FastJsonResponse({
                "reports": [],
                "message": "未找到行业分析报告"
            })
        
        # 按修改时间排序，获取最新的文件
        files.sort(key=os.path.getmtime, reverse=True)
        latest_files = files[:limit]
        
        reports = []
        for file_path in latest_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 提取标题 (从内容中查找TITLE: 或者使用文件名)
                import re
                title_match = re.search(r"^#\s+(.*)$", content, re.MULTILINE)
                title = title_match.group(1) if title_match else os.path.basename(file_path)
                
                # 提取摘要 (前200个字符)
                summary = content[:200] + "..." if len(content) > 200 else content
                
                reports.append({
                    "filename": os.path.basename(file_path),
                    "title": title,
                    "summary": summary,
                    "size": os.path.getsize(file_path),
                    "created_at": datetime.fromtimestamp(os.path.getctime(file_path)).isoformat(),
                    "modified_at": datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat()
                })
            except Exception as e:
                # 跳过读取失败的文件
                continue
        
        return FastJsonResponse({
            "reports": reports,
            "count": len(reports)
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取行业报告失败: {str(e)}")

@router.get("/industry/report/content/{filename}", dependencies=[Depends(verify_token)])
async def get_industry_report_content(
    filename: str
):
    """
    获取特定行业分析报告的内容
    
    参数:
        filename: 报告文件名
    """
    try:
        report_path = os.path.join("research_report", filename)
        
        if not os.path.exists(report_path):
            raise HTTPException(status_code=404, detail="报告文件不存在")
        
        with open(report_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 提取基本信息
        import re
        title_match = re.search(r"^#\s+(.*)$", content, re.MULTILINE)
        title = title_match.group(1) if title_match else filename
        
        return FastJsonResponse({
            "filename": filename,
            "title": title,
            "content": content,
            "size": os.path.getsize(report_path),
            "created_at": datetime.fromtimestamp(os.path.getctime(report_path)).isoformat()
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"读取报告内容失败: {str(e)}")

# ==================== 系统信息接口 ====================

@router.get("/macro/system/status", dependencies=[Depends(verify_token)])
async def get_macro_system_status():
    """
    获取金融分析系统状态信息
    
    返回:
        - 宏观数据可用性
        - API配置状态
        - 最新报告状态
    """
    try:
        config = MacroConfig()
        
        # 检查宏观数据可用性
        loader = GlobalMacroLoader(config)
        data_available = False
        try:
            data = loader.fetch_combined_data()
            data_available = data is not None and not data.empty
        except:
            data_available = False
        
        # 检查API配置
        api_configured = config.api_key is not None and config.api_key != ""
        
        # 检查最新报告
        import glob
        latest_macro = max(glob.glob("data/reports/macro/*.md"), key=os.path.getctime, default=None)
        latest_industry = max(glob.glob("research_report/industry_analysis_*.md"), key=os.path.getctime, default=None)
        
        # 检查配置文件是否存在
        project_root = Path(__file__).parent.parent.parent.parent
        config_file = project_root / 'config' / 'models_config.json'
        config_source = "models_config.json" if os.path.exists(config_file) else "default"
        
        response_data = {
            "data_available": data_available,
            "api_configured": api_configured,
            "model": config.model,
            "config_source": config_source,
            "latest_reports": {
                "macro": os.path.basename(latest_macro) if latest_macro else None,
                "industry": os.path.basename(latest_industry) if latest_industry else None
            },
            "assets": config.to_dict()["assets"],
            "timestamp": datetime.now().isoformat()
        }
        
        return FastJsonResponse(response_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取系统状态失败: {str(e)}")

# ==================== 配置管理接口 ====================

@router.get("/macro/config", dependencies=[Depends(verify_token)])
async def get_macro_config():
    """
    获取当前宏观配置
    
    返回:
        - 资产配置
        - API配置
        - 参数设置
    """
    try:
        config = MacroConfig()
        
        return FastJsonResponse({
            "config": config.to_dict(),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取配置失败: {str(e)}")