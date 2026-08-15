import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

/*
============================================================
 EVENTBOOK
 Premium Navy + Blue Event Booking Application

 FEATURES
 -----------------------------------------------------------
 • Home page
 • Portrait event flyer slider
 • View Event
 • Book Now
 • Registration
 • Proof of Payment upload
 • Admin dashboard
 • View proof directly in browser
 • Export registrations to CSV
 • Print registrations
 • Social media sharing
 • Event creation
 • Event deletion
 • localStorage persistence

 MVP NOTE
 -----------------------------------------------------------
 This version stores information in localStorage.

 For production:
 - Use a database
 - Use real authentication
 - Store uploaded files on a server/cloud
============================================================
*/


// ============================================================
// CONFIGURATION
// ============================================================

const STORAGE = {
  EVENTS: "eventbook_events",
  REGISTRATIONS: "eventbook_registrations",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const PROOF_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

const FLYER_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];


// ============================================================
// INITIAL EVENTS
// ============================================================

const INITIAL_EVENTS = [
  {
    id: "event-1",
    name: "Tabby Youth Empowerment Event",
    date: "2026-09-12",
    time: "10:00 AM",
    venue: "Cape Town",
    capacity: 200,

    description:
      "The Tabby Youth Empowerment Event is designed to inspire, support and empower young people through motivation, networking, skills development and meaningful conversations about their future.",

    paymentInfo:
      "Please make payment using the official payment details provided by the event organiser.",

    flyer: "",
  },

  {
    id: "event-2",
    name: "Business Networking Day",
    date: "2026-10-03",
    time: "09:00 AM",
    venue: "Cape Town",
    capacity: 100,

    description:
      "A networking event bringing entrepreneurs, professionals and business-minded people together to create meaningful connections and explore opportunities.",

    paymentInfo:
      "Please make payment using the official payment details provided by the event organiser.",

    flyer: "",
  },
];


// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function createId(prefix = "id") {
  return (
    prefix +
    "-" +
    Date.now() +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}


function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);

    return saved
      ? JSON.parse(saved)
      : fallback;
  } catch {
    return fallback;
  }
}


function writeStorage(key, value) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  } catch (error) {
    console.error(error);
  }
}


function formatDate(dateString) {
  if (!dateString) return "";

  const date =
    new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString(
    "en-ZA",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}


function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () =>
      resolve(reader.result);

    reader.onerror = () =>
      reject(
        new Error("Could not read file")
      );

    reader.readAsDataURL(file);
  });
}


function csvValue(value) {
  return `"${String(value ?? "")
    .replaceAll('"', '""')}"`;
}


function downloadCSV(filename, content) {
  const blob = new Blob(
    [content],
    {
      type:
        "text/csv;charset=utf-8;",
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}


// ============================================================
// SOCIAL SHARING
// ============================================================

async function shareEvent(event) {
  const url =
    `${window.location.origin}${window.location.pathname}?event=${event.id}`;

  const text =
    `${event.name} — ${formatDate(event.date)} — ${event.venue}`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: event.name,
        text,
        url,
      });

      return;
    }

    await navigator.clipboard.writeText(
      `${text}\n${url}`
    );

    alert(
      "Event link copied to clipboard."
    );

  } catch {
    // User cancelled sharing.
  }
}


