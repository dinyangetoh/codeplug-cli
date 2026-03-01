# Contributing to Codeplug

Thank you for your interest in contributing to Codeplug. This document provides comprehensive guidance for developers looking to contribute to our project. We welcome bug reports, feature requests, documentation improvements, and code contributions from developers of all experience levels.

## Getting Started

### Prerequisites

Before beginning development, ensure you have the following installed:

- **Node.js** (LTS version specified in `package.json`)
- **npm** (comes with Node.js)
- **Git** for version control

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

If you encounter issues during setup, please search existing [GitHub Issues](https://github.com/codeplug/codeplug/issues) before opening a new one. Include your Node.js version and any error messages when reporting setup problems.

## Development Workflow

### Branch Naming Convention

Create feature branches from `main` using the following format:

- Feature: `feature/short-description`
- Bugfix: `bugfix/short-description`
- Hotfix: `hotfix/short-description`
- Refactor: `refactor/short-description`

### Making Changes

1. **Create a feature branch** from the latest `main`
2. **Make atomic commits** with clear, descriptive messages
3. **Write or update tests** to cover your changes
4. **Verify all tests pass** and linting is clean before submitting
5. **Open a pull request** against `main`

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This enables automated changelog generation and semantic versioning.

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(auth): add OAuth2 provider support
fix(parser): resolve infinite loop on malformed input
docs(readme): update installation instructions
```

## Coding Standards

### File Naming Conventions

| File Type | Convention | Example |
|-----------|------------|---------|
| Utility files | camelCase | `dateUtils.ts` |
| Class/Service files | PascalCase | `UserService.ts` |
| React components | PascalCase | `Button.tsx` |
| Custom hooks | `use` prefix + camelCase | `useAuth.ts` |

### TypeScript Guidelines

- Prefer `const` over `let`; avoid `var` entirely
- Use explicit return types for exported functions
- Prefer `interface` over `type` for object shapes
- Avoid `any`; use `unknown` when type is truly unknown
- Enable strict null checking

### Code Style

We use ESLint and Prettier for code formatting. Run the following before committing:

```bash
npm run lint
npm run format
```

### General Principles

- Keep functions small and focused (single responsibility)
- Write self-documenting code with clear variable and function names
- Extract magic numbers and strings into named constants
- Handle errors explicitly; avoid silent failures

## Testing

### Test Organization

- **Unit tests**: Co-located `__tests__/` directories or `.test.ts` files alongside source files
- **Integration tests**: Centralized `tests/` directory at the project root
- **E2E tests**: `e2e/` directory for end-to-end scenarios

### Writing Tests

- Aim for meaningful test coverage; focus on critical paths and edge cases
- Use descriptive test names that explain the scenario being验证
- Follow the Arrange-Act-Assert pattern
- Mock external dependencies; test behavior, not implementation
- Include both happy path and error cases

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage
```

All tests must pass and coverage must not decrease before merging.

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs, including params and return types
- Document complex logic with inline comments explaining the "why," not the "what"
- Update README.md if your change affects setup or usage

### API Changes

If your contribution modifies the public API:

- Update relevant documentation
- Add migration notes in the PR description if backward compatibility is affected
- Consider deprecation warnings for future removals

## Pull Request Process

### Before Opening

- [ ] All tests pass locally (`npm test`)
- [ ] Linting is clean (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] Commits follow Conventional Commits format
- [ ] PR description explains the motivation and approach
- [ ] Related issues are linked (e.g., "Closes #123")

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

### Merging

- PRs require approval from maintainer(s)
- Use **squash and merge** to keep `main` history clean
- Delete your branch after merging

## Breaking Changes

If your contribution introduces a breaking change:

1. Mark the PR with the `breaking` label
2. Clearly document the breaking change in the PR description
3. Provide migration guidance for users
4. Consider if the change should be released as a major version bump

## Security Vulnerabilities

Do not open public issues for security vulnerabilities. Instead, please follow our [Security Policy](SECURITY.md) for responsible disclosure.

---

Thank you for contributing to Codeplug. Your efforts help improve the project for everyone. If you have questions, feel free to open a discussion or reach out to maintainers.