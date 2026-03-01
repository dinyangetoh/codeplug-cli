# Onboarding — @dinyangetoh/codeplug-cli

## Executive Summary

This document serves as the definitive guide for new engineers joining the Codeplug CLI team. It covers everything from environment setup and project architecture to coding conventions, common workflows, and the contribution process. Our goal is to get you from clone to first commit within 30 minutes while providing enough context to make meaningful contributions from day one.

## What is Codeplug?

Codeplug is **the source of truth for codebase understanding & governance**. It provides teams with the tooling needed to analyze, document, and maintain control over their codebase's structure and quality. Whether you're onboarding new team members, enforcing architectural standards, or generating living documentation, Codeplug serves as the central platform for codebase governance.

The project is a CLI tool built with Node.js, designed to integrate seamlessly into existing development workflows. The codebase contains approximately 80 source files across the `src/` and `tests/` directories—small enough to comprehend quickly, yet substantial enough to demonstrate enterprise-grade patterns for maintainability, testability, and extensibility.

---

## Environment Setup

### Prerequisites

Ensure you have the following installed before proceeding:

- **Node.js** — Version 20.0.0 or higher. We recommend using [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager) to manage Node installations:
  ```bash
  nvm install 20
  nvm use 20
  ```
- **npm** or **yarn** — Either package manager works. This guide uses npm commands, but they're easily translated if you prefer yarn.

### Installation

```bash
git clone <repository-url>
cd codeplug-cli
npm install
```

> **Tip:** If you're behind a corporate firewall, you may need to configure npm to use your organization's registry. Check with your team lead if `npm install` fails.

### Verify Your Setup

Run the following commands to confirm everything is working correctly:

```bash
npm run build
npm test
```

