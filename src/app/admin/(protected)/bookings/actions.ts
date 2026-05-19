"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sendBookingStatusChangedNotification } from "@/lib/booking-notifications";
import { hasExceededBookingNotesLimit, BOOKING_NOTES_WORD_LIMIT } from "@/lib/booking-notes";
import { type BookingStatus } from "@/lib/booking-status";
import { normalizeBookingTimes } from "@/lib/booking-time";
import { isBookingStatus } from "@/lib/booking-status";
import { type BookingRecord } from "@/lib/bookings";
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
  const eventDate = getTrimmedString(formData, "eventDate");
  const startTime = getTrimmedString(formData, "startTime");
  const endTime = getTrimmedString(formData, "endTime");
  const players = getTrimmedString(formData, "players");
  const notes = getTrimmedString(formData, "notes");
  const status = getTrimmedString(formData, "status");

  if (!bookingId || !fullName || !email || !phone || !sport || !eventDate || !startTime || !endTime || !players) {
    return { error: "Please complete all required booking details." };
  }

  if (!isValidSport(sport)) {
    return { error: "Please choose a valid sport." };
  }

  if (!isBookingStatus(status)) {
    return { error: "Please choose a valid booking status." };
  }

  const playerCount = Number.parseInt(players, 10);

  if (Number.isNaN(playerCount) || playerCount < 1) {
    return { error: "Players must be a valid number." };
  }

  if (hasExceededBookingNotesLimit(notes)) {
    return { error: `Notes must be ${BOOKING_NOTES_WORD_LIMIT} words or fewer.` };
  }

  let timeSlot = "";

  try {
    timeSlot = normalizeBookingTimes(startTime, endTime).timeSlot;
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
      event_date: eventDate,
      time_slot: timeSlot,
      players: playerCount,
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
  const reason = getTrimmedString(formData, "reason");

  if (!blockedDate) {
    throw new Error("Please choose a date to block.");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("unavailable_dates").insert({
    blocked_date: blockedDate,
    reason: reason || null
  });

  if (error) {
    throw new Error(
      error.code === "23505"
        ? "That date is already blocked."
        : error.message
    );
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
