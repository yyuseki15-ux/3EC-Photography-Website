const timePattern = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;

function normalizeTimeInput(value: string) {
  return value.toUpperCase().replace(/\s+/g, " ").trim();
}

function parseTimeToMinutes(value: string) {
  const normalizedValue = normalizeTimeInput(value);
  const match = normalizedValue.match(/^(0?[1-9]|1[0-2]):([0-5][0-9])\s(AM|PM)$/i);

  if (!match) {
    throw new Error("Please enter start and end times like 08:00 AM or 01:30 PM.");
  }

  const [, rawHours, rawMinutes, meridiem] = match;
  const hours = Number.parseInt(rawHours, 10) % 12;
  const minutes = Number.parseInt(rawMinutes, 10);
  const meridiemOffset = meridiem.toUpperCase() === "PM" ? 12 * 60 : 0;

  return hours * 60 + minutes + meridiemOffset;
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

export function getTimeSlotRange(timeSlot: string) {
  const { startTime, endTime } = splitTimeSlot(timeSlot);

  return {
    startMinutes: parseTimeToMinutes(startTime),
    endMinutes: parseTimeToMinutes(endTime)
  };
}

export function hasBookingTimeConflict(
  requestedStartTime: string,
  requestedEndTime: string,
  existingTimeSlots: string[]
) {
  const requestedStartMinutes = parseTimeToMinutes(requestedStartTime);
  const requestedEndMinutes = parseTimeToMinutes(requestedEndTime);

  return existingTimeSlots.some((timeSlot) => {
    const { startMinutes, endMinutes } = getTimeSlotRange(timeSlot);
    const requestedEndsBeforeExisting = requestedEndMinutes <= startMinutes;
    const requestedStartsAfterExisting = requestedStartMinutes >= endMinutes;

    return !requestedEndsBeforeExisting && !requestedStartsAfterExisting;
  });
}

export function splitTimeSlot(timeSlot: string) {
  const [startTime = "", endTime = ""] = timeSlot.split(" - ");

  return {
    startTime,
    endTime
  };
}
