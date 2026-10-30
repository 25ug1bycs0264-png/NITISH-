import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  Download,
  Filter,
  MapPin,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { useRef } from "react";
import type { FormEvent, ReactNode } from "react";

type Role = "admin" | "organizer" | "participant";
type Category = "Workshop" | "Seminar" | "Cultural" | "Sports" | "Conference";
type EventPage = "discover" | "dashboard" | "manage";

type User = { id: string; name: string; email: string; role: Role; createdAt: string };
type EventItem = {
  id: string;
  title: string;
  description: string;
  category: Category;
  venue: string;
  date: string;
  deadline: string;
  time: string;
  capacity: number;
  organizerId: string | null;
  organizerName: string;
  status: "published" | "cancelled";
  registrationCount: number;
  remainingSpots: number;
  registration: { id: string; registrationId: string; registeredAt: string } | null;
};
type Registration = {
  id: string;
  registrationId: string;
  registeredAt: string;
  status: "registered" | "cancelled";
  attendance: "present" | "absent" | null;
  participant: { id: string; name: string; email: string } | null;
  event: { id: string; title: string; date: string; time: string; venue: string } | null;
};
type Dashboard = {
  stats: { events: number; registrations: number; upcoming: number };
  events: EventItem[];
  registrations: Registration[];
};
type Toast = { message: string; tone: "success" | "error" };
type EventDraft = Omit<EventItem, "id" | "organizerId" | "organizerName" | "status" | "registrationCount" | "remainingSpots" | "registration"> & { organizerId?: string };

const categories: Category[] = ["Workshop", "Seminar", "Cultural", "Sports", "Conference"];
const photos: Record<Category, string> = {
  Workshop: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=85",
  Seminar: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1000&q=85",
  Cultural: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=85",
  Sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1000&q=85",
  Conference: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=85",
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json().catch(() => ({})) as { error?: string } & T;
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
  return body;
}

function dateLabel(date: string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  return new Intl.DateTimeFormat("en", options).format(new Date(`${date}T12:00:00`));
}

function timeLabel(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(2000, 0, 1, hours, minutes));
}

function isUpcoming(date: string) {
  return date >= new Date().toISOString().slice(0, 10);
}

function EventArt({ event, className = "" }: { event: EventItem; className?: string }) {
  const day = dateLabel(event.date, { day: "2-digit" });
  const month = dateLabel(event.date, { month: "short" }).toUpperCase();
  return (
    <div className={`event-art ${className}`} style={{ backgroundImage: `linear-gradient(180deg, #15192a05 24%, #10131bd1 100%), url("${photos[event.category]}")` }}>
      <span className="art-category">{event.category}</span>
      <span className="art-date"><b>{day}</b><small>{month}</small></span>
    </div>
  );
}

