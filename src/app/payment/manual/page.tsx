import Link from "next/link";
import { type BookingRecord } from "@/lib/bookings";
import { getManualPaymentConfig } from "@/lib/manual-payment";
import { formatPaymentStatus } from "@/lib/payment-status";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DonePaymentButton } from "./done-payment-button";

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

  return (
    <main className="public-page-shell">
      <section className="public-page-card">
        <div className="public-page-header">
          <div>
            <p className="eyebrow">3EC Sports Photography</p>
            <h1>Complete your GCash payment</h1>
            <p className="hero-text public-page-text">
              Your booking is saved as awaiting payment. Send the GCash payment below and wait for manual verification.
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
            <strong>Amount to send</strong>
            <span>PHP {booking.payment_amount_php}</span>
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
          </div>
        </div>

        <DonePaymentButton />
      </section>
    </main>
  );
}
