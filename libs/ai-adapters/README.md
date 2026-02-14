# AI Adapters - 统一 AI 模型适配器库

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**AI Adapters** 是从 Auto-Pen 和 MY-DOGE-MACRO 两个项目中提取的统一 AI 模型适配器库，提供：

- 🔌 **10+ LLM 适配器** - OpenAI, DeepSeek, Gemini, Ollama 等
- 📊 **6+ Embedding 适配器** - 支持向量存储和语义搜索
- 🧠 **智能路由** - 基于任务类型、成本、延迟的自动模型选择
- 🔄 **故障转移** - 自动回退到备用模型

## 安装

```bash
# 基础安装
pip install ai-adapters

# 带 LangChain 支持
pip install ai-adapters[langchain]

# 带 ChromaDB 支持
pip install ai-adapters[chromadb]

# 完整安装
pip install ai-adapters[all]
```

## 快速开始

### LLM 调用

```python
from ai_adapters import create_llm_adapter

# 创建 OpenAI 适配器
llm = create_llm_adapter(
    provider="openai",
    model_name="gpt-4o-mini",
    api_key="your-api-key"
)

# 调用模型
response = llm.invoke("你好，请介绍一下自己")
print(response)
```

### DeepSeek 调用

```python
from ai_adapters import create_llm_adapter

llm = create_llm_adapter(
    provider="deepseek",
    model_name="deepseek-chat",
    api_key="your-deepseek-key"
)

response = llm.invoke("分析一下当前的量化市场趋势")
```

### Ollama 本地模型

```python
from ai_adapters import create_llm_adapter

llm = create_llm_adapter(
    provider="ollama",
    model_name="llama3.1",
    base_url="http://localhost:11434"
)

response = llm.invoke("Hello from local model!")
```

### Embedding 生成

```python
from ai_adapters import create_embedding_adapter

embedder = create_embedding_adapter(
    provider="openai",
    model_name="text-embedding-3-small",
    api_key="your-api-key"
)

# 生成向量
vectors = embedder.embed_documents([
    "这是第一段文本",
    "这是第二段文本"
])

print(f"向量维度: {len(vectors[0])}")  # 1536
```

## 智能路由

```python
from ai_adapters import TaskRouter, create_llm_adapter, TaskType

# 创建路由器
router = TaskRouter()

# 添加多个模型
router.add_model(
    "gpt-4",
    create_llm_adapter("openai", "gpt-4o", api_key="..."),
    cost_per_1k_tokens=0.03
)

router.add_model(
    "deepseek",
    create_llm_adapter("deepseek", "deepseek-chat", api_key="..."),
    cost_per_1k_tokens=0.001
)

router.add_model(
    "local",
    create_llm_adapter("ollama", "llama3.1"),
    cost_per_1k_tokens=0.0
)

# 根据任务类型自动选择最佳模型
response = router.invoke_with_routing(
    "请分析这段代码的性能问题...",
    task_type=TaskType.ANALYSIS
)
```

## 支持的提供商

### LLM 提供商

| 提供商 | 适配器名称 | 模型示例 |
|--------|-----------|---------|
| OpenAI | `openai` | gpt-4o, gpt-4o-mini, o1 |
| DeepSeek | `deepseek` | deepseek-chat, deepseek-reasoner |
| Azure OpenAI | `azure_openai` | Azure 部署的 GPT 模型 |
| Gemini | `gemini` | gemini-pro, gemini-2.0-flash |
| xAI Grok | `grok` | grok-beta |
| Ollama | `ollama` | llama3.1, mistral, qwen |
| SiliconFlow | `siliconflow` | 各种开源模型 |
| 火山引擎 | `volcano` | 豆包系列 |

### Embedding 提供商

| 提供商 | 适配器名称 | 模型示例 |
|--------|-----------|---------|
| OpenAI | `openai` | text-embedding-3-small |
| Azure OpenAI | `azure_openai` | Azure Embedding |
| Gemini | `gemini` | text-embedding-004 |
| Ollama | `ollama` | nomic-embed-text |
| SiliconFlow | `siliconflow` | 各种 Embedding 模型 |

## 环境变量

```bash
# OpenAI
export OPENAI_API_KEY="sk-..."

# DeepSeek
export DEEPSEEK_API_KEY="sk-..."

# Gemini
export GEMINI_API_KEY="..."

# Ollama (可选)
export OLLAMA_BASE_URL="http://localhost:11434"
```

## 项目来源

本库是从以下两个项目的交叉优化中提取的共享组件：

- **Auto-Pen** - AI 智能小说创作平台
- **MY-DOGE-MACRO** - AI 量化情报与研报系统

遵循 **CDD (宪法驱动开发)** 方法论，符合 §302 多模型协同公理和 §193 模型选择器公理。

## License

MIT License