"""
相关性分析模块 - 计算资产间相关性矩阵和检测异动
Created: 2026-02-06 (T-05a)
功能：计算资产间相关性、生成热力图数据、检测相关性突变
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime, timedelta
import json
import asyncio
from dataclasses import dataclass, field
from scipy.stats import pearsonr, spearmanr
from collections import deque
import warnings
warnings.filterwarnings('ignore')


@dataclass
class CorrelationMetrics:
    """相关性指标数据类"""
    ticker1: str
    ticker2: str
    correlation: float  # Pearson相关系数
    p_value: float  # 显著性p值
    spearman_corr: float  # Spearman等级相关系数
    sample_size: int  # 样本数量
    period_days: int  # 计算周期（天）
    last_calculated: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "ticker1": self.ticker1,
            "ticker2": self.ticker2,
            "correlation": round(self.correlation, 4),
            "p_value": round(self.p_value, 4),
            "spearman_corr": round(self.spearman_corr, 4),
            "sample_size": self.sample_size,
            "period_days": self.period_days,
            "last_calculated": self.last_calculated.isoformat()
        }


@dataclass
class CorrelationDivergence:
    """相关性异动检测结果"""
    ticker1: str
    ticker2: str
    current_corr: float
    historical_mean: float
    historical_std: float
    z_score: float
    divergence_score: float  # 0-1之间的异动分数，越高表示异动越严重
    change_direction: str  # "increased" 或 "decreased"
    significance: str  # "low", "medium", "high", "critical"
    detected_at: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "ticker1": self.ticker1,
            "ticker2": self.ticker2,
            "current_corr": round(self.current_corr, 4),
            "historical_mean": round(self.historical_mean, 4),
            "historical_std": round(self.historical_std, 4),
            "z_score": round(self.z_score, 2),
            "divergence_score": round(self.divergence_score, 3),
            "change_direction": self.change_direction,
            "significance": self.significance,
            "detected_at": self.detected_at.isoformat()
        }


class CorrelationAnalyzer:
    """
    相关性分析引擎
    
    主要功能：
    1. 计算资产间相关性矩阵
    2. 生成热力图数据
    3. 检测相关性突变
    4. 监控多资产联动
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        初始化相关性分析引擎
        
        Args:
            config: 配置字典，包含以下可选参数：
                - default_period: 默认计算周期（天），默认30
                - min_samples: 最小样本数量，默认20
                - divergence_threshold: 异动阈值（Z-score），默认2.0
                - history_window: 历史窗口大小，默认100
        """
        self.config = config or {}
        self.default_period = self.config.get("default_period", 30)
        self.min_samples = self.config.get("min_samples", 20)
        self.divergence_threshold = self.config.get("divergence_threshold", 2.0)
        self.history_window = self.config.get("history_window", 100)
        
        # 存储历史相关性数据
        self.correlation_history: Dict[Tuple[str, str], deque] = {}
        
        # 存储异动记录
        self.divergence_records: List[CorrelationDivergence] = []
        
        # 默认监控的资产列表
        self.default_tickers = ["QQQ", "GLD", "BTC-USD", "000300.SS"]
        
    def calculate_pair_correlation(self, 
                                 series1: pd.Series, 
                                 series2: pd.Series,
                                 period: Optional[int] = None) -> Optional[CorrelationMetrics]:
        """
        计算两个时间序列之间的相关性
        
        Args:
            series1: 第一个时间序列
            series2: 第二个时间序列
            period: 计算周期（天）
            
        Returns:
            CorrelationMetrics 对象，如果计算失败返回 None
        """
        if period is None:
            period = self.default_period
        
        # 对齐时间序列
        aligned = pd.concat([series1, series2], axis=1).dropna()
        
        if len(aligned) < self.min_samples:
            return None
        
        # 限制数据周期
        if len(aligned) > period * 2:  # 保留足够的历史数据用于计算
            aligned = aligned.iloc[-period * 2:]
        
        # 计算Pearson相关系数
        try:
            corr, p_value = pearsonr(aligned.iloc[:, 0], aligned.iloc[:, 1])
            
            # 计算Spearman等级相关系数
            spearman_corr, _ = spearmanr(aligned.iloc[:, 0], aligned.iloc[:, 1])
            
            # 处理NaN值
            if np.isnan(corr) or np.isnan(spearman_corr):
                return None
            
            return CorrelationMetrics(
                ticker1=aligned.columns[0],
                ticker2=aligned.columns[1],
                correlation=corr,
                p_value=p_value,
                spearman_corr=spearman_corr,
                sample_size=len(aligned),
                period_days=period
            )
        except Exception as e:
            print(f"计算相关性时出错: {e}")
            return None
    
    def calculate_correlation_matrix(self, 
                                   data: pd.DataFrame,
                                   tickers: Optional[List[str]] = None,
                                   period: Optional[int] = None) -> Dict[str, Any]:
        """
        计算资产间的相关性矩阵
        
        Args:
            data: 包含多资产价格数据的DataFrame，列为资产代码，行为时间
            tickers: 要计算的资产列表，如果为None则使用data的所有列
            period: 计算周期（天）
            
        Returns:
            包含相关性矩阵和元数据的字典
        """
        if tickers is None:
            tickers = list(data.columns)
        
        if period is None:
            period = self.default_period
        
        # 过滤有效资产
        valid_tickers = [t for t in tickers if t in data.columns]
        if len(valid_tickers) < 2:
            return {"error": "至少需要两个有效资产"}
        
        # 初始化结果矩阵
        n = len(valid_tickers)
        correlation_matrix = np.eye(n)  # 对角线为1
        p_value_matrix = np.eye(n)
        spearman_matrix = np.eye(n)
        sample_sizes = np.zeros((n, n))
        
        # 计算所有配对的相关性
        metrics_dict = {}
        for i in range(n):
            for j in range(i + 1, n):
                ticker1 = valid_tickers[i]
                ticker2 = valid_tickers[j]
                
                metrics = self.calculate_pair_correlation(
                    data[ticker1], 
                    data[ticker2],
                    period
                )
                
                if metrics:
                    correlation_matrix[i, j] = metrics.correlation
                    correlation_matrix[j, i] = metrics.correlation
                    
                    p_value_matrix[i, j] = metrics.p_value
                    p_value_matrix[j, i] = metrics.p_value
                    
                    spearman_matrix[i, j] = metrics.spearman_corr
                    spearman_matrix[j, i] = metrics.spearman_corr
                    
                    sample_sizes[i, j] = metrics.sample_size
                    sample_sizes[j, i] = metrics.sample_size
                    
                    # 保存指标
                    key = f"{ticker1}_{ticker2}"
                    metrics_dict[key] = metrics.to_dict()
                    
                    # 更新历史记录
                    self._update_correlation_history(metrics)
        
        # 生成热力图数据格式
        heatmap_data = []
        for i in range(n):
            for j in range(n):
                if i != j:
                    heatmap_data.append({
                        "x": valid_tickers[i],
                        "y": valid_tickers[j],
                        "value": round(correlation_matrix[i, j], 4),
                        "p_value": round(p_value_matrix[i, j], 4),
                        "spearman": round(spearman_matrix[i, j], 4),
                        "samples": int(sample_sizes[i, j])
                    })
        
        return {
            "tickers": valid_tickers,
            "correlation_matrix": correlation_matrix.tolist(),
            "p_value_matrix": p_value_matrix.tolist(),
            "spearman_matrix": spearman_matrix.tolist(),
            "sample_sizes": sample_sizes.tolist(),
            "heatmap_data": heatmap_data,
            "metrics": metrics_dict,
            "period_days": period,
            "calculated_at": datetime.now().isoformat()
        }
    
    def _update_correlation_history(self, metrics: CorrelationMetrics):
        """更新相关性历史记录"""
        key = (metrics.ticker1, metrics.ticker2)
        
        if key not in self.correlation_history:
            self.correlation_history[key] = deque(maxlen=self.history_window)
        
        self.correlation_history[key].append({
            "correlation": metrics.correlation,
            "timestamp": metrics.last_calculated,
            "sample_size": metrics.sample_size
        })
    
    def detect_divergences(self, 
                          current_metrics: Dict[str, CorrelationMetrics],
                          threshold: Optional[float] = None) -> List[CorrelationDivergence]:
        """
        检测相关性异动
        
        Args:
            current_metrics: 当前相关性指标的字典，键为"ticker1_ticker2"
            threshold: 异动检测阈值（Z-score），如果为None使用默认阈值
            
        Returns:
            检测到的异动列表
        """
        if threshold is None:
            threshold = self.divergence_threshold
        
        divergences = []
        
        for key, metric in current_metrics.items():
            ticker1, ticker2 = key.split("_")
            history_key = (ticker1, ticker2)
            
            if history_key not in self.correlation_history:
                continue
            
            history = list(self.correlation_history[history_key])
            if len(history) < 10:  # 至少需要10个历史点
                continue
            
            # 提取历史相关性值
            historical_corrs = [h["correlation"] for h in history]
            historical_mean = np.mean(historical_corrs)
            historical_std = np.std(historical_corrs)
            
            # 避免除零
            if historical_std < 0.001:
                continue
            
            # 计算Z-score
            z_score = (metric.correlation - historical_mean) / historical_std
            
            # 检查是否超过阈值
            if abs(z_score) >= threshold:
                # 计算异动分数（0-1）
                divergence_score = min(1.0, abs(z_score) / (threshold * 2))
                
                # 确定变化方向
                change_direction = "increased" if metric.correlation > historical_mean else "decreased"
                
                # 确定显著性等级
                if abs(z_score) >= 3.0:
                    significance = "critical"
                elif abs(z_score) >= 2.5:
                    significance = "high"
                elif abs(z_score) >= 2.0:
                    significance = "medium"
                else:
                    significance = "low"
                
                divergence = CorrelationDivergence(
                    ticker1=ticker1,
                    ticker2=ticker2,
                    current_corr=metric.correlation,
                    historical_mean=historical_mean,
                    historical_std=historical_std,
                    z_score=z_score,
                    divergence_score=divergence_score,
                    change_direction=change_direction,
                    significance=significance
                )
                
                divergences.append(divergence)
                self.divergence_records.append(divergence)
        
        # 按异动分数排序
        divergences.sort(key=lambda x: x.divergence_score, reverse=True)
        
        return divergences
    
    def get_asset_clusters(self, 
                          correlation_matrix: np.ndarray,
                          tickers: List[str],
                          threshold: float = 0.7) -> List[List[str]]:
        """
        根据相关性矩阵进行资产聚类
        
        Args:
            correlation_matrix: 相关性矩阵
            tickers: 资产代码列表
            threshold: 聚类阈值，相关性高于此值的资产归为一类
            
        Returns:
            资产聚类列表
        """
        from scipy.cluster.hierarchy import linkage, fcluster
        from scipy.spatial.distance import squareform
        
        # 将相关性转换为距离（1 - abs(correlation)）
        n = len(tickers)
        distance_matrix = np.zeros((n, n))
        
        for i in range(n):
            for j in range(n):
                if i != j:
                    distance_matrix[i, j] = 1 - abs(correlation_matrix[i, j])
                else:
                    distance_matrix[i, j] = 0
        
        # 层次聚类
        condensed_dist = squareform(distance_matrix)
        Z = linkage(condensed_dist, method='average')
        
        # 根据阈值划分簇
        clusters = fcluster(Z, t=1 - threshold, criterion='distance')
        
        # 将资产按簇分组
        cluster_dict = {}
        for idx, cluster_id in enumerate(clusters):
            if cluster_id not in cluster_dict:
                cluster_dict[cluster_id] = []
            cluster_dict[cluster_id].append(tickers[idx])
        
        return list(cluster_dict.values())
    
    def generate_correlation_report(self, 
                                  correlation_result: Dict[str, Any],
                                  divergences: List[CorrelationDivergence] = None) -> Dict[str, Any]:
        """
        生成相关性分析报告
        
        Args:
            correlation_result: calculate_correlation_matrix的返回结果
            divergences: 检测到的异动列表
            
        Returns:
            结构化报告
        """
        tickers = correlation_result.get("tickers", [])
        corr_matrix = np.array(correlation_result.get("correlation_matrix", []))
        
        if len(tickers) == 0 or corr_matrix.size == 0:
            return {"error": "无效的输入数据"}
        
        # 计算平均相关性
        mask = ~np.eye(len(tickers), dtype=bool)  # 排除对角线
        avg_correlation = np.mean(corr_matrix[mask])
        
        # 计算相关性强度分布
        strong_pos = np.sum((corr_matrix > 0.7) & mask)
        strong_neg = np.sum((corr_matrix < -0.7) & mask)
        moderate_pos = np.sum((corr_matrix > 0.3) & (corr_matrix <= 0.7) & mask)
        moderate_neg = np.sum((corr_matrix < -0.3) & (corr_matrix >= -0.7) & mask)
        weak = np.sum((corr_matrix >= -0.3) & (corr_matrix <= 0.3) & mask)
        
        # 找出最强和最弱的相关性对
        flat_corr = corr_matrix[mask]
        flat_indices = np.where(mask)
        
        if len(flat_corr) > 0:
            max_idx = np.argmax(flat_corr)
            min_idx = np.argmin(flat_corr)
            
            strongest_pair = {
                "ticker1": tickers[flat_indices[0][max_idx]],
                "ticker2": tickers[flat_indices[1][max_idx]],
                "correlation": float(flat_corr[max_idx])
            }
            
            weakest_pair = {
                "ticker1": tickers[flat_indices[0][min_idx]],
                "ticker2": tickers[flat_indices[1][min_idx]],
                "correlation": float(flat_corr[min_idx])
            }
        else:
            strongest_pair = weakest_pair = None
        
        # 资产聚类
        clusters = self.get_asset_clusters(corr_matrix, tickers)
        
        report = {
            "summary": {
                "asset_count": len(tickers),
                "avg_correlation": round(float(avg_correlation), 4),
                "period_days": correlation_result.get("period_days", self.default_period),
                "calculated_at": correlation_result.get("calculated_at", datetime.now().isoformat())
            },
            "correlation_strength": {
                "strong_positive": int(strong_pos),
                "strong_negative": int(strong_neg),
                "moderate_positive": int(moderate_pos),
                "moderate_negative": int(moderate_neg),
                "weak": int(weak),
                "total_pairs": int(len(flat_corr))
            },
            "extreme_pairs": {
                "strongest": strongest_pair,
                "weakest": weakest_pair
            },
            "asset_clusters": clusters,
            "divergence_count": len(divergences) if divergences else 0,
            "heatmap_data": correlation_result.get("heatmap_data", [])
        }
        
        # 添加异动信息
        if divergences:
            report["divergences"] = [d.to_dict() for d in divergences[:10]]  # 只保留前10个
            critical_divergences = [d for d in divergences if d.significance == "critical"]
            report["summary"]["critical_divergences"] = len(critical_divergences)
        
        return report
    
    def analyze_market_regime(self, 
                             correlation_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        基于相关性分析市场状态
        
        Args:
            correlation_result: 相关性分析结果
            
        Returns:
            市场状态分析
        """
        corr_matrix = np.array(correlation_result.get("correlation_matrix", []))
        
        if corr_matrix.size == 0:
            return {"error": "无效的相关性矩阵"}
        
        # 计算平均相关性
        n = corr_matrix.shape[0]
        mask = ~np.eye(n, dtype=bool)
        avg_correlation = np.mean(corr_matrix[mask])
        
        # 判断市场状态
        if avg_correlation > 0.6:
            regime = "highly_correlated"
            description = "市场高度联动，可能处于风险偏好或风险规避阶段"
        elif avg_correlation > 0.3:
            regime = "moderately_correlated"
            description = "市场中等联动，资产间存在一定的共同趋势"
        elif avg_correlation > -0.3:
            regime = "low_correlation"
            description = "市场联动性较低，资产走势相对独立"
        else:
            regime = "negatively_correlated"
            description = "市场呈现负相关，可能存在避险或轮动"
        
        # 计算市场恐慌/贪婪指数（基于相关性的变化）
        # 这里简单实现：相关性突然升高可能表示恐慌/贪婪情绪
        regime_score = (avg_correlation + 1) / 2  # 归一化到0-1
        
        return {
            "regime": regime,
            "description": description,
            "avg_correlation": round(float(avg_correlation), 4),
            "regime_score": round(float(regime_score), 3),
            "assessment": self._get_regime_assessment(regime, avg_correlation),
            "timestamp": datetime.now().isoformat()
        }
    
    def _get_regime_assessment(self, regime: str, avg_corr: float) -> Dict[str, Any]:
        """获取市场状态评估"""
        assessments = {
            "highly_correlated": {
                "risk": "high",
                "diversification": "low",
                "recommendation": "考虑降低仓位或增加避险资产",
                "color": "warning"
            },
            "moderately_correlated": {
                "risk": "medium",
                "diversification": "moderate",
                "recommendation": "保持现有配置，关注市场变化",
                "color": "info"
            },
            "low_correlation": {
                "risk": "low",
                "diversification": "high",
                "recommendation": "适合进行多样化投资",
                "color": "success"
            },
            "negatively_correlated": {
                "risk": "medium",
                "diversification": "very_high",
                "recommendation": "可利用负相关进行对冲",
                "color": "info"
            }
        }
        
        return assessments.get(regime, {
            "risk": "unknown",
            "diversification": "unknown",
            "recommendation": "需要更多数据分析",
            "color": "secondary"
        })


