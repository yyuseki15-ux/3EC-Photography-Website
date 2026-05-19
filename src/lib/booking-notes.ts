export const BOOKING_NOTES_WORD_LIMIT = 200;

export function countWords(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return 0;
  }

  return trimmedValue.split(/\s+/).length;
}

export function hasExceededBookingNotesLimit(value: string) {
  return countWords(value) > BOOKING_NOTES_WORD_LIMIT;
}
