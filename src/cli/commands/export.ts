import type { ExportOptions } from '../../config/types.js';

export async function handleExport(options: ExportOptions): Promise<void> {
  const chalk = (await import('chalk')).default;
  const ora = (await import('ora')).default;
  const { ExportEngine } = await import('../../core/exporter/ExportEngine.js');
  const { ConventionStore } = await import('../../storage/ConventionStore.js');

  const store = new ConventionStore(process.cwd());
  if (!await store.exists()) {
    console.log(chalk.yellow('No conventions found. Run "codeplug convention init" first.'));
    return;
  }

  if (options.check) {
    const { FreshnessChecker } = await import('../../core/exporter/FreshnessChecker.js');
    const checker = new FreshnessChecker(process.cwd());
    const fresh = await checker.check();
    if (fresh) {
      console.log(chalk.green('✅ All exports are up to date.'));
    } else {
      console.log(chalk.yellow('⚠️  Exports are stale. Run "codeplug export --all" to update.'));
    }
    return;
  }

  const conventions = await store.load();
  const engine = new ExportEngine(process.cwd());

  const targets = options.all
    ? ['claude', 'cursor', 'copilot', 'json', 'ci']
    : options.target
      ? [options.target]
      : options.format
        ? [options.format]
        : [];

  if (targets.length === 0) {
    console.log(chalk.yellow('Specify --target, --format, or --all.'));
    return;
  }

  const spinner = ora(`Exporting for ${targets.join(', ')}...`).start();

  try {
    const result = await engine.export(conventions, targets);
    spinner.succeed(`Exported ${result.filesWritten} files`);
    for (const file of result.files) {
      console.log(chalk.green(`  ✅ ${file}`));
    }
  } catch (err) {
    spinner.fail('Export failed');
    throw err;
  }
}
