import { formatBookingStatus, type BookingStatus } from "@/lib/booking-status";
import { type BookingRecord } from "@/lib/bookings";
import { getResendConfig } from "@/lib/resend";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function bookingSummaryHtml(booking: Pick<BookingRecord, "full_name" | "email" | "phone" | "sport" | "event_date" | "time_slot" | "players" | "notes" | "status">) {
  return `
    <ul>
      <li><strong>Name:</strong> ${booking.full_name}</li>
      <li><strong>Email:</strong> ${booking.email}</li>
      <li><strong>Phone:</strong> ${booking.phone}</li>
      <li><strong>Sport:</strong> ${booking.sport}</li>
      <li><strong>Date:</strong> ${formatDate(booking.event_date)}</li>
      <li><strong>Time:</strong> ${booking.time_slot}</li>
      <li><strong>Players:</strong> ${booking.players}</li>
      <li><strong>Status:</strong> ${formatBookingStatus(booking.status)}</li>
      <li><strong>Notes:</strong> ${booking.notes || "No notes"}</li>
    </ul>
  `;
}

function bookingSummaryText(booking: Pick<BookingRecord, "full_name" | "email" | "phone" | "sport" | "event_date" | "time_slot" | "players" | "notes" | "status">) {
  return [
    `Name: ${booking.full_name}`,
    `Email: ${booking.email}`,
    `Phone: ${booking.phone}`,
    `Sport: ${booking.sport}`,
    `Date: ${formatDate(booking.event_date)}`,
    `Time: ${booking.time_slot}`,
    `Players: ${booking.players}`,
    `Status: ${formatBookingStatus(booking.status)}`,
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
