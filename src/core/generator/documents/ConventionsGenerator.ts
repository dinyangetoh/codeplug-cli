import type { Convention } from '../../../config/types.js';
import type { DocumentGenerator, GenerationContext, LlmRequiredContext } from './types.js';
import {
  EXECUTIVE_SUMMARY_INSTRUCTION,
  EXISTING_CONTENT_INSTRUCTION,
  STRUCTURE_INSTRUCTION,
} from './promptHelpers.js';

export class ConventionsGenerator implements DocumentGenerator {
  async generate(ctx: GenerationContext): Promise<string> {
    const sections: string[] = [];

    sections.push('# Conventions\n');
    sections.push(this.buildIntro(ctx));
    sections.push(this.buildConventionList(ctx.conventions));

    const template = sections.join('\n');

    if (ctx.llmAvailable && ctx.llmClient) {
      return this.enhanceWithLlm(ctx as LlmRequiredContext, template);
    }
    return template;
  }

  private buildIntro(ctx: GenerationContext): string {
    const confirmed = ctx.conventions.filter((c) => c.confirmed).length;
    return [
      '## Overview\n',
      `This document defines **${ctx.conventions.length}** conventions detected in the codebase`,
      `(${confirmed} confirmed). Use it to ensure consistency and reduce cognitive load.\n`,
    ].join(' ');
  }

  private buildConventionList(conventions: Convention[]): string {
    if (conventions.length === 0) {
      return 'No conventions have been detected yet. Run `codeplug conventions init` to analyze the codebase.\n';
    }

    const grouped = new Map<string, Convention[]>();
    for (const c of conventions) {
      const list = grouped.get(c.dimension) ?? [];
      list.push(c);
      grouped.set(c.dimension, list);
    }

    const lines: string[] = [];
    for (const [dimension, items] of grouped) {
      lines.push(`## ${dimension}\n`);
      for (const c of items) {
        lines.push(`### ${c.rule}\n`);
        lines.push(`| Property | Value |`);
        lines.push(`|----------|-------|`);
        lines.push(`| **Severity** | ${c.severity} |`);
        lines.push(`| **Confidence** | ${(c.confidence * 100).toFixed(0)}% |`);
        lines.push(`| **Confirmed** | ${c.confirmed ? 'Yes' : 'No'} |`);
        if (c.examples.length > 0) {
          lines.push('');
          lines.push('**Examples:**\n');
          for (const ex of c.examples.slice(0, 3)) {
            lines.push(`- \`${ex}\``);
          }
        }
        lines.push('');
      }
    }
    return lines.join('\n');
  }

  private async enhanceWithLlm(ctx: LlmRequiredContext, template: string): Promise<string> {
    const parts = [
      `Improve this CONVENTIONS.md for a ${ctx.audience} audience in a ${ctx.style} style.`,
      EXECUTIVE_SUMMARY_INSTRUCTION,
      STRUCTURE_INSTRUCTION,
      'Include an overview with a purpose statement. Make descriptions concise and actionable.',
    ];
    if (ctx.existingDoc) {
      parts.push(EXISTING_CONTENT_INSTRUCTION);
      parts.push('', '--- EXISTING CONVENTIONS ---', ctx.existingDoc, '--- END ---', '', '--- GENERATED TEMPLATE ---');
    }
    parts.push('Return only the final markdown.\n', template);

    return ctx.llmClient.generate(parts.join('\n'), {
      systemPrompt: 'You are a technical writer documenting coding conventions. Include an executive summary and clear overview.',
      temperature: 0.3,
      maxTokens: 2500,
    });
  }
}
