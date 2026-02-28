import type { ModelManager } from '../../../models/ModelManager.js';

export class ExtractionPipeline {
  constructor(private modelManager: ModelManager) {}

  async extract(question: string, context: string): Promise<string> {
    const pipe = (await this.modelManager.loadModel('extractor')) as (
      input: { question: string; context: string }
    ) => Promise<{ answer: string; score: number }>;

    const result = await pipe({ question, context });
    await this.modelManager.disposeModel();

    return result.answer ?? '';
  }
}
