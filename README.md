# **🐕 MY-DOGE MACRO**

**MY-DOGE MACRO** 是一个自动化的量化宏观分析框架，旨在将传统的量化动量策略与大语言模型（LLM）的推理能力相结合。

## 🔍 项目概述

该系统通过追踪全球核心大类资产——科技股 (QQQ)、避险黄金 (GLD)、数字货币 (BTC) 及 A股 (000300)——来识别当前市场的风险体制 (Market Regime)。它不仅仅依赖简单的技术指标，还利用 **DeepSeek API** 对长短期数据进行综合推理，输出带有精确数据引用的投资策略报告。

## 🧠 核心特性

* **📈 多维时序分析**:  
  * 严格解耦**中期趋势** (Medium-term Trend, ~120d) 和**短期动量** (Short-term Momentum, 5d)，避免信号混淆。  
* **🤖 LLM 增强推理**:  
  * 集成 DeepSeek 大模型，模拟宏观对冲基金经理的决策逻辑，分析资产间的相关性与背离（如 BTC vs GLD）。  
* **🛡️ 动态风险体制识别**:  
  * 基于相对强弱模型 (Relative Strength) 自动判定市场处于 **Risk-On** 还是 **Risk-Off** 状态。  
* **📊 精确数据引用**:  
  * 生成的策略报告强制要求引用底层数据源，确保每一条结论都有据可依，杜绝幻觉。

## 🛠️ 技术栈

* **Core**: Python 3.10+  
* **Data**: yfinance, pandas, numpy  
* **AI/LLM**: openai SDK (DeepSeek Provider)  
* **Math**: 波动率目标计算 (Volatility Targeting), 归一化动量 (Normalized Momentum)

## 📦 安装

### 使用 pip 安装（推荐）

```bash
pip install my-doge-macro
```

### 从源码安装

\# 克隆项目  
git clone https://github.com/wsman/MY-DOGE-MACRO.git

cd MY-DOGE-MACRO

\# 创建并激活虚拟环境 (推荐)  
python \-m venv venv  
\# Windows  
venv\\Scripts\\activate  
\# Linux/Mac  
source venv/bin/activate

\# 安装依赖  
pip install \-e .

## ⚙️ 配置

### 1. 获取 DeepSeek API Key

