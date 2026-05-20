"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  sendBookingConfirmationNotification,
  sendBookingStatusChangedNotification
} from "@/lib/booking-notifications";
import { hasExceededBookingNotesLimit, BOOKING_NOTES_WORD_LIMIT } from "@/lib/booking-notes";
import { calculateWholeHourBookingAmountPhp } from "@/lib/booking-payment";
import { type BookingStatus } from "@/lib/booking-status";
import { normalizeBookingTimes } from "@/lib/booking-time";
import { isBookingStatus } from "@/lib/booking-status";
import { type BookingRecord } from "@/lib/bookings";
import { isPaymentStatus } from "@/lib/payment-status";
import { sports } from "@/lib/sports";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type BookingActionState = {
  error?: string;
};

function getTrimmedString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isValidSport(value: string) {
  return sports.includes(value as (typeof sports)[number]);
}

async function notifyStatusChangeIfNeeded(
  updatedBooking: BookingRecord,
  previousStatus: BookingStatus
) {
  if (previousStatus !== updatedBooking.status) {
    try {
      await sendBookingStatusChangedNotification(updatedBooking, previousStatus);
    } catch (notificationError) {
      console.error("Booking status notification failed:", notificationError);
    }
  }
}

export async function updateBooking(
  _: BookingActionState | undefined,
  formData: FormData
): Promise<BookingActionState | undefined> {
  const bookingId = getTrimmedString(formData, "bookingId");
  const fullName = getTrimmedString(formData, "fullName");
  const email = getTrimmedString(formData, "email");
  const phone = getTrimmedString(formData, "phone");
  const sport = getTrimmedString(formData, "sport");
  const address = getTrimmedString(formData, "address");
  const eventDate = getTrimmedString(formData, "eventDate");
  const startTime = getTrimmedString(formData, "startTime");
  const endTime = getTrimmedString(formData, "endTime");
  const notes = getTrimmedString(formData, "notes");
  const status = getTrimmedString(formData, "status");

  if (!bookingId || !fullName || !email || !phone || !sport || !address || !eventDate || !startTime || !endTime) {
    return { error: "Please complete all required booking details." };
  }

  if (!isValidSport(sport)) {
    return { error: "Please choose a valid sport." };
  }

  if (!isBookingStatus(status)) {
    return { error: "Please choose a valid booking status." };
  }

  if (hasExceededBookingNotesLimit(notes)) {
    return { error: `Notes must be ${BOOKING_NOTES_WORD_LIMIT} words or fewer.` };
  }

  let timeSlot = "";
  let paymentAmountPhp = 0;

  try {
    timeSlot = normalizeBookingTimes(startTime, endTime).timeSlot;
    paymentAmountPhp = calculateWholeHourBookingAmountPhp(startTime, endTime).paymentAmountPhp;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Please enter valid booking times."
    };
  }

  const supabase = createSupabaseAdminClient();
  const bookingIdNumber = Number.parseInt(bookingId, 10);
  const { data: existingBooking, error: existingBookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingIdNumber)
    .single();

  if (existingBookingError) {
    return { error: existingBookingError.message };
  }

  const previousStatus = (existingBooking as BookingRecord).status;
  const { data: updatedBooking, error } = await supabase
    .from("bookings")
    .update({
      full_name: fullName,
      email,
      phone,
      sport,
      address,
      payment_amount_php: paymentAmountPhp,
      event_date: eventDate,
      time_slot: timeSlot,
      notes: notes || null,
      status
    })
    .eq("id", bookingIdNumber)
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  await notifyStatusChangeIfNeeded(
    updatedBooking as BookingRecord,
    previousStatus as BookingStatus
  );

  revalidatePath("/admin/bookings");
  redirect("/admin/bookings");
}

export async function updateBookingStatus(formData: FormData) {
  const bookingId = getTrimmedString(formData, "bookingId");
  const status = getTrimmedString(formData, "status");

  if (!bookingId || !isBookingStatus(status)) {
    throw new Error("Invalid booking status update.");
  }

  const supabase = createSupabaseAdminClient();
  const bookingIdNumber = Number.parseInt(bookingId, 10);
  const { data: existingBooking, error: existingBookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingIdNumber)
    .single();

  if (existingBookingError) {
    throw new Error(existingBookingError.message);
  }

  const previousStatus = (existingBooking as BookingRecord).status;

  if (previousStatus === status) {
    redirect("/admin/bookings");
  }

  const { data: updatedBooking, error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingIdNumber)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await notifyStatusChangeIfNeeded(
    updatedBooking as BookingRecord,
    previousStatus as BookingStatus
  );

  revalidatePath("/admin/bookings");
  redirect("/admin/bookings");
}

