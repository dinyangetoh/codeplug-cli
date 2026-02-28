import type { LlmConfig } from '../../../config/types.js';

export interface GenerateOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export class LlmClient {
  private config: LlmConfig;

  constructor(config: LlmConfig) {
    this.config = config;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const { default: OpenAI } = await import('openai');

    const client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl,
    });

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await client.chat.completions.create({
      model: this.config.model,
      messages,
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
    });

    return response.choices[0]?.message?.content ?? '';
  }
}
