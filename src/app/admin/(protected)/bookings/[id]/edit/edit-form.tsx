"use client";

import { useActionState } from "react";
import { updateBooking } from "../../actions";
import { sports } from "@/lib/sports";

type EditBookingFormProps = {
  booking: {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    sport: string;
    event_date: string;
    players: number;
    notes: string | null;
  };
  timeValues: {
    startTime: string;
    endTime: string;
  };
};

export function EditBookingForm({ booking, timeValues }: EditBookingFormProps) {
  const [state, formAction, isPending] = useActionState(updateBooking, undefined);

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
          Event date
          <input defaultValue={booking.event_date} name="eventDate" required type="date" />
        </label>

        <label className="admin-filter-field">
          Players
          <input defaultValue={booking.players} min="1" name="players" required type="number" />
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
        <textarea defaultValue={booking.notes ?? ""} name="notes" rows={5} />
      </label>

      {state?.error ? <p className="status-message error">{state.error}</p> : null}

      <div className="admin-edit-actions">
        <a className="secondary-button admin-clear-button" href="/admin/bookings">
          Cancel
        </a>
        <button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
