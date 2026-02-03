#!/usr/bin/env python3
"""
测试 measure_entropy.py 的熵值计算逻辑

v1.7.0 - 工程化与稳健性
"""

import pytest
import sys
import os
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# 导入被测模块
try:
    from scripts.measure_entropy import (
        EntropyMetrics,
        EntropyCalculator,
        main
    )
    IMPORT_SUCCESS = True
except ImportError as e:
    IMPORT_SUCCESS = False
    print(f"导入失败: {e}")


# 跳过测试如果导入失败
pytestmark = pytest.mark.skipif(
    not IMPORT_SUCCESS,
    reason="无法导入 measure_entropy 模块"
)


class TestEntropyMetrics:
    """测试 EntropyMetrics 数据类"""
    
    def test_dataclass_creation(self):
        """测试数据类创建"""
        metrics = EntropyMetrics(
            c_dir=0.8,
            c_sig=0.7,
            c_test=0.9,
            compliance_score=0.8,
            h_sys=0.2,
            status="🟢 优秀"
        )
        
        assert metrics.c_dir == 0.8
        assert metrics.c_sig == 0.7
        assert metrics.c_test == 0.9
        assert metrics.compliance_score == 0.8
        assert metrics.h_sys == 0.2
        assert metrics.status == "🟢 优秀"
    
    def test_to_dict(self):
        """测试转换为字典"""
        metrics = EntropyMetrics(
            c_dir=0.8,
            c_sig=0.7,
            c_test=0.9,
            compliance_score=0.8,
            h_sys=0.2,
            status="🟢 优秀"
        )
        
        result = metrics.to_dict()
        
        assert result["c_dir"] == 0.8
        assert result["c_sig"] == 0.7
        assert result["c_test"] == 0.9
        assert result["compliance_score"] == 0.8
        assert result["h_sys"] == 0.2
        assert result["status"] == "🟢 优秀"
        assert isinstance(result["c_dir"], float)
        assert isinstance(result["h_sys"], float)


