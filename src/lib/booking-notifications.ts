import { formatBookingStatus, type BookingStatus } from "@/lib/booking-status";
import { type BookingRecord } from "@/lib/bookings";
import { getManualPaymentConfig } from "@/lib/manual-payment";
import { formatPaymentStatus } from "@/lib/payment-status";
import { getResendConfig } from "@/lib/resend";
import { BOOKING_DEPOSIT_PERCENTAGE } from "@/lib/booking-payment";
import { formatBookingReference } from "@/lib/booking-reference";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function bookingSummaryHtml(booking: Pick<BookingRecord, "id" | "full_name" | "email" | "phone" | "sport" | "address" | "event_date" | "time_slot" | "payment_amount_php" | "notes" | "status" | "payment_status">) {
  const fullAmountPhp = booking.payment_amount_php * 2;
  const remainingBalancePhp = fullAmountPhp - booking.payment_amount_php;
  const bookingReference = formatBookingReference(booking.id);
  return `
    <ul>
      <li><strong>Reference:</strong> ${bookingReference}</li>
      <li><strong>Name:</strong> ${booking.full_name}</li>
      <li><strong>Email:</strong> ${booking.email}</li>
      <li><strong>Phone:</strong> ${booking.phone}</li>
      <li><strong>Sport:</strong> ${booking.sport}</li>
      <li><strong>Address:</strong> ${booking.address || "No address"}</li>
      <li><strong>Date:</strong> ${formatDate(booking.event_date)}</li>
      <li><strong>Time:</strong> ${booking.time_slot}</li>
      <li><strong>Deposit:</strong> PHP ${booking.payment_amount_php}</li>
      <li><strong>Full session total:</strong> PHP ${fullAmountPhp}</li>
      <li><strong>Remaining balance:</strong> PHP ${remainingBalancePhp}</li>
      <li><strong>Status:</strong> ${formatBookingStatus(booking.status)}</li>
      <li><strong>Payment:</strong> ${formatPaymentStatus(booking.payment_status)}</li>
      <li><strong>Notes:</strong> ${booking.notes || "No notes"}</li>
    </ul>
  `;
}

function bookingSummaryText(booking: Pick<BookingRecord, "id" | "full_name" | "email" | "phone" | "sport" | "address" | "event_date" | "time_slot" | "payment_amount_php" | "notes" | "status" | "payment_status">) {
  const fullAmountPhp = booking.payment_amount_php * 2;
  const remainingBalancePhp = fullAmountPhp - booking.payment_amount_php;
  const bookingReference = formatBookingReference(booking.id);
  return [
    `Reference: ${bookingReference}`,
    `Name: ${booking.full_name}`,
    `Email: ${booking.email}`,
    `Phone: ${booking.phone}`,
    `Sport: ${booking.sport}`,
    `Address: ${booking.address || "No address"}`,
    `Date: ${formatDate(booking.event_date)}`,
    `Time: ${booking.time_slot}`,
    `Deposit: PHP ${booking.payment_amount_php}`,
    `Full session total: PHP ${fullAmountPhp}`,
    `Remaining balance: PHP ${remainingBalancePhp}`,
    `Status: ${formatBookingStatus(booking.status)}`,
    `Payment: ${formatPaymentStatus(booking.payment_status)}`,
    `Notes: ${booking.notes || "No notes"}`
  ].join("\n");
}

