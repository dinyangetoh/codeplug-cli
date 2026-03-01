import { describe, it, expect } from 'vitest';
import { getModelSpec, getAllModelSpecs, getTotalDiskEstimate } from '../../../src/models/ModelRegistry.js';

describe('ModelRegistry', () => {
  it('should return default tier models', () => {
    const classifier = getModelSpec('classifier', 'default');
    expect(classifier.huggingFaceId).toBe('microsoft/codebert-base');
    expect(classifier.sizeEstimateMb).toBe(130);
  });

  it('should return lite tier models', () => {
    const classifier = getModelSpec('classifier', 'lite');
    expect(classifier.huggingFaceId).toBe('huggingface/CodeBERTa-small-v1');
    expect(classifier.sizeEstimateMb).toBe(35);
  });

  it('should return all specs for a tier', () => {
    const specs = getAllModelSpecs('default');
    expect(Object.keys(specs).sort()).toEqual(
      ['classifier', 'extractor', 'ner', 'sentenceSimilarity', 'summarizer', 'zeroShot'].sort()
    );
  });

  it('should return zeroShot and sentenceSimilarity specs', () => {
    const zeroShot = getModelSpec('zeroShot', 'default');
    expect(zeroShot.huggingFaceId).toBe('Xenova/distilbert-base-uncased-mnli');
    const sentenceSim = getModelSpec('sentenceSimilarity', 'default');
    expect(sentenceSim.huggingFaceId).toBe('Xenova/all-MiniLM-L6-v2');
  });

  it('should estimate default tier disk', () => {
    const total = getTotalDiskEstimate('default');
    expect(total).toBeGreaterThan(1100);
  });

  it('should estimate lite tier disk', () => {
    const total = getTotalDiskEstimate('lite');
    expect(total).toBeGreaterThan(400);
  });
});
