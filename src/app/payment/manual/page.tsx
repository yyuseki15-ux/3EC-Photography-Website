import Link from "next/link";
import { type BookingRecord } from "@/lib/bookings";
import { BOOKING_DEPOSIT_PERCENTAGE } from "@/lib/booking-payment";
import { getManualPaymentConfig } from "@/lib/manual-payment";
import { formatPaymentStatus } from "@/lib/payment-status";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PaymentProofForm } from "./payment-proof-form";

type ManualPaymentPageProps = {
  searchParams?: Promise<{
    booking_id?: string;
  }>;
};

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export default async function ManualPaymentPage({ searchParams }: ManualPaymentPageProps) {
  const resolvedSearchParams = await searchParams;
  const bookingId = Number.parseInt(resolvedSearchParams?.booking_id ?? "", 10);

  if (!Number.isFinite(bookingId)) {
    return (
      <main className="public-page-shell">
        <section className="public-page-card">
          <div className="public-page-header">
            <div>
              <p className="eyebrow">3EC Sports Photography</p>
              <h1>Booking not found</h1>
              <p className="hero-text public-page-text">
                We could not find the booking for these payment instructions.
              </p>
            </div>
            <Link className="public-page-link" href="/book">
              Back to booking form
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("bookings").select("*").eq("id", bookingId).single();

  if (error) {
    throw new Error(error.message);
  }

  const booking = data as BookingRecord;
  const payment = getManualPaymentConfig();
  const fullAmountPhp = booking.payment_amount_php * 2;
  const remainingBalancePhp = fullAmountPhp - booking.payment_amount_php;

  return (
    <main className="public-page-shell">
      <section className="public-page-card">
        <div className="public-page-header">
          <div>
            <p className="eyebrow">3EC Sports Photography</p>
            <h1>Complete your GCash payment</h1>
            <p className="hero-text public-page-text">
              Your booking is saved as awaiting payment. Send the {Math.round(BOOKING_DEPOSIT_PERCENTAGE * 100)}% GCash deposit below and wait for manual verification.
            </p>
          </div>

          <Link className="public-page-link" href="/book">
            Back to booking form
          </Link>
        </div>

        <div className="booked-schedule-list booked-schedule-list-full">
          <div className="booked-schedule-item static">
            <strong>GCash number</strong>
            <span>{payment.gcashNumber}</span>
          </div>
          <div className="booked-schedule-item static">
            <strong>Account name</strong>
            <span>{payment.gcashAccountName}</span>
          </div>
          <div className="booked-schedule-item static">
            <strong>Deposit to send now</strong>
            <span>PHP {booking.payment_amount_php}</span>
            <span>Full session total: PHP {fullAmountPhp}</span>
            <span>Remaining balance later: PHP {remainingBalancePhp}</span>
            <span>Rate: PHP 600 per whole hour</span>
          </div>
          <div className="booked-schedule-item static">
            <strong>Booking</strong>
            <span>
              {booking.full_name} | {booking.sport} | {formatDate(booking.event_date)} | {booking.time_slot}
            </span>
            <span>Payment status: {formatPaymentStatus(booking.payment_status)}</span>
          </div>
          <div className="booked-schedule-item static">
            <strong>After payment</strong>
            <span>
              {payment.paymentContact
                ? `Send your proof of payment to ${payment.paymentContact}.`
                : "Keep your payment proof ready. We will verify your transfer manually."}
            </span>
            {booking.proof_uploaded_at ? (
              <span>Latest proof uploaded: {formatDate(booking.proof_uploaded_at)}</span>
            ) : null}
          </div>
        </div>

        <PaymentProofForm
          bookingId={booking.id}
          hasUploadedProof={Boolean(booking.proof_of_payment_path)}
        />
      </section>
    </main>
  );
}
