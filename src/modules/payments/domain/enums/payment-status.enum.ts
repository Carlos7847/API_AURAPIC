export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  IN_PROCESS = 'IN_PROCESS',
  IN_MEDIATION = 'IN_MEDIATION',
  CHARGED_BACK = 'CHARGED_BACK',
}

export const FINAL_STATUSES: PaymentStatus[] = [
  PaymentStatus.APPROVED,
  PaymentStatus.REJECTED,
  PaymentStatus.CANCELLED,
  PaymentStatus.REFUNDED,
  PaymentStatus.CHARGED_BACK,
];

export const isPaymentFinal = (status: PaymentStatus): boolean => {
  return FINAL_STATUSES.includes(status);
};

export const isPaymentSuccess = (status: PaymentStatus): boolean => {
  return status === PaymentStatus.APPROVED;
};
