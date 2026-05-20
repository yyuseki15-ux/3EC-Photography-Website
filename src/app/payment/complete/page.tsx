import { AutoClosePaymentPage } from "./auto-close-payment-page";

type PaymentCompletePageProps = {
  searchParams?: Promise<{
    booking_reference?: string;
  }>;
};

export default async function PaymentCompletePage({ searchParams }: PaymentCompletePageProps) {
  const resolvedSearchParams = await searchParams;
  const bookingReference = resolvedSearchParams?.booking_reference?.trim() ?? "";

  return (
    <main className="public-page-shell">
      <section className="public-page-card payment-complete-card">
        <AutoClosePaymentPage />

        <p className="eyebrow">3EC Sports Photography</p>
        <h1>Thank you for booking.</h1>
        <p className="hero-text public-page-text payment-complete-text">
          You will receive an email confirmation.
        </p>
        {bookingReference ? <p className="field-hint payment-complete-text">Reference: {bookingReference}</p> : null}
      </section>
    </main>
  );
}
