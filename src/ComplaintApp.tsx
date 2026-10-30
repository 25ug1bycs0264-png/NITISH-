import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  FileText,
  Filter,
  Headphones,
  Home,
  Menu,
  MessageSquareText,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from "lucide-react";

type Status = "Submitted" | "Under Review" | "In Progress" | "Resolved" | "Closed";
type Priority = "Low" | "Medium" | "High" | "Urgent";
type Role = "complainant" | "staff" | "admin";
type Page = "home" | "submit" | "track" | "dashboard" | "detail";

type ComplaintUpdate = {
  date: string;
  title: string;
  detail: string;
  public: boolean;
};

type Complaint = {
  id: string;
  reference: string;
  name: string;
  email: string;
  category: string;
  subject: string;
  description: string;
  priority: Priority;
  status: Status;
  department: string;
  assignedTo: string;
  submittedAt: string;
  attachments: string[];
  updates: ComplaintUpdate[];
  internalNotes: string[];
  resolution: string;
};

const STORAGE_KEY = "clearline.complaints.demo.v1";
const STATUSES: Status[] = ["Submitted", "Under Review", "In Progress", "Resolved", "Closed"];
const DEPARTMENTS = ["Facilities", "IT Support", "People & Culture", "Finance", "Student Services", "General", "Other"];

const initialComplaints: Complaint[] = [
  {
    id: "c-1048", reference: "CL-2026-1048", name: "Jordan Lee", email: "jordan.lee@example.com",
    category: "Facilities", subject: "Heating in the east wing is not working",
    description: "The heating has been off in the east wing meeting rooms since Monday. The temperature is very low during morning sessions.",
    priority: "High", status: "In Progress", department: "Facilities", assignedTo: "Maya Chen",
    submittedAt: "2026-10-28T09:32:00.000Z", attachments: [],
    updates: [
      { date: "2026-10-28T09:32:00.000Z", title: "Complaint submitted", detail: "Your complaint was received and logged.", public: true },
      { date: "2026-10-28T13:15:00.000Z", title: "Under review", detail: "Facilities is reviewing the issue and arranging an inspection.", public: true },
      { date: "2026-10-29T10:20:00.000Z", title: "Work in progress", detail: "A technician has been assigned to inspect the heating system.", public: true },
    ],
    internalNotes: ["Technician visit scheduled for Thursday morning."], resolution: "",
  },
  {
    id: "c-1047", reference: "CL-2026-1047", name: "Sam Rivera", email: "sam.rivera@example.com",
    category: "IT Support", subject: "Cannot access the shared project folder",
    description: "Access to the project folder stopped working after the permissions were updated yesterday.",
    priority: "Medium", status: "Under Review", department: "IT Support", assignedTo: "Noah Patel",
    submittedAt: "2026-10-27T14:08:00.000Z", attachments: ["access-error.png"],
    updates: [
      { date: "2026-10-27T14:08:00.000Z", title: "Complaint submitted", detail: "Your complaint was received and logged.", public: true },
      { date: "2026-10-28T08:45:00.000Z", title: "Under review", detail: "IT Support is checking the folder permissions.", public: true },
    ],
    internalNotes: [], resolution: "",
  },
  {
    id: "c-1046", reference: "CL-2026-1046", name: "Taylor Brooks", email: "taylor.brooks@example.com",
    category: "People & Culture", subject: "Request for a confidential conversation",
    description: "I would like to speak privately with someone about a workplace concern.",
    priority: "Urgent", status: "Submitted", department: "People & Culture", assignedTo: "Unassigned",
    submittedAt: "2026-10-27T11:24:00.000Z", attachments: [],
    updates: [{ date: "2026-10-27T11:24:00.000Z", title: "Complaint submitted", detail: "Your complaint was received and logged.", public: true }],
    internalNotes: [], resolution: "",
  },
  {
    id: "c-1045", reference: "CL-2026-1045", name: "Casey Morgan", email: "casey.morgan@example.com",
    category: "Finance", subject: "Expense reimbursement is overdue",
    description: "My approved travel reimbursement has not arrived yet. The claim was submitted three weeks ago.",
    priority: "Low", status: "Resolved", department: "Finance", assignedTo: "Avery Kim",
    submittedAt: "2026-10-24T16:12:00.000Z", attachments: [],
    updates: [
      { date: "2026-10-24T16:12:00.000Z", title: "Complaint submitted", detail: "Your complaint was received and logged.", public: true },
      { date: "2026-10-26T14:30:00.000Z", title: "Resolved", detail: "The reimbursement was processed. Please allow 2–3 business days for it to appear.", public: true },
    ],
    internalNotes: [], resolution: "Payment was reprocessed on 26 October.",
  },
  {
    id: "c-1044", reference: "CL-2026-1044", name: "Riley Johnson", email: "riley.johnson@example.com",
    category: "Student Services", subject: "Quiet study room booking issue",
    description: "The booking system shows my reserved room as available and another group is using it.",
    priority: "Medium", status: "Closed", department: "Student Services", assignedTo: "Jamie Park",
    submittedAt: "2026-10-22T10:05:00.000Z", attachments: [],
    updates: [
      { date: "2026-10-22T10:05:00.000Z", title: "Complaint submitted", detail: "Your complaint was received and logged.", public: true },
      { date: "2026-10-23T12:00:00.000Z", title: "Resolved", detail: "The booking conflict was corrected and the calendar is now up to date.", public: true },
      { date: "2026-10-24T09:00:00.000Z", title: "Complaint closed", detail: "This complaint has been closed. Contact us if you need further help.", public: true },
    ],
    internalNotes: [], resolution: "Booking calendar synchronization was refreshed.",
  },
];

