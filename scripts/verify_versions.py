#!/usr/bin/env python3
"""
CDD Version Consistency Checker
检查 CDD 项目中文档版本一致性

v1.7.0 - 工程化与稳健性

用法:
    python scripts/verify_versions.py [--fix] [--verbose]

功能:
1. 扫描关键文档中的版本号
2. 检查版本一致性
3. 可选的自动修复功能
"""

import os
import re
import sys
import argparse
from pathlib import Path
from typing import Dict, List, Tuple, Optional

# 关键文件及其版本模式
VERSION_FILES = {
    "README.md": {
        "patterns": [
            r"^\*\*Version\*\*:\s*([0-9]+\.[0-9]+\.[0-9]+)",
            r"^#\s+Constitution-Driven Development Skill \(CDD\)\s+v([0-9]+\.[0-9]+\.[0-9]+)",
        ],
        "description": "项目总览文档"
    },
    "SKILL.md": {
        "patterns": [
            r"^version:\s*v?([0-9]+\.[0-9]+\.[0-9]+)",
            r"^\*\*版本\*\*:\s*v?([0-9]+\.[0-9]+\.[0-9]+)\s*\([^)]+\)",
        ],
        "description": "技能主文档"
    },
    "templates/cdd_config.yaml": {
        "patterns": [
            r"^#\s+CDD Configuration v([0-9]+\.[0-9]+\.[0-9]+)",
        ],
        "description": "配置文件"
    },
    "templates/01_core/active_context.md": {
        "patterns": [
            r"^\*\*版本\*\*:\s*v?([0-9]+\.[0-9]+\.[0-9]+)",
        ],
        "description": "T0活跃上下文模板"
    },
    "templates/02_axioms/system_patterns.md": {
        "patterns": [
            r"^\*\*版本\*\*:\s*v?([0-9]+\.[0-9]+\.[0-9]+)",
        ],
        "description": "T1系统模式模板"
    }
}

