import { z } from 'zod';

export const severitySchema = z.enum(['critical', 'high', 'medium', 'low']);

export const dimensionSchema = z.enum([
  'naming', 'structure', 'component', 'testing',
  'error-handling', 'imports', 'git', 'state', 'api',
]);

export const conventionSchema = z.object({
  id: z.string(),
  dimension: dimensionSchema,
  rule: z.string(),
  confidence: z.number().min(0).max(100),
  confirmed: z.boolean(),
  examples: z.array(z.string()),
  severity: severitySchema,
});

export const conventionsFileSchema = z.object({
  version: z.string(),
  created: z.string(),
  updated: z.string(),
  conventions: z.array(conventionSchema),
});

export const customRuleSchema = z.object({
  id: z.string(),
  pattern: z.string(),
  scope: z.enum(['filename', 'path', 'content']),
  message: z.string(),
  severity: severitySchema.optional(),
});

export const customRulesFileSchema = z.object({
  version: z.string().optional(),
  rules: z.array(customRuleSchema),
});
