export interface GithubData {
  contributorCount: number;
  openIssueCount: number;
  closedIssueCount: number;
  stars: number;
  lastCommitDate: string;
  repoUrl: string;
}

interface GithubRepoResponse {
  stargazers_count?: number;
  open_issues_count?: number;
  pushed_at?: string;
  html_url?: string;
}

const TIMEOUT_MS = 10_000;

function parseOwnerRepo(repoUrl: string): { owner: string; repo: string } | null {
  try {
    const cleaned = repoUrl
      .replace(/\.git$/, '')
      .replace(/\/$/, '');

    const match = cleaned.match(/github\.com[/:]([^/]+)\/([^/]+)/);
    if (!match) {
      return null;
    }

    return { owner: match[1], repo: match[2] };
  } catch {
    return null;
  }
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function parseLinkHeaderLastPage(linkHeader: string): number | null {
  const lastMatch = linkHeader.match(/<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="last"/);
  if (!lastMatch) {
    return null;
  }
  return parseInt(lastMatch[1], 10);
}

export async function fetchGithubData(
  packageName: string,
  repoUrl?: string,
): Promise<GithubData | null> {
  try {
    if (!repoUrl) {
      return null;
    }

    const parsed = parseOwnerRepo(repoUrl);
    if (!parsed) {
      return null;
    }

    const { owner, repo } = parsed;
    const headers = buildHeaders();

    // Fetch repo info
    const repoController = new AbortController();
    const repoTimeoutId = setTimeout(() => repoController.abort(), TIMEOUT_MS);

    const repoResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers, signal: repoController.signal },
    );

    clearTimeout(repoTimeoutId);

    if (!repoResponse.ok) {
      return null;
    }

    const repoData: GithubRepoResponse = await repoResponse.json();

    if (!repoData.pushed_at || !repoData.html_url) {
      return null;
    }

    // Fetch contributor count via Link header pagination
    const contribController = new AbortController();
    const contribTimeoutId = setTimeout(() => contribController.abort(), TIMEOUT_MS);

    const contribResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=1&anon=true`,
      { headers, signal: contribController.signal },
    );

    clearTimeout(contribTimeoutId);

    let contributorCount = 0;
    if (contribResponse.ok) {
      const linkHeader = contribResponse.headers.get('Link');
      if (linkHeader) {
        contributorCount = parseLinkHeaderLastPage(linkHeader) ?? 1;
      } else {
        const contribBody: unknown[] = await contribResponse.json();
        contributorCount = contribBody.length;
      }
    }

    // Fetch closed issues count via search API
    const closedController = new AbortController();
    const closedTimeoutId = setTimeout(() => closedController.abort(), TIMEOUT_MS);

    const closedIssuesResponse = await fetch(
      `https://api.github.com/search/issues?q=repo:${owner}/${repo}+type:issue+state:closed&per_page=1`,
      { headers, signal: closedController.signal },
    );

    clearTimeout(closedTimeoutId);

    let closedIssueCount = 0;
    if (closedIssuesResponse.ok) {
      const closedData = await closedIssuesResponse.json() as { total_count?: number };
      closedIssueCount = closedData.total_count ?? 0;
    }

    return {
      contributorCount,
      openIssueCount: repoData.open_issues_count ?? 0,
      closedIssueCount,
      stars: repoData.stargazers_count ?? 0,
      lastCommitDate: repoData.pushed_at,
      repoUrl: repoData.html_url,
    };
  } catch {
    return null;
  }
}
