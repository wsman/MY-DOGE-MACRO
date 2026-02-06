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
import numpy as np

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

# ==================== 相关性分析接口 ====================

@router.get("/macro/correlation", dependencies=[Depends(verify_token)])
async def get_correlation_matrix(
    period: int = Query(30, ge=10, le=365, description="计算周期（天）"),
    tickers: Optional[str] = Query(None, description="资产代码列表，用逗号分隔，如：QQQ,GLD,BTC-USD,000300.SS")
):
    """
    计算资产间相关性矩阵
    
    返回：
        - 相关性矩阵
        - 热力图数据
        - 显著性检验结果
    """
    try:
        config = MacroConfig()
        loader = GlobalMacroLoader(config)
        
        # 获取市场数据
        data = loader.fetch_combined_data()
        
        if data is None or data.empty:
            raise HTTPException(status_code=500, detail="获取市场数据失败")
        
        # 如果指定了tickers，过滤数据
        if tickers:
            ticker_list = [t.strip() for t in tickers.split(",")]
            # 只保留数据中存在的tickers
            available_tickers = [t for t in ticker_list if t in data.columns]
            if len(available_tickers) < 2:
                raise HTTPException(status_code=400, detail="至少需要两个有效资产代码")
            data = data[available_tickers]
        
        # 导入相关性分析模块
        from .correlation import CorrelationAnalyzer
        
        # 计算相关性矩阵
        analyzer = CorrelationAnalyzer({"default_period": period})
        correlation_result = analyzer.calculate_correlation_matrix(data, period=period)
        
        if "error" in correlation_result:
            raise HTTPException(status_code=500, detail=correlation_result["error"])
        
        # 分析市场状态
        regime_analysis = analyzer.analyze_market_regime(correlation_result)
        
        response_data = {
            "correlation": correlation_result,
            "regime_analysis": regime_analysis,
            "summary": {
                "asset_count": len(correlation_result.get("tickers", [])),
                "period_days": period,
                "calculated_at": datetime.now().isoformat()
            }
        }
        
        return FastJsonResponse(response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"计算相关性矩阵失败: {str(e)}")


