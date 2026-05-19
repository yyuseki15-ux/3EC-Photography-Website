export type BookingRecord = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  sport: string;
  event_date: string;
  time_slot: string;
  players: number;
  notes: string | null;
  created_at: string;
};
