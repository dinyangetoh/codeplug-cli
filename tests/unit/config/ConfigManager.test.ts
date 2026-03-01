import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigManager } from '../../../src/config/ConfigManager.js';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
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

  describe('config merge', () => {
    it('should merge structure config with defaults', async () => {
      const dir = join(tempDir, '.codeplug');
      await mkdir(dir, { recursive: true });
      await writeFile(
        join(dir, 'config.json'),
        JSON.stringify({
          structure: {
            architecture: { featureBased: ['features', 'custom'] },
            directoryPlacement: [{ dir: 'utils', filePattern: '[Uu]til', patternName: '*Util files in utils/' }],
          },
        }),
        'utf-8',
      );
      const config = new ConfigManager(tempDir);
      await config.load();

      const structure = config.getStructureConfig();
      expect(structure.architecture?.featureBased).toEqual(['features', 'custom']);
      expect(structure.architecture?.mvc).toEqual(['models', 'views', 'controllers']);
      expect(structure.directoryPlacement).toEqual([{ dir: 'utils', filePattern: '[Uu]til', patternName: '*Util files in utils/' }]);
    });

    it('should merge analysis config with defaults', async () => {
      const dir = join(tempDir, '.codeplug');
      await mkdir(dir, { recursive: true });
      await writeFile(
        join(dir, 'config.json'),
        JSON.stringify({ analysis: { ignore: ['**/custom-ignore/**'] } }),
        'utf-8',
      );
      const config = new ConfigManager(tempDir);
      await config.load();

      const analysis = config.getAnalysisConfig();
      expect(analysis.include).toEqual(['**/*.{ts,tsx,js,jsx,mjs,cjs}']);
      expect(analysis.ignore).toContain('**/custom-ignore/**');
    });

    it('should merge scoring config with defaults', async () => {
      const dir = join(tempDir, '.codeplug');
      await mkdir(dir, { recursive: true });
      await writeFile(
        join(dir, 'config.json'),
        JSON.stringify({ scoring: { threshold: 80, trendWindow: 12 } }),
        'utf-8',
      );
      const config = new ConfigManager(tempDir);
      await config.load();

      const scoring = config.getScoringConfig();
      expect(scoring.threshold).toBe(80);
      expect(scoring.trendWindow).toBe(12);
      expect(scoring.weights?.critical).toBe(15);
    });

    it('should fallback to defaults when sections absent', async () => {
      const config = new ConfigManager(tempDir);
      await config.load();

      expect(config.getStructureConfig().architecture?.featureBased).toContain('features');
      expect(config.getAnalysisConfig().include).toContain('**/*.{ts,tsx,js,jsx,mjs,cjs}');
      expect(config.getScoringConfig().threshold).toBe(70);
      expect(config.getNamingConfig().stemStopwords).toContain('helper');
    });
  });
});
