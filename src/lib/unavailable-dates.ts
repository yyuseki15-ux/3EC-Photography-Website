export type UnavailableDateRecord = {
  id: number;
  blocked_date: string;
  reason: string | null;
  created_at: string;
};

export type PublicUnavailableDate = {
  blocked_date: string;
  reason: string | null;
  source: "manual" | "booking";
  time_slots: string[];
};

export function formatUnavailableDate(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}