# ==================== 工具函数 ====================

def create_sample_data(days: int = 100, tickers: List[str] = None) -> pd.DataFrame:
    """
    创建模拟数据用于测试
    
    Args:
        days: 数据天数
        tickers: 资产列表
        
    Returns:
        模拟价格DataFrame
    """
    if tickers is None:
        tickers = ["QQQ", "GLD", "BTC-USD", "000300.SS"]
    
    np.random.seed(42)
    dates = pd.date_range(end=datetime.now(), periods=days, freq='D')
    
    # 创建基准走势
    base_trend = np.cumsum(np.random.randn(days) * 0.01) + 100
    
    # 为每个资产创建数据（有一定相关性）
    data = {}
    for i, ticker in enumerate(tickers):
        # 添加一些随机噪声和特定的相关性模式
        if ticker == "QQQ":
            # 科技股与基准高度相关
            noise = np.random.randn(days) * 0.02
            data[ticker] = base_trend * (1 + noise) * (1 + i * 0.1)
        elif ticker == "GLD":
            # 黄金与基准负相关
            noise = np.random.randn(days) * 0.015
            data[ticker] = base_trend * (1 - noise * 0.5) * (0.8 + i * 0.05)
        elif ticker == "BTC-USD":
            # 比特币高波动，有一定相关性
            noise = np.random.randn(days) * 0.03
            data[ticker] = base_trend * (1 + noise * 1.5) * (0.5 + i * 0.2)
        else:
            # 其他资产
            noise = np.random.randn(days) * 0.02
            data[ticker] = base_trend * (1 + noise) * (0.9 + i * 0.05)
    
    df = pd.DataFrame(data, index=dates)
    return df