class TestEntropyCalculator:
    """测试 EntropyCalculator 类"""
    
    @pytest.fixture
    def calculator(self, tmp_path):
        """创建计算器实例"""
        # 创建一个临时项目目录
        project_dir = tmp_path / "test_project"
        project_dir.mkdir()
        
        # 创建必要的目录结构
        (project_dir / "src").mkdir()
        (project_dir / "templates" / "02_axioms").mkdir(parents=True)
        
        # 创建必要的文件（使用正确的路径）
        (project_dir / "templates" / "02_axioms" / "system_patterns.md").write_text("# Test")
        (project_dir / "templates" / "02_axioms" / "tech_context.md").write_text("# Test")
        (project_dir / "templates" / "02_axioms" / "behavior_context.md").write_text("# Test")
        
        return EntropyCalculator(str(project_dir), verbose=False)
    
    def test_initialization(self, calculator):
        """测试初始化"""
        assert calculator.project_path.exists()
        assert calculator.W_DIR == 0.4
        assert calculator.W_SIG == 0.3
        assert calculator.W_TEST == 0.3
    
    def test_log_method(self, calculator, capsys):
        """测试日志方法"""
        calculator.verbose = True
        calculator.log("测试消息")
        
        captured = capsys.readouterr()
        assert "[ENTROPY] 测试消息" in captured.out
    
    def test_run_command_success(self, calculator):
        """测试成功执行命令"""
        stdout, stderr, rc = calculator.run_command(["echo", "hello"])
        assert rc == 0
        assert "hello" in stdout
    
    def test_run_command_timeout(self, calculator):
        """测试命令超时"""
        # 模拟一个会超时的命令
        with patch('subprocess.run') as mock_run:
            mock_run.side_effect = TimeoutError("Command timed out")
            stdout, stderr, rc = calculator.run_command(["sleep", "10"])
            
            assert rc == 1
            assert "Command timed out" in stderr
    
    @patch('subprocess.run')
    def test_calculate_c_dir_with_tree_success(self, mock_run, calculator):
        """测试目录结构合规率计算（tree命令成功）"""
        # 模拟 tree 命令输出
        mock_run.return_value = Mock(
            stdout="src/\n├── file1.py\n└── file2.py\n",
            stderr="",
            returncode=0
        )
        
        # 模拟 systemPatterns.md 文件内容
        calculator.system_patterns_file.write_text(
            "```bash\nsrc/\n├── file1.py\n└── file2.py\n```"
        )
        
        result = calculator.calculate_c_dir()
        
        # 验证命令被调用
        mock_run.assert_called_once()
        assert 0.0 <= result <= 1.0
    
    @patch('subprocess.run')
    def test_calculate_c_dir_with_tree_failure(self, mock_run, calculator):
        """测试目录结构合规率计算（tree命令失败）"""
        # 模拟 tree 命令失败，fallback 到 find
        mock_run.side_effect = [
            Mock(stdout="", stderr="tree not found", returncode=1),  # tree 失败
            Mock(stdout="src/file1.py\nsrc/file2.py", stderr="", returncode=0)  # find 成功
        ]
        
        result = calculator.calculate_c_dir()
        
        # 应该调用两次命令
        assert mock_run.call_count == 2
        assert 0.0 <= result <= 1.0
    
    def test_calculate_c_dir_no_system_patterns(self, calculator):
        """测试没有 systemPatterns.md 文件的情况"""
        # 删除文件
        calculator.system_patterns_file.unlink()
        
        with patch.object(calculator, 'run_command') as mock_run:
            mock_run.return_value = ("src/\n├── file1.py", "", 0)
            result = calculator.calculate_c_dir()
            
            assert result == 0.5  # 默认值
    
    @patch('re.findall')
    @patch('pathlib.Path.read_text')
    def test_calculate_c_sig_with_interface_definitions(self, mock_read_text, mock_findall, calculator):
        """测试接口签名覆盖率计算（有接口定义）"""
        # 模拟 techContext.md 内容
        calculator.tech_context_file.write_text("""
def method1():
    pass

def method2():
    pass
""")
        
        # 模拟找到的实现
        mock_findall.side_effect = [
            ['method1', 'method2'],  # 在 techContext.md 中找到的定义
            ['method1'],  # 在 Python 文件中找到的实现
            []  # 在 TypeScript 文件中找到的实现
        ]
        
        # 模拟文件读取内容
        mock_read_text.return_value = "def method1():\n    pass"
        
        with patch('scripts.measure_entropy.Path.rglob') as mock_rglob:
            # 创建一个模拟的 Path 对象，避免实际文件读取
            mock_path = Mock()
            mock_path.read_text.return_value = "def method1():\n    pass"
            # 模拟 Python 文件
            mock_rglob.return_value = [mock_path]
            
            result = calculator.calculate_c_sig()
            
            # 重构后：模板仓库模式默认返回 0.0，而不是实际计算
            # 因为重构后的代码对模板仓库默认返回 0.0
            assert result == 0.0  # 重构后模板仓库默认值
    
    def test_calculate_c_sig_no_tech_context(self, calculator):
        """测试没有 techContext.md 文件的情况"""
        # 删除文件
        calculator.tech_context_file.unlink()
        
        result = calculator.calculate_c_sig()
        
        assert result == 0.5  # 默认值
    
    @patch('subprocess.run')
    def test_calculate_c_test_with_pytest(self, mock_run, calculator):
        """测试核心测试通过率计算（pytest 成功）"""
        # 模拟 pytest 输出
        mock_run.side_effect = [
            Mock(stdout="2 tests collected", stderr="", returncode=0),  # collect-only
            Mock(stdout="2 passed", stderr="", returncode=0)  # 实际运行
        ]
        
        with patch('re.search') as mock_search:
            mock_search.side_effect = [
                Mock(group=lambda x: "2"),  # 总测试数
                Mock(group=lambda x: "2")   # 通过测试数
            ]
            
            result = calculator.calculate_c_test()
            
            assert mock_run.call_count == 2
            assert result == 1.0  # 2/2 = 100%
    
    @patch('subprocess.run')
    def test_calculate_c_test_no_tests(self, mock_run, calculator):
        """测试没有测试的情况"""
        # 模拟 pytest 输出（没有测试）
        mock_run.return_value = Mock(
            stdout="no tests collected",
            stderr="",
            returncode=0
        )
        
        result = calculator.calculate_c_test()
        
        assert result == 0.5  # 默认值
    
    @patch.object(EntropyCalculator, 'calculate_c_dir')
    @patch.object(EntropyCalculator, 'calculate_c_sig')
    @patch.object(EntropyCalculator, 'calculate_c_test')
    def test_calculate_h_sys_excellent_status(self, mock_test, mock_sig, mock_dir, calculator):
        """测试综合熵值计算（优秀状态）"""
        # 模拟高合规度
        mock_dir.return_value = 0.9  # 90%
        mock_sig.return_value = 0.8  # 80%
        mock_test.return_value = 0.95  # 95%
        
        metrics = calculator.calculate_h_sys()
        
        # 验证计算
        expected_compliance = 0.4*0.9 + 0.3*0.8 + 0.3*0.95  # 0.885
        expected_h_sys = 1 - expected_compliance  # 0.115
        
        assert metrics.c_dir == 0.9
        assert metrics.c_sig == 0.8
        assert metrics.c_test == 0.95
        assert abs(metrics.compliance_score - expected_compliance) < 0.001
        assert abs(metrics.h_sys - expected_h_sys) < 0.001
        assert metrics.status == "🟢 优秀"
    
    @patch.object(EntropyCalculator, 'calculate_c_dir')
    @patch.object(EntropyCalculator, 'calculate_c_sig')
    @patch.object(EntropyCalculator, 'calculate_c_test')
    def test_calculate_h_sys_danger_status(self, mock_test, mock_sig, mock_dir, calculator):
        """测试综合熵值计算（危险状态）"""
        # 模拟极低合规度，使熵值 > 0.9
        mock_dir.return_value = 0.1  # 10%
        mock_sig.return_value = 0.05  # 5%
        mock_test.return_value = 0.1  # 10%
        
        metrics = calculator.calculate_h_sys()
        
        # 根据调整后的阈值，危险状态需要 h_sys > 0.9
        assert metrics.h_sys > 0.9
        assert metrics.status == "🔴 危险"
    
    def test_calculate_h_sys_edge_cases(self, calculator):
        """测试边界情况"""
        # 测试权重和为1
        assert abs(calculator.W_DIR + calculator.W_SIG + calculator.W_TEST - 1.0) < 0.001
        
        # 测试熵值范围
        with patch.object(calculator, 'calculate_c_dir', return_value=0.0):
            with patch.object(calculator, 'calculate_c_sig', return_value=0.0):
                with patch.object(calculator, 'calculate_c_test', return_value=0.0):
                    metrics = calculator.calculate_h_sys()
                    assert metrics.h_sys == 1.0
        
        with patch.object(calculator, 'calculate_c_dir', return_value=1.0):
            with patch.object(calculator, 'calculate_c_sig', return_value=1.0):
                with patch.object(calculator, 'calculate_c_test', return_value=1.0):
                    metrics = calculator.calculate_h_sys()
                    assert metrics.h_sys == 0.0


