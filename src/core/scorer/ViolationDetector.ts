import type { Convention, Violation, ConventionAuditOptions } from '../../config/types.js';

export class ViolationDetector {
  constructor(private projectRoot: string) {}

  async detect(conventions: Convention[], _options: ConventionAuditOptions): Promise<Violation[]> {
    // Phase 2 implementation: scan files against stored conventions
    const chalk = (await import('chalk')).default;
    console.log(chalk.dim(`Scanning ${this.projectRoot} against ${conventions.length} conventions...`));
    console.log(chalk.yellow('Full violation detection coming in Phase 2.'));
    return [];
  }
}
