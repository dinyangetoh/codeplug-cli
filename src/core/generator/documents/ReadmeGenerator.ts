import { basename } from 'node:path';
import type { FolderNode } from '../../../config/types.js';
import { DEFAULT_DOCS } from '../../../config/defaults.js';
import type { DocumentGenerator, GenerationContext, LlmRequiredContext } from './types.js';
import {
  EXECUTIVE_SUMMARY_INSTRUCTION,
  EXISTING_CONTENT_INSTRUCTION,
  STRUCTURE_INSTRUCTION,
} from './promptHelpers.js';

export class ReadmeGenerator implements DocumentGenerator {
  async generate(ctx: GenerationContext): Promise<string> {
    const projectName = ctx.packageMetadata?.name ?? basename(ctx.projectRoot);
    const sections: string[] = [];

    sections.push(`# ${projectName}\n`);
    sections.push(this.buildDescription(ctx));
    sections.push(this.buildFeatures(ctx));
    sections.push(this.buildQuickStart(projectName, ctx));
    sections.push(this.buildPrerequisites(ctx));
    sections.push(this.buildInstallation(projectName, ctx));
    sections.push(this.buildUsage(ctx));
    sections.push(this.buildFolderStructure(ctx.analysis.folderStructure));
    sections.push(this.buildTechStack(ctx));
    sections.push(this.buildConfiguration(ctx));
    sections.push(this.buildDevelopment(ctx));
    sections.push(this.buildConventionsSummary(ctx));

    const template = sections.filter(Boolean).join('\n');

    if (ctx.llmAvailable && ctx.llmClient) {
      return this.enhanceWithLlm(ctx as LlmRequiredContext, template);
    }
    return template;
  }

  private buildDescription(ctx: GenerationContext): string {
    const tagline = ctx.packageMetadata?.description;
    const { analysis } = ctx;
    const topPatterns = analysis.patterns
      .slice(0, 3)
      .map((p) => p.pattern)
      .join(', ');

    if (tagline) {
      return [`## Overview\n`, tagline, '', topPatterns ? `Key patterns: ${topPatterns}.` : '', ''].filter(Boolean).join('\n');
    }
    return [
      '## Overview\n',
      `A project with ${analysis.fileCount} source files.`,
      topPatterns ? `Key patterns: ${topPatterns}.` : '',
      '',
    ].filter(Boolean).join('\n');
  }

  private buildFeatures(ctx: GenerationContext): string {
    const keywords = ctx.packageMetadata?.keywords ?? [];
    const dimensions = new Set(ctx.analysis.patterns.map((p) => p.dimension));
    const features: string[] = [];

    if (keywords.length > 0) {
      features.push(...keywords.slice(0, 6));
    }
    if (dimensions.has('component')) features.push('Component-based architecture');
    if (dimensions.has('testing')) features.push('Automated testing');
    if (ctx.conventions.length > 0) features.push('Convention detection');

    if (features.length === 0) return '';

    return ['## Features\n', ...features.map((f) => `- ${f}`), '', ''].join('\n');
  }

