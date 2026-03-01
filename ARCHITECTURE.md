# codeplug — Architecture

## System Overview

codeplug is a sophisticated code analysis and documentation generation tool that processes source code repositories to extract, classify, analyze, and generate documentation through multiple export formats. The system employs a pipeline-based architecture that chains together analysis, classification, scoring, and generation phases.

The project comprises 79 source files distributed across 35 directories, with a clear separation between the core analysis engine, CLI interface, configuration management, and test infrastructure.

## High-Level Architecture

```mermaid
graph TB
    subgraph "CLI Layer"
        CLI[CLI Entry Point]
        CMDS[Commands<br/>analyze, generate, export, score]
    end

    subgraph "Configuration Layer"
        CFG[Config Loader]
        OPTS[Options Parser]
    end

    subgraph "Core Engine"
        subgraph "Analysis Phase"
            GIT[Git Integration]
            ANZ[Analyzer]
            VIS[Visitors]
        end

        subgraph "Classification Phase"
            CLS[Classifier]
        end

        subgraph "Scoring Phase"
            SCR[Scorer]
        end

        subgraph "Generation Phase"
            PIP[Pipeline Orchestrator]
            DOC[Document Generator]
            LLM[LLM Integration]
        end
    end

    subgraph "Export Layer"
        EXP[Exporter]
        FMT[Formatters<br/>JSON, Markdown, HTML, etc.]
    end

    subgraph "Storage & Models"
        ST[Storage]
        MOD[Models]
        TYP[Types]
    end

    CLI --> CMDS
    CMDS --> CFG
    CFG --> OPTS
    OPTS --> GIT
    GIT --> ANZ
    ANZ --> VIS
    VIS --> CLS
    CLS --> SCR
    SCR --> PIP
    PIP --> DOC
    DOC --> LLM
    DOC --> EXP
    EXP --> FMT
    
    ANZ --> MOD
    CLS --> MOD
    SCR --> MOD
    PIP --> MOD
    DOC --> MOD
    
    MOD --> ST
    TYP --> MOD
```

## Directory Structure

```
./ (79 files)
├── src/
│   ├── cli/                    # Command-line interface
│   │   └── commands/           # CLI command implementations
│   ├── config/                 # Configuration management
│   ├── models/                 # Domain models and entities
│   ├── storage/                # Persistence layer
│   ├── types/                  # TypeScript type definitions
│   └── core/                   # Core analysis engine
│       ├── analyzer/           # Static code analysis
│       │   └── visitors/       # AST visitor implementations
│       ├── classifier/         # Code classification logic
│       ├── exporter/           # Multi-format export
│       │   └── formatters/     # Output format implementations
│       ├── generator/          # Documentation generation
│       │   ├── documents/      # Document templates
│       │   ├── llm/            # LLM integration
│       │   └── pipelines/      # Processing pipelines
│       ├── git/                # Git repository integration
│       └── scorer/             # Quality scoring
├── tests/
│   ├── unit/                   # Unit test suite
│   └── fixtures/               # Test fixtures and samples
```

## Component Relationships

```mermaid
graph LR
    subgraph "Input Sources"
        REPO[Repository]
        GIT[Git Data]
    end

    subgraph "Analysis Engine"
        ANZ[Analyzer]
        VIS1[AST Visitor]
        VIS2[Dependency Visitor]
        VIS3[Import Visitor]
    end

    subgraph "Processing"
        CLS[Classifier]
        PIP[Pipeline]
    end

    subgraph "Output"
        DOC[Document Generator]
        EXP[Exporter]
    end

    REPO --> ANZ
    GIT --> ANZ
    ANZ --> VIS1
    ANZ --> VIS2
    ANZ --> VIS3
    
    VIS1 --> CLS
    VIS2 --> CLS
    VIS3 --> CLS
    
    CLS --> PIP
    PIP --> DOC
    DOC --> EXP
```

### Component Responsibilities

| Component | Responsibility | Public API |
|-----------|---------------|------------|
| `cli/commands` | Entry point for user commands | `execute(args): Promise<void>` |
| `config` | Load and validate configuration | `load(): Config`, `validate(cfg): boolean` |
| `analyzer` | Parse and traverse source code | `analyze(path): AST`, `visit(node): void` |
| `classifier` | Categorize code entities | `classify(entity): Classification` |
| `scorer` | Calculate quality metrics | `score(entities): Score[]` |
| `generator` | Create documentation from analysis | `generate(ctx): Document` |
| `exporter` | Format and write output | `export(doc, format): string` |
| `storage` | Persist analysis results | `save(data)`, `load(): Data` |
| `git` | Extract repository metadata | `getHistory()`, `getBlame()` |

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant Config
    participant Analyzer
    participant Classifier
    participant Scorer
    participant Pipeline
    participant Generator
    participant Exporter
    participant Storage

    User->>CLI: Execute command
    CLI->>Config: Load configuration
    Config-->>CLI: Validated config
    
    CLI->>Analyzer: Analyze repository
    Analyzer->>Analyzer: Parse source files
    Analyzer->>Analyzer: Execute visitors
    
    Analyzer-->>CLI: AST results
    
    CLI->>Classifier: Classify entities
    Classifier-->>CLI: Classifications
    
    CLI->>Scorer: Calculate scores
    Scorer-->>CLI: Quality metrics
    
    CLI->>Pipeline: Orchestrate processing
    Pipeline->>Generator: Generate documentation
    Generator->>Storage: Cache intermediate results
    
    Generator-->>Pipeline: Document tree
    
    Pipeline->>Exporter: Export to format
    Exporter-->>User: Final output
    
    Note over Storage: Results persisted for<br/>subsequent operations
