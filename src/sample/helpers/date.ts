function formatDate(date: Date): string {
  return date.toLocaleDateString();
}

function getCurrentDate(): Date {
  return new Date();
}

export { formatDate, getCurrentDate };
