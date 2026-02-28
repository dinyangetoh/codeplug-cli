export interface HealthCheckResult {
  available: boolean;
  models: string[];
}

export async function checkOllamaHealth(baseUrl: string): Promise<HealthCheckResult> {
  if (!baseUrl.includes('localhost:11434')) {
    return { available: true, models: [] };
  }

  const tagsUrl = baseUrl.replace(/\/v1\/?$/, '') + '/api/tags';

  try {
    const res = await fetch(tagsUrl);
    if (!res.ok) {
      return { available: false, models: [] };
    }
    const data = (await res.json()) as { models?: Array<{ name: string }> };
    const models = (data.models ?? []).map((m) => m.name);
    return { available: true, models };
  } catch {
    return { available: false, models: [] };
  }
}
