import { NextResponse } from "next/server";
import {
  sendBookingConfirmationNotification,
  sendNewBookingNotification
} from "@/lib/booking-notifications";
import { hasExceededBookingNotesLimit, BOOKING_NOTES_WORD_LIMIT } from "@/lib/booking-notes";
import { type BookingRecord } from "@/lib/bookings";
import { hasTimeSlotConflict, normalizeBookingTimes } from "@/lib/booking-time";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type BookingPayload = {
  fullName?: string;
  email?: string;
  phone?: string;
  sport?: string;
  address?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as BookingPayload;

  if (
    !payload.fullName ||
    !payload.email ||
    !payload.phone ||
    !payload.sport ||
    !payload.address ||
    !payload.eventDate ||
    !payload.startTime ||
    !payload.endTime
  ) {
    return NextResponse.json(
      {
        message: "Please complete all required booking details."
      },
      { status: 400 }
    );
  }

  if (payload.notes && hasExceededBookingNotesLimit(payload.notes)) {
    return NextResponse.json(
      {
        message: `Notes must be ${BOOKING_NOTES_WORD_LIMIT} words or fewer.`
      },
      { status: 400 }
    );
  }

  let normalizedStartTime = "";
  let normalizedEndTime = "";
  let timeSlot = "";

  try {
    const normalizedTimes = normalizeBookingTimes(payload.startTime, payload.endTime);
    normalizedStartTime = normalizedTimes.normalizedStartTime;
    normalizedEndTime = normalizedTimes.normalizedEndTime;
    timeSlot = normalizedTimes.timeSlot;
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Please enter valid booking times."
      },
      { status: 400 }
    );
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: blockedDate, error: blockedDateError } = await supabase
      .from("unavailable_dates")
      .select("start_time, end_time")
      .eq("blocked_date", payload.eventDate)
      .order("created_at", { ascending: true });

    if (blockedDateError) {
      throw blockedDateError;
    }

    const manualBlockedSlots = (blockedDate ?? [])
      .filter((entry) => entry.start_time && entry.end_time)
      .map((entry) => `${entry.start_time} - ${entry.end_time}`);
    const hasFullDayBlock = (blockedDate ?? []).some(
      (entry) => entry.start_time === null || entry.end_time === null
    );

    if (hasFullDayBlock) {
      return NextResponse.json(
        {
          message: "That date is unavailable. Please choose another date."
        },
        { status: 400 }
      );
    }

    const { data: existingBookingsOnDate, error: existingBookingOnDateError } = await supabase
      .from("bookings")
      .select("time_slot")
      .eq("event_date", payload.eventDate)
      .neq("status", "cancelled");

    if (existingBookingOnDateError) {
      throw existingBookingOnDateError;
    }

    const existingTimeSlots = (existingBookingsOnDate ?? []).map((booking) => booking.time_slot);

    if (hasTimeSlotConflict(normalizedStartTime, normalizedEndTime, manualBlockedSlots)) {
      return NextResponse.json(
        {
          message: "That time is unavailable on this date. Please choose a different time."
        },
        { status: 400 }
      );
    }

    if (hasTimeSlotConflict(normalizedStartTime, normalizedEndTime, existingTimeSlots)) {
      return NextResponse.json(
        {
          message: "That time is already booked on this date. Please choose a different time."
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        full_name: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        sport: payload.sport,
        address: payload.address.trim(),
        event_date: payload.eventDate,
        time_slot: timeSlot,
        players: 1,
        notes: payload.notes?.trim() || null,
        status: "new"
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    try {
      await sendNewBookingNotification(data as BookingRecord);
    } catch (notificationError) {
      console.error("New booking notification failed:", notificationError);
    }

    try {
      await sendBookingConfirmationNotification(data as BookingRecord);
    } catch (notificationError) {
      console.error("Booking confirmation notification failed:", notificationError);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null
          ? JSON.stringify(error)
          : "Could not save your booking right now.";

    console.error("Booking save failed:", error);

    return NextResponse.json(
      {
        message: errorMessage
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: `Thanks ${payload.fullName}, your ${payload.sport} booking request for ${payload.eventDate} from ${normalizedStartTime} to ${normalizedEndTime} has been saved.`
  });
}
