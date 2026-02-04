# T3 Documentation - User & Developer Guides

> **Level**: T3 (User Documentation)  
> **Version**: v1.6.0  
> **Last Updated**: 2026-02-05  
> **Primary Location**: `../docs/`

## Overview

T3 documents are user-facing and developer-focused documentation that provides practical guidance for using, developing, and deploying the MY-DOGE-MACRO system.

These documents serve as the bridge between the internal CDD knowledge system (T0-T2) and external users/developers. They translate system concepts and standards into actionable instructions and reference materials.

## Documentation Categories

| Category | Document | Description | Status |
|----------|----------|-------------|--------|
| **Architecture** | [v1.6.0 Modular Architecture](./architecture/v1.6.0-modular-architecture.md) | Modular architecture design and migration status | ✅ Current |
| **API Reference** | [Backend API](./api/backend-api.md) | REST API endpoints, requests/responses, authentication | ✅ Current |
| **Development** | [Getting Started](./development/getting-started.md) | Environment setup, installation, development workflow | ✅ Current |
| **Deployment** | [Deployment Guide](./deployment/deployment-guide.md) | Production deployment for desktop app and API services | ✅ Current |

## CDD Document Hierarchy

| Level | Directory | Purpose | Audience |
|-------|-----------|---------|----------|
| **T0** | `../core/` | Core consciousness (project seed, knowledge graph) | AI Agents, System Architects |
| **T1** | `../axioms/` | System axioms (technical context, behavior patterns) | AI Agents, Senior Developers |
| **T2** | `../protocols/`, `../standards/` | Workflow protocols, implementation standards | Developers, Technical Leads |
| **T3** | `./` | User and developer documentation (this level) | Users, Developers, DevOps |

## T3 Document Standards

### Format Requirements
- **Markdown**: Standard Markdown syntax with clear hierarchy
- **Structure**: Logical organization with tables of contents
- **Examples**: Practical, runnable code examples
- **Links**: Valid relative links with descriptive anchor text
- **Images**: When helpful, with alt text and captions

### Content Standards
- **User-focused**: Practical guidance over theoretical concepts
- **Actionable**: Step-by-step instructions with clear outcomes
- **Current**: Version-specific information, updated regularly
- **Complete**: Comprehensive coverage of the topic
- **Accessible**: Clear language, avoiding unnecessary jargon

### Metadata Requirements
Each T3 document should include:
- Version and last updated date
- Document category and audience
- Source location (pointing to `docs/` directory)
- Status indicator (Current, Deprecated, In Progress)

## Access Methods

### For Users
- **Primary Access**: `docs/` directory (original location)
- **GitHub**: https://github.com/wsman/MY-DOGE-MACRO/tree/main/docs
- **Root README**: `README.md` includes document directory
- **CDD System**: This index (`memory_bank/t3_documentation/`)

### For AI Agents
- **CDD Path**: `memory_bank/t3_documentation/`
- **Structured Access**: Category-based navigation
- **Metadata**: Version, status, and relationship information
- **Context**: Connection to T0-T2 documents for complete understanding

### For Developers
- **Documentation Center**: `docs/README.md` provides navigation
- **API Reference**: `docs/api/backend-api.md` for integration
- **Architecture Docs**: `docs/architecture/` for system design
- **Development Guides**: `docs/development/` for getting started

## Maintenance

### Update Process
1. **Source Update**: Update primary documents in `docs/` directory
2. **T3 Sync**: Update corresponding T3 reference documents if needed
3. **Link Verification**: Verify all internal and external links
4. **Version Update**: Update version and last updated information
5. **Consistency Check**: Ensure T3 documents reflect source content accurately

### Version Control Strategy
- **Source of Truth**: `docs/` directory contains the authoritative content
- **T3 References**: Provide structured access and metadata
- **Backward Compatibility**: Note breaking changes and migration paths
- **Deprecation Policy**: Mark deprecated documents clearly with alternatives

### Quality Assurance
- **Technical Accuracy**: Ensure all technical information is correct
- **Link Validity**: Regular checks of all internal and external links
- **User Testing**: Document usability from user perspective
- **AI Agent Testing**: Ensure documents are accessible to AI systems

## Related Documents

### CDD Internal
- **Technical Law Index**: `../core/technical_law_index.md` - Overview of all standards
- **Project Readme**: `../core/project_readme.md` - T0 seed document
- **Active Context**: `../core/active_context.md` - Current system state

### External
- **Root README**: `../../README.md` - Complete project overview
- **CHANGELOG**: `../../CHANGELOG.md` - Version history and changes
- **Design System**: `../../apps/desktop/DESIGN_SYSTEM.md` - UI components and tokens

## Contribution Guidelines

### Adding New T3 Documents
1. **Create Source**: Add new document to appropriate `docs/` subdirectory
2. **Create Reference**: Add corresponding T3 reference document
3. **Update Index**: Add entry to this index table
4. **Update Links**: Ensure all related documents link correctly

### Document Standards Enforcement
- Follow the established template and format
- Include all required metadata
- Use consistent terminology and naming conventions
- Test all code examples and commands

---

**T3 Documentation Status**: ✅ Active (v1.6.0)  
**Maintained by**: Negentropy Lab AI Agent System  
**CDD Framework**: v1.6.1  
**Last System Audit**: 8.75/10 (Passed)