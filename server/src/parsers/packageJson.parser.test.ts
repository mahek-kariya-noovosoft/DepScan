import { describe, it, expect } from 'vitest'
import { parsePackageJson } from './packageJson.parser'

describe('parsePackageJson', () => {
  it('should parse valid package.json with both deps and devDeps', () => {
    const content = JSON.stringify({
      dependencies: {
        express: '^4.18.2',
        zod: '~3.22.0',
      },
      devDependencies: {
        vitest: '^1.0.0',
        typescript: '*',
      },
    })

    const result = parsePackageJson(content)

    expect(result.wasTruncated).toBe(false)
    expect(result.dependencies).toHaveLength(4)
    expect(result.dependencies).toEqual(
      expect.arrayContaining([
        { name: 'express', version: '^4.18.2', type: 'dependency' },
        { name: 'zod', version: '~3.22.0', type: 'dependency' },
        { name: 'vitest', version: '^1.0.0', type: 'devDependency' },
        { name: 'typescript', version: '*', type: 'devDependency' },
      ]),
    )
  })

  it('should parse package.json with only dependencies', () => {
    const content = JSON.stringify({
      name: 'my-app',
      dependencies: {
        lodash: '^4.17.21',
      },
    })

    const result = parsePackageJson(content)

    expect(result.dependencies).toHaveLength(1)
    expect(result.dependencies[0]).toEqual({
      name: 'lodash',
      version: '^4.17.21',
      type: 'dependency',
    })
    expect(result.wasTruncated).toBe(false)
  })

  it('should parse package.json with only devDependencies', () => {
    const content = JSON.stringify({
      devDependencies: {
        jest: '^29.0.0',
      },
    })

    const result = parsePackageJson(content)

    expect(result.dependencies).toHaveLength(1)
    expect(result.dependencies[0]).toEqual({
      name: 'jest',
      version: '^29.0.0',
      type: 'devDependency',
    })
    expect(result.wasTruncated).toBe(false)
  })

  it('should throw error when neither dependencies nor devDependencies exist', () => {
    const content = JSON.stringify({ name: 'empty-project', version: '1.0.0' })

    expect(() => parsePackageJson(content)).toThrow('No dependencies found')
  })

  it('should throw error for invalid JSON string', () => {
    expect(() => parsePackageJson('not valid json {')).toThrow('Invalid JSON')
  })

  it('should throw error when both dependencies objects are empty', () => {
    const content = JSON.stringify({
      dependencies: {},
      devDependencies: {},
    })

    expect(() => parsePackageJson(content)).toThrow('No dependencies found')
  })

  it('should throw error when dependencies is empty and devDependencies is missing', () => {
    const content = JSON.stringify({ dependencies: {} })

    expect(() => parsePackageJson(content)).toThrow('No dependencies found')
  })

  it('should cap at 50 dependencies and set wasTruncated to true', () => {
    const dependencies: Record<string, string> = {}
    for (let i = 0; i < 40; i++) {
      dependencies[`dep-${i}`] = `^1.0.${i}`
    }
    const devDependencies: Record<string, string> = {}
    for (let i = 0; i < 20; i++) {
      devDependencies[`dev-dep-${i}`] = `^2.0.${i}`
    }

    const content = JSON.stringify({ dependencies, devDependencies })
    const result = parsePackageJson(content)

    expect(result.dependencies).toHaveLength(50)
    expect(result.wasTruncated).toBe(true)
  })

  it('should not truncate when exactly 50 dependencies', () => {
    const dependencies: Record<string, string> = {}
    for (let i = 0; i < 50; i++) {
      dependencies[`dep-${i}`] = `^1.0.${i}`
    }

    const content = JSON.stringify({ dependencies })
    const result = parsePackageJson(content)

    expect(result.dependencies).toHaveLength(50)
    expect(result.wasTruncated).toBe(false)
  })

  it('should preserve version strings correctly (^, ~, *, ranges)', () => {
    const content = JSON.stringify({
      dependencies: {
        'pkg-caret': '^1.2.3',
        'pkg-tilde': '~4.5.6',
        'pkg-star': '*',
        'pkg-range': '>=1.0.0 <2.0.0',
        'pkg-exact': '3.0.0',
        'pkg-latest': 'latest',
      },
    })

    const result = parsePackageJson(content)

    expect(result.dependencies).toEqual([
      { name: 'pkg-caret', version: '^1.2.3', type: 'dependency' },
      { name: 'pkg-tilde', version: '~4.5.6', type: 'dependency' },
      { name: 'pkg-star', version: '*', type: 'dependency' },
      { name: 'pkg-range', version: '>=1.0.0 <2.0.0', type: 'dependency' },
      { name: 'pkg-exact', version: '3.0.0', type: 'dependency' },
      { name: 'pkg-latest', version: 'latest', type: 'dependency' },
    ])
    expect(result.wasTruncated).toBe(false)
  })

  it('should list dependencies before devDependencies', () => {
    const content = JSON.stringify({
      devDependencies: { vitest: '^1.0.0' },
      dependencies: { express: '^4.0.0' },
    })

    const result = parsePackageJson(content)

    expect(result.dependencies[0].type).toBe('dependency')
    expect(result.dependencies[1].type).toBe('devDependency')
  })
})
