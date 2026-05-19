"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BOOKING_NOTES_WORD_LIMIT, countWords } from "@/lib/booking-notes";
import { sports } from "@/lib/sports";
import { hasTimeSlotConflict, normalizeBookingTimes } from "@/lib/booking-time";
import { formatUnavailableDate, type PublicUnavailableDate } from "@/lib/unavailable-dates";

type BookingState = {
  fullName: string;
  email: string;
  phone: string;
  sport: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  players: string;
  notes: string;
};

const suggestedTimes = Array.from({ length: 48 }, (_, index) => {
  const totalMinutes = index * 30;
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const formattedMinutes = minutes.toString().padStart(2, "0");

  return `${hours12.toString().padStart(2, "0")}:${formattedMinutes} ${period}`;
});

const initialState: BookingState = {
  fullName: "",
  email: "",
  phone: "",
  sport: "Football",
  eventDate: "",
  startTime: "",
  endTime: "",
  players: "10",
  notes: ""
};

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

export default function Home() {
  const [formData, setFormData] = useState<BookingState>(initialState);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [unavailableDates, setUnavailableDates] = useState<PublicUnavailableDate[]>([]);
  const [scheduleIndex, setScheduleIndex] = useState(0);
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
      }
    }

    loadUnavailableDates();

    return () => {
      isMounted = false;
    };
  }, []);

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

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Could not submit booking.");
      }

      setStatus("success");
      setMessage(payload.message ?? "Your booking request has been sent.");
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
    <main className="page-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">3EC Sports Photography</p>
          <h1>Book your next sports event in minutes.</h1>
          <p className="hero-text">
            Let customers choose a date, pick a sport, and send a booking request
            online without phone calls or paperwork.
          </p>
          <div className="hero-stats">
            <div>
              <strong>6 Sports</strong>
              <span>Ready to book</span>
            </div>
            <div>
              <strong>Same Day</strong>
              <span>Confirmation workflow</span>
            </div>
            <div>
              <strong>Live Ready</strong>
              <span>Built for Vercel launch</span>
            </div>
          </div>
        </div>

        <form className="booking-card" onSubmit={handleSubmit}>
          <div className="form-heading">
            <h2>Reserve Your Slot</h2>
            <p>Choose a date and send your event request.</p>
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

          <div className="grid-two">
            <label>
              Sport
              <select
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

            <label>
              Players
              <input
                required
                min="2"
                max="30"
                type="number"
                value={formData.players}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    players: event.target.value
                  }))
                }
              />
            </label>
          </div>

          <label>
            Event date
            <input
              required
              min={minDate}
              type="date"
              value={formData.eventDate}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  eventDate: event.target.value
                }))
              }
            />
            <span className={`field-hint ${isUnavailableDate ? "field-hint-error" : ""}`}>
              {isUnavailableDate
                ? "That date is unavailable. Please choose another one."
                : upcomingUnavailableDates.length > 0
                  ? `Blocked dates: ${upcomingUnavailableDates.join(", ")}`
                  : "No manually blocked dates right now."}
            </span>
          </label>

          <div className="grid-two">
            <label>
              Start time
              <input
                required
                className="time-input"
                list="start-time-suggestions"
                type="text"
                inputMode="text"
                placeholder="08:00 AM"
                value={formData.startTime}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    startTime: event.target.value
                  }))
                }
              />
              <span className="field-hint">
                {selectedDateUnavailableTimes.length > 0
                  ? `Unavailable times on this date: ${selectedDateUnavailableTimes.join(", ")}`
                  : "Choose or enter any time like 08:00 AM or 01:30 PM"}
              </span>
            </label>

            <label>
              End time
              <input
                required
                className="time-input"
                list="end-time-suggestions"
                type="text"
                inputMode="text"
                placeholder="10:00 AM"
                value={formData.endTime}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    endTime: event.target.value
                  }))
                }
              />
              <span className={`field-hint ${hasBookedTimeConflict ? "field-hint-error" : ""}`}>
                {selectedDateUnavailableTimes.length > 0
                  ? hasBookedTimeConflict
                    ? "That time is unavailable on this date."
                    : `Unavailable times on this date: ${selectedDateUnavailableTimes.join(", ")}`
                  : "Choose or enter any time like 10:00 AM or 03:45 PM"}
              </span>
            </label>
          </div>

          {upcomingUnavailableSchedules.length > 0 ? (
            <div className="booked-schedule-card">
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
                      ←
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
                      →
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

          <datalist id="start-time-suggestions">
            {suggestedTimes.map((time) => (
              <option key={`start-${time}`} value={time} />
            ))}
          </datalist>

          <datalist id="end-time-suggestions">
            {suggestedTimes.map((time) => (
              <option key={`end-${time}`} value={time} />
            ))}
          </datalist>

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
            disabled={status === "submitting" || hasTooManyNoteWords || isUnavailableDate || hasBookedTimeConflict}
          >
            {status === "submitting" ? "Sending booking..." : "Book Event"}
          </button>

          {message ? (
            <p className={`status-message ${status}`}>{message}</p>
          ) : null}
        </form>
      </section>

      <section className="feature-strip">
        <article>
          <h3>Simple Booking</h3>
          <p>Customers pick a date, sport, and time without needing an account.</p>
        </article>
        <article>
          <h3>Ready for Growth</h3>
          <p>Add payments, admin calendars, and availability rules when you are ready.</p>
        </article>
        <article>
          <h3>Launch Online Fast</h3>
          <p>Deploy easily on Vercel and connect Supabase when you want live data.</p>
        </article>
      </section>
    </main>
  );
}
