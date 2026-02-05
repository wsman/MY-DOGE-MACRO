#!/usr/bin/env python3
"""
CDD Auditor CLI (cdd_audit.py)
==============================
Unified interface for Constitution-Driven Development compliance checking.
Implements Gate 1-3 verification, auto-fixing, and workspace cleaning.

Usage:
    python scripts/cdd_audit.py [OPTIONS]
"""

import sys
import os
import argparse
import subprocess
import json
import re
import shutil
import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

# -----------------------------------------------------------------------------
# Constants & Configuration
# -----------------------------------------------------------------------------

VERSION = "1.0.0"
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Error Codes
EC_SUCCESS = 0
EC_GATE_1_FAIL = 101  # Version Mismatch
EC_GATE_2_FAIL = 102  # Tests Failed
EC_GATE_3_FAIL = 103  # Entropy High
EC_CLEAN_FAIL = 104
EC_GENERAL_FAIL = 1

# Gate Configurations
GATES = {
    1: {"name": "Version Consistency", "script": "scripts/verify_versions.py", "code": EC_GATE_1_FAIL},
    2: {"name": "Behavior Verification", "module": "pytest", "code": EC_GATE_2_FAIL},
    3: {"name": "Entropy Monitoring", "script": "scripts/measure_entropy.py", "code": EC_GATE_3_FAIL},
}

# -----------------------------------------------------------------------------
# Core Logic
# -----------------------------------------------------------------------------

class CDDAuditor:
    def __init__(self, args: argparse.Namespace):
        self.args = args
        self.results: List[Dict[str, Any]] = []
        self.failed = False
        self.output_buffer: List[str] = []

    def log(self, message: str, level: str = "INFO"):
        """Centralized logging handler"""
        if self.args.quiet and level == "INFO":
            return
        
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        formatted_msg = f"[{timestamp}] {message}"
        
        if self.args.format == "json":
            # In JSON mode, buffer output instead of printing (unless verbose/error)
            self.output_buffer.append(formatted_msg)
            if level == "ERROR" or self.args.verbose:
                print(formatted_msg, file=sys.stderr)
        else:
            print(formatted_msg)

    def _run_command(self, cmd: List[str], capture: bool = False) -> subprocess.CompletedProcess:
        """Execute subprocess commands"""
        kwargs = {
            "cwd": PROJECT_ROOT,
            "text": True,
            "encoding": "utf-8"
        }
        
        if capture or self.args.format == "json" or self.args.quiet:
            kwargs["capture_output"] = True
        else:
            # Text mode: stream directly to stdout
            kwargs["stdout"] = None
            kwargs["stderr"] = None

        return subprocess.run(cmd, **kwargs)

    def run_gate(self, gate_id: int) -> bool:
        config = GATES[gate_id]
        name = config["name"]
        self.log(f"Running Gate {gate_id}: {name}...", "INFO")

        # Construct command
        if "module" in config:
            cmd = [sys.executable, "-m", config["module"]]
        else:
            cmd = [sys.executable, config["script"]]

        # Add specific flags
        if gate_id == 1:
            if self.args.fix:
                cmd.append("--fix")
            if self.args.verbose:
                cmd.append("--verbose")
        elif gate_id == 2:
            if self.args.verbose:
                cmd.append("-v")
        
        # Execute
        result = self._run_command(cmd)
        success = result.returncode == 0
        
        # Record Result
        gate_result = {
            "gate": gate_id,
            "name": name,
            "passed": success,
            "details": result.stdout if result.stdout else (result.stderr if result.stderr else "See console output")
        }
        self.results.append(gate_result)

        if not success:
            self.failed = True
            self.log(f"❌ Gate {gate_id} Failed: {name}", "ERROR")
            if self.args.format == "json" and result.stderr:
                 self.log(f"Error Details: {result.stderr}", "ERROR")
            return False
        
        self.log(f"✅ Gate {gate_id} Passed", "INFO")
        return True

    def run_cleanup(self):
        """Clean temporary test directories (specs/00*-*)"""
        self.log("Starting cleanup scan...", "INFO")
        specs_dir = PROJECT_ROOT / "specs"
        if not specs_dir.exists():
            return

        # Pattern: Starts with 3 digits, contains hyphen, is NOT the current feature (004)
        # Assuming current feature is 004 based on context, but cleaner to rely on strict patterns
        # We target directories created by tests, usually containing 'test' or 'demo' or just generically numeric
        # Safety: Exclude '004-cdd-auditor-cli' explicitly to be safe during this dev cycle
        
        candidates = []
        for item in specs_dir.iterdir():
            if item.is_dir() and re.match(r"^\d{3}-", item.name):
                # Safety exclusions
                if "cdd-auditor-cli" in item.name:
                    continue
                candidates.append(item)

        if not candidates:
            self.log("No temporary directories found.", "INFO")
            return

        print(f"\nFound {len(candidates)} candidates for deletion:")
        for p in candidates:
            print(f"  - {p.relative_to(PROJECT_ROOT)}")

        if not self.args.force:
            response = input("\n⚠️  Delete these directories? [y/N] ").strip().lower()
            if response != 'y':
                self.log("Cleanup aborted.", "INFO")
                return

        for p in candidates:
            try:
                shutil.rmtree(p)
                self.log(f"Deleted: {p.name}", "INFO")
            except Exception as e:
                self.log(f"Failed to delete {p.name}: {e}", "ERROR")
                self.failed = True

    def generate_report(self):
        """Output final report in requested format"""
        if self.args.format == "json":
            report = {
                "timestamp": datetime.datetime.now().isoformat(),
                "success": not self.failed,
                "total_gates": len(self.results),
                "passed_gates": sum(1 for r in self.results if r["passed"]),
                "gate_results": self.results,
                "logs": self.output_buffer
            }
            
            # Add AI remediation plan if requested and there are failures
            if self.args.ai_hint and self.failed:
                remediation = []
                for res in self.results:
                    if not res["passed"]:
                        gate_id = res["gate"]
                        if gate_id == 1:  # Version Mismatch
                            remediation.append("Run `python scripts/cdd_audit.py --fix` to resolve version mismatch (Gate 1).")
                        elif gate_id == 2:  # Tests Failed
                            remediation.append("Analyze `pytest` output above. Fix logic errors in code before retrying (Gate 2).")
                        elif gate_id == 3:  # Entropy High
                            remediation.append("System entropy too high. Initiate refactoring workflow and analyze `scripts/measure_entropy.py` output (Gate 3).")
                
                if remediation:
                    report["ai_remediation_plan"] = remediation
            
            print(json.dumps(report, indent=2))
        
        else:
            print("\n" + "="*40)
            print("🏛️  CDD AUDIT SUMMARY")
            print("="*40)
            for res in self.results:
                icon = "✅" if res["passed"] else "❌"
                print(f"{icon} Gate {res['gate']}: {res['name']}")
            
            print("-" * 40)
            if self.failed:
                print("⛔ SYSTEM COMPLIANCE FAILED")
            else:
                print("🟢 SYSTEM COMPLIANT")

    def get_exit_code(self) -> int:
        if not self.results:
            return EC_SUCCESS if not self.failed else EC_CLEAN_FAIL # e.g. clean only

        # Return the code of the first failure
        for res in self.results:
            if not res["passed"]:
                return GATES[res["gate"]]["code"]
        
        return EC_SUCCESS

