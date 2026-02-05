# WebSocket 实时推送模块
# Created: 2026-02-05 (v1.8.0)

from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Set, Optional
import asyncio
import json
from datetime import datetime


class ConnectionManager:
    """WebSocket 连接管理器"""
    
    def __init__(self):
        # 活跃连接: {client_id: WebSocket}
        self.active_connections: Dict[str, WebSocket] = {}
        # 订阅关系: {ticker: set of client_ids}
        self.subscriptions: Dict[str, Set[str]] = {}
        # 客户端订阅: {client_id: set of tickers}
        self.client_subscriptions: Dict[str, Set[str]] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str) -> None:
        """接受新连接"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.client_subscriptions[client_id] = set()
        print(f"[WS] Client connected: {client_id}")
    
    def disconnect(self, client_id: str) -> None:
        """断开连接"""
        if client_id in self.active_connections:
            # 清理订阅
            for ticker in self.client_subscriptions.get(client_id, set()):
                if ticker in self.subscriptions:
                    self.subscriptions[ticker].discard(client_id)
            
            del self.active_connections[client_id]
            if client_id in self.client_subscriptions:
                del self.client_subscriptions[client_id]
            print(f"[WS] Client disconnected: {client_id}")
    
    def subscribe(self, client_id: str, ticker: str) -> bool:
        """订阅 ticker"""
        if client_id not in self.active_connections:
            return False
        
        if ticker not in self.subscriptions:
            self.subscriptions[ticker] = set()
        
        self.subscriptions[ticker].add(client_id)
        self.client_subscriptions[client_id].add(ticker)
        print(f"[WS] Client {client_id} subscribed to {ticker}")
        return True
    
    def unsubscribe(self, client_id: str, ticker: str) -> bool:
        """取消订阅"""
        if ticker in self.subscriptions:
            self.subscriptions[ticker].discard(client_id)
        if client_id in self.client_subscriptions:
            self.client_subscriptions[client_id].discard(ticker)
        print(f"[WS] Client {client_id} unsubscribed from {ticker}")
        return True
    
    async def send_personal_message(self, message: dict, client_id: str) -> None:
        """发送私人消息"""
        if client_id in self.active_connections:
            websocket = self.active_connections[client_id]
            try:
                await websocket.send_json(message)
            except Exception as e:
                print(f"[WS] Error sending to {client_id}: {e}")
                self.disconnect(client_id)
    
    async def broadcast_ticker(self, ticker: str, data: dict) -> None:
        """向订阅特定 ticker 的客户端广播"""
        if ticker not in self.subscriptions:
            return
        
        message = {
            "type": "price_update",
            "ticker": ticker,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        disconnected = []
        for client_id in self.subscriptions[ticker]:
            if client_id in self.active_connections:
                try:
                    await self.active_connections[client_id].send_json(message)
                except Exception as e:
                    print(f"[WS] Error broadcasting to {client_id}: {e}")
                    disconnected.append(client_id)
        
        # 清理断开的连接
        for client_id in disconnected:
            self.disconnect(client_id)
    
    async def broadcast_all(self, message: dict) -> None:
        """向所有客户端广播"""
        disconnected = []
        for client_id, websocket in self.active_connections.items():
            try:
                await websocket.send_json(message)
            except Exception as e:
                print(f"[WS] Error broadcasting to {client_id}: {e}")
                disconnected.append(client_id)
        
        for client_id in disconnected:
            self.disconnect(client_id)
    
    def get_stats(self) -> dict:
        """获取连接统计"""
        return {
            "active_connections": len(self.active_connections),
            "subscriptions": {k: len(v) for k, v in self.subscriptions.items()},
            "clients": list(self.active_connections.keys())
        }


# 全局连接管理器
manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket 端点处理函数"""
    await manager.connect(websocket, client_id)
    
    try:
        while True:
            # 接收消息
            data = await websocket.receive_json()
            
            action = data.get("action")
            
            if action == "subscribe":
                ticker = data.get("ticker")
                if ticker:
                    success = manager.subscribe(client_id, ticker)
                    await manager.send_personal_message({
                        "type": "subscribe_result",
                        "ticker": ticker,
                        "success": success
                    }, client_id)
            
            elif action == "unsubscribe":
                ticker = data.get("ticker")
                if ticker:
                    success = manager.unsubscribe(client_id, ticker)
                    await manager.send_personal_message({
                        "type": "unsubscribe_result",
                        "ticker": ticker,
                        "success": success
                    }, client_id)
            
            elif action == "ping":
                await manager.send_personal_message({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                }, client_id)
            
            elif action == "get_stats":
                await manager.send_personal_message({
                    "type": "stats",
                    "data": manager.get_stats()
                }, client_id)
    
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        print(f"[WS] Error in websocket_endpoint: {e}")
        manager.disconnect(client_id)


# 价格推送任务 (示例)
async def price_push_loop():
    """模拟价格推送循环 (实际应用中从数据源获取)"""
    import random
    
    sample_tickers = ["AAPL", "GOOGL", "MSFT", "BTC-USD", "GC=F"]
    base_prices = {"AAPL": 175.0, "GOOGL": 140.0, "MSFT": 380.0, "BTC-USD": 45000.0, "GC=F": 2000.0}
    
    while True:
        await asyncio.sleep(5)  # 每 5 秒推送一次
        
        for ticker in sample_tickers:
            if ticker in manager.subscriptions and manager.subscriptions[ticker]:
                # 模拟价格变动
                change = random.uniform(-0.5, 0.5)
                base_prices[ticker] *= (1 + change / 100)
                
                await manager.broadcast_ticker(ticker, {
                    "price": round(base_prices[ticker], 2),
                    "change": round(change, 4),
                    "volume": random.randint(1000000, 10000000)
                })
