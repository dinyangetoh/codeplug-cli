import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ScoreRecord } from '../config/types.js';
import { CODEPLUG_DIR, SCORE_DB_FILE } from '../config/defaults.js';

interface SqlJsDb {
  run(sql: string, params?: (string | number | null | Uint8Array)[]): void;
  exec(sql: string): Array<{ columns: string[]; values: unknown[][] }>;
  prepare(sql: string): SqlJsStatement;
  export(): Uint8Array;
  close(): void;
}

interface SqlJsStatement {
  bind(params?: (string | number | null | Uint8Array)[]): boolean;
  step(): boolean;
  getAsObject(): Record<string, unknown>;
  free(): boolean;
}

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS scores (
    id TEXT PRIMARY KEY,
    project_hash TEXT,
    score INTEGER,
    breakdown_json TEXT,
    created_at TEXT
  )
`;

export class ScoreStore {
  private dbPath: string;
  private dirPath: string;
  private db: SqlJsDb | null = null;

  constructor(private projectRoot: string) {
    this.dirPath = join(projectRoot, CODEPLUG_DIR);
    this.dbPath = join(this.dirPath, SCORE_DB_FILE);
  }

  private async getDb(): Promise<SqlJsDb> {
    if (this.db) return this.db;

    const initSqlJs = (await import('sql.js')).default;
    const SQL = await initSqlJs();

    if (existsSync(this.dbPath)) {
      const buffer = await readFile(this.dbPath);
      this.db = new SQL.Database(buffer) as unknown as SqlJsDb;
    } else {
      this.db = new SQL.Database() as unknown as SqlJsDb;
    }

    this.db.run(CREATE_TABLE_SQL);
    return this.db;
  }

  private async persist(): Promise<void> {
    if (!this.db) return;

    if (!existsSync(this.dirPath)) {
      await mkdir(this.dirPath, { recursive: true });
    }

    const data = this.db.export();
    await writeFile(this.dbPath, Buffer.from(data));
  }

  async save(record: ScoreRecord): Promise<void> {
    const db = await this.getDb();
    db.run(
      'INSERT OR REPLACE INTO scores (id, project_hash, score, breakdown_json, created_at) VALUES (?, ?, ?, ?, ?)',
      [record.id, record.projectHash, record.score, JSON.stringify(record.breakdown), record.createdAt],
    );
    await this.persist();
  }

  async getLatest(): Promise<ScoreRecord | null> {
    const db = await this.getDb();
    const results = db.exec('SELECT * FROM scores ORDER BY created_at DESC LIMIT 1');
    if (results.length === 0 || results[0].values.length === 0) return null;
    return this.rowToRecord(results[0].columns, results[0].values[0]);
  }

  async getHistory(weeks: number): Promise<ScoreRecord[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeks * 7);

    const db = await this.getDb();
    const stmt = db.prepare('SELECT * FROM scores WHERE created_at >= ? ORDER BY created_at ASC');
    stmt.bind([cutoff.toISOString()]);

    const records: ScoreRecord[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      records.push(this.objectToRecord(row));
    }
    stmt.free();

    return records;
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

  private rowToRecord(columns: string[], values: unknown[]): ScoreRecord {
    const row: Record<string, unknown> = {};
    for (let i = 0; i < columns.length; i++) {
      row[columns[i]] = values[i];
    }
    return this.objectToRecord(row);
  }

  private objectToRecord(row: Record<string, unknown>): ScoreRecord {
    return {
      id: row['id'] as string,
      projectHash: row['project_hash'] as string,
      score: row['score'] as number,
      breakdown: JSON.parse(row['breakdown_json'] as string) as Record<string, number>,
      createdAt: row['created_at'] as string,
    };
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
