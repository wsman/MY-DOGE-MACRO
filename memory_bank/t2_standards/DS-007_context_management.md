# DS-007: Context Management Standard

**Version**: v1.0.0  
**Last Updated**: 2026-02-01

## Purpose

T0 document management and context loading rules.

## Rules

### T0 Document Lifecycle

| Phase | Action |
|-------|--------|
| Creation | Create all 5 T0 documents in `core/` |
| Loading | Load T0 docs before any task |
| Modification | Update version after changes |
| Verification | Check consistency after updates |

### Document Naming

| Document | Filename |
|----------|----------|
| Active Context | `active_context.md` |
| Knowledge Graph | `knowledge_graph.md` |
| Basic Law Index | `basic_law_index.md` |
| Procedural Law Index | `procedural_law_index.md` |
| Technical Law Index | `technical_law_index.md` |

## Size Limits

| Document | Max Tokens |
|----------|------------|
| active_context.md | <800 |
| knowledge_graph.md | <1000 |
| basic_law_index.md | <500 |
| procedural_law_index.md | <300 |
| technical_law_index.md | <500 |
