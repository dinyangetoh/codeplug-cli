# Onboarding — Codeplug

Welcome to the team! This guide will help you get up and running with Codeplug as quickly as possible. We've designed this document to be comprehensive without being overwhelming—skip ahead to any section that interests you.

## What is Codeplug?

Codeplug is a [brief description of what the project does—e.g., "a collaborative code editor plugin system" or "a CLI tool for managing monorepo configurations"]. It powers [specific use case or customer segment] and is built with [primary technologies].

The codebase contains approximately 79 source files across the `src/` and `tests/` directories. While manageable in size, it follows enterprise-grade patterns for maintainability and testability.

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
cd codeplug
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
codeplug/
├── src/                    # Primary source code (57 files)
│   ├── components/         # React components (if applicable)
│   ├── services/           # Business logic and integrations
│   ├── utils/              # Helper functions and utilities
│   └── index.ts            # Entry point
├── tests/                  # Test files (19 files)
│   ├── integration/        # Integration tests
│   └── unit/               # Unit tests
├── dist/                   # Compiled output (generated)
├── node_modules/           # Dependencies (generated)
└── package.json            # Project configuration
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/` | All production source code. This is where you'll spend most of your time. |
| `tests/` | Shared test utilities and fixtures. Unit tests may also live here alongside their corresponding source files. |
| `dist/` | Compiled JavaScript ready for distribution. This directory is gitignored. |

---

## Coding Conventions

We maintain consistent conventions across the codebase to reduce cognitive load and make collaboration smoother. These aren't arbitrary rules—they're patterns we've found that improve readability and reduce bugs.

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

[Insert a brief description of how data flows through the application. For example: "User input → API layer → Service layer → Data persistence → Response".]

### Key Modules

Describe the main modules and their responsibilities:

- **[Module Name]** — [Brief description of what it does and why it exists]
- **[Module Name]** — [Brief description]

### Dependencies

[Optional: List key dependencies and why we use them. For example: "We use Jest for testing because..."]

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
- [ ] Meet with your onboarding buddy for a code walkthrough

We're glad you're here. Don't hesitate to ask questions—everyone was new once, and we'd rather answer a question than debug a mistake.

Happy coding! 🚀