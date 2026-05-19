export type UnavailableDateRecord = {
  id: number;
  blocked_date: string;
  reason: string | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
};

export type PublicUnavailableDate = {
  blocked_date: string;
  reason: string | null;
  source: "manual" | "booking" | "mixed";
  booked_time_slots: string[];
  blocked_time_slots: string[];
  fully_blocked: boolean;
};

export function formatUnavailableDate(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function formatTimeRange(startTime: string | null, endTime: string | null) {
  if (!startTime || !endTime) {
    return "Full day";
  }

  return `${startTime} - ${endTime}`;
}
