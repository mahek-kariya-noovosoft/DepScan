---
name: add-feature
description: Interview-driven feature planning and implementation. Use when adding a new feature to DepScan. Asks questions first, creates a plan, then builds.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

## Add Feature Workflow

A structured process to plan and build new features for DepScan.

### Phase 1: Interview (ask these one at a time)
1. What should this feature do? (user's perspective)
2. What data does it need? (inputs, APIs, database)
3. What should the output look like? (UI, API response, file)
4. Any edge cases or constraints?
5. How does it connect to existing code?

### Phase 2: Plan
After the interview, produce:
- Files to create/modify (with paths)
- New interfaces/types needed (add to shared/types/)
- New API endpoints (if any)
- New components (if any)
- Test cases to write
- Estimated complexity: Small / Medium / Large

Present the plan. Wait for approval. Do NOT proceed without approval.

### Phase 3: Build
1. Create/update shared types first
2. Build backend logic with tests
3. Build frontend components
4. Wire everything together
5. Run full test suite
6. Run `/code-review` on changed files

### Phase 4: Cleanup
1. Run `/simplify` on new code
2. Run `/commit` to create a proper commit
3. Update CLAUDE.md if new patterns were established

### Rules
- Follow CLAUDE.md coding standards at every step
- Commit after each meaningful milestone, not at the end
- Never skip tests
