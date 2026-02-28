import type { ModelManager } from '../../../models/ModelManager.js';

export interface NerEntity {
  entity: string;
  type: string;
  score: number;
}

interface RawNerResult {
  word: string;
  entity_group?: string;
  entity?: string;
  score: number;
}

export class NerPipeline {
  constructor(private modelManager: ModelManager) {}

  async extractEntities(text: string): Promise<NerEntity[]> {
    const pipe = (await this.modelManager.loadModel('ner')) as (
      input: string
    ) => Promise<RawNerResult[]>;

    const results = await pipe(text);
    await this.modelManager.disposeModel();

    return results.map((r) => ({
      entity: r.word,
      type: r.entity_group ?? r.entity ?? 'UNKNOWN',
      score: r.score,
    }));
  }
}
