import { AutoClosePaymentPage } from "./auto-close-payment-page";

export default function PaymentCompletePage() {
  return (
    <main className="public-page-shell">
      <section className="public-page-card payment-complete-card">
        <AutoClosePaymentPage />

        <p className="eyebrow">3EC Sports Photography</p>
        <h1>Thank you for booking.</h1>
        <p className="hero-text public-page-text payment-complete-text">
          You will receive an email confirmation.
        </p>
      </section>
    </main>
  );
}
