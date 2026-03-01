import { basename } from 'node:path';
import type { DocumentGenerator, GenerationContext, LlmRequiredContext } from './types.js';
import {
  EXECUTIVE_SUMMARY_INSTRUCTION,
  EXISTING_CONTENT_INSTRUCTION,
  STRUCTURE_INSTRUCTION,
} from './promptHelpers.js';

export class ContributingGenerator implements DocumentGenerator {
  async generate(ctx: GenerationContext): Promise<string> {
    const projectName = basename(ctx.projectRoot);
    const sections: string[] = [];

    sections.push(`# Contributing to ${projectName}\n`);
    sections.push(this.buildSetup(projectName));
    sections.push(this.buildWorkflow());
    sections.push(this.buildCodingStandards(ctx));
    sections.push(this.buildPrProcess());

    const template = sections.join('\n');

    if (ctx.llmAvailable && ctx.llmClient) {
      return this.enhanceWithLlm(ctx as LlmRequiredContext, template);
    }
    return template;
  }

  private buildSetup(projectName: string): string {
    return [
      '## Setup\n',
      '```bash',
      'git clone <repository-url>',
      `cd ${projectName}`,
      'npm install',
      'npm run build',
      'npm test',
      '```',
      '',
    ].join('\n');
  }

  private buildWorkflow(): string {
    return [
      '## Development Workflow\n',
      '1. Create a feature branch from `main`',
      '2. Make your changes with clear, atomic commits',
      '3. Write or update tests for your changes',
      '4. Ensure all tests pass and linting is clean',
      '5. Open a pull request against `main`',
      '',
    ].join('\n');
  }

  private buildCodingStandards(ctx: GenerationContext): string {
    const confirmed = ctx.conventions.filter((c) => c.confirmed);
    if (confirmed.length === 0) {
      return [
        '## Coding Standards\n',
        'Follow the existing patterns in the codebase. Run `codeplug conventions audit` to check compliance.',
        '',
      ].join('\n');
    }

    const lines = ['## Coding Standards\n'];
    const byDimension = new Map<string, string[]>();
    for (const c of confirmed) {
      const list = byDimension.get(c.dimension) ?? [];
      list.push(c.rule);
      byDimension.set(c.dimension, list);
    }

    for (const [dim, rules] of byDimension) {
      lines.push(`### ${dim}\n`);
      for (const rule of rules) {
        lines.push(`- ${rule}`);
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  private buildPrProcess(): string {
    return [
      '## Pull Request Process\n',
      '1. Fill out the PR template completely',
      '2. Request review from at least one maintainer',
      '3. Address all review comments',
      '4. Ensure CI passes before merging',
      '5. Squash and merge when approved',
      '',
    ].join('\n');
  }

  private async enhanceWithLlm(ctx: LlmRequiredContext, template: string): Promise<string> {
    const parts = [
      `Improve this CONTRIBUTING.md for a ${ctx.audience} audience in a ${ctx.style} style.`,
      EXECUTIVE_SUMMARY_INSTRUCTION,
      STRUCTURE_INSTRUCTION,
      'Make it welcoming and actionable. Include branch naming and commit message guidance where relevant.',
    ];
    if (ctx.existingDoc) {
      parts.push(EXISTING_CONTENT_INSTRUCTION);
      parts.push('', '--- EXISTING CONTRIBUTING ---', ctx.existingDoc, '--- END ---', '', '--- GENERATED TEMPLATE ---');
    }
    parts.push('Return only the final markdown.\n', template);

    return ctx.llmClient.generate(parts.join('\n'), {
      systemPrompt: 'You are a technical writer creating contributor documentation. Include an executive summary and welcoming overview.',
      temperature: 0.3,
      maxTokens: 2500,
    });
  }
}
