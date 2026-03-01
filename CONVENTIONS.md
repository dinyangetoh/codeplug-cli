# Codebase Conventions

## Executive Summary

This document establishes the naming, testing, and structural conventions enforced across the codebase. These conventions ensure consistency, reduce cognitive load during code reviews, and improve IDE autocomplete reliability. All contributors are expected to adhere to these standards to maintain a cohesive development experience.

---

## Overview

Consistent conventions are foundational to maintainable software. This document codifies the patterns detected and enforced within the codebase, providing clear guidance for file naming, test organization, and directory structure. Following these conventions minimizes friction during collaboration and enables tooling to function as intended.

**Purpose:** Define actionable standards for code organization that align with language idioms and framework requirements.

---

## Naming Conventions

### Utility Files

**Convention:** Use `camelCase` for utility files.

| Property | Value |
|----------|-------|
| **Severity** | medium |
| **Confidence** | 100% |

**Rationale:** Utilities are typically imported as functions or values, making camelCase the natural choice for module resolution. This convention aligns with JavaScript/TypeScript import patterns and improves code readability when referencing these modules.

**Examples:**

- `src/cli/index.ts`
- `src/config/defaults.ts`
- `src/config/types.ts`

---

### Class and Service Files

**Convention:** Use `PascalCase` for class and service files.

| Property | Value |
|----------|-------|
| **Severity** | medium |
| **Confidence** | 100% |

**Rationale:** Aligns file naming with the exported class or service name, improving IDE autocomplete and code readability. This pattern provides immediate visual confirmation of the primary export when navigating the codebase.

**Examples:**

- `src/config/ConfigManager.ts`
- `src/config/ConventionSchema.ts`
- `src/models/ModelManager.ts`

---

### React Components

**Convention:** Use `PascalCase` for React component files.

| Property | Value |
|----------|-------|
| **Severity** | medium |
| **Confidence** | 100% |

**Rationale:** Required by React's module resolution. Component files should match the component name exactly to ensure proper import resolution and prevent runtime errors.

**Examples:**

- `src/components/AuthModal.tsx`
- `src/components/UserProfile.tsx`

---

### Custom Hooks

**Convention:** Prefix hook files with `use` and use `camelCase`.

| Property | Value |
|----------|-------|
| **Severity** | medium |
| **Confidence** | 100% |

**Rationale:** Follows React's hook naming convention. The `use` prefix signals that the file exports a hook, enabling linter rules to function correctly and providing immediate semantic context.

**Examples:**

- `src/hooks/useAuth.ts`

---

## Testing Conventions

### Test Directory Location

**Convention:** Place tests in a root-level `tests/` directory.

| Property | Value |
|----------|-------|
| **Severity** | medium |
| **Confidence** | 100% |

**Rationale:** Separates test code from source code while keeping tests accessible. Avoids cluttering `src/` with test utilities and provides a clear boundary between production and verification code.

**Examples:**

- `tests/unit/analyzer/AstAnalyzer.test.ts`
- `tests/unit/analyzer/NamingVisitor.test.ts`

---

### Test File Naming

**Convention:** Name test files using the `.test.{ext}` pattern.

| Property | Value |
|----------|-------|
| **Severity** | medium |
| **Confidence** | 100% |

**Rationale:** Standard pattern recognized by Jest and most test runners. Enables auto-discovery without additional configuration, reducing setup overhead for new contributors.

**Examples:**

- `tests/unit/analyzer/AstAnalyzer.test.ts`
- `tests/unit/analyzer/NamingVisitor.test.ts`

---

### Co-located Test Directories

**Convention:** Use `__tests__/` for co-located test files within source directories.

| Property | Value |
|----------|-------|
| **Severity** | low |
| **Confidence** | 100% |

**Rationale:** Acceptable for component-level tests where tight coupling with source files improves locality. Prefer root `tests/` for unit tests to maintain separation of concerns.

**Examples:**

- `src/__tests__/formatDate.test.ts`

---

## Structural Conventions

### Source Root

**Convention:** Maintain source code under a root-level `src/` directory.

| Property | Value |
|----------|-------|
| **Severity** | high |
| **Confidence** | 100% |

**Rationale:** Provides a clear boundary between source code and configuration, tests, and build artifacts. Required for many tooling integrations and establishes a predictable entry point for the application.

**Examples:**

- `src/`

---

## Key Descriptions

| Convention Category | File Pattern | Enforcement |
|---------------------|--------------|-------------|
| Utilities | `camelCase.ts` | Linter rule |
| Classes/Services | `PascalCase.ts` | Linter rule |
| React Components | `PascalCase.tsx` | Framework requirement |
| Custom Hooks | `use*.ts` | Linter rule |
| Test Location | `tests/` | Directory structure |
| Test Naming | `.test.{ext}` | Test runner |
| Source Root | `src/` | Build configuration |