import { redirect } from "next/navigation";
import { clearAdminSession, hasValidAdminSession } from "@/lib/admin-auth";
import { bookingStatuses, formatBookingStatus, type BookingStatus } from "@/lib/booking-status";
import { type BookingRecord } from "@/lib/bookings";
import { sports } from "@/lib/sports";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatUnavailableDate, type UnavailableDateRecord } from "@/lib/unavailable-dates";
import { addUnavailableDate, deleteBooking, removeUnavailableDate } from "./actions";
import { DeleteButton } from "./delete-button";
import { StatusForm } from "./status-form";

type AdminBookingsPageProps = {
  searchParams?: Promise<{
    q?: string;
    sport?: string;
    eventDate?: string;
    status?: string;
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
    eventDate,
    status
  }: {
    query: string;
    sport: string;
    eventDate: string;
    status: string;
  }
) {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedSport = sport.trim().toLowerCase();
  const normalizedEventDate = eventDate.trim();
  const normalizedStatus = status.trim().toLowerCase();

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

    const matchesStatus =
      normalizedStatus.length === 0 || booking.status.toLowerCase() === normalizedStatus;

    return matchesQuery && matchesSport && matchesEventDate && matchesStatus;
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
  const selectedStatus = resolvedSearchParams?.status?.trim() ?? "";

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("event_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const { data: unavailableDatesData, error: unavailableDatesError } = await supabase
    .from("unavailable_dates")
    .select("*")
    .order("blocked_date", { ascending: true });

  if (unavailableDatesError) {
    throw new Error(unavailableDatesError.message);
  }

  const bookings = (data ?? []) as BookingRecord[];
  const unavailableDates = (unavailableDatesData ?? []) as UnavailableDateRecord[];
  const filteredBookings = filterBookings(bookings, {
    query,
    sport: selectedSport,
    eventDate: selectedEventDate,
    status: selectedStatus
  });
  const hasActiveFilters =
    query.length > 0 ||
    selectedSport.length > 0 ||
    selectedEventDate.length > 0 ||
    selectedStatus.length > 0;

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
        <form className="admin-filters-form admin-filters-form-wide" action="/admin/bookings" method="get">
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

          <label className="admin-filter-field">
            Status
            <select defaultValue={selectedStatus} name="status">
              <option value="">All statuses</option>
              {bookingStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatBookingStatus(status)}
                </option>
              ))}
            </select>
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

      <section className="admin-filters-card">
        <div className="admin-card-heading">
          <div>
            <p className="admin-eyebrow">Availability Control</p>
            <h2>Block Unavailable Dates</h2>
            <p className="admin-subtitle">
              Customers will not be able to submit bookings for blocked dates.
            </p>
          </div>
        </div>

        <form className="admin-unavailable-form" action={addUnavailableDate}>
          <label className="admin-filter-field">
            Date to block
            <input name="blockedDate" required type="date" />
          </label>

          <label className="admin-filter-field admin-filter-search">
            Reason
            <input name="reason" placeholder="Optional note like fully booked or private event" type="text" />
          </label>

          <div className="admin-filter-actions">
            <button type="submit">Block date</button>
          </div>
        </form>

        {unavailableDates.length > 0 ? (
          <div className="admin-unavailable-list">
            {unavailableDates.map((entry) => (
              <div className="admin-unavailable-item" key={entry.id}>
                <div>
                  <strong>{formatUnavailableDate(entry.blocked_date)}</strong>
                  <span>{entry.reason || "No reason added"}</span>
                </div>
                <form action={removeUnavailableDate}>
                  <input type="hidden" name="unavailableDateId" value={entry.id} />
                  <button className="secondary-button admin-action-link" type="submit">
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="admin-empty-inline">No unavailable dates are blocked yet.</p>
        )}
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
                  <th>Status</th>
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
                    <td>
                      <StatusForm bookingId={booking.id} status={booking.status} />
                    </td>
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
