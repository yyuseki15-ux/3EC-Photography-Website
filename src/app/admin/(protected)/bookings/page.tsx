import { redirect } from "next/navigation";
import { clearAdminSession, hasValidAdminSession } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type BookingRecord = {
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

async function logout() {
  "use server";

  await clearAdminSession();
  redirect("/admin/login");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export default async function AdminBookingsPage() {
  const isAuthenticated = await hasValidAdminSession();

  if (!isAuthenticated) {
    redirect("/admin/login");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("event_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const bookings = (data ?? []) as BookingRecord[];

  return (
    <main className="admin-shell">
      <section className="admin-header-card">
        <div>
          <p className="admin-eyebrow">3EC Sports Photography</p>
          <h1>Bookings Dashboard</h1>
          <p className="admin-subtitle">
            View all booking requests in one place, ordered by upcoming event date.
          </p>
        </div>

        <div className="admin-header-actions">
          <div className="admin-stat-card">
            <strong>{bookings.length}</strong>
            <span>Total bookings</span>
          </div>

          <form action={logout}>
            <button className="secondary-button" type="submit">
              Log out
            </button>
          </form>
        </div>
      </section>

      <section className="admin-table-card">
        {bookings.length === 0 ? (
          <div className="admin-empty-state">
            <h2>No bookings yet</h2>
            <p>New booking requests will appear here as soon as customers submit the form.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Sport</th>
                  <th>Event date</th>
                  <th>Time</th>
                  <th>Players</th>
                  <th>Notes</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <div className="customer-cell">
                        <strong>{booking.full_name}</strong>
                        <span>{booking.email}</span>
                        <span>{booking.phone}</span>
                      </div>
                    </td>
                    <td>{booking.sport}</td>
                    <td>{formatDate(booking.event_date)}</td>
                    <td>{booking.time_slot}</td>
                    <td>{booking.players}</td>
                    <td>{booking.notes || "No notes"}</td>
                    <td>{formatDateTime(booking.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
