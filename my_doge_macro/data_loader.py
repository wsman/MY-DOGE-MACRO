import yfinance as yf
import pandas as pd
import numpy as np
import logging
from .config import MacroConfig

logger = logging.getLogger(__name__)

class GlobalMacroLoader:
    def __init__(self, config: MacroConfig):
        self.config = config
        logger.info(f"初始化数据加载器，配置: {config}")

    def fetch_combined_data(self) -> pd.DataFrame:
        tickers = [
            self.config.tech_proxy,
            self.config.safe_haven_proxy,
            self.config.target_asset
        ]

        # 动态添加 Crypto
        if hasattr(self.config, 'crypto_proxy') and self.config.crypto_proxy:
            tickers.append(self.config.crypto_proxy)

        logger.info(f"📡 正在从全球市场同步数据: {tickers} ...")

        try:
            # 获取足够长的数据以确保 lookback window 有效
            data = yf.download(
                tickers=tickers,
                period=f"{self.config.lookback_days + 40}d",
                interval="1d",
                auto_adjust=True,
                progress=False
            )

            if data.empty:
                logger.error("下载的数据为空")
                return None

            # 兼容性处理
            if isinstance(data.columns, pd.MultiIndex):
                try:
                    if 'Close' in data.columns.levels[0]:
                        data = data['Close']
                except:
                    pass

            # 数据清洗
            data = data.ffill().dropna()

            logger.info(f"✅ 成功获取 {len(data)} 天数据")
            return data

        except Exception as e:
            logger.error(f"数据下载失败: {e}")
            return None

    def get_market_summary(self, data: pd.DataFrame) -> dict:
        if data is None or data.empty:
            return {}
        latest = data.iloc[-1]

        summary = {
            'latest_date': str(data.index[-1].date()),
            'data_points': str(len(data)),
            'tech_price': f"{latest.get(self.config.tech_proxy, 0):.2f}",
            'gold_price': f"{latest.get(self.config.safe_haven_proxy, 0):.2f}",
            'target_price': f"{latest.get(self.config.target_asset, 0):.2f}"
        }

        if hasattr(self.config, 'crypto_proxy') and self.config.crypto_proxy in latest:
             summary['crypto_price'] = f"{latest.get(self.config.crypto_proxy, 0):.2f}"

        return summary

    def calculate_metrics(self, data: pd.DataFrame) -> dict:
        """
        计算分层级的时间序列指标：
        1. 波动率 (Vol)
        2. 中期趋势 (Medium Trend): 基于整个下载周期 (约60-90天)
        3. 短期动量 (Short Momentum): 基于最近5个交易日
        """
        try:
            # 基础数据
            returns = data.pct_change()
            # 年化波动率 (使用 lookback 窗口)
            vol_window = min(len(data), 60)
            volatility = returns.tail(vol_window).std() * np.sqrt(252)

            # 1. 中期趋势 (Whole Window)
            # Formula: (P_now - P_start) / P_start
            trend_medium = (data.iloc[-1] - data.iloc[0]) / data.iloc[0]

            # 2. 短期动量 (Last 5 Days)
            # Formula: (P_now - P_t-5) / P_t-5
            if len(data) >= 6:
                momentum_short = (data.iloc[-1] - data.iloc[-6]) / data.iloc[-6]
            else:
                momentum_short = trend_medium # Fallback

            # 3. 风险信号判断 (基于中期趋势)
            risk_on = trend_medium.get(self.config.tech_proxy, 0) > trend_medium.get(self.config.safe_haven_proxy, 0)

            metrics = {
                'metadata_days': len(data),
                'tech_volatility': float(volatility.get(self.config.tech_proxy, 0)),
                'risk_on_signal': bool(risk_on)
            }

            # 遍历所有资产，分别记录长短期指标
            for col in data.columns:
                metrics[f'{col}_trend_medium'] = float(trend_medium.get(col, 0))
                metrics[f'{col}_return_5d'] = float(momentum_short.get(col, 0))

            logger.info(f"📊 指标计算完成 (Days={len(data)})")
            return metrics
        except Exception as e:
            logger.error(f"指标计算错误: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return {}
