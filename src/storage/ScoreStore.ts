import type { ScoreRecord } from '../config/types.js';

export class ScoreStore {
  constructor(private projectRoot: string) {}

  async getLatest(): Promise<ScoreRecord | null> {
    // Phase 2: sql.js integration for time-series score storage
    return null;
  }

  async save(_record: ScoreRecord): Promise<void> {
    // Phase 2
  }

  async printTrend(): Promise<void> {
    const chalk = (await import('chalk')).default;
    console.log(chalk.yellow('Score trend tracking coming in Phase 2 (sql.js).'));
  }
}