# 异步包装器
async def analyze_correlation_async(data: pd.DataFrame, **kwargs) -> Dict[str, Any]:
    """异步分析相关性"""
    analyzer = CorrelationAnalyzer()
    return await asyncio.to_thread(analyzer.calculate_correlation_matrix, data, **kwargs)


async def detect_divergences_async(metrics: Dict[str, CorrelationMetrics], **kwargs) -> List[CorrelationDivergence]:
    """异步检测异动"""
    analyzer = CorrelationAnalyzer()
    return await asyncio.to_thread(analyzer.detect_divergences, metrics, **kwargs)


if __name__ == "__main__":
    # 测试代码
    print("测试相关性分析模块...")
    
    # 创建模拟数据
    data = create_sample_data(days=50)
    print(f"数据形状: {data.shape}")
    print(f"资产: {list(data.columns)}")
    
    # 创建分析器
    analyzer = CorrelationAnalyzer()
    
    # 计算相关性矩阵
    result = analyzer.calculate_correlation_matrix(data)
    
    print(f"\n相关性矩阵形状: {np.array(result['correlation_matrix']).shape}")
    print(f"热力图数据点: {len(result['heatmap_data'])}")
    
    # 生成报告
    report = analyzer.generate_correlation_report(result)
    print(f"\n报告摘要:")
    print(f"- 资产数量: {report['summary']['asset_count']}")
    print(f"- 平均相关性: {report['summary']['avg_correlation']}")
    print(f"- 最强相关性对: {report['extreme_pairs']['strongest']}")
    
    # 分析市场状态
    regime = analyzer.analyze_market_regime(result)
    print(f"\n市场状态: {regime['regime']}")
    print(f"- 描述: {regime['description']}")
    print(f"- 风险评估: {regime['assessment']['risk']}")
    print(f"- 建议: {regime['assessment']['recommendation']}")
    
    print("\n测试完成！")