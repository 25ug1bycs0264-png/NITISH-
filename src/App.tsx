import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Mail,
  MapPin,
  Menu,
  Microscope,
  Phone,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";

const officialSite = "https://bmsit.ac.in";

const navigation = [
  { href: "#about", label: "About" },
  { href: "#academics", label: "Academics" },
  { href: "#admissions", label: "Admissions" },
  { href: "#campus-life", label: "Campus life" },
  { href: "#news", label: "News & events" },
  { href: "#contact", label: "Contact" },
];

const departmentCards = [
  {
    number: "01",
    title: "Computer Science & Engineering",
    description: "Explore the department and current course information on the official BMSIT&M website.",
    icon: BookOpen,
  },
  {
    number: "02",
    title: "Information Science & Engineering",
    description: "Find current program details, curriculum and department updates from the institution.",
    icon: Sparkles,
  },
  {
    number: "03",
    title: "Artificial Intelligence & Machine Learning",
    description: "Visit the official department page for an overview of AI & ML at BMSIT&M.",
    icon: Microscope,
  },
];

const eventCards = [
  {
    category: "SAMPLE · PLACEHOLDER",
    title: "Campus event announcement",
    description: "Replace this card with a verified event announcement and details from an official source.",
    date: "Date to be confirmed",
    icon: CalendarDays,
  },
  {
    category: "SAMPLE · PLACEHOLDER",
    title: "Student achievement",
    description: "Add a current student or faculty achievement here after confirming the details.",
    date: "Details to be confirmed",
    icon: Sparkles,
  },
  {
    category: "SAMPLE · PLACEHOLDER",
    title: "Admissions update",
    description: "Check official admissions notices before publishing dates, deadlines or requirements.",
    date: "Check official notices",
    icon: GraduationCap,
  },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [formMessage, setFormMessage] = useState("");

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const submitContactForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    const subject = encodeURIComponent(`Website enquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:principal@bmsit.in?subject=${subject}&body=${body}`;
    setFormMessage("Your email app should open with this message ready to send.");
  };

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="header-inner page-width">
          <a className="brand" href="#home" aria-label="BMS Institute of Technology and Management home">
            <span className="brand-mark" aria-hidden="true">BMS</span>
            <span className="brand-copy">
              <strong>BMSIT&amp;M</strong>
              <span>INSTITUTE OF TECHNOLOGY &amp; MANAGEMENT</span>
            </span>
          </a>
          <button
            type="button"
            className="menu-toggle"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
          <nav id="primary-navigation" className={`primary-navigation ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
            {navigation.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>
            ))}
            <a className="nav-cta" href="#admissions" onClick={() => setMenuOpen(false)}>
              Explore admissions <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section className="hero" id="home" aria-labelledby="hero-title">
          <img
            className="hero-image"
            src={`${officialSite}/img/slider/BMS-main-banner-2.jpg`}
            alt="Engineering college banner from the official BMSIT&M homepage"
            fetchPriority="high"
          />
          <div className="hero-shade" />
          <div className="hero-content page-width">
            <p className="eyebrow eyebrow-light"><span /> LEARN · DISCOVER · LEAD</p>
            <h1 id="hero-title">A legacy of learning.<br /><em>A future of discovery.</em></h1>
            <p className="hero-intro">Welcome to BMS Institute of Technology &amp; Management, where learning opens new possibilities.</p>
            <div className="hero-actions">
              <a className="button button-gold" href="#academics">Explore academics <ArrowRight size={17} /></a>
              <a className="button button-glass" href="#about">Discover BMSIT&amp;M <ArrowDown size={16} /></a>
            </div>
            <p className="hero-source">An institution under BMS Educational Trust · Established in 2002</p>
          </div>
          <a className="hero-scroll" href="#about" aria-label="Scroll to about BMSIT&M"><span /> Scroll to explore</a>
          <div className="hero-index" aria-hidden="true"><span>01</span> / 06</div>
        </section>

        <section className="intro-section section-space" id="about" aria-labelledby="about-title">
          <div className="page-width intro-grid">
            <div className="intro-heading">
              <p className="eyebrow">ABOUT BMSIT&amp;M</p>
              <h2 id="about-title">Rooted in a remarkable legacy.</h2>
              <span className="gold-rule" />
            </div>
            <div className="intro-copy">
              <p className="lead">Established in 2002, BMS Institute of Technology &amp; Management is part of the BMS Educational Trust, founded by Sri B. M. Sreenivasaiah and Sri B. S. Narayan.</p>
              <p>The BMS educational legacy began with a commitment to technical education. Today, BMSIT&amp;M focuses on high-quality academic instruction, innovation and industry–institute interface.</p>
              <a className="text-link" href={`${officialSite}/our-founders.php`} target="_blank" rel="noreferrer">
                Read the official history <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
          <div className="page-width values-grid">
            <article className="value-card">
              <span className="value-icon"><Landmark size={21} /></span>
              <p className="eyebrow">OUR VISION</p>
              <h3>Professionals with purpose.</h3>
              <p>To emerge as one of the finest technical institutions of higher learning, developing engineering professionals who are technically competent, ethical and environment friendly for the betterment of society.</p>
            </article>
            <article className="value-card value-card-dark">
              <span className="value-icon"><Sparkles size={21} /></span>
              <p className="eyebrow eyebrow-light">OUR MISSION</p>
              <h3>Learning that moves us forward.</h3>
              <p>Accomplish a stimulating learning environment through high-quality academic instruction, innovation and industry–institute interface.</p>
            </article>
            <article className="value-card value-card-campus">
              <span className="value-icon"><Building2 size={21} /></span>
              <p className="eyebrow">THE CAMPUS</p>
              <h3>Space to learn and grow.</h3>
              <p>The official website describes a 21+ acre campus. Confirm current facilities and visitor information through BMSIT&amp;M before planning a visit.</p>
            </article>
          </div>
          <div className="page-width source-note">
            <Check size={15} aria-hidden="true" />
            <span>Institutional history, vision and mission verified against the <a href={`${officialSite}/our-founders.php`} target="_blank" rel="noreferrer">official BMSIT&amp;M history page</a>.</span>
          </div>
        </section>

        <section className="academics-section section-space" id="academics" aria-labelledby="academics-title">
          <div className="page-width">
            <div className="section-heading section-heading-row">
              <div>
                <p className="eyebrow">LEARN WITH PURPOSE</p>
                <h2 id="academics-title">Find your field of possibility.</h2>
              </div>
              <p>Explore department and program information through official BMSIT&amp;M pages. Offerings and course details may change.</p>
            </div>
            <div className="department-grid">
              {departmentCards.map(({ number, title, description, icon: Icon }, index) => (
                <article className="department-card" key={title}>
                  <div className="department-topline"><span>{number}</span><Icon size={22} strokeWidth={1.6} /></div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <a
                    className="card-link"
                    href={index === 2 ? `${officialSite}/departments.php` : `${officialSite}/admissions.php`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`View official information for ${title}`}
                  >
                    Course details <ArrowUpRight size={15} />
                  </a>
                </article>
              ))}
            </div>
            <div className="program-strip">
              <div className="program-strip-icon"><GraduationCap size={24} /></div>
              <div>
                <p className="eyebrow">PROGRAM PATHWAYS</p>
                <h3>Undergraduate · Postgraduate · Ph.D.</h3>
              </div>
              <p>Confirm current programs, eligibility and availability on the official admissions page.</p>
              <a className="round-link" href={`${officialSite}/admissions.php`} target="_blank" rel="noreferrer" aria-label="Explore official program pathways"><ArrowUpRight size={19} /></a>
            </div>
          </div>
        </section>

        <section className="admissions-section section-space" id="admissions" aria-labelledby="admissions-title">
          <div className="page-width admissions-layout">
            <div className="admissions-intro">
              <p className="eyebrow eyebrow-light">YOUR NEXT CHAPTER</p>
              <h2 id="admissions-title">Take the first step.</h2>
              <p>Start with the official admissions information. Requirements vary by program and admission route.</p>
              <a className="button button-gold" href={`${officialSite}/admissions.php`} target="_blank" rel="noreferrer">
                Visit official admissions <ArrowUpRight size={16} />
              </a>
              <p className="admissions-disclaimer">Important: dates, eligibility and required documents can change. Always verify the latest details with BMSIT&amp;M and the relevant official admission authority before applying.</p>
            </div>
            <div className="admissions-steps">
              {[
                ["01", "Choose a program", "Review the current program options and their official course pages."],
                ["02", "Check eligibility", "Confirm the current criteria for your program and admission category."],
                ["03", "Review the process", "Follow the application instructions and notices from the relevant official authority."],
                ["04", "Confirm dates & documents", "Check current deadlines and required documents before submitting an application."],
              ].map(([number, title, description]) => (
                <article className="admission-step" key={number}>
                  <span>{number}</span>
                  <div><h3>{title}</h3><p>{description}</p></div>
                  <ChevronRight size={18} aria-hidden="true" />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="campus-section section-space" id="campus-life" aria-labelledby="campus-title">
          <div className="page-width">
            <div className="section-heading section-heading-row">
              <div>
                <p className="eyebrow">BEYOND THE CLASSROOM</p>
                <h2 id="campus-title">Make room for what inspires you.</h2>
              </div>
              <p>The official site highlights clubs, cultural fests, student initiatives and research. Confirm specific facilities and activities through the college.</p>
            </div>
            <div className="campus-grid">
              <article className="campus-feature">
                <img
                  src={`${officialSite}/img/home-excellence-img-1.jpg`}
                  alt="Image accompanying undergraduate program information on the official BMSIT&M website"
                  loading="lazy"
                />
                <div className="campus-feature-shade" />
                <div className="campus-feature-copy">
                  <span className="image-caption">OFFICIAL BMSIT&amp;M WEBSITE IMAGE</span>
                  <h3>A campus for curious minds.</h3>
                  <p>Explore current campus information and student initiatives through official college channels.</p>
                  <a className="button button-light" href={officialSite} target="_blank" rel="noreferrer">Explore the official site <ArrowUpRight size={15} /></a>
                </div>
              </article>
              <div className="campus-tiles">
                <article className="campus-tile">
                  <span><UsersRound size={20} /></span>
                  <div><p className="eyebrow">STUDENT LIFE</p><h3>Clubs &amp; initiatives</h3><p>Official site references active clubs and student initiatives. Club names are not listed here until verified.</p></div>
                </article>
                <article className="campus-tile">
                  <span><CalendarDays size={20} /></span>
                  <div><p className="eyebrow">CAMPUS CALENDAR</p><h3>Events &amp; activities</h3><p>Check the official calendar for current event dates, updates and participation details.</p></div>
                </article>
                <article className="campus-tile">
                  <span><HeartHandshake size={20} /></span>
                  <div><p className="eyebrow">CAMPUS SPACES</p><h3>Facilities &amp; research</h3><p>See official campus information for verified facility descriptions and visiting guidance.</p></div>
                </article>
              </div>
            </div>
            <div className="campus-links">
              <a href={`${officialSite}/circular.php#calendar`} target="_blank" rel="noreferrer">Official calendar of events <ArrowUpRight size={15} /></a>
              <a href={`${officialSite}/departments.php`} target="_blank" rel="noreferrer">Department research &amp; student activities <ArrowUpRight size={15} /></a>
            </div>
          </div>
        </section>

        <section className="news-section section-space" id="news" aria-labelledby="news-title">
          <div className="page-width">
            <div className="section-heading section-heading-row">
              <div>
                <p className="eyebrow">FROM THE CAMPUS</p>
                <h2 id="news-title">News &amp; events.</h2>
              </div>
              <span className="placeholder-banner">SAMPLE CONTENT · REPLACE WITH VERIFIED UPDATES</span>
            </div>
            <div className="news-grid">
              {eventCards.map(({ category, title, description, date, icon: Icon }) => (
                <article className="news-card" key={title}>
                  <div className="news-card-top"><span className="placeholder-tag">{category}</span><Icon size={21} strokeWidth={1.6} /></div>
                  <p className="news-date">{date}</p>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <a className="card-link" href={`${officialSite}/circular.php#calendar`} target="_blank" rel="noreferrer">Check official notices <ArrowUpRight size={15} /></a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="contact-section section-space" id="contact" aria-labelledby="contact-title">
          <div className="page-width">
            <div className="section-heading">
              <p className="eyebrow">WE’RE HERE TO HELP</p>
              <h2 id="contact-title">Get in touch.</h2>
            </div>
            <div className="contact-layout">
              <div className="contact-details">
                <p className="contact-lead">For the latest information and enquiries, contact BMSIT&amp;M using the official details below.</p>
                <div className="contact-item">
                  <span><MapPin size={19} /></span>
                  <div><strong>Visit us</strong><p>BMS Institute of Technology &amp; Management<br />Doddaballapur Main Road, Avalahalli, Yelahanka,<br />Bengaluru – 560119, Karnataka, India</p></div>
                </div>
                <div className="contact-item">
                  <span><Phone size={19} /></span>
                  <div><strong>Admissions enquiries</strong><p><a href="tel:+918026146800">080-26146800</a><br /><a href="tel:+918026146829">080-26146829</a><br /><a href="tel:+918026146856">080-26146856</a></p></div>
                </div>
                <div className="contact-item">
                  <span><Mail size={19} /></span>
                  <div><strong>Email</strong><p><a href="mailto:principal@bmsit.in">principal@bmsit.in</a></p></div>
                </div>
                <a className="official-contact-link" href={`${officialSite}/contact-details.php`} target="_blank" rel="noreferrer">
                  Verify contact details on the official site <ArrowUpRight size={15} />
                </a>
              </div>
              <div className="contact-side">
                <div className="map-placeholder">
                  <div className="map-lines" aria-hidden="true" />
                  <div className="map-marker"><MapPin size={22} /></div>
                  <div className="map-label"><strong>BMSIT&amp;M</strong><span>Map preview placeholder</span></div>
                  <a href="https://maps.google.com/?q=BMS+Institute+of+Technology+and+Management+Bengaluru" target="_blank" rel="noreferrer" aria-label="Search for BMS Institute of Technology and Management on Google Maps">Open map <ArrowUpRight size={14} /></a>
                </div>
                <form className="contact-form" onSubmit={submitContactForm}>
                  <div className="form-heading"><div><p className="eyebrow">SEND AN ENQUIRY</p><h3>How can we help?</h3></div><Mail size={21} /></div>
                  <label htmlFor="contact-name">Your name</label>
                  <input id="contact-name" name="name" autoComplete="name" required maxLength={100} placeholder="Enter your name" />
                  <label htmlFor="contact-email">Email address</label>
                  <input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" />
                  <label htmlFor="contact-message">Your message</label>
                  <textarea id="contact-message" name="message" required maxLength={2000} rows={3} placeholder="Write your enquiry" />
                  <button className="button button-navy" type="submit">Open email draft <ArrowRight size={16} /></button>
                  <p className="form-note">This form opens your email app; it does not send or store your message on this website.</p>
                  {formMessage && <p className="form-status" role="status">{formMessage}</p>}
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-width footer-main">
          <div className="footer-about">
            <a className="brand brand-footer" href="#home" aria-label="Back to BMSIT&M home">
              <span className="brand-mark" aria-hidden="true">BMS</span>
              <span className="brand-copy"><strong>BMSIT&amp;M</strong><span>INSTITUTE OF TECHNOLOGY &amp; MANAGEMENT</span></span>
            </a>
            <p>Learning, discovery and possibilities at BMS Institute of Technology &amp; Management.</p>
            <a className="footer-official" href={officialSite} target="_blank" rel="noreferrer">Official BMSIT&amp;M website <ArrowUpRight size={14} /></a>
          </div>
          <div className="footer-column">
            <h2>Explore</h2>
            {navigation.slice(0, 4).map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
          </div>
          <div className="footer-column">
            <h2>Useful links</h2>
            <a href={`${officialSite}/admissions.php`} target="_blank" rel="noreferrer">Official admissions <ArrowUpRight size={13} /></a>
            <a href={`${officialSite}/our-founders.php`} target="_blank" rel="noreferrer">History, vision &amp; mission <ArrowUpRight size={13} /></a>
            <a href={`${officialSite}/contact-details.php`} target="_blank" rel="noreferrer">Official contact details <ArrowUpRight size={13} /></a>
          </div>
          <div className="footer-column footer-contact">
            <h2>Contact</h2>
            <p>Doddaballapur Main Road,<br />Avalahalli, Yelahanka,<br />Bengaluru – 560119</p>
            <a href="tel:+918026146800">080-26146800</a>
            <a href="mailto:principal@bmsit.in">principal@bmsit.in</a>
          </div>
          <div className="footer-column footer-social">
            <h2>Social</h2>
            <p>Social profile links are placeholders until verified official accounts are confirmed.</p>
            <span>Instagram · placeholder</span>
            <span>LinkedIn · placeholder</span>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="page-width footer-bottom-inner">
            <span>© {new Date().getFullYear()} BMSIT&amp;M website concept.</span>
            <span>Verify current institutional information on <a href={officialSite} target="_blank" rel="noreferrer">bmsit.ac.in</a>.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
