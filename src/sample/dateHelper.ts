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

type WithdrawalMethodProvider = {
  type: string;
  fee: number;
  withdrawalFee: number;
};

export default {
  formatDate,
  getCurrentDate,
  generateRandomId,
  heteyeheyeu,
  WithdrawalMethodProvider,
};

export {
  formatDate,
  generateRandomId,
  getCurrentDate,
  heteyeheyeu,
  WithdrawalMethodProvider,
};
