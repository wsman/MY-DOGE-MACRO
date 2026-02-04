#!/usr/bin/env python3
"""
CDD Feature Scaffold (Legislative Generator) v2.1
=================================================
自动化生成符合 CDD 宪法标准的特性文档结构。

改进内容 (v2.1):
1. 解耦 SKILL_ROOT (模板源) 与 TARGET_ROOT (生成目标)
2. 支持跨项目运行：python /path/to/skill/cdd-feature.py "Name" --target /path/to/project
3. 修正 Git 操作上下文路径

Usage:
    python scripts/cdd-feature.py <feature_name> [description] [--target <path>]
"""

import sys
import os
import re
import argparse
import datetime
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional

# -----------------------------------------------------------------------------
# Configuration & Constants
# -----------------------------------------------------------------------------

VERSION = "v2.1.0"
DEFAULT_ENCODING = "utf-8"

# 1. 确定 SKILL_ROOT (工具自身的安装位置)
# 用于定位模板文件，不随运行位置改变
SKILL_ROOT = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = SKILL_ROOT / "templates" / "04_standards"

# 默认模板映射 (文件名 -> 目标后缀)
TEMPLATE_MAPPING = {
    "DS-050_feature_specification.md": "_spec.md",
    "DS-051_implementation_plan.md": "_plan.md",
    "DS-052_atomic_tasks.md": "_tasks.md",
    "07_feature_readme_template.md": "_README.md",
}

# -----------------------------------------------------------------------------
# Core Classes
# -----------------------------------------------------------------------------

class TemplateEngine:
    """负责从 SKILL_ROOT 加载和渲染 Markdown 模板"""
    
    def __init__(self, templates_dir: Path):
        self.templates_dir = templates_dir
        self.reference_dir = templates_dir.parent.parent / "reference"
        if not self.templates_dir.exists():
            print(f"⚠️ Warning: Templates directory not found at source: {self.templates_dir}")

    def load_template(self, template_name: str) -> str:
        """从工具自身目录加载模板，支持多个位置"""
        # 1. 首先尝试从 templates/04_standards/ 加载
        template_path = self.templates_dir / template_name
        if template_path.exists():
            return template_path.read_text(encoding=DEFAULT_ENCODING)
        
        # 2. 尝试从 reference/ 加载 (用于 07_feature_readme_template.md)
        ref_path = self.reference_dir / template_name
        if ref_path.exists():
            return ref_path.read_text(encoding=DEFAULT_ENCODING)
        
        print(f"⚠️ Template missing: {template_name}, using fallback.")
        return f"# Feature: {{{{ feature_name }}}}\n\n> Auto-generated fallback for {template_name}\n"

    def render(self, content: str, context: Dict[str, Any]) -> str:
        """执行简单的变量替换 {{ var }}"""
        result = content
        for key, value in context.items():
            pattern = r"\{\{\s*" + re.escape(key) + r"\s*\}\}"
            result = re.sub(pattern, str(value), result)
        return result

class ContextBuilder:
    """负责从目标项目中构建上下文元数据"""
    
    def __init__(self, target_root: Path):
        self.target_root = target_root

    def _resolve_path(self, deployed_path: str, source_path: str) -> Path:
        """
        智能路径解析：优先检查 memory_bank (标准部署结构)，回退到 templates (开发模式)
        """
        p1 = self.target_root / deployed_path
        if p1.exists():
            return p1
        return self.target_root / source_path

    def _extract_version(self, file_path: Path) -> str:
        """从目标文件中提取版本号"""
        if not file_path.exists():
            return "unknown"
        
        try:
            content = file_path.read_text(encoding=DEFAULT_ENCODING)
            # 匹配模式: "**版本**: v1.5.0" 或 "Version: 1.5.0"
            match = re.search(r"(?:版本|Version)[^:：]*[:：]\s*(?:v)?(\d+\.\d+\.\d+)", content, re.IGNORECASE)
            if match:
                return match.group(1)
        except Exception:
            pass
        return "unknown"

    def _get_git_info(self) -> Dict[str, str]:
        """获取目标项目的 Git 信息 (指定 cwd)"""
        try:
            author = subprocess.check_output(
                ["git", "config", "user.name"], 
                cwd=self.target_root, 
                text=True, 
                stderr=subprocess.DEVNULL
            ).strip()
        except:
            author = "Unknown Developer"
            
        try:
            branch = subprocess.check_output(
                ["git", "branch", "--show-current"], 
                cwd=self.target_root, 
                text=True, 
                stderr=subprocess.DEVNULL
            ).strip()
        except:
            branch = "unknown-branch"
            
        return {"author": author, "git_branch": branch}

    def build(self, feature_id: str, feature_name: str, description: str) -> Dict[str, Any]:
        """构建完整的上下文合并字典"""
        
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d")
        
        # 1. 定位目标项目的关键文件
        file_map = {
            "project": self.target_root / "README.md",
            "active_context": self._resolve_path(
                "memory_bank/core/active_context.md", 
                "templates/01_core/active_context.md"
            ),
            "system_patterns": self._resolve_path(
                "memory_bank/axioms/system_patterns.md", 
                "templates/02_axioms/system_patterns.md"
            )
        }

        # 2. 提取信息
        versions = {
            "project_version": self._extract_version(file_map["project"]),
            "active_context_version": self._extract_version(file_map["active_context"]),
            "system_patterns_version": self._extract_version(file_map["system_patterns"]),
        }
        
        git_info = self._get_git_info()
        
        # 3. 组合
        context = {
            "FEATURE_ID": feature_id,
            "FEATURE_NAME": feature_name,
            "TIMESTAMP": timestamp,
            "feature_id": feature_id,
            "feature_name": feature_name,
            "feature_description": description,
            "timestamp": timestamp,
            "project_name": self.target_root.name,
            **versions,
            **git_info
        }
        
        return context

