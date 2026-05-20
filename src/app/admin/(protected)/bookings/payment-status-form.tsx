"use client";

import { useFormStatus } from "react-dom";
import {
  formatPaymentStatus,
  paymentStatuses,
  type PaymentStatus
} from "@/lib/payment-status";
import { updateBookingPaymentStatus } from "./actions";

type PaymentStatusFormProps = {
  bookingId: number;
  paymentStatus: PaymentStatus;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="admin-inline-status-button" type="submit" disabled={pending}>
      {pending ? "Saving..." : "Update"}
    </button>
  );
}

export function PaymentStatusForm({ bookingId, paymentStatus }: PaymentStatusFormProps) {
  return (
    <form className="admin-inline-status-form" action={updateBookingPaymentStatus}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <select
        className={`booking-status-select payment-status-select ${paymentStatus}`}
        defaultValue={paymentStatus}
        name="paymentStatus"
      >
        {paymentStatuses.map((option) => (
          <option key={option} value={option}>
            {formatPaymentStatus(option)}
          </option>
        ))}
      </select>
      <SubmitButton />
    </form>
  );
}
