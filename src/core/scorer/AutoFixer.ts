import { join, dirname, basename, extname } from 'node:path';
import type { Violation } from '../../config/types.js';

type Chalk = typeof import('chalk').default;

export class AutoFixer {
  constructor(private projectRoot: string) {}

  async fixById(id: string): Promise<void> {
    const chalk = (await import('chalk')).default;
    const { ViolationStore } = await import('../../storage/ViolationStore.js');

    const store = new ViolationStore(this.projectRoot);
    if (!(await store.exists())) {
      console.log(chalk.yellow('No violations found. Run "codeplug convention audit" first.'));
      return;
    }

    const violations = await store.load();
    const violation = violations.find((v) => v.id === id);
    if (!violation) {
      console.log(chalk.red(`Violation "${id}" not found.`));
      return;
    }

    if (!violation.autoFixable) {
      console.log(chalk.yellow(`Violation "${id}" is not auto-fixable.`));
      this.printManualGuidance(chalk, violation);
      return;
    }

    console.log(chalk.bold('\n🔧 Dry-run preview:\n'));
    this.printFixPreview(chalk, violation);

    const success = await this.tryFix(chalk, violation);
    if (success) {
      const remaining = violations.filter((v) => v.id !== id);
      await store.save(remaining);
      console.log(chalk.green('\n✅ Fix applied successfully.'));
    }
  }

  async fixAll(): Promise<void> {
    const chalk = (await import('chalk')).default;
    const { ViolationStore } = await import('../../storage/ViolationStore.js');

    const store = new ViolationStore(this.projectRoot);
    if (!(await store.exists())) {
      console.log(chalk.yellow('No violations found. Run "codeplug convention audit" first.'));
      return;
    }

    const violations = await store.load();
    const fixable = violations.filter((v) => v.autoFixable);

    if (fixable.length === 0) {
      console.log(chalk.yellow('No auto-fixable violations found.'));
      return;
    }

    console.log(chalk.bold(`\n🔧 Dry-run preview: ${fixable.length} auto-fixable violation(s)\n`));
    for (const v of fixable) {
      this.printFixPreview(chalk, v);
    }
    console.log('');

    let fixed = 0;
    const remaining = [...violations];

    for (const v of fixable) {
      const success = await this.tryFix(chalk, v);
      if (success) {
        fixed++;
        const idx = remaining.findIndex((r) => r.id === v.id);
        if (idx >= 0) remaining.splice(idx, 1);
      }
    }

    await store.save(remaining);
    console.log(chalk.green(`\n✅ Fixed ${fixed}/${fixable.length} violation(s).`));
    if (remaining.length > 0) {
      console.log(chalk.dim(`   ${remaining.length} violation(s) remaining.`));
    }
  }

  private isFileRename(v: Violation): boolean {
    const foundExt = extname(v.found);
    const expectedExt = extname(v.expected);
    return foundExt.length > 0 && expectedExt.length > 0 && foundExt === expectedExt;
  }

  private printFixPreview(chalk: Chalk, v: Violation): void {
    if (this.isFileRename(v)) {
      console.log(chalk.cyan(`  [rename] ${v.found} → ${v.expected}`));
      console.log(chalk.dim(`    in ${dirname(v.file)}/`));
    } else {
      console.log(chalk.cyan(`  [manual] ${v.file}`));
      console.log(chalk.dim(`    ${v.message}`));
    }
  }

  private async tryFix(chalk: Chalk, v: Violation): Promise<boolean> {
    if (this.isFileRename(v)) {
      return this.applyFileRename(chalk, v);
    }
    this.printManualGuidance(chalk, v);
    return false;
  }

  private async applyFileRename(chalk: Chalk, v: Violation): Promise<boolean> {
    const { rename } = await import('node:fs/promises');
    const { existsSync } = await import('node:fs');

    const filePath = join(this.projectRoot, v.file);
    const dir = dirname(filePath);
    const newPath = join(dir, v.expected);

    if (!existsSync(filePath)) {
      console.log(chalk.red(`  ✗ File not found: ${v.file}`));
      return false;
    }

    try {
      await rename(filePath, newPath);
      console.log(chalk.green(`  ✓ Renamed ${v.found} → ${v.expected}`));
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`  ✗ Rename failed: ${msg}`));
      return false;
    }
  }

  private printManualGuidance(chalk: Chalk, v: Violation): void {
    console.log(chalk.yellow(`\n  Manual fix needed for ${v.file}:`));
    console.log(chalk.dim(`    ${v.message}`));
    console.log(chalk.dim(`    Expected: ${v.expected}`));
    console.log(chalk.dim(`    Found:    ${v.found}`));
  }
}
