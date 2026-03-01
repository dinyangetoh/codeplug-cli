import { readFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import type {
  AnalysisConfig,
  Convention,
  ConventionAuditOptions,
  ConventionConfig,
  ModelTier,
  NamingConfig,
  StructureConfig,
  Violation,
} from "../../config/types.js";
import { DEFAULT_ANALYSIS } from "../../config/defaults.js";
import type { ParsedFile } from "../analyzer/AstAnalyzer.js";
import type { AstVisitor, VisitorFinding } from "../analyzer/visitors/types.js";

export class ViolationDetector {
  private analysisConfig: AnalysisConfig;

  private structureConfig?: StructureConfig;
  private namingConfig?: NamingConfig;
  private modelTier?: ModelTier;
  private conventionConfig?: ConventionConfig;

  constructor(
    private projectRoot: string,
    options?: { analysisConfig?: AnalysisConfig; structureConfig?: StructureConfig; namingConfig?: NamingConfig; modelTier?: ModelTier; conventionConfig?: ConventionConfig },
  ) {
    this.analysisConfig = options?.analysisConfig ?? DEFAULT_ANALYSIS;
    this.structureConfig = options?.structureConfig;
    this.namingConfig = options?.namingConfig;
    this.modelTier = options?.modelTier;
    this.conventionConfig = options?.conventionConfig;
  }

  async detect(
    conventions: Convention[],
    options: ConventionAuditOptions,
  ): Promise<Violation[]> {
    const confirmed = conventions.filter((c) => c.confirmed);
    const files = await this.getTargetFiles(options);
    if (files.length === 0) return [];

    const customRuleStore = new (await import("../../storage/CustomRuleStore.js")).CustomRuleStore(this.projectRoot);
    const customRules = (await customRuleStore.exists()) ? await customRuleStore.load() : [];

    if (confirmed.length === 0 && customRules.length === 0) return [];

    const [visitors, { randomUUID }] = await Promise.all([
      this.createVisitors(files),
      import("node:crypto"),
    ]);

    const conventionMap = new Map<string, Convention>();
    for (const c of confirmed) {
      conventionMap.set(`${c.dimension}:${c.rule}`, c);
    }

    const violations: Violation[] = [];

    for (const filePath of files) {
      const parsed = await this.parseFile(filePath);

      for (const rule of customRules) {
        try {
          let target: string;
          if (rule.scope === "filename") {
            target = basename(filePath);
          } else if (rule.scope === "path") {
            target = filePath;
          } else {
            if (!parsed) continue;
            target = parsed.code;
          }
          const re = new RegExp(rule.pattern);
          if (re.test(target)) {
            violations.push({
              id: randomUUID(),
              conventionId: `custom:${rule.id}`,
              severity: rule.severity ?? "medium",
              file: filePath,
              message: rule.message,
              expected: rule.message,
              found: target.slice(0, 80),
              autoFixable: false,
            });
          }
        } catch {
          // skip invalid rule or file
        }
      }

      if (!parsed) continue;

      for (const visitor of visitors) {
        try {
          const findings = visitor.visit(parsed);
          for (const finding of findings) {
            if (finding.count >= finding.total) continue;

            const key = `${finding.dimension}:${finding.pattern}`;
            const convention = conventionMap.get(key);
            if (!convention) continue;

            const isNamingFile =
              finding.dimension === "naming" && finding.total === 1;
            const ext = extname(filePath);
            const isClassNamesPattern = finding.pattern === "Class names use PascalCase";
            let expectedName: string | null = null;
            let foundName: string | undefined;
            let autoFixable = false;

            if (isClassNamesPattern && finding.exportedName && finding.foundValue) {
              expectedName = finding.exportedName;
              foundName = finding.foundValue;
            } else if (finding.exportedName && isNamingFile) {
              expectedName = finding.exportedName + ext;
              foundName = basename(filePath);
              autoFixable = !isClassNamesPattern;
            } else if (isNamingFile) {
              expectedName = this.computeExpectedFilename(
                basename(filePath, ext),
                ext,
                finding.pattern,
              );
              foundName = basename(filePath);
              autoFixable = expectedName !== null;
            }

            violations.push({
              id: randomUUID(),
              conventionId: convention.id,
              severity: convention.severity,
              file: filePath,
              message: `Violates: ${finding.pattern}`,
              expected: expectedName ?? finding.pattern,
              found: foundName ?? (isNamingFile ? basename(filePath) : this.describeFinding(finding, filePath)),
              autoFixable,
            });
          }
        } catch {
          // Visitor may fail on certain files; skip gracefully
        }
      }
    }

    const runSemantic = this.modelTier && files.length >= 3;
    const semanticConvention = confirmed.find((c) => c.dimension === 'naming' && c.rule === 'Export semantically fits file context');
    const semanticEnabled = semanticConvention || this.conventionConfig?.enableSemanticCoherence;
    if (runSemantic && semanticEnabled) {
      try {
        const chalk = (await import('chalk')).default;
        process.stdout.write(chalk.dim('  Running semantic coherence (HF)... '));
        const { detectSemanticViolations } = await import("../analyzer/SemanticCoherencePhase.js");
        const convList = semanticConvention ? confirmed : [...confirmed, { id: 'naming-export-semantically-fits-file-context', dimension: 'naming' as const, rule: 'Export semantically fits file context', confidence: 100, confirmed: true as const, examples: [] as string[], severity: 'medium' as const }];
        const semanticViolations = await detectSemanticViolations(
          this.projectRoot,
          files,
          convList,
          this.modelTier!,
          { semanticFitThreshold: this.conventionConfig?.semanticFitThreshold },
        );
        violations.push(...semanticViolations);
        process.stdout.write(chalk.dim(`${semanticViolations.length} violation(s)\n`));
      } catch (err) {
        const chalk = (await import('chalk')).default;
        const msg = err instanceof Error ? err.message : String(err);
        process.stdout.write(chalk.yellow(`skipped (${msg})\n`));
      }
    }

    await this.persistViolations(violations);
    return violations;
  }

  private async persistViolations(violations: Violation[]): Promise<void> {
    const { ViolationStore } = await import("../../storage/ViolationStore.js");
    const store = new ViolationStore(this.projectRoot);
    await store.save(violations);
  }

  private async getTargetFiles(
    options: ConventionAuditOptions,
  ): Promise<string[]> {
    const { globby } = await import("globby");
    const include = this.analysisConfig.include ?? DEFAULT_ANALYSIS.include;
    const ignore = this.analysisConfig.ignore ?? DEFAULT_ANALYSIS.ignore;

    const allFiles = await globby(include ?? ['**/*.{ts,tsx,js,jsx,mjs,cjs}'], {
      cwd: this.projectRoot,
      gitignore: true,
      ignore,
      absolute: false,
    });

    if (!options.since) return allFiles;

    const changedFiles = await this.getChangedFilesSince(options.since);
    if (changedFiles.length === 0) return [];

    const changedSet = new Set(changedFiles);
    return allFiles.filter((f) => changedSet.has(f));
  }

  private async getChangedFilesSince(since: string): Promise<string[]> {
    try {
      const { simpleGit } = await import("simple-git");
      const git = simpleGit(this.projectRoot);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) return [];

      const result = await git.raw([
        "log",
        "--since",
        since,
        "--name-only",
        "--format=",
      ]);
      return [
        ...new Set(
          result
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean),
        ),
      ];
    } catch {
      return [];
    }
  }

  private async parseFile(filePath: string): Promise<ParsedFile | null> {
    try {
      const absolutePath = join(this.projectRoot, filePath);
      const code = await readFile(absolutePath, "utf-8");
      const { parse } = await import("@babel/parser");

      const ast = parse(code, {
        sourceType: "module",
        plugins: [
          "typescript",
          "jsx",
          "decorators-legacy",
          "classProperties",
          "optionalChaining",
          "nullishCoalescingOperator",
          "dynamicImport",
        ],
        errorRecovery: true,
      });

      return { filePath, code, ast };
    } catch {
      return null;
    }
  }

  private async createVisitors(filePaths: string[]): Promise<AstVisitor[]> {
    const [
      { NamingVisitor },
      { ComponentVisitor },
      { TestVisitor },
      { ErrorHandlingVisitor },
      { ImportVisitor },
      { SchemaVisitor },
      { StructureVisitor },
    ] = await Promise.all([
      import("../analyzer/visitors/NamingVisitor.js"),
      import("../analyzer/visitors/ComponentVisitor.js"),
      import("../analyzer/visitors/TestVisitor.js"),
      import("../analyzer/visitors/ErrorHandlingVisitor.js"),
      import("../analyzer/visitors/ImportVisitor.js"),
      import("../analyzer/visitors/SchemaVisitor.js"),
      import("../analyzer/visitors/StructureVisitor.js"),
    ]);

    return [
      new NamingVisitor({ namingConfig: this.namingConfig }),
      new ComponentVisitor(),
      new TestVisitor(),
      new ErrorHandlingVisitor(),
      new ImportVisitor(),
      new SchemaVisitor(),
      new StructureVisitor(filePaths, this.structureConfig),
    ];
  }

  private describeFinding(finding: VisitorFinding, filePath: string): string {
    if (finding.total === 1) {
      return basename(filePath, extname(filePath));
    }
    return `${finding.count}/${finding.total} conforming`;
  }

  private computeExpectedFilename(
    stem: string,
    ext: string,
    pattern: string,
  ): string | null {
    const lower = pattern.toLowerCase();
    if (lower.includes("pascalcase")) {
      const converted = this.toPascalCase(stem);
      return converted !== stem ? converted + ext : null;
    }
    if (lower.includes("camelcase")) {
      const converted = this.toCamelCase(stem);
      return converted !== stem ? converted + ext : null;
    }
    return null;
  }

  private splitWords(str: string): string[] {
    return str
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
      .split(/[-_.\s]+/)
      .filter(Boolean);
  }

  private toCamelCase(str: string): string {
    const words = this.splitWords(str);
    if (words.length === 0) return str;
    return words
      .map((w, i) =>
        i === 0
          ? w.toLowerCase()
          : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
      )
      .join("");
  }

  private toPascalCase(str: string): string {
    const words = this.splitWords(str);
    if (words.length === 0) return str;
    return words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join("");
  }
}
