import type { DocStatus } from '../../config/types.js';

export class StalenessTracker {
  constructor(private projectRoot: string) {}

  async check(): Promise<DocStatus[]> {
    // Phase 3: hash-based staleness tracking
    return [
      { name: 'README.md', stale: false },
      { name: 'ARCHITECTURE.md', stale: false },
      { name: 'CONVENTIONS.md', stale: false },
      { name: 'CONTRIBUTING.md', stale: false },
      { name: 'ONBOARDING.md', stale: false },
    ];
  }
}
