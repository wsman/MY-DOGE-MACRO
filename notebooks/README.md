# Jupyter Notebooks

此目录用于存放探索性数据分析和策略研究的 Jupyter Notebooks。

## 📓 推荐 Notebooks

### 1. 数据探索
- `data_exploration.ipynb` - 市场数据可视化和统计分析
- `correlation_analysis.ipynb` - 资产相关性分析

### 2. 策略研究
- `strategy_backtesting.ipynb` - 策略历史回测
- `parameter_optimization.ipynb` - 参数优化研究

### 3. 模型评估
- `model_performance.ipynb` - 模型性能评估
- `risk_analysis.ipynb` - 风险指标分析

## 🚀 快速开始

### 安装 Jupyter

```bash
# 安装 Jupyter 支持
pip install jupyter matplotlib seaborn

# 或者使用项目提供的可选依赖
pip install -e ".[notebook]"
```

### 启动 Jupyter

```bash
# 在项目根目录运行
jupyter notebook

# 或者
jupyter lab
```

## 📊 数据访问

在 Notebook 中可以使用以下方式导入包：

```python
import sys
sys.path.append('..')  # 添加父目录到路径

from my_doge_macro import MacroConfig, GlobalMacroLoader, DeepSeekStrategist

# 创建配置和数据加载器
config = MacroConfig()
loader = GlobalMacroLoader(config)

# 获取数据
data = loader.fetch_combined_data()
```

## 🔬 研究建议

1. **数据质量检查**: 验证数据完整性和一致性
2. **特征工程**: 创建新的技术指标和特征
3. **模型比较**: 测试不同的 AI 模型和提示词
4. **回测验证**: 使用历史数据验证策略有效性

## 📈 可视化工具

推荐使用以下库进行数据可视化：

- `matplotlib` - 基础绘图
- `seaborn` - 统计可视化
- `plotly` - 交互式图表
- `mplfinance` - 金融图表

## 💡 最佳实践

1. **版本控制**: 定期保存和提交 Notebooks
2. **文档化**: 添加详细的注释和说明
3. **模块化**: 将常用功能封装为函数
4. **可复现**: 确保 Notebook 可以独立运行

---