export async function sendNewBookingNotification(booking: BookingRecord) {
  const config = getResendConfig();

  if (!config) {
    console.warn("Skipping new booking email because Resend is not fully configured.");
    return;
  }

  const { resend, fromEmail, adminNotificationEmail } = config;
  const subject = `New ${booking.sport} booking from ${booking.full_name}`;

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: [adminNotificationEmail],
    subject,
    html: `
      <h1>New Booking Request</h1>
      <p>A new booking has been submitted on the 3EC Sports Photography website.</p>
      ${bookingSummaryHtml(booking)}
    `,
    text: `New Booking Request\n\nA new booking has been submitted on the 3EC Sports Photography website.\n\n${bookingSummaryText(booking)}`
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendManualPaymentInstructionsNotification(booking: BookingRecord) {
  const config = getResendConfig();

  if (!config) {
    console.warn("Skipping manual payment email because Resend is not fully configured.");
    return;
  }

  const payment = getManualPaymentConfig();
  const { resend, fromEmail } = config;
  const subject = `Complete your ${booking.sport} booking deposit via GCash`;
  const fullAmountPhp = booking.payment_amount_php * 2;
  const remainingBalancePhp = fullAmountPhp - booking.payment_amount_php;

  const contactLine = payment.paymentContact
    ? `<p>After sending the payment, share your proof through: <strong>${payment.paymentContact}</strong> and mention reference <strong>${formatBookingReference(booking.id)}</strong>.</p>`
    : "<p>After sending the payment, keep your proof of payment ready so we can verify it.</p>";

  const contactText = payment.paymentContact
    ? `After sending the payment, share your proof through: ${payment.paymentContact} and mention reference ${formatBookingReference(booking.id)}.`
    : "After sending the payment, keep your proof of payment ready so we can verify it.";

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: [booking.email],
    subject,
    html: `
      <h1>Complete your GCash payment</h1>
      <p>Hello ${booking.full_name},</p>
      <p>We received your booking details. To confirm your slot, please send the ${Math.round(BOOKING_DEPOSIT_PERCENTAGE * 100)}% GCash deposit using the details below.</p>
      <ul>
        <li><strong>GCash number:</strong> ${payment.gcashNumber}</li>
        <li><strong>Account name:</strong> ${payment.gcashAccountName}</li>
        <li><strong>Deposit due now:</strong> PHP ${booking.payment_amount_php}</li>
        <li><strong>Full session total:</strong> PHP ${fullAmountPhp}</li>
        <li><strong>Remaining balance later:</strong> PHP ${remainingBalancePhp}</li>
      </ul>
      ${contactLine}
      ${bookingSummaryHtml(booking)}
    `,
    text: `Complete your GCash deposit\n\nHello ${booking.full_name},\n\nWe received your booking details. To confirm your slot, please send the ${Math.round(BOOKING_DEPOSIT_PERCENTAGE * 100)}% GCash deposit using the details below.\n\nGCash number: ${payment.gcashNumber}\nAccount name: ${payment.gcashAccountName}\nDeposit due now: PHP ${booking.payment_amount_php}\nFull session total: PHP ${fullAmountPhp}\nRemaining balance later: PHP ${remainingBalancePhp}\n\n${contactText}\n\n${bookingSummaryText(booking)}`
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendBookingConfirmationNotification(booking: BookingRecord) {
  const config = getResendConfig();

  if (!config) {
    console.warn("Skipping booking confirmation email because Resend is not fully configured.");
    return;
  }

  const { resend, fromEmail } = config;
  const subject = `Your ${booking.sport} booking payment was received`;

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: [booking.email],
    subject,
    html: `
      <h1>Payment Received</h1>
      <p>Hello ${booking.full_name},</p>
      <p>Thanks for booking with 3EC Sports Photography. Your GCash payment has been received and your booking is now marked as <strong>${formatBookingStatus(booking.status)}</strong>.</p>
      <p>We will review the details and follow up if anything else is needed.</p>
      ${bookingSummaryHtml(booking)}
    `,
    text: `Payment Received\n\nHello ${booking.full_name},\n\nThanks for booking with 3EC Sports Photography. Your GCash payment has been received and your booking is now marked as ${formatBookingStatus(booking.status)}.\n\nWe will review the details and follow up if anything else is needed.\n\n${bookingSummaryText(booking)}`
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendBookingStatusChangedNotification(
  booking: BookingRecord,
  previousStatus: BookingStatus
) {
  const config = getResendConfig();

  if (!config) {
    console.warn("Skipping booking status email because Resend is not fully configured.");
    return;
  }

  const { resend, fromEmail } = config;
  const subject = `Your booking is now ${formatBookingStatus(booking.status)}`;

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: [booking.email],
    subject,
    html: `
      <h1>Booking Status Updated</h1>
      <p>Hello ${booking.full_name},</p>
      <p>Your booking status has changed from <strong>${formatBookingStatus(previousStatus)}</strong> to <strong>${formatBookingStatus(booking.status)}</strong>.</p>
      ${bookingSummaryHtml(booking)}
    `,
    text: `Booking Status Updated\n\nHello ${booking.full_name},\n\nYour booking status has changed from ${formatBookingStatus(previousStatus)} to ${formatBookingStatus(booking.status)}.\n\n${bookingSummaryText(booking)}`
  });

  if (error) {
    throw new Error(error.message);
  }
}
