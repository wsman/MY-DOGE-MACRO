#!/usr/bin/env python3
"""
安装共享库脚本 - 安装所有统一的共享组件

宪法依据：§152单一真理源公理 - 确保所有组件统一安装和管理
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(cmd, description):
    """运行命令并输出状态"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"  ✅ {description} 完成")
        return True
    except subprocess.CalledProcessError as e:
        print(f"  ❌ {description} 失败: {e}")
        print(f"  错误输出: {e.stderr}")
        return False
    except Exception as e:
        print(f"  ❌ {description} 发生异常: {e}")
        return False

def install_config_manager():
    """安装配置管理器"""
    lib_path = Path("libs/config-manager")
    if not lib_path.exists():
        print(f"  ❌ 配置管理器路径不存在: {lib_path}")
        return False
    
    return run_command(f"cd {lib_path} && pip install -e .", "安装配置管理器")

def install_websocket_hub():
    """安装WebSocket中心"""
    lib_path = Path("libs/websocket-hub")
    if not lib_path.exists():
        print(f"  ❌ WebSocket中心路径不存在: {lib_path}")
        return False
    
    return run_command(f"cd {lib_path} && pip install -e .", "安装WebSocket中心")

def install_vector_store():
    """安装向量存储"""
    lib_path = Path("libs/vector-store")
    if not lib_path.exists():
        print(f"  ❌ 向量存储路径不存在: {lib_path}")
        return False
    
    return run_command(f"cd {lib_path} && pip install -e .", "安装向量存储")

def install_ai_adapters():
    """安装AI适配器"""
    lib_path = Path("libs/ai-adapters")
    if not lib_path.exists():
        print(f"  ❌ AI适配器路径不存在: {lib_path}")
        return False
    
    return run_command(f"cd {lib_path} && pip install -e .", "安装AI适配器")

def install_shared_cache():
    """安装共享缓存"""
    lib_path = Path("libs/cache")
    if not lib_path.exists():
        print(f"  ❌ 共享缓存路径不存在: {lib_path}")
        return False
    
    return run_command(f"cd {lib_path} && pip install -e .", "安装共享缓存")

def install_shared_logger():
    """安装共享日志器"""
    lib_path = Path("libs/logger")
    if not lib_path.exists():
        print(f"  ❌ 共享日志器路径不存在: {lib_path}")
        return False
    
    return run_command(f"cd {lib_path} && pip install -e .", "安装共享日志器")

def update_api_dependencies():
    """更新API依赖"""
    print("📦 更新API依赖...")
    
    # 先安装基础依赖
    if not run_command("pip install --upgrade pip setuptools wheel", "更新包管理器"):
        return False
    
    # 安装API的所有依赖（包括开发依赖）
    api_requirements = Path("apps/api/requirements.txt")
    if api_requirements.exists():
        return run_command(f"pip install -r {api_requirements}", "安装API依赖")
    else:
        print(f"  ⚠️ API依赖文件不存在: {api_requirements}")
        return True

def verify_installation():
    """验证安装结果"""
    print("🔍 验证安装结果...")
    
    test_imports = {
        "config_manager": "from config_manager import ConfigLoader",
        "websocket_hub": "from websocket_hub import WebSocketHub",
        "vector_store": "from vector_store import MemoryStore",
        "ai_adapters": "from ai_adapters import create_llm_adapter",
        "shared_cache": "from shared_cache import Cache",
        "shared_logger": "from shared_logger import get_logger"
    }
    
    successful = 0
    total = len(test_imports)
    
    for module, import_stmt in test_imports.items():
        try:
            # 创建一个临时Python脚本来测试导入
            test_script = f"""
import sys
try:
    {import_stmt}
    print("SUCCESS:{module}")
except ImportError as e:
    print(f"FAILED:{module}:{{e}}")
    sys.exit(1)
except Exception as e:
    print(f"WARNING:{module}:{{e}}")
"""
            
            result = subprocess.run(
                [sys.executable, "-c", test_script],
                capture_output=True,
                text=True,
                check=False
            )
            
            if "SUCCESS" in result.stdout:
                print(f"  ✅ {module} 导入成功")
                successful += 1
            else:
                print(f"  ❌ {module} 导入失败")
                if result.stderr:
                    print(f"    错误: {result.stderr}")
        
        except Exception as e:
            print(f"  ❌ {module} 测试异常: {e}")
    
    print(f"\n📊 安装验证: {successful}/{total} 个组件安装成功")
    
    if successful == total:
        print("✨ 所有共享组件安装成功！")
        return True
    elif successful >= total * 0.7:
        print("⚠️ 大部分组件安装成功，部分组件可能存在问题")
        return True
    else:
        print("❌ 安装验证失败，多数组件未正确安装")
        return False

def main():
    """主安装函数"""
    print("🚀 开始安装MY-DOGE-MACRO共享组件")
    print("=" * 50)
    
    # 检查Python版本
    print(f"🐍 Python版本: {sys.version}")
    
    # 安装共享库
    results = []
    
    results.append(("配置管理器", install_config_manager()))
    results.append(("WebSocket中心", install_websocket_hub()))
    results.append(("向量存储", install_vector_store()))
    results.append(("AI适配器", install_ai_adapters()))
    results.append(("共享缓存", install_shared_cache()))
    results.append(("共享日志器", install_shared_logger()))
    results.append(("API依赖", update_api_dependencies()))
    
    print("\n" + "=" * 50)
    print("📋 安装结果总结:")
    
    passed = 0
    total = len(results)
    
    for lib_name, result in results:
        status = "✅ 成功" if result else "❌ 失败"
        print(f"  {lib_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 总体安装: {passed}/{total} 成功")
    
    # 验证安装
    print("\n" + "=" * 50)
    if passed >= total * 0.7:  # 至少70%成功
        verification = verify_installation()
        if verification:
            print("\n✨ 安装完成！共享组件已成功集成到系统。")
            print("\n📚 使用说明:")
            print("  1. 系统现在使用统一的配置管理器")
            print("  2. WebSocket使用websocket_hub库")
            print("  3. 缓存使用shared_cache库")
            print("  4. 日志使用shared_logger库")
            print("  5. AI适配器支持多模型")
            print("\n宪法依据：§152单一真理源公理 - 实现组件统一")
            return True
        else:
            print("\n⚠️ 安装基本完成，但验证过程中发现问题")
            return False
    else:
        print("❌ 安装失败，太多组件未成功安装")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)