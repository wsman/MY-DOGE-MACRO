import sqlite3
import pandas as pd
import os
import sys
import json
from datetime import datetime
from collections import Counter
import numpy as np
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class MomentumRanker:
    def __init__(self, config_path=None):
        """
        动量选股分析器
        
        参数:
            config_path: 配置文件路径，如果为None则尝试自动查找
        """
        self.config = self._load_config(config_path)
        logger.info(f"初始化动量分析器，配置: {self.config}")

    def _load_config(self, config_path=None):
        """
        加载配置文件，如果不存在则使用默认值
        
        返回:
            dict: 配置字典
        """
        default_config = {
            "us_blacklist": ["SQQQ", "TQQQ", "SOXL", "SOXS", "SPXU", "SPXS", "SDS", "SSO", "UPRO", "QID", "QLD", "TNA", "TZA", "UVXY", "VIXY", "SVXY", "LABU", "LABD", "YANG", "YINN", "FNGU", "FNGD", "WEBL", "WEBS", "KOLD", "BOIL", "TSLY", "NVDY", "AMDY", "MSTY", "CONY", "APLY", "GOOY", "MSFY", "AMZY", "FBY", "OARK", "XOMO", "JPMO", "DISO", "NFLY", "SQY", "PYPY", "AIYY", "YMAX", "YMAG", "ULTY", "SVOL", "TLTW", "HYGW", "LQDW", "BITX"],
            "min_volume_cn": 200000000,
            "min_volume_us": 20000000,
            "max_change_pct": 400,
            "rsrs_window": 18
        }
        
        # 尝试确定配置文件路径
        if config_path is None:
            # 首先尝试相对于项目根目录的config/models_config.json
            project_root = Path(__file__).parent.parent.parent
            config_path = project_root / 'config' / 'models_config.json'
            
            if not config_path.exists():
                # 尝试legacy_quarantine中的配置文件
                config_path = project_root / 'legacy_quarantine' / 'models_config.json'
        
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # 合并/覆盖默认配置，防止 key 缺失报错
                    if "scanner_filters" in data:
                        scanner_config = data["scanner_filters"]
                        # 确保所有必要的配置项都存在
                        for key in default_config.keys():
                            if key not in scanner_config:
                                scanner_config[key] = default_config[key]
                        return scanner_config
                    else:
                        logger.warning("配置文件中未找到 scanner_filters，使用默认配置")
                        return default_config
            except Exception as e:
                logger.error(f"配置文件加载失败: {e}, 使用默认配置")
                return default_config
        else:
            logger.warning(f"配置文件不存在: {config_path}，使用默认配置")
            return default_config

    def _calculate_rsrs_vectorized(self, price_matrix):
        """
        向量化计算 RSRS (趋势强度指标)
        
        算法: RSRS = R² × sign(Slope)
        - R²: 决定系数，表示线性回归的拟合度 (0~1)
        - Slope: 线性回归斜率，表示趋势方向
        
        Args:
            price_matrix: numpy array, shape (N_stocks, window_size)
        
        Returns:
            rsrs_values: numpy array, shape (N_stocks,)
        """
        if price_matrix.size == 0:
            return np.array([])

        N, T = price_matrix.shape

        # 1. 准备 X (时间序列 0, 1, ..., T-1)
        x = np.arange(T)
        x_mean = x.mean()
        x_dev = x - x_mean             # Shape: (T,)
        x_var = np.sum(x_dev ** 2)     # Scalar (分母部分)

        # 2. 准备 Y (价格序列)
        y_mean = np.mean(price_matrix, axis=1, keepdims=True)
        y_dev = price_matrix - y_mean  # Shape: (N, T)

        # 3. 计算 Slope (斜率)
        # Cov(x, y) = sum(x_dev * y_dev)
        cov_xy = np.dot(y_dev, x_dev)  # Shape: (N,)
        slope = cov_xy / x_var

        # 4. 计算 R^2 (决定系数)
        # R^2 = (Cov(x,y)^2) / (Var(x) * Var(y))
        y_var = np.sum(y_dev ** 2, axis=1) # Shape: (N,)

        # 处理 y_var 为 0 的情况 (价格完全不变)，避免除零错误
        valid_mask = y_var > 1e-10
        r_sq = np.zeros(N)

        # 仅对有效数据计算
        r_sq[valid_mask] = (cov_xy[valid_mask] ** 2) / (x_var * y_var[valid_mask])

        # 5. 计算 RSRS = R^2 * Sign(Slope)
        rsrs = r_sq * np.sign(slope)

        return rsrs

    def analyze_market_momentum(self, market_type, db_path, progress_callback=None):
        """
        分析市场动量，生成TOP 200动量股票榜单
        
        参数:
            market_type: 'CN' 或 'US'
            db_path: 数据库文件路径
            progress_callback: 进度回调函数
            
        返回:
            pd.DataFrame: 包含前200动量股票的DataFrame
        """
        logger.info(f"🚀 正在分析 {market_type} 市场动量...")
        
        if progress_callback:
            progress_callback(10, f"加载{market_type}市场配置")
        
        # 1. 获取配置
        min_vol = self.config.get('min_volume_cn', 200000000) if market_type == 'CN' else self.config.get('min_volume_us', 20000000)
        blacklist = set(self.config.get('us_blacklist', []))
        window = self.config.get('rsrs_window', 18)
        max_change_pct = self.config.get('max_change_pct', 400)
        
        logger.info(f"⚙️ 筛选标准: 60日涨幅排名 | 60日日均成交额 > {min_vol/10000:.0f}万")
        
        # 2. 检查数据库文件
        if not os.path.exists(db_path):
            logger.error(f"❌ 数据库文件不存在: {db_path}")
            return pd.DataFrame()
        
        if progress_callback:
            progress_callback(20, "连接数据库并加载数据")

        try:
            # 3. 连接数据库
            conn = sqlite3.connect(db_path)
            
            # 获取最新日期
            cursor = conn.cursor()
            cursor.execute("SELECT MAX(date) FROM stock_prices")
            max_date = cursor.fetchone()[0]
            if not max_date:
                logger.warning("⚠️ 数据库为空")
                return pd.DataFrame()

            # 4. 加载最近半年数据
            logger.info("⏳ 正在加载数据到内存...")
            query = f"""
                SELECT ticker, date, close, high, low, amount 
                FROM stock_prices 
                WHERE date >= date('{max_date}', '-180 days')
                ORDER BY ticker, date ASC
            """
            df = pd.read_sql_query(query, conn)
            conn.close()
            
        except Exception as e:
            logger.error(f"❌ 读取错误: {e}")
            return pd.DataFrame()

        if df.empty:
            logger.warning("⚠️ 无数据")
            return pd.DataFrame()

        logger.info(f"📊 数据加载完成，开始筛选 {len(df['ticker'].unique())} 只股票...")
        
        if progress_callback:
            progress_callback(40, f"筛选{len(df['ticker'].unique())}只股票")

        # --- 批处理容器 ---
        candidates_meta = []   # 存储元数据 (ticker, price, vol, etc.)
        candidates_prices = [] # 存储价格序列 (用于向量化计算)
        global_start_dates = []
        global_end_dates = []

        grouped = df.groupby('ticker')
        total_groups = len(grouped)
        processed = 0

        for ticker, group in grouped:
            processed += 1
            if progress_callback and processed % 100 == 0:
                progress_callback(40 + int(30 * processed / total_groups), f"处理股票: {ticker}")
            
            if len(group) < 61: continue  # 确保有足够数据计算 60日涨幅
            
            # --- 过滤器逻辑 ---
            if market_type == 'US':
                if ticker in blacklist: 
                    continue
                # 过滤常见的 warrant (权证) 或异类后缀
                ticker_str = str(ticker)
                if len(ticker_str) > 4 and ticker_str not in ['GOOGL', 'BRK.B']: 
                    # 简单启发式：美股正股代码通常 <= 4 位
                    pass

            if market_type == 'CN':
                # 确保 ticker 是字符串
                ticker_str = str(ticker)
                raw_code = ticker_str.split('.')[0] if '.' in ticker_str else ticker_str
                if not raw_code.startswith(('00', '30', '60', '68')): 
                    continue
            
            # --- 流动性过滤 ---
            avg_amt = group['amount'].tail(60).mean()
            if avg_amt < min_vol: 
                continue

            # --- 涨跌幅计算 ---
            curr_row = group.iloc[-1]
            prev_row = group.iloc[-61]
            p_curr = curr_row['close']
            p_prev = prev_row['close']
            if p_prev == 0: 
                continue
            
            change_pct = (p_curr - p_prev) / p_prev * 100
            
            # 虚假暴涨熔断过滤
            if market_type == 'US' and change_pct > max_change_pct:
                continue
                
            # 获取最近 window 天的收盘价
            recent_prices = group['close'].values[-window:]
            
            # 如果数据不足 window 天，跳过
            if len(recent_prices) < window:
                continue

            candidates_prices.append(recent_prices)
            candidates_meta.append({
                'ticker': ticker,
                'price_60d_ago': round(p_prev, 2),
                'price_current': round(p_curr, 2),
                'change_percent': round(change_pct, 2),
                'avg_daily_volume': round(avg_amt, 0),
                'start_date': prev_row['date'],
                'end_date': curr_row['date']
            })
            
            global_start_dates.append(prev_row['date'])
            global_end_dates.append(curr_row['date'])

        # --- 向量化计算阶段 ---
        if not candidates_meta:
            logger.warning("⚠️ 没有符合条件的标的")
            return pd.DataFrame()

        logger.info(f"⚡ 正在对 {len(candidates_meta)} 只优选股票进行 RSRS 向量化计算...")
        
        if progress_callback:
            progress_callback(80, "计算RSRS趋势强度指标")

        # 转换为 numpy 矩阵 (N, window)
        price_matrix = np.array(candidates_prices)

        # 🚀 一次性计算所有 RSRS
        rsrs_scores = self._calculate_rsrs_vectorized(price_matrix)

        # 将结果合并回元数据
        for i, meta in enumerate(candidates_meta):
            meta['rsrs_z'] = round(rsrs_scores[i], 2)
            
        # --- 后续输出逻辑 ---
        results = pd.DataFrame(candidates_meta)
        results.sort_values('change_percent', ascending=False, inplace=True)
        top_200 = results.head(200)
        
        # 文件名日期逻辑优化
        # End Date: 取最大值 (最新日期)
        # Start Date: 取众数 (绝大多数股票的起始日期)，过滤停牌股干扰
        if global_end_dates:
            file_end = max(global_end_dates).replace('-', '')
        else:
            file_end = datetime.now().strftime('%Y%m%d')
            
        if global_start_dates:
            # 获取出现次数最多的日期 (Mode)
            most_common_start = Counter(global_start_dates).most_common(1)[0][0]
            file_start = most_common_start.replace('-', '')
        else:
            file_start = "00000000"
        
        logger.info(f"✅ {market_type} 榜单已生成，共 {len(top_200)} 只股票")
        if len(top_200) > 0:
            logger.info(f"🥇 榜首: {top_200.iloc[0]['ticker']} (+{top_200.iloc[0]['change_percent']}%) | RSRS: {top_200.iloc[0]['rsrs_z']}")
        
        if progress_callback:
            progress_callback(100, f"完成{market_type}市场动量分析")
        
        return top_200

    def save_momentum_results(self, results_df, market_type, output_dir=None):
        """
        保存动量分析结果到CSV文件
        
        参数:
            results_df: 分析结果的DataFrame
            market_type: 市场类型 'CN' 或 'US'
            output_dir: 输出目录，如果为None则使用当前目录
            
        返回:
            str: 保存的文件路径
        """
        if results_df.empty:
            logger.warning("结果为空，不保存文件")
            return ""
        
        if output_dir is None:
            output_dir = os.getcwd()
        
        # 生成文件名
        today = datetime.now().strftime('%Y%m%d')
        filename = f"Top200_Momentum_{market_type}_{today}.csv"
        save_path = os.path.join(output_dir, filename)
        
        # 选择输出列
        output_cols = ['ticker', 'price_60d_ago', 'price_current', 'change_percent', 'avg_daily_volume', 'rsrs_z']
        available_cols = [col for col in output_cols if col in results_df.columns]
        
        results_df[available_cols].to_csv(save_path, index=False, encoding='utf-8-sig')
        
        logger.info(f"📁 结果已保存至: {save_path}")
        return save_path