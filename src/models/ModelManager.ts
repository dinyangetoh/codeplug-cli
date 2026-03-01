import { join } from 'node:path';
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import type { ModelTier } from '../config/types.js';
import { getModelSpec, type ModelRole, type ModelSpec } from './ModelRegistry.js';

const DEFAULT_CACHE_DIR = join(homedir(), '.codeplug', 'models');

export interface ModelManagerOptions {
  onLoaded?: (description: string) => void;
}

export class ModelManager {
  private loadedModel: { role: ModelRole; pipeline: unknown } | null = null;
  private cacheDir: string;
  private tier: ModelTier;
  private onLoaded?: (description: string) => void;

  constructor(tier: ModelTier, cacheDir?: string, opts?: ModelManagerOptions) {
    this.tier = tier;
    this.cacheDir = cacheDir ?? process.env['CODEPLUG_MODEL_CACHE'] ?? DEFAULT_CACHE_DIR;
    this.onLoaded = opts?.onLoaded;
  }

  async ensureCacheDir(): Promise<void> {
    if (!existsSync(this.cacheDir)) {
      await mkdir(this.cacheDir, { recursive: true });
    }
  }

  async loadModel(role: ModelRole): Promise<unknown> {
    if (this.loadedModel?.role === role) {
      return this.loadedModel.pipeline;
    }

    if (this.loadedModel) {
      await this.disposeModel();
    }

    const spec = getModelSpec(role, this.tier);
    await this.ensureCacheDir();

    const useCallback = !!this.onLoaded;
    let spinner: { succeed: (t?: string) => void; fail: (t?: string) => void } | null = null;
    if (!useCallback) {
      const ora = (await import('ora')).default;
      spinner = ora(`Loading ${spec.description} (~${spec.sizeEstimateMb}MB)...`).start();
    }

    try {
      const { pipeline, env } = await import('@huggingface/transformers');

      env.cacheDir = this.cacheDir;
      env.allowLocalModels = true;

      const taskMap: Record<ModelRole, string> = {
        classifier: 'feature-extraction',
        summarizer: 'summarization',
        extractor: 'question-answering',
        ner: 'token-classification',
        zeroShot: 'zero-shot-classification',
        sentenceSimilarity: 'feature-extraction',
      };

      const pipe = await pipeline(taskMap[role] as never, spec.huggingFaceId, {
        dtype: spec.dtype,
      });

      this.loadedModel = { role, pipeline: pipe };
      if (useCallback && this.onLoaded) {
        this.onLoaded(spec.description);
      } else if (spinner) {
        spinner.succeed(`Loaded ${spec.description}`);
      }
      return pipe;
    } catch (err) {
      if (spinner) spinner.fail(`Failed to load ${spec.description}`);
      throw err;
    }
  }

  async disposeModel(): Promise<void> {
    if (this.loadedModel) {
      const pipe = this.loadedModel.pipeline as { dispose?: () => Promise<void> };
      if (typeof pipe.dispose === 'function') {
        await pipe.dispose();
      }
      this.loadedModel = null;
    }
  }

  getSpec(role: ModelRole): ModelSpec {
    return getModelSpec(role, this.tier);
  }

  isModelLoaded(): boolean {
    return this.loadedModel !== null;
  }

  getCurrentRole(): ModelRole | null {
    return this.loadedModel?.role ?? null;
  }
}
