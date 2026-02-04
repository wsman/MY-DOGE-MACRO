"""
DeepSeek API 集成模块

用于AI驱动的宏观分析和策略报告生成
"""

import os
from typing import Dict, Any, Optional
from datetime import datetime
from openai import OpenAI
import json
import logging

logger = logging.getLogger(__name__)


class DeepSeekAnalyzer:
    """
    DeepSeek AI 分析器
    
    用于:
    - 宏观市场分析
    - 量化策略建议生成
    - 投资风险评估
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://api.deepseek.com"
    ):
        """
        Args:
            api_key: DeepSeek API Key
            base_url: API 基础URL
        """
        self.api_key = api_key or os.getenv('DEEPSEEK_API_KEY')
        self.base_url = base_url
        
        if not self.api_key:
            logger.warning("未配置 DeepSeek API Key")
        
        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url
        )
    
    def analyze_market(
        self,
        market_data: Dict[str, Any],
        rsrs_data: Optional[Dict[str, Any]] = None,
        volatility_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        综合市场分析
        
        Args:
            market_data: 市场数据
            rsrs_data: RSRS指标数据
            volatility_data: 波动率数据
        
        Returns:
            分析结果
        """
        prompt = self._build_market_analysis_prompt(
            market_data, rsrs_data, volatility_data
        )
        
        try:
            response = self.client.chat.completions.create(
                model="deepseek-reasoner",
                messages=[
                    {
                        "role": "system",
                        "content": "你是专业的量化投资分析师，专注于宏观市场分析和量化策略生成。请提供专业、客观的分析报告。"
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=2048,
                temperature=0.3
            )
            
            return {
                'success': True,
                'analysis': response.choices[0].message.content,
                'model': 'deepseek-reasoner',
                'updated_at': datetime.now()
            }
            
        except Exception as e:
            logger.error(f"市场分析失败: {e}")
            return {
                'success': False,
                'error': str(e),
                'updated_at': datetime.now()
            }
    
    def generate_strategy_report(
        self,
        ticker: str,
        analysis_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        生成策略报告
        """
        prompt = self._build_strategy_prompt(ticker, analysis_context)
        
        try:
            response = self.client.chat.completions.create(
                model="deepseek-reasoner",
                messages=[
                    {
                        "role": "system",
                        "content": "你是资深量化策略师。请为用户提供详细的量化策略报告，包括：市场概况、技术分析、风险评估、操作建议。"
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=4096,
                temperature=0.5
            )
            
            return {
                'success': True,
                'report': response.choices[0].message.content,
                'model': 'deepseek-reasoner',
                'updated_at': datetime.now()
            }
            
        except Exception as e:
            logger.error(f"策略报告生成失败: {e}")
            return {
                'success': False,
                'error': str(e),
                'updated_at': datetime.now()
            }
    
    def _build_market_analysis_prompt(
        self,
        market_data: Dict[str, Any],
        rsrs_data: Optional[Dict[str, Any]],
        volatility_data: Optional[Dict[str, Any]]
    ) -> str:
        """构建市场分析提示"""
        return f"""
请分析以下市场数据并给出专业意见:

## 市场概况
{json.dumps(market_data, ensure_ascii=False, indent=2)}

## 技术指标

### RSRS (阻力支撑相对强度)
{json.dumps(rsrs_data, ensure_ascii=False, indent=2) if rsrs_data else "数据不可用"}

### 波动率偏度
{json.dumps(volatility_data, ensure_ascii=False, indent=2) if volatility_data else "数据不可用"}

请提供:
1. 市场趋势判断
2. 关键风险提示
3. 投资建议
"""
    
    def _build_strategy_prompt(
        self,
        ticker: str,
        context: Dict[str, Any]
    ) -> str:
        """构建策略提示"""
        return f"""
请为 {ticker} 生成量化策略报告:

## 分析上下文
{json.dumps(context, ensure_ascii=False, indent=2)}

请生成包含以下内容的策略报告:
1. 执行摘要
2. 技术分析
3. 风险评估
4. 交易策略建议
5. 入场/出场点位
"""


# 便捷函数
def analyze_market(
    market_data: Dict[str, Any],
    rsrs_data: Optional[Dict[str, Any]] = None,
    volatility_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """快速市场分析"""
    analyzer = DeepSeekAnalyzer()
    return analyzer.analyze_market(market_data, rsrs_data, volatility_data)


def generate_report(
    ticker: str,
    context: Dict[str, Any]
) -> Dict[str, Any]:
    """快速生成策略报告"""
    analyzer = DeepSeekAnalyzer()
    return analyzer.generate_strategy_report(ticker, context)


if __name__ == '__main__':
    # 测试
    print("=== DeepSeek Analyzer 测试 ===")
    
    analyzer = DeepSeekAnalyzer()
    
    # 测试市场分析
    test_data = {
        'QQQ': {'price': 450.25, 'change': 2.5},
        'SPY': {'price': 520.10, 'change': -0.3}
    }
    
    print(f"\n测试数据: {test_data}")
    print("\n由于需要API密钥，实际调用请配置 DEEPSEEK_API_KEY")
