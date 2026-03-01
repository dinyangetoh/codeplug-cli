function formatDate(date: Date): string {
  return date.toLocaleDateString();
}

function getCurrentDate(): Date {
  return new Date();
}

const generateRandomId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

function heteyeheyeu(): string {
  return "heteyeheyeu";
}

export type WithdrawalMethodProvider = {
  type: string;
  fee: number;
  withdrawalFee: number;
};

export function heteyeheyeu2(): string {
  return "heteyeheyeu2";
}

export function heteyeheyeu3(): string {
  return "heteyeheyeu3";
}

export function heteyeheyeu4(): string {
  return "heteyeheyeu4";
}

export function heteyeheyeu5(): string {
  return "heteyeheyeu5";
}

export function heteyeheyeu6(): string {
  return "heteyeheyeu6";
}

export default {
  formatDate,
  getCurrentDate,
  generateRandomId,
  heteyeheyeu,
};
