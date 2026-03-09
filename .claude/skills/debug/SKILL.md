---
name: debug
description: Systematically debugs issues by reproducing, isolating, and fixing them. Use when something is broken or behaving unexpectedly.
allowed-tools: Read, Bash, Grep, Glob, Edit, Write
---

## Systematic Debugger

When something is broken, follow this exact process. Do NOT jump to conclusions.

### Step 1: Understand the Problem
- Ask: What is the expected behavior?
- Ask: What is the actual behavior?
- Ask: When did it start happening? (check recent git changes with `git log --oneline -10`)

### Step 2: Reproduce
- Run the failing test or reproduce the issue
- Confirm you can see the same error
- If you can't reproduce, say so — don't guess

### Step 3: Isolate
- Read error messages and stack traces carefully
- Trace the code path from the error backwards
- Use `grep` to find related code
- Check for recent changes: `git diff HEAD~3 -- <suspected file>`
- Add temporary console.log statements to narrow down where it breaks

### Step 4: Identify Root Cause
- State the root cause clearly: "The bug is in [file] at [line] because [reason]"
- Explain WHY it's broken, not just WHAT is broken
- Check if the same bug exists elsewhere (similar patterns)

### Step 5: Fix
- Make the minimal fix — don't refactor while debugging
- Run tests to verify the fix works
- Run the full test suite to check for regressions
- Remove any temporary console.log statements

### Step 6: Prevent
- If this bug could have been caught by a test, write that test
- If this is a pattern that could repeat, add it to CLAUDE.md "DO NOT DO THIS" section

### Rules
- Never guess. Always verify with evidence.
- One fix at a time. Don't change multiple things.
- If stuck after 3 attempts, say "I need help" and explain what you've tried.
