import { describe, it, expect } from 'vitest';
import {
  conventionsFileSchema,
  conventionSchema,
  customRulesFileSchema,
  customRuleSchema,
} from '../../../src/config/ConventionSchema.js';

describe('ConventionSchema', () => {
  it('should validate a valid convention', () => {
    const result = conventionSchema.safeParse({
      id: 'naming-pascal-components',
      dimension: 'naming',
      rule: 'React components use PascalCase',
      confidence: 97,
      confirmed: true,
      examples: ['UserProfile.tsx'],
      severity: 'medium',
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid severity', () => {
    const result = conventionSchema.safeParse({
      id: 'test',
      dimension: 'naming',
      rule: 'test',
      confidence: 50,
      confirmed: true,
      examples: [],
      severity: 'invalid',
    });

    expect(result.success).toBe(false);
  });

  it('should reject confidence out of range', () => {
    const result = conventionSchema.safeParse({
      id: 'test',
      dimension: 'naming',
      rule: 'test',
      confidence: 150,
      confirmed: true,
      examples: [],
      severity: 'medium',
    });

    expect(result.success).toBe(false);
  });

  it('should validate a full conventions file', () => {
    const result = conventionsFileSchema.safeParse({
      version: '1.0',
      created: '2026-02-28T00:00:00Z',
      updated: '2026-02-28T00:00:00Z',
      conventions: [
        {
          id: 'naming-camel',
          dimension: 'naming',
          rule: 'Utility files use camelCase',
          confidence: 91,
          confirmed: true,
          examples: ['formatDate.ts'],
          severity: 'medium',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('should validate a custom rule', () => {
    const result = customRuleSchema.safeParse({
      id: 'no-kebab',
      pattern: '-',
      scope: 'filename',
      message: 'No kebab-case filenames',
    });

    expect(result.success).toBe(true);
  });

  it('should validate a custom rules file', () => {
    const result = customRulesFileSchema.safeParse({
      rules: [
        {
          id: 'no-kebab',
          pattern: '-',
          scope: 'filename',
          message: 'No kebab-case filenames',
          severity: 'medium',
        },
      ],
    });

    expect(result.success).toBe(true);
  });
});