Both commands should complete without errors. If you encounter issues, see the [Troubleshooting](#troubleshooting) section below.

---

## Project Structure

Understanding the directory layout will help you navigate the codebase confidently.

```
codeplug-cli/
├── src/                    # Primary source code (58 files)
│   ├── components/         # Core CLI components
│   ├── services/           # Business logic and integrations
│   ├── utils/              # Helper functions and utilities
│   └── index.ts            # Entry point
├── tests/                  # Test files (19 files)
│   ├── integration/        # Integration tests
│   └── unit/               # Unit tests
├── dist/                   # Compiled output (generated)
├── node_modules/           # Dependencies (generated)
├── package.json            # Project configuration
└── README.md               # Project documentation
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/` | All production source code. This is where you'll spend most of your time. Contains 58 files covering core CLI functionality, analysis services, and governance rules. |
| `tests/` | Comprehensive test coverage with 19 files. Includes both unit tests for individual components and integration tests for end-to-end workflows. |
| `dist/` | Compiled JavaScript ready for distribution. This directory is gitignored. |

---

## Coding Conventions

We maintain consistent conventions across the codebase to reduce cognitive load and make collaboration smoother. These aren't arbitrary rules—they're patterns we've found that improve readability and reduce bugs. We've identified eight core conventions that govern how this project is structured.

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Utility files | camelCase | `stringUtils.ts`, `formatDate.ts` |
| Class/service files | PascalCase | `UserService.ts`, `AuthMiddleware.ts` |
| React components | PascalCase | `Button.tsx`, `UserProfile.tsx` |

**Why this matters:** Consistent naming lets you immediately identify a file's purpose without opening it. When you see `camelCase`, you know it's a utility; when you see `PascalCase`, you know it's a service or component.

### Testing Conventions

| Pattern | Description |
|---------|-------------|
| Test location | Tests live in a top-level `tests/` directory, with some co-located in `__tests__/` folders near their subject. |
| Test file naming | Use `.test.{ext}` or `.spec.{ext}` suffix. |
| Test structure | We follow AAA pattern (Arrange, Act, Assert) for clarity. |

```typescript
// Example test structure
describe('UserService', () => {
  it('should create a user with valid data', () => {
    // Arrange
    const userData = { name: 'Alice', email: 'alice@example.com' };
    
    // Act
    const result = UserService.create(userData);
    
    // Assert
    expect(result.id).toBeDefined();
  });
});
```

### Project Structure Conventions

- All source code lives under `src/`. This keeps the root clean and makes import paths explicit.
- Entry points are named `index.ts` (or `index.js`) to enable clean imports:
  ```typescript
  import { helper } from '@/utils';           // instead of '@/utils/helper'
  ```

---

## Architecture Tour

### Data Flow

Codeplug CLI follows a layered architecture designed for testability and extensibility:

1. **CLI Entry Point** (`src/index.ts`) — Parses command-line arguments and dispatches to appropriate handlers
2. **Command Handlers** — Validate input and orchestrate the analysis workflow
3. **Analysis Services** — Execute the core governance rules, code analysis, and documentation generation
4. **Output Formatters** — Present results in various formats (JSON, Markdown, HTML, etc.)

Data flows unidirectionally from input → processing → output, making it easy to test each layer in isolation.

### Key Modules

- **Analysis Engine** — The core module that scans codebase structure, identifies patterns, and generates insights. This is the heart of Codeplug's "source of truth" functionality.
- **Governance Rules** — A extensible rule system that enforces coding standards, architectural constraints, and documentation requirements across the codebase.
- **Documentation Generator** — Produces living documentation that stays in sync with code changes, supporting teams in maintaining accurate internal wikis.
- **CLI Interface** — Human-friendly command-line interface with sensible defaults, configuration support, and informative output.

### Dependencies

The project relies on key dependencies chosen for specific reasons:

- **TypeScript** — Type safety at build time, reducing runtime errors and improving IDE support
- **Jest** — Comprehensive testing framework with excellent mocking capabilities
- **ESLint + Prettier** — Enforces consistent code style and catches potential bugs before review

---

## Common Tasks

Here's a quick reference for everyday development tasks:

| Task | Command | Notes |
|------|---------|-------|
| Build the project | `npm run build` | Outputs to `dist/` |
| Run tests | `npm test` | Runs Jest in watch mode during development |
| Lint code | `npm run lint` | Uses ESLint with our custom config |
| Start dev server | `npm run dev` | Hot-reload enabled |
| Type checking | `npm run typecheck` | Runs TypeScript compiler without emitting |

### Recommended Workflow

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes, following our coding conventions
3. Run `npm test` to ensure all tests pass
4. Run `npm run lint` to catch style issues
5. Push and open a pull request

---

## Contributing Guidelines

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear, searchable history:

```
feat: add user authentication flow
fix: resolve memory leak in WebSocket handler
docs: update API documentation
refactor: simplify date formatting logic
```

### Pull Request Process

1. **Keep PRs focused** — One feature or fix per PR makes review easier.
2. **Write descriptive titles** — "Fix bug" is not helpful; "Fix null pointer in user service" is.
3. **Add context** — Describe what you changed and why in the PR description.
4. **Request reviews** — At least one approval required before merging.
5. **Squash and merge** — We prefer a clean commit history.

---

## Getting Help

Stuck on something? Here's how to get unblocked:

1. **Check the docs** — This file and any additional documentation in `docs/`
2. **Search existing issues** — Your question may have been asked before
3. **Ask in Slack** — Reach out in `#codeplug-help` or your team's channel
4. **Talk to your buddy** — You've been assigned an onboarding buddy—don't hesitate to ping them

### Key Contacts

| Role | Person | Responsibility |
|------|--------|----------------|
| Tech Lead | [Name] | Architecture decisions, code review |
| Maintainer | [Name] | Release process, dependencies |
| Onboarding Buddy | [Name] | Your first point of contact for questions |

---

## Troubleshooting

### Common Issues

**"Node version mismatch" error**
```bash
nvm use 20
```
Make sure you're using Node.js 20. Check `.nvmrc` in the project root.

**Tests failing after pulling latest**
```bash
npm install
npm run build
```
Dependencies may have updated; rebuild to ensure you're in sync.

**"Cannot find module" errors**
```bash
npm run build
```
Ensure the project has been built—some imports depend on compiled output.

**ESLint errors but code works**
Check if your IDE is using a different ESLint configuration. Run `npm run lint` from the command line to see the authoritative output.

---

## What's Next?

Now that you're set up, consider exploring:

- [ ] Pick up a "good first issue" from our issue tracker
- [ ] Review recent pull requests to understand our code review style
- [ ] Read through the main source files in `src/` to understand the architecture
- [ ] Meet with your onboarding buddy