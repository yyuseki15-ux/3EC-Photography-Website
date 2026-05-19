import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const today = new Date().toISOString().split("T")[0];
    const { data: manualDates, error: manualDatesError } = await supabase
      .from("unavailable_dates")
      .select("blocked_date, reason")
      .gte("blocked_date", today)
      .order("blocked_date", { ascending: true });

    if (manualDatesError) {
      throw manualDatesError;
    }

    const { data: bookedDates, error: bookedDatesError } = await supabase
      .from("bookings")
      .select("event_date, time_slot, status")
      .gte("event_date", today)
      .neq("status", "cancelled")
      .order("event_date", { ascending: true });

    if (bookedDatesError) {
      throw bookedDatesError;
    }

    const dateMap = new Map<
      string,
      {
        blocked_date: string;
        reason: string | null;
        source: "manual" | "booking" | "mixed";
        time_slots: string[];
      }
    >();

    for (const entry of manualDates ?? []) {
      dateMap.set(entry.blocked_date, {
        blocked_date: entry.blocked_date,
        reason: entry.reason,
        source: "manual",
        time_slots: []
      });
    }

    for (const entry of bookedDates ?? []) {
      const existingEntry = dateMap.get(entry.event_date);

      if (existingEntry) {
        existingEntry.source = existingEntry.source === "manual" ? "mixed" : existingEntry.source;
        if (!existingEntry.time_slots.includes(entry.time_slot)) {
          existingEntry.time_slots.push(entry.time_slot);
        }

        continue;
      }

      dateMap.set(entry.event_date, {
        blocked_date: entry.event_date,
        reason: "Already booked",
        source: "booking",
        time_slots: [entry.time_slot]
      });
    }

    return NextResponse.json({
      dates: Array.from(dateMap.values()).sort((left, right) =>
        left.blocked_date.localeCompare(right.blocked_date)
      )
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
