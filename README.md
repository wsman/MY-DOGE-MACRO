# 🐕 MY-DOGE MACRO

**MY-DOGE MACRO** 是一个自动化的量化宏观分析框架，旨在将传统的量化动量策略与大语言模型（LLM）的推理能力相结合。

该系统通过追踪全球核心大类资产——科技股 (QQQ)、避险黄金 (GLD)、数字货币 (BTC) 及 A股 (000300)——来识别当前市场的风险体制 (Market Regime)。它不仅仅依赖简单的技术指标，还利用 **DeepSeek API** 对长短期数据进行综合推理，输出带有精确数据引用的投资策略报告。

## 核心特性 (Key Features)

- **📈 多维时序分析 (Decoupled Metrics)**: 
  - 严格解耦**中期趋势** (Medium-term Trend, ~90d) 与**短期动量** (Short-term Momentum, 5d)，避免信号混淆。
- **🤖 LLM 增强推理 (AI-Powered reasoning)**: 
  - 集成 DeepSeek 大模型，模拟宏观对冲基金经理的决策逻辑，分析资产间的相关性与背离（如 BTC vs GLD）。
- **🛡️ 动态风险体制识别 (Regime Detection)**: 
  - 基于相对强弱模型 (Relative Strength) 自动判定市场处于 **Risk-On** (风险偏好) 还是 **Risk-Off** (避险) 状态。
- **📊 精确数据引用 (Data Citation)**: 
  - 生成的策略报告强制要求引用底层数据源，确保每一条结论都有据可依，杜绝幻觉。

## 技术栈 (Tech Stack)

- **Core**: Python 3.10+
- **Data**: `yfinance`, `pandas`, `numpy`
- **AI/LLM**: `openai` SDK (DeepSeek Provider)
- **Math**: 波动率目标计算 (Volatility Targeting), 归一化动量 (Normalized Momentum)

一个基于 DeepSeek API 的量化宏观对冲策略工具，用于分析全球市场资金流向和制定投资决策。

## 🚀 特性

- **跨市场数据同步**: 同时获取美股、黄金、A股等全球核心资产数据
- **智能指标计算**: 自动计算技术指标和风险信号
- **DeepSeek AI 分析**: 利用大语言模型进行宏观策略研判
- **专业日志系统**: 完整的运行日志记录，便于追溯决策
- **模块化设计**: 清晰的代码结构，易于扩展和维护

## 📦 安装

### 从源码安装

```bash
# 克隆项目
git clone https://github.com/wsman/MY-DOGE-MACRO.git
cd my_doge_macro

# 安装依赖（推荐使用虚拟环境）
python -m venv venv
venv\Scripts\activate  # Windows 或 source venv/bin/activate  # Linux/Mac

pip install -e .
```

### 使用 Python 虚拟环境 (推荐)

建议在虚拟环境中使用该项目以避免依赖冲突：

```bash
# 创建虚拟环境
python -m venv mydoge_env

# 激活虚拟环境
mydoge_env\Scripts\activate  # Windows
# 或者
source mydoge_env/bin/activate  # Linux/Mac

# 安装项目依赖
pip install -e .
```

### 从 PyPI 安装（待发布）

```bash
pip install my-doge-macro
```

## ⚙️ 配置

### 1. 设置 API Key

将 `.env.example` 文件重命名为 `.env` 并填入您的 DeepSeek API Key：

```bash
# 在项目根目录执行以下命令
mv .env.example .env
```

然后编辑 `.env` 文件，替换 `your_deepseek_api_key_here` 为您的实际 API Key：

```env
DEEPSEEK_API_KEY=your_actual_api_key_here
```

### 2. 配置 DeepSeek 模型（可选）

您可以通过在 `.env` 文件中添加模型配置来自定义使用的 DeepSeek 模型：

```env
# 默认使用 deepseek-chat 模型，也可设置为 deepseek-reasoner
DEEPSEEK_MODEL=deepseek-reasoner
```

> ⚠️ 请注意：`deepseek-reasoner` 是高级推理模型，可能需要额外的权限和资源。请根据您的 API 访问权限选择合适的模型。

### 2. 获取 DeepSeek API Key

