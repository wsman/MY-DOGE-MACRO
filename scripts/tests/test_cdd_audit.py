#!/usr/bin/env python3
"""
Unit tests for CDD Auditor CLI (cdd_audit.py)
"""

import sys
import json
import pytest
from unittest.mock import MagicMock, patch, mock_open
from scripts.cdd_audit import CDDAuditor, EC_SUCCESS, EC_GATE_1_FAIL, EC_GATE_2_FAIL, EC_GATE_3_FAIL, EC_CLEAN_FAIL, EC_GENERAL_FAIL

# -----------------------------------------------------------------------------
# Fixtures
# -----------------------------------------------------------------------------

@pytest.fixture
def mock_args():
    """Create a mock args object with default values"""
    args = MagicMock()
    args.quiet = False
    args.verbose = False
    args.format = "text"
    args.fix = False
    args.force = False
    args.clean = False
    args.gate = 'all'
    return args

@pytest.fixture
def mock_success_process():
    """Mock a successful subprocess result"""
    process = MagicMock()
    process.returncode = 0
    process.stdout = "OK"
    process.stderr = ""
    return process

@pytest.fixture
def mock_failure_process():
    """Mock a failed subprocess result"""
    process = MagicMock()
    process.returncode = 1
    process.stdout = ""
    process.stderr = "Error occurred"
    return process

# -----------------------------------------------------------------------------
# Core Logic Tests
# -----------------------------------------------------------------------------

class TestCDDAuditor:

    @patch("scripts.cdd_audit.subprocess.run")
    def test_run_gate_success(self, mock_run, mock_args, mock_success_process):
        """Test successful gate execution"""
        mock_run.return_value = mock_success_process
        
        auditor = CDDAuditor(mock_args)
        result = auditor.run_gate(1)
        
        assert result is True
        assert len(auditor.results) == 1
        assert auditor.results[0]["gate"] == 1
        assert auditor.results[0]["name"] == "Version Consistency"
        assert auditor.results[0]["passed"] is True
        assert auditor.failed is False

    @patch("scripts.cdd_audit.subprocess.run")
    def test_run_gate_failure(self, mock_run, mock_args, mock_failure_process):
        """Test failed gate execution"""
        mock_run.return_value = mock_failure_process
        
        auditor = CDDAuditor(mock_args)
        result = auditor.run_gate(2)
        
        assert result is False
        assert len(auditor.results) == 1
        assert auditor.results[0]["gate"] == 2
        assert auditor.results[0]["passed"] is False
        assert auditor.failed is True

    @patch("scripts.cdd_audit.subprocess.run")
    def test_run_gate_with_fix_flag(self, mock_run, mock_args, mock_success_process):
        """Test gate 1 execution with --fix flag"""
        mock_args.fix = True
        mock_args.gate = '1'
        mock_run.return_value = mock_success_process
        
        auditor = CDDAuditor(mock_args)
        auditor.run_gate(1)
        
        # Check that --fix was added to command
        call_args = mock_run.call_args[0][0]
        assert "--fix" in call_args

    @patch("scripts.cdd_audit.subprocess.run")
    def test_json_output_structure(self, mock_run, mock_args, mock_success_process, capsys):
        """Test JSON output format structure"""
        mock_args.format = "json"
        mock_run.return_value = mock_success_process
        
        auditor = CDDAuditor(mock_args)
        auditor.run_gate(1)
        auditor.generate_report()
        
        captured = capsys.readouterr()
        output = json.loads(captured.out)
        
        assert "success" in output
        assert output["success"] is True
        assert output["total_gates"] == 1
        assert output["passed_gates"] == 1
        assert len(output["gate_results"]) == 1
        assert output["gate_results"][0]["gate"] == 1

    @patch("scripts.cdd_audit.subprocess.run")
    def test_text_output_format(self, mock_run, mock_args, mock_success_process, capsys):
        """Test text output format"""
        mock_run.return_value = mock_success_process
        
        auditor = CDDAuditor(mock_args)
        auditor.run_gate(3)
        auditor.generate_report()
        
        captured = capsys.readouterr()
        output = captured.out
        
        assert "CDD AUDIT SUMMARY" in output
        assert "Gate 3" in output
        assert "SYSTEM COMPLIANT" in output

    @patch("scripts.cdd_audit.subprocess.run")
    def test_multiple_gates_execution(self, mock_run, mock_args, mock_success_process):
        """Test execution of multiple gates"""
        mock_run.return_value = mock_success_process
        
        auditor = CDDAuditor(mock_args)
        auditor.run_gate(1)
        auditor.run_gate(2)
        auditor.run_gate(3)
        
        assert len(auditor.results) == 3
        assert all(r["passed"] for r in auditor.results)
        assert auditor.failed is False

    def test_get_exit_code_success(self, mock_args):
        """Test exit code calculation for successful audit"""
        auditor = CDDAuditor(mock_args)
        auditor.results = [
            {"gate": 1, "passed": True},
            {"gate": 2, "passed": True},
            {"gate": 3, "passed": True}
        ]
        
        assert auditor.get_exit_code() == EC_SUCCESS

    def test_get_exit_code_failure(self, mock_args):
        """Test exit code calculation for failed audit"""
        auditor = CDDAuditor(mock_args)
        auditor.results = [
            {"gate": 1, "passed": True},
            {"gate": 2, "passed": False},  # First failure
            {"gate": 3, "passed": False}
        ]
        
        assert auditor.get_exit_code() == EC_GATE_2_FAIL

