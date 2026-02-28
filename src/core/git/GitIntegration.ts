import type { SimpleGit, LogResult } from 'simple-git';

export interface CommitInfo {
  hash: string;
  date: string;
  message: string;
  author: string;
}

export interface DiffFile {
  file: string;
  additions: number;
  deletions: number;
  binary: boolean;
}

export interface CommitDiff {
  commit: CommitInfo;
  files: DiffFile[];
  rawDiff: string;
}

export class GitIntegration {
  private cwd: string;

  constructor(cwd?: string) {
    this.cwd = cwd ?? process.cwd();
  }

  private async git(): Promise<SimpleGit> {
    const { simpleGit } = await import('simple-git');
    return simpleGit(this.cwd);
  }

  async getRecentCommits(count = 10): Promise<CommitInfo[]> {
    const git = await this.git();
    const log: LogResult = await git.log({ maxCount: count });

    return log.all.map((entry) => ({
      hash: entry.hash,
      date: entry.date,
      message: entry.message,
      author: entry.author_name,
    }));
  }

  async getStagedDiff(): Promise<string> {
    const git = await this.git();
    return git.diff(['--cached']);
  }

  async getDiffForCommit(hash: string): Promise<string> {
    const git = await this.git();
    return git.diff([`${hash}~1`, hash]);
  }

  async getCommitHistory(since: string): Promise<CommitInfo[]> {
    const git = await this.git();
    const log: LogResult = await git.log({ from: since, to: 'HEAD' });

    return log.all.map((entry) => ({
      hash: entry.hash,
      date: entry.date,
      message: entry.message,
      author: entry.author_name,
    }));
  }

  async getRecentCommitDiffs(count = 5): Promise<CommitDiff[]> {
    const commits = await this.getRecentCommits(count);
    const results: CommitDiff[] = [];

    for (const commit of commits) {
      try {
        const rawDiff = await this.getDiffForCommit(commit.hash);
        const files = this.parseDiffStat(rawDiff);
        results.push({ commit, files, rawDiff });
      } catch {
        results.push({ commit, files: [], rawDiff: '' });
      }
    }

    return results;
  }

  async isGitRepo(): Promise<boolean> {
    try {
      const git = await this.git();
      await git.revparse(['--git-dir']);
      return true;
    } catch {
      return false;
    }
  }

  private parseDiffStat(rawDiff: string): DiffFile[] {
    const files: DiffFile[] = [];
    const fileHeaderRegex = /^diff --git a\/(.+?) b\/(.+)$/gm;

    let match: RegExpExecArray | null;
    while ((match = fileHeaderRegex.exec(rawDiff)) !== null) {
      const file = match[2];
      const isBinary = rawDiff.includes(`Binary files a/${match[1]}`) ||
        rawDiff.includes(`Binary files /dev/null and b/${file}`);

      if (isBinary) {
        files.push({ file, additions: 0, deletions: 0, binary: true });
        continue;
      }

      let additions = 0;
      let deletions = 0;
      const nextHeaderIdx = rawDiff.indexOf('diff --git', match.index + 1);
      const section = nextHeaderIdx === -1
        ? rawDiff.slice(match.index)
        : rawDiff.slice(match.index, nextHeaderIdx);

      for (const line of section.split('\n')) {
        if (line.startsWith('+') && !line.startsWith('+++')) additions++;
        if (line.startsWith('-') && !line.startsWith('---')) deletions++;
      }

      files.push({ file, additions, deletions, binary: false });
    }

    return files;
  }
}
