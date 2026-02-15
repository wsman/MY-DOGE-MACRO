"""
WebSocket Hub 集成模块 - 使用统一的 websocket_hub 库

依据§152单一真理源公理和§141熵减验证公理，替换自定义WebSocket实现。
"""

import asyncio
import json
import random
import sys
import os
from datetime import datetime, date, timedelta
from typing import Optional, Dict, List, Set

from fastapi import WebSocket, WebSocketDisconnect

# 导入统一核心服务
from .services import websocket_hub, logger, get_llm_router

# 添加quant-engine路径以便导入TDXReader
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'libs'))

try:
    from quant_engine.data.tdx_reader import TDXDataReader
    TDX_AVAILABLE = True
except ImportError as e:
    logger.warning(f"TDXReader导入失败: {e}, 使用模拟数据")
    TDX_AVAILABLE = False

try:
    from websocket_hub import WebSocketHub, ProgressTracker, ChannelManager, MessageType
    WEBSOCKET_HUB_AVAILABLE = True
except ImportError:
    WEBSOCKET_HUB_AVAILABLE = False
    logger.error("websocket_hub 不可用，WebSocket功能将受限")


class TDXDataPusher:
    """TDX数据推送器（与原有逻辑兼容）"""
    
    def __init__(self):
        self.tdx_reader = None
        self.base_prices = {}
        self.last_prices = {}
        
        if TDX_AVAILABLE:
            try:
                self.tdx_reader = TDXDataReader()
                if self.tdx_reader.is_available():
                    logger.info("TDX数据源已就绪")
                else:
                    logger.warning("TDX数据源不可用")
            except Exception as e:
                logger.error(f"TDX初始化失败: {e}")
        else:
            logger.warning("TDX模块不可用，使用模拟数据")
    
    def get_realtime_quote(self, ticker: str) -> Optional[dict]:
        """获取实时报价（模拟或基于TDX历史数据）"""
        if not TDX_AVAILABLE or not self.tdx_reader or not self.tdx_reader.is_available():
            # 模拟数据
            if ticker not in self.base_prices:
                # 根据ticker类型设置基础价格
                if ticker.startswith(('0', '3')):
                    self.base_prices[ticker] = random.uniform(5.0, 50.0)  # A股
                elif ticker.startswith('6'):
                    self.base_prices[ticker] = random.uniform(10.0, 100.0)  # 沪股
                elif ticker in ['000001', '399001', '399006']:
                    # 指数
                    if ticker == '000001':
                        self.base_prices[ticker] = 3000.0
                    elif ticker == '399001':
                        self.base_prices[ticker] = 10000.0
                    else:
                        self.base_prices[ticker] = 2000.0
                else:
                    self.base_prices[ticker] = random.uniform(1.0, 1000.0)
            
            # 生成随机变动 (-0.5% 到 +0.5%)
            change_pct = random.uniform(-0.5, 0.5)
            new_price = self.base_prices[ticker] * (1 + change_pct / 100)
            self.base_prices[ticker] = new_price
            
            return {
                "price": round(new_price, 2),
                "change": round(new_price - self.base_prices[ticker] / (1 + change_pct / 100), 4),
                "changePercent": round(change_pct, 2),
                "volume": random.randint(1000000, 10000000),
                "high": round(new_price * (1 + random.uniform(0, 0.03)), 2),
                "low": round(new_price * (1 - random.uniform(0, 0.03)), 2),
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            # 使用TDX历史数据作为基础，加上随机变动
            try:
                # 获取最近一天的收盘价作为基础
                today = date.today()
                start_date = today - timedelta(days=10)
                
                data = self.tdx_reader.read_day_data(ticker, start_date=start_date, end_date=today)
                if data and len(data) > 0:
                    # 使用最近一天的收盘价
                    latest_data = data[-1]
                    base_price = latest_data.close
                    
                    if ticker not in self.base_prices:
                        self.base_prices[ticker] = base_price
                    
                    # 模拟实时变动
                    change_pct = random.uniform(-0.3, 0.3)
                    new_price = self.base_prices[ticker] * (1 + change_pct / 100)
                    
                    # 小幅更新基础价格，模拟趋势
                    self.base_prices[ticker] = new_price * (1 + random.uniform(-0.05, 0.05) / 100)
                    
                    return {
                        "price": round(new_price, 2),
                        "change": round(new_price - base_price, 4),
                        "changePercent": round(change_pct, 2),
                        "volume": random.randint(100000, 1000000),
                        "high": round(new_price * (1 + random.uniform(0, 0.02)), 2),
                        "low": round(new_price * (1 - random.uniform(0, 0.02)), 2),
                        "timestamp": datetime.utcnow().isoformat()
                    }
            except Exception as e:
                logger.error(f"获取{ticker}数据失败: {e}")
        
        # 默认返回模拟数据
        return self.get_realtime_quote(ticker)


# 全局WebSocket Hub管理器
class WebSocketManager:
    """WebSocket管理器 - 封装websocket_hub功能"""
    
    def __init__(self):
        if not WEBSOCKET_HUB_AVAILABLE:
            logger.error("websocket_hub不可用，WebSocket功能将不可用")
            self.hub = None
            self.progress_tracker = None
            self.channel_manager = None
            return
        
        try:
            # 初始化WebSocket Hub
            self.hub = WebSocketHub()
            self.progress_tracker = ProgressTracker(progress_callback=self.send_to)
            self.channel_manager = ChannelManager()
            
            # 创建标准频道
            self.channel_manager.create_channel("price_updates", permission="public")
            self.channel_manager.create_channel("notifications", permission="public")
            self.channel_manager.create_channel("progress", permission="public")
            
            self.data_pusher = TDXDataPusher()
            self.ticker_subscriptions: Dict[str, Set[str]] = {}  # ticker -> client_ids
            
            logger.info("✅ WebSocket Hub集成已初始化")
        except Exception as e:
            logger.error(f"WebSocket Hub初始化失败: {e}")
            self.hub = None
            self.progress_tracker = None
            self.channel_manager = None
    
    async def connect(self, client_id: str, websocket: WebSocket) -> bool:
        """连接客户端"""
        if not self.hub:
            return False
        
        try:
            # 使用hub连接
            connected = await self.hub.connect(client_id, websocket)
            if connected:
                # 订阅默认频道
                self.channel_manager.subscribe("notifications", client_id)
                
                # 发送连接确认
                await self.hub.send_to(client_id, {
                    "type": "connect",
                    "message": f"已连接到WebSocket Hub ({client_id})",
                    "timestamp": datetime.utcnow().isoformat()
                })
                
                logger.info(f"客户端已连接: {client_id}")
                return True
        except Exception as e:
            logger.error(f"连接客户端失败 {client_id}: {e}")
        
        return False
    
    async def disconnect(self, client_id: str):
        """断开客户端连接"""
        if not self.hub:
            return
        
        # 清理订阅
        if client_id in self.ticker_subscriptions:
            for ticker, clients in self.ticker_subscriptions.items():
                if client_id in clients:
                    clients.discard(client_id)
        
        # 取消订阅频道
        if self.channel_manager:
            for channel in self.channel_manager.get_channels():
                self.channel_manager.unsubscribe(channel, client_id)
        
        # Hub断开连接
        self.hub.disconnect(client_id)
        logger.info(f"客户端已断开: {client_id}")
    
    async def listen(self, client_id: str):
        """监听客户端消息"""
        if not self.hub:
            return
        
        try:
            await self.hub.listen(client_id)
        except WebSocketDisconnect:
            await self.disconnect(client_id)
        except Exception as e:
            logger.error(f"监听客户端失败 {client_id}: {e}")
            await self.disconnect(client_id)
    
    async def handle_message(self, client_id: str, data: dict):
        """处理客户端消息"""
        action = data.get("action")
        
        if action == "subscribe":
            ticker = data.get("ticker")
            if ticker:
                success = self.subscribe_ticker(client_id, ticker)
                await self.send_to(client_id, {
                    "type": "subscribe_result",
                    "ticker": ticker,
                    "success": success,
                    "timestamp": datetime.utcnow().isoformat()
                })
        
        elif action == "unsubscribe":
            ticker = data.get("ticker")
            if ticker:
                success = self.unsubscribe_ticker(client_id, ticker)
                await self.send_to(client_id, {
                    "type": "unsubscribe_result",
                    "ticker": ticker,
                    "success": success,
                    "timestamp": datetime.utcnow().isoformat()
                })
        
        elif action == "ping":
            await self.send_to(client_id, {
                "type": "pong",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        elif action == "get_stats":
            await self.send_to(client_id, {
                "type": "stats",
                "data": self.get_stats(),
                "timestamp": datetime.utcnow().isoformat()
            })
        
        elif action == "join_channel":
            channel = data.get("channel")
            if channel:
                success = self.channel_manager.subscribe(channel, client_id)
                await self.send_to(client_id, {
                    "type": "channel_join_result",
                    "channel": channel,
                    "success": success,
                    "timestamp": datetime.utcnow().isoformat()
                })
        
        elif action == "leave_channel":
            channel = data.get("channel")
            if channel:
                success = self.channel_manager.unsubscribe(channel, client_id)
                await self.send_to(client_id, {
                    "type": "channel_leave_result",
                    "channel": channel,
                    "success": success,
                    "timestamp": datetime.utcnow().isoformat()
                })
    
    def subscribe_ticker(self, client_id: str, ticker: str) -> bool:
        """订阅股票代码"""
        if ticker not in self.ticker_subscriptions:
            self.ticker_subscriptions[ticker] = set()
        
        self.ticker_subscriptions[ticker].add(client_id)
        logger.info(f"客户端 {client_id} 订阅了 {ticker}")
        return True
    
    def unsubscribe_ticker(self, client_id: str, ticker: str) -> bool:
        """取消订阅股票代码"""
        if ticker in self.ticker_subscriptions:
            self.ticker_subscriptions[ticker].discard(client_id)
            logger.info(f"客户端 {client_id} 取消订阅了 {ticker}")
        return True
    
    async def send_to(self, client_id: str, message: dict):
        """发送消息给客户端"""
        if not self.hub:
            return False
        
        try:
            await self.hub.send_to(client_id, message)
            return True
        except Exception as e:
            logger.error(f"发送消息失败 {client_id}: {e}")
            return False
    
    async def broadcast_ticker(self, ticker: str, data: dict):
        """向订阅特定ticker的客户端广播"""
        if ticker not in self.ticker_subscriptions:
            return
        
        message = {
            "type": "price_update",
            "ticker": ticker,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        for client_id in self.ticker_subscriptions[ticker]:
            await self.send_to(client_id, message)
    
    async def broadcast_to_channel(self, channel: str, message: dict):
        """向频道广播消息"""
        if not self.channel_manager:
            return
        
        subscribers = self.channel_manager.get_subscribers(channel)
        for client_id in subscribers:
            await self.send_to(client_id, message)
    
    def get_stats(self) -> dict:
        """获取统计信息"""
        if not self.hub:
            return {}
        
        return {
            "active_connections": len(self.hub.get_stats().get("active_connections", [])),
            "ticker_subscriptions": {k: len(v) for k, v in self.ticker_subscriptions.items()},
            "channels": self.channel_manager.get_stats() if self.channel_manager else {}
        }
    
    async def start_price_push_loop(self):
        """启动价格推送循环"""
        if not self.hub:
            logger.warning("WebSocket Hub不可用，价格推送循环未启动")
            return
        
        logger.info("🚀 启动价格推送循环")
        
        while True:
            await asyncio.sleep(5)  # 每 5 秒推送一次
            
            # 检查是否有活跃连接
            if not self.ticker_subscriptions:
                continue
            
            # 处理所有订阅的ticker
            for ticker, clients in self.ticker_subscriptions.items():
                if not clients:
                    continue
                
                try:
                    # 获取实时报价
                    quote = self.data_pusher.get_realtime_quote(ticker)
                    if quote:
                        await self.broadcast_ticker(ticker, quote)
                        
                        # 同时发送到价格更新频道
                        await self.broadcast_to_channel("price_updates", {
                            "type": "channel_price_update",
                            "ticker": ticker,
                            "data": quote,
                            "timestamp": datetime.utcnow().isoformat()
                        })
                except Exception as e:
                    logger.error(f"处理ticker {ticker}失败: {e}")


# 全局管理器实例
manager = WebSocketManager()


async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket端点处理函数"""
    # 连接客户端
    connected = await manager.connect(client_id, websocket)
    if not connected:
        await websocket.close()
        return
    
    try:
        # 监听消息
        while True:
            data = await websocket.receive_json()
            await manager.handle_message(client_id, data)
    
    except WebSocketDisconnect:
        await manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket端点错误 {client_id}: {e}")
        await manager.disconnect(client_id)


async def price_push_loop():
    """价格推送循环（兼容接口）"""
    await manager.start_price_push_loop()


# 核心监控标的
CORE_TICKERS = [
    "000001",  # 上证指数
    "399001",  # 深证成指
    "399006",  # 创业板指
    "600000",  # 浦发银行
    "000858",  # 五粮液
    "300750",  # 宁德时代,
]


__all__ = [
    "manager",
    "websocket_endpoint",
    "price_push_loop",
    "WebSocketManager",
    "TDXDataPusher",
]