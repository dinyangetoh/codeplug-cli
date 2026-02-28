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
    expect(Object.keys(specs)).toEqual(['classifier', 'summarizer', 'extractor', 'ner']);
  });

  it('should estimate default tier disk at ~1.1GB', () => {
    const total = getTotalDiskEstimate('default');
    expect(total).toBeGreaterThan(1000);
    expect(total).toBeLessThan(1200);
  });

  it('should estimate lite tier disk at ~420MB', () => {
    const total = getTotalDiskEstimate('lite');
    expect(total).toBeGreaterThan(350);
    expect(total).toBeLessThan(500);
  });
});
