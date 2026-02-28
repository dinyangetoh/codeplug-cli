import { basename } from 'node:path';
import type { FolderNode } from '../../../config/types.js';
import type { DocumentGenerator, GenerationContext } from './types.js';

export class ReadmeGenerator implements DocumentGenerator {
  async generate(ctx: GenerationContext): Promise<string> {
    const projectName = basename(ctx.projectRoot);
    const sections: string[] = [];

    sections.push(`# ${projectName}\n`);
    sections.push(this.buildDescription(ctx));
    sections.push(this.buildQuickStart(projectName));
    sections.push(this.buildFolderStructure(ctx.analysis.folderStructure));
    sections.push(this.buildTechStack(ctx));
    sections.push(this.buildConventionsSummary(ctx));

    const template = sections.join('\n');

    if (ctx.llmAvailable && ctx.llmClient) {
      return this.enhanceWithLlm(ctx, template);
    }
    return template;
  }

  private buildDescription(ctx: GenerationContext): string {
    const { analysis } = ctx;
    const topPatterns = analysis.patterns
      .slice(0, 3)
      .map((p) => p.pattern)
      .join(', ');

    return [
      '## Description\n',
      `A project with ${analysis.fileCount} source files.`,
      topPatterns ? `Key patterns: ${topPatterns}.` : '',
      '',
    ].filter(Boolean).join('\n');
  }

  private buildQuickStart(projectName: string): string {
    return [
      '## Quick Start\n',
      '```bash',
      `git clone <repository-url>`,
      `cd ${projectName}`,
      'npm install',
      'npm run build',
      'npm start',
      '```',
      '',
    ].join('\n');
  }

  private buildFolderStructure(root: FolderNode, depth = 0, maxDepth = 3): string {
    if (depth === 0) {
      const lines = ['## Folder Structure\n', '```'];
      lines.push(...this.renderTree(root, 0, maxDepth));
      lines.push('```', '');
      return lines.join('\n');
    }
    return '';
  }

  private renderTree(node: FolderNode, depth: number, maxDepth: number): string[] {
    if (depth > maxDepth) return [];
    const indent = '  '.repeat(depth);
    const lines: string[] = [`${indent}${node.name}/ (${node.fileCount} files)`];
    for (const child of node.children) {
      lines.push(...this.renderTree(child, depth + 1, maxDepth));
    }
    return lines;
  }

  private buildTechStack(ctx: GenerationContext): string {
    const dimensions = new Set(ctx.analysis.patterns.map((p) => p.dimension));
    const techs: string[] = [];
    if (dimensions.has('imports')) techs.push('ES Modules');
    if (dimensions.has('component')) techs.push('Component-based architecture');
    if (dimensions.has('testing')) techs.push('Automated testing');
    if (dimensions.has('api')) techs.push('API layer');
    if (dimensions.has('state')) techs.push('State management');

    if (techs.length === 0) return '';

    return [
      '## Tech Stack\n',
      ...techs.map((t) => `- ${t}`),
      '',
    ].join('\n');
  }

  private buildConventionsSummary(ctx: GenerationContext): string {
    if (ctx.conventions.length === 0) return '';

    const confirmed = ctx.conventions.filter((c) => c.confirmed);
    const grouped = new Map<string, string[]>();
    for (const c of confirmed.slice(0, 10)) {
      const list = grouped.get(c.dimension) ?? [];
      list.push(c.rule);
      grouped.set(c.dimension, list);
    }

    const lines = ['## Conventions\n'];
    for (const [dim, rules] of grouped) {
      lines.push(`### ${dim}\n`);
      for (const rule of rules) {
        lines.push(`- ${rule}`);
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  private async enhanceWithLlm(ctx: GenerationContext, template: string): Promise<string> {
    const prompt = [
      `Improve the following README.md for a ${ctx.audience} audience in a ${ctx.style} style.`,
      'Keep the same structure and sections but make the prose clear and professional.',
      'Return only the final markdown.\n',
      template,
    ].join('\n');

    return ctx.llmClient!.generate(prompt, {
      systemPrompt: 'You are a technical documentation writer.',
      temperature: 0.3,
      maxTokens: 2000,
    });
  }
}
