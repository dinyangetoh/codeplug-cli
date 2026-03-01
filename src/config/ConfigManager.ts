import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CodePlugConfig } from './types.js';
import {
  DEFAULT_CONFIG,
  DEFAULT_STRUCTURE,
  DEFAULT_ANALYSIS,
  DEFAULT_SCORING,
  DEFAULT_CONVENTION,
  DEFAULT_DRIFT,
  DEFAULT_DOCS,
  DEFAULT_NAMING,
  PROVIDER_PRESETS,
  CODEPLUG_DIR,
  CONFIG_FILE,
} from './defaults.js';

function mergeSection<T>(defaults: T, user?: Partial<T> | null): T {
  if (!user) return structuredClone(defaults);
  if (Array.isArray(defaults)) {
    return (user as T) ?? structuredClone(defaults);
  }
  if (typeof defaults === 'object' && defaults !== null) {
    const out = { ...defaults };
    for (const k of Object.keys(user) as (keyof T)[]) {
      const dv = (defaults as Record<string, unknown>)[k as string];
      const uv = (user as Record<string, unknown>)[k as string];
      if (typeof dv === 'object' && dv !== null && !Array.isArray(dv) && typeof uv === 'object' && uv !== null) {
        (out as Record<string, unknown>)[k as string] = mergeSection(dv, uv);
      } else if (uv !== undefined) {
        (out as Record<string, unknown>)[k as string] = structuredClone(uv);
      }
    }
    return out as T;
  }
  return (user as T) ?? structuredClone(defaults);
}

export class ConfigManager {
  private config: CodePlugConfig;
  private configPath: string;

  constructor(private projectRoot: string) {
    this.config = structuredClone(DEFAULT_CONFIG);
    this.configPath = join(projectRoot, CODEPLUG_DIR, CONFIG_FILE);
  }

  async load(): Promise<void> {
    if (existsSync(this.configPath)) {
      const raw = await readFile(this.configPath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<CodePlugConfig>;
      this.config = {
        llm: { ...DEFAULT_CONFIG.llm, ...parsed.llm },
        models: { ...DEFAULT_CONFIG.models, ...parsed.models },
        structure: mergeSection(DEFAULT_STRUCTURE as CodePlugConfig['structure'], parsed.structure) as CodePlugConfig['structure'],
        analysis: mergeSection(DEFAULT_ANALYSIS as CodePlugConfig['analysis'], parsed.analysis) as CodePlugConfig['analysis'],
        scoring: mergeSection(DEFAULT_SCORING as CodePlugConfig['scoring'], parsed.scoring) as CodePlugConfig['scoring'],
        convention: mergeSection(DEFAULT_CONVENTION as CodePlugConfig['convention'], parsed.convention) as CodePlugConfig['convention'],
        drift: mergeSection(DEFAULT_DRIFT as CodePlugConfig['drift'], parsed.drift) as CodePlugConfig['drift'],
        docs: mergeSection(DEFAULT_DOCS as CodePlugConfig['docs'], parsed.docs) as CodePlugConfig['docs'],
        naming: mergeSection(DEFAULT_NAMING as CodePlugConfig['naming'], parsed.naming) as CodePlugConfig['naming'],
      };
    }
  }

  async save(): Promise<void> {
    const dir = join(this.projectRoot, CODEPLUG_DIR);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    await writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
  }

  set(key: string, value: string): void {
    const parts = key.split('.');
    if (parts.length !== 2) {
      throw new Error(`Invalid config key: ${key}. Use format "section.key" (e.g. llm.provider).`);
    }

    const [section, prop] = parts as [keyof CodePlugConfig, string];

    if (!(section in this.config)) {
      throw new Error(`Unknown config section: ${section}`);
    }

    if (section === 'llm' && prop === 'provider' && value in PROVIDER_PRESETS) {
      const preset = PROVIDER_PRESETS[value];
      this.config.llm.provider = value;
      this.config.llm.baseUrl = preset.baseUrl;
      this.config.llm.model = preset.defaultModel;
      return;
    }

    const sectionObj = this.config[section] as unknown as Record<string, unknown>;
    sectionObj[prop] = value;
  }

  get(key: string): unknown {
    const parts = key.split('.');
    if (parts.length === 1) {
      return this.config[key as keyof CodePlugConfig];
    }
    const [section, prop] = parts;
    const sectionObj = this.config[section as keyof CodePlugConfig];
    if (typeof sectionObj === 'object' && sectionObj !== null) {
      return (sectionObj as unknown as Record<string, unknown>)[prop];
    }
    return undefined;
  }

  getAll(): CodePlugConfig {
    return structuredClone(this.config);
  }

  getLlmConfig() {
    return structuredClone(this.config.llm);
  }

  getModelTier() {
    return this.config.models.tier;
  }

  getStructureConfig() {
    return structuredClone(this.config.structure ?? DEFAULT_STRUCTURE);
  }

  getAnalysisConfig() {
    return structuredClone(this.config.analysis ?? DEFAULT_ANALYSIS);
  }

  getScoringConfig() {
    return structuredClone(this.config.scoring ?? DEFAULT_SCORING);
  }

  getConventionConfig() {
    return structuredClone(this.config.convention ?? DEFAULT_CONVENTION);
  }

  getDriftConfig() {
    return structuredClone(this.config.drift ?? DEFAULT_DRIFT);
  }

  getDocsConfig() {
    return structuredClone(this.config.docs ?? DEFAULT_DOCS);
  }

  getNamingConfig() {
    return structuredClone(this.config.naming ?? DEFAULT_NAMING);
  }
}
