import type { ConventionCandidate, Convention } from '../../config/types.js';

export async function confirmConventions(candidates: ConventionCandidate[]): Promise<Convention[]> {
  const { confirm, input } = await import('@inquirer/prompts');
  const chalk = (await import('chalk')).default;

  const confirmed: Convention[] = [];

  console.log(chalk.bold('\n📐 Detected patterns — confirm or adjust:\n'));

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const label = `[${i + 1}/${candidates.length}]`;
    const confidenceColor = c.confidence >= 90 ? chalk.green : c.confidence >= 75 ? chalk.yellow : chalk.red;

    console.log(`  ${chalk.bold(label)} ${c.dimension}: ${c.rule}  ${confidenceColor(`(confidence: ${c.confidence}%)`)}`);

    if (c.examples.length > 0) {
      console.log(chalk.dim(`        Found: ${c.examples.slice(0, 3).join(', ')}`));
    }

    const accepted = await confirm({ message: 'Accept?', default: true });

    if (accepted) {
      confirmed.push({
        id: c.id,
        dimension: c.dimension,
        rule: c.rule,
        confidence: c.confidence,
        confirmed: true,
        examples: c.examples,
        severity: c.severity,
      });
    } else {
      const custom = await input({
        message: 'Specify alternative (or press Enter to skip):',
      });

      if (custom.trim()) {
        confirmed.push({
          id: c.id,
          dimension: c.dimension,
          rule: custom.trim(),
          confidence: 100,
          confirmed: true,
          examples: [],
          severity: c.severity,
        });
      }
    }

    console.log('');
  }

  return confirmed;
}
