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

export interface StructureRule {
  dir: string;
  filePattern: string;
  patternName: string;
}

export interface StructureConfig {
  architecture?: {
    featureBased?: string[];
    mvc?: string[];
    layered?: string[];
  };
  directoryPlacement?: StructureRule[];
}

export interface AnalysisConfig {
  include?: string[];
  ignore?: string[];
}

export interface ScoringConfig {
  weights?: Record<Severity, number>;
  threshold?: number;
  trendWindow?: number;
}

export interface ConventionConfig {
  confidenceThreshold?: number;
  minPatternConfidence?: number;
  severityMap?: Partial<Record<Dimension, Severity>>;
  enableSemanticCoherence?: boolean;
  semanticFitThreshold?: number;
}

export interface DriftConfig {
  confidenceThreshold?: number;
  namingPatterns?: Record<string, string>;
}

export interface ExportTarget {
  file: string;
  dir: string;
}

export interface DocsConfig {
  tracked?: string[];
  exportTargets?: ExportTarget[];
  devScripts?: string[];
}

export interface NamingConfig {
  stemStopwords?: string[];
}

export interface CodePlugConfig {
  llm: LlmConfig;
  models: ModelsConfig;
  structure?: StructureConfig;
  analysis?: AnalysisConfig;
  scoring?: ScoringConfig;
  convention?: ConventionConfig;
  drift?: DriftConfig;
  docs?: DocsConfig;
  naming?: NamingConfig;
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
  filePaths?: string[];
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
  fileScorePercent?: number;
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

export interface CustomRule {
  id: string;
  pattern: string;
  scope: 'filename' | 'path' | 'content';
  message: string;
  severity?: Severity;
}
