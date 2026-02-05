#!/usr/bin/env python3
"""
CDD Spore Deployer (v2.0)
=========================
"Seed to Sprout" Deployment Protocol.
Initializes the memory_bank structure for AI cognitive expansion.
"""

import os
import sys
import shutil
import argparse
import datetime
from pathlib import Path

# 核心模板映射 (Source in Skill -> Target in Memory Bank)
CORE_TEMPLATES = {
    "reference/06_project_readme_template.md": "core/project_readme_template.md",
    "templates/01_core/active_context.md": "core/active_context.md",
    "templates/01_core/knowledge_graph.md": "core/knowledge_graph.md",
    "templates/01_core/basic_law_index.md": "core/basic_law_index.md",
    "templates/01_core/procedural_law_index.md": "core/procedural_law_index.md",
    "templates/01_core/technical_law_index.md": "core/technical_law_index.md"
}

AXIOMS_TEMPLATES = {
    "templates/02_axioms/behavior_context.md": "axioms/behavior_context.md",
    "templates/02_axioms/system_patterns.md": "axioms/system_patterns.md",
    "templates/02_axioms/tech_context.md": "axioms/tech_context.md"
}

# 协议和工作流模板
PROTOCOL_TEMPLATES = {
    "templates/03_protocols/WF-001_clarify_workflow.md": "protocols/WF-001_clarify_workflow.md",
    "templates/03_protocols/WF-201_cdd_workflow.md": "protocols/WF-201_cdd_workflow.md",
    "templates/03_protocols/WF-amend.md": "protocols/WF-amend.md",
    "templates/03_protocols/WF-analyze.md": "protocols/WF-analyze.md",
    "templates/03_protocols/WF-review.md": "protocols/WF-review.md",
    "templates/03_protocols/WF-sync-issues.md": "protocols/WF-sync-issues.md"
}

# DS 标准模板
STANDARDS_TEMPLATES = {
    "templates/04_standards/DS-007_context_management.md": "standards/DS-007_context_management.md",
    "templates/04_standards/DS-050_feature_specification.md": "standards/DS-050_feature_specification.md",
    "templates/04_standards/DS-051_implementation_plan.md": "standards/DS-051_implementation_plan.md",
    "templates/04_standards/DS-052_atomic_tasks.md": "standards/DS-052_atomic_tasks.md",
    "templates/04_standards/DS-053_quality_checklist.md": "standards/DS-053_quality_checklist.md",
    "templates/04_standards/DS-054_environment_hardening.md": "standards/DS-054_environment_hardening.md",
    "templates/04_standards/DS-060_code_review.md": "standards/DS-060_code_review.md",
    "reference/07_feature_readme_template.md": "standards/feature_readme_template.md"
}

# 配置文件和工具链
CONFIG_FILES = {
    "templates/cdd_config.yaml": "cdd_config.yaml"
}

TOOL_FILES = {
    "scripts": "scripts",
    "Makefile": "Makefile",
    "pytest.ini": "pytest.ini",
    ".gitignore": ".gitignore"
}

def replace_placeholders(content: str, project_name: str, timestamp: str) -> str:
    """替换模板中的占位符"""
    content = content.replace("{{PROJECT_NAME}}", project_name)
    content = content.replace("{{TIMESTAMP}}", timestamp)
    # 其他可能的占位符
    content = content.replace("[项目名称]", project_name)
    content = content.replace("[YYYY-MM-DD]", timestamp)
    return content

