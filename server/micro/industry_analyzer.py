import os
import pandas as pd
import glob
from datetime import datetime
import sys
import yfinance as yf
import concurrent.futures
import json
import threading
import re
from pathlib import Path
import logging
from typing import Optional, Callable, Tuple

logger = logging.getLogger(__name__)

class IndustryAnalyzer:
    def __init__(self, logger_callback: Optional[Callable] = None, proxy: Optional[str] = None):
        """
        行业聚类分析器 - 适配MY-DOGE-MICRO项目结构
        
        参数:
            logger_callback: 日志回调函数
            proxy: 代理地址，如 'http://127.0.0.1:7890'
        """
        # 延迟导入，避免循环依赖
        try:
            from server.macro.config import MacroConfig
            from server.macro.strategist import DeepSeekStrategist
            self.MacroConfig = MacroConfig
            self.DeepSeekStrategist = DeepSeekStrategist
        except ImportError as e:
            logger.error(f"模块导入失败: {e}")
            raise
        
        self.config = MacroConfig()
        self.strategist = DeepSeekStrategist(self.config)
        
        # 项目根目录
        self.project_root = Path(__file__).parent.parent.parent
        
        self.logger_callback = logger_callback
        
        # 缓存管理
        self.cache_file = self.project_root / 'data' / 'meta_cache.json'
        self.cache_lock = threading.RLock()
        self.metadata_cache = self._load_cache()
        self.newly_fetched_tickers = set()
        
        # 代理设置
        self.proxy = proxy
        if proxy:
            os.environ['HTTP_PROXY'] = proxy
            os.environ['HTTPS_PROXY'] = proxy
            logger.info(f"设置代理: {proxy}")

    def _load_cache(self) -> dict:
        """加载本地缓存"""
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"缓存文件加载失败: {e}")
                return {}
        return {}

    def _save_cache(self):
        """保存缓存到文件（原子写入）"""
        with self.cache_lock:
            os.makedirs(os.path.dirname(self.cache_file), exist_ok=True)
            import tempfile
            import shutil
            temp_dir = os.path.dirname(self.cache_file)
            with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', 
                                             dir=temp_dir, delete=False) as f:
                json.dump(self.metadata_cache, f, ensure_ascii=False)
                temp_path = f.name
            shutil.move(temp_path, self.cache_file)
            logger.debug(f"缓存已保存: {self.cache_file}")

    def _save_snapshot(self):
        """保存本次分析中新获取的公司数据快照"""
        if not self.newly_fetched_tickers:
            logger.info("ℹ️ 本次分析没有获取到新的公司数据")
            return None
        
        # 提取本次获取的数据
        snapshot_data = {}
        for ticker in self.newly_fetched_tickers:
            if ticker in self.metadata_cache:
                snapshot_data[ticker] = self.metadata_cache[ticker]
        
        if not snapshot_data:
            return None
        
        # 创建快照文件
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        snapshot_dir = self.project_root / 'data' / 'company_snapshots'
        os.makedirs(snapshot_dir, exist_ok=True)
        snapshot_file = snapshot_dir / f'company_data_{timestamp}.json'
        
        with open(snapshot_file, 'w', encoding='utf-8') as f:
            json.dump(snapshot_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"💾 本次分析的公司数据快照已保存: {snapshot_file}")
        return str(snapshot_file)

    def log(self, message: str):
        """日志输出：同时打印到控制台和回调函数"""
        logger.info(message)
        if self.logger_callback:
            self.logger_callback(message)

    def get_stock_metadata(self, ticker: str, record_new: bool = True) -> Tuple[str, str]:
        """
        获取股票名称和行业信息 (消除幻觉的关键)
        
        参数:
            ticker: 股票代码
            record_new: 是否记录新获取的股票代码
            
        返回:
            Tuple[名称, 行业]
        """
        # 1. 先查缓存
        with self.cache_lock:
            if ticker in self.metadata_cache:
                return self.metadata_cache[ticker]['name'], self.metadata_cache[ticker]['sector']

        # 2. 格式转换 (.SH -> .SS 用于 yfinance)
        yf_ticker = ticker.replace(".SH", ".SS") if ".SH" in ticker else ticker
        
        # 重试机制
        max_retries = 3
        for attempt in range(max_retries):
            try:
                info = yf.Ticker(yf_ticker).info
                # 优先取中文名或简称
                name = info.get('shortName', info.get('longName', 'Unknown'))
                sector = info.get('sector', info.get('industry', 'Unknown'))
                
                # 如果获取到的信息为空，可能是请求失败，重试
                if not info:
                    self.log(f"⚠️ 获取 {ticker} 信息为空，重试 {attempt+1}/{max_retries}")
                    continue
                
                # 3. 写入缓存（只有当数据有效时）
                if name != 'Unknown':
                    with self.cache_lock:
                        self.metadata_cache[ticker] = {'name': name, 'sector': sector}
                        self._save_cache()
                        # 记录新获取的股票代码
                        if record_new:
                            self.newly_fetched_tickers.add(ticker)
                    
                return name, sector
            except Exception as e:
                self.log(f"⚠️ 获取 {ticker} 元数据失败 (尝试 {attempt+1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    import time
                    time.sleep(2)  # 等待2秒后重试
                else:
                    return "Unknown", "Unknown"
        return "Unknown", "Unknown"

    def _format_stock_line(self, row: dict, name: str, sector: str) -> str:
        """统一格式化股票信息行"""
        rsrs_val = row.get('rsrs_z', 0.0)
        trend_mark = "🔥" if rsrs_val > 0.8 else ""
        
        return (
            f"- {row['ticker']} [{name}] ({sector}) "
            f"| 涨幅: +{row['change_percent']}% "
            f"| RSRS: {rsrs_val} {trend_mark}"
        )

    def load_latest_file(self, pattern: str) -> Optional[str]:
        """加载最新的文件"""
        files = glob.glob(pattern)
        if not files:
            return None
        return max(files, key=os.path.getctime)

    def load_macro_context(self) -> Tuple[str, str, str]:
        """读取最新的宏观报告摘要"""
        report_dir = self.project_root / 'data/reports/macro'
        latest_report = self.load_latest_file(str(report_dir / "*.md"))
        
        if not latest_report:
            return "Unknown", "Unknown", "未找到宏观报告"
            
        try:
            with open(latest_report, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # 解析 Risk Signal 和 Volatility
            risk = "Risk-Off" if "Risk-Off" in content else "Risk-On"
            
            # 尝试提取波动率
            vol_match = re.search(r'Volatility\s*:\s*([\d.]+%)', content)
            vol = vol_match.group(1) if vol_match else "Unknown"
            
            # 截取前 1000 字作为摘要
            summary = content[:1000] 
            return risk, vol, summary
        except Exception as e:
            logger.error(f"读取宏观报告失败: {e}")
            return "Unknown", "Unknown", "读取宏观报告失败"

    def _process_momentum_data(self, df: pd.DataFrame, market_type: str) -> str:
        """处理动量数据并注入元数据"""
        # 取前 50 名，避免 Token 溢出，且头部效应最明显
        top_50 = df.head(50)
        
        if top_50.empty:
            return "无数据"
        
        self.log(f"🔍 正在联网校准 {market_type} 前 50 名股票的业务信息...")
        stock_list_str = []
        
        # 并发获取
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            future_to_ticker = {
                executor.submit(self.get_stock_metadata, row['ticker']): (row, i)
                for i, (_, row) in enumerate(top_50.iterrows())
            }
            
            for future in concurrent.futures.as_completed(future_to_ticker):
                row_series, idx = future_to_ticker[future]
                name, sector = future.result()
                
                # 将Series转换为字典
                row_dict = row_series.to_dict()
                line = self._format_stock_line(row_dict, name, sector)
                stock_list_str.append((idx, line))
        
        # 按原始顺序排序
        stock_list_str.sort(key=lambda x: x[0])
        return "\n".join([line for _, line in stock_list_str])

    def load_momentum_data(self, market_type: str) -> str:
        """读取动量数据CSV并注入元数据"""
        csv_dir = self.project_root / 'data/reports/micro'
        pattern = f"Top200_Momentum_{market_type}_*.csv"
        latest_csv = self.load_latest_file(str(csv_dir / pattern))
        
        if not latest_csv:
            logger.warning(f"未找到 {market_type} 动量数据文件")
            return "无数据"
            
        try:
            df = pd.read_csv(latest_csv)
            return self._process_momentum_data(df, market_type)
        except Exception as e:
            logger.error(f"读取动量数据失败: {e}")
            return "数据读取失败"

    def run_industry_analysis(self, 
                             data/reports/macro_path: Optional[str] = None,
                             cn_momentum_path: Optional[str] = None,
                             us_momentum_path: Optional[str] = None,
                             progress_callback: Optional[Callable] = None) -> Tuple[Optional[str], Optional[str]]:
        """
        执行行业聚类分析
        
        参数:
            data/reports/macro_path: 宏观报告路径
            cn_momentum_path: A股动量数据路径
            us_momentum_path: 美股动量数据路径
            progress_callback: 进度回调函数
            
        返回:
            Tuple[报告内容, 文件名] 或 (None, None) 如果失败
        """
        if progress_callback:
            progress_callback(10, "初始化行业分析引擎")
        
        self.log("🚀 启动行业趋势分析引擎...")
        
        # 清空本次分析的新获取股票记录
        self.newly_fetched_tickers.clear()
        
        # 1. 准备宏观数据
        if progress_callback:
            progress_callback(20, "加载宏观背景数据")
        
        if data/reports/macro_path and os.path.exists(data/reports/macro_path):
            try:
                with open(data/reports/macro_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                risk = "Risk-Off" if "Risk-Off" in content else "Risk-On"
                vol = "Unknown"
                macro_summary = content[:1000]
            except Exception as e:
                logger.error(f"读取宏观报告失败: {e}")
                risk, vol, macro_summary = self.load_macro_context()
        else:
            risk, vol, macro_summary = self.load_macro_context()
            
        # 2. 准备微观数据
        if progress_callback:
            progress_callback(40, "加载A股动量数据")
        
        if cn_momentum_path and os.path.exists(cn_momentum_path):
            try:
                df = pd.read_csv(cn_momentum_path)
                cn_stocks = self._process_momentum_data(df, 'CN')
            except Exception as e:
                logger.error(f"读取A股动量数据失败: {e}")
                cn_stocks = self.load_momentum_data('CN')
        else:
            cn_stocks = self.load_momentum_data('CN')
            
        if progress_callback:
            progress_callback(60, "加载美股动量数据")
        
        if us_momentum_path and os.path.exists(us_momentum_path):
            try:
                df = pd.read_csv(us_momentum_path)
                us_stocks = self._process_momentum_data(df, 'US')
            except Exception as e:
                logger.error(f"读取美股动量数据失败: {e}")
                us_stocks = self.load_momentum_data('US')
        else:
            us_stocks = self.load_momentum_data('US')
        
        # 3. 检查数据有效性
        if cn_stocks == "无数据" and us_stocks == "无数据":
            self.log("❌ 缺少动量数据，无法分析")
            return None, None
        
        if progress_callback:
            progress_callback(80, "构建分析提示词")
        
        # 4. 构建Prompt
        prompt = f"""
# Role
你是一位精通全球产业链的资深量化策略分析师。你的任务是基于我提供的"宏观环境"和"市场强势股清单"，通过归纳法推导出当前处于"景气度上行区间"的行业板块。

# Input Data
## 1. Macro Context (宏观背景)
- **Market Status**: {risk} (Risk-On / Risk-Off)
- **Volatility**: {vol}
- **Key Trend**: {macro_summary}

## 2. Micro Evidence (微观资金流向)
**指标说明**:
- **涨幅**: 过去 60 日的价格变化。
- **RSRS (Trend Strength)**: 趋势结构强度指标 (范围 -1.0 ~ 1.0)。
    - **> 0.8 (🔥)**: 强劲的多头趋势结构（阻力被突破，支撑强劲），代表资金持续流入，**行业逻辑真实性高**。
    - **< 0.3**: 趋势结构松散或处于震荡，单纯的涨幅可能来自短期消息炒作。

**[A-Share Top Momentum]**
{cn_stocks} 

**[US-Share Top Momentum]**
{us_stocks}

# Analysis Requirements
1.  **行业映射**：识别股票代码对应的细分赛道。
2.  **集群识别**：找出出现频次最高的 3-5 个细分行业。
3.  **量化验证 (Critical)**：
    - **不仅仅看涨幅，更要看 RSRS**。
    - 优先筛选出那些**涨幅高且 RSRS > 0.8** 的股票所在的板块。这代表该板块不仅涨了，而且涨得很稳（趋势结构好），是机构资金抱团的特征。
    - 如果某行业股票涨幅大但 RSRS 普遍较低，请在报告中标记为"投机性上涨"。
4.  **宏观验证**：结合宏观背景分析合理性。

# Output Format
请生成一份 Markdown 格式的《行业景气度深度扫描报告》，包含：
1.  **核心结论** (必须包含对 RSRS 确认强度的描述)
2.  **景气度排行** (列出最强行业，并注明其"趋势强度等级")
3.  **产业链映射图谱** (共振逻辑)
4.  **风险提示**

# 🛑 IMPORTANT: Metadata Output
TITLE: [你的标题]
"""
        
        # 5. 调用DeepSeek API
        if progress_callback:
            progress_callback(90, "调用DeepSeek进行产业链分析")
        
        self.log("🧠 正在调用 DeepSeek 进行产业链聚类分析...")
        
        try:
            # 检查API客户端
            if not hasattr(self.strategist, 'client') or self.strategist.client is None:
                self.log("❌ DeepSeek API客户端未初始化，请检查API配置")
                return None, None
            
            response = self.strategist.client.chat.completions.create(
                model=self.config.model,
                messages=[
                    {"role": "system", "content": "You are a professional financial analyst."},
                    {"role": "user", "content": prompt}
                ],
                stream=False,
                temperature=0.6
            )
            
            raw_content = response.choices[0].message.content
            
            if raw_content is None:
                self.log("❌ API返回内容为空")
                return None, None
            
            # 提取语义化标题
            title_match = re.search(r"TITLE:\s*(.*)", raw_content)
            
            if title_match:
                semantic_title = title_match.group(1).strip()
                report_content = raw_content.replace(title_match.group(0), "").strip()
            else:
                timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
                semantic_title = f"行业全景扫描 ({timestamp})"
                report_content = raw_content
            
            # 6. 保存报告
            if progress_callback:
                progress_callback(95, "保存分析结果")
            
            model_name = self.config.model.replace("/", "-") if self.config.model else "unknown"
            timestamp_file = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
            filename = f"industry_analysis_{model_name}_{timestamp_file}.md"
            
            save_path = self.project_root / 'research_report' / filename
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            
            with open(save_path, 'w', encoding='utf-8') as f:
                f.write(report_content)
                
            self.log(f"✅ 行业分析报告已生成: {filename}")
            
            # 7. 保存公司数据快照
            snapshot_path = self._save_snapshot()
            if snapshot_path:
                self.log(f"💾 公司数据快照: {snapshot_path}")
            
            # 8. 返回结果
            if progress_callback:
                progress_callback(100, "分析完成")
            
            return report_content, filename
            
        except Exception as e:
            self.log(f"❌ 行业分析过程出错: {e}")
            import traceback
            traceback.print_exc()
            return None, None

def run_industry_analysis_from_files(macro_path: str, cn_path: str, us_path: str) -> Optional[str]:
    """
    从文件运行行业分析的便捷函数
    
    参数:
        macro_path: 宏观报告路径
        cn_path: A股动量数据路径
        us_path: 美股动量数据路径
        
    返回:
        报告内容或错误信息
    """
    analyzer = IndustryAnalyzer()
    report_content, filename = analyzer.run_industry_analysis(
        data/reports/macro_path=macro_path,
        cn_momentum_path=cn_path,
        us_momentum_path=us_path
    )
    
    if report_content and filename:
        return f"✅ 分析完成，报告已保存为: {filename}"
    else:
        return "❌ 分析失败，请检查日志"