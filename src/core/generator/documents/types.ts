import type { AnalysisResult, Convention } from '../../../config/types.js';
import type { LlmClient } from '../llm/LlmClient.js';

export interface GenerationContext {
  analysis: AnalysisResult;
  conventions: Convention[];
  projectRoot: string;
  audience: string;
  style: string;
  llmAvailable: boolean;
  llmClient?: LlmClient;
}

export interface DocumentGenerator {
  generate(context: GenerationContext): Promise<string>;
}
