"use client";

import { useRouter } from "next/navigation";

export function DonePaymentButton() {
  const router = useRouter();

  function handleDonePayment() {
    router.push("/payment/complete");
  }

  return (
    <div className="manual-payment-done">
      <button
        className="booked-schedule-link manual-payment-done-button"
        type="button"
        onClick={handleDonePayment}
      >
        Done payment
      </button>
    </div>
  );
}
