import { redirect } from "next/navigation";
import { clearAdminSession, hasValidAdminSession } from "@/lib/admin-auth";
import { bookingStatuses, formatBookingStatus, type BookingStatus } from "@/lib/booking-status";
import { type BookingRecord } from "@/lib/bookings";
import { createSignedPaymentProofUrl } from "@/lib/payment-proof";
import { formatPaymentStatus, paymentStatuses } from "@/lib/payment-status";
import { formatBookingReference } from "@/lib/booking-reference";
import { sports } from "@/lib/sports";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { suggestedTimes } from "@/lib/time-options";
import { formatTimeRange, formatUnavailableDate, type UnavailableDateRecord } from "@/lib/unavailable-dates";
import { addUnavailableDate, deleteBooking, removeUnavailableDate, updateUnavailableDate } from "./actions";
import { DeleteButton } from "./delete-button";
import { PaymentStatusForm } from "./payment-status-form";
import { StatusForm } from "./status-form";

type AdminBookingsPageProps = {
  searchParams?: Promise<{
    q?: string;
    sport?: string;
    eventDate?: string;
    status?: string;
    payment?: string;
    tab?: string;
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

function filterBookings<T extends BookingRecord>(
  bookings: T[],
  {
    query,
    sport,
    eventDate,
    status,
    payment
  }: {
    query: string;
    sport: string;
    eventDate: string;
    status: string;
    payment: string;
  }
) {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedSport = sport.trim().toLowerCase();
  const normalizedEventDate = eventDate.trim();
  const normalizedStatus = status.trim().toLowerCase();
  const normalizedPayment = payment.trim().toLowerCase();

  return bookings.filter((booking) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [
        booking.full_name,
        booking.email,
        booking.phone,
        booking.address ?? "",
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
    const matchesPayment =
      normalizedPayment.length === 0
        ? true
        : normalizedPayment === "proof_uploaded"
          ? Boolean(booking.proof_of_payment_path) && booking.payment_status !== "paid"
          : booking.payment_status.toLowerCase() === normalizedPayment;

    return matchesQuery && matchesSport && matchesEventDate && matchesStatus && matchesPayment;
  });
}

function isValidAdminTab(value: string) {
  return value === "dashboard" || value === "availability" || value === "requests";
}

function getBookingWorkflowSummary(booking: BookingRecord) {
  if (booking.status === "completed") {
    return "Completed";
  }

  if (booking.status === "confirmed") {
    return "Confirmed";
  }

  if (booking.payment_status === "paid") {
    return "Deposit verified";
  }

  if (booking.proof_of_payment_path) {
    return "Proof uploaded";
  }

  return "Awaiting payment";
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
  const selectedPayment = resolvedSearchParams?.payment?.trim() ?? "";
  const selectedTab = isValidAdminTab(resolvedSearchParams?.tab?.trim() ?? "")
    ? (resolvedSearchParams?.tab?.trim() as "dashboard" | "availability" | "requests")
    : "dashboard";

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
  const bookingsWithProofUrls = await Promise.all(
    bookings.map(async (booking) => ({
      ...booking,
      proofUrl: booking.proof_of_payment_path
        ? await createSignedPaymentProofUrl(booking.proof_of_payment_path)
        : null
    }))
  );
  const unavailableDates = (unavailableDatesData ?? []) as UnavailableDateRecord[];
  const filteredBookings = filterBookings(bookingsWithProofUrls, {
    query,
    sport: selectedSport,
    eventDate: selectedEventDate,
    status: selectedStatus,
    payment: selectedPayment
  });
  const hasActiveFilters =
    query.length > 0 ||
    selectedSport.length > 0 ||
    selectedEventDate.length > 0 ||
    selectedStatus.length > 0 ||
    selectedPayment.length > 0;

  return (
    <main className="admin-shell">
      <section className="admin-header-card">
        <div>
          <p className="admin-eyebrow">3EC Sports Photography</p>
          <h1>Admin Panel</h1>
          <p className="admin-subtitle">
            Choose a tab to open bookings, availability, or dashboard details.
          </p>
        </div>

        <div className="admin-header-actions">
          <form action={logout}>
            <button className="secondary-button" type="submit">
              Log out
            </button>
          </form>
        </div>
      </section>

      <nav className="admin-tabs-card" aria-label="Admin sections">
        <a className={`admin-tab-link ${selectedTab === "dashboard" ? "active" : ""}`} href="/admin/bookings?tab=dashboard">
          Bookings Dashboard
        </a>
        <a className={`admin-tab-link ${selectedTab === "availability" ? "active" : ""}`} href="/admin/bookings?tab=availability">
          Availability Control
        </a>
        <a className={`admin-tab-link ${selectedTab === "requests" ? "active" : ""}`} href="/admin/bookings?tab=requests">
          Booking Requests
        </a>
      </nav>

      {selectedTab === "dashboard" ? (
        <section className="admin-filters-card" id="dashboard-overview">
          <div className="admin-card-heading">
            <div>
              <p className="admin-eyebrow">Bookings Dashboard</p>
              <h2>Overview</h2>
              <p className="admin-subtitle">
                Quick totals for your current bookings and filters.
              </p>
            </div>
          </div>

          <div className="admin-dashboard-stats">
            <div className="admin-stat-card">
              <strong>{bookings.length}</strong>
              <span>Total bookings</span>
            </div>
            <div className="admin-stat-card">
              <strong>{filteredBookings.length}</strong>
              <span>{hasActiveFilters ? "Filtered results" : "Visible bookings"}</span>
            </div>
            <div className="admin-stat-card">
              <strong>{unavailableDates.length}</strong>
              <span>Unavailable date blocks</span>
            </div>
            <div className="admin-stat-card">
              <strong>{bookings.filter((booking) => booking.payment_status === "paid").length}</strong>
              <span>Paid bookings</span>
            </div>
            <div className="admin-stat-card">
              <strong>{bookings.filter((booking) => Boolean(booking.proof_of_payment_path)).length}</strong>
              <span>Proof uploads received</span>
            </div>
          </div>
        </section>
      ) : null}

      {selectedTab === "requests" ? (
      <section className="admin-filters-card" id="booking-requests">
        <form className="admin-filters-form admin-filters-form-wide" action="/admin/bookings" method="get">
          <input name="tab" type="hidden" value="requests" />
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

          <label className="admin-filter-field">
            Payment
            <select defaultValue={selectedPayment} name="payment">
              <option value="">All payment states</option>
              <option value="proof_uploaded">Proof uploaded</option>
              {paymentStatuses.map((paymentStatus) => (
                <option key={paymentStatus} value={paymentStatus}>
                  {formatPaymentStatus(paymentStatus)}
                </option>
              ))}
            </select>
          </label>

          <div className="admin-filter-actions">
            <button type="submit">Apply filters</button>
            {hasActiveFilters ? (
              <a className="secondary-button admin-clear-button" href="/admin/bookings?tab=requests">
                Clear
              </a>
            ) : null}
          </div>
        </form>
      </section>
      ) : null}

      {selectedTab === "availability" ? (
      <section className="admin-filters-card" id="availability-control">
        <div className="admin-card-heading">
          <div>
            <p className="admin-eyebrow">Availability Control</p>
            <h2>Block Unavailable Dates</h2>
            <p className="admin-subtitle">
              Block a whole date or only specific hours on a date.
            </p>
          </div>
        </div>

        <form className="admin-unavailable-form" action={addUnavailableDate}>
          <label className="admin-filter-field">
            Date to block
            <input name="blockedDate" required type="date" />
          </label>

          <label className="admin-filter-field">
            Start time
            <select defaultValue="" name="startTime">
              <option value="">Full day</option>
              {suggestedTimes.map((time) => (
                <option key={`new-start-${time}`} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-filter-field">
            End time
            <select defaultValue="" name="endTime">
              <option value="">Full day</option>
              {suggestedTimes.map((time) => (
                <option key={`new-end-${time}`} value={time}>
                  {time}
                </option>
              ))}
            </select>
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
                <form className="admin-unavailable-edit-form" action={updateUnavailableDate}>
                  <input type="hidden" name="unavailableDateId" value={entry.id} />

                  <div className="admin-unavailable-summary">
                    <strong>{formatUnavailableDate(entry.blocked_date)}</strong>
                    <span>{formatTimeRange(entry.start_time, entry.end_time)}</span>
                  </div>

                  <div className="admin-unavailable-edit-grid">
                    <label className="admin-filter-field">
                      Blocked date
                      <input defaultValue={entry.blocked_date} name="blockedDate" required type="date" />
                    </label>

                    <label className="admin-filter-field">
                      Start time
                      <select defaultValue={entry.start_time ?? ""} name="startTime">
                        <option value="">Full day</option>
                        {suggestedTimes.map((time) => (
                          <option key={`${entry.id}-start-${time}`} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="admin-filter-field">
                      End time
                      <select defaultValue={entry.end_time ?? ""} name="endTime">
                        <option value="">Full day</option>
                        {suggestedTimes.map((time) => (
                          <option key={`${entry.id}-end-${time}`} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="admin-filter-field admin-filter-search">
                      Reason
                      <input
                        defaultValue={entry.reason ?? ""}
                        name="reason"
                        placeholder="Optional note like fully booked or private event"
                        type="text"
                      />
                    </label>
                  </div>

                  <div className="admin-unavailable-actions">
                    <button type="submit">Save changes</button>
                    <button
                      className="secondary-button admin-action-link"
                      formAction={removeUnavailableDate}
                      type="submit"
                    >
                      Remove
                    </button>
                  </div>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="admin-empty-inline">No unavailable dates are blocked yet.</p>
        )}
      </section>
      ) : null}

      {selectedTab === "requests" ? (
      <section className="admin-table-card" id="booking-records">
        <div className="admin-card-heading">
          <div>
            <p className="admin-eyebrow">Booking Requests</p>
            <h2>Booking Requests</h2>
            <p className="admin-subtitle">
              Review every booking request and manage updates from one table.
            </p>
          </div>
        </div>
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
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Reference</th>
                    <th>Sport</th>
                    <th>Address</th>
                    <th>Event date</th>
                    <th>Time</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Proof</th>
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
                      <td>
                        <strong>{formatBookingReference(booking.id)}</strong>
                      </td>
                      <td>{booking.sport}</td>
                      <td>{booking.address || "No address"}</td>
                      <td>{formatDate(booking.event_date)}</td>
                      <td>{booking.time_slot}</td>
                      <td>
                        <div className="customer-cell">
                          <strong>PHP {booking.payment_amount_php}</strong>
                          <span>50% deposit</span>
                          <span>Full total: PHP {booking.payment_amount_php * 2}</span>
                        </div>
                      </td>
                      <td>
                        <StatusForm bookingId={booking.id} status={booking.status} />
                      </td>
                      <td>
                        <PaymentStatusForm bookingId={booking.id} paymentStatus={booking.payment_status} />
                        <span className="admin-inline-caption">
                          {getBookingWorkflowSummary(booking)}
                        </span>
                      </td>
                      <td>
                        {booking.proofUrl ? (
                          <a
                            className="secondary-button admin-action-link"
                            href={booking.proofUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            View proof
                          </a>
                        ) : (
                          <span className="admin-empty-inline">No proof yet</span>
                        )}
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

            <div className="admin-booking-cards">
              {filteredBookings.map((booking) => (
                <article className="admin-booking-card" key={`card-${booking.id}`}>
                  <div className="admin-booking-card-header">
                    <div>
                      <p className="admin-eyebrow">Booking reference</p>
                      <h3>{formatBookingReference(booking.id)}</h3>
                      <p className="admin-subtitle">{booking.full_name}</p>
                    </div>
                    <span className="admin-mobile-progress">{getBookingWorkflowSummary(booking)}</span>
                  </div>

                  <div className="admin-booking-card-grid">
                    <div>
                      <strong>Contact</strong>
                      <span>{booking.email}</span>
                      <span>{booking.phone}</span>
                    </div>
                    <div>
                      <strong>Sport</strong>
                      <span>{booking.sport}</span>
                    </div>
                    <div>
                      <strong>Address</strong>
                      <span>{booking.address || "No address"}</span>
                    </div>
                    <div>
                      <strong>Event date</strong>
                      <span>{formatDate(booking.event_date)}</span>
                    </div>
                    <div>
                      <strong>Time</strong>
                      <span>{booking.time_slot}</span>
                    </div>
                    <div>
                      <strong>Amount</strong>
                      <span>Deposit: PHP {booking.payment_amount_php}</span>
                      <span>Full total: PHP {booking.payment_amount_php * 2}</span>
                    </div>
                    <div>
                      <strong>Notes</strong>
                      <span>{booking.notes || "No notes"}</span>
                    </div>
                    <div>
                      <strong>Submitted</strong>
                      <span>{formatDateTime(booking.created_at)}</span>
                    </div>
                  </div>

                  <div className="admin-booking-card-section">
                    <strong>Booking status</strong>
                    <StatusForm bookingId={booking.id} status={booking.status} />
                  </div>

                  <div className="admin-booking-card-section">
                    <strong>Payment status</strong>
                    <PaymentStatusForm bookingId={booking.id} paymentStatus={booking.payment_status} />
                  </div>

                  <div className="admin-booking-card-section">
                    <strong>Proof of payment</strong>
                    {booking.proofUrl ? (
                      <a
                        className="secondary-button admin-action-link"
                        href={booking.proofUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        View proof
                      </a>
                    ) : (
                      <span className="admin-empty-inline">No proof yet</span>
                    )}
                  </div>

                  <div className="admin-row-actions">
                    <a className="secondary-button admin-action-link" href={`/admin/bookings/${booking.id}/edit`}>
                      Edit
                    </a>
                    <form action={deleteBooking}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <DeleteButton />
                    </form>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
      ) : null}
    </main>
  );
}
