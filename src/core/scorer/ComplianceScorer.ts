import type { ComplianceScore, ScoringConfig, Severity, Violation, ScoreRecord } from '../../config/types.js';
import { DEFAULT_SCORING } from '../../config/defaults.js';

export class ComplianceScorer {
  private scoringConfig: ScoringConfig;

  constructor(options?: { scoringConfig?: ScoringConfig }) {
    this.scoringConfig = options?.scoringConfig ?? DEFAULT_SCORING;
  }

  calculate(violations: Violation[]): ComplianceScore {
    const weights = this.scoringConfig.weights ?? DEFAULT_SCORING.weights ?? { critical: 15, high: 8, medium: 3, low: 1 } as Record<Severity, number>;
    const threshold = this.scoringConfig.threshold ?? DEFAULT_SCORING.threshold ?? 70;
    const breakdown: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };

    let totalDeduction = 0;
    for (const v of violations) {
      breakdown[v.severity]++;
      totalDeduction += weights[v.severity];
    }

    return {
      total: Math.max(0, 100 - totalDeduction),
      breakdown,
      violationCount: violations.length,
      threshold,
    };
  }

  async scoreAndPersist(violations: Violation[], projectRoot: string): Promise<ComplianceScore> {
    const score = this.calculate(violations);

    const { ScoreStore } = await import('../../storage/ScoreStore.js');
    const store = new ScoreStore(projectRoot);

    try {
      const { randomUUID, createHash } = await import('node:crypto');

      const record: ScoreRecord = {
        id: randomUUID(),
        projectHash: createHash('sha256').update(projectRoot).digest('hex').slice(0, 12),
        score: score.total,
        breakdown: score.breakdown,
        createdAt: new Date().toISOString(),
      };

      await store.save(record);

      const { TrendTracker } = await import('./TrendTracker.js');
      const tracker = new TrendTracker();
      const trendWindow = this.scoringConfig.trendWindow ?? DEFAULT_SCORING.trendWindow ?? 8;
      const history = await store.getHistory(trendWindow);
      score.trend = tracker.computeTrend(history);
    } finally {
      store.close();
    }

    return score;
  }

  async printReport(score: ComplianceScore, violations: Violation[]): Promise<void> {
    const chalk = (await import('chalk')).default;

    const trendIcon = score.trend === 'improving' ? '\ud83d\udcc8' : score.trend === 'declining' ? '\ud83d\udcc9' : '\u27a1\ufe0f';
    console.log(chalk.bold(`\n\ud83d\udcca Compliance Score: ${score.total}/100  ${trendIcon}\n`));

    if (violations.length === 0) {
      console.log(chalk.green('\u2705 No violations found.\n'));
      return;
    }

    const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low'];
    const icons: Record<Severity, string> = { critical: '\ud83d\udd34', high: '\ud83d\udfe0', medium: '\ud83d\udfe1', low: '\ud83d\udd35' };

    for (const sev of severityOrder) {
      const group = violations.filter((v) => v.severity === sev);
      if (group.length === 0) continue;

      console.log(`${icons[sev]} ${chalk.bold(sev.toUpperCase())} (${group.length}):`);
      for (const v of group) {
        const scoreSuffix = v.fileScorePercent !== undefined ? chalk.dim(` (${v.fileScorePercent}%)`) : '';
        console.log(chalk.red(`  ${v.file}${v.line ? `:${v.line}` : ''}${scoreSuffix}`));
        console.log(chalk.dim(`    ${v.message}`));
        console.log(chalk.dim(`    Expected: ${v.expected}`));
        console.log(chalk.dim(`    Found:    ${v.found}`));
        if (v.autoFixable) {
          console.log(chalk.cyan(`    \u2192 Auto-fixable: codeplug convention fix --id ${v.id}`));
        }
        console.log('');
      }
    }

    const passIcon = score.total >= (score.threshold ?? 70) ? '\u2705' : '\u274c';
    console.log(`${passIcon} Threshold: ${score.threshold ?? 70} | Score: ${score.total} | Issues: ${violations.length}\n`);
  }
}
