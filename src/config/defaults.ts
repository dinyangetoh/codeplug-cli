import type { CodePlugConfig, Dimension, Severity } from './types.js';

export const DEFAULT_STRUCTURE = {
  architecture: {
    featureBased: ['features', 'modules', 'domains', 'pages'],
    mvc: ['models', 'views', 'controllers'],
    layered: ['controllers', 'services', 'repositories', 'entities'],
  },
  directoryPlacement: [
    { dir: 'helpers', filePattern: '[Hh]elper', patternName: '*Helper files in helpers/' },
    { dir: 'hooks', filePattern: '^use[A-Z]', patternName: 'use* hooks in hooks/' },
    { dir: 'services', filePattern: 'Service$', patternName: '*Service files in services/' },
  ],
};

export const DEFAULT_ANALYSIS = {
  include: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
  ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.codeplug/**'],
};

export const DEFAULT_SCORING = {
  weights: { critical: 15, high: 8, medium: 3, low: 1 } as Record<Severity, number>,
  threshold: 70,
  trendWindow: 8,
};

export const DEFAULT_CONVENTION = {
  confidenceThreshold: 60,
  minPatternConfidence: 50,
  enableSemanticCoherence: false,
  semanticFitThreshold: 0.6,
  severityMap: {
    naming: 'medium',
    structure: 'high',
    component: 'medium',
    testing: 'medium',
    'error-handling': 'high',
    imports: 'low',
    git: 'low',
    state: 'medium',
    api: 'medium',
  } as Partial<Record<Dimension, Severity>>,
};

export const DEFAULT_DRIFT = {
  confidenceThreshold: 0.7,
  namingPatterns: {
    camelCase: '^[a-z][a-zA-Z0-9]*$',
    PascalCase: '^[A-Z][a-zA-Z0-9]*$',
    SCREAMING_SNAKE_CASE: '^[A-Z][A-Z0-9_]*$',
    'kebab-case': '^[a-z][a-z0-9-]*$',
    snake_case: '^[a-z][a-z0-9_]*$',
  },
};

export const DEFAULT_DOCS = {
  tracked: ['README.md', 'ARCHITECTURE.md', 'CONVENTIONS.md', 'CONTRIBUTING.md', 'ONBOARDING.md'],
  exportTargets: [
    { file: 'CLAUDE.md', dir: '.' },
    { file: 'conventions.mdc', dir: '.cursor/rules' },
    { file: 'copilot-instructions.md', dir: '.github' },
    { file: 'codeplug-export.json', dir: '.codeplug/exports' },
    { file: 'ci-report.json', dir: '.codeplug' },
  ],
  devScripts: ['build', 'test', 'lint', 'dev', 'typecheck', 'coverage'],
};

export const DEFAULT_NAMING = {
  stemStopwords: ['helper', 'util', 'service', 'type', 'hook', 'api'],
};

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
  structure: DEFAULT_STRUCTURE,
  analysis: DEFAULT_ANALYSIS,
  scoring: DEFAULT_SCORING,
  convention: DEFAULT_CONVENTION,
  drift: DEFAULT_DRIFT,
  docs: DEFAULT_DOCS,
  naming: DEFAULT_NAMING,
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
export const SCORES_FILE = 'scores.json';
export const DOC_HASHES_FILE = 'doc-hashes.json';
export const VIOLATIONS_FILE = 'violations.json';
export const RULES_FILE = 'rules.json';
