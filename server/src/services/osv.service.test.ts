import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchOsvData } from './osv.service.js';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeOsvResponse(overrides = {}) {
  return {
    vulns: [
      {
        id: 'GHSA-abc-123',
        summary: 'Prototype pollution vulnerability',
        database_specific: { severity: 'HIGH' },
      },
      {
        id: 'CVE-2024-9999',
        summary: 'XSS in template rendering',
        severity: [{ type: 'CVSS_V3', score: 'CRITICAL' }],
      },
    ],
    ...overrides,
  };
}

describe('fetchOsvData', () => {
  it('should return correctly typed data on successful fetch', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeOsvResponse(),
    });

    const result = await fetchOsvData('lodash', '4.17.20');

    expect(result).toEqual({
      vulnerabilities: [
        { id: 'GHSA-abc-123', summary: 'Prototype pollution vulnerability', severity: 'HIGH' },
        { id: 'CVE-2024-9999', summary: 'XSS in template rendering', severity: 'CRITICAL' },
      ],
    });
  });

  it('should strip version prefix before querying', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeOsvResponse({ vulns: [] }),
    });

    await fetchOsvData('lodash', '^4.17.20');

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.version).toBe('4.17.20');
  });

  it('should strip tilde version prefix before querying', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeOsvResponse({ vulns: [] }),
    });

    await fetchOsvData('lodash', '~4.17.20');

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.version).toBe('4.17.20');
  });

  it('should send correct POST body with package name and ecosystem', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeOsvResponse({ vulns: [] }),
    });

    await fetchOsvData('express', '4.18.2');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.osv.dev/v1/query',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package: { name: 'express', ecosystem: 'npm' },
          version: '4.18.2',
        }),
      }),
    );
  });

  it('should return null on network timeout', async () => {
    mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

    const result = await fetchOsvData('lodash', '4.17.20');

    expect(result).toBeNull();
  });

  it('should return null on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const result = await fetchOsvData('lodash', '4.17.20');

    expect(result).toBeNull();
  });

  it('should return empty vulnerabilities array when response has no vulns', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const result = await fetchOsvData('express', '4.18.2');

    expect(result).toEqual({ vulnerabilities: [] });
  });
});
