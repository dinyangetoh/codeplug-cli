import type { Convention, Dimension } from '../../config/types.js';
import type { CommitDiff } from '../git/GitIntegration.js';
import { ConfidenceGate } from './ConfidenceGate.js';

export interface DriftResult {
  file: string;
  conventionId: string;
  dimension: Dimension;
  rule: string;
  classification: 'following' | 'ambiguous' | 'drifting';
  confidence: number;
  detail: string;
}

interface HunkContext {
  file: string;
  addedLines: string[];
  removedLines: string[];
}

type RuleMatcher = (hunk: HunkContext, convention: Convention) => DriftResult | null;

const NAMING_PATTERNS: Record<string, RegExp> = {
  camelCase: /^[a-z][a-zA-Z0-9]*$/,
  PascalCase: /^[A-Z][a-zA-Z0-9]*$/,
  SCREAMING_SNAKE_CASE: /^[A-Z][A-Z0-9_]*$/,
  'kebab-case': /^[a-z][a-z0-9-]*$/,
  snake_case: /^[a-z][a-z0-9_]*$/,
};

function extractIdentifiers(line: string): string[] {
  const cleaned = line
    .replace(/\/\/.*$/, '')
    .replace(/['"`].*?['"`]/g, '')
    .replace(/\/\*.*?\*\//g, '');

  const funcMatch = cleaned.match(/(?:function|const|let|var|class|interface|type|enum)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g);
  const identifiers: string[] = [];

  if (funcMatch) {
    for (const m of funcMatch) {
      const name = m.split(/\s+/).pop();
      if (name) identifiers.push(name);
    }
  }

  return identifiers;
}

function matchNaming(hunk: HunkContext, convention: Convention): DriftResult | null {
  const ruleText = convention.rule.toLowerCase();
  let expectedPattern: RegExp | null = null;
  let patternName = '';

  for (const [name, regex] of Object.entries(NAMING_PATTERNS)) {
    if (ruleText.includes(name.toLowerCase())) {
      expectedPattern = regex;
      patternName = name;
      break;
    }
  }

  if (!expectedPattern) return null;

  const violations: string[] = [];
  const checked = new Set<string>();

  for (const line of hunk.addedLines) {
    const identifiers = extractIdentifiers(line);
    for (const id of identifiers) {
      if (checked.has(id)) continue;
      checked.add(id);

      if (!expectedPattern.test(id)) {
        violations.push(id);
      }
    }
  }

  if (violations.length === 0) return null;

  const totalChecked = checked.size;
  if (totalChecked === 0) return null;

  const violationRatio = violations.length / totalChecked;
  const confidence = Math.min(0.5 + violationRatio * 0.5, 1.0);

  return {
    file: hunk.file,
    conventionId: convention.id,
    dimension: convention.dimension,
    rule: convention.rule,
    classification: violationRatio > 0.5 ? 'drifting' : 'ambiguous',
    confidence,
    detail: `Found ${violations.length}/${totalChecked} identifiers not matching ${patternName}: ${violations.slice(0, 3).join(', ')}`,
  };
}

function matchStructure(hunk: HunkContext, convention: Convention): DriftResult | null {
  const ruleText = convention.rule.toLowerCase();
  const addedContent = hunk.addedLines.join('\n');

  if (ruleText.includes('directory') || ruleText.includes('folder')) {
    const pathParts = hunk.file.split('/');
    const examples = convention.examples.map((e) => e.toLowerCase());
    const isFollowing = examples.some((ex) =>
      pathParts.some((p) => ex.includes(p.toLowerCase()))
    );

    if (!isFollowing && pathParts.length > 1) {
      return {
        file: hunk.file,
        conventionId: convention.id,
        dimension: convention.dimension,
        rule: convention.rule,
        classification: 'ambiguous',
        confidence: 0.5,
        detail: `File path ${hunk.file} may not follow expected structure`,
      };
    }
  }

  if (ruleText.includes('export default') || ruleText.includes('named export')) {
    const hasDefault = addedContent.includes('export default');
    const hasNamed = /export\s+(?:const|function|class|interface|type|enum)\s/.test(addedContent);
    const expectsDefault = ruleText.includes('export default');

    if (expectsDefault && hasNamed && !hasDefault) {
      return {
        file: hunk.file,
        conventionId: convention.id,
        dimension: convention.dimension,
        rule: convention.rule,
        classification: 'drifting',
        confidence: 0.8,
        detail: 'Uses named exports where default export is expected',
      };
    }
    if (!expectsDefault && hasDefault) {
      return {
        file: hunk.file,
        conventionId: convention.id,
        dimension: convention.dimension,
        rule: convention.rule,
        classification: 'drifting',
        confidence: 0.8,
        detail: 'Uses default export where named exports are expected',
      };
    }
  }

  return null;
}

function matchImports(hunk: HunkContext, convention: Convention): DriftResult | null {
  const ruleText = convention.rule.toLowerCase();
  const addedContent = hunk.addedLines.join('\n');

  if (ruleText.includes('type import') || ruleText.includes('import type')) {
    const typeImportCount = (addedContent.match(/import\s+type\s/g) ?? []).length;
    const regularImportWithType = (addedContent.match(/import\s+\{[^}]*\}\s+from/g) ?? []).length;

    if (regularImportWithType > 0 && typeImportCount === 0 && addedContent.includes('type')) {
      return {
        file: hunk.file,
        conventionId: convention.id,
        dimension: convention.dimension,
        rule: convention.rule,
        classification: 'ambiguous',
        confidence: 0.6,
        detail: 'May be missing "import type" for type-only imports',
      };
    }
  }

  if (ruleText.includes('barrel') || ruleText.includes('index')) {
    const deepImports = hunk.addedLines.filter((l) =>
      /from\s+['"]\.\.\//.test(l) && /\/[^/]+\/[^/]+['"]/.test(l)
    );
    if (deepImports.length > 0) {
      return {
        file: hunk.file,
        conventionId: convention.id,
        dimension: convention.dimension,
        rule: convention.rule,
        classification: 'ambiguous',
        confidence: 0.55,
        detail: `${deepImports.length} deep import(s) may bypass barrel exports`,
      };
    }
  }

  return null;
}

function matchErrorHandling(hunk: HunkContext, convention: Convention): DriftResult | null {
  const ruleText = convention.rule.toLowerCase();
  const addedContent = hunk.addedLines.join('\n');

  if (ruleText.includes('try') || ruleText.includes('catch') || ruleText.includes('error')) {
    const hasAsync = addedContent.includes('async ');
    const hasAwait = addedContent.includes('await ');
    const hasTryCatch = addedContent.includes('try {') || addedContent.includes('try{');

    if (hasAsync && hasAwait && !hasTryCatch) {
      return {
        file: hunk.file,
        conventionId: convention.id,
        dimension: convention.dimension,
        rule: convention.rule,
        classification: 'ambiguous',
        confidence: 0.55,
        detail: 'Async function with await but no try/catch block',
      };
    }
  }

  return null;
}

const DIMENSION_MATCHERS: Partial<Record<Dimension, RuleMatcher>> = {
  naming: matchNaming,
  structure: matchStructure,
  imports: matchImports,
  'error-handling': matchErrorHandling,
};

function parseHunks(rawDiff: string): HunkContext[] {
  const hunks: HunkContext[] = [];
  const fileBlocks = rawDiff.split(/^diff --git /m).filter(Boolean);

  for (const block of fileBlocks) {
    const fileMatch = block.match(/b\/(.+)/);
    if (!fileMatch) continue;

    const file = fileMatch[1];
    const addedLines: string[] = [];
    const removedLines: string[] = [];

    for (const line of block.split('\n')) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        addedLines.push(line.slice(1));
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        removedLines.push(line.slice(1));
      }
    }

    if (addedLines.length > 0 || removedLines.length > 0) {
      hunks.push({ file, addedLines, removedLines });
    }
  }

  return hunks;
}

export class DriftClassifier {
  private gate = new ConfidenceGate();

  async classifyDiff(diff: string, conventions: Convention[]): Promise<DriftResult[]> {
    const hunks = parseHunks(diff);
    const results: DriftResult[] = [];

    for (const hunk of hunks) {
      for (const convention of conventions) {
        if (!convention.confirmed) continue;

        const matcher = DIMENSION_MATCHERS[convention.dimension];
        if (!matcher) continue;

        const result = matcher(hunk, convention);
        if (result) {
          const gated = this.gate.gate(result.classification, result.confidence);
          results.push({
            ...result,
            classification: gated.classification,
            confidence: gated.confidence,
          });
        }
      }
    }

    return results;
  }

  async checkRecentCommits(conventions: Convention[]): Promise<void> {
    const chalk = (await import('chalk')).default;
    const { GitIntegration } = await import('../git/GitIntegration.js');

    const git = new GitIntegration();
    const isRepo = await git.isGitRepo();
    if (!isRepo) {
      console.log(chalk.red('Not inside a git repository.'));
      return;
    }

    const ora = (await import('ora')).default;
    const spinner = ora('Analysing recent commits for drift...').start();

    let commitDiffs: CommitDiff[];
    try {
      commitDiffs = await git.getRecentCommitDiffs(5);
    } catch {
      spinner.fail('Failed to read git history.');
      return;
    }

    if (commitDiffs.length === 0) {
      spinner.info('No recent commits found.');
      return;
    }

    const allResults: Array<DriftResult & { commitHash: string }> = [];

    for (const cd of commitDiffs) {
      if (!cd.rawDiff) continue;
      const results = await this.classifyDiff(cd.rawDiff, conventions);
      for (const r of results) {
        allResults.push({ ...r, commitHash: cd.commit.hash.slice(0, 7) });
      }
    }

    spinner.stop();
    this.printReport(allResults, commitDiffs.length, chalk);
  }

  private printReport(
    results: Array<DriftResult & { commitHash: string }>,
    commitCount: number,
    chalk: typeof import('chalk').default,
  ): void {
    console.log('');
    console.log(chalk.bold(`Drift Report — ${commitCount} recent commits scanned`));
    console.log(chalk.dim('─'.repeat(50)));

    if (results.length === 0) {
      console.log(chalk.green('No drift detected. All changes follow conventions.'));
      return;
    }

    const drifting = results.filter((r) => r.classification === 'drifting');
    const ambiguous = results.filter((r) => r.classification === 'ambiguous');

    if (drifting.length > 0) {
      console.log(chalk.red.bold(`\n  Drifting (${drifting.length}):`));
      for (const r of drifting) {
        console.log(chalk.red(`    [${r.commitHash}] ${r.file}`));
        console.log(chalk.dim(`      Rule: ${r.rule}`));
        console.log(chalk.dim(`      ${r.detail} (confidence: ${(r.confidence * 100).toFixed(0)}%)`));
      }
    }

    if (ambiguous.length > 0) {
      console.log(chalk.yellow.bold(`\n  Ambiguous (${ambiguous.length}):`));
      for (const r of ambiguous) {
        console.log(chalk.yellow(`    [${r.commitHash}] ${r.file}`));
        console.log(chalk.dim(`      Rule: ${r.rule}`));
        console.log(chalk.dim(`      ${r.detail} (confidence: ${(r.confidence * 100).toFixed(0)}%)`));
      }
    }

    console.log('');
    const total = results.length;
    const driftPct = ((drifting.length / total) * 100).toFixed(0);
    console.log(chalk.dim(`Summary: ${drifting.length} drifting, ${ambiguous.length} ambiguous out of ${total} findings (${driftPct}% drift)`));
  }
}