1. 访问 [DeepSeek 官网](https://platform.deepseek.com/)，注册账号。  
2. 进入控制台，在 "API Keys" 页面创建新的 API Key。

### 2. 设置环境变量

将 .env.example 文件重命名为 .env 并填入您的 Key：

\# 在项目根目录执行以下命令  
mv .env.example .env

编辑 .env 文件，替换占位符：

DEEPSEEK\_API\_KEY=sk-your\_actual\_api\_key\_here

✅ **安全提示**：请勿将 .env 文件提交至 Git 版本控制。该文件包含敏感信息，已通过 .gitignore 自动排除。

### 3. 配置模型参数（可选）

您可以通过在 .env 文件中添加模型配置来自定义使用的 DeepSeek 模型：

\# 默认使用 deepseek-chat 模型，也可设置为 deepseek-reasoner  
DEEPSEEK\_MODEL=deepseek-chat

## 🎯 快速开始

### 基础使用

```python
from my_doge_macro import MacroConfig, GlobalMacroLoader, DeepSeekStrategist, setup_logging

# 初始化日志系统  
setup_logging()

# 从 .env 文件自动加载配置  
config = MacroConfig()

# 获取市场数据  
loader = GlobalMacroLoader(config)  
market_data = loader.fetch_combined_data()

if market_data is not None:  
    # 计算技术指标 (长短期解耦)  
    metrics = loader.calculate_metrics(market_data)  
    
    # DeepSeek 宏观推理  
    strategist = DeepSeekStrategist(config)  
    report = strategist.generate_strategy_report(metrics, market_data.tail(5))  
    
    print(report)
```

### 命令行使用

安装成功后，可直接在终端运行：

```bash
my-doge-macro --verbose
```

## 📊 核心概念

### 资产锚点 (Proxies)

* **科技叙事**: QQQ (纳指100 ETF)  
* **避险情绪**: GLD (黄金 ETF)  
* **数字黄金**: BTC-USD (比特币)  
* **标的资产**: 000300.SS (沪深300)

### 决策框架

策略基于"跨资产轮动"框架：

1. **核心公理**: 资金总是流向阻力最小的方向。  
2. **避险判定**: 科技股动能衰竭 + 黄金/BTC 趋势走强 = Risk-Off。  
3. **进攻判定**: 科技股稳步上涨 + 避险资产滞涨 = Risk-On。

## 🧱 架构概述

```
[数据源] --> [DataLoader] --> [指标计算] --> [LLM 推理] --> [策略报告]
        \--> [日志记录]     \--> [报告归档]
```

### 1. 数据获取与处理

系统通过 `yfinance` 从全球金融市场下载核心资产历史价格数据。为确保回溯窗口（lookback window）内包含完整的工作日，系统会强制对齐到股票交易日（以 QQQ 为基准），剔除周末及节假日的非交易数据，并对缺失值进行前向填充。

### 2. 指标计算

采用分层级的时间序列分析：
1. **波动率 (Volatility)**：年化波动率用于衡量市场风险
2. **中期趋势 (Medium Trend)**：基于整个观察周期（约120交易日）的累计收益
3. **短期动量 (Short Momentum)**：基于最近5个交易日的价格变化

### 3. LLM 推理与报告生成

系统使用 DeepSeek API 进行宏观分析，通过结构化提示词工程和数据引用规范来生成可验证的投资建议。策略报告会自动归档至 `macro_report/` 目录下。

## 🗂️ 项目结构

```
my_doge_macro/
├── my_doge_macro/          # 主包目录
│   ├── __init__.py         # 包初始化
│   ├── config.py           # 配置管理
│   ├── data_loader.py      # 数据获取模块 (yfinance)
│   ├── strategist.py       # 策略分析模块 (DeepSeek LLM)
│   └── utils.py            # 工具函数
├── tests/                  # 单元测试
├── examples/               # 使用示例
├── notebooks/              # Jupyter Notebooks
├── logs/                   # 运行日志
├── macro_report/           # 策略报告归档目录
├── .env.example            # 环境变量模板
├── requirements.txt        # 依赖列表
├── setup.py                # 包安装配置
├── pyproject.toml          # 项目元数据与依赖
└── README.md               # 项目文档
```

## 🧪 API 参考

### `MacroConfig`
用于管理所有策略参数的配置类。

* **属性**:
  * `tech_proxy`: 科技股代理 (默认: QQQ)
  * `safe_haven_proxy`: 避险资产代理 (默认: GLD)
  * `crypto_proxy`: 数字货币代理 (默认: BTC-USD)
  * `target_asset`: 标的资产 (默认: 000300.SS)
  * `lookback_days`: 回溯天数 (默认: 120)
  * `volatility_window`: 波动率计算窗口 (默认: 20)

### `GlobalMacroLoader`
负责从 yfinance 获取并清洗数据。

* **方法**:
  * `fetch_combined_data()`: 下载多资产历史价格
  * `calculate_metrics(data)`: 计算技术指标

### `DeepSeekStrategist`
使用 DeepSeek API 进行宏观分析和报告生成的核心模块。

* **方法**:
  * `generate_strategy_report(metrics, market_data)`: 生成策略报告

## 📈 使用场景

### 每日市场分析

```python
# 每日开盘前运行，获取当日宏观状态报告  
from my_doge_macro import run_daily_analysis  
report = run_daily_analysis()
```

### 自定义配置

```python
from my_doge_macro import MacroConfig

# 自定义资产配置 (例如: 3倍做多纳指 vs 黄金信托)  
config = MacroConfig(  
    tech_proxy="TQQQ",             
    safe_haven_proxy="IAU",        
    target_asset="510300.SS",      
    lookback_days=90,              
)
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目  
2. 创建特性分支 (git checkout \-b feature/AmazingFeature)  
3. 提交更改 (git commit \-m 'feat: Add some AmazingFeature')  
4. 推送到分支 (git push origin feature/AmazingFeature)  
5. 开启 Pull Request

## 📄 许可证

本项目采用 **Apache License 2.0** 许可证 - 查看 [LICENSE](https://www.google.com/search?q=LICENSE) 文件了解详情。

## ⚖️ 免责声明 (Disclaimer)

本软件（MY-DOGE MACRO）仅供教育和研究使用，不构成任何投资建议。  
This software is for educational and research purposes only and does not constitute investment advice.

* **市场风险**：金融市场具有高度波动性，使用本工具生成的策略可能会导致资金损失。  
* **模型局限**：基于历史数据（Backtest/History）的分析结果不代表未来表现（Past performance is not indicative of future results）。  
* **无担保**：作者不对因使用本软件而产生的任何直接或间接损失承担责任。用户应自行承担交易风险。

Use at your own risk. DYOR (Do Your Own Research).