1. 访问 [DeepSeek 官网](https://platform.deepseek.com/)，注册账号。
2. 进入控制台，在 "API Keys" 页面创建新的 API Key。
3. 将生成的 API Key 复制到 `.env` 文件中的 `DEEPSEEK_API_KEY=your_actual_api_key_here` 位置。

> ✅ **重要提示**：请勿将 `.env` 文件提交至 Git 版本控制。该文件包含敏感信息，已通过 `.gitignore` 自动排除。

## 🎯 快速开始

### 基础使用

```python
from my_doge_macro import MacroConfig, GlobalMacroLoader, DeepSeekStrategist, setup_logging

# 初始化日志系统
setup_logging()

# 从 .env 文件自动加载 API Key（无需手动配置）
config = MacroConfig()


# 获取市场数据
loader = GlobalMacroLoader(config)
market_data = loader.fetch_combined_data()

if market_data is not None:
    # 计算技术指标
    metrics = loader.calculate_metrics(market_data)
    
    # DeepSeek 分析
    strategist = DeepSeekStrategist(config)
    report = strategist.generate_strategy_report(metrics, market_data.tail(5))
    
    print(report)
```

### 命令行使用

```bash
# 安装后可通过命令行使用
my-doge-macro
```

## 📊 核心概念

### 资产锚点 (Proxies)

- **科技叙事**: QQQ (纳指100 ETF)
- **避险情绪**: GLD (黄金 ETF)  
- **标的资产**: 000300.SS (沪深300)

### 决策框架

策略基于"跨资产轮动"框架：

1. **核心公理**: 资金总是流向阻力最小的方向
2. **避险判定**: 科技股波动率飙升 + 黄金上涨 = Risk-Off
3. **进攻判定**: 科技股稳步上涨 + 黄金滞涨 = Risk-On

## 🗂️ 项目结构

```
my_doge_macro/
├── my_doge_macro/          # 主包目录
│   ├── __init__.py         # 包初始化
│   ├── config.py           # 配置管理
│   ├── data_loader.py      # 数据获取模块
│   ├── strategist.py       # 策略分析模块
│   └── utils.py            # 工具函数
├── tests/                  # 单元测试
├── examples/               # 使用示例
├── notebooks/              # Jupyter Notebooks
├── logs/                   # 运行日志
├── .env.example            # 环境变量模板
├── requirements.txt        # 依赖列表
├── setup.py                # 包安装配置
├── pyproject.toml          # 现代包配置
└── README.md              # 项目文档
```

## 🔧 开发

### 安装开发依赖

```bash
pip install -e ".[dev]"
```

### 运行测试

```bash
pytest
```

### 代码格式化

```bash
black my_doge_macro/
flake8 my_doge_macro/
mypy my_doge_macro/
```

## 📈 使用场景

### 1. 每日市场分析
```python
# 每日开盘前运行，获取当日交易建议
from my_doge_macro import run_daily_analysis

report = run_daily_analysis()
```

### 2. 历史回测
```python
# 在 notebooks/ 目录中使用 Jupyter 进行策略回测
# 详见 notebooks/backtesting.ipynb
```

### 3. 自定义配置
```python
from my_doge_macro import MacroConfig

# 自定义资产配置
config = MacroConfig(
    tech_proxy="TQQQ",           # 3倍杠杆纳指ETF
    safe_haven_proxy="IAU",      # iShares 黄金信托
    target_asset="510300.SS",    # 沪深300 ETF
    lookback_days=90,            # 延长观察窗口
)
```

## 🐛 故障排除

### 常见问题

1. **数据获取失败**
   - 检查网络连接
   - 验证股票代码格式
   - 确认 yfinance 库正常工作

2. **API 调用失败**
   - 检查 `.env` 文件中的 API Key
   - 确认 DeepSeek 账户余额充足
   - 查看日志文件获取详细错误信息

3. **依赖安装问题**
   - 使用 Python 3.8+
   - 更新 pip: `pip install --upgrade pip`

### 日志查看

日志文件保存在 `logs/app.log`，包含详细的运行信息：

```bash
tail -f logs/app.log
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## ⚠️ 免责声明

本项目仅供学习和研究使用，不构成投资建议。金融市场投资存在风险，请在充分了解风险的情况下谨慎决策。作者不对任何投资损失承担责任。

---


