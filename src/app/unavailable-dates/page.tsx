"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatUnavailableDate, type PublicUnavailableDate } from "@/lib/unavailable-dates";

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

export default function UnavailableDatesPage() {
  const [unavailableDates, setUnavailableDates] = useState<PublicUnavailableDate[]>([]);
  const [hasError, setHasError] = useState(false);

  const futureUnavailableDates = useMemo(
    () =>
      unavailableDates.filter(
        (entry) =>
          entry.fully_blocked ||
          entry.booked_time_slots.length > 0 ||
          entry.blocked_time_slots.length > 0
      ),
    [unavailableDates]
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
          setHasError(false);
        }
      } catch (error) {
        console.error("Unavailable dates load failed:", error);

        if (isMounted) {
          setHasError(true);
        }
      }
    }

    loadUnavailableDates();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="public-page-shell">
      <section className="public-page-card">
        <div className="public-page-header">
          <div>
            <p className="eyebrow">3EC Sports Photography</p>
            <h1>All unavailable dates and hours</h1>
            <p className="hero-text public-page-text">
              Review future blocked dates, booked hours, and full-day closures before choosing your event time.
            </p>
          </div>

          <Link className="public-page-link" href="/">
            Back to booking form
          </Link>
        </div>

        {hasError ? (
          <p className="status-message error">
            We could not load the unavailable schedule right now. Please try again in a moment.
          </p>
        ) : null}

        {futureUnavailableDates.length > 0 ? (
          <div className="booked-schedule-list booked-schedule-list-full">
            {futureUnavailableDates.map((entry) => (
              <div className="booked-schedule-item static" key={entry.blocked_date}>
                <strong>{formatUnavailableDate(entry.blocked_date)}</strong>
                <span>{getUnavailableScheduleSummary(entry)}</span>
                {entry.reason ? (
                  <span className="booked-schedule-reason">{entry.reason}</span>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-empty-state">
            <h2>No unavailable dates yet</h2>
            <p>There are currently no future blocked dates or booked hours to show.</p>
          </div>
        )}
      </section>
    </main>
  );
}
