"use client";

import { useFormStatus } from "react-dom";
import { bookingStatuses, formatBookingStatus, type BookingStatus } from "@/lib/booking-status";
import { updateBookingStatus } from "./actions";

type StatusFormProps = {
  bookingId: number;
  status: BookingStatus;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="admin-inline-status-button" type="submit" disabled={pending}>
      {pending ? "Saving..." : "Update"}
    </button>
  );
}

export function StatusForm({ bookingId, status }: StatusFormProps) {
  return (
    <form className="admin-inline-status-form" action={updateBookingStatus}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <select
        className={`booking-status-select ${status}`}
        defaultValue={status}
        name="status"
      >
        {bookingStatuses.map((option) => (
          <option key={option} value={option}>
            {formatBookingStatus(option)}
          </option>
        ))}
      </select>
      <SubmitButton />
    </form>
  );
}