@router.get("/macro/correlation/heatmap", dependencies=[Depends(verify_token)])
async def get_correlation_heatmap(
    period: int = Query(30, ge=10, le=365, description="计算周期（天）")
):
    """
    获取相关性热力图数据
    
    返回格式化的热力图数据，适用于前端图表展示
    """
    try:
        config = MacroConfig()
        loader = GlobalMacroLoader(config)
        
        # 获取市场数据
        data = loader.fetch_combined_data()
        
        if data is None or data.empty:
            raise HTTPException(status_code=500, detail="获取市场数据失败")
        
        # 导入相关性分析模块
        from .correlation import CorrelationAnalyzer
        
        # 计算相关性矩阵
        analyzer = CorrelationAnalyzer({"default_period": period})
        correlation_result = analyzer.calculate_correlation_matrix(data, period=period)
        
        if "error" in correlation_result:
            raise HTTPException(status_code=500, detail=correlation_result["error"])
        
        # 提取热力图数据
        heatmap_data = correlation_result.get("heatmap_data", [])
        
        # 格式化热力图数据用于前端展示
        formatted_data = []
        for item in heatmap_data:
            value = item["value"]
            # 根据相关性值确定颜色
            if value >= 0.7:
                color = "#ef4444"  # 红色，强正相关
            elif value >= 0.3:
                color = "#f97316"  # 橙色，中等正相关
            elif value >= 0:
                color = "#fbbf24"  # 黄色，弱正相关
            elif value >= -0.3:
                color = "#22c55e"  # 绿色，弱负相关
            elif value >= -0.7:
                color = "#3b82f6"  # 蓝色，中等负相关
            else:
                color = "#8b5cf6"  # 紫色，强负相关
            
            formatted_data.append({
                "x": item["x"],
                "y": item["y"],
                "value": value,
                "color": color,
                "p_value": item["p_value"],
                "spearman": item["spearman"],
                "samples": item["samples"]
            })
        
        response_data = {
            "heatmap": formatted_data,
            "tickers": correlation_result.get("tickers", []),
            "matrix": correlation_result.get("correlation_matrix", []),
            "period_days": period,
            "calculated_at": datetime.now().isoformat()
        }
        
        return FastJsonResponse(response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成热力图数据失败: {str(e)}")


@router.get("/macro/correlation/divergence", dependencies=[Depends(verify_token)])
async def get_correlation_divergence(
    period: int = Query(30, ge=10, le=365, description="计算周期（天）"),
    threshold: float = Query(2.0, ge=1.0, le=5.0, description="异动检测阈值（Z-score）")
):
    """
    检测相关性异动
    
    返回相关性发生显著变化的资产对
    """
    try:
        config = MacroConfig()
        loader = GlobalMacroLoader(config)
        
        # 获取市场数据
        data = loader.fetch_combined_data()
        
        if data is None or data.empty:
            raise HTTPException(status_code=500, detail="获取市场数据失败")
        
        # 导入相关性分析模块
        from .correlation import CorrelationAnalyzer
        
        # 计算相关性矩阵
        analyzer = CorrelationAnalyzer({
            "default_period": period,
            "divergence_threshold": threshold
        })
        correlation_result = analyzer.calculate_correlation_matrix(data, period=period)
        
        if "error" in correlation_result:
            raise HTTPException(status_code=500, detail=correlation_result["error"])
        
        # 从结果中提取当前指标（需要转换为CorrelationMetrics对象）
        metrics_dict = correlation_result.get("metrics", {})
        
        # 检测异动
        divergences = analyzer.detect_divergences(metrics_dict, threshold=threshold)
        
        # 生成异动报告
        divergence_list = [d.to_dict() for d in divergences]
        
        # 生成相关性报告
        correlation_report = analyzer.generate_correlation_report(
            correlation_result, 
            divergences
        )
        
        response_data = {
            "divergences": divergence_list,
            "divergence_count": len(divergence_list),
            "critical_count": sum(1 for d in divergence_list if d["significance"] == "critical"),
            "correlation_report": correlation_report,
            "period_days": period,
            "threshold": threshold,
            "calculated_at": datetime.now().isoformat()
        }
        
        return FastJsonResponse(response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"检测相关性异动失败: {str(e)}")


@router.get("/macro/correlation/clusters", dependencies=[Depends(verify_token)])
async def get_asset_clusters(
    period: int = Query(30, ge=10, le=365, description="计算周期（天）"),
    threshold: float = Query(0.7, ge=0.1, le=0.9, description="聚类阈值（相关性）")
):
    """
    基于相关性进行资产聚类
    
    返回相关性较高的资产分组
    """
    try:
        config = MacroConfig()
        loader = GlobalMacroLoader(config)
        
        # 获取市场数据
        data = loader.fetch_combined_data()
        
        if data is None or data.empty:
            raise HTTPException(status_code=500, detail="获取市场数据失败")
        
        # 导入相关性分析模块
        from .correlation import CorrelationAnalyzer
        
        # 计算相关性矩阵
        analyzer = CorrelationAnalyzer({"default_period": period})
        correlation_result = analyzer.calculate_correlation_matrix(data, period=period)
        
        if "error" in correlation_result:
            raise HTTPException(status_code=500, detail=correlation_result["error"])
        
        # 获取资产聚类
        corr_matrix = np.array(correlation_result["correlation_matrix"])
        tickers = correlation_result["tickers"]
        
        clusters = analyzer.get_asset_clusters(corr_matrix, tickers, threshold=threshold)
        
        response_data = {
            "clusters": clusters,
            "cluster_count": len(clusters),
            "threshold": threshold,
            "period_days": period,
            "tickers": tickers,
            "calculated_at": datetime.now().isoformat()
        }
        
        return FastJsonResponse(response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"资产聚类失败: {str(e)}")


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
    macro_path: Optional[str] = Query(None, description="宏观报告路径"),
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
                macro_path=macro_path,
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