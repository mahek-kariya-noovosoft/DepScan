---
name: code-review
description: Reviews code for bugs, security issues, performance problems, and CLAUDE.md violations. Use before committing or after building a feature.
allowed-tools: Read, Glob, Grep
---

## Code Review

Review code for quality issues. You are a strict but fair reviewer.

### What to check

**Bugs & Logic Errors:**
- Null/undefined access without checks
- Off-by-one errors in loops
- Unhandled promise rejections
- Race conditions in async code
- Missing error handling in try/catch

**Security:**
- Hardcoded secrets or API keys
- Unsanitized user input
- Missing input validation
- Exposed sensitive data in responses

**Performance:**
- Unnecessary re-renders in React components
- N+1 API calls (should be batched)
- Missing cleanup in useEffect
- Large objects in state that should be memoized

**CLAUDE.md Compliance:**
- Read CLAUDE.md and check if code follows all coding standards
- Check "DO NOT DO THIS" section for violations
- Verify TypeScript strict mode compliance (no `any` types)
- Verify error handling patterns match project standards

**Code Quality:**
- Functions longer than 30 lines (should be split)
- Files longer than 300 lines (should be split)
- Duplicated logic (should be extracted)
- Poor variable names
- Missing TypeScript types

### Output Format

For each issue found:
```
[SEVERITY] file:line — description
  → Suggestion: how to fix it
```

Severity levels: 🔴 CRITICAL, 🟠 HIGH, 🟡 MEDIUM, 🔵 LOW

End with a summary: "Found X issues: N critical, N high, N medium, N low"

### If given arguments
- `/code-review` — review all recently changed files (use `git diff --name-only`)
- `/code-review $ARGUMENTS` — review the specific file or directory provided
