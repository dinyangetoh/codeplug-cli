function formatDate(date: Date): string {
  return date.toLocaleDateString();
}

function getCurrentDate(): Date {
  return new Date();
}

const heteyeheyeu = () => {
  return "heteyeheyeu";
};

export type PaymentGatewayProvider = {
  type: string;
  fee: number;
  withdrawalFee: number;
};

export { formatDate, getCurrentDate, heteyeheyeu };
