import { readFile, writeFile, unlink, chmod } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const HOOK_MARKER = '# codeplug-managed-hook';

const HOOK_SCRIPT = `#!/bin/sh
${HOOK_MARKER}
# Runs codeplug drift check on staged changes before committing.
# Installed by: codeplug hook install
# Remove with:  codeplug hook uninstall

npx codeplug convention drift --staged 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "codeplug: drift detected — commit blocked. Fix issues or use --no-verify to skip."
  exit 1
fi
`;

export class PreCommitHook {
  private hookPath: string;

  constructor(private projectRoot: string) {
    this.hookPath = join(projectRoot, '.git', 'hooks', 'pre-commit');
  }

  async install(): Promise<void> {
    const chalk = (await import('chalk')).default;
    const gitDir = join(this.projectRoot, '.git');

    if (!existsSync(gitDir)) {
      console.log(chalk.red('Not a git repository. Run "git init" first.'));
      return;
    }

    const hooksDir = join(gitDir, 'hooks');
    const { mkdir } = await import('node:fs/promises');
    if (!existsSync(hooksDir)) {
      await mkdir(hooksDir, { recursive: true });
    }

    if (existsSync(this.hookPath)) {
      const existing = await readFile(this.hookPath, 'utf-8');
      if (existing.includes(HOOK_MARKER)) {
        console.log(chalk.yellow('Pre-commit hook already installed.'));
        return;
      }
      const backupPath = `${this.hookPath}.backup`;
      await writeFile(backupPath, existing, 'utf-8');
      console.log(chalk.dim(`Existing hook backed up to ${backupPath}`));
    }

    await writeFile(this.hookPath, HOOK_SCRIPT, 'utf-8');
    await chmod(this.hookPath, 0o755);
    console.log(chalk.green('Pre-commit hook installed.'));
  }

  async uninstall(): Promise<void> {
    const chalk = (await import('chalk')).default;

    if (!existsSync(this.hookPath)) {
      console.log(chalk.yellow('No pre-commit hook found.'));
      return;
    }

    const content = await readFile(this.hookPath, 'utf-8');
    if (!content.includes(HOOK_MARKER)) {
      console.log(chalk.yellow('Pre-commit hook exists but was not installed by codeplug. Skipping.'));
      return;
    }

    await unlink(this.hookPath);

    const backupPath = `${this.hookPath}.backup`;
    if (existsSync(backupPath)) {
      const { rename } = await import('node:fs/promises');
      await rename(backupPath, this.hookPath);
      console.log(chalk.dim('Restored previous hook from backup.'));
    }

    console.log(chalk.green('Pre-commit hook uninstalled.'));
  }

  async isInstalled(): Promise<boolean> {
    if (!existsSync(this.hookPath)) return false;
    const content = await readFile(this.hookPath, 'utf-8');
    return content.includes(HOOK_MARKER);
  }
}
