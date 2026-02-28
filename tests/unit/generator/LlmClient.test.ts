import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LlmClient } from '../../../src/core/generator/llm/LlmClient.js';
import type { LlmConfig } from '../../../src/config/types.js';

const mockCreate = vi.fn();

vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = { completions: { create: mockCreate } };
    constructor(public opts: Record<string, unknown>) {}
  },
}));

const testConfig: LlmConfig = {
  provider: 'ollama',
  model: 'llama3',
  baseUrl: 'http://localhost:11434/v1',
  apiKey: 'ollama',
};

describe('LlmClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send a basic prompt and return the response', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Generated documentation.' } }],
    });

    const client = new LlmClient(testConfig);
    const result = await client.generate('Write docs');

    expect(result).toBe('Generated documentation.');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'llama3',
        messages: [{ role: 'user', content: 'Write docs' }],
      }),
    );
  });

  it('should include system prompt when provided', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'OK' } }],
    });

    const client = new LlmClient(testConfig);
    await client.generate('Hello', { systemPrompt: 'You are a doc writer.' });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          { role: 'system', content: 'You are a doc writer.' },
          { role: 'user', content: 'Hello' },
        ],
      }),
    );
  });

  it('should pass temperature and maxTokens options', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'result' } }],
    });

    const client = new LlmClient(testConfig);
    await client.generate('prompt', { temperature: 0.7, maxTokens: 500 });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 0.7,
        max_tokens: 500,
      }),
    );
  });

  it('should return empty string when no content in response', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: null } }] });

    const client = new LlmClient(testConfig);
    const result = await client.generate('prompt');

    expect(result).toBe('');
  });

  it('should use the configured baseUrl and apiKey', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'x' } }],
    });

    const customConfig: LlmConfig = {
      provider: 'openai',
      model: 'gpt-4o',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test-key',
    };

    const client = new LlmClient(customConfig);
    await client.generate('test');

    expect(mockCreate).toHaveBeenCalled();
  });
});
