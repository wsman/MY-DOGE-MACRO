import logging
from openai import OpenAI
import pandas as pd
from .config import MacroConfig

logger = logging.getLogger(__name__)

class DeepSeekStrategist:
    def __init__(self, config: MacroConfig):
        self.config = config
        self.client = OpenAI(
            api_key=config.api_key,
            base_url=config.base_url
        )
        logger.info("初始化 DeepSeek 策略分析师 (Precision Mode)")

    def generate_strategy_report(self, metrics: dict, recent_data: pd.DataFrame) -> str:
        logger.info("🧠 DeepSeek 正在进行宏观推理...")

        crypto = getattr(self.config, 'crypto_proxy', 'BTC-USD')
        days_count = metrics.get('metadata_days', 'N/A')

        # --- 构造结构化数据块 (Structured Context) ---
        # 这种格式让 LLM 更容易引用具体数字
        context_str = f"分析周期说明: 中期趋势基于过去 {days_count} 天，短期动量基于过去 5 天。\n\n"

        assets = [
            ('科技股', self.config.tech_proxy),
            ('避险黄金', self.config.safe_haven_proxy),
            ('数字货币', crypto),
            ('目标资产', self.config.target_asset)
        ]

        for name, ticker in assets:
            if ticker:
                med = metrics.get(f'{ticker}_trend_medium', 0)
                short = metrics.get(f'{ticker}_return_5d', 0)
                context_str += f"Asset: {name} ({ticker})\n"
                context_str += f"  - [数据: {days_count}天趋势]: {med:+.2%}\n"
                context_str += f"  - [数据: 近5日涨跌]: {short:+.2%}\n"

        context_str += f"\nMarket Volatility (Annualized): {metrics.get('tech_volatility', 0):.2%}\n"
        context_str += f"Risk Signal: {'Risk-On' if metrics.get('risk_on_signal') else 'Risk-Off'}\n"

        # --- Prompt Engineering ---
        system_prompt = """你是一位讲究数据证据的量化宏观分析师。
你的任务是根据提供的长短期指标分析市场状态。

【核心规则 - 必须严格遵守】
1. 你的每一条分析结论，必须明确引用数据来源。
2. 引用格式必须包含方括号，例如：
   - "科技股长期走强 [数据: 90天趋势 +5.2%]"
   - "但短期出现回调 [数据: 近5日涨跌 -1.3%]"
3. 严禁混淆短期波动和长期趋势。
4. 必须对比 BTC 与 QQQ（风险属性）以及 BTC 与 GLD（避险属性）的相关性数据。
"""

        user_prompt = f"""
        【结构化市场数据】
        {context_str}

        【最近5日价格明细】
        {recent_data.to_string()}

        请生成一份简明扼要的策略报告，分析上述资产的宏观状态并给出操作建议。
        """

        try:
            response = self.client.chat.completions.create(
                model=self.config.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                stream=False,
                temperature=0.3 # 降低随机性，提高精确度
            )

            content = response.choices[0].message.content
            logger.info("✅ DeepSeek 分析完成")

            if not content:
                return "分析完成，但API返回内容为空。"
            return content

        except Exception as e:
            logger.error(f"DeepSeek API 调用失败: {e}")
            return None

    def format_report_for_display(self, raw_report: str, metrics: dict) -> str:
        if not raw_report:
            return "⚠️ 报告为空"

        risk_signal = '🟢 RISK-ON' if metrics.get('risk_on_signal') else '🔴 RISK-OFF'
        volatility = metrics.get('tech_volatility', 0)

        header = f"""
MY-DOGE PRECISION MACRO REPORT
{'='*40}
Risk Signal: {risk_signal}
Volatility : {volatility:.2%}
{'='*40}
"""
        return header + raw_report