class VersionChecker:
    """版本一致性检查器"""
    
    def __init__(self, project_root: str = ".", verbose: bool = False):
        self.project_root = Path(project_root)
        self.verbose = verbose
        self.results = {}
        self.issues = []
        
    def log(self, msg: str):
        if self.verbose:
            print(f"[版本检查] {msg}")
    
    def extract_version(self, filepath: Path, patterns: List[str]) -> Optional[str]:
        """从文件中提取版本号"""
        if not filepath.exists():
            self.log(f"文件不存在: {filepath}")
            return None
        
        try:
            content = filepath.read_text(encoding='utf-8')
            
            for pattern in patterns:
                match = re.search(pattern, content, re.MULTILINE)
                if match:
                    version = match.group(1)
                    # 清理版本号，确保格式统一
                    version = version.strip()
                    if version.startswith('v'):
                        version = version[1:]
                    return version
            
            # 如果没有匹配到任何模式，尝试更宽松的搜索
            all_version_matches = re.findall(r'v?([0-9]+\.[0-9]+\.[0-9]+)', content)
            if all_version_matches:
                # 返回第一个找到的版本号
                return all_version_matches[0]
                
            return None
            
        except Exception as e:
            self.log(f"读取文件 {filepath} 失败: {e}")
            return None
    
    def check_all_files(self) -> Dict[str, Optional[str]]:
        """检查所有文件的版本号"""
        self.log("开始版本一致性检查...")
        
        versions = {}
        
        for filename, config in VERSION_FILES.items():
            filepath = self.project_root / filename
            version = self.extract_version(filepath, config["patterns"])
            versions[filename] = version
            
            if version:
                self.log(f"{filename}: v{version} ({config['description']})")
            else:
                self.log(f"{filename}: 未找到版本号 ({config['description']})")
                self.issues.append(f"❌ {filename}: 未找到版本号")
        
        return versions
    
    def analyze_consistency(self, versions: Dict[str, Optional[str]]) -> Tuple[bool, str]:
        """分析版本一致性"""
        # 过滤掉没有版本号的文件
        valid_versions = {k: v for k, v in versions.items() if v}
        
        if not valid_versions:
            return False, "未在任何文件中找到版本号"
        
        # 获取所有唯一的版本号
        unique_versions = set(valid_versions.values())
        
        if len(unique_versions) == 1:
            version = list(unique_versions)[0]
            return True, f"✅ 所有文件版本一致: v{version}"
        else:
            # 找出最常出现的版本（众数）
            version_counts = {}
            for v in valid_versions.values():
                version_counts[v] = version_counts.get(v, 0) + 1
            
            dominant_version = max(version_counts.items(), key=lambda x: x[1])[0]
            
            # 构建不一致报告
            report_lines = [f"❌ 版本不一致: 找到 {len(unique_versions)} 个不同版本"]
            for version, count in version_counts.items():
                report_lines.append(f"  v{version}: {count} 个文件")
            
            # 列出不一致的文件
            report_lines.append("\n不一致的文件:")
            for filename, version in valid_versions.items():
                if version != dominant_version:
                    report_lines.append(f"  {filename}: v{version}")
            
            report_lines.append(f"\n建议统一使用: v{dominant_version}")
            return False, "\n".join(report_lines)
    
    def fix_versions(self, target_version: str) -> bool:
        """将关键文件的版本号修复为指定版本"""
        self.log(f"开始修复版本号为: v{target_version}")
        
        # 确保版本号格式正确
        if not re.match(r'^[0-9]+\.[0-9]+\.[0-9]+$', target_version):
            print(f"❌ 版本号格式错误: {target_version}")
            print("  请使用语义化版本号格式: MAJOR.MINOR.PATCH")
            return False
        
        fixes_applied = 0
        
        # 修复README.md
        readme_path = self.project_root / "README.md"
        if readme_path.exists():
            try:
                content = readme_path.read_text(encoding='utf-8')
                
                # 修复顶部的版本号
                content = re.sub(
                    r'^\*\*Version\*\*:\s*[0-9]+\.[0-9]+\.[0-9]+',
                    f'**Version**: {target_version}',
                    content,
                    flags=re.MULTILINE
                )
                
                # 修复标题中的版本号
                content = re.sub(
                    r'^# Constitution-Driven Development Skill \(CDD\)\s+v[0-9]+\.[0-9]+\.[0-9]+',
                    f'# Constitution-Driven Development Skill (CDD) v{target_version}',
                    content,
                    flags=re.MULTILINE
                )
                
                readme_path.write_text(content, encoding='utf-8')
                self.log(f"已修复 README.md -> v{target_version}")
                fixes_applied += 1
                
            except Exception as e:
                self.log(f"修复 README.md 失败: {e}")
        
        # 修复SKILL.md
        skill_path = self.project_root / "SKILL.md"
        if skill_path.exists():
            try:
                content = skill_path.read_text(encoding='utf-8')
                
                # 修复YAML头部的版本号
                content = re.sub(
                    r'^version:\s*v?[0-9]+\.[0-9]+\.[0-9]+',
                    f'version: v{target_version}',
                    content,
                    flags=re.MULTILINE
                )
                
                # 修复标题中的版本号
                content = re.sub(
                    r'^\*\*版本\*\*:\s*v?[0-9]+\.[0-9]+\.[0-9]+\s*\([^)]+\)',
                    f'**版本**: v{target_version} (Ecosystem & Automation)',
                    content,
                    flags=re.MULTILINE
                )
                
                skill_path.write_text(content, encoding='utf-8')
                self.log(f"已修复 SKILL.md -> v{target_version}")
                fixes_applied += 1
                
            except Exception as e:
                self.log(f"修复 SKILL.md 失败: {e}")
        
        # 修复配置文件
        config_path = self.project_root / "templates/cdd_config.yaml"
        if config_path.exists():
            try:
                content = config_path.read_text(encoding='utf-8')
                
                # 修复配置文件的版本注释
                content = re.sub(
                    r'^# CDD Configuration v[0-9]+\.[0-9]+\.[0-9]+',
                    f'# CDD Configuration v{target_version}',
                    content,
                    flags=re.MULTILINE
                )
                
                config_path.write_text(content, encoding='utf-8')
                self.log(f"已修复 templates/cdd_config.yaml -> v{target_version}")
                fixes_applied += 1
                
            except Exception as e:
                self.log(f"修复 templates/cdd_config.yaml 失败: {e}")
        
        return fixes_applied > 0
    
    def run(self, fix: bool = False, target_version: Optional[str] = None) -> bool:
        """运行版本检查"""
        print("🔍 CDD 版本一致性检查")
        print("=" * 50)
        
        # 检查所有文件
        versions = self.check_all_files()
        
        # 分析一致性
        is_consistent, consistency_report = self.analyze_consistency(versions)
        
        print("\n📊 版本检查结果:")
        print(consistency_report)
        
        if self.issues:
            print("\n⚠️  发现的问题:")
            for issue in self.issues:
                print(f"  {issue}")
        
        print("\n" + "=" * 50)
        
        if is_consistent:
            print("✅ 所有文件版本一致！")
            return True
        else:
            if fix:
                print("\n🛠️  正在尝试自动修复...")
                
                # 确定目标版本
                if target_version:
                    # 使用用户指定的目标版本
                    print(f"使用指定版本: v{target_version}")
                    final_target_version = target_version
                else:
                    # 使用最常出现的版本作为目标
                    version_counts = {}
                    for v in versions.values():
                        if v:
                            version_counts[v] = version_counts.get(v, 0) + 1
                    
                    if version_counts:
                        final_target_version = max(version_counts.items(), key=lambda x: x[1])[0]
                        print(f"自动检测到常用版本: v{final_target_version}")
                    else:
                        print("❌ 无法确定目标版本号")
                        return False
                
                if self.fix_versions(final_target_version):
                    print(f"✅ 已修复版本号为: v{final_target_version}")
                    
                    # 重新检查
                    print("\n🔍 修复后重新检查...")
                    versions = self.check_all_files()
                    is_consistent, consistency_report = self.analyze_consistency(versions)
                    print(consistency_report)
                    return is_consistent
                else:
                    print("❌ 自动修复失败")
                    return False
            else:
                print("💡 提示: 使用 --fix 参数尝试自动修复版本不一致问题")
                return False

def main():
    parser = argparse.ArgumentParser(
        description="CDD 版本一致性检查工具 (v1.7.0)"
    )
    parser.add_argument(
        "--fix",
        action="store_true",
        help="自动修复版本不一致问题"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="显示详细输出"
    )
    parser.add_argument(
        "--project", "-p",
        default=".",
        help="项目根目录路径 (默认: 当前目录)"
    )
    parser.add_argument(
        "--target-version",
        help="指定目标版本号 (格式: X.Y.Z)，用于 --fix 模式"
    )
    
    args = parser.parse_args()
    
    checker = VersionChecker(args.project, args.verbose)
    success = checker.run(args.fix, args.target_version)
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()