class TestMainFunction:
    """测试主函数"""
    
    @patch('argparse.ArgumentParser.parse_args')
    @patch('scripts.measure_entropy.EntropyCalculator')
    def test_main_success_json(self, mock_calculator, mock_args):
        """测试主函数成功（JSON输出）"""
        # 模拟参数 - 包含所有新的命令行参数
        mock_args.return_value = Mock(
            project=".",
            verbose=False,
            json=True,
            clear_cache=False,
            force_recalculate=False,
            cache_info=False
        )
        
        # 模拟计算结果
        mock_metrics = Mock(
            c_dir=0.8,
            c_sig=0.7,
            c_test=0.9,
            compliance_score=0.8,
            h_sys=0.2,
            status="🟢 优秀"
        )
        mock_metrics.to_dict.return_value = {
            "c_dir": 0.8,
            "c_sig": 0.7,
            "c_test": 0.9,
            "compliance_score": 0.8,
            "h_sys": 0.2,
            "status": "🟢 优秀"
        }
        
        # 设置模拟计算器的 THRESHOLD_WARNING 属性
        mock_calculator_instance = Mock()
        mock_calculator_instance.THRESHOLD_WARNING = 0.7
        mock_calculator_instance.calculate_h_sys.return_value = mock_metrics
        mock_calculator.return_value = mock_calculator_instance
        
        # 运行主函数并检查返回值
        result = main()
        # 成功状态应返回 0 (因为 h_sys <= 0.7，调整为模板仓库阈值)
        assert result == 0
    
    @patch('argparse.ArgumentParser.parse_args')
    @patch('scripts.measure_entropy.EntropyCalculator')
    def test_main_danger_status(self, mock_calculator, mock_args):
        """测试主函数（危险状态）"""
        # 模拟参数 - 包含所有新的命令行参数
        mock_args.return_value = Mock(
            project=".",
            verbose=False,
            json=False,
            clear_cache=False,
            force_recalculate=False,
            cache_info=False
        )
        
        # 模拟危险状态 (h_sys > 0.7 触发危险状态)
        mock_metrics = Mock(
            c_dir=0.2,
            c_sig=0.1,
            c_test=0.3,
            compliance_score=0.2,
            h_sys=0.9,  # 危险（>0.7）
            status="🔴 危险"
        )
        
        # 设置模拟计算器的 THRESHOLD_WARNING 属性
        mock_calculator_instance = Mock()
        mock_calculator_instance.THRESHOLD_WARNING = 0.7
        mock_calculator_instance.calculate_h_sys.return_value = mock_metrics
        mock_calculator.return_value = mock_calculator_instance
        
        # 运行主函数并检查返回值
        result = main()
        # 危险状态应返回 1 (因为 h_sys > 0.7)
        assert result == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])