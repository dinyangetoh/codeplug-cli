#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program
  .name("codeplug")
  .description("The source of truth for codebase understanding & governance")
  .version("0.1.3");

program
  .command("convention")
  .description("Convention discovery, detection, and enforcement")
  .addCommand(
    new Command("init")
      .description(
        "Detect and confirm coding conventions in the current project",
      )
      .option("-f, --force", "Re-run detection, overwrite existing conventions")
      .action(async (options) => {
        const { handleConventionInit } =
          await import("./commands/convention.js");
        await handleConventionInit(options);
      }),
  )
  .addCommand(
    new Command("audit")
      .description("Run a full compliance report against stored conventions")
      .option(
        "--since <duration>",
        "Only audit changes in the given time window (e.g. 7d)",
      )
      .option("--ci", "Exit with non-zero code if thresholds are breached")
      .action(async (options) => {
        const { handleConventionAudit } =
          await import("./commands/convention.js");
        await handleConventionAudit(options);
      }),
  )
  .addCommand(
    new Command("drift")
      .description("Check most recent commits for convention drift")
      .action(async () => {
        const { handleConventionDrift } =
          await import("./commands/convention.js");
        await handleConventionDrift();
      }),
  )
  .addCommand(
    new Command("score")
      .description("Show current compliance score")
      .option("--trend", "Show score history and trend chart")
      .action(async (options) => {
        const { handleConventionScore } =
          await import("./commands/convention.js");
        await handleConventionScore(options);
      }),
  )
  .addCommand(
    new Command("fix")
      .description("Apply auto-fixes for convention violations")
      .option("--auto", "Apply all safe auto-fixes")
      .option("--id <id>", "Fix a specific finding by ID")
      .action(async (options) => {
        const { handleConventionFix } =
          await import("./commands/convention.js");
        await handleConventionFix(options);
      }),
  )
  .addCommand(
    new Command("show")
      .description("Explain findings for a specific commit")
      .argument("<commit>", "Commit hash to inspect")
      .action(async (commit) => {
        const { handleConventionShow } =
          await import("./commands/convention.js");
        await handleConventionShow(commit);
      }),
  );

program
  .command("docs")
  .description("Generate and maintain living documentation")
  .addCommand(
    new Command("generate")
      .description("Generate documentation from code analysis")
      .option(
        "--doc <name>",
        "Specific document to generate (e.g. ARCHITECTURE)",
      )
      .option(
        "--audience <level>",
        "Tune language level (e.g. junior, senior)",
        "senior",
      )
      .option("--style <style>", "Output style (concise, detailed)", "detailed")
      .action(async (options) => {
        const { handleDocsGenerate } = await import("./commands/docs.js");
        await handleDocsGenerate(options);
      }),
  )
  .addCommand(
    new Command("status")
      .description("Check which generated docs are stale")
      .action(async () => {
        const { handleDocsStatus } = await import("./commands/docs.js");
        await handleDocsStatus();
      }),
  )
  .addCommand(
    new Command("update")
      .description("Regenerate only stale document sections")
      .action(async () => {
        const { handleDocsUpdate } = await import("./commands/docs.js");
        await handleDocsUpdate();
      }),
  );

program
  .command("export")
  .description("Export conventions and context for AI agents and CI")
  .option("--target <target>", "Export target (claude, cursor, copilot)")
  .option("--format <format>", "Export format (json)")
  .option("--all", "Export all targets")
  .option("--check", "Verify exports are up to date")
  .action(async (options) => {
    const { handleExport } = await import("./commands/export.js");
    await handleExport(options);
  });

program
  .command("config")
  .description("Manage CodePlug configuration")
  .addCommand(
    new Command("set")
      .description("Set a configuration value")
      .argument("<key>", "Configuration key (e.g. llm.provider, models.tier)")
      .argument("<value>", "Configuration value")
      .action(async (key, value) => {
        const { handleConfigSet } = await import("./commands/config.js");
        await handleConfigSet(key, value);
      }),
  )
  .addCommand(
    new Command("get")
      .description("Get a configuration value")
      .argument("<key>", "Configuration key")
      .action(async (key) => {
        const { handleConfigGet } = await import("./commands/config.js");
        await handleConfigGet(key);
      }),
  )
  .addCommand(
    new Command("list")
      .description("List all configuration values")
      .action(async () => {
        const { handleConfigList } = await import("./commands/config.js");
        await handleConfigList();
      }),
  );

program.parse();