function Dialog({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex='-1'])",
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    dialogRef.current?.querySelector<HTMLElement>("button, input, select, textarea")?.focus();
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className={`dialog ${wide ? "dialog-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="dialog-heading">
          <div><p className="eyebrow">EVENTFLOW</p><h2>{title}</h2></div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

function EventForm({ event, organizers, isAdmin, busy, onCancel, onSubmit }: {
  event: EventItem | null;
  organizers: User[];
  isAdmin: boolean;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (draft: EventDraft) => void;
}) {
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 14);
  const date = event?.date || defaultDate.toISOString().slice(0, 10);
  const defaultDeadline = new Date(`${date}T12:00:00`);
  defaultDeadline.setDate(defaultDeadline.getDate() - 3);
  const [formError, setFormError] = useState("");

  function submit(form: FormEvent<HTMLFormElement>) {
    form.preventDefault();
    setFormError("");
    const data = new FormData(form.currentTarget);
    const capacity = Number(data.get("capacity"));
    if (!Number.isSafeInteger(capacity) || capacity < 1) {
      setFormError("Capacity must be a whole number greater than zero.");
      return;
    }
    onSubmit({
      title: String(data.get("title") || ""),
      description: String(data.get("description") || ""),
      category: String(data.get("category") || "") as Category,
      venue: String(data.get("venue") || ""),
      date: String(data.get("date") || ""),
      deadline: String(data.get("deadline") || ""),
      time: String(data.get("time") || ""),
      capacity,
      organizerId: String(data.get("organizerId") || "") || undefined,
    });
  }

  return (
    <form className="stack-form" onSubmit={submit}>
      <label>Event name<input name="title" defaultValue={event?.title} required minLength={3} maxLength={120} placeholder="Give your event a name" /></label>
      <label>About this event<textarea name="description" defaultValue={event?.description} required minLength={10} maxLength={5000} rows={4} placeholder="What can people expect?" /></label>
      <div className="form-grid">
        <label>Category<select name="category" defaultValue={event?.category || "Workshop"}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label>Venue<input name="venue" defaultValue={event?.venue} required minLength={2} maxLength={200} placeholder="Building, room, or address" /></label>
        <label>Event date<input name="date" type="date" defaultValue={date} required /></label>
        <label>Registration closes<input name="deadline" type="date" defaultValue={event?.deadline || defaultDeadline.toISOString().slice(0, 10)} required /></label>
        <label>Start time<input name="time" type="time" defaultValue={event?.time || "10:00"} required /></label>
        <label>Places available<input name="capacity" type="number" defaultValue={event?.capacity || 60} required min={1} max={100000} /></label>
      </div>
      {isAdmin && organizers.length > 0 && (
        <label>Event organizer<select name="organizerId" defaultValue={event?.organizerId || ""}><option value="">Assign to me</option>{organizers.map((organizer) => <option key={organizer.id} value={organizer.id}>{organizer.name}</option>)}</select></label>
      )}
      {formError && <p className="inline-error" role="alert">{formError}</p>}
      <div className="dialog-actions"><button className="button button-quiet" type="button" onClick={onCancel}>Cancel</button><button className="button button-dark" type="submit" disabled={busy}>{busy ? "Saving…" : event ? "Save changes" : "Publish event"}</button></div>
    </form>
  );
}

export default function EventApp() {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [team, setTeam] = useState<User[]>([]);
  const [page, setPage] = useState<EventPage>("discover");
  const [category, setCategory] = useState("All events");
  const [selectedDate, setSelectedDate] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [authDialog, setAuthDialog] = useState<"login" | "register" | null>(null);
  const [eventDialog, setEventDialog] = useState<{ mode: "create" | "edit"; event?: EventItem } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [roster, setRoster] = useState<{ event: EventItem; registrations: Registration[] } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function refresh() {
    const [auth, eventResponse] = await Promise.all([
      request<{ user: User | null }>("/api/events/auth/me"),
      request<{ events: EventItem[] }>("/api/events/events"),
    ]);
    setUser(auth.user);
    setEvents(eventResponse.events);
    if (auth.user) {
      const result = await request<Dashboard>("/api/events/dashboard");
      setDashboard(result);
      if (auth.user.role === "admin") {
        const users = await request<{ users: User[] }>("/api/events/admin/users");
        setTeam(users.users);
      }
    } else {
      setDashboard(null);
      setTeam([]);
    }
  }

  useEffect(() => {
    refresh().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "The event service is unavailable."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleEvents = useMemo(() => events.filter((event) => {
    if (event.status !== "published" || !isUpcoming(event.date)) return false;
    if (category !== "All events" && event.category !== category) return false;
    if (selectedDate && event.date !== selectedDate) return false;
    const searchText = `${event.title} ${event.description} ${event.venue} ${event.organizerName}`.toLowerCase();
    return searchText.includes(search.trim().toLowerCase());
  }), [events, category, selectedDate, search]);

  function showError(cause: unknown) {
    setToast({ message: cause instanceof Error ? cause.message : "Something went wrong. Please try again.", tone: "error" });
  }

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    setBusy(true);
    setError("");
    try {
      await action();
      await refresh();
      setToast({ message: successMessage, tone: "success" });
    } catch (cause) {
      showError(cause);
    } finally {
      setBusy(false);
    }
  }

  async function submitAuth(form: FormEvent<HTMLFormElement>) {
    form.preventDefault();
    const formData = new FormData(form.currentTarget);
    const isRegister = authDialog === "register";
    const body = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
    };
    await runAction(async () => {
      const response = await request<{ user: User; message?: string }>(`/api/events/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (response.message && response.user.role === "admin") setToast({ message: "Administrator account created. Welcome to Eventflow!", tone: "success" });
      setPage(response.user.role === "participant" ? "dashboard" : "manage");
      setAuthDialog(null);
    }, isRegister ? "Your account is ready." : "Welcome back.");
  }

  async function submitEvent(draft: EventDraft) {
    if (!eventDialog) return;
    const editing = eventDialog.mode === "edit";
    await runAction(async () => {
      await request(`/api/events/events${editing ? `/${eventDialog.event?.id}` : ""}`, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(draft),
      });
      setEventDialog(null);
    }, editing ? "Event details updated." : "Your event is live.");
  }

  async function registerFor(event: EventItem) {
    if (!user) {
      setSelectedEvent(null);
      setAuthDialog("register");
      return;
    }
    if (user.role !== "participant") {
      setToast({ message: "Only participant accounts can register for events.", tone: "error" });
      return;
    }
    setBusy(true);
    try {
      const result = await request<{ registration: { registrationId: string } }>(`/api/events/events/${event.id}/register`, { method: "POST" });
      await refresh();
      setSelectedEvent(null);
      setPage("dashboard");
      setToast({ message: `You're registered! Confirmation ID: ${result.registration.registrationId}`, tone: "success" });
    } catch (cause) {
      showError(cause);
    } finally {
      setBusy(false);
    }
  }

  async function cancelRegistration(registration: Registration) {
    if (!window.confirm(`Cancel your registration for ${registration.event?.title || "this event"}?`)) return;
    await runAction(() => request(`/api/events/registrations/${registration.id}/cancel`, { method: "POST" }), "Registration cancelled.");
  }

  async function cancelEvent(event: EventItem) {
    if (!window.confirm(`Cancel "${event.title}"? All active registrations will be cancelled and retained in the event history.`)) return;
    await runAction(() => request(`/api/events/events/${event.id}`, { method: "DELETE" }), "Event cancelled. Registration history has been retained.");
  }

  async function openRoster(event: EventItem) {
    setBusy(true);
    try {
      const result = await request<{ registrations: Registration[] }>(`/api/events/events/${event.id}/registrations`);
      setRoster({ event, registrations: result.registrations });
    } catch (cause) {
      showError(cause);
    } finally {
      setBusy(false);
    }
  }

  async function markAttendance(registrationId: string, status: "present" | "absent") {
    try {
      const result = await request<{ attendance: { status: "present" | "absent" } }>(`/api/events/registrations/${registrationId}/attendance`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setRoster((current) => current && ({
        ...current,
        registrations: current.registrations.map((registration) =>
          registration.id === registrationId ? { ...registration, attendance: result.attendance.status } : registration),
      }));
      setToast({ message: "Attendance saved.", tone: "success" });
    } catch (cause) {
      showError(cause);
    }
  }

  async function updateRole(member: User, role: Role) {
    await runAction(() => request(`/api/events/admin/users/${member.id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }), `${member.name}'s role updated.`);
  }

  async function signOut() {
    await runAction(async () => {
      await request("/api/events/auth/logout", { method: "POST" });
      setPage("discover");
    }, "You are signed out.");
  }

  function exportRoster() {
    if (!roster) return;
    const rows = [
      ["Name", "Email", "Registration ID", "Registered at", "Registration status", "Attendance"],
      ...roster.registrations.map((registration) => [
        registration.participant?.name || "",
        registration.participant?.email || "",
        registration.registrationId,
        registration.registeredAt,
        registration.status,
        registration.attendance || "Not recorded",
      ]),
    ];
    const csv = rows.map((row) => row.map((field) => {
      const safeField = /^[\s]*[=+\-@\t\r]/.test(field) ? `'${field}` : field;
      return `"${safeField.replaceAll('"', '""')}"`;
    }).join(",")).join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = `${roster.event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-attendees.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const canManage = user?.role === "admin" || user?.role === "organizer";
  const navigation: { id: EventPage; label: string }[] = [
    { id: "discover", label: "Discover" },
    ...(user ? [{ id: "dashboard" as const, label: user.role === "participant" ? "My events" : "Overview" }] : []),
    ...(canManage ? [{ id: "manage" as const, label: user.role === "admin" ? "Manage events" : "My events" }] : []),
  ];

  return (
    <main className="eventflow">
      <a className="skip-nav" href="#main-content">Skip to content</a>
      <header className="site-header">
        <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); setPage("discover"); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label="Eventflow home">
          <span className="brand-mark"><CalendarDays size={18} strokeWidth={2.2} /></span>
          <span>eventflow<span className="brand-period">.</span></span>
        </a>
        <nav className={`nav-links ${mobileOpen ? "nav-open" : ""}`} aria-label="Main navigation">
          {navigation.map((item) => <button key={item.id} className={page === item.id ? "nav-link nav-link-active" : "nav-link"} onClick={() => { setPage(item.id); setMobileOpen(false); }}>{item.label}</button>)}
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <span className="welcome-label"><span className="avatar">{user.name.trim().charAt(0).toUpperCase()}</span><span className="welcome-name">{user.name.split(" ")[0]}</span></span>
              <button className="button button-dark header-account" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <>
              <button className="button button-quiet header-login" onClick={() => setAuthDialog("login")}>Log in</button>
              <button className="button button-dark header-account" onClick={() => setAuthDialog("register")}>Create account <ArrowUpRight size={14} /></button>
            </>
          )}
          <button className="icon-btn mobile-menu" onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle navigation">{mobileOpen ? <X size={19} /> : <Menu size={19} />}</button>
        </div>
      </header>

      <div id="main-content">
        {error && <div className="page-error" role="alert"><span>{error}</span><button onClick={() => { setError(""); setLoading(true); refresh().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not reload events.")).finally(() => setLoading(false)); }}>Try again <ArrowRight size={14} /></button></div>}
        {page === "discover" && (
          <>
            <section className="hero-section" id="home">
              <div className="hero-copy">
                <p className="eyebrow"><span className="eyebrow-line" /> MAKE ROOM FOR WHAT'S NEXT</p>
                <h1>Good things<br />happen <span>together.</span></h1>
                <p className="hero-description">Find your people, try something new, and fill your calendar with things worth showing up for.</p>
                <div className="hero-actions"><button className="button button-dark" onClick={() => document.getElementById("events")?.scrollIntoView({ behavior: "smooth" })}>Explore events <ArrowDownRight size={15} /></button><span className="hero-aside"><ShieldCheck size={14} /> Thoughtfully made for everyone</span></div>
                <div className="hero-count"><span className="count-avatars"><i>M</i><i>J</i><i>A</i><i>+</i></span><span>Find a community that feels like yours.</span></div>
              </div>
              <div className="hero-visual">
                <div className="hero-image" role="img" aria-label="Friends gathering at a creative community event" />
                <div className="hero-image-caption"><span className="caption-dot" /><span>THE BEST PLANS ARE THE ONES YOU MAKE</span></div>
                <div className="floating-note"><span className="note-icon"><CalendarDays size={17} /></span><span><b>Your next good thing</b><small>is closer than you think.</small></span><ArrowUpRight size={17} /></div>
                <span className="visual-decoration visual-decoration-one" /><span className="visual-decoration visual-decoration-two" />
              </div>
              <div className="hero-index"><span>01</span><i /> MADE TO BRING US CLOSER</div>
            </section>
            <section className="event-section" id="events">
              <div className="section-heading">
                <div><p className="eyebrow">A LITTLE SOMETHING FOR EVERYONE</p><h2>Find your next <span>favorite thing.</span></h2><p className="section-subtitle">Good ideas, good people, and a place for you in the room.</p></div>
                <div className="event-count">{loading ? "Loading events…" : `${visibleEvents.length} upcoming ${visibleEvents.length === 1 ? "event" : "events"}`} <ArrowDownRight size={15} /></div>
              </div>
              <div className="event-controls">
                <div className="category-filters" aria-label="Filter by event category">
                  {["All events", ...categories].map((item) => <button key={item} onClick={() => setCategory(item)} className={category === item ? "filter-chip filter-active" : "filter-chip"}>{item}</button>)}
                </div>
                <div className="event-search-tools">
                  <label className="date-box"><CalendarDays size={14} /><span className="sr-only">Filter events by exact date</span><input type="date" min={new Date().toISOString().slice(0, 10)} value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label>
                  <label className="search-box"><Search size={16} /><span className="sr-only">Search events by name, location, or organizer</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find an event, place, or person" /><Filter size={15} className="search-filter-icon" /></label>
                </div>
              </div>
              {loading ? <div className="loading-state"><span className="spinner" />Finding good things…</div> : visibleEvents.length > 0 ? (
                <div className="event-grid">
                  {visibleEvents.map((event, index) => <article key={event.id} className={`event-card ${index === 0 ? "event-card-featured" : ""}`}>
                    <button className="event-image-button" onClick={() => setSelectedEvent(event)} aria-label={`View ${event.title}`}>
                      <EventArt event={event} />
                    </button>
                    <div className="event-card-body">
                      <div className="event-card-meta"><span className={`category-dot category-${event.category.toLowerCase()}`} />{event.category}<span className="meta-divider">/</span>{dateLabel(event.date, { month: "short", day: "numeric", year: "numeric" })}</div>
                      <button className="event-title-button" onClick={() => setSelectedEvent(event)}><h3>{event.title}</h3><ArrowUpRight size={16} /></button>
                      <p className="event-card-description">{event.description}</p>
                      <div className="event-card-footer"><span><MapPin size={14} />{event.venue}</span><span><Users size={14} />{event.remainingSpots} spots left</span></div>
                    </div>
                  </article>)}
                </div>
              ) : <div className="empty-state"><span className="empty-icon"><CalendarDays size={21} /></span><h3>No plans found. Yet.</h3><p>Try another search or category. The next good thing might be just around the corner.</p><button className="button button-quiet" onClick={() => { setCategory("All events"); setSelectedDate(""); setSearch(""); }}>Clear filters</button></div>}
              <div className="browse-note"><span>THE CALENDAR IS BETTER WITH YOU IN IT.</span><span>Show up as you are <ArrowRight size={14} /></span></div>
            </section>
            <section className="community-band"><span className="community-flower">✳</span><p>A good event is more than what happens on stage.<br /><span>It's who you meet along the way.</span></p><span className="community-flower community-flower-end">✳</span></section>
          </>
        )}

        {page === "dashboard" && (
          <section className="workspace-section">
            <div className="workspace-heading"><div><p className="eyebrow">YOUR EVENTFLOW</p><h1>{user?.role === "participant" ? <>Good to see you, <span>{user.name.split(" ")[0]}.</span></> : <>A clearer view of <span>what's happening.</span></>}</h1><p>Everything you need for what's next, all in one place.</p></div>{canManage && <button className="button button-dark" onClick={() => setEventDialog({ mode: "create" })}><Plus size={16} /> Create an event</button>}</div>
            <div className="stats-grid">
              <StatCard label={user?.role === "participant" ? "Your registrations" : "Active events"} value={dashboard?.stats.events ?? 0} icon={<CalendarDays size={18} />} />
              <StatCard label={user?.role === "participant" ? "Active reservations" : "People registered"} value={dashboard?.stats.registrations ?? 0} icon={<Ticket size={18} />} />
              <StatCard label="Coming up next" value={dashboard?.stats.upcoming ?? 0} icon={<ArrowUpRight size={18} />} />
            </div>
            <div className="workspace-panel">
              <div className="panel-heading"><div><p className="eyebrow">{user?.role === "participant" ? "YOUR PLANS" : "THE CALENDAR"}</p><h2>{user?.role === "participant" ? "Events you're part of" : "Your upcoming events"}</h2></div>{canManage && <button className="text-button" onClick={() => setPage("manage")}>Manage all <ArrowRight size={14} /></button>}</div>
              {user?.role === "participant" ? (
                dashboard?.registrations.length ? <div className="registration-list">{dashboard.registrations.map((registration) => <RegistrationRow key={registration.id} registration={registration} onCancel={cancelRegistration} busy={busy} />)}</div> : <div className="empty-state compact-empty"><span className="empty-icon"><Ticket size={21} /></span><h3>Your next favorite thing is out there.</h3><p>Explore upcoming events and make a little room in your calendar.</p><button className="button button-dark" onClick={() => setPage("discover")}>Find an event <ArrowRight size={14} /></button></div>
              ) : (
                dashboard?.events.length ? <div className="managed-list">{dashboard.events.map((event) => <ManagedEvent key={event.id} event={event} onEdit={() => setEventDialog({ mode: "edit", event })} onRoster={() => openRoster(event)} onCancel={() => cancelEvent(event)} busy={busy} />)}</div> : <div className="empty-state compact-empty"><span className="empty-icon"><CalendarDays size={21} /></span><h3>It starts with an idea.</h3><p>Create your first event and give your community something to look forward to.</p><button className="button button-dark" onClick={() => setEventDialog({ mode: "create" })}>Create an event <Plus size={14} /></button></div>
              )}
            </div>
            <footer className="workspace-footer">A place for good things to happen. <span>EVENTFLOW <i>✳</i></span></footer>
          </section>
        )}

        {page === "manage" && (
          <section className="workspace-section">
            <div className="workspace-heading"><div><p className="eyebrow">{user?.role === "admin" ? "ADMINISTRATOR" : "EVENT ORGANIZER"}</p><h1>Good plans start <span>right here.</span></h1><p>Create welcoming events, take care of the details, and see who's coming.</p></div><button className="button button-dark" onClick={() => setEventDialog({ mode: "create" })}><Plus size={16} /> Create an event</button></div>
            <div className="stats-grid">
              <StatCard label="Events you manage" value={dashboard?.stats.events ?? 0} icon={<CalendarDays size={18} />} />
              <StatCard label="Active registrations" value={dashboard?.stats.registrations ?? 0} icon={<Users size={18} />} />
              <StatCard label="Events coming up" value={dashboard?.stats.upcoming ?? 0} icon={<ArrowUpRight size={18} />} />
            </div>
            <div className="workspace-panel">
              <div className="panel-heading"><div><p className="eyebrow">YOUR COMMUNITY, IN ONE PLACE</p><h2>Event management</h2></div><span className="panel-count">{dashboard?.events.length || 0} total</span></div>
              {dashboard?.events.length ? <div className="managed-list">{dashboard.events.map((event) => <ManagedEvent key={event.id} event={event} onEdit={() => setEventDialog({ mode: "edit", event })} onRoster={() => openRoster(event)} onCancel={() => cancelEvent(event)} busy={busy} />)}</div> : <div className="empty-state compact-empty"><span className="empty-icon"><CalendarDays size={21} /></span><h3>Your first event starts here.</h3><p>Share an idea, set a date, and bring your community together.</p><button className="button button-dark" onClick={() => setEventDialog({ mode: "create" })}>Create an event <Plus size={14} /></button></div>}
            </div>
            {user?.role === "admin" && <div className="workspace-panel team-panel">
              <div className="panel-heading"><div><p className="eyebrow">THE PEOPLE BEHIND IT</p><h2>Manage your team</h2></div><span className="panel-count">{team.length} {team.length === 1 ? "person" : "people"}</span></div>
              <p className="team-intro">Give a participant organizer access so they can publish and manage their own events.</p>
              <div className="team-list">{team.map((member) => <div className="team-row" key={member.id}><span className="avatar">{member.name.charAt(0).toUpperCase()}</span><span className="team-person"><b>{member.name}</b><small>{member.email}</small></span><span className={`role-pill role-${member.role}`}>{member.role}</span><label className="sr-only" htmlFor={`role-${member.id}`}>Role for {member.name}</label><select id={`role-${member.id}`} disabled={member.id === user.id || busy} value={member.role} onChange={(event) => updateRole(member, event.target.value as Role)}><option value="participant">Participant</option><option value="organizer">Organizer</option><option value="admin">Admin</option></select></div>)}</div>
            </div>}
            <footer className="workspace-footer">A place for good things to happen. <span>EVENTFLOW <i>✳</i></span></footer>
          </section>
        )}
      </div>

      <footer className="site-footer"><a className="brand footer-brand" href="#home" onClick={(event) => { event.preventDefault(); setPage("discover"); }}><span className="brand-mark"><CalendarDays size={16} /></span><span>eventflow<span className="brand-period">.</span></span></a><span>Leave a little room for something good.</span><span>© {new Date().getFullYear()} EVENTFLOW</span></footer>

      {authDialog && <Dialog title={authDialog === "login" ? "Welcome back." : "Come on in."} onClose={() => setAuthDialog(null)}>
        <p className="dialog-intro">{authDialog === "login" ? "Sign in to pick up where you left off." : "A little space for the things and people you love."}</p>
        <form className="stack-form" onSubmit={submitAuth}>
          {authDialog === "register" && <label>Your name<input name="name" autoComplete="name" required minLength={2} maxLength={80} placeholder="How should we say hello?" /></label>}
          <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" /></label>
          <label>Password<input name="password" type="password" autoComplete={authDialog === "login" ? "current-password" : "new-password"} required minLength={authDialog === "login" ? 1 : 10} maxLength={128} placeholder={authDialog === "login" ? "Your password" : "At least 10 characters"} /></label>
          {authDialog === "register" && <p className="form-note">The first account created on a fresh installation becomes the administrator. New accounts are participants by default.</p>}
          <button className="button button-dark button-full" disabled={busy} type="submit">{busy ? "One moment…" : authDialog === "login" ? "Sign in" : "Create your account"} <ArrowRight size={15} /></button>
        </form>
        <p className="auth-switch">{authDialog === "login" ? "New around here?" : "Already have an account?"} <button onClick={() => setAuthDialog(authDialog === "login" ? "register" : "login")}>{authDialog === "login" ? "Create an account" : "Sign in"}</button></p>
      </Dialog>}

      {eventDialog && <Dialog title={eventDialog.mode === "edit" ? "Make it even better." : "Start with a good idea."} wide onClose={() => setEventDialog(null)}>
        <p className="dialog-intro">{eventDialog.mode === "edit" ? "Keep the details up to date for the people coming." : "A few details are all it takes to bring people together."}</p>
        <EventForm key={`${eventDialog.mode}-${eventDialog.event?.id || "new"}`} event={eventDialog.event || null} organizers={team.filter((member) => member.role === "organizer")} isAdmin={user?.role === "admin"} busy={busy} onCancel={() => setEventDialog(null)} onSubmit={submitEvent} />
      </Dialog>}

      {selectedEvent && <Dialog title={selectedEvent.title} wide onClose={() => setSelectedEvent(null)}>
        <div className="event-detail"><EventArt event={selectedEvent} className="event-detail-art" /><div className="event-detail-content"><div className="event-detail-facts"><span><CalendarDays size={16} />{dateLabel(selectedEvent.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span><span><Clock3 size={16} />{timeLabel(selectedEvent.time)}</span><span><MapPin size={16} />{selectedEvent.venue}</span><span><Users size={16} />Hosted by {selectedEvent.organizerName}</span></div><p>{selectedEvent.description}</p><div className="detail-capacity"><span>{selectedEvent.remainingSpots} places still open</span><span>{selectedEvent.registrationCount} / {selectedEvent.capacity} registered</span></div><div className="capacity-track"><i style={{ width: `${Math.min(100, (selectedEvent.registrationCount / selectedEvent.capacity) * 100)}%` }} /></div><button className="button button-dark button-full" disabled={busy || selectedEvent.remainingSpots === 0 || !isUpcoming(selectedEvent.deadline) || Boolean(selectedEvent.registration)} onClick={() => registerFor(selectedEvent)}>{selectedEvent.registration ? <><Check size={16} />You're already on the list</> : selectedEvent.remainingSpots === 0 ? "All places are taken" : !isUpcoming(selectedEvent.deadline) ? "Registration is closed" : user?.role === "participant" ? "Save your seat" : user ? "Participant registration only" : "Sign in to register"} {!selectedEvent.registration && <ArrowRight size={15} />}</button><p className="detail-deadline">Registration closes {dateLabel(selectedEvent.deadline, { month: "long", day: "numeric" })}.</p></div></div>
      </Dialog>}

      {roster && <Dialog title="The people showing up." wide onClose={() => setRoster(null)}>
        <div className="roster-toolbar"><div><p className="dialog-intro">{roster.event.title} · {roster.registrations.filter((registration) => registration.status === "registered").length} active registrations</p><p className="roster-note">Attendance can be updated by event organizers and administrators.</p></div><button className="button button-quiet export-button" onClick={exportRoster}><Download size={14} /> Export CSV</button></div>
        {roster.registrations.length ? <div className="roster-table-wrap"><table className="roster-table"><thead><tr><th>Participant</th><th>Registration ID</th><th>Status</th><th>Attendance</th></tr></thead><tbody>{roster.registrations.map((registration) => <tr key={registration.id}><td><b>{registration.participant?.name || "Account unavailable"}</b><small>{registration.participant?.email || ""}</small></td><td className="registration-id">{registration.registrationId}</td><td><span className={`status-pill status-${registration.status}`}>{registration.status}</span></td><td>{registration.status === "registered" ? <select aria-label={`Attendance for ${registration.participant?.name || registration.registrationId}`} value={registration.attendance || ""} onChange={(event) => { if (event.target.value) markAttendance(registration.id, event.target.value as "present" | "absent"); }}><option value="">Not recorded</option><option value="present">Present</option><option value="absent">Absent</option></select> : <span className="muted-copy">—</span>}</td></tr>)}</tbody></table></div> : <div className="empty-roster"><Users size={22} /><p>No registrations yet. Share the event to get things started.</p></div>}
      </Dialog>}

      {toast && <div className={`toast toast-${toast.tone}`} role={toast.tone === "error" ? "alert" : "status"}><span className="toast-icon">{toast.tone === "success" ? <Check size={16} /> : <X size={16} />}</span><span>{toast.message}</span><button onClick={() => setToast(null)} aria-label="Dismiss notification"><X size={15} /></button></div>}
    </main>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return <div className="stat-card"><span className="stat-icon">{icon}</span><span className="stat-value">{value}</span><span className="stat-label">{label}</span><ArrowUpRight className="stat-arrow" size={15} /></div>;
}

function RegistrationRow({ registration, onCancel, busy }: { registration: Registration; onCancel: (registration: Registration) => void; busy: boolean }) {
  const event = registration.event;
  const cancellable = registration.status === "registered" && Boolean(event && isUpcoming(event.date));
  return (
    <article className={`registration-row ${registration.status === "cancelled" ? "registration-cancelled" : ""}`}>
      <div className="registration-date"><b>{event ? dateLabel(event.date, { day: "2-digit" }) : "—"}</b><span>{event ? dateLabel(event.date, { month: "short" }).toUpperCase() : ""}</span></div>
      <div className="registration-info"><span className="registration-category">{registration.status === "registered" ? "YOUR PLACE IS SAVED" : "REGISTRATION CANCELLED"}</span><h3>{event?.title || "Event details unavailable"}</h3><span><MapPin size={13} />{event?.venue || "—"} <i>·</i> {event?.time ? timeLabel(event.time) : ""}</span></div>
      <div className="registration-confirmation"><span>CONFIRMATION ID</span><b>{registration.registrationId}</b>{registration.attendance && <small className={`attendance attendance-${registration.attendance}`}>{registration.attendance === "present" ? "Checked in" : "Marked absent"}</small>}</div>
      {cancellable && <button className="button button-quiet cancel-reg" disabled={busy} onClick={() => onCancel(registration)}>Cancel place</button>}
      {registration.status === "cancelled" && <span className="status-pill status-cancelled">Cancelled</span>}
    </article>
  );
}

function ManagedEvent({ event, onEdit, onRoster, onCancel, busy }: { event: EventItem; onEdit: () => void; onRoster: () => void; onCancel: () => void; busy: boolean }) {
  return (
    <article className={`managed-row ${event.status === "cancelled" ? "managed-row-cancelled" : ""}`}>
      <EventArt event={event} className="managed-art" />
      <div className="managed-info"><div className="event-card-meta"><span className={`category-dot category-${event.category.toLowerCase()}`} />{event.category}<span className="meta-divider">/</span>{dateLabel(event.date, { month: "short", day: "numeric", year: "numeric" })}</div><h3>{event.title}</h3><span><MapPin size={13} />{event.venue}</span></div>
      <div className="managed-capacity"><b>{event.registrationCount}<span> / {event.capacity}</span></b><small>people registered</small><span className="capacity-track"><i style={{ width: `${Math.min(100, (event.registrationCount / event.capacity) * 100)}%` }} /></span></div>
      <div className="managed-actions"><button className="button button-quiet" disabled={busy} onClick={onRoster}><Users size={14} /> Attendees</button>{event.status === "published" && <><button className="button button-quiet edit-event" disabled={busy} onClick={onEdit}>Edit</button><button className="button button-quiet cancel-event" disabled={busy} onClick={onCancel}>Cancel event</button></>}{event.status === "cancelled" && <span className="status-pill status-cancelled">Cancelled</span>}</div>
      {event.status === "published" && <div className="managed-mobile-actions"><button className="button button-quiet" disabled={busy} onClick={onRoster}><Users size={14} /> Attendees</button><button className="button button-quiet" disabled={busy} onClick={onEdit}>Edit</button><button className="button button-quiet cancel-event" disabled={busy} onClick={onCancel}>Cancel</button></div>}
    </article>
  );
}
