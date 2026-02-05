#!/usr/bin/env python3
"""
MY-DOGE-MACRO API 服务器启动脚本
使用 Python -m 模式启动，解决相对导入问题
"""

import sys
import os
import subprocess
import argparse
import signal
import time
import psutil

def main():
    """启动 API 服务器"""
    parser = argparse.ArgumentParser(description="MY-DOGE Quant API Server")
    parser.add_argument("--port", type=int, default=8765, help="服务端口")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="绑定地址 (0.0.0.0 for LAN access)")
    parser.add_argument("--token", type=str, default="mydoge-token-123456", help="认证令牌")
    parser.add_argument("--parent-pid", type=int, default=None, help="父进程PID（可选）")
    parser.add_argument("--debug", action="store_true", help="启用调试模式")
    
    args = parser.parse_args()
    
    # 构建启动命令
    cmd = [
        sys.executable, "-m", "apps.api.main",
        "--port", str(args.port),
        "--host", args.host,
        "--token", args.token,
    ]
    
    if args.parent_pid:
        cmd.extend(["--parent-pid", str(args.parent_pid)])
    
    print(f"*** Starting MY-DOGE Quant API on {args.host}:{args.port}")
    print(f"*** Authentication token: {args.token[:8]}...")
    print(f"*** LAN Access URL: http://{args.host}:{args.port}")
    print(f"*** Command: {' '.join(cmd)}")
    
    # 设置环境变量
    env = os.environ.copy()
    env["MYDOGE_API_TOKEN"] = args.token
    
    if args.debug:
        env["LOG_LEVEL"] = "debug"
        print("*** Debug mode enabled")
    
    # 启动服务器进程
    process = subprocess.Popen(
        cmd,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        universal_newlines=True
    )
    
    # 输出进程信息
    print(f"*** Server started with PID: {process.pid}")
    
    # 监控输出并打印到控制台
    try:
        for line in process.stdout:
            print(f"[API Server] {line}", end='')
            
            # 检查进程是否结束
            if process.poll() is not None:
                break
                
    except KeyboardInterrupt:
        print("\n*** Received interrupt signal, shutting down...")
        process.terminate()
        try:
            process.wait(timeout=5)
            print("*** Server stopped gracefully")
        except subprocess.TimeoutExpired:
            process.kill()
            print("*** Server force killed")
    
    except Exception as e:
        print(f"*** Error running server: {e}")
        process.terminate()
        process.wait()
    
    # 等待进程结束
    return process.wait()

if __name__ == "__main__":
    sys.exit(main())
