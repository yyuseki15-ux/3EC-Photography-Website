"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BOOKING_NOTES_WORD_LIMIT, countWords } from "@/lib/booking-notes";
import { sports } from "@/lib/sports";
import { hasTimeSlotConflict, normalizeBookingTimes } from "@/lib/booking-time";
import { suggestedTimes } from "@/lib/time-options";
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
    <main className="customer-page">
      <div className="customer-backdrop" aria-hidden="true" />
      <header className="sports-nav-shell">
        <nav className="sports-nav">
          <div className="sports-nav-brand">
            <span className="sports-nav-mark">3EC</span>
            <span className="sports-nav-name">Sports Photography</span>
          </div>
          <div className="sports-nav-links">
            <a href="#booking-form">Book</a>
            <a href="#why-3ec">Why 3EC</a>
            <a href="#booking-flow">Flow</a>
          </div>
        </nav>
      </header>
      <section className="customer-hero-shell">
        <div className="hero-card sports-hero-card">
          <div className="hero-copy sports-hero-copy">
            <div className="sports-hero-topline">
              <p className="eyebrow">3EC Sports Photography</p>
              <span className="sports-badge">Game Day Coverage</span>
            </div>

            <p className="sports-kicker">Freeze the sprint. Frame the crowd. Capture the moment.</p>
            <p className="sports-brush-line">Fast frames. Sharp stories. Championship energy.</p>
            <h1 className="sports-hero-title">
              Sports photos that feel like the finals.
            </h1>
            <p className="hero-text sports-hero-text">
              Book bold sports photography for football, basketball, volleyball, tennis,
              badminton, and pickleball. Built for schools, leagues, clubs, and private events.
            </p>

            <div className="sports-highlight-bar">
              <div>
                <strong>Action-first coverage</strong>
                <span>Fast play, team energy, and crowd moments captured in one session.</span>
              </div>
              <div>
                <strong>Flexible scheduling</strong>
                <span>Pick your sport, date, and open slot with live unavailable-time checks.</span>
              </div>
            </div>

            <div className="hero-stats sports-hero-stats">
              <div>
                <strong>6 Sports</strong>
                <span>Football to pickleball</span>
              </div>
              <div>
                <strong>Live Calendar</strong>
                <span>Unavailable dates shown</span>
              </div>
              <div>
                <strong>Admin Ready</strong>
                <span>Bookings tracked instantly</span>
              </div>
            </div>

            <div className="sports-strip-grid">
              <article>
                <span className="sports-strip-label">Best for</span>
                <strong>Tournaments</strong>
                <p>Cover opening games, clutch plays, and team portraits without losing pace.</p>
              </article>
              <article>
                <span className="sports-strip-label">Best for</span>
                <strong>School events</strong>
                <p>One smooth booking flow for varsity games, intramurals, and athlete features.</p>
              </article>
              <article>
                <span className="sports-strip-label">Best for</span>
                <strong>Private sessions</strong>
                <p>Perfect for player spotlights, highlight reels, and branded social content.</p>
              </article>
            </div>

            <div className="sports-editorial-grid">
              <article className="sports-editorial-card tall">
                <span className="sports-strip-label">Atmosphere</span>
                <strong>Editorial framing with match-day tension</strong>
                <p>Designed to feel closer to a sports feature spread than a plain event booking page.</p>
              </article>
              <article className="sports-editorial-card">
                <span className="sports-strip-label">Coverage</span>
                <strong>Bench, crowd, action</strong>
                <p>Built for momentum and movement, not static portraits alone.</p>
              </article>
              <article className="sports-editorial-card accent">
                <span className="sports-strip-label">Style</span>
                <strong>High contrast. Low clutter.</strong>
                <p>Minimal chrome, stronger imagery language, and faster booking focus.</p>
              </article>
            </div>
          </div>

          <form className="booking-card sports-booking-card" id="booking-form" onSubmit={handleSubmit}>
            <div className="form-heading sports-form-heading">
              <span className="sports-form-tag">Reserve coverage</span>
              <h2>Lock your event slot</h2>
              <p>Tell us the sport, date, and time window you want covered.</p>
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
                <select
                  required
                  className="time-select"
                  value={formData.startTime}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      startTime: event.target.value
                    }))
                  }
                >
                  <option value="">Select start time</option>
                  {suggestedTimes.map((time) => (
                    <option key={`start-${time}`} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                <span className="field-hint">
                  {selectedDateUnavailableTimes.length > 0
                    ? `Unavailable times on this date: ${selectedDateUnavailableTimes.join(", ")}`
                    : "Choose a start time from the dropdown."}
                </span>
              </label>

              <label>
                End time
                <select
                  required
                  className="time-select"
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
                    <option key={`end-${time}`} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                <span className={`field-hint ${hasBookedTimeConflict ? "field-hint-error" : ""}`}>
                  {selectedDateUnavailableTimes.length > 0
                    ? hasBookedTimeConflict
                      ? "That time is unavailable on this date."
                      : `Unavailable times on this date: ${selectedDateUnavailableTimes.join(", ")}`
                    : "Choose an end time from the dropdown."}
                </span>
              </label>
            </div>

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
        </div>
      </section>

      <section className="sports-proof-section" id="why-3ec">
        <div className="sports-proof-header">
          <p className="eyebrow">Why teams book 3EC</p>
          <h2>Built for fast games and high-pressure moments</h2>
        </div>
        <div className="feature-strip sports-feature-strip">
          <article>
            <h3>Action-Led Coverage</h3>
            <p>We prioritize explosive moments, player emotion, bench reactions, and crowd energy.</p>
          </article>
          <article>
            <h3>Cleaner Scheduling</h3>
            <p>Live unavailable dates and hour blocks help customers avoid clashes before they submit.</p>
          </article>
          <article>
            <h3>Ready for Growth</h3>
            <p>Perfect foundation for future add-ons like galleries, payments, and email confirmations.</p>
          </article>
        </div>
      </section>

      <section className="sports-process-section" id="booking-flow">
        <div className="sports-process-card">
          <div className="sports-process-copy">
            <p className="eyebrow">Booking Flow</p>
            <h2>From request to match-day coverage</h2>
          </div>
          <div className="sports-process-steps">
            <div>
              <span>01</span>
              <strong>Choose sport and date</strong>
              <p>Select your sport, roster size, and the exact event date you want covered.</p>
            </div>
            <div>
              <span>02</span>
              <strong>Pick an open time slot</strong>
              <p>Use the live schedule to avoid blocked dates and booked hours before you submit.</p>
            </div>
            <div>
              <span>03</span>
              <strong>Get reviewed fast</strong>
              <p>Your request lands in the admin dashboard immediately for confirmation and follow-up.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
