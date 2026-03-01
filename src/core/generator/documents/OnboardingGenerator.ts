import { basename } from 'node:path';
import type { FolderNode } from '../../../config/types.js';
import type { DocumentGenerator, GenerationContext, LlmRequiredContext } from './types.js';
import {
  EXECUTIVE_SUMMARY_INSTRUCTION,
  EXISTING_CONTENT_INSTRUCTION,
  STRUCTURE_INSTRUCTION,
} from './promptHelpers.js';

export class OnboardingGenerator implements DocumentGenerator {
  async generate(ctx: GenerationContext): Promise<string> {
    const projectName = ctx.packageMetadata?.name ?? basename(ctx.projectRoot);
    const sections: string[] = [];

    sections.push(`# Onboarding — ${projectName}\n`);
    sections.push(this.buildProjectOverview(ctx));
    sections.push(this.buildEnvironmentSetup(projectName, ctx));
    sections.push(this.buildKeyConcepts(ctx));
    sections.push(this.buildArchitectureTour(ctx));
    sections.push(this.buildCommonTasks(ctx));

    const template = sections.join('\n');

    if (ctx.llmAvailable && ctx.llmClient) {
      return this.enhanceWithLlm(ctx as LlmRequiredContext, template);
    }
    return template;
  }

  private buildProjectOverview(ctx: GenerationContext): string {
    const { analysis } = ctx;
    const description = ctx.packageMetadata?.description;
    const lines = ['## Executive Summary\n'];
    if (description) {
      lines.push(`**What is ${ctx.packageMetadata?.name ?? basename(ctx.projectRoot)}?** ${description}`);
      lines.push('');
    }
    lines.push(
      `The codebase contains ${analysis.fileCount} source files.`,
      `${ctx.conventions.length} coding conventions have been identified.`,
      '',
    );
    return lines.join('\n');
  }

  private buildEnvironmentSetup(projectName: string, ctx?: GenerationContext): string {
    const nodeReq = ctx?.packageMetadata?.engines?.node ?? '20.0.0';
    return [
      '## Environment Setup\n',
      '### Prerequisites\n',
      `- Node.js ${nodeReq}`,
      '- npm or yarn',
      '',
      '### Installation\n',
      '```bash',
      'git clone <repository-url>',
      `cd ${projectName}`,
      'npm install',
      '```',
      '',
      '### Verify Setup\n',
      '```bash',
      'npm run build',
      'npm test',
      '```',
      '',
    ].join('\n');
  }

  private buildKeyConcepts(ctx: GenerationContext): string {
    const dimensions = [...new Set(ctx.analysis.patterns.map((p) => p.dimension))];
    if (dimensions.length === 0) return '';

    const lines = ['## Key Concepts\n'];
    for (const dim of dimensions) {
      const patterns = ctx.analysis.patterns.filter((p) => p.dimension === dim);
      lines.push(`### ${dim}\n`);
      for (const p of patterns.slice(0, 3)) {
        lines.push(`- ${p.pattern} (${(p.confidence * 100).toFixed(0)}% confidence)`);
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  private buildArchitectureTour(ctx: GenerationContext): string {
    const root = ctx.analysis.folderStructure;
    if (root.children.length === 0) return '';

    const lines = ['## Architecture Tour\n'];
    lines.push('Key directories:\n');
    for (const child of root.children) {
      lines.push(`- **${child.name}/** — ${child.fileCount} files${this.describePurpose(child)}`);
    }
    lines.push('');
    return lines.join('\n');
  }

  private describePurpose(node: FolderNode): string {
    const name = node.name.toLowerCase();
    const purposes: Record<string, string> = {
      src: ' (source code)',
      lib: ' (library code)',
      test: ' (tests)',
      tests: ' (tests)',
      config: ' (configuration)',
      docs: ' (documentation)',
      scripts: ' (build/utility scripts)',
      public: ' (static assets)',
      assets: ' (static assets)',
    };
    return purposes[name] ?? '';
  }

  private buildCommonTasks(ctx?: GenerationContext): string {
    const scripts = ctx?.packageMetadata?.scripts ?? {};
    const defaults = [
      ['Build', 'build'],
      ['Run tests', 'test'],
      ['Lint', 'lint'],
      ['Dev mode', 'dev'],
    ];
    const rows = defaults.filter(([, cmd]) => scripts[cmd]).map(([task, cmd]) => `| ${task} | \`npm run ${cmd}\` |`);
    if (rows.length === 0) {
      rows.push('| Build | `npm run build` |', '| Run tests | `npm test` |');
    }
    return ['## Common Tasks\n', '| Task | Command |', '|------|---------|', ...rows, '', ''].join('\n');
  }

  private async enhanceWithLlm(ctx: LlmRequiredContext, template: string): Promise<string> {
    const parts = [
      `Improve this ONBOARDING.md for a ${ctx.audience} audience in a ${ctx.style} style.`,
      EXECUTIVE_SUMMARY_INSTRUCTION,
      STRUCTURE_INSTRUCTION,
      'Include "What is [Project]?" with the project tagline from package metadata. Make it friendly and thorough for new team members.',
      'Do not leave placeholder text like [brief description]. Use the provided metadata and analysis.',
    ];
    if (ctx.existingDoc) {
      parts.push(EXISTING_CONTENT_INSTRUCTION);
      parts.push('', '--- EXISTING ONBOARDING ---', ctx.existingDoc, '--- END ---', '', '--- GENERATED TEMPLATE ---');
    }
    parts.push('Return only the final markdown.\n', template);

    return ctx.llmClient.generate(parts.join('\n'), {
      systemPrompt: 'You are a technical writer creating onboarding documentation for new developers. Include an executive summary and project tagline.',
      temperature: 0.3,
      maxTokens: 2500,
    });
  }
}
