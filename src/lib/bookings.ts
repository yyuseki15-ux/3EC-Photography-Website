import { type BookingStatus } from "@/lib/booking-status";

export type BookingRecord = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  sport: string;
  address: string | null;
  event_date: string;
  time_slot: string;
  notes: string | null;
  status: BookingStatus;
  created_at: string;
};
