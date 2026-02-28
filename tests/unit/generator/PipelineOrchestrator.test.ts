import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PipelineOrchestrator } from '../../../src/core/generator/PipelineOrchestrator.js';
import type { ModelManager } from '../../../src/models/ModelManager.js';

function createMockModelManager() {
  const mockSummarizer = vi.fn().mockResolvedValue([{ summary_text: 'A concise summary.' }]);
  const mockExtractor = vi.fn().mockResolvedValue({ answer: 'React', score: 0.95 });
  const mockNer = vi.fn().mockResolvedValue([
    { word: 'React', entity_group: 'FRAMEWORK', score: 0.98 },
    { word: 'TypeScript', entity_group: 'LANGUAGE', score: 0.96 },
  ]);

  const pipelineMap: Record<string, unknown> = {
    summarizer: mockSummarizer,
    extractor: mockExtractor,
    ner: mockNer,
  };

  const manager = {
    loadModel: vi.fn(async (role: string) => pipelineMap[role]),
    disposeModel: vi.fn(async () => {}),
  } as unknown as ModelManager;

  return { manager, mockSummarizer, mockExtractor, mockNer };
}

describe('PipelineOrchestrator', () => {
  let mock: ReturnType<typeof createMockModelManager>;
  let orchestrator: PipelineOrchestrator;

  beforeEach(() => {
    mock = createMockModelManager();
    orchestrator = new PipelineOrchestrator(mock.manager);
  });

  it('should run all three pipeline stages sequentially', async () => {
    const result = await orchestrator.run('Sample code text', ['What framework?']);

    expect(result.summary).toBe('A concise summary.');
    expect(result.extractions).toEqual(['React']);
    expect(result.entities).toEqual([
      { entity: 'React', type: 'FRAMEWORK', score: 0.98 },
      { entity: 'TypeScript', type: 'LANGUAGE', score: 0.96 },
    ]);
  });

  it('should load and dispose models for each stage', async () => {
    await orchestrator.run('text', ['q1']);

    expect(mock.manager.loadModel).toHaveBeenCalledWith('summarizer');
    expect(mock.manager.loadModel).toHaveBeenCalledWith('extractor');
    expect(mock.manager.loadModel).toHaveBeenCalledWith('ner');
    expect(mock.manager.disposeModel).toHaveBeenCalledTimes(3);
  });

  it('should handle multiple extraction questions', async () => {
    const result = await orchestrator.run('text', ['q1', 'q2', 'q3']);

    expect(result.extractions).toHaveLength(3);
    expect(mock.mockExtractor).toHaveBeenCalledTimes(3);
  });

  it('should handle empty text gracefully', async () => {
    const result = await orchestrator.run('', []);

    expect(result.summary).toBe('A concise summary.');
    expect(result.extractions).toEqual([]);
    expect(result.entities).toHaveLength(2);
  });

  it('should call summarizer before extractor before NER', async () => {
    const callOrder: string[] = [];
    const mgr = mock.manager as unknown as { loadModel: ReturnType<typeof vi.fn> };
    mgr.loadModel.mockImplementation(async (role: string) => {
      callOrder.push(role);
      const pipeMap: Record<string, unknown> = {
        summarizer: vi.fn().mockResolvedValue([{ summary_text: 'sum' }]),
        extractor: vi.fn().mockResolvedValue({ answer: 'ans', score: 0.9 }),
        ner: vi.fn().mockResolvedValue([]),
      };
      return pipeMap[role];
    });

    await orchestrator.run('text', ['q']);

    expect(callOrder).toEqual(['summarizer', 'extractor', 'ner']);
  });
});
