# PART 1: Housekeeping - The Kill List

## Files to Delete

### Redundant Integration Documentation (4 files)
All information has been consolidated into README.md and CLAUDE.md.

1. **INTEGRATION_COMPLETE.md**
   - Reason: Transient project artifact from initial integration. Contains emoji-heavy, celebratory content inappropriate for permanent documentation. Information moved to README.md testing section.

2. **INTEGRATION_SUMMARY.md**
   - Reason: Redundant summary of architectural changes already documented in ARCHITECTURE.md and CLAUDE.md. Duplicates data flow and component descriptions.

3. **INTEGRATION_GUIDE.md**
   - Reason: Setup instructions now comprehensively covered in README.md Environment Setup section. Troubleshooting content merged into README.md.

4. **SETUP_QUICK.md**
   - Reason: Quick start commands duplicated in README.md Quick Start section. File adds no unique value beyond emoji decoration.

### Subordinate Component READMEs (3 files)
Component-specific documentation that either duplicates parent README or contains boilerplate content.

5. **backend/README.md**
   - Reason: Original HackPrinceton design document from Flask prototype era. Current implementation uses FastAPI. Document describes obsolete architecture with Dedalus/MCP agents not in current codebase.

6. **agent/README.md**
   - Reason: Contains only "# agent" with no actual content. Zero informational value.

7. **clerk-react/README.md**
   - Reason: Default Vite+React template boilerplate. Generic ESLint configuration advice unrelated to this specific project.

### Redundant Backend Documentation (3 files)
Backend-specific docs that duplicate information in ARCHITECTURE.md or describe obsolete systems.

8. **backend/docs/unified-architecture.md**
   - Reason: Describes Dedalus Labs categorization system not present in current codebase. Architecture already documented in root ARCHITECTURE.md.

9. **backend/docs/deployment-snowflake.md**
   - Reason: Deployment-specific documentation that should be in operations runbook, not source control. Snowflake setup already covered in README.md Environment Setup.

10. **backend/docs/categorization-flow.md**
    - Reason: Documents categorization pipeline using Dedalus Labs that does not exist in current implementation. Historical artifact from prototype phase.

### Obsolete Nessie Documentation (1 file)

11. **clerk-react/NESSIE_SETUP.md**
    - Reason: Setup guide for Nessie API integration. Nessie is mentioned in tech stack but no active usage found in codebase. If needed, should be in main README.md.

### Temporary Runtime Files (5 files)
These should never have been committed and are properly listed in .gitignore.

12. **.backend.pid**
    - Reason: Runtime process ID file. Should not be in version control.

13. **.frontend.pid**
    - Reason: Runtime process ID file. Should not be in version control.

14. **.agent.pid**
    - Reason: Runtime process ID file. Should not be in version control.

15. **backend.log**
    - Reason: Runtime log file. Should not be in version control.

16. **frontend.log**
    - Reason: Runtime log file. Should not be in version control.

## Total Files to Delete: 16

## Consolidation Summary

- Integration documentation (4 files) → Consolidated into README.md
- Component READMEs (3 files) → Removed (content either duplicated or non-existent)
- Backend docs (3 files) → Information merged into ARCHITECTURE.md where relevant
- Nessie setup (1 file) → Removed (unused integration)
- Runtime files (5 files) → Deleted (should be gitignored)

## Post-Cleanup Documentation Structure

```
/
├── README.md              (Primary entry point)
├── CLAUDE.md              (AI assistant development guide)
├── ARCHITECTURE.md        (System architecture diagrams)
├── CONTRIBUTING.md        (New - development guidelines)
├── LICENSE                (New - open source license)
├── .gitignore             (Updated - prevent future runtime file commits)
├── start-all.sh           (Keep - operational script)
├── stop-all.sh            (Keep - operational script)
└── test-integration.sh    (Keep - testing script)
```
