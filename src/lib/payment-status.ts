export const paymentStatuses = [
  "awaiting_payment",
  "paid",
  "cancelled",
  "failed",
  "expired"
] as const;

export type PaymentStatus = (typeof paymentStatuses)[number];

export function isPaymentStatus(value: string): value is PaymentStatus {
  return paymentStatuses.includes(value as PaymentStatus);
}

export function formatPaymentStatus(value: PaymentStatus) {
  switch (value) {
    case "awaiting_payment":
      return "Awaiting payment";
    case "paid":
      return "Paid";
    case "cancelled":
      return "Cancelled";
    case "failed":
      return "Failed";
    case "expired":
      return "Expired";
    default:
      return value;
  }
}