function socialShare(platform, event) {
  const url =
    `${window.location.origin}${window.location.pathname}?event=${event.id}`;

  const text =
    `${event.name} — ${formatDate(event.date)} — ${event.venue}`;

  const links = {
    whatsapp:
      `https://wa.me/?text=${encodeURIComponent(
        `${text}\n${url}`
      )}`,

    facebook:
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url
      )}`,

    x:
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text
      )}&url=${encodeURIComponent(url)}`,

    linkedin:
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        url
      )}`,
  };

  if (links[platform]) {
    window.open(
      links[platform],
      "_blank",
      "noopener,noreferrer,width=700,height=650"
    );
  }
}


// ============================================================
// ICON COMPONENT
// ============================================================

function Icon({ name, size = 20 }) {

  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };


  const icons = {

    calendar: (
      <>
        <rect
          x="3"
          y="4"
          width="18"
          height="17"
          rx="2"
        />
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <path d="M3 9h18" />
        <path d="m9 15 2 2 4-4" />
      </>
    ),

    user: (
      <>
        <circle
          cx="12"
          cy="7"
          r="3.5"
        />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>
    ),

    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="3.5" />
        <path d="M17 11a3 3 0 1 0 0-6" />
        <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
      </>
    ),

    shield: (
      <path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z" />
    ),

    upload: (
      <>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 20h14" />
      </>
    ),

    eye: (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),

    share: (
      <>
        <circle cx="18" cy="5" r="2.5" />
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="19" r="2.5" />
        <path d="m8.2 10.8 7.5-4.3" />
        <path d="m8.2 13.2 7.5 4.3" />
      </>
    ),

    search: (
      <>
        <circle
          cx="10.8"
          cy="10.8"
          r="6.8"
        />
        <path d="m16 16 5 5" />
      </>
    ),

    pin: (
      <>
        <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
        <circle
          cx="12"
          cy="10"
          r="2.3"
        />
      </>
    ),

    clock: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />
        <path d="M12 7v5l3 2" />
      </>
    ),

    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),

    left: (
      <path d="m15 18-6-6 6-6" />
    ),

    right: (
      <path d="m9 18 6-6-6-6" />
    ),

    close: (
      <>
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
      </>
    ),

    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),

    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),

    logout: (
      <>
        <path d="M10 5H5v14h5" />
        <path d="m14 8 4 4-4 4" />
        <path d="M18 12H9" />
      </>
    ),

    phone: (
      <path d="M6.5 3.5h3l1.2 4-2 1.5a15 15 0 0 0 6.3 6.3l1.5-2 4 1.2v3c0 1.1-.9 2-2 2C10 19.5 4.5 14 4.5 5.5c0-1.1.9-2 2-2Z" />
    ),

    mail: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
        />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
  };


  return (
    <svg {...props}>
      {icons[name]}
    </svg>
  );
}


// ============================================================
// MAIN APP
// ============================================================

function App() {

  const [page, setPage] =
    useState("home");

  const [events, setEvents] =
    useState(() =>
      readStorage(
        STORAGE.EVENTS,
        INITIAL_EVENTS
      )
    );

  const [registrations, setRegistrations] =
    useState(() =>
      readStorage(
        STORAGE.REGISTRATIONS,
        []
      )
    );

  const [detailsEvent, setDetailsEvent] =
    useState(null);

  const [bookingEvent, setBookingEvent] =
    useState(null);

  const [proof, setProof] =
    useState(null);

  const [createOpen, setCreateOpen] =
    useState(false);

  const [admin, setAdmin] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [mobileMenu, setMobileMenu] =
    useState(false);


  // ----------------------------------------------------------
  // SAVE EVENTS
  // ----------------------------------------------------------

  useEffect(() => {
    writeStorage(
      STORAGE.EVENTS,
      events
    );
  }, [events]);


  // ----------------------------------------------------------
  // SAVE REGISTRATIONS
  // ----------------------------------------------------------

  useEffect(() => {
    writeStorage(
      STORAGE.REGISTRATIONS,
      registrations
    );
  }, [registrations]);


  // ----------------------------------------------------------
  // OPEN EVENT FROM SHARED URL
  // ----------------------------------------------------------

  useEffect(() => {

    const id =
      new URLSearchParams(
        window.location.search
      ).get("event");

    if (!id) return;

    const event =
      events.find(
        item => item.id === id
      );

    if (event) {
      setDetailsEvent(event);
    }

  }, [events]);


  // ----------------------------------------------------------
  // REGISTRATION COUNTS
  // ----------------------------------------------------------

  const counts = useMemo(() => {

    const result = {};

    registrations.forEach(
      registration => {

        result[
          registration.eventId
        ] =
          (
            result[
              registration.eventId
            ] || 0
          ) +
          Number(
            registration.quantity || 1
          );

      }
    );

    return result;

  }, [registrations]);


  // ----------------------------------------------------------
  // REMAINING PLACES
  // ----------------------------------------------------------

  function remaining(event) {

    return Math.max(
      0,
      Number(event.capacity) -
      (counts[event.id] || 0)
    );

  }


  // ----------------------------------------------------------
  // PAGE NAVIGATION
  // ----------------------------------------------------------

  function goTo(pageName) {

    setPage(pageName);

    setMobileMenu(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  }


  // ==========================================================
  // ADMIN LOGIN
  // ==========================================================

  function adminLogin() {

    const password =
      window.prompt(
        "Enter admin password:"
      );

    if (
      password === "admin123"
    ) {

      setAdmin(true);

      goTo("admin");

    } else if (
      password !== null
    ) {

      alert(
        "Incorrect password."
      );

    }

  }


  // ==========================================================
  // CREATE EVENT
  // ==========================================================

  async function createEvent(data) {

    const event = {

      ...data,

      id:
        createId("event"),

      capacity:
        Number(data.capacity),

      flyer:
        "",

    };


    if (data.flyerFile) {

      if (
        !FLYER_TYPES.includes(
          data.flyerFile.type
        )
      ) {

        alert(
          "Flyer must be JPG, PNG or WEBP."
        );

        return;

      }


      if (
        data.flyerFile.size >
        MAX_FILE_SIZE
      ) {

        alert(
          "Flyer must be 5 MB or smaller."
        );

        return;

      }


      event.flyer =
        await fileToDataUrl(
          data.flyerFile
        );

    }


    delete event.flyerFile;


    setEvents(
      old => [
        event,
        ...old,
      ]
    );


    setCreateOpen(false);

  }


  // ==========================================================
  // BOOK EVENT
  // ==========================================================

  async function bookEvent(data) {

    if (!bookingEvent) return;


    const quantity =
      Number(data.quantity);

    const available =
      remaining(
        bookingEvent
      );


    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > available
    ) {

      alert(
        `Only ${available} place(s) remain.`
      );

      return;

    }


    if (!data.proofFile) {

      alert(
        "Please upload proof of payment."
      );

      return;

    }


    if (
      !PROOF_TYPES.includes(
        data.proofFile.type
      )
    ) {

      alert(
        "Proof must be PDF, JPG, JPEG or PNG."
      );

      return;

    }


    if (
      data.proofFile.size >
      MAX_FILE_SIZE
    ) {

      alert(
        "Proof must be 5 MB or smaller."
      );

      return;

    }


    const proofData =
      await fileToDataUrl(
        data.proofFile
      );


    const registration = {

      id:
        createId(
          "registration"
        ),

      eventId:
        bookingEvent.id,

      eventName:
        bookingEvent.name,

      fullName:
        data.name.trim(),

      phone:
        data.phone.trim(),

      email:
        data.email.trim(),

      quantity,

      paymentReference:
        data.paymentReference.trim(),

      proofFileName:
        data.proofFile.name,

      proofFileType:
        data.proofFile.type,

      proofData,

      registeredAt:
        new Date().toISOString(),

    };


    setRegistrations(
      old => [
        ...old,
        registration,
      ]
    );


    setBookingEvent(null);


    alert(
      "Registration completed successfully."
    );

  }


  // ==========================================================
  // DELETE EVENT
  // ==========================================================

  function deleteEvent(id) {

    const event =
      events.find(
        item => item.id === id
      );

    if (!event) return;


    if (
      !window.confirm(
        `Delete "${event.name}"?`
      )
    ) {

      return;

    }


    setEvents(
      old =>
        old.filter(
          item => item.id !== id
        )
    );


    setRegistrations(
      old =>
        old.filter(
          item =>
            item.eventId !== id
        )
    );

  }


  // ==========================================================
  // EXPORT
  // ==========================================================

  function exportRegistrations() {

    if (
      registrations.length === 0
    ) {

      alert(
        "There are no registrations."
      );

      return;

    }


    const headers = [

      "Event",

      "Full Name",

      "Phone",

      "Email",

      "Number of People",

      "Payment Reference",

      "Proof File",

      "Registration Date",

    ];


    const rows =
      registrations.map(
        r => [

          r.eventName,

          r.fullName,

          r.phone,

          r.email,

          r.quantity,

          r.paymentReference,

          r.proofFileName,

          new Date(
            r.registeredAt
          ).toLocaleString(
            "en-ZA"
          ),

        ]
      );


    const csv = [

      headers
        .map(csvValue)
        .join(","),

      ...rows.map(
        row =>
          row
            .map(csvValue)
            .join(",")
      ),

    ].join("\n");


    downloadCSV(
      "eventbook-registrations.csv",
      csv
    );

  }


  // ==========================================================
  // FILTER EVENTS
  // ==========================================================

  const filteredEvents =
    useMemo(() => {

      const term =
        search
          .trim()
          .toLowerCase();


      if (!term) {
        return events;
      }


      return events.filter(
        event =>
          event.name
            .toLowerCase()
            .includes(term) ||

          event.venue
            .toLowerCase()
            .includes(term)
      );

    }, [
      events,
      search,
    ]);


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="app">

      {/* HEADER */}

      <header className="topbar">

        <div className="nav-inner">

          <button
            className="brand"
            onClick={() =>
              goTo("home")
            }
          >

            <span className="brand-icon">

              <Icon
                name="calendar"
                size={31}
              />

            </span>


            <span>

              <strong>
                Event<span>Book</span>
              </strong>

              <small>
                Simple event registration
              </small>

            </span>

          </button>


          <nav
            className={
              mobileMenu
                ? "main-nav open"
                : "main-nav"
            }
          >

            <button
              className={
                page === "home"
                  ? "active"
                  : ""
              }
              onClick={() =>
                goTo("home")
              }
            >
              Home
            </button>


            <button
              className={
                page === "events"
                  ? "active"
                  : ""
              }
              onClick={() =>
                goTo("events")
              }
            >
              Events
            </button>


            <button
              className={
                page === "admin"
                  ? "active"
                  : ""
              }
              onClick={() =>
                admin
                  ? goTo("admin")
                  : adminLogin()
              }
            >
              Admin
            </button>

          </nav>


          <button
            className="admin-login"
            onClick={() =>
              admin
                ? goTo("admin")
                : adminLogin()
            }
          >

            <Icon
              name="user"
              size={18}
            />

            {admin
              ? "Admin Dashboard"
              : "Admin Login"}

          </button>


          <button
            className="mobile-menu"
            onClick={() =>
              setMobileMenu(
                old => !old
              )
            }
          >

            <Icon name="menu" />

          </button>

        </div>

      </header>


      {/* MAIN */}

      <main>


        {page === "home" && (

          <Home

            events={events}

            remaining={remaining}

            onView={
              event =>
                setDetailsEvent(event)
            }

            onBook={
              event =>
                setBookingEvent(event)
            }

            onEvents={() =>
              goTo("events")
            }

          />

        )}


        {page === "events" && (

          <section className="page-section">

            <div className="section-heading">

              <div>

                <p className="eyebrow">
                  UPCOMING EVENTS
                </p>

                <h2>
                  Find your next event.
                </h2>

                <p>
                  Browse events, view the details
                  and reserve your place.
                </p>

              </div>


              <label className="search-box">

                <Icon name="search" />

                <input

                  value={search}

                  onChange={e =>
                    setSearch(
                      e.target.value
                    )
                  }

                  placeholder="Search events..."

                />

              </label>

            </div>


            <EventList

              events={
                filteredEvents
              }

              remaining={
                remaining
              }

              onView={
                event =>
                  setDetailsEvent(event)
              }

              onBook={
                event =>
                  setBookingEvent(event)
              }

              onShare={
                shareEvent
              }

            />

          </section>

        )}


        {page === "admin" &&
          admin && (

            <Admin

              events={events}

              registrations={
                registrations
              }

              remaining={
                remaining
              }

              onCreate={() =>
                setCreateOpen(true)
              }

              onDelete={
                deleteEvent
              }

              onView={
                event =>
                  setDetailsEvent(event)
              }

              onProof={
                item =>
                  setProof(item)
              }

              onExport={
                exportRegistrations
              }

              onPrint={() =>
                window.print()
              }

              onLogout={() => {

                setAdmin(false);

                goTo("home");

              }}

            />

          )}

      </main>


      {/* FOOTER */}

      <Footer
        onNavigate={
          goTo
        }
      />


      {/* EVENT DETAILS */}

      {detailsEvent && (

        <EventDetails

          event={
            detailsEvent
          }

          remaining={
            remaining(
              detailsEvent
            )
          }

          onClose={() =>
            setDetailsEvent(null)
          }

          onBook={() => {

            setBookingEvent(
              detailsEvent
            );

            setDetailsEvent(
              null
            );

          }}

          onShare={() =>
            shareEvent(
              detailsEvent
            )
          }

          onSocial={
            platform =>
              socialShare(
                platform,
                detailsEvent
              )
          }

        />

      )}


      {/* BOOKING */}

      {bookingEvent && (

        <Booking

          event={
            bookingEvent
          }

          remaining={
            remaining(
              bookingEvent
            )
          }

          onClose={() =>
            setBookingEvent(null)
          }

          onSubmit={
            bookEvent
          }

        />

      )}


      {/* CREATE EVENT */}

      {createOpen && (

        <CreateEvent

          onClose={() =>
            setCreateOpen(false)
          }

          onSubmit={
            createEvent
          }

        />

      )}


      {/* PROOF VIEWER */}

      {proof && (

        <ProofViewer

          registration={
            proof
          }

          onClose={() =>
            setProof(null)
          }

        />

      )}

    </div>

  );
}


// ============================================================
// HOME
// ============================================================

function Home({
  events,
  remaining,
  onView,
  onBook,
  onEvents,
}) {

  const [
    slide,
    setSlide
  ] = useState(0);


  useEffect(() => {

    if (
      events.length < 2
    ) return;


    const timer =
      setInterval(() => {

        setSlide(
          old =>
            (
              old + 1
            ) %
            events.length
        );

      }, 5000);


    return () =>
      clearInterval(timer);

  }, [
    events.length
  ]);


  useEffect(() => {

    if (
      slide >= events.length
    ) {

      setSlide(0);

    }

  }, [
    slide,
    events.length
  ]);


  if (
    events.length === 0
  ) {

    return (

      <section className="hero">

        <div className="hero-copy">

          <p className="eyebrow">
            SIMPLE EVENT REGISTRATION
          </p>

          <h1>
            Find an <span>event.</span>
            <br />
            Book your <span>place.</span>
          </h1>

          <p>
            There are currently no events available.
          </p>

        </div>

      </section>

    );

  }


  const event =
    events[slide];


  return (

    <>

      {/* ====================================================
          HERO
      ==================================================== */}

      <section className="hero">

        <div className="hero-copy">

          <div className="eyebrow-pill">
            SIMPLE EVENT REGISTRATION
          </div>


          <h1>

            Find an <span>event.</span>

            <br />

            Book your <span>place.</span>

          </h1>


          <p>

            View event details, register and
            <br />
            upload your proof of payment.

          </p>


          <button
            className="primary-btn hero-btn"
            onClick={onEvents}
          >

            <Icon name="calendar" />

            View All Events

            <Icon name="arrow" />

          </button>


          <div className="feature-row">

            <Feature
              icon="users"
              title="Easy Registration"
              text="Simple and fast registration"
            />

            <Feature
              icon="shield"
              title="Secure & Safe"
              text="Your information is always protected"
            />

            <Feature
              icon="upload"
              title="Upload Proof"
              text="Upload proof of payment easily"
            />

          </div>

        </div>


        {/* PORTRAIT FLYER */}

        <div className="hero-flyer-side">

          <div className="flyer-frame">

            {event.flyer ? (

              <img
                src={
                  event.flyer
                }
                alt={
                  event.name
                }
                className="hero-flyer"
              />

            ) : (

              <FlyerPlaceholder
                event={event}
              />

            )}


            <button
              className="slider-arrow left"
              onClick={() =>
                setSlide(
                  (
                    slide -
                    1 +
                    events.length
                  ) %
                  events.length
                )
              }
            >

              <Icon name="left" />

            </button>


            <button
              className="slider-arrow right"
              onClick={() =>
                setSlide(
                  (
                    slide + 1
                  ) %
                  events.length
                )
              }
            >

              <Icon name="right" />

            </button>

          </div>


          <div className="slider-dots">

            {events.map(
              (
                item,
                index
              ) => (

                <button
                  key={
                    item.id
                  }
                  className={
                    index === slide
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setSlide(
                      index
                    )
                  }
                />

              )
            )}

          </div>

        </div>

      </section>


      {/* ====================================================
          UPCOMING EVENTS
      ==================================================== */}

      <section className="page-section home-events">

        <div className="section-heading compact">

          <div>

            <h2>
              Upcoming Events
            </h2>

          </div>


          <button
            className="outline-btn"
            onClick={onEvents}
          >

            View All Events

            <Icon
              name="arrow"
              size={17}
            />

          </button>

        </div>


        <EventList

          events={
            events.slice(0, 2)
          }

          remaining={
            remaining
          }

          onView={
            onView
          }

          onBook={
            onBook
          }

          onShare={
            shareEvent
          }

        />

      </section>

    </>

  );
}


// ============================================================
// FEATURE
// ============================================================

function Feature({
  icon,
  title,
  text,
}) {

  return (

    <div className="feature">

      <span className="feature-icon">

        <Icon
          name={icon}
          size={27}
        />

      </span>


      <div>

        <strong>
          {title}
        </strong>

        <p>
          {text}
        </p>

      </div>

    </div>

  );

}


// ============================================================
// FLYER PLACEHOLDER
// ============================================================

function FlyerPlaceholder({
  event,
}) {

  return (

    <div className="flyer-placeholder">

      <div className="placeholder-glow" />

      <p>
        {event.name
          .split(" ")
          .slice(0, 2)
          .join(" ")
          .toUpperCase()}
      </p>

      <strong>
        EVENT
      </strong>

      <small>
        {formatDate(
          event.date
        ).toUpperCase()}
        {" · "}
        {event.venue.toUpperCase()}
      </small>

    </div>

  );

}


// ============================================================
// EVENT LIST
// ============================================================

function EventList({
  events,
  remaining,
  onView,
  onBook,
  onShare,
}) {

  if (
    events.length === 0
  ) {

    return (

      <div className="empty-state">

        No events found.

      </div>

    );

  }


  return (

    <div className="event-list">

      {events.map(
        event => (

          <article
            className="event-row"
            key={
              event.id
            }
          >

            <div className="event-poster">

              {event.flyer ? (

                <img
                  src={
                    event.flyer
                  }
                  alt={
                    event.name
                  }
                />

              ) : (

                <FlyerPlaceholder
                  event={event}
                />

              )}

            </div>


            <div className="event-info">

              <h3>
                {event.name}
              </h3>


              <div className="event-meta">

                <span>
                  <Icon
                    name="calendar"
                  />
                  {formatDate(
                    event.date
                  )}
                </span>

                <span>
                  <Icon
                    name="clock"
                  />
                  {event.time}
                </span>

                <span>
                  <Icon
                    name="pin"
                  />
                  {event.venue}
                </span>

              </div>


              <p>
                {event.description}
              </p>


              <span className="availability">

                <Icon
                  name="users"
                  size={17}
                />

                {remaining(event)}
                {" places remaining"}

              </span>

            </div>


            <div className="event-actions">

              <button
                className="outline-btn"
                onClick={() =>
                  onView(event)
                }
              >

                <Icon name="eye" />

                View Event

              </button>


              <button
                className="primary-btn"
                disabled={
                  remaining(event) === 0
                }
                onClick={() =>
                  onBook(event)
                }
              >

                <Icon name="calendar" />

                {remaining(event)
                  ? "Book Now"
                  : "Fully Booked"}

              </button>


              <button
                className="outline-btn"
                onClick={() =>
                  onShare(event)
                }
              >

                <Icon name="share" />

                Share

              </button>

            </div>

          </article>

        )
      )}

    </div>

  );

}


// ============================================================
// EVENT DETAILS MODAL
// ============================================================

function EventDetails({
  event,
  remaining,
  onClose,
  onBook,
  onShare,
  onSocial,
}) {

  return (

    <Modal
      onClose={
        onClose
      }
      className="details-modal"
    >

      <div className="modal-scroll">

        <p className="eyebrow">
          EVENT DETAILS
        </p>


        <h2>
          {event.name}
        </h2>


        <div className="detail-meta">

          <span>
            <Icon name="calendar" />
            {formatDate(
              event.date
            )}
          </span>

          <span>
            <Icon name="clock" />
            {event.time}
          </span>

          <span>
            <Icon name="pin" />
            {event.venue}
          </span>

        </div>


        {event.flyer && (

          <img
            className="details-flyer"
            src={
              event.flyer
            }
            alt={
              event.name
            }
          />

        )}


        <p className="modal-description">
          {event.description}
        </p>


        <div className="info-panel">

          <strong>
            Places remaining
          </strong>

          <span>
            {remaining}
          </span>

        </div>


        <div className="info-panel">

          <strong>
            Payment Information
          </strong>

          <p>
            {event.paymentInfo}
          </p>

        </div>

      </div>


      <div className="modal-actions">

        <button
          className="primary-btn"
          disabled={!remaining}
          onClick={
            onBook
          }
        >

          <Icon name="calendar" />

          {remaining
            ? "Book Now"
            : "Fully Booked"}

        </button>


        <button
          className="outline-btn"
          onClick={
            onShare
          }
        >

          <Icon name="share" />

          Share

        </button>


        <button
          className="social-mini"
          onClick={() =>
            onSocial(
              "whatsapp"
            )
          }
        >
          WhatsApp
        </button>


        <button
          className="social-mini"
          onClick={() =>
            onSocial(
              "facebook"
            )
          }
        >
          Facebook
        </button>


        <button
          className="social-mini"
          onClick={() =>
            onSocial(
              "linkedin"
            )
          }
        >
          LinkedIn
        </button>


        <button
          className="outline-btn"
          onClick={
            onClose
          }
        >
          Close
        </button>

      </div>

    </Modal>

  );

}


// ============================================================
// BOOKING MODAL
// ============================================================

function Booking({
  event,
  remaining,
  onClose,
  onSubmit,
}) {

  const [
    form,
    setForm
  ] = useState({

    name: "",

    phone: "",

    email: "",

    quantity: 1,

    paymentReference: "",

    proofFile: null,

  });


  const [
    error,
    setError
  ] = useState("");


  function update(e) {

    setForm(
      old => ({

        ...old,

        [e.target.name]:
          e.target.value,

      })
    );

  }


  function fileChange(e) {

    const file =
      e.target.files?.[0];


    setError("");


    if (!file) {

      setForm(
        old => ({
          ...old,
          proofFile: null,
        })
      );

      return;

    }


    if (
      !PROOF_TYPES.includes(
        file.type
      )
    ) {

      setError(
        "Proof must be PDF, JPG, JPEG or PNG."
      );

      e.target.value = "";

      return;

    }


    if (
      file.size >
      MAX_FILE_SIZE
    ) {

      setError(
        "Proof must be 5 MB or smaller."
      );

      e.target.value = "";

      return;

    }


    setForm(
      old => ({
        ...old,
        proofFile: file,
      })
    );

  }


  return (

    <Modal
      onClose={
        onClose
      }
      className="booking-modal"
    >

      <div className="modal-scroll">

        <p className="eyebrow">
          REGISTER FOR EVENT
        </p>


        <h2>
          {event.name}
        </h2>


        <p className="modal-subtitle">

          {formatDate(
            event.date
          )}

          {" · "}

          {event.time}

          {" · "}

          {event.venue}

        </p>


        <div className="remaining-line">

          {remaining}
          {" places remaining"}

        </div>


        <form
          className="booking-form"
          onSubmit={e => {

            e.preventDefault();

            if (!error) {
              onSubmit(form);
            }

          }}
        >

          <label>

            Full Name

            <input
              name="name"
              value={
                form.name
              }
              onChange={
                update
              }
              placeholder="Enter your full name"
              required
            />

          </label>


          <label>

            Phone Number

            <input
              name="phone"
              value={
                form.phone
              }
              onChange={
                update
              }
              placeholder="Enter your phone number"
              required
            />

          </label>


          <label>

            Email Address

            <input
              type="email"
              name="email"
              value={
                form.email
              }
              onChange={
                update
              }
              placeholder="Enter your email"
              required
            />

          </label>


          <label>

            Number of People

            <input
              type="number"
              name="quantity"
              min="1"
              max={
                remaining
              }
              value={
                form.quantity
              }
              onChange={
                update
              }
              required
            />

          </label>


          <label>

            Payment Reference

            <input
              name="paymentReference"
              value={
                form.paymentReference
              }
              onChange={
                update
              }
              placeholder="Enter payment reference"
              required
            />

          </label>


          <label>

            Proof of Payment

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={
                fileChange
              }
              required
            />

            <small>
              PDF, JPG, JPEG or PNG.
              Maximum 5 MB.
            </small>

          </label>


          {form.proofFile && (

            <div className="file-name">

              ✓{" "}
              {form.proofFile.name}

            </div>

          )}


          {error && (

            <div className="form-error">
              {error}
            </div>

          )}


          <button
            className="primary-btn submit-btn"
            disabled={
              !remaining ||
              !!error
            }
          >

            Submit Registration

          </button>

        </form>

      </div>

    </Modal>

  );

}


// ============================================================
// CREATE EVENT
// ============================================================

function CreateEvent({
  onClose,
  onSubmit,
}) {

  const [
    form,
    setForm
  ] = useState({

    name: "",

    date: "",

    time: "",

    venue: "",

    capacity: 100,

    description: "",

    paymentInfo: "",

    flyerFile: null,

  });


  function update(e) {

    setForm(
      old => ({
        ...old,
        [e.target.name]:
          e.target.value,
      })
    );

  }


  return (

    <Modal
      onClose={
        onClose
      }
      className="booking-modal"
    >

      <div className="modal-scroll">

        <p className="eyebrow">
          ADMIN
        </p>


        <h2>
          Create Event
        </h2>


        <form
          className="booking-form"
          onSubmit={e => {

            e.preventDefault();

            onSubmit(form);

          }}
        >

          <label>
            Event Name

            <input
              name="name"
              value={
                form.name
              }
              onChange={
                update
              }
              required
            />

          </label>


          <label>
            Date

            <input
              type="date"
              name="date"
              value={
                form.date
              }
              onChange={
                update
              }
              required
            />

          </label>


          <label>
            Time

            <input
              name="time"
              value={
                form.time
              }
              onChange={
                update
              }
              placeholder="10:00 AM"
              required
            />

          </label>


          <label>
            Venue

            <input
              name="venue"
              value={
                form.venue
              }
              onChange={
                update
              }
              required
            />

          </label>


          <label>
            Capacity

            <input
              type="number"
              name="capacity"
              min="1"
              value={
                form.capacity
              }
              onChange={
                update
              }
              required
            />

          </label>


          <label>
            Portrait Event Flyer

            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={e =>
                setForm(
                  old => ({
                    ...old,
                    flyerFile:
                      e.target.files?.[0] ||
                      null,
                  })
                )
              }
            />

            <small>
              JPG, PNG or WEBP.
              Maximum 5 MB.
            </small>

          </label>


          <label>
            Event Description

            <textarea
              name="description"
              rows="5"
              value={
                form.description
              }
              onChange={
                update
              }
              required
            />

          </label>


          <label>
            Payment Information

            <textarea
              name="paymentInfo"
              rows="4"
              value={
                form.paymentInfo
              }
              onChange={
                update
              }
            />

          </label>


          <button
            className="primary-btn"
            type="submit"
          >

            <Icon name="plus" />

            Create Event

          </button>

        </form>

      </div>

    </Modal>

  );

}


// ============================================================
// ADMIN
// ============================================================

function Admin({
  events,
  registrations,
  remaining,
  onCreate,
  onDelete,
  onView,
  onProof,
  onExport,
  onPrint,
  onLogout,
}) {

  return (

    <section className="page-section admin-page">

      <div className="section-heading">

        <div>

          <p className="eyebrow">
            ADMINISTRATION
          </p>

          <h2>
            Event Management
          </h2>

          <p>
            Manage events and registered attendees.
          </p>

        </div>


        <div className="admin-toolbar">

          <button
            className="primary-btn"
            onClick={
              onCreate
            }
          >

            <Icon name="plus" />

            Create Event

          </button>


          <button
            className="outline-btn"
            onClick={
              onLogout
            }
          >

            <Icon name="logout" />

            Logout

          </button>

        </div>

      </div>


      <div className="admin-card">

        <div className="admin-card-title">

          <h3>
            Events
          </h3>

          <span>
            {events.length}
            {" event(s)"}
          </span>

        </div>


        {events.map(
          event => (

            <div
              className="admin-event"
              key={
                event.id
              }
            >

              <div className="admin-thumb">

                {event.flyer ? (

                  <img
                    src={
                      event.flyer
                    }
                    alt=""
                  />

                ) : (

                  <FlyerPlaceholder
                    event={
                      event
                    }
                  />

                )}

              </div>


              <div className="admin-event-info">

                <strong>
                  {event.name}
                </strong>

                <span>
                  {formatDate(
                    event.date
                  )}
                  {" · "}
                  {event.time}
                  {" · "}
                  {event.venue}
                </span>

                <span>
                  {remaining(event)}
                  {" places remaining"}
                </span>

              </div>


              <div className="admin-actions">

                <button
                  className="outline-btn"
                  onClick={() =>
                    onView(
                      event
                    )
                  }
                >
                  View Event
                </button>


                <button
                  className="danger-btn"
                  onClick={() =>
                    onDelete(
                      event.id
                    )
                  }
                >
                  Delete
                </button>

              </div>

            </div>

          )
        )}

      </div>


      <div className="admin-card">

        <div className="admin-card-title">

          <div>

            <h3>
              Registered People
            </h3>

            <span>
              {registrations.length}
              {" registration(s)"}
            </span>

          </div>


          <div className="admin-toolbar">

            <button
              className="outline-btn"
              onClick={
                onExport
              }
            >
              Export Spreadsheet
            </button>


            <button
              className="outline-btn"
              onClick={
                onPrint
              }
            >
              Print
            </button>

          </div>

        </div>


        {registrations.length === 0 ? (

          <div className="empty-state">
            No registrations yet.
          </div>

        ) : (

          <div className="table-scroll">

            <table>

              <thead>

                <tr>

                  <th>
                    Event
                  </th>

                  <th>
                    Full Name
                  </th>

                  <th>
                    Phone
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    People
                  </th>

                  <th>
                    Payment Reference
                  </th>

                  <th>
                    Proof
                  </th>

                  <th>
                    Date
                  </th>

                </tr>

              </thead>


              <tbody>

                {registrations.map(
                  r => (

                    <tr
                      key={
                        r.id
                      }
                    >

                      <td>
                        {r.eventName}
                      </td>

                      <td>
                        {r.fullName}
                      </td>

                      <td>
                        {r.phone}
                      </td>

                      <td>
                        {r.email}
                      </td>

                      <td>
                        {r.quantity}
                      </td>

                      <td>
                        {r.paymentReference}
                      </td>

                      <td>

                        <button
                          className="text-btn"
                          onClick={() =>
                            onProof(
                              r
                            )
                          }
                        >

                          View Proof

                        </button>

                      </td>

                      <td>
                        {new Date(
                          r.registeredAt
                        ).toLocaleDateString(
                          "en-ZA"
                        )}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </section>

  );

}


// ============================================================
// PROOF VIEWER
// ============================================================

function ProofViewer({
  registration,
  onClose,
}) {

  const isImage =
    registration.proofFileType?.startsWith(
      "image/"
    );

  const isPdf =
    registration.proofFileType ===
    "application/pdf";


  function download() {

    const link =
      document.createElement(
        "a"
      );

    link.href =
      registration.proofData;

    link.download =
      registration.proofFileName;

    link.click();

  }


  return (

    <Modal
      onClose={
        onClose
      }
      className="proof-modal"
    >

      <div className="proof-head">

        <p className="eyebrow">
          PROOF OF PAYMENT
        </p>

        <h2>
          {registration.fullName}
        </h2>

        <p>
          {registration.proofFileName}
        </p>

      </div>


      <div className="proof-viewer">

        {isImage && (

          <img
            src={
              registration.proofData
            }
            alt="Proof of payment"
          />

        )}


        {isPdf && (

          <iframe
            src={
              registration.proofData
            }
            title="Proof of payment"
          />

        )}

      </div>


      <div className="modal-actions">

        <button
          className="primary-btn"
          onClick={
            download
          }
        >
          Download Proof
        </button>


        <button
          className="outline-btn"
          onClick={
            onClose
          }
        >
          Close
        </button>

      </div>

    </Modal>

  );

}


// ============================================================
// GENERIC MODAL
// ============================================================

function Modal({
  children,
  onClose,
  className = "",
}) {

  return (

    <div
      className="modal-backdrop"
      onMouseDown={
        onClose
      }
    >

      <div
        className={
          `modal-card ${className}`
        }
        onMouseDown={e =>
          e.stopPropagation()
        }
      >

        <button
          className="modal-close"
          onClick={
            onClose
          }
        >

          <Icon name="close" />

        </button>


        {children}

      </div>

    </div>

  );

}


// ============================================================
// FOOTER
// ============================================================

function Footer({
  onNavigate,
}) {

  return (

    <footer className="footer">

      <div className="footer-inner">


        <div className="footer-brand">

          <button
            className="brand"
            onClick={() =>
              onNavigate(
                "home"
              )
            }
          >

            <span className="brand-icon">

              <Icon
                name="calendar"
                size={31}
              />

            </span>


            <span>

              <strong>
                Event<span>Book</span>
              </strong>

              <small>
                Simple event registration
              </small>

            </span>

          </button>


          <p>
            Find events, register easily
            and upload your proof of payment.
          </p>


          <div className="social-icons">

            <span>
              f
            </span>

            <span>
              𝕏
            </span>

            <span>
              ◎
            </span>

            <span>
              in
            </span>

          </div>

        </div>


        <div>

          <h4>
            Quick Links
          </h4>

          <button
            onClick={() =>
              onNavigate(
                "home"
              )
            }
          >
            Home
          </button>

          <button
            onClick={() =>
              onNavigate(
                "events"
              )
            }
          >
            Events
          </button>

          <button
            onClick={() =>
              onNavigate(
                "admin"
              )
            }
          >
            Admin
          </button>

        </div>


        <div>

          <h4>
            Support
          </h4>

          <button>
            Contact Us
          </button>

          <button>
            FAQ
          </button>

          <button>
            Privacy Policy
          </button>

          <button>
            Terms & Conditions
          </button>

        </div>


        <div>

          <h4>
            Contact
          </h4>

          <p>
            <Icon name="phone" />
            +27 12 345 6789
          </p>

          <p>
            <Icon name="mail" />
            info@eventbook.co.za
          </p>

          <p>
            <Icon name="pin" />
            Cape Town, South Africa
          </p>

        </div>

      </div>


      <div className="footer-bottom">

        © 2026 EventBook.
        All rights reserved.

      </div>

    </footer>

  );

}


// ============================================================
// START REACT
// ============================================================

createRoot(
  document.getElementById("root")
).render(

  <React.StrictMode>

    <App />

  </React.StrictMode>

);