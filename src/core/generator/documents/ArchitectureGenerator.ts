import { basename } from 'node:path';
import type { FolderNode } from '../../../config/types.js';
import type { DocumentGenerator, GenerationContext, LlmRequiredContext } from './types.js';

export class ArchitectureGenerator implements DocumentGenerator {
  async generate(ctx: GenerationContext): Promise<string> {
    const projectName = basename(ctx.projectRoot);
    const sections: string[] = [];

    sections.push(`# ${projectName} — Architecture\n`);
    sections.push(this.buildOverview(ctx));
    sections.push(this.buildDirectoryMap(ctx.analysis.folderStructure));
    sections.push(this.buildComponentRelationships(ctx));
    sections.push(this.buildDataFlow(ctx));
    sections.push(this.buildDesignDecisions(ctx));

    const template = sections.join('\n');

    if (ctx.llmAvailable && ctx.llmClient) {
      return this.enhanceWithLlm(ctx as LlmRequiredContext, template);
    }
    return template;
  }

  private buildOverview(ctx: GenerationContext): string {
    const { analysis } = ctx;
    return [
      '## System Overview\n',
      `The project contains ${analysis.fileCount} source files organized across ${this.countDirs(analysis.folderStructure)} directories.`,
      '',
    ].join('\n');
  }

  private countDirs(node: FolderNode): number {
    let count = node.children.length;
    for (const child of node.children) {
      count += this.countDirs(child);
    }
    return count;
  }

  private buildDirectoryMap(root: FolderNode): string {
    const lines = ['## Directory Structure\n', '```'];
    lines.push(...this.renderTree(root, 0, 4));
    lines.push('```', '');
    return lines.join('\n');
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

  private buildComponentRelationships(ctx: GenerationContext): string {
    const structural = ctx.analysis.patterns.filter((p) => p.dimension === 'structure' || p.dimension === 'component');
    if (structural.length === 0) return '';

    const lines = ['## Component Relationships\n'];
    for (const p of structural) {
      lines.push(`- **${p.pattern}** — seen ${p.frequency}/${p.total} times (${(p.confidence * 100).toFixed(0)}% confidence)`);
    }
    lines.push('');
    return lines.join('\n');
  }

  private buildDataFlow(ctx: GenerationContext): string {
    const apiPatterns = ctx.analysis.patterns.filter((p) => p.dimension === 'api' || p.dimension === 'state');
    if (apiPatterns.length === 0) {
      return [
        '## Data Flow\n',
        'No API or state management patterns detected. Refer to source code for data flow details.',
        '',
      ].join('\n');
    }

    const lines = ['## Data Flow\n'];
    for (const p of apiPatterns) {
      lines.push(`- **${p.pattern}**: ${p.examples.slice(0, 2).join(', ') || 'N/A'}`);
    }
    lines.push('');
    return lines.join('\n');
  }

  private buildDesignDecisions(ctx: GenerationContext): string {
    const highConf = ctx.analysis.patterns.filter((p) => p.confidence >= 0.8);
    if (highConf.length === 0) return '';

    const lines = ['## Design Decisions\n'];
    for (const p of highConf.slice(0, 5)) {
      lines.push(`- **${p.dimension}**: ${p.pattern}`);
    }
    lines.push('');
    return lines.join('\n');
  }

  private async enhanceWithLlm(ctx: LlmRequiredContext, template: string): Promise<string> {
    const prompt = [
      `Improve this ARCHITECTURE.md for a ${ctx.audience} audience in a ${ctx.style} style.`,
      'Add mermaid diagrams where appropriate to illustrate component relationships and data flow.',
      'Return only the final markdown.\n',
      template,
    ].join('\n');

    return ctx.llmClient.generate(prompt, {
      systemPrompt: 'You are a software architect writing clear documentation.',
      temperature: 0.3,
      maxTokens: 3000,
    });
  }
}