# -----------------------------------------------------------------------------
# CLI Entry Point
# -----------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="CDD Auditor CLI")
    
    # Modes
    parser.add_argument("--gate", choices=['1', '2', '3', 'all'], default='all', help="Gate to run")
    parser.add_argument("--fix", action="store_true", help="Auto-fix Gate 1 violations")
    parser.add_argument("--clean", action="store_true", help="Clean temporary spec directories")
    
    # Options
    parser.add_argument("--force", action="store_true", help="Skip confirmation for --clean")
    parser.add_argument("--format", choices=['text', 'json'], default='text', help="Output format")
    parser.add_argument("--verbose", action="store_true", help="Show verbose output")
    parser.add_argument("--quiet", action="store_true", help="Suppress non-error output")
    parser.add_argument("--ai-hint", action="store_true", help="Provide AI-friendly remediation hints in JSON output")

    args = parser.parse_args()
    auditor = CDDAuditor(args)

    try:
        # 1. Run Cleanup if requested
        if args.clean:
            auditor.run_cleanup()
            # If only clean is requested and no specific gate (default is 'all', handle implicit logic)
            # If user ran `cdd_audit.py --clean`, do they want audit too? 
            # Usually yes, unless specified otherwise. But strictly, args.gate defaults to 'all'.
            # Let's verify if we should proceed.
            # Design decision: --clean is an operation. If run with --clean, we still run gates unless explicitly told otherwise?
            # Actually, standard CLI behavior: options are additive.
            pass 

        # 2. Determine Gates to Run
        gates_to_run = []
        if args.gate == 'all':
            gates_to_run = [1, 2, 3]
        else:
            gates_to_run = [int(args.gate)]

        # 3. Execute Gates
        # If user ONLY wanted clean (unlikely with default='all'), logic holds.
        # But if user typed `cdd_audit.py --clean`, they get audit too. That's fine.
        for g_id in gates_to_run:
            if not auditor.run_gate(g_id):
                if not args.force: # Stop on first failure unless forced? 
                    # CDD principle: Fail fast. But for audit report, we might want full picture.
                    # Let's Continue to show full report usually.
                    pass

        # 4. Report & Exit
        auditor.generate_report()
        sys.exit(auditor.get_exit_code())

    except KeyboardInterrupt:
        print("\n🚫 Audit interrupted by user.")
        sys.exit(EC_GENERAL_FAIL)
    except Exception as e:
        print(f"\n❌ Internal Error: {e}")
        sys.exit(EC_GENERAL_FAIL)

if __name__ == "__main__":
    main()