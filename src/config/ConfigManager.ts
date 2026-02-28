import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CodePlugConfig } from './types.js';
import { DEFAULT_CONFIG, PROVIDER_PRESETS, CODEPLUG_DIR, CONFIG_FILE } from './defaults.js';

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
      this.config = { ...DEFAULT_CONFIG, ...parsed };
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
}
