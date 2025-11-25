"""
基础使用示例

展示如何使用 MY-DOGE 宏观战略分析包进行市场分析
"""

import os
import sys

# 添加父目录到路径，以便导入包
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from my_doge_macro import MacroConfig, GlobalMacroLoader, DeepSeekStrategist, setup_logging


def main():
    """主函数 - 演示包的基本使用"""
    
    # 初始化日志系统
    setup_logging()
    
    print("🚀 启动 MY-DOGE 宏观战略分析...")
    
    try:
        # 创建配置
        config = MacroConfig()
        print(f"✅ 配置加载成功: {config}")
        
        # 获取市场数据
        loader = GlobalMacroLoader(config)
        market_data = loader.fetch_combined_data()
        
        if market_data is not None:
            # 显示市场摘要
            summary = loader.get_market_summary(market_data)
            print(f"📊 市场数据摘要: {summary}")
            
            # 计算技术指标
            metrics = loader.calculate_metrics(market_data)
            
            # DeepSeek 分析
            strategist = DeepSeekStrategist(config)
            raw_report = strategist.generate_strategy_report(metrics, market_data.tail(5))
            
            # 格式化报告
            formatted_report = strategist.format_report_for_display(raw_report, metrics)
            print(formatted_report)
            
        else:
            print("❌ 无法获取市场数据，请检查网络连接")
            
    except Exception as e:
        print(f"❌ 运行失败: {e}")
        print("💡 请检查 .env 文件中的 API Key 配置")


if __name__ == "__main__":
    main()
