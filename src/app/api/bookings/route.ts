import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type BookingPayload = {
  fullName?: string;
  email?: string;
  phone?: string;
  sport?: string;
  eventDate?: string;
  timeSlot?: string;
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
    !payload.timeSlot ||
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

  try {
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase.from("bookings").insert({
      full_name: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      sport: payload.sport,
      event_date: payload.eventDate,
      time_slot: payload.timeSlot,
      players: playerCount,
      notes: payload.notes?.trim() || null
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Could not save your booking right now."
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: `Thanks ${payload.fullName}, your ${payload.sport} booking request for ${payload.eventDate} at ${payload.timeSlot} has been saved.`
  });
}
