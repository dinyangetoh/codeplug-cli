import type { Convention } from '../../config/types.js';

export class DriftClassifier {
  async checkRecentCommits(conventions: Convention[]): Promise<void> {
    const chalk = (await import('chalk')).default;
    console.log(chalk.dim(`Checking recent commits against ${conventions.length} conventions...`));
    console.log(chalk.yellow('Drift classification with CodeBERT coming in Phase 2.'));
  }
}
