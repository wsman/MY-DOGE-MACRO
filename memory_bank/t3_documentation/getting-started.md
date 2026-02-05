# Development Guide - Getting Started (T3 Reference)

> **Source**: `../../../memory_bank/t3_documentation/development/getting-started.md`  
> **Version**: v1.6.0  
> **Last Updated**: 2026-02-05  
> **Category**: Development  
> **Audience**: New Developers, Contributors  
> **Status**: ✅ Current

## Overview

Reference document for the MY-DOGE-MACRO development guide and quick start instructions.

This document provides a structured reference to the complete development guide, which covers environment setup, installation steps, development workflows, testing, and common troubleshooting.

## Key Content Summary

### Environment Requirements
- **Essential Software**: Node.js 18+, Python 3.12+, Rust (for Tauri), Git 2.30+
- **Recommended Tools**: VS Code with TypeScript/Python/Rust extensions, Docker, GitHub CLI
- **Architecture**: Modular Monorepo (v1.6.0+)

### Installation Steps
1. **Clone Project**: `git clone https://github.com/wsman/MY-DOGE-MACRO.git`
2. **Python Dependencies**: `cd server && pip install -r requirements.txt`
3. **Node.js Dependencies**: `cd apps/desktop && npm install`
4. **Tauri Dependencies**: Automatically installed on first run

### Starting Applications
- **Backend Service (FastAPI)**: `cd server && python server.py --host 0.0.0.0 --port 8765 --token your-token`
- **Frontend Development**: `cd apps/desktop && npm run tauri dev`

### Development Workflow
- **Code Structure**: Understand both new modular architecture and legacy compatibility structure
- **Import Statements**: Examples for TypeScript and Python imports using both old and new paths
- **Development Servers**: Running both frontend and backend simultaneously
- **Service Verification**: Health check endpoints for backend validation

### Testing
- **Python Tests**: `cd server && python -m pytest tests/`
- **TypeScript Tests**: `cd apps/desktop && npm test`
- **Storybook Tests**: `npm run test:storybook`
- **Integration Tests**: `python -m pytest tests/`
- **Type Checking**: `npm run type-check`

### Code Standards
- **TypeScript/JavaScript**: ESLint + Prettier configuration with format/lint commands
- **Python**: Black formatting, flake8 linting, mypy type checking
- **Git Commits**: Conventional Commits specification (feat:, fix:, docs:, etc.)

### CDD Workflow (Constitution-Driven Development)
- **Five-State Workflow**: State A (Load) → State B (Plan) → State C (Implement) → State D (Verify) → State E (Converge)
- **Pre-commit Hooks**: Manual and automated checks
- **CDD Tools**: Version verification, system entropy measurement, audit scripts

### Common Issues
- **Tauri Build Failures**: Rust toolchain issues - solution: `rustup update`
- **Python Import Errors**: Module path issues - solution: Check PYTHONPATH
- **Frontend-Backend Connection**: CORS or port conflicts - solution: Verify configurations
- **Dependency Installation**: Network or version conflicts - solution: Clean caches and reinstall

### Deployment Preparation
- **Production Configuration**: Environment variable setup and secure token generation
- **Desktop App Build**: Development and production builds using Tauri
- **API Service Build**: Direct deployment or containerized options

### Help and Troubleshooting
- **Logs**: Backend logs in `server/logs/app.log`, frontend logs from Tauri dev
- **Debugging Tools**: TypeScript type checking, Python debugger, network debugging
- **Issue Reporting**: GitHub Issues with error details, reproduction steps, environment info

## Related Documents

### Within T3 Documentation
- [Architecture Guide](../architecture/v1.6.0-modular-architecture.md)
- [API Reference](../api/backend-api.md)
- [Deployment Guide](../deployment/deployment-guide.md)

### CDD Internal Documents
- **Technical Law Index**: `../../t0_core/technical_law_index.md` - Overview of all standards
- **Project Readme**: `../../t0_core/project_readme.md` - T0 seed document
- **Active Context**: `../../t0_core/active_context.md` - Current system state
- **Protocols**: `../../t2_protocols/` - Workflow protocols and procedures

### External Documents
- **Full Development Guide**: [../../../memory_bank/t3_documentation/development/getting-started.md](../../../memory_bank/t3_documentation/development/getting-started.md)
- **Root README**: `../../../README.md` - Complete project overview
- **CHANGELOG**: `../../../CHANGELOG.md` - Version history and changes
- **Design System**: `../../../apps/desktop/DESIGN_SYSTEM.md` - UI components and tokens

## Quick Reference Commands

### Environment Setup
```bash
# Clone and install
git clone https://github.com/wsman/MY-DOGE-MACRO.git
cd MY-DOGE-MACRO/server && pip install -r requirements.txt
cd ../apps/desktop && npm install
```

### Development Workflow
```bash
# Terminal 1: Backend
cd server && python server.py

# Terminal 2: Frontend
cd apps/desktop && npm run tauri dev

# Terminal 3: Testing
cd server && python -m pytest tests/
```

### CDD Tools
```bash
# Pre-commit checks
pre-commit run --all-files

# Version verification
python scripts/verify_versions.py

# System entropy measurement
python scripts/measure_entropy.py
```

## Migration Note

The project is currently migrating from legacy architecture to the new modular architecture (v1.6.0). Developers should reference the latest documentation and code structure, but compatibility with the old structure is maintained during the transition period.

## Access Methods

### For Detailed Information
- **Primary Source**: [Complete Development Guide](../../../memory_bank/t3_documentation/development/getting-started.md)
- **GitHub**: https://github.com/wsman/MY-DOGE-MACRO/tree/main/memory_bank/t3_documentation/development
- **Documentation Center**: `../../../memory_bank/t3_documentation/README.md`

### For AI Agents
- **CDD Path**: `memory_bank/t3_documentation/development/`
- **Structured Metadata**: Version, category, audience, status
- **Relationship Context**: Links to related T0-T2 documents

### For New Developers
- **Quick Start**: This document provides essential setup information
- **Detailed Instructions**: Full guide for complete environment setup
- **Troubleshooting**: Solutions for common development issues

---

**Document Status**: ✅ Current (v1.6.0)  
**Maintained by**: Negentropy Lab AI Agent System  
**CDD Framework**: v1.6.1  
**Development Environment**: Modular v1.6.0  
**Last Verified**: 2026-02-05