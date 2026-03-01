import _traverse from "@babel/traverse";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import type {
  Convention,
  DetectedPattern,
  ModelTier,
  Violation,
} from "../../config/types.js";
import { ModelManager } from "../../models/ModelManager.js";
import { SemanticCoherenceService } from "./SemanticCoherenceService.js";
const traverse =
  typeof _traverse === "function"
    ? _traverse
    : (_traverse?.default ?? _traverse);

const SEMANTIC_PATTERN = "Export semantically fits file context";
const SUPPORTED_EXT = new Set([".ts", ".tsx"]);

function extractAllExports(ast: unknown): string[] {
  const exports: string[] = [];
  try {
    traverse(
      ast as import("@babel/types").Node,
      {
        ExportDefaultDeclaration(path: {
          node: {
            declaration: { type: string; id?: { name: string }; name?: string };
          };
        }) {
          const decl = path.node.declaration as {
            type: string;
            id?: { name: string };
            name?: string;
          };
          if (decl.type === "ClassDeclaration" && decl.id)
            exports.push(decl.id.name);
          else if (decl.type === "FunctionDeclaration" && decl.id)
            exports.push(decl.id.name);
          else if (decl.type === "Identifier" && decl.name)
            exports.push(decl.name);
        },
        ExportNamedDeclaration(path: {
          node: {
            declaration?: {
              type: string;
              id?: { name: string };
              declarations?: Array<{ id: { type: string; name?: string } }>;
            };
            specifiers?: Array<{ exported: { name: string } }>;
          };
        }) {
          const { node } = path;
          if (node.declaration) {
            const d = node.declaration;
            if (d.type === "ClassDeclaration" && d.id) exports.push(d.id.name);
            else if (d.type === "TSTypeAliasDeclaration" && d.id)
              exports.push(d.id.name);
            else if (d.type === "TSInterfaceDeclaration" && d.id)
              exports.push(d.id.name);
            else if (
              d.type === "VariableDeclaration" &&
              d.declarations?.[0]?.id
            ) {
              const id = d.declarations[0].id;
              const name = id.type === "Identifier" ? id.name : undefined;
              if (name) exports.push(name);
            } else if (d.type === "FunctionDeclaration" && d.id)
              exports.push(d.id.name);
          } else if (node.specifiers) {
            for (const spec of node.specifiers) {
              const name = spec.exported?.name;
              if (name) exports.push(name);
            }
          }
        },
        noScope: true,
      } as Parameters<typeof traverse>[1],
    );
  } catch {
    // ignore
  }
  return [...new Set(exports)];
}

function extractTopLevelNonExports(ast: unknown): string[] {
  const symbols: string[] = [];
  try {
    traverse(
      ast as import("@babel/types").Node,
      {
        FunctionDeclaration(path: {
          parent?: { type?: string };
          node: { id?: { name: string } };
        }) {
          if (path.parent?.type === "ExportNamedDeclaration") return;
          if (path.node.id?.name) symbols.push(path.node.id.name);
        },
        VariableDeclaration(path: {
          parent?: { type?: string };
          node: {
            declarations?: Array<{ id: { type: string; name?: string } }>;
          };
        }) {
          if (path.parent?.type === "ExportNamedDeclaration") return;
          const first = path.node.declarations?.[0]?.id;
          if (first?.type === "Identifier" && first.name)
            symbols.push(first.name);
        },
        noScope: true,
      } as Parameters<typeof traverse>[1],
    );
  } catch {
    // ignore
  }
  return symbols;
}

function extractAllTopLevelSymbols(ast: unknown): string[] {
  const exports = extractAllExports(ast);
  const nonExports = extractTopLevelNonExports(ast);
  return [...new Set([...exports, ...nonExports])];
}

async function parseFile(
  projectRoot: string,
  filePath: string,
): Promise<{ code: string; symbolNames: string[] } | null> {
  try {
    const absolutePath = join(projectRoot, filePath);
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
    const symbolNames = extractAllTopLevelSymbols(ast);
    if (symbolNames.length === 0) return null;
    return { code, symbolNames };
  } catch {
    return null;
  }
}

function getFileStem(filePath: string): string {
  const base = filePath.split("/").pop() ?? "";
  return base.replace(/\.[^.]+$/, "");
}

export async function detectSemanticPattern(
  projectRoot: string,
  filePaths: string[],
  modelTier: ModelTier,
): Promise<DetectedPattern | null> {
  const tsFiles = filePaths.filter((f) => SUPPORTED_EXT.has(extname(f)));
  if (tsFiles.length < 3) return null;

  const modelManager = new ModelManager(modelTier);
  const service = new SemanticCoherenceService(modelManager);

  let fits = 0;
  let total = 0;
  const examples: string[] = [];

  for (const filePath of tsFiles) {
    const parsed = await parseFile(projectRoot, filePath);
    if (!parsed) continue;
    const fileStem = getFileStem(filePath);
    const snippet = parsed.code.slice(0, 512);
    for (const symbolName of parsed.symbolNames) {
      total++;
      const ok = await service.checkExportFitsContext(
        symbolName,
        fileStem,
        snippet,
      );
      if (ok) fits++;
      if (examples.length < 5) examples.push(filePath);
    }
  }

  await modelManager.disposeModel();

  if (total < 3) return null;
  const confidence = Math.round((fits / total) * 100);
  if (confidence < 5) return null;

  return {
    dimension: "naming",
    pattern: SEMANTIC_PATTERN,
    frequency: fits,
    total,
    confidence,
    examples,
  };
}

export async function detectSemanticViolations(
  projectRoot: string,
  filePaths: string[],
  conventions: Convention[],
  modelTier: ModelTier,
  options?: { semanticFitThreshold?: number; onProgress?: (msg: string) => void },
): Promise<Violation[]> {
  const convention = conventions.find(
    (c) =>
      c.confirmed && c.dimension === "naming" && c.rule === SEMANTIC_PATTERN,
  );
  if (!convention) return [];

  const tsFiles = filePaths.filter((f) => SUPPORTED_EXT.has(extname(f)));
  if (tsFiles.length === 0) return [];

  const threshold = options?.semanticFitThreshold ?? 0.6;
  const onProgress = options?.onProgress;
  onProgress?.("Loading Zero-shot classification...");
  const modelManager = new ModelManager(modelTier, undefined, {
    onLoaded: onProgress ? (d) => onProgress(`Loaded ${d}`) : undefined,
  });
  const service = new SemanticCoherenceService(modelManager);
  const { randomUUID } = await import("node:crypto");
  const violations: Violation[] = [];

  for (const filePath of tsFiles) {
    const parsed = await parseFile(projectRoot, filePath);
    if (!parsed) continue;
    const fileStem = getFileStem(filePath);
    const snippet = parsed.code.slice(0, 512);
    for (const symbolName of parsed.symbolNames) {
      const ok = await service.checkExportFitsContext(
        symbolName,
        fileStem,
        snippet,
        threshold,
      );
      if (!ok) {
        violations.push({
          id: randomUUID(),
          conventionId: convention.id,
          severity: convention.severity,
          file: filePath,
          message: `Violates: ${SEMANTIC_PATTERN}`,
          expected: `Symbol "${symbolName}" should fit file context (${fileStem})`,
          found: `Symbol "${symbolName}" does not semantically fit file context`,
          autoFixable: false,
        });
      }
    }
  }

  await modelManager.disposeModel();
  return violations;
}
