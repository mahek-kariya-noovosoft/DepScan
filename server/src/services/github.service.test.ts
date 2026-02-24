import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchGithubData } from './github.service.js';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  delete process.env.GITHUB_TOKEN;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeRepoResponse(overrides = {}) {
  return {
    stargazers_count: 60_000,
    open_issues_count: 150,
    pushed_at: '2024-11-15T10:00:00Z',
    html_url: 'https://github.com/expressjs/express',
    ...overrides,
  };
}

const REPO_URL = 'https://github.com/expressjs/express';

describe('fetchGithubData', () => {
  it('should return correctly typed data on successful fetch', async () => {
    mockFetch
      // repo info
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeRepoResponse(),
      })
      // contributors
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({
          Link: '<https://api.github.com/repos/expressjs/express/contributors?page=285>; rel="last"',
        }),
        json: async () => [{}],
      })
      // closed issues
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total_count: 5000 }),
      });

    const result = await fetchGithubData('express', REPO_URL);

    expect(result).toEqual({
      contributorCount: 285,
      openIssueCount: 150,
      closedIssueCount: 5000,
      stars: 60_000,
      lastCommitDate: '2024-11-15T10:00:00Z',
      repoUrl: 'https://github.com/expressjs/express',
    });
  });

  it('should construct correct API URLs from repo URL', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeRepoResponse(),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({}),
        json: async () => [{}],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total_count: 0 }),
      });

    await fetchGithubData('express', REPO_URL);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/expressjs/express',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/expressjs/express/contributors?per_page=1&anon=true',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('should use Authorization header when GITHUB_TOKEN is set', async () => {
    process.env.GITHUB_TOKEN = 'ghp_test_token_123';

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeRepoResponse(),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({}),
        json: async () => [{}],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total_count: 0 }),
      });

    await fetchGithubData('express', REPO_URL);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer ghp_test_token_123',
        }),
      }),
    );
  });

  it('should return null when no repoUrl is provided', async () => {
    const result = await fetchGithubData('express');

    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should return null on network timeout', async () => {
    mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

    const result = await fetchGithubData('express', REPO_URL);

    expect(result).toBeNull();
  });

  it('should return null on non-200 repo response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    const result = await fetchGithubData('express', REPO_URL);

    expect(result).toBeNull();
  });

  it('should return null on malformed repo response body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ unexpected: 'shape' }),
    });

    const result = await fetchGithubData('express', REPO_URL);

    expect(result).toBeNull();
  });

  it('should handle repo URL with .git suffix', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeRepoResponse(),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({}),
        json: async () => [{}],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total_count: 0 }),
      });

    await fetchGithubData('express', 'https://github.com/expressjs/express.git');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/expressjs/express',
      expect.any(Object),
    );
  });
});
