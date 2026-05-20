import { NextResponse } from "next/server";
import { formatBookingReference } from "@/lib/booking-reference";
import {
  ensurePaymentProofBucket,
  isValidPaymentProofMimeType,
  PAYMENT_PROOF_BUCKET,
  PAYMENT_PROOF_MAX_BYTES,
  sanitizePaymentProofFileName
} from "@/lib/payment-proof";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function getTrimmedString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const bookingId = getTrimmedString(formData, "bookingId");
  const file = formData.get("proofFile");

  if (!bookingId) {
    return NextResponse.json({ error: "Missing booking id." }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Please upload your payment proof first." }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
  }

  if (file.size > PAYMENT_PROOF_MAX_BYTES) {
    return NextResponse.json({ error: "Payment proof must be 10 MB or smaller." }, { status: 400 });
  }

  if (!isValidPaymentProofMimeType(file.type)) {
    return NextResponse.json(
      { error: "Upload a JPG, PNG, WEBP image, or PDF proof of payment." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const bookingIdNumber = Number.parseInt(bookingId, 10);
  const { data: existingBooking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, proof_of_payment_path")
    .eq("id", bookingIdNumber)
    .single();

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 400 });
  }

  await ensurePaymentProofBucket();

  const safeFileName = sanitizePaymentProofFileName(file.name);
  const uploadPath = `booking-${bookingIdNumber}/${Date.now()}-${safeFileName}`;
  const fileBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(PAYMENT_PROOF_BUCKET)
    .upload(uploadPath, fileBuffer, {
      contentType: file.type,
      upsert: false
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const existingProofPath =
    existingBooking && "proof_of_payment_path" in existingBooking
      ? (existingBooking.proof_of_payment_path as string | null)
      : null;

  if (existingProofPath) {
    const { error: removeError } = await supabase.storage
      .from(PAYMENT_PROOF_BUCKET)
      .remove([existingProofPath]);

    if (removeError) {
      console.error("Old payment proof cleanup failed:", removeError);
    }
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      proof_of_payment_path: uploadPath,
      proof_uploaded_at: new Date().toISOString()
    })
    .eq("id", bookingIdNumber);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    redirectTo: `/payment/complete?booking_reference=${encodeURIComponent(
      formatBookingReference(bookingIdNumber)
    )}`
  });
}
