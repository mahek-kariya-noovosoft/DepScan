import type { ParsedDependency, DependencyType } from '@shared/types/index'

const MAX_DEPENDENCIES = 50

export function parsePackageJson(content: string): {
  dependencies: ParsedDependency[]
  totalCount: number
  wasTruncated: boolean
} {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('Invalid JSON: could not parse the provided content as JSON')
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Invalid JSON: expected a JSON object')
  }

  const pkg = parsed as Record<string, unknown>
  const deps = extractEntries(pkg['dependencies'], 'dependency')
  const devDeps = extractEntries(pkg['devDependencies'], 'devDependency')
  const allDeps = [...deps, ...devDeps]

  if (allDeps.length === 0) {
    throw new Error(
      'No dependencies found: package.json must contain at least one entry in "dependencies" or "devDependencies"',
    )
  }

  const wasTruncated = allDeps.length > MAX_DEPENDENCIES
  const dependencies = wasTruncated ? allDeps.slice(0, MAX_DEPENDENCIES) : allDeps

  return { dependencies, totalCount: allDeps.length, wasTruncated }
}

function extractEntries(
  obj: unknown,
  type: DependencyType,
): ParsedDependency[] {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return []
  }

  return Object.entries(obj as Record<string, unknown>)
    .filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    )
    .map(([name, version]) => ({ name, version, type }))
}
