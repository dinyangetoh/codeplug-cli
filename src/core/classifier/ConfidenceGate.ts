import { DEFAULT_DRIFT } from '../../config/defaults.js';

export interface GatedResult {
  classification: 'following' | 'ambiguous' | 'drifting';
  confidence: number;
  needsReview: boolean;
}

export class ConfidenceGate {
  private threshold: number;

  constructor(threshold?: number) {
    this.threshold = threshold ?? DEFAULT_DRIFT.confidenceThreshold ?? 0.7;
  }

  gate(classification: string, confidence: number): GatedResult {
    return {
      classification: classification as GatedResult['classification'],
      confidence,
      needsReview: confidence < this.threshold,
    };
  }
}
