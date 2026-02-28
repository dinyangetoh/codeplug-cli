import type { CodePlugConfig } from './types.js';

export const DEFAULT_CONFIG: CodePlugConfig = {
  llm: {
    provider: 'ollama',
    model: 'llama3',
    baseUrl: 'http://localhost:11434/v1',
    apiKey: 'ollama',
  },
  models: {
    tier: 'default',
  },
};

export const PROVIDER_PRESETS: Record<string, { baseUrl: string; defaultModel: string }> = {
  ollama: { baseUrl: 'http://localhost:11434/v1', defaultModel: 'llama3' },
  openai: { baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o' },
  anthropic: { baseUrl: 'https://api.anthropic.com/v1/', defaultModel: 'claude-sonnet-4-20250514' },
  gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/', defaultModel: 'gemini-2.0-flash' },
  openrouter: { baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'anthropic/claude-sonnet-4-20250514' },
  groq: { baseUrl: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.3-70b-versatile' },
  deepseek: { baseUrl: 'https://api.deepseek.com', defaultModel: 'deepseek-chat' },
  grok: { baseUrl: 'https://api.x.ai/v1', defaultModel: 'grok-2-latest' },
};

export const CODEPLUG_DIR = '.codeplug';
export const CONVENTIONS_FILE = 'conventions.json';
export const CONFIG_FILE = 'config.json';
export const SCORE_DB_FILE = 'scores.db';
export const DOC_HASHES_FILE = 'doc-hashes.json';
