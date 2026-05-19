"use client";

import { useActionState, useMemo, useState } from "react";
import { updateBooking } from "../../actions";
import { bookingStatuses, formatBookingStatus } from "@/lib/booking-status";
import { BOOKING_NOTES_WORD_LIMIT, countWords } from "@/lib/booking-notes";
import { sports } from "@/lib/sports";

type EditBookingFormProps = {
  booking: {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    sport: string;
    address: string | null;
    event_date: string;
    notes: string | null;
    status: string;
  };
  timeValues: {
    startTime: string;
    endTime: string;
  };
};

export function EditBookingForm({ booking, timeValues }: EditBookingFormProps) {
  const [state, formAction, isPending] = useActionState(updateBooking, undefined);
  const [notes, setNotes] = useState(booking.notes ?? "");
  const notesWordCount = useMemo(() => countWords(notes), [notes]);
  const hasTooManyNoteWords = notesWordCount > BOOKING_NOTES_WORD_LIMIT;

  return (
    <form className="admin-edit-form" action={formAction}>
      <input type="hidden" name="bookingId" value={booking.id} />

      <div className="admin-edit-grid">
        <label className="admin-filter-field">
          Full name
          <input defaultValue={booking.full_name} name="fullName" required type="text" />
        </label>

        <label className="admin-filter-field">
          Email address
          <input defaultValue={booking.email} name="email" required type="email" />
        </label>

        <label className="admin-filter-field">
          Phone number
          <input defaultValue={booking.phone} name="phone" required type="tel" />
        </label>

        <label className="admin-filter-field">
          Sport
          <select defaultValue={booking.sport} name="sport">
            {sports.map((sport) => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-filter-field">
          Address
          <input defaultValue={booking.address ?? ""} name="address" required type="text" />
        </label>

        <label className="admin-filter-field">
          Event date
          <input defaultValue={booking.event_date} name="eventDate" required type="date" />
        </label>

        <label className="admin-filter-field">
          Status
          <select defaultValue={booking.status} name="status">
            {bookingStatuses.map((status) => (
              <option key={status} value={status}>
                {formatBookingStatus(status)}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-filter-field">
          Start time
          <input
            defaultValue={timeValues.startTime}
            name="startTime"
            placeholder="08:00 AM"
            required
            type="text"
          />
        </label>

        <label className="admin-filter-field">
          End time
          <input
            defaultValue={timeValues.endTime}
            name="endTime"
            placeholder="10:00 AM"
            required
            type="text"
          />
        </label>
      </div>

      <label className="admin-filter-field">
        Notes
        <textarea
          name="notes"
          rows={5}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        <span className={`field-hint ${hasTooManyNoteWords ? "field-hint-error" : ""}`}>
          {notesWordCount}/{BOOKING_NOTES_WORD_LIMIT} words
        </span>
      </label>

      {state?.error ? <p className="status-message error">{state.error}</p> : null}

      <div className="admin-edit-actions">
        <a className="secondary-button admin-clear-button" href="/admin/bookings">
          Cancel
        </a>
        <button type="submit" disabled={isPending || hasTooManyNoteWords}>
          {isPending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
