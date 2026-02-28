import type { ModelManager } from '../../../models/ModelManager.js';

export class SummarizationPipeline {
  constructor(private modelManager: ModelManager) {}

  async summarize(text: string): Promise<string> {
    const pipe = (await this.modelManager.loadModel('summarizer')) as (
      input: string,
      options?: { max_length?: number; min_length?: number }
    ) => Promise<Array<{ summary_text: string }>>;

    const results = await pipe(text, { max_length: 150, min_length: 30 });
    await this.modelManager.disposeModel();

    return results[0]?.summary_text ?? '';
  }
}
