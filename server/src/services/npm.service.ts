export interface NpmData {
  lastPublishDate: string;
  weeklyDownloads: number;
  license: string | null;
  latestVersion: string;
  description: string;
  repositoryUrl?: string;
}

interface NpmRegistryResponse {
  time?: Record<string, string>;
  license?: string;
  description?: string;
  'dist-tags'?: { latest?: string };
  repository?: { type?: string; url?: string } | string;
}

interface NpmDownloadsResponse {
  downloads?: number;
}

const TIMEOUT_MS = 10_000;

export async function fetchNpmData(packageName: string): Promise<NpmData | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const registryResponse = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(packageName)}`,
      { signal: controller.signal },
    );

    clearTimeout(timeoutId);

    if (!registryResponse.ok) {
      return null;
    }

    const registryData: NpmRegistryResponse = await registryResponse.json();

    const latestVersion = registryData['dist-tags']?.latest;
    if (!latestVersion || !registryData.time) {
      return null;
    }

    const lastPublishDate = registryData.time[latestVersion];
    if (!lastPublishDate) {
      return null;
    }

    const downloadsController = new AbortController();
    const downloadsTimeoutId = setTimeout(() => downloadsController.abort(), TIMEOUT_MS);

    const downloadsResponse = await fetch(
      `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`,
      { signal: downloadsController.signal },
    );

    clearTimeout(downloadsTimeoutId);

    let weeklyDownloads = 0;
    if (downloadsResponse.ok) {
      const downloadsData: NpmDownloadsResponse = await downloadsResponse.json();
      weeklyDownloads = downloadsData.downloads ?? 0;
    }

    let repositoryUrl: string | undefined;
    if (typeof registryData.repository === 'object' && registryData.repository?.url) {
      repositoryUrl = registryData.repository.url
        .replace(/^git\+/, '')
        .replace(/\.git$/, '');
    } else if (typeof registryData.repository === 'string') {
      repositoryUrl = registryData.repository;
    }

    return {
      lastPublishDate,
      weeklyDownloads,
      license: registryData.license ?? null,
      latestVersion,
      description: registryData.description ?? '',
      repositoryUrl,
    };
  } catch {
    return null;
  }
}
