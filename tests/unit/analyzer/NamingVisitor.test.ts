import { describe, it, expect } from 'vitest';
import { NamingVisitor } from '../../../src/core/analyzer/visitors/NamingVisitor.js';
import { parse } from '@babel/parser';

function makeParsedFile(filePath: string, code: string) {
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
    errorRecovery: true,
  });
  return { filePath, code, ast };
}

describe('NamingVisitor', () => {
  const visitor = new NamingVisitor();

  it('should detect PascalCase component files', () => {
    const file = makeParsedFile(
      'src/components/UserProfile.tsx',
      'export const UserProfile = () => <div />;',
    );
    const findings = visitor.visit(file);
    const pascalFinding = findings.find((f) => f.pattern.includes('PascalCase'));
    expect(pascalFinding).toBeDefined();
    expect(pascalFinding!.count).toBe(1);
  });

  it('should detect camelCase utility files', () => {
    const file = makeParsedFile(
      'src/utils/formatDate.ts',
      'export function formatDate(d: Date) { return d.toISOString(); }',
    );
    const findings = visitor.visit(file);
    const camelFinding = findings.find((f) => f.pattern.includes('camelCase'));
    expect(camelFinding).toBeDefined();
  });

  it('should detect hook naming', () => {
    const file = makeParsedFile(
      'src/hooks/useAuth.ts',
      'export function useAuth() { return { user: null }; }',
    );
    const findings = visitor.visit(file);
    const hookFinding = findings.find((f) => f.pattern.includes('use'));
    expect(hookFinding).toBeDefined();
  });
});
