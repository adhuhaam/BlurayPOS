export function formatMvr(amount: number): string {
  return `MVR ${amount.toFixed(2)}`;
}

export function serviceTypeLabel(type: string): string {
  switch (type) {
    case 'Delivery':
      return 'Delivery';
    case 'Pickup':
      return 'Pickup';
    case 'DineIn':
      return 'Dine in';
    default:
      return type;
  }
}

export function paymentMethodLabel(method: string): string {
  switch (method) {
    case 'CashOnDelivery':
      return 'Cash on delivery';
    case 'BankTransfer':
      return 'Bank transfer';
    default:
      return method;
  }
}
