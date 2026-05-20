import Link from "next/link";
import { SiteCopyright } from "@/components/site-copyright";
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
          You will receive an email confirmation after your deposit is verified.
        </p>
        {bookingReference ? <p className="field-hint payment-complete-text">Reference: {bookingReference}</p> : null}
        <p className="field-hint payment-complete-text">
          If this page does not close automatically on your browser, you can safely close it or use the buttons below.
        </p>
        <div className="payment-complete-actions">
          <Link className="public-page-link" href="/">
            Back to showcase
          </Link>
          <Link className="secondary-button public-page-link payment-complete-secondary" href="/book">
            Book another session
          </Link>
        </div>
      </section>
      <SiteCopyright />
    </main>
  );
}
