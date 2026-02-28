import type { Violation, ComplianceScore, Severity } from '../../config/types.js';

const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 15,
  high: 8,
  medium: 3,
  low: 1,
};

export class ComplianceScorer {
  calculate(violations: Violation[]): ComplianceScore {
    const breakdown: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };

    let totalDeduction = 0;
    for (const v of violations) {
      breakdown[v.severity]++;
      totalDeduction += SEVERITY_WEIGHTS[v.severity];
    }

    return {
      total: Math.max(0, 100 - totalDeduction),
      breakdown,
      violationCount: violations.length,
      threshold: 70,
    };
  }

  async printReport(score: ComplianceScore, violations: Violation[]): Promise<void> {
    const chalk = (await import('chalk')).default;

    const trendIcon = score.trend === 'improving' ? '📈' : score.trend === 'declining' ? '📉' : '➡️';
    console.log(chalk.bold(`\n📊 Compliance Score: ${score.total}/100  ${trendIcon}\n`));

    if (violations.length === 0) {
      console.log(chalk.green('✅ No violations found.\n'));
      return;
    }

    const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low'];
    const icons: Record<Severity, string> = { critical: '🔴', high: '🔴', medium: '🟡', low: '🔵' };

    for (const sev of severityOrder) {
      const group = violations.filter((v) => v.severity === sev);
      if (group.length === 0) continue;

      console.log(`${icons[sev]} ${sev.toUpperCase()} (${group.length}):`);
      for (const v of group) {
        console.log(`  ${v.file}${v.line ? `:${v.line}` : ''}`);
        console.log(chalk.dim(`  ${v.message}`));
        if (v.autoFixable) {
          console.log(chalk.dim(`  → Auto-fixable: codeplug convention fix --id ${v.id}`));
        }
        console.log('');
      }
    }
  }
}
