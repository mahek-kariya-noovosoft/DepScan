import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchNpmData } from './npm.service.js';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeRegistryResponse(overrides = {}) {
  return {
    'dist-tags': { latest: '4.18.2' },
    time: { '4.18.2': '2024-10-01T00:00:00.000Z' },
    license: 'MIT',
    description: 'Fast web framework',
    ...overrides,
  };
}

function makeDownloadsResponse(overrides = {}) {
  return {
    downloads: 25_000_000,
    ...overrides,
  };
}

describe('fetchNpmData', () => {
  it('should return correctly typed data on successful fetch', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeRegistryResponse(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeDownloadsResponse(),
      });

    const result = await fetchNpmData('express');

    expect(result).toEqual({
      lastPublishDate: '2024-10-01T00:00:00.000Z',
      weeklyDownloads: 25_000_000,
      license: 'MIT',
      latestVersion: '4.18.2',
      description: 'Fast web framework',
      repositoryUrl: undefined,
    });
  });

  it('should construct the correct registry and downloads URLs', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeRegistryResponse(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeDownloadsResponse(),
      });

    await fetchNpmData('express');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://registry.npmjs.org/express',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.npmjs.org/downloads/point/last-week/express',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('should encode scoped package names in the URL', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeRegistryResponse(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeDownloadsResponse(),
      });

    await fetchNpmData('@scope/package');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://registry.npmjs.org/%40scope%2Fpackage',
      expect.any(Object),
    );
  });

  it('should return null on network timeout', async () => {
    mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

    const result = await fetchNpmData('express');

    expect(result).toBeNull();
  });

  it('should return null on non-200 registry response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    const result = await fetchNpmData('nonexistent-pkg');

    expect(result).toBeNull();
  });

  it('should return null on malformed registry response body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ unexpected: 'shape' }),
    });

    const result = await fetchNpmData('express');

    expect(result).toBeNull();
  });
});
