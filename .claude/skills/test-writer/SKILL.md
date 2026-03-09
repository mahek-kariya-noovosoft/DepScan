---
name: test-writer
description: Generates comprehensive tests for any file including happy paths, edge cases, error cases, and boundary conditions. Use after writing new code or when test coverage is missing.
allowed-tools: Read, Write, Bash, Grep, Glob
---

## Test Writer

Generate thorough tests for the given file or component.

### When invoked
- `/test-writer $ARGUMENTS` — write tests for the specified file
- `/test-writer` — find all source files without corresponding test files and list them

### Test Categories (every test file must cover ALL of these)

**Happy Path:** Normal expected usage — does it work correctly?
**Edge Cases:** Empty inputs, single items, maximum values, boundary conditions
**Error Cases:** Invalid input, null/undefined, network failures, malformed data
**Boundary Conditions:** Zero, negative numbers, very large numbers, empty strings, special characters

### For React Components
- Renders without crashing
- Displays correct data with valid props
- Handles missing/null/undefined props gracefully
- Interactive elements fire correct callbacks
- Conditional rendering works (loading, error, empty states)
- Accessibility: key elements have proper roles/labels

### For Backend Functions
- Returns correct result for valid input
- Throws/returns error for invalid input
- Handles async failures (timeouts, network errors)
- Edge cases specific to the function's domain

### For Pure Functions (like scoring engine)
- Test every boundary threshold
- Test with missing/undefined inputs
- Test with extreme values (0, -1, Infinity, NaN)
- Test output types and shapes

### Rules
- Use Vitest and React Testing Library (as per CLAUDE.md)
- Test file goes next to source: `file.ts` → `file.test.ts`
- Every test has a descriptive name: "should return high risk when last publish > 2 years"
- Run all tests after writing to verify they pass
- No snapshot tests — they're fragile and hide issues
- Mock external dependencies (fetch, APIs) — never hit real APIs in tests