export async function updateBookingPaymentStatus(formData: FormData) {
  const bookingId = getTrimmedString(formData, "bookingId");
  const paymentStatus = getTrimmedString(formData, "paymentStatus");

  if (!bookingId || !isPaymentStatus(paymentStatus)) {
    throw new Error("Invalid booking payment status update.");
  }

  const supabase = createSupabaseAdminClient();
  const bookingIdNumber = Number.parseInt(bookingId, 10);
  const { data: existingBooking, error: existingBookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingIdNumber)
    .single();

  if (existingBookingError) {
    throw new Error(existingBookingError.message);
  }

  const previousPaymentStatus = (existingBooking as BookingRecord).payment_status;

  if (previousPaymentStatus === paymentStatus) {
    redirect("/admin/bookings");
  }

  const { data: updatedBooking, error } = await supabase
    .from("bookings")
    .update({
      payment_status: paymentStatus,
      paid_at: paymentStatus === "paid" ? new Date().toISOString() : null
    })
    .eq("id", bookingIdNumber)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (previousPaymentStatus !== "paid" && paymentStatus === "paid") {
    try {
      await sendBookingConfirmationNotification(updatedBooking as BookingRecord);
    } catch (notificationError) {
      console.error("Booking payment confirmation notification failed:", notificationError);
    }
  }

  revalidatePath("/admin/bookings");
  redirect("/admin/bookings");
}

export async function deleteBooking(formData: FormData) {
  const bookingId = getTrimmedString(formData, "bookingId");

  if (!bookingId) {
    throw new Error("Missing booking id.");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("bookings").delete().eq("id", Number.parseInt(bookingId, 10));

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/bookings");
}

export async function addUnavailableDate(formData: FormData) {
  const blockedDate = getTrimmedString(formData, "blockedDate");
  const startTime = getTrimmedString(formData, "startTime");
  const endTime = getTrimmedString(formData, "endTime");
  const reason = getTrimmedString(formData, "reason");

  if (!blockedDate) {
    throw new Error("Please choose a date to block.");
  }

  let normalizedStartTime: string | null = null;
  let normalizedEndTime: string | null = null;

  if ((startTime && !endTime) || (!startTime && endTime)) {
    throw new Error("Enter both start and end time, or leave both blank for a full-day block.");
  }

  if (startTime && endTime) {
    const normalizedTimes = normalizeBookingTimes(startTime, endTime);
    normalizedStartTime = normalizedTimes.normalizedStartTime;
    normalizedEndTime = normalizedTimes.normalizedEndTime;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("unavailable_dates").insert({
    blocked_date: blockedDate,
    start_time: normalizedStartTime,
    end_time: normalizedEndTime,
    reason: reason || null
  });

  if (error) {
    throw new Error(
      error.message
    );
  }

  revalidatePath("/admin/bookings");
}

export async function updateUnavailableDate(formData: FormData) {
  const unavailableDateId = getTrimmedString(formData, "unavailableDateId");
  const blockedDate = getTrimmedString(formData, "blockedDate");
  const startTime = getTrimmedString(formData, "startTime");
  const endTime = getTrimmedString(formData, "endTime");
  const reason = getTrimmedString(formData, "reason");

  if (!unavailableDateId || !blockedDate) {
    throw new Error("Please choose a blocked date to update.");
  }

  let normalizedStartTime: string | null = null;
  let normalizedEndTime: string | null = null;

  if ((startTime && !endTime) || (!startTime && endTime)) {
    throw new Error("Enter both start and end time, or leave both blank for a full-day block.");
  }

  if (startTime && endTime) {
    const normalizedTimes = normalizeBookingTimes(startTime, endTime);
    normalizedStartTime = normalizedTimes.normalizedStartTime;
    normalizedEndTime = normalizedTimes.normalizedEndTime;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("unavailable_dates")
    .update({
      blocked_date: blockedDate,
      start_time: normalizedStartTime,
      end_time: normalizedEndTime,
      reason: reason || null
    })
    .eq("id", Number.parseInt(unavailableDateId, 10));

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/bookings");
}

export async function removeUnavailableDate(formData: FormData) {
  const unavailableDateId = getTrimmedString(formData, "unavailableDateId");

  if (!unavailableDateId) {
    throw new Error("Missing unavailable date id.");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("unavailable_dates")
    .delete()
    .eq("id", Number.parseInt(unavailableDateId, 10));

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/bookings");
}