# -----------------------------------------------------------------------------
# Utility Functions
# -----------------------------------------------------------------------------

def sanitize_name(name: str) -> str:
    """Convert 'Add User Login' to 'add-user-login'"""
    s = re.sub(r'[^a-zA-Z0-9\u4e00-\u9fa5]+', '-', name)
    s = s.strip('-').lower()
    return s

def get_next_feature_id(specs_dir: Path) -> str:
    """在目标 specs 目录中扫描下一个 ID"""
    if not specs_dir.exists():
        return "001"
    
    max_id = 0
    for item in specs_dir.iterdir():
        if item.is_dir():
            match = re.match(r'^(\d{3})-', item.name)
            if match:
                try:
                    current_id = int(match.group(1))
                    if current_id > max_id:
                        max_id = current_id
                except ValueError:
                    continue
    
    return f"{max_id + 1:03d}"

def create_git_branch(branch_name: str, cwd: Path):
    """在目标目录创建 Git 分支"""
    try:
        # Check if branch exists
        subprocess.run(
            ["git", "rev-parse", "--verify", branch_name], 
            stdout=subprocess.DEVNULL, 
            stderr=subprocess.DEVNULL,
            cwd=cwd,
            check=True
        )
        print(f"ℹ️  Branch '{branch_name}' already exists. Switching to it...")
        subprocess.run(["git", "checkout", branch_name], cwd=cwd, check=True)
    except subprocess.CalledProcessError:
        print(f"🌿 Creating new branch: {branch_name}")
        try:
            subprocess.run(["git", "checkout", "-b", branch_name], cwd=cwd, check=True)
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to create branch: {e}")

# -----------------------------------------------------------------------------
# Main Execution
# -----------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description=f"CDD Feature Scaffold {VERSION}")
    parser.add_argument("name", help="Feature name (e.g. 'user-login')")
    parser.add_argument("description", nargs="?", default="No description provided", help="Feature description")
    parser.add_argument("--target", default=".", help="Target project directory (default: current dir)")
    parser.add_argument("--no-branch", action="store_true", help="Skip git branch creation")
    args = parser.parse_args()

    # 1. 路径解析 (Skill vs Target)
    target_root = Path(args.target).resolve()
    specs_dir = target_root / "specs"

    print(f"🔧 CDD Scaffold v2.1")
    print(f"   Skill Source: {SKILL_ROOT}")
    print(f"   Target Project: {target_root}")

    # 2. 准备输出目录
    if not specs_dir.exists():
        specs_dir.mkdir(parents=True, exist_ok=True)
        print(f"📁 Created specs directory: {specs_dir}")

    clean_name = sanitize_name(args.name)
    feature_id = get_next_feature_id(specs_dir)
    full_feature_name = f"{feature_id}-{clean_name}"
    feature_dir = specs_dir / full_feature_name
    
    print(f"🚀 Initializing Feature: {full_feature_name}")
    print(f"   ID: {feature_id}")

    # 3. 构建上下文 (基于 Target)
    print("🧠 Building context from target...")
    builder = ContextBuilder(target_root)
    context = builder.build(feature_id, clean_name, args.description)
    
    print(f"   Project Version: {context.get('project_version')}")
    print(f"   Core Version:    {context.get('active_context_version')}")

    # 4. 创建特性目录
    if feature_dir.exists():
        print(f"⚠️  Directory already exists: {feature_dir}")
        response = input("   Overwrite? [y/N] ").lower()
        if response != 'y':
            print("❌ Aborted.")
            sys.exit(1)
    else:
        feature_dir.mkdir()

    # 5. 生成文件 (Source Templates -> Target Specs)
    engine = TemplateEngine(TEMPLATES_DIR)
    
    for template_file, suffix in TEMPLATE_MAPPING.items():
        tpl_content = engine.load_template(template_file)
        rendered_content = engine.render(tpl_content, context)
        
        # 特殊处理 feature readme 模板，保持前缀为 "feature"
        if template_file == "07_feature_readme_template.md":
            prefix = "feature"
        else:
            prefix = template_file.split('_')[0]
        
        output_filename = f"{prefix}_{feature_id}{suffix}"
        output_path = feature_dir / output_filename
        
        output_path.write_text(rendered_content, encoding=DEFAULT_ENCODING)
        print(f"   📄 Generated: {output_path.relative_to(target_root)}")

    # 6. Git 操作 (在 Target 中执行)
    if not args.no_branch:
        create_git_branch(full_feature_name, cwd=target_root)

    print(f"\n✅ Feature scaffold ready at: {feature_dir}")

if __name__ == "__main__":
    main()