def deploy(target_dir: Path, project_name: str, force: bool = False):
    """部署 CDD Memory Bank 结构到目标目录"""
    # 获取 CDD 技能库根目录 (脚本所在位置的父目录)
    script_dir = Path(__file__).resolve().parent
    skill_root = script_dir.parent
    target_dir = target_dir.resolve()
    memory_bank = target_dir / "memory_bank"
    
    print(f"🌱 CDD Spore Landing on: {target_dir}")
    print(f"   Project: {project_name}")
    print(f"   CDD Skill Root: {skill_root}")

    # 1. 创建 Memory Bank 土壤 (目录结构)
    print("\n🛖 Creating Memory Bank soil...")
    for subdir in ["core", "axioms", "protocols", "standards"]:
        (memory_bank / subdir).mkdir(parents=True, exist_ok=True)
    print("✅ Created Memory Bank structure (core/, axioms/, protocols/, standards/)")

    # 2. 植入核心 DNA (种子模板)
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d")
    
    print("\n🧬 Injecting Core DNA (Seed Templates)...")
    template_groups = [
        ("Core Templates", CORE_TEMPLATES),
        ("Axioms Templates", AXIOMS_TEMPLATES),
        ("Protocol Templates", PROTOCOL_TEMPLATES),
        ("Standards Templates", STANDARDS_TEMPLATES),
    ]
    
    for group_name, templates in template_groups:
        print(f"  {group_name}:")
        for src_rel, dst_rel in templates.items():
            src = skill_root / src_rel
            dst = memory_bank / dst_rel
            
            if not src.exists():
                print(f"    ⚠️  Missing: {src_rel}")
                continue
                
            if dst.exists() and not force:
                print(f"    ⏭️  Skipped (exists): {dst_rel}")
                continue
            
            try:
                # 复制并替换占位符
                content = src.read_text(encoding='utf-8')
                content = replace_placeholders(content, project_name, timestamp)
                dst.parent.mkdir(parents=True, exist_ok=True)
                dst.write_text(content, encoding='utf-8')
                print(f"    ✅ Planted: {dst_rel}")
            except Exception as e:
                print(f"    ❌ Failed: {dst_rel} - {e}")

    # 3. 部署配置文件和工具链
    print("\n🛠️ Deploying Configuration & Toolchain...")
    
    # 配置文件
    for src_rel, dst_name in CONFIG_FILES.items():
        src = skill_root / src_rel
        dst = target_dir / dst_name
        
        if src.exists():
            if not dst.exists() or force:
                shutil.copy2(src, dst)
                print(f"  ✅ Config: {dst_name}")
        else:
            print(f"  ⚠️  Missing config: {src_rel}")
    
    # 工具链文件
    for src_name, dst_name in TOOL_FILES.items():
        src = skill_root / src_name
        dst = target_dir / dst_name
        
        if not src.exists():
            print(f"  ⚠️  Missing tool: {src_name}")
            continue
            
        if src.is_dir():
            if dst.exists() and force:
                shutil.rmtree(dst)
            if not dst.exists():
                # 复制脚本目录，排除缓存文件
                shutil.copytree(src, dst, ignore=shutil.ignore_patterns(
                    "__pycache__", "*.pyc", "*.pyo", ".DS_Store"
                ))
                print(f"  📁 Tool Dir: {dst_name}")
        else:
            if not dst.exists() or force:
                shutil.copy2(src, dst)
                print(f"  📄 Tool File: {dst_name}")

    # 4. 创建标准项目目录结构
    print("\n📁 Creating standard project directories...")
    for d in ["src", "tests", "specs"]:
        (target_dir / d).mkdir(exist_ok=True)
        print(f"  📂 Created: {d}/")

    # 5. 输出生长协议指南
    print("\n" + "="*60)
    print("🌿 CDD Spore Successfully Deployed!")
    print("="*60)
    print("\n🌱 **Growth Protocol (种子→生根→发芽):**")
    print("")
    print("1. **SEEDING (已完成)**")
    print("   - Memory Bank structure initialized")
    print("   - Core DNA templates planted")
    print("   - Toolchain deployed")
    print("")
    print("2. **ROOTING (下一步 - AI Agent 执行)**")
    print("   - Read project seed (code/text requirements)")
    print("   - Fill `memory_bank/core/project_readme_template.md`")
    print("   - Rename to `project_readme.md` after completion")
    print("")
    print("3. **SPROUTING (自动派生)**")
    print("   - Based on the README, derive 5-dimensional truth:")
    print("     - `active_context.md` (current focus)")
    print("     - `knowledge_graph.md` (concept relationships)")
    print("     - `basic_law_index.md` (core axioms)")
    print("     - `procedural_law_index.md` (workflows)")
    print("     - `technical_law_index.md` (tech constraints)")
    print("")
    print("📋 **Next Steps for AI Agent:**")
    print(f"   cd {target_dir}")
    print("   # 1. Analyze project context")
    print("   # 2. Fill memory_bank/core/project_readme_template.md")
    print("   # 3. Execute growth protocol")
    print("")
    print("🔧 **Available Commands:**")
    print("   make audit           # Run constitutional audit")
    print("   python scripts/cdd_audit.py --format json --ai-hint")
    print("="*60)

def main():
    parser = argparse.ArgumentParser(
        description="CDD Spore Deployer - Initialize Memory Bank structure for AI cognitive expansion",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Example:
  python scripts/deploy_cdd.py "My Awesome Project"
  python scripts/deploy_cdd.py "My Project" --target /path/to/project
  python scripts/deploy_cdd.py "My Project" --force  # Overwrite existing files
        """
    )
    parser.add_argument(
        "name",
        help="Project name (used for placeholder replacement)"
    )
    parser.add_argument(
        "--target",
        default=".",
        help="Target directory (default: current directory)"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing files and directories"
    )
    
    args = parser.parse_args()
    
    try:
        deploy(Path(args.target), args.name, args.force)
    except KeyboardInterrupt:
        print("\n❌ Deployment interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Deployment failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()