# -----------------------------------------------------------------------------
# Cleanup Function Tests
# -----------------------------------------------------------------------------

class TestCleanupFunction:
    
    @patch("scripts.cdd_audit.shutil.rmtree")
    @patch("scripts.cdd_audit.input")
    @patch("scripts.cdd_audit.Path.iterdir")
    @patch("scripts.cdd_audit.Path.exists")
    def test_cleanup_interactive_yes(self, mock_exists, mock_iterdir, mock_input, mock_rmtree, mock_args):
        """Test cleanup with interactive confirmation (yes)"""
        mock_exists.return_value = True
        
        # Mock directory structure
        dir1 = MagicMock()
        dir1.name = "001-test-feature"
        dir1.is_dir.return_value = True
        
        dir2 = MagicMock()
        dir2.name = "002-demo"
        dir2.is_dir.return_value = True
        
        dir3 = MagicMock()  # Should be excluded (contains cdd-auditor-cli)
        dir3.name = "004-cdd-auditor-cli"
        dir3.is_dir.return_value = True
        
        mock_iterdir.return_value = [dir1, dir2, dir3]
        mock_input.return_value = "y"
        
        auditor = CDDAuditor(mock_args)
        auditor.run_cleanup()
        
        # Check that only matching directories were deleted
        assert mock_rmtree.call_count == 2
        assert mock_rmtree.call_args_list[0][0][0].name == "001-test-feature"
        assert mock_rmtree.call_args_list[1][0][0].name == "002-demo"

    @patch("scripts.cdd_audit.input")
    @patch("scripts.cdd_audit.Path.iterdir")
    @patch("scripts.cdd_audit.Path.exists")
    def test_cleanup_interactive_no(self, mock_exists, mock_iterdir, mock_input, mock_args):
        """Test cleanup with interactive confirmation (no)"""
        mock_exists.return_value = True
        
        dir1 = MagicMock()
        dir1.name = "001-test"
        dir1.is_dir.return_value = True
        mock_iterdir.return_value = [dir1]
        mock_input.return_value = "n"
        
        auditor = CDDAuditor(mock_args)
        auditor.run_cleanup()
        
        # Should not delete anything
        assert auditor.failed is False

    @patch("scripts.cdd_audit.shutil.rmtree")
    @patch("scripts.cdd_audit.Path.iterdir")
    @patch("scripts.cdd_audit.Path.exists")
    def test_cleanup_force_mode(self, mock_exists, mock_iterdir, mock_rmtree, mock_args):
        """Test cleanup with --force flag (skip confirmation)"""
        mock_args.force = True
        mock_exists.return_value = True
        
        dir1 = MagicMock()
        dir1.name = "003-temp"
        dir1.is_dir.return_value = True
        mock_iterdir.return_value = [dir1]
        
        auditor = CDDAuditor(mock_args)
        auditor.run_cleanup()
        
        # Should delete without asking
        assert mock_rmtree.call_count == 1

    @patch("scripts.cdd_audit.Path.exists")
    def test_cleanup_no_specs_dir(self, mock_exists, mock_args):
        """Test cleanup when specs directory doesn't exist"""
        mock_exists.return_value = False
        
        auditor = CDDAuditor(mock_args)
        auditor.run_cleanup()
        
        # Should exit gracefully
        assert auditor.failed is False

# -----------------------------------------------------------------------------
# Command Line Interface Tests
# -----------------------------------------------------------------------------

class TestCommandLineInterface:
    
    def test_help_output(self):
        """Test that --help option works"""
        import subprocess
        result = subprocess.run(
            [sys.executable, "scripts/cdd_audit.py", "--help"],
            capture_output=True,
            text=True
        )
        assert result.returncode == 0
        assert "usage:" in result.stdout.lower()
        assert "--gate" in result.stdout
        assert "--format" in result.stdout

# -----------------------------------------------------------------------------
# Integration Style Tests (minimal)
# -----------------------------------------------------------------------------

@pytest.mark.integration
def test_actual_gate_1_execution():
    """Integration test: actually run gate 1 (version check)"""
    import subprocess
    result = subprocess.run(
        [sys.executable, "scripts/cdd_audit.py", "--gate", "1", "--quiet"],
        capture_output=True,
        text=True
    )
    # Should not crash; exit code could be 0 or 101 depending on version state
    assert result.returncode in [0, 101]

@pytest.mark.integration
def test_actual_help_command():
    """Integration test: verify help command works"""
    import subprocess
    result = subprocess.run(
        [sys.executable, "scripts/cdd_audit.py", "--help"],
        capture_output=True,
        text=True
    )
    assert result.returncode == 0
    assert "CDD Auditor CLI" in result.stdout

if __name__ == "__main__":
    pytest.main([__file__, "-v"])