```

### Data Transformation Pipeline

```mermaid
graph LR
    subgraph "Input"
        SRC[Source Code]
        GIT[Git Metadata]
    end

    subgraph "Stage 1: Extraction"
        PAR[Parser]
        TRA[AST Traversal]
    end

    subgraph "Stage 2: Analysis"
        VIS[Visitors]
        EXT[Entity Extraction]
    end

    subgraph "Stage 3: Enrichment"
        CLS[Classification]
        SCR[Scoring]
    end

    subgraph "Stage 4: Generation"
        PIP[Pipeline]
        DOC[Document Assembly]
    end

    subgraph "Stage 5: Output"
        FMT[Formatting]
        OUT[Output Files]
    end

    SRC --> PAR
    GIT --> PAR
    PAR --> TRA
    TRA --> VIS
    VIS --> EXT
    EXT --> CLS
    CLS --> SCR
    SCR --> PIP
    PIP --> DOC
    DOC --> FMT
    FMT --> OUT
```

## Key Abstractions

### Analysis Pipeline

The analyzer employs the Visitor pattern to traverse Abstract Syntax Trees (AST). Each visitor specializes in extracting specific entity types:

- **EntityVisitor**: Extracts functions, classes, interfaces
- **DependencyVisitor**: Maps import/export relationships
- **ImportVisitor**: Captures external dependencies

### Classification System

The classifier categorizes code entities based on structural analysis:

```mermaid
graph TD
    ENT[Code Entity] --> CLS{Classification Logic}
    
    CLS -->|Function| FUN[Function Category]
    CLS -->|Class| CLS2[Class Category]
    CLS -->|Interface| INT[Interface Category]
    CLS -->|Module| MOD[Module Category]
    
    FUN --> SC[Complexity Score]
    CLS2 --> SC
    INT --> SC
    MOD --> SC
```

### Document Generation

The generator supports multiple document types through a pluggable architecture:

- **MarkdownGenerator**: Renders documentation in Markdown
- **HTMLGenerator**: Produces interactive HTML output
- **JSONGenerator**: Exports structured data for external tools

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Pipeline-based processing** | Enables incremental processing and caching; allows parallel execution of independent stages |
| **Visitor pattern for analysis** | Decouples traversal logic from entity extraction; simplifies adding new analysis dimensions |
| **Separate storage layer** | Supports caching analysis results; enables incremental re-analysis |
| **Formatter abstraction** | Allows adding new export formats without modifying core logic |
| **LLM integration module** | Provides extensible interface for AI-assisted documentation generation |
| **camelCase for utilities** | Distinguishes pure functions from class-based services at naming level |
| **PascalCase for services** | Signals instantiable components with state and behavior |
| **Separate test directory** | Clear separation between production code and test infrastructure |
| **`.test.{ext}` naming** | Standard convention for test discovery by most test runners |
| **Co-located `__tests__/`** | Supports snapshot testing and keeps tests near implementation |

## Processing Flow Example

```mermaid
flowchart TB
    subgraph "Input Processing"
        A[Source File] --> B[Parser]
        B --> C[AST]
    end

    subgraph "Multi-Visitor Analysis"
        C --> D[EntityVisitor]
        C --> E[DependencyVisitor]
        C --> F[ImportVisitor]
        
        D --> G[Extracted Entities]
        E --> G
        F --> G
    end

    subgraph "Enrichment"
        G --> H[Classifier]
        H --> I[Classified Entities]
        I --> J[Scorer]
        J --> K[Scored Entities]
    end

    subgraph "Output Generation"
        K --> L[Pipeline]
        L --> M[Document]
        M --> N[Formatter]
        N --> O[Output]
    end
```

## Testing Strategy

```mermaid
graph TB
    subgraph "Test Infrastructure"
        UNIT[Unit Tests]
        FIX[Fixtures]
        SAM[Sample React App]
    end

    subgraph "Test Coverage"
        T1[Analyzer Tests]
        T2[Classifier Tests]
        T3[Config Tests]
        T4[Exporter Tests]
        T5[Generator Tests]
        T6[Model Tests]
        T7[Scorer Tests]
    end

    UNIT --> T1
    UNIT --> T2
    UNIT --> T3
    UNIT --> T4
    UNIT --> T5
    UNIT --> T6
    UNIT --> T7
    
    FIX --> SAM
    SAM --> T1
    SAM --> T5
```

The test suite maintains comprehensive coverage across all core components, with integration tests using the sample React application fixture to validate end-to-end behavior.

## Extension Points

The architecture supports extension through:

1. **Custom Visitors**: Add new analysis dimensions by implementing the Visitor interface
2. **Additional Formatters**: Implement the Formatter interface to support new output formats
3. **Pipeline Stages**: Extend the pipeline orchestrator to add custom processing stages
4. **LLM Providers**: Implement the LLM interface to integrate alternative AI services

## Configuration

Configuration is loaded hierarchically with the following precedence:
1. Command-line arguments (highest)
2. Project configuration file
3. Global defaults (lowest)