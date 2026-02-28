export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type Dimension = 'naming' | 'structure' | 'component' | 'testing' | 'error-handling' | 'imports' | 'git' | 'state' | 'api';
export type ModelTier = 'default' | 'lite';

export interface Convention {
  id: string;
  dimension: Dimension;
  rule: string;
  confidence: number;
  confirmed: boolean;
  examples: string[];
  severity: Severity;
}

export interface ConventionCandidate {
  id: string;
  dimension: Dimension;
  rule: string;
  confidence: number;
  examples: string[];
  severity: Severity;
}

export interface ConventionsFile {
  version: string;
  created: string;
  updated: string;
  conventions: Convention[];
}

export interface LlmConfig {
  provider: string;
  model: string;
  baseUrl: string;
  apiKey: string;
}

export interface ModelsConfig {
  tier: ModelTier;
}

export interface CodePlugConfig {
  llm: LlmConfig;
  models: ModelsConfig;
}

export interface ConventionInitOptions {
  force?: boolean;
}

export interface ConventionAuditOptions {
  since?: string;
  ci?: boolean;
}

export interface ConventionScoreOptions {
  trend?: boolean;
}

export interface ConventionFixOptions {
  auto?: boolean;
  id?: string;
}

export interface DocsGenerateOptions {
  doc?: string;
  audience?: string;
  style?: string;
}

export interface ExportOptions {
  target?: string;
  format?: string;
  all?: boolean;
  check?: boolean;
}

export interface AnalysisResult {
  fileCount: number;
  durationMs: number;
  patterns: DetectedPattern[];
  folderStructure: FolderNode;
}

export interface DetectedPattern {
  dimension: Dimension;
  pattern: string;
  frequency: number;
  total: number;
  confidence: number;
  examples: string[];
}

export interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
  fileCount: number;
}

export interface Violation {
  id: string;
  conventionId: string;
  severity: Severity;
  file: string;
  line?: number;
  message: string;
  expected: string;
  found: string;
  autoFixable: boolean;
}

export interface ComplianceScore {
  total: number;
  breakdown: Record<Severity, number>;
  violationCount: number;
  threshold?: number;
  trend?: 'improving' | 'stable' | 'declining';
}

export interface ScoreRecord {
  id: string;
  projectHash: string;
  score: number;
  breakdown: Record<string, number>;
  createdAt: string;
}

export interface DocGenerationResult {
  docsCreated: number;
  durationMs: number;
  documents: string[];
}

export interface DocUpdateResult {
  docsUpdated: number;
  documents: string[];
}

export interface DocStatus {
  name: string;
  stale: boolean;
  reason?: string;
}

export interface ExportResult {
  filesWritten: number;
  files: string[];
}

export interface NerEntityResult {
  entity: string;
  type: string;
  score: number;
}

export interface PipelineResult {
  summary: string;
  extractions: string[];
  entities: NerEntityResult[];
}
