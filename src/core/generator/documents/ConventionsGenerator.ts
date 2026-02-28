import type { Convention } from '../../../config/types.js';
import type { DocumentGenerator, GenerationContext } from './types.js';

export class ConventionsGenerator implements DocumentGenerator {
  async generate(ctx: GenerationContext): Promise<string> {
    const sections: string[] = [];

    sections.push('# Conventions\n');
    sections.push(this.buildIntro(ctx));
    sections.push(this.buildConventionList(ctx.conventions));

    const template = sections.join('\n');

    if (ctx.llmAvailable && ctx.llmClient) {
      return this.enhanceWithLlm(ctx, template);
    }
    return template;
  }

  private buildIntro(ctx: GenerationContext): string {
    const confirmed = ctx.conventions.filter((c) => c.confirmed).length;
    return [
      `This document describes **${ctx.conventions.length}** conventions detected in the codebase`,
      `(${confirmed} confirmed).\n`,
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

  private async enhanceWithLlm(ctx: GenerationContext, template: string): Promise<string> {
    const prompt = [
      `Improve this CONVENTIONS.md for a ${ctx.audience} audience in a ${ctx.style} style.`,
      'Make descriptions concise and actionable. Return only the final markdown.\n',
      template,
    ].join('\n');

    return ctx.llmClient!.generate(prompt, {
      systemPrompt: 'You are a technical writer documenting coding conventions.',
      temperature: 0.3,
      maxTokens: 2000,
    });
  }
}
