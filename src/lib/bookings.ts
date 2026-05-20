import { type BookingStatus } from "@/lib/booking-status";
import { type PaymentStatus } from "@/lib/payment-status";

export type BookingRecord = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  sport: string;
  address: string | null;
  event_date: string;
  time_slot: string;
  payment_amount_php: number;
  notes: string | null;
  status: BookingStatus;
  payment_status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
};
