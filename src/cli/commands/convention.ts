import type {
  ConventionAuditOptions,
  ConventionFixOptions,
  ConventionInitOptions,
  ConventionScoreOptions,
} from "../../config/types.js";

export async function handleConventionInit(
  options: ConventionInitOptions,
): Promise<void> {
  const chalk = (await import("chalk")).default;
  const ora = (await import("ora")).default;
  const { ConfigManager } = await import("../../config/ConfigManager.js");
  const { AstAnalyzer } = await import("../../core/analyzer/AstAnalyzer.js");
  const { ConventionDetector } =
    await import("../../core/analyzer/ConventionDetector.js");
  const { ConventionStore } = await import("../../storage/ConventionStore.js");

  const store = new ConventionStore(process.cwd());

  if (!options.force && (await store.exists())) {
    console.log(
      chalk.yellow(
        "Conventions already exist. Use -f/--force to re-detect (e.g. npm run convention:init:force).",
      ),
    );
    return;
  }

  const config = new ConfigManager(process.cwd());
  await config.load();

  const spinner = ora("Analysing codebase...").start();

  const analyzer = new AstAnalyzer(process.cwd(), {
    analysisConfig: config.getAnalysisConfig(),
    structureConfig: config.getStructureConfig(),
    namingConfig: config.getNamingConfig(),
    conventionConfig: config.getConventionConfig(),
  });
  const analysisResult = await analyzer.analyze();

  spinner.succeed(
    `Analysed ${analysisResult.fileCount} files in ${analysisResult.durationMs}ms`,
  );

  if (analysisResult.filePaths && analysisResult.filePaths.length >= 3) {
    const spinner2 = ora("Running semantic coherence (HF)...").start();
    try {
      const { detectSemanticPattern } =
        await import("../../core/analyzer/SemanticCoherencePhase.js");
      const semanticPattern = await detectSemanticPattern(
        process.cwd(),
        analysisResult.filePaths,
        config.getModelTier(),
      );
      if (semanticPattern) {
        analysisResult.patterns.push(semanticPattern);
        spinner2.succeed(
          `Semantic coherence: detected (${semanticPattern.confidence}% confidence)`,
        );
      } else {
        spinner2.warn(
          "Semantic coherence: skipped (low confidence or few exports)",
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      spinner2.fail(`Semantic coherence: model load failed (${msg})`);
    }
  }

  const detector = new ConventionDetector({
    conventionConfig: config.getConventionConfig(),
    structureConfig: config.getStructureConfig(),
  });
  const candidates = await detector.detect(analysisResult);

  const { confirmConventions } = await import("./conventionPrompts.js");
  const confirmed = await confirmConventions(candidates);

  await store.save(confirmed);
  console.log(
    chalk.green(`\n✅ Conventions saved to .codeplug/conventions.json`),
  );
  console.log(
    chalk.dim(
      `   Run 'codeplug convention audit' to check current compliance.`,
    ),
  );
}

export async function handleConventionAudit(
  options: ConventionAuditOptions,
): Promise<void> {
  const chalk = (await import("chalk")).default;
  const ora = (await import("ora")).default;
  const { ConfigManager } = await import("../../config/ConfigManager.js");
  const { ConventionStore } = await import("../../storage/ConventionStore.js");
  const { ViolationDetector } =
    await import("../../core/scorer/ViolationDetector.js");
  const { ComplianceScorer } =
    await import("../../core/scorer/ComplianceScorer.js");

  const store = new ConventionStore(process.cwd());
  if (!(await store.exists())) {
    console.log(
      chalk.yellow(
        'No conventions found. Run "codeplug convention init" first.',
      ),
    );
    return;
  }

  const conventions = await store.load();

  const config = new ConfigManager(process.cwd());
  await config.load();

  const oraSpinner = ora("Auditing conventions...").start();
  const detector = new ViolationDetector(process.cwd(), {
    analysisConfig: config.getAnalysisConfig(),
    structureConfig: config.getStructureConfig(),
    namingConfig: config.getNamingConfig(),
    modelTier: config.getModelTier(),
    conventionConfig: config.getConventionConfig(),
    spinner: {
      text: (msg) => { oraSpinner.text = msg; },
      succeed: (msg) => oraSpinner.succeed(msg),
    },
  });

  const violations = await detector.detect(conventions, options);
  oraSpinner.succeed(`Audit complete (${violations.length} violation${violations.length === 1 ? "" : "s"})`);

  const scorer = new ComplianceScorer({
    scoringConfig: config.getScoringConfig(),
  });
  const score = await scorer.scoreAndPersist(violations, process.cwd());
  scorer.printReport(score, violations);

  if (options.ci && score.total < (score.threshold ?? 70)) {
    process.exit(1);
  }
}

export async function handleConventionDrift(): Promise<void> {
  const chalk = (await import("chalk")).default;
  const { ConfigManager } = await import("../../config/ConfigManager.js");
  const { ConventionStore } = await import("../../storage/ConventionStore.js");
  const { DriftClassifier } =
    await import("../../core/classifier/DriftClassifier.js");

  const store = new ConventionStore(process.cwd());
  if (!(await store.exists())) {
    console.log(
      chalk.yellow(
        'No conventions found. Run "codeplug convention init" first.',
      ),
    );
    return;
  }

  const config = new ConfigManager(process.cwd());
  await config.load();

  const conventions = await store.load();
  const classifier = new DriftClassifier({
    driftConfig: config.getDriftConfig(),
  });
  await classifier.checkRecentCommits(conventions);
}

export async function handleConventionScore(
  options: ConventionScoreOptions,
): Promise<void> {
  const chalk = (await import("chalk")).default;
  const { ScoreStore } = await import("../../storage/ScoreStore.js");

  const scoreStore = new ScoreStore(process.cwd());
  if (options.trend) {
    await scoreStore.printTrend();
  } else {
    const latest = await scoreStore.getLatest();
    if (!latest) {
      console.log(
        chalk.yellow(
          'No scores recorded yet. Run "codeplug convention audit" first.',
        ),
      );
      return;
    }
    console.log(chalk.bold(`📊 Compliance Score: ${latest.score}/100`));
  }
}

export async function handleConventionFix(
  options: ConventionFixOptions,
): Promise<void> {
  const chalk = (await import("chalk")).default;
  const { AutoFixer } = await import("../../core/scorer/AutoFixer.js");

  const fixer = new AutoFixer(process.cwd());
  if (options.id) {
    await fixer.fixById(options.id);
  } else if (options.auto) {
    await fixer.fixAll();
  } else {
    console.log(
      chalk.yellow(
        'Specify --auto or --id <id>. Run "codeplug convention audit" to see findings.',
      ),
    );
  }
}

export async function handleConventionShow(commit: string): Promise<void> {
  const chalk = (await import("chalk")).default;
  console.log(chalk.dim(`Showing findings for commit ${commit}...`));
  console.log(chalk.yellow("Not yet implemented. Coming in Phase 2."));
}
