import { normalizeBookingTimes } from "@/lib/booking-time";

export const BOOKING_RATE_PER_HOUR_PHP = 600;
export const BOOKING_DEPOSIT_PERCENTAGE = 0.5;

function parseTimeToMinutes(value: string) {
  const normalizedValue = value.toUpperCase().replace(/\s+/g, " ").trim();
  const match = normalizedValue.match(/^(0?[1-9]|1[0-2]):([0-5][0-9])\s(AM|PM)$/i);

  if (!match) {
    throw new Error("Please enter start and end times like 08:00 AM or 01:00 PM.");
  }

  const [, rawHours, rawMinutes, meridiem] = match;
  const hours = Number.parseInt(rawHours, 10) % 12;
  const minutes = Number.parseInt(rawMinutes, 10);
  const meridiemOffset = meridiem.toUpperCase() === "PM" ? 12 * 60 : 0;

  return hours * 60 + minutes + meridiemOffset;
}

export function calculateWholeHourBookingAmountPhp(startTime: string, endTime: string) {
  const normalizedTimes = normalizeBookingTimes(startTime, endTime);
  const startMinutes = parseTimeToMinutes(normalizedTimes.normalizedStartTime);
  const endMinutes = parseTimeToMinutes(normalizedTimes.normalizedEndTime);
  const durationMinutes = endMinutes - startMinutes;

  if (durationMinutes <= 0) {
    throw new Error("End time must be after start time.");
  }

  if (durationMinutes % 60 !== 0) {
    throw new Error("Bookings must use whole-hour time ranges.");
  }

  const durationHours = durationMinutes / 60;
  const fullAmountPhp = durationHours * BOOKING_RATE_PER_HOUR_PHP;
  const paymentAmountPhp = Math.round(fullAmountPhp * BOOKING_DEPOSIT_PERCENTAGE);
  const remainingBalancePhp = fullAmountPhp - paymentAmountPhp;

  return {
    durationHours,
    fullAmountPhp,
    paymentAmountPhp,
    remainingBalancePhp
  };
}
