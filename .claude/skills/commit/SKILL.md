---
name: commit
description: Analyzes git changes and creates a conventional commit with the right prefix and descriptive message. Use after completing any code change.
allowed-tools: Read, Bash, Grep, Glob
---

## Smart Commit

Analyze the current git changes and create a proper conventional commit.

### Process

1. Run `git status` and `git diff --staged` (if nothing staged, run `git diff`)
2. Analyze what changed — which files, what kind of changes
3. Categorize the change type:
   - `feat:` — new feature or functionality
   - `fix:` — bug fix
   - `refactor:` — code restructuring without behavior change
   - `test:` — adding or updating tests
   - `docs:` — documentation changes
   - `chore:` — dependency updates, config changes
   - `style:` — formatting, no logic change
4. Generate a commit message: `type: concise description of what changed`
5. If changes span multiple categories, use the most significant one
6. Show the proposed message and file list
7. Ask for approval before committing
8. If nothing is staged, ask if I should stage all changes or specific files

### Rules
- Message must be under 72 characters
- Use present tense: "add feature" not "added feature"
- Be specific: "fix scoring engine null handling" not "fix bug"
- Never auto-push — only commit locally
