import { NextResponse } from "next/server";

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

  if (!payload.fullName || !payload.email || !payload.eventDate) {
    return NextResponse.json(
      {
        message: "Please fill in your name, email, and event date."
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    message: `Thanks ${payload.fullName}, your ${payload.sport ?? "sports"} booking request for ${payload.eventDate} at ${payload.timeSlot ?? "your selected time"} has been received.`
  });
}
