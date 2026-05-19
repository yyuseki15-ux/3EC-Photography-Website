export type UnavailableDateRecord = {
  id: number;
  blocked_date: string;
  reason: string | null;
  created_at: string;
};

export function formatUnavailableDate(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}
