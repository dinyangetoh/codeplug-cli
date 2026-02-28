import { PROVIDER_PRESETS } from '../../../config/defaults.js';

export { PROVIDER_PRESETS };

export function getPreset(name: string): { baseUrl: string; defaultModel: string } | undefined {
  return PROVIDER_PRESETS[name];
}

export function listProviders(): string[] {
  return Object.keys(PROVIDER_PRESETS);
}
