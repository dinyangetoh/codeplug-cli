export function formatHeader(text: string): string {
  return `# ${text}`;
}

export function formatParagraph(text: string): string {
  return `## ${text}`;
}

export function formatList(items: string[]): string {
  return `- ${items.join("\n- ")}`;
}

export function formatCode(code: string): string {
  return `\`${code}\``;
}

export function generateNumber(): number {
  return Math.floor(Math.random() * 100);
}

export function addAccountNumberToDatabase(accountNumber: string): void {
  console.log(`Adding account number ${accountNumber} to database`);
}
