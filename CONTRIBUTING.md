# Contributing to Codeplug

## Executive Summary

This guide provides comprehensive contribution guidelines for Codeplug, covering the complete development lifecycle from environment setup through pull request submission. It establishes conventions for branch naming, commit messages, coding standards, and testing practices that maintain project quality and enable collaborative development at scale. All contributors are expected to follow these standards to ensure consistency across the codebase.

## Overview

Codeplug welcomes contributions from developers of all experience levels, including bug reports, feature requests, documentation improvements, and code contributions. This document serves as the authoritative reference for contribution standards and should be consulted before submitting changes. Following these guidelines accelerates review cycles and ensures your contributions integrate seamlessly with the project.

For questions or discussions not covered by this document, please open a discussion on GitHub or reach out to the maintainers directly.

## Getting Started

### Prerequisites

Before beginning development, ensure you have the following installed:

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | LTS version (see `package.json`) | Use nvm for version management |
| npm | Comes with Node.js | Latest version recommended |
| Git | 2.30+ | Required for version control |

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd codeplug

# Install dependencies
npm install

# Build the project to verify setup
npm run build

# Run the test suite to confirm everything works
npm test
```

If you encounter issues during setup, please search existing [GitHub Issues](https://github.com/codeplug/codeplug/issues) before opening a new issue. Include your Node.js version and any error messages when reporting setup problems.

## Development Workflow

### Branch Naming Convention

Create feature branches from `main` using the following format:

| Branch Type | Prefix | Example |
|-------------|--------|---------|
| Feature | `feature/` | `feature/oauth2-integration` |
| Bugfix | `bugfix/` | `bugfix/parser-infinite-loop` |
| Hotfix | `hotfix/` | `hotfix/security-vulnerability` |
| Refactor | `refactor/` | `refactor/auth-service-cleanup` |

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This enables automated changelog generation, semantic versioning, and clear history tracking.

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

| Type | Description |
|------|-------------|
| `feat` | New feature for users |
| `fix` | Bug fix for users |
| `docs` | Documentation changes only |
| `style` | Formatting, semicolons, missing semi-colons |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks, dependencies, build changes |

**Examples:**

```
feat(auth): add OAuth2 provider support
fix(parser): resolve infinite loop on malformed input
docs(readme): update installation instructions
refactor(utils): extract date formatting into separate module
```

**Key Principles:**

- Use imperative mood: "add feature" not "added feature" or "adds feature"
- Keep the subject line under 72 characters
- Reference issues and pull requests in the footer when applicable

### Making Changes

1. **Create a feature branch** from the latest `main`
2. **Make atomic commits** with clear, descriptive messages
3. **Write or update tests** to cover your changes
4. **Verify all tests pass** and linting is clean before submitting
5. **Open a pull request** against `main`

## Coding Standards

### File Naming Conventions

| File Type | Convention | Example |
|-----------|------------|---------|
| Utility files | camelCase | `dateUtils.ts` |
| Class/Service files | PascalCase | `UserService.ts` |
| React components | PascalCase | `Button.tsx` |
| Custom hooks | `use` prefix + camelCase | `useAuth.ts` |
| Constants | UPPER_SNAKE_CASE | `constants.ts` or `httpStatusCodes.ts` |

### TypeScript Guidelines

- Prefer `const` over `let`; avoid `var` entirely
- Use explicit return types for exported functions
- Prefer `interface` over `type` for object shapes that may be extended
- Avoid `any`; use `unknown` when type is truly unknown
- Enable strict null checking
- Use generics appropriately to avoid type assertions
- Prefer union types over enum members when possible

### Code Style

We use ESLint and Prettier for code formatting. Run the following before committing:

```bash
npm run lint
npm run format
```

**General Principles:**

- Keep functions small and focused (single responsibility principle)
- Write self-documenting code with clear variable and function names
- Extract magic numbers and strings into named constants
- Handle errors explicitly; avoid silent failures
- Prefer early returns over deeply nested conditionals
- Use meaningful variable names that convey intent

## Testing

### Test Organization

| Test Type | Location | File Naming |
|-----------|----------|-------------|
| Unit tests | Co-located `__tests__/` or `.test.ts` | `*.test.ts` or `*.spec.ts` |
| Integration tests | `tests/` directory at root | `*.test.ts` |
| E2E tests | `e2e/` directory | `*.test.ts` |

### Writing Tests

- Aim for meaningful test coverage; focus on critical paths and edge cases
- Use descriptive test names that explain the scenario being validated
- Follow the Arrange-Act-Assert (AAA) pattern
- Mock external dependencies; test behavior, not implementation
- Include both happy path and error cases
- Test boundary conditions and invalid inputs

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage
```

**Requirement:** All tests must pass and coverage must not decrease before merging.

## Documentation

### Code Documentation

- Add JSDoc comments for all public APIs, including `@param` and `@returns` tags
- Document complex logic with inline comments explaining the "why," not the "what"
- Update README.md if your change affects setup or usage
- Include code examples for new public APIs

### API Changes

If your contribution modifies the public API:

- Update relevant documentation
- Add migration notes in the PR description if backward compatibility is affected
- Consider deprecation warnings for future removals
- Bump the appropriate version according to semantic versioning rules

## Pull Request Process

### Before Opening

- [ ] All tests pass locally (`npm test`)
- [ ] Linting is clean (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] Commits follow Conventional Commits format
- [ ] PR description explains the motivation and approach
- [ ] Related issues are linked (e.g., "Closes #123")
- [ ] No unintended changes to files outside the scope of the PR

### PR Template

Fill out all sections of the PR template:

```markdown
## Description
[Description of changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
[Description of testing performed]

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Linting passes
```

### Review Process

1. **Request review** from at least one maintainer
2. **Address feedback** promptly and respond to comments
3. **Update your branch** with main if there are conflicts
4. **Ensure CI passes** on all checks before merging
5. **Be responsive** to review comments within 7 days

### Merging

- PRs require approval from maintainer(s)
- Use **squash and merge** to keep `main` history clean
- Delete your branch after merging

## Breaking Changes

If your contribution introduces a breaking change:

1. Mark the PR with the `breaking` label
2. Clearly document the breaking change in the PR description
3. Provide migration guidance for users
4. Bump the major version in consultation with maintainers

**Breaking changes** include any change that:

- Removes or renames a public API
- Changes the signature of a public function
- Changes the behavior of an existing feature in a way that could break existing integrations

## Security Vulnerabilities

Do not open public issues for security vulnerabilities. Instead, please follow our [Security Policy](SECURITY.md) for responsible disclosure.

---

Thank you for contributing to Codeplug. Your efforts help improve the project for everyone. If you have questions, feel free to open a discussion or reach out to maintainers.