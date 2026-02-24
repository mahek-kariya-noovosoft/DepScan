export interface OsvVulnerability {
  id: string;
  summary: string;
  severity: string;
}

export interface OsvData {
  vulnerabilities: OsvVulnerability[];
}

interface OsvApiVulnerability {
  id?: string;
  summary?: string;
  database_specific?: { severity?: string };
  severity?: Array<{ type?: string; score?: string }>;
}

interface OsvApiResponse {
  vulns?: OsvApiVulnerability[];
}

const TIMEOUT_MS = 10_000;

function stripVersionPrefix(version: string): string {
  return version.replace(/^[~^>=]+/, '');
}

function extractSeverity(vuln: OsvApiVulnerability): string {
  if (vuln.database_specific?.severity) {
    return vuln.database_specific.severity;
  }

  if (vuln.severity && vuln.severity.length > 0) {
    return vuln.severity[0].score ?? 'UNKNOWN';
  }

  return 'UNKNOWN';
}

export async function fetchOsvData(
  packageName: string,
  version: string,
): Promise<OsvData | null> {
  try {
    const cleanVersion = stripVersionPrefix(version);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch('https://api.osv.dev/v1/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        package: {
          name: packageName,
          ecosystem: 'npm',
        },
        version: cleanVersion,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data: OsvApiResponse = await response.json();

    const vulnerabilities: OsvVulnerability[] = (data.vulns ?? []).map((vuln) => ({
      id: vuln.id ?? 'UNKNOWN',
      summary: vuln.summary ?? 'No summary available',
      severity: extractSeverity(vuln),
    }));

    return { vulnerabilities };
  } catch {
    return null;
  }
}