function readComplaints(): Complaint[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialComplaints;
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error("Stored complaint data is not a list.");
    return parsed as Complaint[];
  } catch (error) {
    console.error("Could not load the demo complaint data.", error);
    return initialComplaints;
  }
}

function formatDate(date: string, includeTime = false): string {
  return new Intl.DateTimeFormat("en", {
    month: "short", day: "numeric", year: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(date));
}

function newReference(complaints: Complaint[]): string {
  const max = complaints.reduce((highest, complaint) => {
    const match = complaint.reference.match(/(\d+)$/);
    return Math.max(highest, match ? Number(match[1]) : 1000);
  }, 1000);
  return `CL-${new Date().getFullYear()}-${String(max + 1).padStart(4, "0")}`;
}

function StatusBadge({ status }: { status: Status }) {
  return <span className={`status-badge status-${status.toLowerCase().replaceAll(" ", "-")}`}><i />{status}</span>;
}

function App() {
  const [complaints, setComplaints] = useState<Complaint[]>(readComplaints);
  const [role, setRole] = useState<Role>("complainant");
  const [page, setPage] = useState<Page>("home");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [trackReference, setTrackReference] = useState("");
  const [trackSubmitted, setTrackSubmitted] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [newInternalNote, setNewInternalNote] = useState("");

  const selectedComplaint = complaints.find((complaint) => complaint.id === selectedId) ?? null;
  const canAccessStaff = role === "staff" || role === "admin";
  const openCount = complaints.filter((complaint) => !["Resolved", "Closed"].includes(complaint.status)).length;
  const resolvedCount = complaints.filter((complaint) => complaint.status === "Resolved" || complaint.status === "Closed").length;
  const urgentCount = complaints.filter((complaint) => complaint.priority === "Urgent" && !["Resolved", "Closed"].includes(complaint.status)).length;

  const filteredComplaints = useMemo(() => {
    const term = query.trim().toLowerCase();
    return complaints
      .filter((complaint) => statusFilter === "All statuses" || complaint.status === statusFilter)
      .filter((complaint) => !term || [
        complaint.reference, complaint.subject, complaint.name, complaint.department, complaint.category,
      ].some((value) => value.toLowerCase().includes(term)))
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }, [complaints, query, statusFilter]);

  const trackedComplaint = trackSubmitted
    ? complaints.find((complaint) => complaint.reference.toLowerCase() === trackReference.trim().toLowerCase()) ?? null
    : null;

  function persist(next: Complaint[]) {
    setComplaints(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStorageError(false);
    } catch (error) {
      console.error("Could not save the demo complaint data.", error);
      setStorageError(true);
    }
  }

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3800);
  }

  function navigate(nextPage: Page) {
    if (nextPage === "dashboard" && !canAccessStaff) {
      notify("Switch to a staff or admin demo role to view the staff dashboard.");
      return;
    }
    setPage(nextPage);
    setMobileNavOpen(false);
    setTrackSubmitted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openComplaint(complaint: Complaint) {
    if (!canAccessStaff) return;
    setSelectedId(complaint.id);
    setNewInternalNote("");
    setPage("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function createComplaint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const now = new Date().toISOString();
    const reference = newReference(complaints);
    const complaint: Complaint = {
      id: `c-${Date.now()}`,
      reference,
      name: String(data.get("name")).trim(),
      email: String(data.get("email")).trim(),
      category: String(data.get("category")),
      subject: String(data.get("subject")).trim(),
      description: String(data.get("description")).trim(),
      priority: String(data.get("priority")) as Priority,
      status: "Submitted",
      department: String(data.get("category")),
      assignedTo: "Unassigned",
      submittedAt: now,
      attachments: Array.from((data.get("attachments") as FileList) ?? []).map((file) => file.name),
      updates: [{ date: now, title: "Complaint submitted", detail: "Your complaint was received and logged.", public: true }],
      internalNotes: [],
      resolution: "",
    };
    persist([complaint, ...complaints]);
    setTrackReference(reference);
    setTrackSubmitted(true);
    setPage("track");
    notify(`Complaint submitted. Your reference is ${reference}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateComplaint(updates: Partial<Complaint>, update?: ComplaintUpdate) {
    if (!selectedComplaint) return;
    const next = complaints.map((complaint) => complaint.id === selectedComplaint.id
      ? { ...complaint, ...updates, updates: update ? [...complaint.updates, update] : complaint.updates }
      : complaint);
    persist(next);
  }

  function changeStatus(status: Status) {
    if (!selectedComplaint || status === selectedComplaint.status) return;
    const update: ComplaintUpdate = {
      date: new Date().toISOString(),
      title: status,
      detail: status === "Resolved"
        ? (selectedComplaint.resolution || "The team has resolved your complaint.")
        : status === "Closed"
          ? "This complaint has been closed. Contact us if you need further help."
          : `Your complaint is now ${status.toLowerCase()}.`,
      public: true,
    };
    updateComplaint({ status }, update);
    notify(`Status updated to ${status}.`);
  }

  function addInternalNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedComplaint || !newInternalNote.trim()) return;
    updateComplaint({ internalNotes: [...selectedComplaint.internalNotes, `${formatDate(new Date().toISOString(), true)} — ${newInternalNote.trim()}`] });
    setNewInternalNote("");
    notify("Internal note added.");
  }

  function assignComplaint(event: FormEvent<HTMLSelectElement>) {
    if (!selectedComplaint) return;
    updateComplaint({ assignedTo: event.currentTarget.value });
    notify("Assignment updated.");
  }

  function changePriority(event: FormEvent<HTMLSelectElement>) {
    if (!selectedComplaint) return;
    updateComplaint({ priority: event.currentTarget.value as Priority });
    notify("Priority updated.");
  }

  const title = page === "home" ? "A better way to be heard"
    : page === "submit" ? "Submit a complaint"
      : page === "track" ? "Track your complaint"
        : page === "dashboard" ? "Staff dashboard"
          : "Complaint details";

  return (
    <div className="portal-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`} aria-label="Main navigation">
        <button className="brand" onClick={() => navigate("home")} aria-label="Clearline home">
          <span className="brand-mark"><ShieldCheck size={21} strokeWidth={2.2} /></span>
          <span>clearline<span className="brand-period">.</span><small>COMPLAINTS, HANDLED</small></span>
        </button>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="side-nav">
          <button className={page === "home" ? "nav-active" : ""} onClick={() => navigate("home")}><Home size={17} />Overview</button>
          <button className={page === "submit" ? "nav-active" : ""} onClick={() => navigate("submit")}><Plus size={17} />Submit a complaint</button>
          <button className={page === "track" ? "nav-active" : ""} onClick={() => navigate("track")}><Search size={17} />Track a complaint</button>
          <div className="nav-divider" />
          <div className="sidebar-label nav-section-label">STAFF TOOLS <span>DEMO</span></div>
          <button className={page === "dashboard" || page === "detail" ? "nav-active" : ""} onClick={() => navigate("dashboard")}><ClipboardList size={17} />Staff dashboard</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-notice"><Sparkles size={15} /><span><strong>Demo workspace</strong><small>Sample data only. No live cases.</small></span></div>
          <label className="role-label" htmlFor="demo-role">PREVIEW AS</label>
          <div className="role-select-wrap">
            <Users size={15} aria-hidden="true" />
            <select id="demo-role" value={role} onChange={(event) => {
              const nextRole = event.target.value as Role;
              setRole(nextRole);
              if (nextRole === "complainant" && (page === "dashboard" || page === "detail")) setPage("home");
              notify(`Previewing as ${nextRole === "complainant" ? "a complainant" : `a demo ${nextRole}`}.`);
            }}>
              <option value="complainant">Complainant</option>
              <option value="staff">Staff member</option>
              <option value="admin">Administrator</option>
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </div>
          <div className="profile-row"><span className="avatar">{role === "admin" ? "AD" : role === "staff" ? "ST" : "GU"}</span><span><strong>{role === "complainant" ? "Guest access" : role === "admin" ? "Demo admin" : "Demo staff"}</strong><small>{role === "complainant" ? "Public portal" : "Demo role · not authenticated"}</small></span></div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Toggle navigation" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(!mobileNavOpen)}>{mobileNavOpen ? <X size={20} /> : <Menu size={20} />}</button>
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{title}</strong></div>
          <div className="topbar-right"><span className="demo-pill"><i />DEMO MODE</span><button className="icon-btn notification-btn" aria-label="Notifications"><Bell size={18} /><i /></button><span className="top-avatar">{role === "complainant" ? "G" : role === "staff" ? "S" : "A"}</span></div>
        </header>

        <main id="main-content" className="main-content">
          {storageError && <div className="error-banner" role="alert">This browser could not save the demo data. Changes may not persist after refresh.</div>}

          {page === "home" && (
            <section className="home-page">
              <div className="hero-card">
                <div className="hero-copy">
                  <span className="eyebrow"><span className="eyebrow-dot" />A CLEAR PATH FORWARD</span>
                  <h1>Every concern<br />deserves <em>attention.</em></h1>
                  <p>A simple, confidential way to raise an issue and stay informed while we work toward a resolution.</p>
                  <div className="hero-buttons">
                    <button className="button button-dark" onClick={() => navigate("submit")}>Submit a complaint <ArrowRight size={16} /></button>
                    <button className="button button-outline" onClick={() => navigate("track")}>Track a complaint <Search size={16} /></button>
                  </div>
                  <div className="hero-assurance"><ShieldCheck size={16} /><span>Your information is handled with care and shared only with the team responsible for your case.</span></div>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="orbit orbit-one" /><div className="orbit orbit-two" />
                  <div className="hero-stamp"><span><Check size={29} /></span><small>YOUR VOICE<br />MATTERS</small></div>
                  <div className="hero-floating-card"><span className="floating-icon"><MessageSquareText size={17} /></span><span><strong>We’re listening</strong><small>Every report starts a conversation.</small></span></div>
                  <div className="hero-floating-line" />
                </div>
              </div>

              <div className="process-heading"><div><span className="section-eyebrow">HOW IT WORKS</span><h2>From concern to resolution.</h2></div><p>We keep you in the loop at every step.</p></div>
              <div className="process-grid">
                <article className="process-card"><span className="process-number">01</span><span className="process-icon icon-lilac"><FileText size={19} /></span><h3>Tell us what happened</h3><p>Share the details that matter. You’ll receive a unique reference number to keep.</p></article>
                <article className="process-card"><span className="process-number">02</span><span className="process-icon icon-peach"><Headphones size={19} /></span><h3>We review your concern</h3><p>The right team reviews your complaint and may follow up if they need more information.</p></article>
                <article className="process-card"><span className="process-number">03</span><span className="process-icon icon-mint"><CheckCircle2 size={19} /></span><h3>See progress, get closure</h3><p>Track status updates with your reference number until your case is resolved.</p></article>
              </div>
              <div className="home-bottom-row">
                <div className="home-callout"><span className="callout-icon"><ShieldCheck size={20} /></span><div><strong>Your privacy comes first</strong><p>Contact details and internal case notes are only available to authorized staff in this demo interface.</p></div><button aria-label="Learn about privacy" onClick={() => notify("This local prototype has no authentication or server-side privacy controls.")}><ArrowRight size={18} /></button></div>
                <div className="home-tracking-card"><span className="tracking-icon"><Search size={18} /></span><div><strong>Already submitted?</strong><small>Have your reference number handy.</small></div><button onClick={() => navigate("track")}>Track it <ArrowRight size={14} /></button></div>
              </div>
              <p className="sample-note"><Sparkles size={13} /> Demo environment — all sample complaints and names are fictional.</p>
            </section>
          )}

          {page === "submit" && (
            <section className="form-page">
              <div className="page-intro"><span className="section-eyebrow">WE’RE HERE TO HELP</span><h1>Tell us what’s going on.</h1><p>Give us a few details so we can get your concern to the right team. Fields marked <b>*</b> are required.</p></div>
              <div className="form-layout">
                <form className="complaint-form panel" onSubmit={createComplaint}>
                  <div className="form-section-title"><span>01</span><div><h2>Your details</h2><p>We’ll use these details only to follow up about your complaint.</p></div></div>
                  <div className="form-grid">
                    <label className="field">Full name <b>*</b><input name="name" autoComplete="name" placeholder="e.g. Alex Morgan" required minLength={2} maxLength={100} /></label>
                    <label className="field">Email address <b>*</b><input name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} /></label>
                  </div>
                  <div className="form-section-title form-section-spaced"><span>02</span><div><h2>About your concern</h2><p>Be as specific as you can. This helps us understand what happened.</p></div></div>
                  <div className="form-grid">
                    <label className="field">Category <b>*</b><select name="category" required defaultValue=""><option value="" disabled>Select a category</option>{DEPARTMENTS.filter((department) => department !== "General").map((department) => <option key={department}>{department}</option>)}<option>Other</option></select></label>
                    <label className="field">Priority <b>*</b><select name="priority" defaultValue="Medium" required><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></label>
                  </div>
                  <label className="field">Subject <b>*</b><input name="subject" placeholder="A short summary of your concern" required minLength={4} maxLength={140} /></label>
                  <label className="field">Description <b>*</b><textarea name="description" rows={6} placeholder="What happened? When did it happen? Is there anything else we should know?" required minLength={10} maxLength={5000} /><span className="field-hint">Please don’t include passwords or sensitive personal information.</span></label>
                  <label className="field">Attachments <span className="optional">(optional)</span><input className="file-input" type="file" name="attachments" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt" /><span className="field-hint">Demo only: file names are recorded locally; files are not uploaded or stored.</span></label>
                  <label className="consent-check"><input type="checkbox" required /><span>I confirm that the information above is accurate and can be used to address my complaint. <b>*</b></span></label>
                  <div className="form-actions"><span><ShieldCheck size={15} /> Your contact details stay private from public tracking.</span><button className="button button-dark" type="submit">Submit complaint <ArrowRight size={16} /></button></div>
                </form>
                <aside className="form-aside">
                  <div className="aside-card"><span className="aside-icon"><Clock3 size={18} /></span><h3>What happens next?</h3><ul><li><i>1</i><span>We’ll send an on-screen confirmation with your reference number.</span></li><li><i>2</i><span>The relevant team reviews your complaint.</span></li><li><i>3</i><span>Use your reference number to check for updates.</span></li></ul></div>
                  <div className="confidential-card"><ShieldCheck size={17} /><div><strong>Need to share something sensitive?</strong><p>Use your organization’s approved confidential reporting channel. This demo is not secure or monitored.</p></div></div>
                </aside>
              </div>
            </section>
          )}

          {page === "track" && (
            <section className="track-page">
              <div className="page-intro"><span className="section-eyebrow">YOUR CASE, AT A GLANCE</span><h1>Follow your complaint.</h1><p>Enter the reference number from your confirmation to see the latest status and updates.</p></div>
              <form className="track-search panel" onSubmit={(event) => { event.preventDefault(); setTrackSubmitted(true); }}>
                <label htmlFor="reference">Complaint reference number</label>
                <div className="track-input-row"><div className="track-input"><Search size={18} /><input id="reference" value={trackReference} onChange={(event) => { setTrackReference(event.target.value); setTrackSubmitted(false); }} placeholder="e.g. CL-2026-1048" required aria-describedby="track-hint" /><button type="button" className="clear-input" aria-label="Clear reference number" onClick={() => { setTrackReference(""); setTrackSubmitted(false); }}><X size={16} /></button></div><button className="button button-dark" type="submit">Find complaint <ArrowRight size={16} /></button></div>
                <span id="track-hint" className="field-hint">Your reference number looks like CL-2026-1048.</span>
              </form>
              {trackSubmitted && trackedComplaint && (
                <article className="tracked-case panel">
                  <div className="tracked-header"><div><span className="case-reference">{trackedComplaint.reference}</span><h2>{trackedComplaint.subject}</h2><p>Submitted {formatDate(trackedComplaint.submittedAt)}</p></div><StatusBadge status={trackedComplaint.status} /></div>
                  <div className="tracked-meta"><div><span>ASSIGNED DEPARTMENT</span><strong>{trackedComplaint.department}</strong></div><div><span>PRIORITY</span><strong>{trackedComplaint.priority}</strong></div></div>
                  <div className="timeline-heading"><h3>Updates</h3><span>{trackedComplaint.updates.filter((item) => item.public).length} updates</span></div>
                  <ol className="timeline">{trackedComplaint.updates.filter((item) => item.public).map((update, index) => <li key={`${update.date}-${index}`}><span className={`timeline-marker ${index === 0 ? "timeline-first" : ""}`}><Check size={12} /></span><div><div className="timeline-title-row"><strong>{update.title}</strong><time>{formatDate(update.date, true)}</time></div><p>{update.detail}</p></div></li>)}</ol>
                  <p className="privacy-footnote"><ShieldCheck size={14} /> Personal contact details and internal staff notes are not shown here.</p>
                </article>
              )}
              {trackSubmitted && !trackedComplaint && <div className="empty-state panel"><span><Search size={22} /></span><h2>We couldn’t find that reference.</h2><p>Double-check the number and try again. New complaints submitted in this browser are available here immediately.</p></div>}
              {!trackSubmitted && <div className="track-help"><div className="help-symbol"><MessageSquareText size={20} /></div><div><strong>Need help finding your reference?</strong><p>It appears on the confirmation screen after submission. This prototype does not send email notifications.</p></div></div>}
            </section>
          )}

          {page === "dashboard" && canAccessStaff && (
            <section className="dashboard-page">
              <div className="dashboard-heading"><div><span className="section-eyebrow">COMPLAINT OPERATIONS</span><h1>Good morning, {role === "admin" ? "Admin" : "team"}.</h1><p>Here’s what’s happening across your complaint queue.</p></div><button className="button button-dark" onClick={() => navigate("submit")}><Plus size={16} /> New complaint</button></div>
              <div className="dashboard-summary"><span><Sparkles size={13} /> DEMO DATA · SAMPLE RECORDS</span><p>Staff preview only. This local prototype has no authentication or server-side access controls.</p></div>
              <div className="metric-grid">
                <article className="metric-card"><span className="metric-icon metric-blue"><ClipboardList size={17} /></span><div><span>TOTAL COMPLAINTS</span><strong>{complaints.length}</strong><small>Across all statuses</small></div><span className="metric-trend">All time</span></article>
                <article className="metric-card"><span className="metric-icon metric-orange"><Clock3 size={17} /></span><div><span>OPEN CASES</span><strong>{openCount}</strong><small>Awaiting resolution</small></div><span className="metric-dot orange-dot" /></article>
                <article className="metric-card"><span className="metric-icon metric-green"><CheckCircle2 size={17} /></span><div><span>RESOLVED</span><strong>{resolvedCount}</strong><small>Resolved or closed</small></div><span className="metric-dot green-dot" /></article>
                <article className="metric-card"><span className="metric-icon metric-red"><Bell size={17} /></span><div><span>URGENT PRIORITY</span><strong>{urgentCount}</strong><small>Needs prompt attention</small></div><span className="metric-dot red-dot" /></article>
              </div>
              <section className="queue-panel panel">
                <div className="queue-heading"><div><span className="section-eyebrow">THE INBOX</span><h2>Recent complaints <span>{filteredComplaints.length}</span></h2></div><button className="filter-button" onClick={() => { setQuery(""); setStatusFilter("All statuses"); }}><SlidersHorizontal size={15} /> Reset filters</button></div>
                <div className="queue-controls"><label className="queue-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reference, subject, name..." aria-label="Search complaints" /><kbd>⌘ K</kbd></label><label className="status-filter"><Filter size={15} /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status"><option>All statuses</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label></div>
                <div className="table-scroll"><table className="complaints-table"><thead><tr><th scope="col">COMPLAINT</th><th scope="col">CATEGORY</th><th scope="col">STATUS</th><th scope="col">PRIORITY</th><th scope="col">ASSIGNED TO</th><th scope="col">SUBMITTED</th><th><span className="sr-only">Open details</span></th></tr></thead><tbody>
                  {filteredComplaints.map((complaint) => <tr key={complaint.id} onClick={() => openComplaint(complaint)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openComplaint(complaint); }}>
                    <td><div className="complaint-cell"><span className="complaint-type-icon"><FileText size={15} /></span><span><strong>{complaint.subject}</strong><small>{complaint.reference} <i /> {complaint.name}</small></span></div></td><td>{complaint.category}</td><td><StatusBadge status={complaint.status} /></td><td><span className={`priority priority-${complaint.priority.toLowerCase()}`}><i />{complaint.priority}</span></td><td>{complaint.assignedTo}</td><td>{formatDate(complaint.submittedAt)}</td><td><ArrowRight size={15} className="row-arrow" /></td>
                  </tr>)}
                </tbody></table></div>
                {filteredComplaints.length === 0 && <div className="table-empty"><span><Search size={19} /></span><strong>No complaints match those filters.</strong><p>Try a different search term or status.</p></div>}
                <div className="queue-footer"><span>Showing <strong>{filteredComplaints.length}</strong> of <strong>{complaints.length}</strong> complaints</span><span>Updated just now <i /></span></div>
              </section>
              <p className="dashboard-footnote"><ShieldCheck size={14} /> Complainant names and contact details are visible only in this staff demo view. Public tracking never displays them.</p>
            </section>
          )}

          {page === "detail" && canAccessStaff && selectedComplaint && (
            <section className="detail-page">
              <button className="back-link" onClick={() => navigate("dashboard")}><ArrowLeft size={16} /> Back to complaints</button>
              <div className="detail-heading"><div><span className="case-reference">{selectedComplaint.reference}</span><h1>{selectedComplaint.subject}</h1><p>Submitted {formatDate(selectedComplaint.submittedAt, true)} by <strong>{selectedComplaint.name}</strong> · <a href={`mailto:${selectedComplaint.email}`}>{selectedComplaint.email}</a></p></div><StatusBadge status={selectedComplaint.status} /></div>
              <div className="detail-layout">
                <div className="detail-main">
                  <article className="detail-card panel"><div className="detail-card-heading"><h2>Complaint summary</h2><span className={`priority priority-${selectedComplaint.priority.toLowerCase()}`}><i />{selectedComplaint.priority} priority</span></div><div className="detail-category">{selectedComplaint.category}</div><p className="detail-description">{selectedComplaint.description}</p>{selectedComplaint.attachments.length > 0 && <div className="attachment-list"><strong>Attachments</strong>{selectedComplaint.attachments.map((file) => <span key={file}><FileText size={14} />{file}<small>Demo filename only</small></span>)}</div>}</article>
                  <article className="detail-card panel"><div className="detail-card-heading"><h2>Progress updates</h2><span>{selectedComplaint.updates.length}</span></div><ol className="timeline detail-timeline">{selectedComplaint.updates.map((update, index) => <li key={`${update.date}-${index}`}><span className={`timeline-marker ${index === 0 ? "timeline-first" : ""}`}><Check size={12} /></span><div><div className="timeline-title-row"><strong>{update.title}</strong><time>{formatDate(update.date, true)}</time></div><p>{update.detail}</p><small className={update.public ? "visibility-public" : "visibility-internal"}>{update.public ? "Visible to complainant" : "Internal note"}</small></div></li>)}</ol></article>
                  <article className="detail-card panel"><div className="detail-card-heading"><h2>Internal notes</h2><span className="private-label"><ShieldCheck size={13} /> STAFF ONLY</span></div>{selectedComplaint.internalNotes.length > 0 ? <ul className="internal-note-list">{selectedComplaint.internalNotes.map((note, index) => <li key={index}>{note}</li>)}</ul> : <p className="no-notes">No internal notes yet. Notes are not visible to the complainant.</p>}<form className="note-form" onSubmit={addInternalNote}><label className="sr-only" htmlFor="internal-note">Add an internal note</label><textarea id="internal-note" rows={3} value={newInternalNote} onChange={(event) => setNewInternalNote(event.target.value)} placeholder="Write a note for staff only..." maxLength={1000} /><button className="button button-dark" type="submit" disabled={!newInternalNote.trim()}>Add note</button></form></article>
                </div>
                <aside className="detail-sidebar panel"><h2>Case controls</h2><label className="control-label">STATUS<select value={selectedComplaint.status} onChange={(event) => changeStatus(event.target.value as Status)}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label><label className="control-label">PRIORITY<select value={selectedComplaint.priority} onChange={changePriority}>{(["Low", "Medium", "High", "Urgent"] as Priority[]).map((priority) => <option key={priority}>{priority}</option>)}</select></label><label className="control-label">ASSIGNED DEPARTMENT<select value={selectedComplaint.department} onChange={(event) => updateComplaint({ department: event.target.value })}>{DEPARTMENTS.map((department) => <option key={department}>{department}</option>)}</select></label><label className="control-label">ASSIGNED TO<select value={selectedComplaint.assignedTo} onChange={assignComplaint}><option>Unassigned</option>{["Maya Chen", "Noah Patel", "Avery Kim", "Jamie Park", "Morgan Bell"].map((name) => <option key={name}>{name}</option>)}</select></label><div className="control-separator" /><div className="control-meta"><span>REFERENCE</span><strong>{selectedComplaint.reference}</strong></div><div className="control-meta"><span>SUBMITTED</span><strong>{formatDate(selectedComplaint.submittedAt)}</strong></div>{selectedComplaint.resolution && <div className="resolution-box"><strong>Resolution details</strong><p>{selectedComplaint.resolution}</p></div>}<label className="control-label resolution-input">RESOLUTION DETAILS<textarea rows={3} maxLength={1000} placeholder="Record the outcome..." value={selectedComplaint.resolution} onChange={(event) => updateComplaint({ resolution: event.target.value })} /><small>Visible to staff. Add a public status update when resolved.</small></label></aside>
              </div>
            </section>
          )}

          {(page === "dashboard" && !canAccessStaff || page === "detail" && (!canAccessStaff || !selectedComplaint)) && <div className="empty-state panel"><span><ShieldCheck size={22} /></span><h2>Staff view unavailable</h2><p>Switch to a staff or admin demo role to access complaint management tools.</p><button className="button button-dark" onClick={() => navigate("home")}>Return to overview</button></div>}
        </main>
        <footer className="app-footer"><span>© 2026 Clearline <i /> Built for better conversations.</span><span><ShieldCheck size={13} /> DEMO PROTOTYPE — NOT A LIVE SERVICE</span></footer>
      </div>
      {mobileNavOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      {toast && <div className="toast" role="status"><CheckCircle2 size={17} />{toast}<button aria-label="Dismiss notification" onClick={() => setToast("")}><X size={15} /></button></div>}
    </div>
  );
}

export default App;
