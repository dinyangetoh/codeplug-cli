import type { ScoreRecord } from '../../config/types.js';

const MAX_CHART_ENTRIES = 12;
const MAX_BAR_WIDTH = 40;
const REGRESSION_WINDOW = 8;
const SLOPE_THRESHOLD = 1;

export class TrendTracker {
  computeTrend(history: ScoreRecord[]): 'improving' | 'stable' | 'declining' {
    if (history.length < 2) return 'stable';

    const points = history.slice(-REGRESSION_WINDOW);
    const n = points.length;

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += points[i].score;
      sumXY += i * points[i].score;
      sumX2 += i * i;
    }

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return 'stable';

    const slope = (n * sumXY - sumX * sumY) / denominator;

    if (slope > SLOPE_THRESHOLD) return 'improving';
    if (slope < -SLOPE_THRESHOLD) return 'declining';
    return 'stable';
  }

  renderTrendChart(history: ScoreRecord[]): string {
    if (history.length === 0) return 'No score history available.';

    const entries = history.slice(-MAX_CHART_ENTRIES);
    const lines: string[] = [];

    for (const record of entries) {
      const date = record.createdAt.slice(0, 10);
      const barLen = Math.round((record.score / 100) * MAX_BAR_WIDTH);
      const bar = '\u2588'.repeat(barLen) + '\u2591'.repeat(MAX_BAR_WIDTH - barLen);
      lines.push(`${date} \u2502${bar}\u2502 ${record.score}`);
    }

    return lines.join('\n');
  }
}
