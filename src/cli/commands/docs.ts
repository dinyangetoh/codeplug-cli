import type { DocsGenerateOptions } from '../../config/types.js';

export async function handleDocsGenerate(options: DocsGenerateOptions): Promise<void> {
  const chalk = (await import('chalk')).default;
  const ora = (await import('ora')).default;
  const { DocGenerator } = await import('../../core/generator/DocGenerator.js');

  const generator = new DocGenerator(process.cwd());
  const spinner = ora('Generating documentation...').start();

  try {
    const result = await generator.generate(options);
    spinner.succeed(`Generated ${result.docsCreated} documents in ${result.durationMs}ms`);

    for (const doc of result.documents) {
      console.log(chalk.green(`  ✅ ${doc}`));
    }
  } catch (err) {
    spinner.fail('Documentation generation failed');
    throw err;
  }
}

export async function handleDocsStatus(): Promise<void> {
  const chalk = (await import('chalk')).default;
  const { StalenessTracker } = await import('../../core/generator/StalenessTracker.js');

  const tracker = new StalenessTracker(process.cwd());
  const status = await tracker.check();

  console.log(chalk.bold('\n📄 Documentation Status\n'));

  for (const doc of status) {
    const icon = doc.stale ? '⚠️ ' : '✅';
    const suffix = doc.stale ? chalk.yellow(` Stale — ${doc.reason}`) : chalk.green(' Up to date');
    console.log(`  ${icon} ${doc.name.padEnd(22)}${suffix}`);
  }

  const staleCount = status.filter((d) => d.stale).length;
  if (staleCount > 0) {
    console.log(chalk.dim(`\n→ Run: codeplug docs update  (regenerates stale sections only)`));
  }
}

export async function handleDocsUpdate(): Promise<void> {
  const chalk = (await import('chalk')).default;
  const ora = (await import('ora')).default;
  const { DocGenerator } = await import('../../core/generator/DocGenerator.js');

  const generator = new DocGenerator(process.cwd());
  const spinner = ora('Updating stale documentation...').start();

  try {
    const result = await generator.update();
    spinner.succeed(`Updated ${result.docsUpdated} documents`);
  } catch (err) {
    spinner.fail('Documentation update failed');
    throw err;
  }
}
