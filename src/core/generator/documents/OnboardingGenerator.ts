import { basename } from 'node:path';
import type { FolderNode } from '../../../config/types.js';
import type { DocumentGenerator, GenerationContext } from './types.js';

export class OnboardingGenerator implements DocumentGenerator {
  async generate(ctx: GenerationContext): Promise<string> {
    const projectName = basename(ctx.projectRoot);
    const sections: string[] = [];

    sections.push(`# Onboarding — ${projectName}\n`);
    sections.push(this.buildProjectOverview(ctx));
    sections.push(this.buildEnvironmentSetup(projectName));
    sections.push(this.buildKeyConcepts(ctx));
    sections.push(this.buildArchitectureTour(ctx));
    sections.push(this.buildCommonTasks());

    const template = sections.join('\n');

    if (ctx.llmAvailable && ctx.llmClient) {
      return this.enhanceWithLlm(ctx, template);
    }
    return template;
  }

  private buildProjectOverview(ctx: GenerationContext): string {
    const { analysis } = ctx;
    return [
      '## Project Overview\n',
      `This project contains ${analysis.fileCount} source files.`,
      `${ctx.conventions.length} coding conventions have been identified.`,
      '',
    ].join('\n');
  }

  private buildEnvironmentSetup(projectName: string): string {
    return [
      '## Environment Setup\n',
      '### Prerequisites\n',
      '- Node.js >= 20.0.0',
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

  private buildCommonTasks(): string {
    return [
      '## Common Tasks\n',
      '| Task | Command |',
      '|------|---------|',
      '| Build | `npm run build` |',
      '| Run tests | `npm test` |',
      '| Lint | `npm run lint` |',
      '| Dev mode | `npm run dev` |',
      '',
    ].join('\n');
  }

  private async enhanceWithLlm(ctx: GenerationContext, template: string): Promise<string> {
    const prompt = [
      `Improve this ONBOARDING.md for a ${ctx.audience} audience in a ${ctx.style} style.`,
      'Make it friendly and thorough for new team members. Return only the final markdown.\n',
      template,
    ].join('\n');

    return ctx.llmClient!.generate(prompt, {
      systemPrompt: 'You are a technical writer creating onboarding documentation for new developers.',
      temperature: 0.3,
      maxTokens: 2500,
    });
  }
}
