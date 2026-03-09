---
name: scan-report
description: Runs a DepScan analysis and generates a formatted risk report for a package.json. Use when you want a detailed written report instead of the dashboard.
disable-model-invocation: true
allowed-tools: Read, Bash
---

## Scan Report Generator

Generate a detailed risk report from a DepScan analysis.

### Process

1. If $ARGUMENTS is a file path, read that file. Otherwise prompt for package.json content.
2. Start the server if not running: `cd server && npm run dev &`
3. Run the analysis:
   ```
   curl -s -X POST http://localhost:3001/api/analyze \
     -H "Content-Type: application/json" \
     -d '{"content": "<package.json content>"}'
   ```
4. Parse the JSON response
5. Generate a formatted report:

### Report Format

```
# DepScan Risk Report
**Project:** {name}
**Date:** {today}
**Overall Grade:** {grade} ({score}/100)

## Summary
- Total dependencies: {total}
- Critical risk: {count} 🔴
- High risk: {count} 🟠
- Medium risk: {count} 🟡
- Low risk: {count} 🟢

## Critical & High Risk Dependencies
For each critical/high dep:
### {package name} — Risk Score: {score} ({level})
- **Version:** {installed} → latest: {latest}
- **Last Updated:** {date}
- **Vulnerabilities:** {count} ({CVE IDs})
- **Contributors:** {count}
- **License:** {license}
- **Key Issue:** {highest weighted signal detail}
- **Recommendation:** {what to do}

## All Dependencies
| Package | Type | Risk | Score | Key Issue |
|---------|------|------|-------|-----------|
(table of all deps sorted by risk descending)
```

6. Save report to `reports/{project-name}-{date}.md`
