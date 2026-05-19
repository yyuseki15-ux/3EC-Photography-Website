export const bookingStatuses = ["new", "confirmed", "completed", "cancelled"] as const;

export type BookingStatus = (typeof bookingStatuses)[number];

export function isBookingStatus(value: string): value is BookingStatus {
  return bookingStatuses.includes(value as BookingStatus);
}

export function formatBookingStatus(status: BookingStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
