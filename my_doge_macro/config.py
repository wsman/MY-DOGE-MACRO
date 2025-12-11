"""
配置管理模块

负责从环境变量和 .env 文件读取配置参数
"""

import os
from dataclasses import dataclass
from typing import Optional
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()


@dataclass
class MacroConfig:
    """宏观策略配置类"""
    
    # 资产锚点 (Proxies)
    tech_proxy: str = "QQQ"       # 纳指100 ETF (代表科技叙事)
    safe_haven_proxy: str = "GLD" # 黄金 ETF (代表避险情绪)
    crypto_proxy: str = "BTC-USD" # 比特币 (代表加密货币)
    target_asset: str = "000300.SS" # 沪深300 (A股主战场)
    
    # 观察窗口
    lookback_days: int = int(os.getenv("LOOKBACK_DAYS", "150"))      # 回溯150个交易日
    volatility_window: int = 20   # 20天波动率计算

    # DeepSeek API 配置 - 从 .env 文件读取
    api_key: Optional[str] = None
    base_url: str = "https://api.deepseek.com" # DeepSeek 官方接入点
    model: str = "deepseek-chat"  # 默认使用 deepseek-chat 模型

    def __post_init__(self):
        """初始化后处理，确保 API Key 正确加载"""
        if self.api_key is None:
            self.api_key = os.getenv("DEEPSEEK_API_KEY")
            
        if not self.api_key:
            raise ValueError(
                "DeepSeek API Key 未设置。请设置环境变量 DEEPSEEK_API_KEY "
                "或在项目根目录创建 .env 文件并添加 DEEPSEEK_API_KEY=your_api_key_here"
            )

    def __repr__(self) -> str:
        """自定义 repr 方法，隐藏 api_key 的敏感信息"""
        # 获取所有字段值的字符串表示
        fields = []
        for field in self.__dataclass_fields__:
            value = getattr(self, field)
            if field == 'api_key' and value:
                # 掩码处理 API Key - 显示前缀+****+后四位
                if len(value) > 6:
                    masked_value = f"{value[:3]}****{value[-4:]}"
                else:
                    masked_value = "****"
                fields.append(f"{field}={masked_value!r}")
            elif field == 'api_key' and not value:
                # api_key 为空时显示 None
                fields.append(f"{field}=None")
            else:
                # 其他字段正常显示
                fields.append(f"{field}={value!r}")
        
        return f"MacroConfig({', '.join(fields)})"


def create_default_config() -> MacroConfig:
    """创建默认配置实例"""
    return MacroConfig()

