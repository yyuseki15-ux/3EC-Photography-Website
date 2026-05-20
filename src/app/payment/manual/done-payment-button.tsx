"use client";

import { useState } from "react";

export function DonePaymentButton() {
  const [isDone, setIsDone] = useState(false);

  function handleDonePayment() {
    setIsDone(true);

    window.setTimeout(() => {
      window.open("", "_self");
      window.close();
    }, 1800);
  }

  return (
    <div className="manual-payment-done">
      <button
        className="booked-schedule-link manual-payment-done-button"
        type="button"
        onClick={handleDonePayment}
        disabled={isDone}
      >
        {isDone ? "Closing..." : "Done payment"}
      </button>

      {isDone ? (
        <p className="status-message success manual-payment-done-message">
          Thank you for booking. You will receive an email confirmation.
        </p>
      ) : null}
    </div>
  );
}
