import { NextResponse } from "next/server";
import { sendNewBookingNotification } from "@/lib/booking-notifications";
import { hasExceededBookingNotesLimit, BOOKING_NOTES_WORD_LIMIT } from "@/lib/booking-notes";
import { type BookingRecord } from "@/lib/bookings";
import { normalizeBookingTimes } from "@/lib/booking-time";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type BookingPayload = {
  fullName?: string;
  email?: string;
  phone?: string;
  sport?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  players?: string;
  notes?: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as BookingPayload;

  if (
    !payload.fullName ||
    !payload.email ||
    !payload.phone ||
    !payload.sport ||
    !payload.eventDate ||
    !payload.startTime ||
    !payload.endTime ||
    !payload.players
  ) {
    return NextResponse.json(
      {
        message: "Please complete all required booking details."
      },
      { status: 400 }
    );
  }

  const playerCount = Number.parseInt(payload.players, 10);

  if (Number.isNaN(playerCount) || playerCount < 1) {
    return NextResponse.json(
      {
        message: "Players must be a valid number."
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

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        full_name: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        sport: payload.sport,
        event_date: payload.eventDate,
        time_slot: timeSlot,
        players: playerCount,
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
