# Frontend Component Tests
Run all frontend component tests. If none exist for a component, create them.
Every component in client/src/components/ and client/src/pages/ must have a test file.

Minimum test coverage per component:
- Renders without crashing
- Displays correct data when given valid props/state
- Handles empty/null/undefined data gracefully
- Interactive elements work (clicks, sorts, expands)
- Conditional rendering works (loading states, error states, empty states)

Use @testing-library/react with vitest.
Test file goes next to the component: Component.tsx → Component.test.tsx
```

Now open a fresh Claude Code session and paste this:
```
I need comprehensive frontend component tests and realistic test data.

PART 1: Create test fixture data in client/src/__fixtures__/testData.ts

Create 3 complete AnalysisResult objects that we can use across all tests:

FIXTURE 1: "healthy-project" — A well-maintained project (Grade A)
- 5 dependencies, all low risk
- Packages like react, typescript, zod — actively maintained, many contributors,
  MIT license, no vulnerabilities, high downloads, recently published
- Overall score around 12, grade A
- All signals available, no partial data

FIXTURE 2: "risky-project" — A project with serious problems (Grade D/F)
- 8 dependencies mixing deps and devDeps
- Include packages that are:
    - One with 4 known CVEs (critical vulnerabilities)
    - One last published 4 years ago with 1 contributor (abandoned)
    - One with GPL-3.0 license (license risk)
    - One using "*" version (unpinned)
    - One with declining downloads (<100/week)
    - A few medium-risk ones to round it out
- Overall score around 62, grade D
- Some dependencies have hasPartialData: true (simulating API failures)

FIXTURE 3: "mixed-project" — Realistic middle ground (Grade C)
- 12 dependencies (mix of deps and devDeps)
- Some good (low risk), some concerning (medium/high), one critical
- Include a truncated scenario: wasTruncated: true, totalDependencies: 55, analyzedCount: 50
- Overall score around 42, grade C
- Mix of partial and complete data

Make the data realistic — use real package names, plausible version numbers,
real-looking CVE IDs, actual license types. The signal details should have
realistic human-readable strings like "Last published 3.7 years ago" and
"1 contributor with commit access".

PART 2: Write component tests for ALL components:

client/src/pages/LandingPage.test.tsx
- Renders the hero text and input area
- Textarea accepts input
- Shows error for invalid JSON
- Scan button is disabled when textarea is empty
- Shows loading state when analyzing

client/src/pages/DashboardPage.test.tsx
- Renders all sections with healthy-project fixture
- Renders correctly with risky-project fixture (high risk badges show)
- Redirects to / when no data in location state
- "Analyze Another" button exists
- Shows truncation warning when wasTruncated is true (mixed-project fixture)

client/src/components/HealthScore.test.tsx
- Renders score number and letter grade
- Grade A shows green/emerald styling
- Grade F shows red styling
- Handles each grade level (A, B, C, D, F)

client/src/components/StatsCards.test.tsx
- Renders all 4 risk level counts
- Shows correct numbers from fixture data
- Zero counts display correctly

client/src/components/RiskChart.test.tsx
- Renders without crashing with valid data
- Renders with all-zero counts (edge case)
- Renders with only one risk level having counts

client/src/components/DependencyTable.test.tsx
- Renders all dependencies from fixture
- Default sort is risk score descending
- Clicking column header changes sort
- Clicking a row expands to show signal breakdown
- Shows partial data warning icon when hasPartialData is true
- Shows dep/devDep type badges correctly
- Shows vulnerability count correctly

client/src/components/RiskBadge.test.tsx
- Renders correct color for each risk level (critical, high, medium, low)
- Displays the risk level text

client/src/components/AiRecommendations.test.tsx
- Renders the "coming soon" placeholder
- Renders real content when recommendation string is provided

client/src/components/LoadingState.test.tsx
- Renders the loading steps
- Shows progress animation

client/src/components/PackageJsonInput.test.tsx
- Renders textarea and button
- Button disabled when textarea empty
- Shows error message for invalid JSON input
- Calls onSubmit with content when valid JSON is pasted

Run ALL tests after writing them. Fix any failures.
Use the fixture data from testData.ts across all tests.
