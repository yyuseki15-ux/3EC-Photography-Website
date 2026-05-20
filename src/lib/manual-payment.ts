export type ManualPaymentConfig = {
  gcashNumber: string;
  gcashAccountName: string;
  paymentContact: string | null;
};

function getRequiredPublicEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getManualPaymentConfig(): ManualPaymentConfig {
  return {
    gcashNumber: getRequiredPublicEnv("NEXT_PUBLIC_GCASH_NUMBER"),
    gcashAccountName: getRequiredPublicEnv("NEXT_PUBLIC_GCASH_ACCOUNT_NAME"),
    paymentContact: process.env.NEXT_PUBLIC_PAYMENT_CONTACT?.trim() || null
  };
}
