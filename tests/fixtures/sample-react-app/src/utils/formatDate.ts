export function formatDate(date: Date | undefined): string {
  if (!date) return 'Unknown';
  return date.toLocaleDateString('en-US');
}
