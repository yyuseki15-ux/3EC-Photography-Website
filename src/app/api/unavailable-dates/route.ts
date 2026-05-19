import { NextResponse } from "next/server";
import { getPublicUnavailableDates } from "@/lib/public-unavailable-dates";

export async function GET() {
  try {
    const dates = await getPublicUnavailableDates();
    return NextResponse.json({
      dates
    });
  } catch (error) {
    console.error("Unavailable dates fetch failed:", error);

    return NextResponse.json(
      {
        message: "Could not load unavailable dates right now."
      },
      { status: 500 }
    );
  }
}
