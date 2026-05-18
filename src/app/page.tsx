"use client";

import { FormEvent, useMemo, useState } from "react";

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

const sports = [
  "Football",
  "Basketball",
  "Tennis",
  "Badminton",
  "Volleyball"
];

const timeSlots = [
  "08:00 AM",
  "10:00 AM",
  "01:00 PM",
  "04:00 PM",
  "07:00 PM"
];

const initialState: BookingState = {
  fullName: "",
  email: "",
  phone: "",
  sport: "Football",
  eventDate: "",
  startTime: "08:00 AM",
  endTime: "10:00 AM",
  players: "10",
  notes: ""
};

export default function Home() {
  const [formData, setFormData] = useState<BookingState>(initialState);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const minDate = useMemo(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }, []);

  const startTimeIndex = timeSlots.indexOf(formData.startTime);
  const availableEndTimes = timeSlots.filter(
    (_, index) => index > startTimeIndex
  );

  function updateStartTime(startTime: string) {
    const nextStartIndex = timeSlots.indexOf(startTime);
    const nextEndTimes = timeSlots.filter((_, index) => index > nextStartIndex);

    setFormData((current) => ({
      ...current,
      startTime,
      endTime: nextEndTimes.includes(current.endTime)
        ? current.endTime
        : nextEndTimes[0] ?? current.endTime
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
          <p className="eyebrow">3EC Sports Events</p>
          <h1>Book your next sports event in minutes.</h1>
          <p className="hero-text">
            Let customers choose a date, pick a sport, and send a booking request
            online without phone calls or paperwork.
          </p>
          <div className="hero-stats">
            <div>
              <strong>5 Sports</strong>
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

          <div className="grid-two">
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
            </label>

            <label>
              Start time
              <div className="time-range-fields">
                <select
                  value={formData.startTime}
                  onChange={(event) => updateStartTime(event.target.value)}
                >
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>

                <span className="time-range-separator">to</span>

                <select
                  value={formData.endTime}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      endTime: event.target.value
                    }))
                  }
                >
                  {availableEndTimes.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>

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
          </label>

          <button type="submit" disabled={status === "submitting"}>
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
