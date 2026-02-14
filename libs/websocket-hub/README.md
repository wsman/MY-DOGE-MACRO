# WebSocket Hub - 统一实时通信库

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**WebSocket Hub** 是从 MY-DOGE-MACRO 移植到 Auto-Pen 的统一实时通信库，提供：

- 🔌 **连接管理** - 自动心跳、超时检测、优雅断开
- 📡 **频道订阅** - Pub/Sub 模式的频道管理
- 📊 **进度追踪** - 长时间任务的实时进度推送
- 🔔 **通知系统** - 用户通知和系统告警

## 安装

```bash
pip install websocket-hub
```

## 快速开始

### FastAPI 集成

```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from websocket_hub import WebSocketHub, ProgressTracker

app = FastAPI()
hub = WebSocketHub()
tracker = ProgressTracker(progress_callback=hub.send_to)

@app.on_event("startup")
async def startup():
    hub.start_background_tasks()

@app.on_event("shutdown")
async def shutdown():
    await hub.stop()

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    connected = await hub.connect(client_id, websocket)
    if not connected:
        return
    
    try:
        await hub.listen(client_id)
    except WebSocketDisconnect:
        pass
    finally:
        hub.disconnect(client_id)
```

### 进度追踪

```python
from websocket_hub import ProgressTracker

# 创建追踪器 (带回调)
tracker = ProgressTracker(progress_callback=hub.send_to)

# 启动任务
task = tracker.start_task(
    task_name="生成小说章节",
    client_id="user-123",
    total_steps=5
)

# 更新进度
tracker.update(task.task_id, 0.2, "正在生成大纲...")
tracker.update(task.task_id, 0.5, "正在生成角色对话...")

# 步骤式更新
tracker.step(task.task_id, "生成完成")

# 完成任务
tracker.complete(task.task_id, result={"word_count": 2500})
```

### 频道订阅

```python
from websocket_hub import ChannelManager, ChannelPermission

manager = ChannelManager()

# 创建频道
manager.create_channel("novel-updates", permission=ChannelPermission.PUBLIC)

# 订阅
manager.subscribe("novel-updates", client_id)

# 广播到频道
for cid in manager.get_subscribers("novel-updates"):
    await hub.send_to(cid, {"type": "notification", "message": "新章节发布!"})
```

### 发送消息

```python
# 发送给特定客户端
await hub.send_to(client_id, {
    "type": "notification",
    "title": "生成完成",
    "content": "第1章已生成完毕"
})

# 广播给所有客户端
await hub.broadcast({
    "type": "alert",
    "title": "系统维护",
    "content": "服务器将在10分钟后维护"
})

# 发送进度
await hub.send_progress(
    client_id,
    task_id="task-123",
    progress=0.75,
    message="正在生成..."
)
```

## 消息类型

| 类型 | 描述 |
|------|------|
| `connect` | 连接确认 |
| `disconnect` | 断开通知 |
| `heartbeat` | 心跳检测 |
| `progress_start` | 任务开始 |
| `progress_update` | 进度更新 |
| `progress_complete` | 任务完成 |
| `progress_error` | 任务错误 |
| `notification` | 用户通知 |
| `alert` | 系统告警 |
| `data_stream` | 数据流 |
| `broadcast` | 频道广播 |

## 应用场景

### Auto-Pen (小说创作)
- 章节生成进度实时推送
- 角色关系图实时更新
- AI 写作状态反馈
- 协作编辑同步

### MY-DOGE-MACRO (量化分析)
- 实时行情推送
- 研报生成进度
- 技术指标更新
- 市场告警通知

## API 参考

### WebSocketHub

| 方法 | 描述 |
|------|------|
| `connect(client_id, websocket)` | 注册新连接 |
| `disconnect(client_id)` | 断开连接 |
| `listen(client_id)` | 监听客户端消息 |
| `send_to(client_id, message)` | 发送给特定客户端 |
| `broadcast(message, exclude)` | 广播给所有客户端 |
| `send_progress(...)` | 发送进度更新 |
| `send_notification(...)` | 发送通知 |
| `get_stats()` | 获取统计信息 |

### ProgressTracker

| 方法 | 描述 |
|------|------|
| `start_task(task_name, client_id, ...)` | 启动任务 |
| `update(task_id, progress, message)` | 更新进度 |
| `step(task_id, message)` | 前进一步 |
| `complete(task_id, result)` | 完成任务 |
| `fail(task_id, error_message)` | 标记失败 |
| `get_task(task_id)` | 获取任务 |
| `get_active_tasks(client_id)` | 获取活动任务 |

### ChannelManager

| 方法 | 描述 |
|------|------|
| `create_channel(name, permission)` | 创建频道 |
| `destroy_channel(name)` | 销毁频道 |
| `subscribe(channel, client_id)` | 订阅频道 |
| `unsubscribe(channel, client_id)` | 取消订阅 |
| `get_subscribers(channel)` | 获取订阅者 |

## 项目来源

本库是从 MY-DOGE-MACRO 项目移植到 Auto-Pen 的共享组件，遵循 **CDD (宪法驱动开发)** 方法论，符合 §191 实时通信公理。

## License

MIT License