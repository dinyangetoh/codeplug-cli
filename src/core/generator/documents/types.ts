import type { AnalysisResult, Convention, DocsConfig } from '../../../config/types.js';
import type { LlmClient } from '../llm/LlmClient.js';

export interface PackageMetadata {
  description?: string;
  name?: string;
  scripts?: Record<string, string>;
  bin?: string | Record<string, string>;
  keywords?: string[];
  engines?: Record<string, string>;
}

export interface GenerationContext {
  analysis: AnalysisResult;
  conventions: Convention[];
  projectRoot: string;
  audience: string;
  style: string;
  llmAvailable: boolean;
  llmClient?: LlmClient;
  existingDoc?: string;
  packageMetadata?: PackageMetadata;
  docsConfig?: DocsConfig;
}

export type LlmRequiredContext = GenerationContext & { llmClient: LlmClient };

export interface DocumentGenerator {
  generate(context: GenerationContext): Promise<string>;
}
