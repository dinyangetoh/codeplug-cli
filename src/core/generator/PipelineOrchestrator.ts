import type { ModelManager } from '../../models/ModelManager.js';
import type { PipelineResult } from '../../config/types.js';
import { SummarizationPipeline } from './pipelines/SummarizationPipeline.js';
import { ExtractionPipeline } from './pipelines/ExtractionPipeline.js';
import { NerPipeline } from './pipelines/NerPipeline.js';

export class PipelineOrchestrator {
  private summarizer: SummarizationPipeline;
  private extractor: ExtractionPipeline;
  private ner: NerPipeline;

  constructor(private modelManager: ModelManager) {
    this.summarizer = new SummarizationPipeline(modelManager);
    this.extractor = new ExtractionPipeline(modelManager);
    this.ner = new NerPipeline(modelManager);
  }

  async run(text: string, questions: string[]): Promise<PipelineResult> {
    const summary = await this.summarizer.summarize(text);

    const extractions: string[] = [];
    for (const q of questions) {
      const answer = await this.extractor.extract(q, text);
      extractions.push(answer);
    }

    const entities = await this.ner.extractEntities(text);

    return { summary, extractions, entities };
  }
}
