"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BOOKING_NOTES_WORD_LIMIT, countWords } from "@/lib/booking-notes";
import {
  BOOKING_DEPOSIT_PERCENTAGE,
  BOOKING_RATE_PER_HOUR_PHP,
  calculateWholeHourBookingAmountPhp
} from "@/lib/booking-payment";
import { getManualPaymentConfig } from "@/lib/manual-payment";
import { hasTimeSlotConflict, normalizeBookingTimes } from "@/lib/booking-time";
import { sports } from "@/lib/sports";
import { suggestedTimes } from "@/lib/time-options";
import { formatUnavailableDate, type PublicUnavailableDate } from "@/lib/unavailable-dates";

type BookingState = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  sport: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  notes: string;
};

const calendarWeekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInputValue(value: string) {
  const [year, month, day] = value.split("-").map((part) => Number.parseInt(part, 10));

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function formatCalendarHeading(date: Date) {
  return new Intl.DateTimeFormat("en-SG", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function buildCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const startWeekday = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = [];

  for (let index = 0; index < startWeekday; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function getUnavailableScheduleSummary(entry: PublicUnavailableDate) {
  if (entry.fully_blocked) {
    return "Full day unavailable";
  }

  const details: string[] = [];

  if (entry.blocked_time_slots.length > 0) {
    details.push(`Blocked: ${entry.blocked_time_slots.join(", ")}`);
  }

  if (entry.booked_time_slots.length > 0) {
    details.push(`Booked: ${entry.booked_time_slots.join(", ")}`);
  }

  return details.join(" | ");
}

function isBookableWholeHourRange(
  startTime: string,
  endTime: string,
  unavailableTimeSlots: string[]
) {
  try {
    const normalizedTimes = normalizeBookingTimes(startTime, endTime);
    calculateWholeHourBookingAmountPhp(
      normalizedTimes.normalizedStartTime,
      normalizedTimes.normalizedEndTime
    );

    return !hasTimeSlotConflict(
      normalizedTimes.normalizedStartTime,
      normalizedTimes.normalizedEndTime,
      unavailableTimeSlots
    );
  } catch {
    return false;
  }
}

export default function BookingPage() {
  const paymentConfig = useMemo(() => {
    try {
      return getManualPaymentConfig();
    } catch {
      return null;
    }
  }, []);
  const initialState: BookingState = useMemo(
    () => ({
      fullName: "",
      email: "",
      phone: "",
      address: "",
      sport: "Football",
      eventDate: "",
      startTime: "",
      endTime: "",
      notes: ""
    }),
    []
  );
  const [formData, setFormData] = useState<BookingState>(() => initialState);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [unavailableDates, setUnavailableDates] = useState<PublicUnavailableDate[]>([]);
  const [isAvailabilityReady, setIsAvailabilityReady] = useState(false);
  const [scheduleIndex, setScheduleIndex] = useState(0);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const notesWordCount = useMemo(() => countWords(formData.notes), [formData.notes]);
  const hasTooManyNoteWords = notesWordCount > BOOKING_NOTES_WORD_LIMIT;

  const minDate = useMemo(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }, []);
  const selectedDateDetails = useMemo(
    () => unavailableDates.find((entry) => entry.blocked_date === formData.eventDate) ?? null,
    [formData.eventDate, unavailableDates]
  );
  const isUnavailableDate = useMemo(
    () => selectedDateDetails?.fully_blocked ?? false,
    [selectedDateDetails]
  );
  const upcomingUnavailableDates = useMemo(
    () =>
      unavailableDates
        .filter((entry) => entry.fully_blocked)
        .slice(0, 8)
        .map((entry) => formatUnavailableDate(entry.blocked_date)),
    [unavailableDates]
  );
  const upcomingUnavailableSchedules = useMemo(
    () =>
      unavailableDates
        .filter(
          (entry) =>
            entry.fully_blocked ||
            entry.booked_time_slots.length > 0 ||
            entry.blocked_time_slots.length > 0
        )
        .slice(0, 5),
    [unavailableDates]
  );
  const selectedDateBlockedTimes = useMemo(
    () => selectedDateDetails?.blocked_time_slots ?? [],
    [selectedDateDetails]
  );
  const selectedDateBookedTimes = useMemo(
    () => selectedDateDetails?.booked_time_slots ?? [],
    [selectedDateDetails]
  );
  const selectedDateUnavailableTimes = useMemo(
    () => [...selectedDateBlockedTimes, ...selectedDateBookedTimes],
    [selectedDateBlockedTimes, selectedDateBookedTimes]
  );
  const safeScheduleIndex = useMemo(() => {
    if (upcomingUnavailableSchedules.length === 0) {
      return 0;
    }

    return Math.min(scheduleIndex, upcomingUnavailableSchedules.length - 1);
  }, [scheduleIndex, upcomingUnavailableSchedules]);
  const activeUnavailableSchedule = useMemo(
    () => upcomingUnavailableSchedules[safeScheduleIndex] ?? null,
    [safeScheduleIndex, upcomingUnavailableSchedules]
  );
  const hasBookedTimeConflict = useMemo(() => {
    if (formData.startTime.trim().length === 0 || formData.endTime.trim().length === 0) {
      return false;
    }

    try {
      const normalizedTimes = normalizeBookingTimes(formData.startTime, formData.endTime);
      return hasTimeSlotConflict(
        normalizedTimes.normalizedStartTime,
        normalizedTimes.normalizedEndTime,
        selectedDateUnavailableTimes
      );
    } catch {
      return false;
    }
  }, [formData.endTime, formData.startTime, selectedDateUnavailableTimes]);
  const blockedFullDayDates = useMemo(
    () =>
      new Set(
        unavailableDates.filter((entry) => entry.fully_blocked).map((entry) => entry.blocked_date)
      ),
    [unavailableDates]
  );
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const selectedCalendarDate = useMemo(
    () => (formData.eventDate ? parseDateInputValue(formData.eventDate) : null),
    [formData.eventDate]
  );
  const bookingAmount = useMemo(() => {
    if (formData.startTime.trim().length === 0 || formData.endTime.trim().length === 0) {
      return null;
    }

    try {
      return calculateWholeHourBookingAmountPhp(formData.startTime, formData.endTime);
    } catch {
      return null;
    }
  }, [formData.endTime, formData.startTime]);
  const hasInvalidDuration =
    formData.startTime.trim().length > 0 &&
    formData.endTime.trim().length > 0 &&
    bookingAmount === null;
  const disabledStartTimes = useMemo(() => {
    if (selectedDateUnavailableTimes.length === 0) {
      return new Set<string>();
    }

    return new Set(
      suggestedTimes.filter(
        (startTime) =>
          !suggestedTimes.some((endTime) =>
            isBookableWholeHourRange(startTime, endTime, selectedDateUnavailableTimes)
          )
      )
    );
  }, [selectedDateUnavailableTimes]);
  const disabledEndTimes = useMemo(() => {
    if (formData.startTime.trim().length === 0) {
      return new Set<string>();
    }

    return new Set(
      suggestedTimes.filter(
        (endTime) =>
          !isBookableWholeHourRange(formData.startTime, endTime, selectedDateUnavailableTimes)
      )
    );
  }, [formData.startTime, selectedDateUnavailableTimes]);
  const hasAvailableEndTimeOptions = useMemo(
    () =>
      suggestedTimes.some(
        (endTime) =>
          !disabledEndTimes.has(endTime) &&
          isBookableWholeHourRange(formData.startTime, endTime, selectedDateUnavailableTimes)
      ),
    [disabledEndTimes, formData.startTime, selectedDateUnavailableTimes]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadUnavailableDates() {
      try {
        const response = await fetch("/api/unavailable-dates", {
          method: "GET"
        });

        if (!response.ok) {
          throw new Error("Could not load unavailable dates.");
        }

        const payload = (await response.json()) as {
          dates?: PublicUnavailableDate[];
        };

        if (isMounted) {
          setUnavailableDates(payload.dates ?? []);
        }
      } catch (error) {
        console.error("Unavailable dates load failed:", error);
      } finally {
        if (isMounted) {
          setIsAvailabilityReady(true);
        }
      }
    }

    loadUnavailableDates();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleEventDateChange(nextDate: string) {
    const matchingDate = unavailableDates.find((entry) => entry.blocked_date === nextDate) ?? null;

    if (matchingDate?.fully_blocked) {
      setFormData((current) => ({
        ...current,
        eventDate: "",
        startTime: "",
        endTime: ""
      }));
      setStatus("error");
      setMessage("That date is unavailable. Please choose another date.");
      return;
    }

    setFormData((current) => ({
      ...current,
      eventDate: nextDate,
      startTime: "",
      endTime: ""
    }));

    if (status === "error" && message === "That date is unavailable. Please choose another date.") {
      setStatus("idle");
      setMessage("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isUnavailableDate) {
      setStatus("error");
      setMessage("That date is unavailable. Please choose another date.");
      return;
    }

    if (hasTooManyNoteWords) {
      setStatus("error");
      setMessage(`Notes must be ${BOOKING_NOTES_WORD_LIMIT} words or fewer.`);
      return;
    }

    if (hasBookedTimeConflict) {
      setStatus("error");
      setMessage("That time is already booked on this date. Please choose a different time.");
      return;
    }

    if (hasInvalidDuration) {
      setStatus("error");
      setMessage("Bookings must use whole-hour time ranges.");
      return;
    }

    setStatus("submitting");
    setMessage("Preparing your GCash deposit instructions...");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const payload = (await response.json()) as {
        message?: string;
        redirectUrl?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Could not submit booking.");
      }

      if (payload.redirectUrl) {
        setStatus("success");
        setMessage(payload.message ?? "Opening your GCash deposit instructions...");
        window.location.assign(payload.redirectUrl);
        return;
      }

      setStatus("success");
      setMessage(payload.message ?? "Your booking request has been saved.");
      setFormData(initialState);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while sending your booking."
      );
    }
  }

  return (
    <main className="customer-page">
      <div className="customer-backdrop" aria-hidden="true" />
      <div className="customer-logo-watermark" aria-hidden="true">
        <div className="customer-logo-watermark-mark">
          <svg viewBox="0 0 220 140" role="img">
            <path d="M43 40h17l8-16h56l9 16h24c10 0 18 8 18 18v38c0 10-8 18-18 18H43c-10 0-18-8-18-18V58c0-10 8-18 18-18Z" />
            <path d="M63 40h18" />
            <circle cx="101" cy="77" r="28" />
            <circle cx="101" cy="77" r="15" />
            <circle cx="151" cy="58" r="4" className="brand-camera-dot" />
            <path d="M26 67h39" />
            <path d="M26 82h39" />
            <path d="M121 76h38" />
            <path d="M126 92h33" />
          </svg>
        </div>
        <span className="customer-logo-watermark-script">3EC</span>
        <span className="customer-logo-watermark-subtitle">Sports Photography</span>
      </div>
      <section className="customer-hero-shell">
        <div className="hero-card sports-hero-card">
          <form className="booking-card sports-booking-card" id="booking-form" onSubmit={handleSubmit}>
            <div className="booking-card-logo" aria-hidden="true">
              <div className="booking-card-logo-mark">
                <svg viewBox="0 0 220 140" role="img">
                  <path d="M43 40h17l8-16h56l9 16h24c10 0 18 8 18 18v38c0 10-8 18-18 18H43c-10 0-18-8-18-18V58c0-10 8-18 18-18Z" />
                  <path d="M63 40h18" />
                  <circle cx="101" cy="77" r="28" />
                  <circle cx="101" cy="77" r="15" />
                  <circle cx="151" cy="58" r="4" className="brand-camera-dot" />
                  <path d="M26 67h39" />
                  <path d="M26 82h39" />
                  <path d="M121 76h38" />
                  <path d="M126 92h33" />
                </svg>
              </div>
              <span className="booking-card-logo-script">3EC</span>
              <span className="booking-card-logo-subtitle">Sports Photography</span>
            </div>
            <div className="form-heading sports-form-heading">
              <span className="sports-form-tag">Reserve coverage</span>
              <h2>Lock your event slot</h2>
              <p>
                Choose your sport, venue, date, and time, then continue to the
                GCash deposit instructions.
              </p>
            </div>

            <label>
              Full name
              <input
                required
                type="text"
                value={formData.fullName}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    fullName: event.target.value
                  }))
                }
              />
            </label>

            <label>
              Email address
              <input
                required
                type="email"
                value={formData.email}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    email: event.target.value
                  }))
                }
              />
            </label>

            <label>
              Phone number
              <input
                required
                type="tel"
                value={formData.phone}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    phone: event.target.value
                  }))
                }
              />
            </label>

            <label>
              Address
              <input
                required
                type="text"
                value={formData.address}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    address: event.target.value
                  }))
                }
                placeholder="Enter venue or event address"
              />
            </label>

            <div className="grid-two">
              <label>
                Sport
                <select
                  disabled={!isAvailabilityReady}
                  value={formData.sport}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      sport: event.target.value
                    }))
                  }
                >
                  {sports.map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid-two">
              <details className="calendar-field calendar-field-card" open>
                <summary className="calendar-field-summary">
                  <div className="calendar-field-heading">
                    <span className="calendar-field-label">Event date</span>
                    <span className="field-hint">
                      {selectedCalendarDate
                        ? `Selected date: ${formatUnavailableDate(formData.eventDate)}`
                        : "Choose a date from the calendar."}
                    </span>
                  </div>
                  <span className="calendar-field-toggle" aria-hidden="true">
                    View calendar
                  </span>
                </summary>
                <input name="eventDate" required type="hidden" value={formData.eventDate} />
                <div className="booking-calendar" role="group" aria-label="Booking calendar">
                  <div className="booking-calendar-toolbar">
                    <button
                      className="booking-calendar-arrow"
                      type="button"
                      onClick={() =>
                        setVisibleMonth(
                          (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)
                        )
                      }
                    >
                      &larr;
                    </button>
                    <strong>{formatCalendarHeading(visibleMonth)}</strong>
                    <button
                      className="booking-calendar-arrow"
                      type="button"
                      onClick={() =>
                        setVisibleMonth(
                          (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)
                        )
                      }
                    >
                      &rarr;
                    </button>
                  </div>
                  <div className="booking-calendar-weekdays" aria-hidden="true">
                    {calendarWeekdays.map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                  <div className="booking-calendar-grid">
                    {calendarDays.map((day, index) => {
                      if (!day) {
                        return <span className="booking-calendar-empty" key={`empty-${index}`} />;
                      }

                      const formattedDay = formatDateInputValue(day);
                      const isPastDay = formattedDay < minDate;
                      const isBlockedDay = blockedFullDayDates.has(formattedDay);
                      const isSelectedDay = formData.eventDate === formattedDay;

                      return (
                        <button
                          key={formattedDay}
                          className={`booking-calendar-day ${
                            isSelectedDay ? "selected" : ""
                          } ${isBlockedDay || isPastDay ? "disabled" : ""}`}
                          type="button"
                          disabled={!isAvailabilityReady || isBlockedDay || isPastDay}
                          aria-pressed={isSelectedDay}
                          onClick={() => handleEventDateChange(formattedDay)}
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <span
                  className={`field-hint ${
                    isUnavailableDate || upcomingUnavailableDates.length > 0 ? "field-hint-error" : ""
                  }`}
                >
                  {isUnavailableDate
                    ? "That date is unavailable. Please choose another one."
                    : !isAvailabilityReady
                      ? "Loading blocked dates and booked hours..."
                    : upcomingUnavailableDates.length > 0
                      ? `Blocked dates: ${upcomingUnavailableDates.join(", ")}`
                      : "No manually blocked dates right now."}
                </span>
              </details>

              <label className="time-field">
                Start time
                <select
                  required
                  className="time-select"
                  disabled={!isAvailabilityReady}
                  value={formData.startTime}
                  onChange={(event) =>
                    setFormData((current) => {
                      const nextStartTime = event.target.value;
                      const shouldResetEndTime =
                        current.endTime.trim().length > 0 &&
                        !isBookableWholeHourRange(
                          nextStartTime,
                          current.endTime,
                          selectedDateUnavailableTimes
                        );

                      return {
                        ...current,
                        startTime: nextStartTime,
                        endTime: shouldResetEndTime ? "" : current.endTime
                      };
                    })
                  }
                >
                  <option value="">Select start time</option>
                  {suggestedTimes.map((time) => (
                    <option
                      key={`start-${time}`}
                      value={time}
                      disabled={disabledStartTimes.has(time)}
                    >
                      {disabledStartTimes.has(time) ? `${time} unavailable` : time}
                    </option>
                  ))}
                </select>
                <span
                  className={`field-hint ${
                    selectedDateUnavailableTimes.length > 0 ? "field-hint-error" : ""
                  }`}
                >
                  {!isAvailabilityReady
                    ? "Loading unavailable time slots..."
                    : selectedDateUnavailableTimes.length > 0
                    ? `Unavailable slots are disabled below: ${selectedDateUnavailableTimes.join(", ")}`
                    : "Choose a start time from the dropdown."}
                </span>
              </label>

              <label className="time-field">
                End time
                <select
                  required
                  className="time-select"
                  disabled={!isAvailabilityReady || formData.startTime.trim().length === 0}
                  value={formData.endTime}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      endTime: event.target.value
                    }))
                  }
                >
                  <option value="">Select end time</option>
                  {suggestedTimes.map((time) => (
                    <option key={`end-${time}`} value={time} disabled={disabledEndTimes.has(time)}>
                      {disabledEndTimes.has(time) ? `${time} unavailable` : time}
                    </option>
                  ))}
                </select>
                <span
                  className={`field-hint ${
                    hasBookedTimeConflict || selectedDateUnavailableTimes.length > 0 || hasInvalidDuration
                      ? "field-hint-error"
                      : ""
                  }`}
                >
                  {hasInvalidDuration
                    ? "Bookings must use whole-hour time ranges."
                    : !isAvailabilityReady
                    ? "Loading unavailable time slots..."
                    : formData.startTime.trim().length > 0 && !hasAvailableEndTimeOptions
                    ? "No open whole-hour end times remain for that start time."
                    : selectedDateUnavailableTimes.length > 0
                    ? hasBookedTimeConflict
                      ? "That time is unavailable on this date."
                      : "Unavailable times are disabled in the dropdown."
                    : "Choose an end time from the dropdown."}
                </span>
              </label>
            </div>

            {selectedDateBlockedTimes.length > 0 || selectedDateBookedTimes.length > 0 ? (
              <div className="time-slot-status-card" aria-live="polite">
                <div className="time-slot-status-heading">
                  <strong>Time availability for this date</strong>
                  <span className="field-hint">
                    Taken and blocked hours are shown here and disabled in the dropdowns.
                  </span>
                </div>

                {selectedDateBlockedTimes.length > 0 ? (
                  <div className="time-slot-status-group">
                    <span className="time-slot-status-label blocked">Blocked</span>
                    <div className="time-slot-status-list">
                      {selectedDateBlockedTimes.map((timeSlot) => (
                        <span className="time-slot-status-pill blocked" key={`blocked-${timeSlot}`}>
                          {timeSlot}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedDateBookedTimes.length > 0 ? (
                  <div className="time-slot-status-group">
                    <span className="time-slot-status-label booked">Booked</span>
                    <div className="time-slot-status-list">
                      {selectedDateBookedTimes.map((timeSlot) => (
                        <span className="time-slot-status-pill booked" key={`booked-${timeSlot}`}>
                          {timeSlot}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {upcomingUnavailableSchedules.length > 0 ? (
              <div className="booked-schedule-card sports-schedule-card">
                <div className="booked-schedule-header">
                  <span className="calendar-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" role="img">
                      <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v11a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm13 8H4v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8ZM5 6a1 1 0 0 0-1 1v1h16V7a1 1 0 0 0-1-1H5Z" />
                    </svg>
                  </span>
                  <div className="booked-schedule-header-text">
                    <strong>Future Unavailable Schedule</strong>
                    <span className="field-hint">
                      See blocked dates and booked hours before you choose a time.
                    </span>
                  </div>
                </div>

                {activeUnavailableSchedule ? (
                  <>
                    <div className="booked-schedule-controls" aria-label="Unavailable date slider">
                      <button
                        className="booked-schedule-nav"
                        type="button"
                        onClick={() =>
                          setScheduleIndex((current) =>
                            current <= 0 ? upcomingUnavailableSchedules.length - 1 : current - 1
                          )
                        }
                      >
                        &larr;
                      </button>
                      <span className="booked-schedule-count">
                        {safeScheduleIndex + 1} of {upcomingUnavailableSchedules.length}
                      </span>
                      <button
                        className="booked-schedule-nav"
                        type="button"
                        onClick={() =>
                          setScheduleIndex((current) =>
                            current >= upcomingUnavailableSchedules.length - 1 ? 0 : current + 1
                          )
                        }
                      >
                        &rarr;
                      </button>
                    </div>

                    <div className="booked-schedule-list">
                      <div className="booked-schedule-item static" key={activeUnavailableSchedule.blocked_date}>
                        <strong>{formatUnavailableDate(activeUnavailableSchedule.blocked_date)}</strong>
                        <span>{getUnavailableScheduleSummary(activeUnavailableSchedule)}</span>
                        {activeUnavailableSchedule.reason ? (
                          <span className="booked-schedule-reason">{activeUnavailableSchedule.reason}</span>
                        ) : null}
                      </div>
                    </div>
                  </>
                ) : null}

                <Link className="booked-schedule-link" href="/unavailable-dates">
                  View all unavailable dates
                </Link>
              </div>
            ) : null}

            <details className="booking-policy-card" open>
              <summary className="booking-policy-summary">
                <div className="booking-policy-heading">
                  <strong>Booking terms</strong>
                  <span className="field-hint">
                    A quick guide for payment, rescheduling, cancellations, and confirmation timing.
                  </span>
                </div>
                <span className="booking-policy-toggle" aria-hidden="true">
                  View details
                </span>
              </summary>

              <div className="booking-policy-grid">
                <article>
                  <strong>Payment</strong>
                  <p>
                    A 50% GCash deposit is required to hold your slot. Bookings stay pending until
                    your proof of payment is uploaded and verified.
                  </p>
                </article>
                <article>
                  <strong>Rescheduling</strong>
                  <p>
                    Rescheduling is allowed only within two weeks from the time the booking was
                    originally made, and all changes remain subject to date and time availability.
                  </p>
                </article>
                <article>
                  <strong>Cancellations</strong>
                  <p>
                    Cancelled bookings should be reported in advance. Please note that the 50%
                    deposit is non-refundable once payment has been made.
                  </p>
                </article>
                <article>
                  <strong>Confirmation timing</strong>
                  <p>
                    You will receive your confirmation email after payment verification. Manual
                    review may take a little time during busy hours.
                  </p>
                </article>
              </div>
            </details>

            <label>
              Extra notes
              <textarea
                rows={4}
                value={formData.notes}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    notes: event.target.value
                  }))
                }
                placeholder="Tell us about venue needs, coaching, or equipment."
              />
              <span className={`field-hint ${hasTooManyNoteWords ? "field-hint-error" : ""}`}>
                {notesWordCount}/{BOOKING_NOTES_WORD_LIMIT} words
              </span>
            </label>

            <button
              type="submit"
              disabled={
                !isAvailabilityReady ||
                status === "submitting" ||
                hasTooManyNoteWords ||
                isUnavailableDate ||
                hasBookedTimeConflict ||
                hasInvalidDuration
              }
            >
              {status === "submitting" ? "Loading deposit steps..." : "Book and pay deposit with GCash"}
            </button>

            <p className="field-hint">
              {paymentConfig
                ? bookingAmount
                  ? `Rate: PHP ${BOOKING_RATE_PER_HOUR_PHP} per hour. Full session total: PHP ${bookingAmount.fullAmountPhp} for ${bookingAmount.durationHours} hour${bookingAmount.durationHours > 1 ? "s" : ""}. Deposit due now: PHP ${bookingAmount.paymentAmountPhp} (${Math.round(BOOKING_DEPOSIT_PERCENTAGE * 100)}%). Remaining balance: PHP ${bookingAmount.remainingBalancePhp}. Send the deposit to ${paymentConfig.gcashAccountName}.`
                  : `Rate: PHP ${BOOKING_RATE_PER_HOUR_PHP} per hour. Choose whole-hour start and end times to see the full total and 50% deposit.`
                : "Your booking is confirmed after successful GCash deposit verification."}
            </p>

            {message ? <p className={`status-message ${status}`}>{message}</p> : null}
          </form>
        </div>
      </section>
    </main>
  );
}
