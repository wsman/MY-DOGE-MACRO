#!/usr/bin/env python3
import argparse
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from . import MacroConfig, GlobalMacroLoader, DeepSeekStrategist, setup_logging

def main():
    parser = argparse.ArgumentParser(description="MY-DOGE 宏观战略分析包")
    parser.add_argument("--verbose", action="store_true", help="显示详细输出")
    parser.add_argument("--config-file", help="指定配置文件路径")
    args = parser.parse_args()
    
    setup_logging()
    print("🚀 启动 MY-DOGE 宏观战略分析...")
    
    try:
        config = MacroConfig()
        print(f"✅ 配置加载成功")
        
        loader = GlobalMacroLoader(config)
        market_data = loader.fetch_combined_data()
        
        if market_data is not None:
            summary = loader.get_market_summary(market_data)
            print(f"📊 市场数据摘要: {summary}")
            
            metrics = loader.calculate_metrics(market_data)
            strategist = DeepSeekStrategist(config)
            
            # [FIX] 显式获取返回值并检查
            raw_report = strategist.generate_strategy_report(metrics, market_data.tail(5))
            
            if raw_report:
                formatted_report = strategist.format_report_for_display(raw_report, metrics)
                print("\n" + "="*80)
                print(formatted_report)
                print("="*80 + "\n")
            else:
                print("❌ 策略报告生成失败 (返回为空)")
        else:
            print("❌ 无法获取市场数据")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ 运行失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
