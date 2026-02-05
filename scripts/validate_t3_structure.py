#!/usr/bin/env python3
"""
T3 Documentation Structure Validator
验证 memory_bank/t3_documentation/ 目录保持扁平结构（根据宪法要求）
"""

import os
import sys
from pathlib import Path

def validate_t3_structure():
    """验证 t3_documentation 目录结构是否符合扁平化要求"""
    
    t3_path = Path("memory_bank/t3_documentation")
    
    if not t3_path.exists():
        print(f"❌ T3 文档目录不存在: {t3_path}")
        return False
    
    print(f"🔍 验证 T3 文档结构: {t3_path}")
    
    # 检查是否有子目录
    subdirs = []
    for item in t3_path.iterdir():
        if item.is_dir():
            subdirs.append(item.name)
    
    if subdirs:
        print(f"❌ 发现违规子目录:")
        for subdir in subdirs:
            print(f"   - {subdir}")
        print("\n📋 宪法要求: t3_documentation 目录应保持扁平结构")
        print("   根据 §152 Single Source of Truth, memory_bank 是执行规范的单一路径")
        return False
    
    # 检查关键文件是否存在
    required_files = [
        "index.md",
        "api-reference.md",
        "backend-api.md",
        "deployment.md",
        "getting-started.md",
        "indicators.md",
        "modular-architecture.md",
        "overview.md",
        "quickstart.md",
        "document-template.md"
    ]
    
    missing_files = []
    for file in required_files:
        if not (t3_path / file).exists():
            missing_files.append(file)
    
    if missing_files:
        print(f"⚠️  缺少一些关键文档:")
        for file in missing_files:
            print(f"   - {file}")
    
    # 列出当前所有文件
    files = [item.name for item in t3_path.iterdir() if item.is_file()]
    
    print(f"\n📁 T3 文档目录当前内容 ({len(files)} 个文件):")
    for file in sorted(files):
        print(f"   📄 {file}")
    
    if not subdirs:
        print(f"\n✅ T3 文档结构验证通过: 目录保持扁平，无子目录")
        return True
    
    return False

def check_references():
    """检查项目中是否有对旧路径 (t3_documentation/api/) 的引用"""
    
    print(f"\n🔍 检查对旧路径的引用...")
    
    # 检查关键文件中的引用
    files_to_check = [
        "memory_bank/core/knowledge_graph.md",
        "memory_bank/core/active_context.md",
        "memory_bank/t3_documentation/index.md",
        "memory_bank/t3_documentation/quickstart.md"
    ]
    
    old_patterns = [
        "t3_documentation/api/",
        "../api/",
        "api/api-reference.md",
        "api/indicators.md"
    ]
    
    found_issues = []
    
    for file_path in files_to_check:
        path = Path(file_path)
        if not path.exists():
            continue
        
        try:
            content = path.read_text(encoding='utf-8')
            for pattern in old_patterns:
                if pattern in content:
                    found_issues.append(f"{file_path}: 包含 '{pattern}'")
        except Exception as e:
            print(f"⚠️  无法读取 {file_path}: {e}")
    
    if found_issues:
        print("❌ 发现对旧路径的引用:")
        for issue in found_issues:
            print(f"   - {issue}")
        return False
    
    print("✅ 未发现对旧路径的引用")
    return True

def main():
    """主函数"""
    
    print("=" * 60)
    print("T3 文档结构验证工具")
    print("=" * 60)
    
    # 切换到项目根目录
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    os.chdir(project_root)
    
    print(f"📁 项目根目录: {project_root}")
    
    # 验证结构
    structure_ok = validate_t3_structure()
    
    # 检查引用
    references_ok = check_references()
    
    print("\n" + "=" * 60)
    
    if structure_ok and references_ok:
        print("🎉 所有验证通过!")
        print("   t3_documentation 目录符合宪法扁平结构要求")
        return 0
    else:
        print("⚠️  验证发现一些问题:")
        if not structure_ok:
            print("   - 目录结构违规: 存在子目录")
        if not references_ok:
            print("   - 存在对旧路径的引用")
        print("\n💡 修复建议:")
        print("   1. 确保所有 T3 文档都在 memory_bank/t3_documentation/ 根目录下")
        print("   2. 删除任何子目录 (如 api/, deployment/, architecture/)")
        print("   3. 更新所有文档中的链接为相对路径")
        print("   4. 运行此脚本再次验证")
        return 1

if __name__ == "__main__":
    sys.exit(main())