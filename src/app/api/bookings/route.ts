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

const timeSlots = [
  "08:00 AM",
  "10:00 AM",
  "01:00 PM",
  "04:00 PM",
  "07:00 PM"
];

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

  const startTimeIndex = timeSlots.indexOf(payload.startTime);
  const endTimeIndex = timeSlots.indexOf(payload.endTime);

  if (startTimeIndex === -1 || endTimeIndex === -1 || endTimeIndex <= startTimeIndex) {
    return NextResponse.json(
      {
        message: "End time must be later than start time."
      },
      { status: 400 }
    );
  }

  const timeSlot = `${payload.startTime} - ${payload.endTime}`;

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
    message: `Thanks ${payload.fullName}, your ${payload.sport} booking request for ${payload.eventDate} from ${payload.startTime} to ${payload.endTime} has been saved.`
  });
}
