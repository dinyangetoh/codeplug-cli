import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigManager } from '../../../src/config/ConfigManager.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('ConfigManager', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'codeplug-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should load default config when no file exists', async () => {
    const config = new ConfigManager(tempDir);
    await config.load();

    expect(config.getModelTier()).toBe('default');
    expect(config.getLlmConfig().provider).toBe('ollama');
  });

  it('should set and get values', async () => {
    const config = new ConfigManager(tempDir);
    await config.load();

    config.set('models.tier', 'lite');
    expect(config.getModelTier()).toBe('lite');

    config.set('llm.model', 'gpt-4o');
    expect(config.getLlmConfig().model).toBe('gpt-4o');
  });

  it('should apply provider presets when setting llm.provider', async () => {
    const config = new ConfigManager(tempDir);
    await config.load();

    config.set('llm.provider', 'openai');

    const llm = config.getLlmConfig();
    expect(llm.provider).toBe('openai');
    expect(llm.baseUrl).toBe('https://api.openai.com/v1');
    expect(llm.model).toBe('gpt-4o');
  });

  it('should persist and reload config', async () => {
    const config1 = new ConfigManager(tempDir);
    await config1.load();
    config1.set('models.tier', 'lite');
    config1.set('llm.apiKey', 'test-key');
    await config1.save();

    const config2 = new ConfigManager(tempDir);
    await config2.load();
    expect(config2.getModelTier()).toBe('lite');
    expect(config2.getLlmConfig().apiKey).toBe('test-key');
  });

  it('should throw on invalid key format', async () => {
    const config = new ConfigManager(tempDir);
    await config.load();

    expect(() => config.set('invalid', 'value')).toThrow('Invalid config key');
  });
});
