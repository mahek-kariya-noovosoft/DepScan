# Project Health Check
Run a quick health check:
1. `npm run lint` in both client and server
2. `npm test` in both client and server
3. Check for any TypeScript errors: `npx tsc --noEmit` in both
4. List any files over 300 lines that should be split
5. List any TODO/FIXME/HACK comments in the codebase
6. Report overall project health status