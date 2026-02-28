import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  DocsGenerateOptions,
  DocGenerationResult,
  DocUpdateResult,
  Convention,
  AnalysisResult,
} from '../../config/types.js';
import { ConfigManager } from '../../config/ConfigManager.js';
import { ConventionStore } from '../../storage/ConventionStore.js';
import { LlmClient } from './llm/LlmClient.js';
import { checkOllamaHealth } from './llm/healthCheck.js';
import { StalenessTracker } from './StalenessTracker.js';
import type { DocumentGenerator, GenerationContext } from './documents/types.js';
import { ReadmeGenerator } from './documents/ReadmeGenerator.js';
import { ArchitectureGenerator } from './documents/ArchitectureGenerator.js';
import { ConventionsGenerator } from './documents/ConventionsGenerator.js';
import { ContributingGenerator } from './documents/ContributingGenerator.js';
import { OnboardingGenerator } from './documents/OnboardingGenerator.js';

const DOC_GENERATORS: Record<string, DocumentGenerator> = {
  'README.md': new ReadmeGenerator(),
  'ARCHITECTURE.md': new ArchitectureGenerator(),
  'CONVENTIONS.md': new ConventionsGenerator(),
  'CONTRIBUTING.md': new ContributingGenerator(),
  'ONBOARDING.md': new OnboardingGenerator(),
};

const ALL_DOC_NAMES = Object.keys(DOC_GENERATORS);

export class DocGenerator {
  private stalenessTracker: StalenessTracker;

  constructor(private projectRoot: string) {
    this.stalenessTracker = new StalenessTracker(projectRoot);
  }

  async generate(options: DocsGenerateOptions): Promise<DocGenerationResult> {
    const start = Date.now();
    const chalk = (await import('chalk')).default;

    const targetDocs = this.resolveTargetDocs(options.doc);
    const audience = options.audience ?? 'developers';
    const style = options.style ?? 'professional';

    console.log(chalk.blue(`Generating ${targetDocs.length} document(s)...`));

    const analysis = await this.runAnalysis();
    const conventions = await this.loadConventions();
    const { llmAvailable, llmClient } = await this.prepareLlm();

    if (!llmAvailable) {
      console.log(chalk.yellow('LLM unavailable — using template-only generation.'));
    }

    const ctx: GenerationContext = {
      analysis,
      conventions,
      projectRoot: this.projectRoot,
      audience,
      style,
      llmAvailable,
      llmClient,
    };

    const written: string[] = [];
    const sourceHash = await this.stalenessTracker.computeSourceHash();

    for (const docName of targetDocs) {
      const generator = DOC_GENERATORS[docName];
      if (!generator) continue;

      try {
        const content = await generator.generate(ctx);
        const outPath = join(this.projectRoot, docName);
        await writeFile(outPath, content, 'utf-8');
        await this.stalenessTracker.update(docName, sourceHash);
        written.push(docName);
        console.log(chalk.green(`  ✓ ${docName}`));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(chalk.red(`  ✗ ${docName}: ${msg}`));
      }
    }

    return {
      docsCreated: written.length,
      durationMs: Date.now() - start,
      documents: written,
    };
  }

  async update(): Promise<DocUpdateResult> {
    const chalk = (await import('chalk')).default;
    const statuses = await this.stalenessTracker.check();
    const staleDocs = statuses.filter((s) => s.stale).map((s) => s.name);

    if (staleDocs.length === 0) {
      console.log(chalk.green('All documents are up to date.'));
      return { docsUpdated: 0, documents: [] };
    }

    console.log(chalk.blue(`Regenerating ${staleDocs.length} stale document(s)...`));
    const result = await this.generate({ doc: staleDocs.length === ALL_DOC_NAMES.length ? undefined : staleDocs[0] });
    return {
      docsUpdated: result.docsCreated,
      documents: result.documents,
    };
  }

  private resolveTargetDocs(doc?: string): string[] {
    if (!doc) return ALL_DOC_NAMES;

    const normalised = this.normaliseName(doc);
    if (DOC_GENERATORS[normalised]) return [normalised];

    throw new Error(`Unknown document: ${doc}. Available: ${ALL_DOC_NAMES.join(', ')}`);
  }

  private normaliseName(input: string): string {
    const mapping: Record<string, string> = {
      readme: 'README.md',
      architecture: 'ARCHITECTURE.md',
      conventions: 'CONVENTIONS.md',
      contributing: 'CONTRIBUTING.md',
      onboarding: 'ONBOARDING.md',
    };
    return mapping[input.toLowerCase()] ?? input;
  }

  private async runAnalysis(): Promise<AnalysisResult> {
    const { AstAnalyzer } = await import('../analyzer/AstAnalyzer.js');
    const analyzer = new AstAnalyzer(this.projectRoot);
    return analyzer.analyze();
  }

  private async loadConventions(): Promise<Convention[]> {
    const store = new ConventionStore(this.projectRoot);
    if (await store.exists()) {
      return store.load();
    }
    return [];
  }

  private async prepareLlm(): Promise<{ llmAvailable: boolean; llmClient?: LlmClient }> {
    try {
      const config = new ConfigManager(this.projectRoot);
      await config.load();
      const llmConfig = config.getLlmConfig();

      const health = await checkOllamaHealth(llmConfig.baseUrl);
      if (!health.available) {
        return { llmAvailable: false };
      }

      return { llmAvailable: true, llmClient: new LlmClient(llmConfig) };
    } catch {
      return { llmAvailable: false };
    }
  }
}
