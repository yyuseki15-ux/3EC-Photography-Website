import { redirect } from "next/navigation";
import { clearAdminSession, hasValidAdminSession } from "@/lib/admin-auth";
import { type BookingRecord } from "@/lib/bookings";
import { sports } from "@/lib/sports";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { deleteBooking } from "./actions";
import { DeleteButton } from "./delete-button";

type AdminBookingsPageProps = {
  searchParams?: Promise<{
    q?: string;
    sport?: string;
    eventDate?: string;
  }>;
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

function filterBookings(
  bookings: BookingRecord[],
  {
    query,
    sport,
    eventDate
  }: {
    query: string;
    sport: string;
    eventDate: string;
  }
) {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedSport = sport.trim().toLowerCase();
  const normalizedEventDate = eventDate.trim();

  return bookings.filter((booking) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [
        booking.full_name,
        booking.email,
        booking.phone,
        booking.notes ?? "",
        booking.sport,
        booking.time_slot
      ].some((value) => value.toLowerCase().includes(normalizedQuery));

    const matchesSport =
      normalizedSport.length === 0 || booking.sport.toLowerCase() === normalizedSport;

    const matchesEventDate =
      normalizedEventDate.length === 0 || booking.event_date === normalizedEventDate;

    return matchesQuery && matchesSport && matchesEventDate;
  });
}

export default async function AdminBookingsPage({
  searchParams
}: AdminBookingsPageProps) {
  const isAuthenticated = await hasValidAdminSession();

  if (!isAuthenticated) {
    redirect("/admin/login");
  }

  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q?.trim() ?? "";
  const selectedSport = resolvedSearchParams?.sport?.trim() ?? "";
  const selectedEventDate = resolvedSearchParams?.eventDate?.trim() ?? "";

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
  const filteredBookings = filterBookings(bookings, {
    query,
    sport: selectedSport,
    eventDate: selectedEventDate
  });
  const hasActiveFilters =
    query.length > 0 || selectedSport.length > 0 || selectedEventDate.length > 0;

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
            <strong>{filteredBookings.length}</strong>
            <span>{hasActiveFilters ? `Filtered of ${bookings.length}` : "Total bookings"}</span>
          </div>

          <form action={logout}>
            <button className="secondary-button" type="submit">
              Log out
            </button>
          </form>
        </div>
      </section>

      <section className="admin-filters-card">
        <form className="admin-filters-form" action="/admin/bookings" method="get">
          <label className="admin-filter-field admin-filter-search">
            Search bookings
            <input
              defaultValue={query}
              name="q"
              placeholder="Search name, email, phone, notes, or time"
              type="search"
            />
          </label>

          <label className="admin-filter-field">
            Sport
            <select defaultValue={selectedSport} name="sport">
              <option value="">All sports</option>
              {sports.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-filter-field">
            Event date
            <input defaultValue={selectedEventDate} name="eventDate" type="date" />
          </label>

          <div className="admin-filter-actions">
            <button type="submit">Apply filters</button>
            {hasActiveFilters ? (
              <a className="secondary-button admin-clear-button" href="/admin/bookings">
                Clear
              </a>
            ) : null}
          </div>
        </form>
      </section>

      <section className="admin-table-card">
        {bookings.length === 0 ? (
          <div className="admin-empty-state">
            <h2>No bookings yet</h2>
            <p>New booking requests will appear here as soon as customers submit the form.</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="admin-empty-state">
            <h2>No bookings match these filters</h2>
            <p>Try clearing one or more filters to see more booking requests.</p>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
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
                    <td>
                      <div className="admin-row-actions">
                        <a className="secondary-button admin-action-link" href={`/admin/bookings/${booking.id}/edit`}>
                          Edit
                        </a>
                        <form action={deleteBooking}>
                          <input type="hidden" name="bookingId" value={booking.id} />
                          <DeleteButton />
                        </form>
                      </div>
                    </td>
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
