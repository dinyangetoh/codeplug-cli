import { readFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import type {
  Convention,
  ConventionAuditOptions,
  Violation,
} from "../../config/types.js";
import type { ParsedFile } from "../analyzer/AstAnalyzer.js";
import type { AstVisitor, VisitorFinding } from "../analyzer/visitors/types.js";

export class ViolationDetector {
  constructor(private projectRoot: string) {}

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

    await this.persistViolations(violations);
    return violations;
  }

  private async persistViolations(violations: Violation[]): Promise<void> {
    console.log("Persisting violations:", violations);
    const { ViolationStore } = await import("../../storage/ViolationStore.js");
    const store = new ViolationStore(this.projectRoot);
    await store.save(violations);

    console.log("Violations persisted successfully", {
      violationsCount: violations.length,
    });

    const storedViolations = await store.load();
    console.log("Stored violations:", storedViolations);
  }

  private async getTargetFiles(
    options: ConventionAuditOptions,
  ): Promise<string[]> {
    const { globby } = await import("globby");

    const allFiles = await globby(["**/*.{ts,tsx,js,jsx,mjs,cjs}"], {
      cwd: this.projectRoot,
      gitignore: true,
      ignore: [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/.codeplug/**",
      ],
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
      new NamingVisitor(),
      new ComponentVisitor(),
      new TestVisitor(),
      new ErrorHandlingVisitor(),
      new ImportVisitor(),
      new SchemaVisitor(),
      new StructureVisitor(filePaths),
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
