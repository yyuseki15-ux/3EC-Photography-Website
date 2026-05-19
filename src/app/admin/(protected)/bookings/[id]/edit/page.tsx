import { notFound, redirect } from "next/navigation";
import { hasValidAdminSession } from "@/lib/admin-auth";
import { splitTimeSlot } from "@/lib/booking-time";
import { type BookingRecord } from "@/lib/bookings";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { EditBookingForm } from "./edit-form";

type EditBookingPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditBookingPage({ params }: EditBookingPageProps) {
  const isAuthenticated = await hasValidAdminSession();

  if (!isAuthenticated) {
    redirect("/admin/login");
  }

  const resolvedParams = await params;
  const bookingId = Number.parseInt(resolvedParams.id, 10);

  if (Number.isNaN(bookingId)) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("bookings").select("*").eq("id", bookingId).single();

  if (error) {
    notFound();
  }

  const booking = data as BookingRecord;
  const timeValues = splitTimeSlot(booking.time_slot);

  return (
    <main className="admin-shell">
      <section className="admin-header-card">
        <div>
          <p className="admin-eyebrow">3EC Sports Photography</p>
          <h1>Edit Booking</h1>
          <p className="admin-subtitle">
            Update the booking details below, then save the changes back to the dashboard.
          </p>
        </div>
      </section>

      <section className="admin-table-card">
        <EditBookingForm booking={booking} timeValues={timeValues} />
      </section>
    </main>
  );
}
