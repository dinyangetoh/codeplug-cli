export interface GatedResult {
  classification: 'following' | 'ambiguous' | 'drifting';
  confidence: number;
  needsReview: boolean;
}

const CONFIDENCE_THRESHOLD = 0.7;

export class ConfidenceGate {
  gate(classification: string, confidence: number): GatedResult {
    return {
      classification: classification as GatedResult['classification'],
      confidence,
      needsReview: confidence < CONFIDENCE_THRESHOLD,
    };
  }
}
