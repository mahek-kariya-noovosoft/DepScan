# CLAUDE.md — DepScan Project Intelligence

## Project Overview
DepScan is a dependency risk scanner. Users paste a package.json file and get a visual risk dashboard showing how risky each dependency is — based on staleness, vulnerabilities, bus factor, license issues, and download trends. It uses Claude AI to generate plain-English recommendations.

## Tech Stack
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS + Recharts + D3.js
- Backend: Node.js + Express + TypeScript
- Validation: Zod
- External APIs: npm registry, GitHub API, OSV.dev
- AI: Anthropic Claude API — SKIPPED FOR NOW (no API key available). Will be added later when key is available.

## Project Structure
This is a monorepo with client/ and server/ directories.
- client/ — React frontend (Vite)
- server/ — Express backend
- Shared types go in shared/types/

## Coding Standards
- Use TypeScript strict mode everywhere
- Use functional components with hooks (no class components)
- Use named exports, not default exports (except for pages)
- Every service function must have proper error handling with try/catch
- Use Zod for all input validation on the backend
- All API calls must have a 10-second timeout
- Use async/await, never raw .then() chains
- Use descriptive variable names — no single letter variables except in loops

## Testing Standards
- Write unit tests for all scoring engine functions using Vitest
- Write unit tests for all parsers
- Backend API routes need integration tests
- Test files live next to the source file: `scoring.ts` → `scoring.test.ts`
- Every test must have a descriptive name: "should return high risk when last publish > 2 years"
- Run `npm test` before considering any task complete

## Git Conventions
- Use conventional commits: feat:, fix:, refactor:, test:, docs:
- Commit after each meaningful unit of work, not in huge batches

## Commands
- `cd client && npm run dev` — Start frontend dev server
- `cd server && npm run dev` — Start backend dev server
- `cd server && npm test` — Run backend tests
- `cd client && npm test` — Run frontend tests
- `npm run lint` — Lint entire project

## Architecture Decisions
- The scoring engine must be pure functions with no side effects (easily testable)
- External API calls are isolated in individual service files (npm.service.ts, github.service.ts, osv.service.ts)
- The frontend fetches data via a single POST /api/analyze endpoint
- Risk scoring happens on the backend, not the frontend

## ❌ DO NOT DO THIS (Updated as mistakes happen)
- DO NOT use `any` type in TypeScript — always define proper interfaces
- DO NOT put scoring logic in route handlers — keep it in scoring/
- DO NOT make API calls without error handling and timeouts
- DO NOT use console.log for error handling — use a proper error response
- DO NOT install unnecessary packages — check if Node/TS stdlib can do it first
- DO NOT create massive files over 300 lines — split into smaller modules
- DO NOT skip writing tests for the scoring engine — this is the core logic
- DO NOT use relative imports that go up more than 2 levels (../../..) — use path aliases