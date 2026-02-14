# Vector Store - 统一向量存储库

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Vector Store** 是从 Auto-Pen 移植到 MY-DOGE-MACRO 的统一向量存储库，提供：

- 📦 **统一接口** - 内存存储和 ChromaDB 持久化
- 🔍 **语义搜索** - 余弦相似度、欧氏距离
- ✂️ **文本分块** - 智能切分长文本
- 🧪 **易于测试** - 内存存储模式

## 安装

```bash
# 基础安装 (内存存储)
pip install vector-store

# 带 ChromaDB 支持
pip install vector-store[chromadb]

# 完整安装
pip install vector-store[all]
```

## 快速开始

### 内存存储

```python
from vector_store import MemoryStore, Document, StoreConfig

# 创建存储
store = MemoryStore(StoreConfig(
    collection_name="my_collection",
    dimension=1536
))

# 添加文档
store.add([
    Document(
        id="1",
        content="这是一篇关于AI的文章",
        embedding=[0.1, 0.2, ...]  # 1536维向量
    ),
    Document(
        id="2",
        content="金融市场分析报告",
        embedding=[0.3, 0.4, ...]
    )
])

# 搜索
results = store.search(
    query_embedding=[0.1, 0.2, ...],
    top_k=5
)

for result in results:
    print(f"Score: {result.score:.3f}, Content: {result.content}")
```

### ChromaDB 持久化存储

```python
from vector_store import ChromaStore, Document, StoreConfig

# 创建持久化存储
store = ChromaStore(StoreConfig(
    collection_name="research_reports",
    dimension=1536,
    persist_directory="./data/chroma"
))

# 添加文档
store.add([
    Document(
        id="report-001",
        content="2024年Q1市场分析...",
        embedding=[...],
        metadata={"type": "report", "date": "2024-01-15"}
    )
])

# 带过滤器的搜索
results = store.search(
    query_embedding=[...],
    top_k=10,
    filter={"type": "report"}
)
```

### 文本分块

```python
from vector_store import chunk_text

# 分块长文本
text = "这是一段很长的文章内容..."
chunks = chunk_text(text, chunk_size=500, overlap=50)

for i, chunk in enumerate(chunks):
    print(f"Chunk {i}: {chunk[:50]}...")
```

## API 参考

### StoreConfig

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `collection_name` | str | - | 集合名称 |
| `dimension` | int | 1536 | 向量维度 |
| `metric` | DistanceMetric | COSINE | 距离度量 |
| `persist_directory` | str | None | 持久化目录 |

### Document

| 字段 | 类型 | 描述 |
|------|------|------|
| `id` | str | 文档ID |
| `content` | str | 文档内容 |
| `embedding` | List[float] | 嵌入向量 |
| `metadata` | Dict | 元数据 |
| `created_at` | datetime | 创建时间 |

### SearchResult

| 字段 | 类型 | 描述 |
|------|------|------|
| `document` | Document | 文档对象 |
| `score` | float | 相似度分数 (0-1) |
| `distance` | float | 距离值 |

### Store 方法

| 方法 | 描述 |
|------|------|
| `add(documents)` | 添加文档 |
| `get(ids)` | 按ID获取文档 |
| `search(query, top_k, filter)` | 语义搜索 |
| `delete(ids)` | 删除文档 |
| `count()` | 文档数量 |
| `clear()` | 清空存储 |
| `get_stats()` | 获取统计 |

## 应用场景

### Auto-Pen (小说创作)
- 章节内容语义搜索
- 角色关系知识图谱
- 世界观设定检索

### MY-DOGE-MACRO (量化分析)
- 历史研报语义搜索
- 相似市场模式匹配
- 金融知识库构建

## 项目来源

本库是从 Auto-Pen 项目移植到 MY-DOGE-MACRO 的共享组件，遵循 **CDD (宪法驱动开发)** 方法论。

## License

MIT License