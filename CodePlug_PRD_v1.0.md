# CodePlug PRD v1.0

> **The Source of Truth for Codebase Understanding & Governance**

| | |
|---|---|
| **Version** | 1.0 — Focused MVP |
| **npm package** | `@dinyangetoh/codeplug-cli` |
| **License** | MIT (Open Source) |
| **Distribution** | CLI-first, local-first |
| **Date** | February 28, 2026 |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision](#3-product-vision)
4. [Target Users](#4-target-users)
5. [MVP Scope & Boundaries](#5-mvp-scope--boundaries)
6. [Feature Specifications](#6-feature-specifications)
   - [6.1 Convention Discovery & Interactive Setup](#61-convention-discovery--interactive-setup)
   - [6.2 Drift Detection & Compliance Scoring](#62-drift-detection--compliance-scoring)
   - [6.3 Codebase Understanding & Documentation Generation](#63-codebase-understanding--documentation-generation)
   - [6.4 Export & Agent Integration](#64-export--agent-integration)
7. [Technical Architecture](#7-technical-architecture)
8. [Delivery Plan](#8-delivery-plan)
9. [AI / ML Engineering Showcase](#9-ai--ml-engineering-showcase)
10. [Success Metrics](#10-success-metrics)
11. [Development Setup](#11-development-setup)

---

## 1. Executive Summary

> *CodePlug makes codebases understandable, governable, and transmissible — to humans and AI agents alike.*

**CodePlug** is a local-first CLI tool that learns how your codebase is written, detects when it drifts from those patterns, generates living documentation from code reality — and exports authoritative context to AI coding agents and CI pipelines.

Think of it as institutional memory for your repository.

Modern codebases grow faster than shared understanding. Conventions live in people's heads. Architecture diagrams go stale. New developers get onboarded from outdated wikis. AI agents make incorrect assumptions because they have no reliable context about *how things are done here*.

CodePlug is the missing layer: a tool that treats codebase understanding as a first-class engineering concern — not an afterthought.

### Why This Scope, Why Now

The original DevForge concept was broad: morning briefs, PR review, Jira integration, security scanning. All useful. None of it defensible as a single product identity. CodePlug makes a different bet — **own one hard problem completely** rather than doing ten things adequately.

The hard problem: no tool currently owns codebase understanding as a system. Linters catch syntax. Copilot generates code. Wikis document intent. But nothing continuously learns how a codebase is actually structured, monitors how that structure evolves, and makes that knowledge available to both humans and AI agents in a reliable, exportable form. That gap is what CodePlug fills.

---

## 2. Problem Statement

### The Core Problem: Institutional Knowledge Decay

Every codebase starts with shared understanding. Over months and years, that understanding frays.

| Symptom | Root Cause | Cost |
|---|---|---|
| Inconsistent code style across modules | Conventions were never written down | Slower reviews, harder refactors |
| Architecture diagrams that no one trusts | Docs were written once and never updated | New devs ignore them; onboarding fails |
| AI agents writing code that violates patterns | Agents have no reliable context about how things are done | Rework, frustration, distrust of AI tools |
| Senior devs becoming bottlenecks | Only they know the unwritten rules | Bus factor risk, slow velocity |
| Quality decay that's invisible until it's severe | No one is watching for drift | Technical debt compounds silently |

### What Existing Tools Miss

- **Linters (ESLint, Prettier):** Enforce syntax rules you already know. Can't discover implicit patterns or detect architectural drift.
- **AI code generators (Copilot, Claude Code):** Generate code based on generic training data. Have no awareness of your specific project's patterns.
- **Documentation tools (Docusaurus, Notion):** Host docs written by humans. Go stale as soon as the code changes.
- **Code review tools (GitHub, Reviewpad):** React to individual PRs. Don't track drift as a trend over time.

> **The Gap:** No tool continuously learns how a codebase is actually written, monitors how it evolves, and makes that knowledge exportable to both humans and AI agents. That is what CodePlug owns.

---

## 3. Product Vision

> *"If your codebase were a team member, CodePlug is the one who knows how things are done here."*

### Guiding Principles

| Principle | What It Means |
|---|---|
| **Understanding before generation** | Learn how the codebase works before generating anything. Outputs are grounded in reality, not templates. |
| **Local-first by default** | No cloud account required. No data leaves the machine unless the user explicitly opts in. |
| **Explainable decisions** | Every finding, score, and suggestion must show its reasoning. No black-box outputs. |
| **Opinionated but overridable** | CodePlug has smart defaults. Developers can confirm, adjust, or reject any detected convention. |
| **Built for long-lived systems** | Designed for codebases that grow over years, not proof-of-concepts. |
| **Bridges humans and AI agents** | The same understanding CodePlug builds for humans is exported as reliable context for AI tools. |

---

## 4. Target Users

| User | Primary Job To Be Done | How CodePlug Helps |
|---|---|---|
| **Senior Engineer / Tech Lead** | Maintain code quality and architectural coherence as the team grows | Convention enforcement, drift detection, auto-exportable rules |
| **Engineering Manager** | Ensure standards are maintained without becoming a bottleneck | Compliance scores, trend visibility, CI integration |
| **New Hire / Onboarding Dev** | Understand how things are done here, quickly | Generated ONBOARDING.md and CONVENTIONS.md derived from real code |
| **Open-Source Maintainer** | Keep contribution quality consistent across many external contributors | Pre-commit hooks, PR convention checks, exportable contributor rules |
| **AI Coding Agent** | Generate code that matches the project's actual patterns | Exported rule files (.clauderules, .cursorrules, agent JSON context) |
| **CI/CD Pipeline** | Enforce standards automatically on every push | Compliance scoring with configurable pass/fail thresholds |

---

## 5. MVP Scope & Boundaries

### What CodePlug Does (v1.0)

| Pillar | Capability |
|---|---|
| **Convention & Drift Governance** | Discover, confirm, monitor, score, and enforce coding conventions |
| **Codebase Understanding & Docs** | Generate living documentation derived from actual code structure |
| **Export & Agent Integration** | Export rules and context to AI agents, editors, and CI pipelines |

### What CodePlug Does NOT Do (v1.0)

These features were considered and deliberately deferred. They are not roadmap items yet — they are distractions from a focused v1.

| Feature | Why Excluded |
|---|---|
| PR review automation | Valuable, but a different product surface. Adds complexity without deepening the core mission. |
| Morning brief / standup digest | Developer productivity utility; doesn't reinforce the 'codebase understanding' identity. |
| Task management (Jira, Linear) | Integration complexity high; doesn't serve the governance use case. |
| Security vulnerability scanning | Better handled by dedicated tools (Snyk, npm audit). Not differentiating. |
| Test generation | Code generation feature; outside the understanding/governance mission. |
| RAG chat interface | Interesting future capability. Deferred until convention and docs pillars are mature. |
| Code generation | CodePlug governs how code should be written; it does not write it. |

---

## 6. Feature Specifications

---

### 6.1 Convention Discovery & Interactive Setup

> Analyzes the existing codebase to surface implicit patterns, then confirms them with the developer.

This is not linting. Linting enforces rules you already wrote down. Convention discovery finds the rules you follow without knowing you follow them — and makes them explicit, portable, and enforceable.

#### What Gets Detected

| Dimension | Examples Detected |
|---|---|
| **Naming conventions** | camelCase utils, PascalCase components, `use*` prefix for hooks, SCREAMING_SNAKE for constants |
| **Folder & module structure** | Feature-based, MVC, layered architecture, monorepo patterns |
| **Component patterns** | Functional vs class, hooks composition, HOC vs render props |
| **Error handling strategy** | Try/catch, Result types, Error boundaries, centralised vs local |
| **Test organisation** | Co-located `__tests__/`, separate `tests/` folder, describe/it vs test() patterns |
| **State management approach** | Redux, Zustand, Context API, signals — where state lives |
| **API & async patterns** | Async/await, promise chains, tRPC, REST vs GraphQL conventions |
| **Git & commit style** | Conventional commits, branch naming (`feature/*`, `fix/*`), PR title format |

#### ML-Assisted Pattern Classification

For patterns that AST frequency analysis cannot resolve unambiguously, CodePlug uses a local ML classifier:

| Component | Model / Method | Purpose |
|---|---|---|
| AST frequency analysis | Custom AST visitor (ts-morph) | Primary detection — counts, ratios, structural patterns |
| Naming classifier | Rule-based + regex heuristics | Distinguish intentional vs accidental naming variance |
| Structural pattern classifier | `microsoft/codebert-base` (local) | Classify folder/module patterns against known architectures |
| Ambiguity resolution | Interactive CLI prompt | Human confirmation when confidence is below threshold |

#### Interactive Confirmation Flow

```
$ codeplug convention init

🔍 Analysing codebase... done (847 files, 2.3s)

📐 Detected patterns — confirm or adjust:

  [1/6] Naming: React components → PascalCase  (confidence: 97%)
        Found: UserProfile.tsx, AuthModal.tsx, DashboardLayout.tsx
        → Accept? [Y/n]  Y

  [2/6] Naming: Utility files → camelCase  (confidence: 91%)
        Found: formatDate.ts, parseToken.ts, buildQuery.ts
        → Accept? [Y/n]  Y

  [3/6] Tests: Co-located __tests__/ directories  (confidence: 88%)
        Found in: src/components/, src/hooks/, src/utils/
        → Accept? [Y/n]  Y

  [4/6] Commits: Conventional commit format  (confidence: 79%)
        Found: feat:, fix:, docs:, refactor: in last 120 commits
        → Accept? [Y/n]  n
        → Specify format (or press Enter to skip): freeform

✅ Conventions saved to .codeplug/conventions.json
   Run 'codeplug convention audit' to check current compliance.
```

#### Commands

```bash
codeplug convention init            # detect and confirm conventions
codeplug convention init --force    # re-run detection, overwrite existing
```

---

### 6.2 Drift Detection & Compliance Scoring

> Monitors ongoing code changes for convention violations. Tracks compliance as a time-series score, not a one-time snapshot.

The core insight is that drift is not a single event — it's a gradual process. By the time it's visible, it's already expensive to fix. CodePlug treats drift as a continuous signal, not a periodic audit.

#### Drift Detection Engine

| Component | How It Works |
|---|---|
| **Staged file analysis** | Intercepts git staged changes (pre-commit hook) and evaluates each against stored conventions |
| **Commit diff classifier** | Uses CodeBERT to classify diff content as convention-following, ambiguous, or drifting |
| **Violation categorisation** | Each finding tagged with: type, severity, file, expected pattern, found pattern, auto-fixable flag |
| **Trend calculator** | Maintains rolling weekly score; computes trend direction (improving / stable / declining) |
| **Confidence gating** | Low-confidence ML findings are flagged for human review rather than auto-reported as violations |

#### Violation Severity Model

| Severity | Score Deduction | Behaviour | Examples |
|---|---|---|---|
| **Critical** | −15 pts | Blocks commit (pre-commit hook) | Hardcoded secrets, direct DB access from component layer |
| **High** | −8 pts | Warnings in audit; reported in CI | Wrong architectural layer, missing error boundary |
| **Medium** | −3 pts | Reported in audit; auto-fixable | Naming violation, wrong test location, inconsistent import style |
| **Low** | −1 pt | Advisory only; opt-in reporting | Minor style variance, comment format |

#### Audit Output

```
$ codeplug convention audit

🔍 Convention Audit — my-project/

📊 Compliance Score:  74 / 100  (↓ 8 from last week)  Trend: 📉 Declining

🔴 HIGH (1):
  src/features/payment/PaymentService.ts:34
  Direct database query in service layer — expected: repository pattern
  Commit: 3a9f12c  "feat: add payment retry logic"
  → Run: codeplug convention show 3a9f12c for context

🟡 MEDIUM (4):
  src/utils/auth_helper.ts
  File uses snake_case — expected: camelCase (authHelper.ts)
  → Auto-fixable: codeplug convention fix --id CP-041

  src/components/userProfile.tsx
  Component file uses camelCase — expected: PascalCase (UserProfile.tsx)
  → Auto-fixable: codeplug convention fix --id CP-042

  tests/integration/auth.test.ts
  Test not co-located — expected: src/features/auth/__tests__/
  → Auto-fixable: codeplug convention fix --id CP-043

  src/hooks/UseAuth.ts
  Hook name capitalised — expected: useAuth.ts
  → Auto-fixable: codeplug convention fix --id CP-044

✅ Auto-fix 4 issues?  codeplug convention fix --auto
```

#### Compliance Score Tracking

```
$ codeplug convention score --trend

📈 Convention Compliance — Last 8 Weeks

W1   ████████████████████░░  87%
W2   ████████████████████░░  86%
W3   █████████████████████░  89%   ← team onboarding sprint
W4   ███████████████████░░░  82%
W5   █████████████████░░░░░  74%   ← 3 new contributors
W6   ██████████████████░░░░  78%
W7   ████████████████████░░  85%
W8   █████████████████████░  74%   ← this week

Category breakdown:
  Naming:     ████████████████████░  83%
  Structure:  ██████████████████░░░  79%
  Testing:    ████████████████░░░░░  69%  ← needs attention
  Git:        ████████████████████░  88%

Action: codeplug convention fix --auto  (resolves 4 medium findings)
```

#### Commands

```bash
codeplug convention audit               # full compliance report
codeplug convention audit --since 7d    # last 7 days only
codeplug convention drift               # check most recent commits
codeplug convention score               # current score
codeplug convention score --trend       # score history + trend chart
codeplug convention fix --auto          # apply all safe auto-fixes
codeplug convention fix --id CP-041     # fix specific finding
codeplug convention show <commit>       # explain findings for a commit
```

---

### 6.3 Codebase Understanding & Documentation Generation

> Generates living documentation that reflects the actual state of the codebase — not what someone wrote about it a year ago.

The key distinction from template-based doc tools is that CodePlug derives documentation from code reality. The `ARCHITECTURE.md` reflects the folder structure and dependencies that actually exist. The `CONVENTIONS.md` reflects patterns that are actually followed. When the code changes, the docs can be regenerated without rewriting from scratch.

#### Generated Documents

| Document | Contents | Derived From |
|---|---|---|
| `README.md` | Project overview, quick start, tech stack badges, links | package.json, framework detection, git history, existing README |
| `ARCHITECTURE.md` | System structure, module responsibilities, data flow, key decisions | AST analysis, import graph, folder structure, detected patterns |
| `CONVENTIONS.md` | All confirmed coding conventions in human-readable form | conventions.json from `codeplug convention init` |
| `CONTRIBUTING.md` | Contribution guidelines, PR process, branch strategy, code style | Git history patterns, conventions.json, GitHub settings |
| `ONBOARDING.md` | New developer guide: setup, key concepts, where things live, who owns what | All of the above, synthesised for a junior audience |

#### AI / ML Pipeline

Documentation generation uses a multi-stage pipeline combining deterministic analysis with local ML inference:

| Stage | Method | Model / Tool | Output |
|---|---|---|---|
| Project analysis | Deterministic | ts-morph AST, package.json parsing | Language, framework, deps, folder map |
| Summarisation | ML inference | `facebook/bart-large-cnn` (local) | Concise project overview from existing docs + commit history |
| Information extraction | ML inference | `distilbert-base-cased-distilled-squad` | Purpose, setup steps, key concepts from existing docs |
| Entity recognition | ML inference | `dslim/bert-base-NER` | Tech names, contributor handles, URLs, service names |
| Section generation | LLM (local/cloud) | Ollama default; OpenAI/Anthropic optional | Full prose sections for each document |
| Update detection | Diff analysis | Hash comparison on source files | Flags which docs are stale and need regeneration |

#### Update-Safe Regeneration

CodePlug tracks which source files contributed to each generated section. When those files change, it flags only the affected sections for regeneration — not the entire document.

```
$ codeplug docs status

📄 Documentation Status

  README.md          ✅  Up to date
  ARCHITECTURE.md    ⚠️   Stale — 12 files changed since last generation
  CONVENTIONS.md     ✅  Up to date
  CONTRIBUTING.md    ✅  Up to date
  ONBOARDING.md      ⚠️   Stale — ARCHITECTURE.md was updated

→ Run: codeplug docs update  (regenerates stale sections only)
```

#### Commands

```bash
codeplug docs generate                        # generate all documents
codeplug docs generate --doc ARCHITECTURE     # specific document only
codeplug docs generate --audience junior      # tune language level
codeplug docs generate --style concise        # short form
codeplug docs status                          # check what is stale
codeplug docs update                          # regenerate stale only
```

---

### 6.4 Export & Agent Integration

> Exports CodePlug's understanding of the codebase as machine-readable context — so AI agents and CI pipelines operate from the same ground truth as your team.

Without this, AI agents make suggestions that violate your conventions because they have no way to know what those conventions are. With CodePlug exports, agents get a reliable, up-to-date, project-specific ruleset.

#### Export Targets (v1.0)

| Target | Output File | Contents |
|---|---|---|
| **Claude Code** | `.claude/CLAUDE.md` + `.claude/conventions.md` | Full convention ruleset in Claude's instruction format, architecture context, naming rules |
| **Cursor** | `.cursorrules` | Conventions and patterns in Cursor's rule format |
| **GitHub Copilot** | `.github/copilot-instructions.md` | Agent instructions per GitHub's spec |
| **Generic Agent JSON** | `.codeplug/agent-context.json` | Structured JSON — conventions, architecture, patterns — for any agent or tool |
| **CI Enforcement Config** | `.codeplug/ci.json` | Pass/fail thresholds, severity configuration for CI pipeline integration |

#### What Gets Exported

- **All confirmed naming conventions** with examples from the actual codebase
- **Folder structure and module responsibilities** as a structured map
- **Architectural boundaries** — what belongs in which layer and why
- **Test patterns** — frameworks, location conventions, naming
- **Git and PR conventions** — commit format, branch strategy
- **Anti-patterns** — things explicitly *not* done in this codebase

#### Export Freshness

Exports are versioned and timestamped. CodePlug detects when the underlying conventions have changed and prompts for re-export. CI pipelines can check export freshness as part of their validation step.

```
$ codeplug export --target claude

📤 Exporting CodePlug context for Claude Code...

  Conventions:       47 rules exported
  Architecture:      12 modules mapped
  Anti-patterns:     8 patterns documented
  Last updated:      2026-02-28T09:14:22Z

✅ Written to: .claude/CLAUDE.md
              .claude/conventions.md

ℹ  Add these files to your repository so all agents use
   the same context. Re-run after codeplug convention init.
```

#### Commands

```bash
codeplug export --target claude     # Claude Code rules
codeplug export --target cursor     # Cursor rules
codeplug export --target copilot    # GitHub Copilot instructions
codeplug export --format json       # generic agent JSON
codeplug export --all               # all targets
codeplug export --check             # verify exports are up to date
```

---

## 7. Technical Architecture

### 7.1 Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Runtime** | Node.js 20+ | npm ecosystem, async I/O, strong TypeScript support |
| **Language** | TypeScript (strict mode) | Type safety, better tooling, necessary for portfolio quality |
| **CLI framework** | Commander.js | Mature, well-documented, supports nested commands and autocomplete |
| **AST parsing** | ts-morph + @babel/parser | ts-morph for TypeScript/JS analysis; Babel parser for JSX and broader ecosystem |
| **ML inference** | @xenova/transformers | Runs HuggingFace models locally in Node.js — no Python, no server, no cloud required |
| **LLM (local)** | Ollama | Local LLM for doc generation; privacy-first, no API key needed |
| **LLM (cloud fallback)** | Anthropic / OpenAI SDK | Optional fallback if Ollama is not running or model quality is insufficient |
| **Storage** | SQLite + JSON files | SQLite for score history and trend data; JSON for conventions and exports |
| **Testing** | Vitest | Fast, ESM-native, Jest-compatible API |
| **Git integration** | simple-git | Pre-commit hooks, diff access, commit history analysis |

### 7.2 Project Structure

```
@dinyangetoh/codeplug-cli/
├── src/
│   ├── cli/                    # Commander.js entry, command registration
│   │   └── commands/           # convention/, docs/, export/
│   ├── core/
│   │   ├── analyzer/           # AST visitor, pattern detection, frequency analysis
│   │   ├── classifier/         # CodeBERT wrapper, confidence scoring
│   │   ├── scorer/             # compliance score engine, time-series storage
│   │   ├── generator/          # doc generation pipeline, template engine
│   │   ├── exporter/           # export formatters (claude, cursor, copilot, json)
│   │   └── git/                # simple-git integration, hook management
│   ├── models/                 # local ML model management (download, cache, load)
│   ├── storage/                # SQLite adapter, conventions.json schema
│   └── config/                 # .codeplug/ config schema and defaults
├── templates/                  # export templates per target
│   ├── claude/
│   ├── cursor/
│   └── copilot/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/               # sample repos for testing detection logic
├── docs/                       # CLI reference, architecture notes
└── package.json
```

### 7.3 Local-First Strategy

- **ML models** are downloaded once on first run and cached locally (`~/.codeplug/models/`)
- **LLM generation** defaults to Ollama; cloud providers are opt-in and never required
- **All analysis data** is stored in the repository's `.codeplug/` directory or `~/.codeplug/` for global config
- **No telemetry**, no usage tracking, no phone-home behaviour by default

---

## 8. Delivery Plan

> Four focused phases. Each ships something usable independently.

| Phase | Weeks | Goal | Ships |
|---|---|---|---|
| **1 — Foundation** | 1–3 | CLI skeleton + convention detection core | `codeplug convention init` |
| **2 — Governance** | 4–6 | Drift detection, scoring, pre-commit hooks | `codeplug convention audit/drift/score/fix` |
| **3 — Understanding** | 7–9 | HuggingFace pipeline + doc generation | `codeplug docs generate/status/update` |
| **4 — Integration** | 10–12 | Agent exports, CI config, v1.0 release | `codeplug export --all` + npm publish |

### Phase 1 — Foundation (Weeks 1–3)

**Goal:** A working CLI that can analyse a real codebase and produce an initial conventions file. Usable on day one.

| Week | Task | Deliverable |
|---|---|---|
| 1 | CLI scaffolding | Commander.js setup, help system, `codeplug init`, shell autocomplete |
| 2 | AST analysis engine | ts-morph visitor, naming pattern detection, folder structure analysis |
| 3 | Interactive convention setup | Full `codeplug convention init` flow, `conventions.json` schema, confidence scoring |

### Phase 2 — Governance (Weeks 4–6)

**Goal:** Drift detection is live. Compliance score starts accumulating history. Pre-commit hook blocks critical violations.

| Week | Task | Deliverable |
|---|---|---|
| 4 | CodeBERT drift classifier | Local model download, diff classification, confidence gating |
| 5 | Compliance scoring engine | Severity-weighted score, SQLite time-series, trend calculation |
| 6 | Audit, fix, and hooks | Full audit output, auto-fix engine, git pre-commit hook |

### Phase 3 — Understanding (Weeks 7–9)

**Goal:** Full HuggingFace pipeline running locally. All five docs generate for a real project.

| Week | Task | Deliverable |
|---|---|---|
| 7 | Project analysis + ML pipeline | Framework detection, BART summarisation, DistilBERT Q&A, BERT-NER — all local |
| 8 | Doc generation engine | README.md, ARCHITECTURE.md, CONVENTIONS.md generation with template system |
| 9 | Staleness tracking + update flow | CONTRIBUTING.md, ONBOARDING.md, `codeplug docs status`, update-safe regeneration |

### Phase 4 — Integration & Release (Weeks 10–12)

**Goal:** CodePlug is complete, tested, documented, and published. Exports work for Claude Code, Cursor, and Copilot.

| Week | Task | Deliverable |
|---|---|---|
| 10 | Export engine | Claude, Cursor, Copilot, and JSON export formatters + template system |
| 11 | CI integration + polish | CI enforcement config, error handling, documentation, >80% test coverage |
| 12 | Release | `npm publish @dinyangetoh/codeplug-cli`, v1.0.0, GitHub release, full README |

---

## 9. AI / ML Engineering Showcase

> CodePlug demonstrates a progression from deterministic analysis to production ML inference — all running locally.

Every model choice has a rationale. Every pipeline stage has a fallback.

| Feature | ML Component | Model | Why This Model |
|---|---|---|---|
| Pattern classification | Structural classifier | `microsoft/codebert-base` | Pre-trained on code; understands semantic meaning of code structure, not just syntax |
| Drift detection | Diff classifier | `microsoft/codebert-base` | Classifies code diffs as convention-following vs drifting; few-shot fine-tunable |
| Doc summarisation | Summarisation pipeline | `facebook/bart-large-cnn` | Best open-source abstractive summariser; produces concise, readable prose from long context |
| Information extraction | Question answering | `distilbert-base-cased-distilled-squad` | Fast, accurate Q&A on existing docs to extract setup steps and purpose |
| Entity recognition | NER pipeline | `dslim/bert-base-NER` | Extracts tech names, URLs, contributor handles from unstructured docs |
| Section generation | Text generation | Ollama (llama3 / mistral) | Local LLM for full prose generation; swappable to cloud if quality insufficient |

### Interview Talking Points

> **Convention Detection:**
> "CodePlug uses AST frequency analysis as the primary detection layer, then CodeBERT as a secondary classifier for patterns that are ambiguous from structure alone. I deliberately made ML the fallback — deterministic logic first, ML for the hard cases — because that keeps the system explainable and debuggable."

> **Documentation Pipeline:**
> "The doc pipeline chains three HuggingFace models: BART for summarisation, DistilBERT for Q&A extraction from existing docs, and BERT-NER for entity extraction. All run locally via @xenova/transformers — no server, no API key, no data leaving the machine. The LLM layer sits on top for prose generation and is swappable."

> **Local-First ML Design:**
> "Every model is downloaded once and cached locally. I built a model manager that handles download, integrity verification, and loading — so users never need to think about where the models live. The fallback chain is: local inference → Ollama → cloud API, with the user always in control of how far down that chain CodePlug goes."

---

## 10. Success Metrics

### Adoption (6-Month Targets)

| Metric | Target | Signal |
|---|---|---|
| GitHub stars | 500+ | Developer interest and discovery |
| Weekly active CLI users | 500+ | Genuine utility, not just installs |
| npm downloads | 5,000+ | Adoption rate |
| Audit re-run frequency | > 3x / week per active user | Tool is part of regular workflow |

### Trust (Quality Signals)

| Metric | Target | What It Means |
|---|---|---|
| Findings accepted vs dismissed | > 80% accepted | Detection is accurate and relevant, not noisy |
| Auto-fix opt-in rate | > 60% | Fixes are safe and correct |
| Export re-run rate after convention changes | > 70% | Teams trust exports enough to keep them current |
| Docs regeneration frequency | > 1x / sprint | Docs stay live rather than going stale |

### Performance Targets

| Operation | Target | Notes |
|---|---|---|
| CLI startup | < 1 second | No heavy imports at startup; lazy-load ML models |
| Convention init (~500 files) | < 15 seconds | AST analysis only; ML classifier adds ~5s if invoked |
| Drift check on commit diff | < 3 seconds | Pre-commit hook must not disrupt workflow |
| Full audit (medium repo) | < 30 seconds | Acceptable for a deliberate run, not blocking |
| Doc generation (all five docs) | < 2 minutes | ML pipeline; acceptable for a deliberate operation |
| Export (all targets) | < 5 seconds | Template rendering; no ML inference required |

---

## 11. Development Setup

### Prerequisites

- **Node.js 20+** and pnpm
- **Git 2.38+** (for pre-commit hook integration)
- **Ollama** installed and running locally (for doc generation — optional for convention detection)
- **~2 GB disk** for local ML model cache on first run

### Bootstrap

```bash
git clone https://github.com/<org>/codeplug.git
cd codeplug && pnpm install
pnpm build
npm link                        # makes `codeplug` available globally

# First run in a project:
cd /path/to/your/project
codeplug convention init        # downloads models on first use (~2 min)
```

### Environment Variables

| Variable | Required? | Description |
|---|---|---|
| `OPENAI_API_KEY` | Optional | Cloud LLM fallback for doc generation |
| `ANTHROPIC_API_KEY` | Optional | Cloud LLM fallback for doc generation |
| `CODEPLUG_MODEL_CACHE` | Optional | Override default model cache directory |
| `CODEPLUG_LOG_LEVEL` | Optional | `debug \| info \| warn \| error` (default: `info`) |

### Running Tests

```bash
pnpm test                       # unit tests (Vitest)
pnpm test:integration           # integration tests against fixture repos
pnpm coverage                   # coverage report (target: > 80%)
pnpm lint                       # ESLint + TypeScript check
```

---

*CodePlug · PRD v1.0 · MIT License · February 28, 2026*
