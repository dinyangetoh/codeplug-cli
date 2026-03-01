// TODO: optional SQL backend via config for score history/trends
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ScoreRecord } from '../config/types.js';
import { CODEPLUG_DIR, SCORES_FILE } from '../config/defaults.js';

export class ScoreStore {
  private filePath: string;
  private dirPath: string;

  constructor(private projectRoot: string) {
    this.dirPath = join(projectRoot, CODEPLUG_DIR);
    this.filePath = join(this.dirPath, SCORES_FILE);
  }

  private async load(): Promise<ScoreRecord[]> {
    if (!existsSync(this.filePath)) return [];
    const raw = await readFile(this.filePath, 'utf-8');
    return JSON.parse(raw) as ScoreRecord[];
  }

  private async persist(records: ScoreRecord[]): Promise<void> {
    if (!existsSync(this.dirPath)) {
      await mkdir(this.dirPath, { recursive: true });
    }
    await writeFile(this.filePath, JSON.stringify(records, null, 2), 'utf-8');
  }

  async save(record: ScoreRecord): Promise<void> {
    const records = await this.load();
    records.push(record);
    await this.persist(records);
  }

  async getLatest(): Promise<ScoreRecord | null> {
    const records = await this.load();
    if (records.length === 0) return null;
    const sorted = [...records].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return sorted[0];
  }

  async getHistory(weeks: number): Promise<ScoreRecord[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeks * 7);
    const records = await this.load();
    return records
      .filter((r) => new Date(r.createdAt) >= cutoff)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async printTrend(): Promise<void> {
    const { TrendTracker } = await import('../core/scorer/TrendTracker.js');
    const chalk = (await import('chalk')).default;
    const tracker = new TrendTracker();

    const history = await this.getHistory(12);
    if (history.length === 0) {
      console.log(chalk.yellow('No score history yet. Run `codeplug convention audit` to record scores.'));
      return;
    }

    console.log(chalk.bold('\n\ud83d\udcca Score Trend\n'));
    console.log(tracker.renderTrendChart(history));

    const trend = tracker.computeTrend(history);
    const icon = trend === 'improving' ? '\ud83d\udcc8' : trend === 'declining' ? '\ud83d\udcc9' : '\u27a1\ufe0f';
    console.log(`\nTrend: ${icon} ${trend}\n`);
  }

  close(): void {}
}
