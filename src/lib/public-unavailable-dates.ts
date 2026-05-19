import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { type PublicUnavailableDate } from "@/lib/unavailable-dates";

export async function getPublicUnavailableDates(): Promise<PublicUnavailableDate[]> {
  const supabase = createSupabaseAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const { data: manualDates, error: manualDatesError } = await supabase
    .from("unavailable_dates")
    .select("blocked_date, reason, start_time, end_time")
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

  const dateMap = new Map<string, PublicUnavailableDate>();

  for (const entry of manualDates ?? []) {
    const existingEntry = dateMap.get(entry.blocked_date);
    const manualTimeSlot =
      entry.start_time && entry.end_time ? `${entry.start_time} - ${entry.end_time}` : null;

    if (existingEntry) {
      existingEntry.source = existingEntry.source === "booking" ? "mixed" : existingEntry.source;
      existingEntry.reason = existingEntry.reason ?? entry.reason;
      existingEntry.fully_blocked = existingEntry.fully_blocked || !manualTimeSlot;

      if (manualTimeSlot && !existingEntry.blocked_time_slots.includes(manualTimeSlot)) {
        existingEntry.blocked_time_slots.push(manualTimeSlot);
      }

      continue;
    }

    dateMap.set(entry.blocked_date, {
      blocked_date: entry.blocked_date,
      reason: entry.reason,
      source: "manual",
      booked_time_slots: [],
      blocked_time_slots: manualTimeSlot ? [manualTimeSlot] : [],
      fully_blocked: !manualTimeSlot
    });
  }

  for (const entry of bookedDates ?? []) {
    const existingEntry = dateMap.get(entry.event_date);

    if (existingEntry) {
      existingEntry.source = existingEntry.source === "manual" ? "mixed" : existingEntry.source;
      if (!existingEntry.booked_time_slots.includes(entry.time_slot)) {
        existingEntry.booked_time_slots.push(entry.time_slot);
      }

      continue;
    }

    dateMap.set(entry.event_date, {
      blocked_date: entry.event_date,
      reason: "Already booked",
      source: "booking",
      booked_time_slots: [entry.time_slot],
      blocked_time_slots: [],
      fully_blocked: false
    });
  }

  return Array.from(dateMap.values()).sort((left, right) =>
    left.blocked_date.localeCompare(right.blocked_date)
  );
}