  private buildQuickStart(projectName: string, ctx: GenerationContext): string {
    const bin = ctx.packageMetadata?.bin;
    const isCli = !!bin;
    const pkgName = ctx.packageMetadata?.name ?? 'package-name';

    if (isCli) {
      const cmd = typeof bin === 'string' ? bin.split('/').pop() ?? pkgName.replace(/^@[\w-]+\//, '') : Object.keys(bin)[0] ?? 'cli';
      return [
        '## Quick Start\n',
        '```bash',
        'npm install -g @dinyangetoh/codeplug-cli',
        `cd ${projectName}`,
        `${cmd} convention init`,
        `${cmd} convention audit`,
        '```',
        '',
      ].join('\n');
    }

    return [
      '## Quick Start\n',
      '```bash',
      'git clone <repository-url>',
      `cd ${projectName}`,
      'npm install',
      'npm run build',
      'npm start',
      '```',
      '',
    ].join('\n');
  }

  private buildPrerequisites(ctx: GenerationContext): string {
    const engines = ctx.packageMetadata?.engines;
    const nodeReq = engines?.node;

    if (!nodeReq) return '';

    return [
      '## Prerequisites\n',
      `- Node.js ${nodeReq}`,
      '- Git (for drift detection and history analysis)',
      '',
    ].join('\n');
  }

  private buildInstallation(projectName: string, ctx: GenerationContext): string {
    const bin = ctx.packageMetadata?.bin;
    const isCli = !!bin;
    const pkgName = ctx.packageMetadata?.name ?? 'package-name';

    if (isCli) {
      return [
        '## Installation\n',
        '### Global install\n',
        '```bash',
        `npm install -g ${pkgName}`,
        '```',
        '',
        '### Local development\n',
        '```bash',
        'git clone <repository-url>',
        `cd ${projectName}`,
        'npm install',
        'npm run build',
        'node dist/cli/index.js --help',
        '```',
        '',
      ].join('\n');
    }

    return [
      '## Installation\n',
      '```bash',
      'git clone <repository-url>',
      `cd ${projectName}`,
      'npm install',
      'npm run build',
      '```',
      '',
    ].join('\n');
  }

  private buildUsage(ctx: GenerationContext): string {
    const bin = ctx.packageMetadata?.bin;
    if (!bin) return '';

    const cmd = typeof bin === 'string' ? bin.split('/').pop() ?? 'codeplug' : Object.keys(bin)[0] ?? 'codeplug';
    return [
      '## Usage\n',
      `Use \`${cmd}\` to run commands. See \`${cmd} --help\` for options.`,
      '',
    ].join('\n');
  }

  private buildFolderStructure(root: FolderNode, depth = 0, maxDepth = 3): string {
    if (depth === 0) {
      const lines = ['## Project Structure\n', '```'];
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

    return ['## Tech Stack\n', ...techs.map((t) => `- ${t}`), '', ''].join('\n');
  }

  private buildConfiguration(ctx: GenerationContext): string {
    const hasConfig = ctx.analysis.patterns.some((p) => p.dimension === 'structure' && p.pattern.toLowerCase().includes('config'));
    const hasCodeplug = ctx.conventions.some((c) => c.dimension === 'structure');
    if (!hasConfig && !hasCodeplug) return '';

    return [
      '## Configuration\n',
      'Project-level configuration can be adjusted in config files. See project docs for options.',
      '',
    ].join('\n');
  }

  private buildDevelopment(ctx: GenerationContext): string {
    const scripts = ctx.packageMetadata?.scripts;
    if (!scripts || Object.keys(scripts).length === 0) return '';

    const candidates = ctx.docsConfig?.devScripts ?? DEFAULT_DOCS.devScripts ?? [];
    const devScripts = candidates.filter((s) => scripts[s]);
    if (devScripts.length === 0) return '';

    const lines = ['## Development\n', '```bash', ...devScripts.map((s) => `npm run ${s}`), '```', ''];
    return lines.join('\n');
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

  private async enhanceWithLlm(ctx: LlmRequiredContext, template: string): Promise<string> {
    const baseInstructions = [
      `Improve the following README for a ${ctx.audience} audience in a ${ctx.style} style.`,
      EXECUTIVE_SUMMARY_INSTRUCTION,
      STRUCTURE_INSTRUCTION,
    ];

    let prompt: string;
    if (ctx.existingDoc) {
      prompt = [
        ...baseInstructions,
        EXISTING_CONTENT_INSTRUCTION,
        'Below is the EXISTING README. Preserve valuable content: tagline, features list, usage commands, configuration, installation, development. Incorporate the generated analysis (folder structure, conventions). Return only the final markdown.',
        '',
        '--- EXISTING README ---',
        ctx.existingDoc,
        '--- END EXISTING README ---',
        '',
        '--- GENERATED TEMPLATE (incorporate into merged output) ---',
        template,
      ].join('\n');
    } else {
      prompt = [
        ...baseInstructions,
        'Include: Executive Summary, Features, Quick Start, Prerequisites, Installation, Usage, Configuration (if applicable), Development, Project Structure, Conventions. Use package metadata when provided.',
        'Return only the final markdown.\n',
        template,
      ].join('\n');
    }

    return ctx.llmClient.generate(prompt, {
      systemPrompt:
        'You are a technical documentation writer. Preserve existing high-value content when instructed. Always include a clear executive summary and section titles.',
      temperature: 0.3,
      maxTokens: 4000,
    });
  }
}
