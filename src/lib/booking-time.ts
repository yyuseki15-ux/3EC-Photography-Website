const timePattern = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;

function normalizeTimeInput(value: string) {
  return value.toUpperCase().replace(/\s+/g, " ").trim();
}

export function normalizeBookingTimes(startTime: string, endTime: string) {
  const normalizedStartTime = normalizeTimeInput(startTime);
  const normalizedEndTime = normalizeTimeInput(endTime);

  if (!timePattern.test(normalizedStartTime) || !timePattern.test(normalizedEndTime)) {
    throw new Error("Please enter start and end times like 08:00 AM or 01:30 PM.");
  }

  if (normalizedStartTime === normalizedEndTime) {
    throw new Error("Start time and end time must be different.");
  }

  return {
    normalizedStartTime,
    normalizedEndTime,
    timeSlot: `${normalizedStartTime} - ${normalizedEndTime}`
  };
}

export function splitTimeSlot(timeSlot: string) {
  const [startTime = "", endTime = ""] = timeSlot.split(" - ");

  return {
    startTime,
    endTime
  };
}
