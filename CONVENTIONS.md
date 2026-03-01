# Codebase Conventions

This document defines the naming, testing, and structural conventions enforced across the codebase.

---

## Naming Conventions

### Utility Files

**Convention:** Use `camelCase` for utility files.

| Property | Value |
|----------|-------|
| **Severity** | medium |
| **Confidence** | 100% |

**Rationale:** Utilities are typically imported as functions or values, making camelCase the natural choice for module resolution.

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

**Rationale:** Aligns file naming with the exported class or service name, improving IDE autocomplete and code readability.

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

**Rationale:** Required by React's module resolution. Component files should match the component name exactly.

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

**Rationale:** Follows React's hook naming convention. The `use` prefix signals that the file exports a hook.

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

**Rationale:** Separates test code from source code while keeping tests accessible. Avoids cluttering `src/` with test utilities.

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

**Rationale:** Standard pattern recognized by Jest and most test runners. Enables auto-discovery without additional configuration.

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

**Rationale:** Acceptable for component-level tests where tight coupling with source files improves locality. Prefer root `tests/` for unit tests.

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

**Rationale:** Provides a clear boundary between source code and configuration, tests, and build artifacts. Required for many tooling integrations.

**Examples:**

- `src/`