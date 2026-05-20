"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PaymentProofFormProps = {
  bookingId: number;
  bookingReference: string;
  hasUploadedProof: boolean;
};

export function PaymentProofForm({
  bookingId,
  bookingReference,
  hasUploadedProof
}: PaymentProofFormProps) {
  const router = useRouter();
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!proofFile) {
      setErrorMessage("Please choose your proof of payment first.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData();
    formData.set("bookingId", String(bookingId));
    formData.set("proofFile", proofFile);

    try {
      const response = await fetch("/api/payment-proof", {
        method: "POST",
        body: formData
      });

      const data = (await response.json()) as { error?: string; redirectTo?: string };

      if (!response.ok || !data.redirectTo) {
        setErrorMessage(data.error ?? "We could not upload your payment proof. Please try again.");
        setIsSubmitting(false);
        return;
      }

      router.push(data.redirectTo);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not upload your payment proof. Please try again."
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form className="manual-payment-proof-form" onSubmit={handleSubmit}>
      <label className="manual-payment-proof-field">
        Upload proof of payment
        <input
          accept="image/jpeg,image/png,image/webp,application/pdf"
          name="proofFile"
          onChange={(event) => {
            const nextFile = event.currentTarget.files?.[0] ?? null;
            setProofFile(nextFile);
            setErrorMessage("");
          }}
          required
          type="file"
        />
      </label>

      <p className="manual-payment-proof-hint">
        Upload a screenshot, receipt image, or PDF proof before finishing this booking. Your
        reference is <strong>{bookingReference}</strong>.
      </p>

      <ul className="manual-payment-proof-list" aria-label="Accepted proof of payment formats">
        <li>Accepted files: JPG, PNG, WEBP, or PDF</li>
        <li>Maximum file size: 10 MB</li>
        <li>Make sure the GCash amount, sender name, and reference are visible</li>
      </ul>

      {hasUploadedProof ? (
        <p className="status-message success manual-payment-proof-success">
          A proof file is already attached to this booking. Uploading a new one will replace it.
        </p>
      ) : null}

      {errorMessage ? <p className="status-message error manual-payment-proof-error">{errorMessage}</p> : null}

      <button
        className="booked-schedule-link manual-payment-done-button"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Uploading proof..." : "Done payment"}
      </button>
    </form>
  );
}
