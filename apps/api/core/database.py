"""
数据库操作模块 - 简化版
为市场扫描器提供数据库功能
"""

import os
import sqlite3
import pandas as pd


def get_db_connection(db_path=None):
    """获取数据库连接对象
    
    Args:
        db_path (str): 数据库文件路径，如果为 None，则使用默认路径 'data/market_data.db'
        
    Returns:
        sqlite3.Connection: 数据库连接对象
    """
    if db_path is None:
        db_path = 'data/market_data.db'
    
    # 确保目录存在
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    return sqlite3.connect(db_path)


def init_db_custom(db_path):
    """使用指定路径初始化数据库，创建 stock_prices 表（仅当表不存在时）"""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    # 创建 stock_prices 表，包含复合主键 (ticker, date)，不删除旧表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stock_prices (
            ticker TEXT,
            date TEXT,
            open REAL,
            high REAL,
            low REAL,
            close REAL,
            volume INTEGER,
            amount REAL,
            PRIMARY KEY (ticker, date)
        )
    ''')
    
    conn.commit()
    conn.close()
    print(f"✅ 数据库初始化完成: {db_path}")
    return True


def save_stock_data_custom(data, db_path):
    """将股票数据保存到指定数据库
    
    Args:
        data (pd.DataFrame): 包含股票数据的 DataFrame
        db_path (str): 目标数据库路径
    """
    conn = get_db_connection(db_path)
    
    try:
        # 使用 to_sql 方法批量插入数据，if_exists='append' 表示追加模式
        data.to_sql('stock_prices', conn, if_exists='append', index=False)
        print(f"💾 数据已保存到数据库: {db_path}")
    except Exception as e:
        print(f"❌ 保存数据时出错: {e}")
        raise
    finally:
        conn.close()