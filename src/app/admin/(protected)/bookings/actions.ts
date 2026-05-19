"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { normalizeBookingTimes } from "@/lib/booking-time";
import { isBookingStatus } from "@/lib/booking-status";
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

  let timeSlot = "";

  try {
    timeSlot = normalizeBookingTimes(startTime, endTime).timeSlot;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Please enter valid booking times."
    };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
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
    .eq("id", Number.parseInt(bookingId, 10));

  if (error) {
    return { error: error.message };
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
