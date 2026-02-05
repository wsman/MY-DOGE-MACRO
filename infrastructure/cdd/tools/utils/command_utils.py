"""
通用 Shell 命令执行工具
"""
import subprocess
from typing import Tuple, List, Union
from pathlib import Path

def run_command(cmd: List[str], cwd: Union[str, Path] = ".", timeout: int = 30) -> Tuple[str, str, int]:
    """安全执行shell命令"""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=str(cwd)
        )
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except subprocess.TimeoutExpired:
        return "", "Command timed out", 1
    except Exception as e:
        return "", str(e), 1