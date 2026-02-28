import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Convention, ExportResult } from '../../config/types.js';
import type { ExportFormatter } from './formatters/types.js';

type FormatterFactory = () => ExportFormatter;

const FORMATTER_MAP: Record<string, () => Promise<FormatterFactory>> = {
  claude: async () => {
    const { ClaudeFormatter } = await import('./formatters/ClaudeFormatter.js');
    return () => new ClaudeFormatter();
  },
  cursor: async () => {
    const { CursorFormatter } = await import('./formatters/CursorFormatter.js');
    return () => new CursorFormatter();
  },
  copilot: async () => {
    const { CopilotFormatter } = await import('./formatters/CopilotFormatter.js');
    return () => new CopilotFormatter();
  },
  json: async () => {
    const { JsonFormatter } = await import('./formatters/JsonFormatter.js');
    return () => new JsonFormatter();
  },
  ci: async () => {
    const { CiFormatter } = await import('./formatters/CiFormatter.js');
    return () => new CiFormatter();
  },
};

export class ExportEngine {
  constructor(private projectRoot: string) {}

  async export(conventions: Convention[], targets: string[]): Promise<ExportResult> {
    const files: string[] = [];

    for (const target of targets) {
      const loaderFn = FORMATTER_MAP[target];
      if (!loaderFn) {
        throw new Error(`Unknown export target: "${target}". Valid targets: ${Object.keys(FORMATTER_MAP).join(', ')}`);
      }

      const createFormatter = await loaderFn();
      const formatter = createFormatter();
      const content = formatter.format(conventions);
      const outputDir = join(this.projectRoot, formatter.targetDir);

      if (!existsSync(outputDir)) {
        await mkdir(outputDir, { recursive: true });
      }

      const outputPath = join(outputDir, formatter.filename);
      await writeFile(outputPath, content, 'utf-8');
      files.push(join(formatter.targetDir, formatter.filename));
    }

    return { filesWritten: files.length, files };
  }
}
