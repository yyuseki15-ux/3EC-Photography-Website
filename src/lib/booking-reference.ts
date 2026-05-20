export function formatBookingReference(bookingId: number) {
  return `3EC-${String(bookingId).padStart(4, "0")}`;
}
