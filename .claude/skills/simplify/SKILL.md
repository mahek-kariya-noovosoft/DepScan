---
name: simplify
description: Reviews and simplifies code by removing dead code, reducing duplication, and improving readability. Use after a feature is built to clean it up.
allowed-tools: Read, Glob, Grep, Edit, Bash
---

## Code Simplifier

Clean up and simplify code while preserving behavior.

### When invoked
- `/simplify $ARGUMENTS` — simplify the specified file or directory
- `/simplify` — scan recently changed files using `git diff --name-only HEAD~1`

### What to Simplify
1. **Dead code** — delete unused variables, imports, unreachable code
2. **Duplication** — extract repeated code into reusable functions (DRY)
3. **Complexity** — reduce nesting with early returns, simplify conditionals
4. **Bloat** — files over 300 lines get split into focused modules
5. **Verbosity** — use optional chaining, destructuring, ternary for simple if/else
6. **Related logic** — if a function is only used in one file, move it there

### Process
1. READ all target files — list what you found (don't change anything yet)
2. Present summary: "Found X simplification opportunities across Y files"
3. List each with before/after preview
4. Ask for approval before making changes
5. After editing, run `npm test` to verify nothing broke
6. If tests fail, revert changes and report what went wrong

### Do NOT
- Do not touch test files — simplify source code only
- Do not change public function signatures
- Do not remove error handling
- Do not remove comments that explain business logic
- Do not change project structure defined in CLAUDE.md
