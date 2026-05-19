import { NextResponse } from "next/server";
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

const timePattern = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;

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

  if (payload.startTime === payload.endTime) {
    return NextResponse.json(
      {
        message: "Start time and end time must be different."
      },
      { status: 400 }
    );
  }

  if (!timePattern.test(payload.startTime) || !timePattern.test(payload.endTime)) {
    return NextResponse.json(
      {
        message: "Please enter start and end times like 08:00 AM or 01:30 PM."
      },
      { status: 400 }
    );
  }

  const normalizedStartTime = payload.startTime.toUpperCase().replace(/\s+/g, " ").trim();
  const normalizedEndTime = payload.endTime.toUpperCase().replace(/\s+/g, " ").trim();
  const timeSlot = `${normalizedStartTime} - ${normalizedEndTime}`;

  try {
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase.from("bookings").insert({
      full_name: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      sport: payload.sport,
      event_date: payload.eventDate,
      time_slot: timeSlot,
      players: playerCount,
      notes: payload.notes?.trim() || null
    });

    if (error) {
      throw error;
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
