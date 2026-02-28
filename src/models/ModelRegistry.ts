import type { ModelTier } from '../config/types.js';

export type ModelRole = 'classifier' | 'summarizer' | 'extractor' | 'ner';

export interface ModelSpec {
  huggingFaceId: string;
  dtype: 'q4' | 'q8' | 'fp32';
  sizeEstimateMb: number;
  description: string;
}

const MODEL_REGISTRY: Record<ModelRole, Record<ModelTier, ModelSpec>> = {
  classifier: {
    default: {
      huggingFaceId: 'microsoft/codebert-base',
      dtype: 'q8',
      sizeEstimateMb: 130,
      description: 'CodeBERT-base for code pattern classification',
    },
    lite: {
      huggingFaceId: 'huggingface/CodeBERTa-small-v1',
      dtype: 'q8',
      sizeEstimateMb: 35,
      description: 'CodeBERTa-small for lightweight classification',
    },
  },
  summarizer: {
    default: {
      huggingFaceId: 'facebook/bart-large-cnn',
      dtype: 'q4',
      sizeEstimateMb: 800,
      description: 'BART-large-CNN for abstractive summarization',
    },
    lite: {
      huggingFaceId: 'sshleifer/distilbart-cnn-6-6',
      dtype: 'q4',
      sizeEstimateMb: 284,
      description: 'DistilBART for lightweight summarization',
    },
  },
  extractor: {
    default: {
      huggingFaceId: 'distilbert-base-cased-distilled-squad',
      dtype: 'q8',
      sizeEstimateMb: 66,
      description: 'DistilBERT for Q&A extraction',
    },
    lite: {
      huggingFaceId: 'distilbert-base-cased-distilled-squad',
      dtype: 'q8',
      sizeEstimateMb: 66,
      description: 'DistilBERT for Q&A extraction (same in both tiers)',
    },
  },
  ner: {
    default: {
      huggingFaceId: 'dslim/bert-base-NER',
      dtype: 'q8',
      sizeEstimateMb: 110,
      description: 'BERT-base-NER for entity recognition',
    },
    lite: {
      huggingFaceId: 'dslim/distilbert-NER',
      dtype: 'q8',
      sizeEstimateMb: 35,
      description: 'DistilBERT-NER for lightweight entity recognition',
    },
  },
};

export function getModelSpec(role: ModelRole, tier: ModelTier): ModelSpec {
  return MODEL_REGISTRY[role][tier];
}

export function getAllModelSpecs(tier: ModelTier): Record<ModelRole, ModelSpec> {
  const result = {} as Record<ModelRole, ModelSpec>;
  for (const role of Object.keys(MODEL_REGISTRY) as ModelRole[]) {
    result[role] = MODEL_REGISTRY[role][tier];
  }
  return result;
}

export function getTotalDiskEstimate(tier: ModelTier): number {
  let total = 0;
  for (const role of Object.keys(MODEL_REGISTRY) as ModelRole[]) {
    total += MODEL_REGISTRY[role][tier].sizeEstimateMb;
  }
  return total;
}
