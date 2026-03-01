import type { ModelManager } from '../../models/ModelManager.js';

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export class SemanticCoherenceService {
  constructor(private modelManager: ModelManager) {}

  async checkWithZeroShot(exportName: string, fileContext: string): Promise<number> {
    const pipe = (await this.modelManager.loadModel('zeroShot')) as (
      text: string,
      candidateLabels: string[]
    ) => Promise<{ labels: string[]; scores: number[] }>;

    const sequence = `Export: ${exportName}. File context: ${fileContext.slice(0, 256)}`;
    const result = await pipe(sequence, ['related', 'unrelated']);
    const relatedIdx = result.labels?.indexOf('related') ?? 0;
    return result.scores?.[relatedIdx] ?? 0.5;
  }

  async checkWithSentenceSimilarity(exportName: string, fileContext: string): Promise<number> {
    const pipe = (await this.modelManager.loadModel('sentenceSimilarity')) as (
      text: string,
      options?: { pooling?: string; normalize?: boolean }
    ) => Promise<{ data: Float32Array }>;

    const exportSentence = `Main export: ${exportName}`;
    const contextSentence = fileContext.slice(0, 512);
    const [tensorA, tensorB] = await Promise.all([
      pipe(exportSentence, { pooling: 'mean', normalize: true }),
      pipe(contextSentence, { pooling: 'mean', normalize: true }),
    ]);
    const a = Array.from(tensorA?.data ?? []);
    const b = Array.from(tensorB?.data ?? []);
    return cosineSimilarity(a, b);
  }

  async checkExportFitsContext(exportName: string, fileStem: string, fileSnippet?: string): Promise<boolean> {
    try {
      const context = fileSnippet ? `${fileStem}: ${fileSnippet}` : fileStem;
      const score = await this.checkWithZeroShot(exportName, context);
      return score >= 0.5;
    } catch {
      return true;
    }
  }
}
