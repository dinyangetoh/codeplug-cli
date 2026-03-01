import { stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { DocsConfig } from '../../config/types.js';
import { CODEPLUG_DIR, CONVENTIONS_FILE, DEFAULT_DOCS } from '../../config/defaults.js';

export class FreshnessChecker {
  private conventionsPath: string;
  private exportTargets: DocsConfig['exportTargets'];

  constructor(
    private projectRoot: string,
    options?: { docsConfig?: DocsConfig },
  ) {
    this.conventionsPath = join(projectRoot, CODEPLUG_DIR, CONVENTIONS_FILE);
    this.exportTargets = options?.docsConfig?.exportTargets ?? DEFAULT_DOCS.exportTargets ?? [];
  }

  async check(): Promise<boolean> {
    if (!existsSync(this.conventionsPath)) {
      return true;
    }

    const convMtime = await this.getMtime(this.conventionsPath);
    if (convMtime === null) return true;

    let anyExportExists = false;

    for (const target of this.exportTargets ?? []) {
      const exportPath = join(this.projectRoot, target.dir, target.file);
      if (!existsSync(exportPath)) continue;

      anyExportExists = true;
      const exportMtime = await this.getMtime(exportPath);
      if (exportMtime === null || exportMtime < convMtime) {
        return false;
      }
    }

    return anyExportExists;
  }

  private async getMtime(filePath: string): Promise<number | null> {
    try {
      const s = await stat(filePath);
      return s.mtimeMs;
    } catch {
      return null;
    }
  }
}
