import About from "./pages/About";
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./supabase";
import "./styles.css";

import eventraLogo from "./assets/eventra.png";

/*
============================================================
 EVENTBOOK
 Premium Navy + Blue Event Booking Application

 COMPLETE SUPABASE VERSION

 USER FLOW
 -----------------------------------------------------------
 • User registers
 • User logs in
 • User books an event
 • User uploads proof of payment
 • Registration is saved in Supabase

 ADMIN FLOW
 -----------------------------------------------------------
 • Admin logs in
 • Admin dashboard
 • Create events
 • Upload event flyers
 • Delete events
 • View registrations
 • View proof of payment
 • Export registrations
 • Print registrations
============================================================
*/


// ============================================================
// CONFIGURATION
// ============================================================

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

const STORAGE_BUCKETS = {
  FLYERS: "event-flyers",
  PROOFS: "proof-of-payment",
};


// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}


function csvValue(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}


function downloadCSV(filename, content) {
  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}


// ============================================================
// STORAGE
// ============================================================

async function uploadFile(bucket, file) {
  if (!file) {
    throw new Error("No file selected.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "You must be logged in before uploading."
    );
  }

  const safeFileName =
    (file.name || "proof")
      .replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

  const storagePath =
    `${user.id}/${Date.now()}-${safeFileName}`;

  const {
    error,
  } = await supabase.storage
    .from(bucket)
    .upload(
      storagePath,
      file,
      {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      }
    );

  if (error) {
    console.error(
      "STORAGE UPLOAD ERROR:",
      error
    );

    throw error;
  }

  return storagePath;
}


async function uploadFlyer(file, eventId) {
  if (!file) return "";

  if (!FLYER_TYPES.includes(file.type)) {
    throw new Error(
      "Flyer must be JPG, PNG or WEBP."
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      "Flyer must be 5 MB or smaller."
    );
  }

  const safeFileName = file.name.replace(
    /[^a-zA-Z0-9._-]/g,
    "_"
  );

  const path =
    `${eventId}/${Date.now()}-${safeFileName}`;

  const {
    error,
  } = await supabase.storage
    .from(STORAGE_BUCKETS.FLYERS)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw error;
  }

  return path;
}


function getPublicFileUrl(bucket, path) {
  if (!path) return "";

  const {
    data,
  } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data?.publicUrl || "";
}


async function getSignedFileUrl(bucket, path) {
  if (!path) return "";

  const {
    data,
    error,
  } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60);

  if (error) {
    console.error(
      "SIGNED URL ERROR:",
      error
    );

    return "";
  }

  return data?.signedUrl || "";
}


// ============================================================
// SOCIAL SHARING
// ============================================================

async function shareEvent(event) {
  const url =
    `${window.location.origin}${window.location.pathname}?event=${event.id}`;

  const text =
    `${event.name} — ${formatDate(event.date)} — ${event.venue || event.location || ""}`;

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
    `${event.name} — ${formatDate(event.date)} — ${event.venue || event.location || ""}`;

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
// ICON
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
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <path d="M3 9h18" />
        <path d="m9 15 2 2 4-4" />
      </>
    ),

    user: (
      <>
        <circle cx="12" cy="7" r="3.5" />
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
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 5 5" />
      </>
    ),

    pin: (
      <>
        <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="10" r="2.3" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),

    left: <path d="m15 18-6-6 6-6" />,

    right: <path d="m9 18 6-6-6-6" />,

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
        <rect x="3" y="5" width="18" height="14" rx="2" />
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
  const [page, setPage] = useState("home");

  const [events, setEvents] = useState([]);

  const [registrations, setRegistrations] = useState([]);

  const [loadingEvents, setLoadingEvents] = useState(true);

  const [
    loadingRegistrations,
    setLoadingRegistrations,
  ] = useState(false);

  const [detailsEvent, setDetailsEvent] = useState(null);

  const [bookingEvent, setBookingEvent] = useState(null);

  const [proof, setProof] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);

  const [authOpen, setAuthOpen] = useState(false);

  const [authMode, setAuthMode] = useState("login");

  const [admin, setAdmin] = useState(false);

  const [user, setUser] = useState(null);

  const [search, setSearch] = useState("");

  const [mobileMenu, setMobileMenu] = useState(false);


  // ==========================================================
  // CHECK AUTHENTICATION
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);

        await checkAdmin(session.user.id);
      } else {
        setUser(null);
        setAdmin(false);
      }
    }

    async function checkAdmin(userId) {
      const {
        data: profile,
        error,
      } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (!mounted) return;

      if (!error && profile?.role === "admin") {
        setAdmin(true);
      } else {
        setAdmin(false);
      }
    }

    checkSession();

    const {
      data: listener,
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          await checkAdmin(session.user.id);
        } else {
          setUser(null);
          setAdmin(false);
        }
      }
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);


  // ==========================================================
  // LOAD EVENTS
  // ==========================================================

  async function loadEvents() {
  setLoadingEvents(true);

  try {
    const {
      data,
      error,
    } = await supabase
      .from("events")
      .select("*")
      .order("date", {
        ascending: true,
      });

    if (error) {
      console.error(
        "SUPABASE EVENTS ERROR:",
        error
      );

      alert(
        `Could not load events.\n\n${error.message}`
      );

      setEvents([]);
      return;
    }

    const formattedEvents = (data || []).map(
      (event) => {
        return {
          ...event,

          // ==================================================
          // FLYER
          // Database column: flyer_url
          // ==================================================

          flyer:
            event.flyer_url || "",

          flyer_url:
            event.flyer_url || "",

          // ==================================================
          // LOCATION
          // ==================================================

          venue:
            event.venue ||
            event.location ||
            "",

          location:
            event.location ||
            event.venue ||
            "",
        };
      }
    );

    console.log(
      "EVENTS LOADED:",
      formattedEvents
    );

    setEvents(formattedEvents);

  } catch (error) {
    console.error(
      "LOAD EVENTS ERROR:",
      error
    );

    alert(
      `Could not load events.\n\n${
        error.message || error
      }`
    );

    setEvents([]);

  } finally {
    setLoadingEvents(false);
  }
}


  useEffect(() => {
    loadEvents();
  }, []);


  // ==========================================================
  // LOAD REGISTRATIONS
  // ==========================================================

  async function loadRegistrations() {
  setLoadingRegistrations(true);

  const {
    data,
    error,
  } = await supabase
    .from("registrations")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "SUPABASE REGISTRATIONS ERROR:",
      error
    );

    setRegistrations([]);
    setLoadingRegistrations(false);
    return;
  }

  const formatted =
    await Promise.all(
      (data || []).map(
        async registration => {

          let proofUrl = "";

          if (registration.proof_url) {
            proofUrl =
              await getSignedFileUrl(
                STORAGE_BUCKETS.PROOFS,
                registration.proof_url
              );
          }

          return {
            ...registration,

            eventId:
              registration.event_id,

            fullName:
              registration.full_name,

            paymentReference:
              registration.payment_reference,

            proofFileName:
              registration.proof_file_name,

            proofFileType:
              registration.proof_file_type,

            proofData:
              proofUrl,

            registeredAt:
              registration.created_at,
          };
        }
      )
    );

  setRegistrations(formatted);

  setLoadingRegistrations(false);
}


  // ==========================================================
  // NAVIGATION
  // ==========================================================

  function goTo(pageName) {
    setPage(pageName);

    setMobileMenu(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    if (
      pageName === "admin" &&
      admin
    ) {
      loadRegistrations();
    }
  }


  // ==========================================================
  // USER AUTH
  // ==========================================================

  function requireLoginForBooking(event) {
    if (user) {
      setBookingEvent(event);
      return;
    }

    setAuthMode("register");
    setAuthOpen(true);
  }


  // ==========================================================
  // AUTH SUCCESS
  // ==========================================================

  function handleAuthSuccess() {
    setAuthOpen(false);

    /*
    If the user originally wanted to book,
    the booking event remains available here.
    */

    if (bookingEvent) {
      return;
    }
  }


  // ==========================================================
  // ADMIN LOGIN
  // ==========================================================

  async function adminLogin() {
    setAuthMode("admin");
    setAuthOpen(true);
  }


  // ==========================================================
  // ADMIN LOGOUT
  // ==========================================================

  async function logout() {
    await supabase.auth.signOut();

    setUser(null);
    setAdmin(false);

    setPage("home");
  }


  // ==========================================================
  // REGISTRATION COUNTS
  // ==========================================================

  const counts = useMemo(() => {
    const result = {};

    registrations.forEach(
      (registration) => {
        const eventId =
          registration.event_id ||
          registration.eventId;

        result[eventId] =
          (result[eventId] || 0) +
          Number(
            registration.quantity || 1
          );
      }
    );

    return result;
  }, [registrations]);


  // ==========================================================
  // REMAINING PLACES
  // ==========================================================

  function remaining(event) {
    return Math.max(
      0,
      Number(event.capacity || 0) -
        (counts[event.id] || 0)
    );
  }


  // ==========================================================
  // CREATE EVENT
  // ==========================================================

async function createEvent(data) {
  try {
    // ========================================================
    // 1. CHECK ADMIN
    // ========================================================

    if (!admin) {
      alert("Administrator access is required.");
      return;
    }

    // ========================================================
    // 2. VALIDATE FLYER
    // ========================================================

    if (
      data.flyerFile &&
      !FLYER_TYPES.includes(data.flyerFile.type)
    ) {
      alert("Flyer must be JPG, PNG or WEBP.");
      return;
    }

    if (
      data.flyerFile &&
      data.flyerFile.size > MAX_FILE_SIZE
    ) {
      alert("Flyer must be 5 MB or smaller.");
      return;
    }

    // ========================================================
    // 3. CREATE EVENT ID
    // ========================================================

    const eventId = crypto.randomUUID();

    // ========================================================
    // 4. UPLOAD FLYER
    // ========================================================

    let flyerPath = "";

    if (data.flyerFile) {
      console.log("Uploading flyer...");

      flyerPath = await uploadFlyer(
        data.flyerFile,
        eventId
      );

      console.log(
        "FLYER PATH:",
        flyerPath
      );
    }

    // ========================================================
    // 5. CREATE PUBLIC FLYER URL
    // ========================================================

    const flyerUrl = flyerPath
      ? getPublicFileUrl(
          STORAGE_BUCKETS.FLYERS,
          flyerPath
        )
      : "";

    console.log(
      "FLYER PUBLIC URL:",
      flyerUrl
    );

    // ========================================================
    // 6. CREATE DATABASE RECORD
    // ========================================================

    const event = {
      id: eventId,

      name:
        data.name.trim(),

      date:
        data.date,

      time:
        data.time.trim(),

      venue:
        data.venue.trim(),

      capacity:
        Number(data.capacity),

      description:
        data.description.trim(),

      payment_info:
        data.paymentInfo?.trim() || "",

      // IMPORTANT:
      // Your database column is flyer_url
      flyer_url:
        flyerUrl || null,
    };

    console.log(
      "CREATING EVENT:",
      event
    );

    // ========================================================
    // 7. INSERT EVENT
    // ========================================================

    const {
      data: insertedEvent,
      error,
    } = await supabase
      .from("events")
      .insert([event])
      .select()
      .single();

    if (error) {
      console.error(
        "CREATE EVENT DATABASE ERROR:",
        error
      );

      throw error;
    }

    console.log(
      "EVENT CREATED:",
      insertedEvent
    );

    // ========================================================
    // 8. FORMAT EVENT FOR THE APP
    // ========================================================

    const formattedEvent = {
      ...insertedEvent,

      flyer:
        insertedEvent.flyer_url || "",

      flyer_url:
        insertedEvent.flyer_url || "",
    };

    // ========================================================
    // 9. UPDATE EVENTS IN APP
    // ========================================================

    setEvents((old) => [
      ...old,
      formattedEvent,
    ]);

    // ========================================================
    // 10. CLOSE CREATE EVENT WINDOW
    // ========================================================

    setCreateOpen(false);

    alert(
      "Event created successfully."
    );

  } catch (error) {

    console.error(
      "CREATE EVENT ERROR:",
      error
    );

    alert(
      `Could not create event.\n\n${
        error.message || error
      }`
    );
  }
}

  // ==========================================================
  // BOOK EVENT
  // ==========================================================

  async function bookEvent(data) {
  if (!bookingEvent) return;

  try {
    // ========================================================
    // 1. GET LOGGED-IN USER
    // ========================================================

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("GET USER ERROR:", userError);
      alert("Could not verify your account.");
      return;
    }

    if (!user) {
      alert("Please log in before booking an event.");
      return;
    }

    // ========================================================
    // 2. CHECK AVAILABLE PLACES
    // ========================================================

    const quantity = Number(data.quantity);

    const available = remaining(bookingEvent);

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > available
    ) {
      alert(`Only ${available} place(s) remain.`);
      return;
    }

    // ========================================================
    // 3. VALIDATE PROOF OF PAYMENT
    // ========================================================

    if (!data.proofFile) {
      alert("Please upload proof of payment.");
      return;
    }

    if (!PROOF_TYPES.includes(data.proofFile.type)) {
      alert("Proof must be PDF, JPG, JPEG or PNG.");
      return;
    }

    if (data.proofFile.size > MAX_FILE_SIZE) {
      alert("Proof must be 5 MB or smaller.");
      return;
    }

    // ========================================================
    // 4. UPLOAD PROOF TO SUPABASE STORAGE
    // ========================================================

    console.log("Uploading proof of payment...");

    const proofPath = await uploadFile(
      STORAGE_BUCKETS.PROOFS,
      data.proofFile
    );

    console.log("PROOF UPLOADED:", proofPath);

    // ========================================================
    // 5. CREATE REGISTRATION RECORD
    // ========================================================

    const registration = {
      user_id: user.id,

      event_id: bookingEvent.id,

      full_name: data.name.trim(),

      phone: data.phone.trim(),

      email: data.email.trim(),

      quantity: quantity,

      payment_reference:
        data.paymentReference.trim(),

      proof_url: proofPath,

      proof_file_name:
        data.proofFile.name,

      proof_file_type:
        data.proofFile.type,
    };

    console.log(
      "CREATING REGISTRATION:",
      registration
    );

    // ========================================================
    // 6. INSERT INTO SUPABASE
    // ========================================================

    const {
      data: savedRegistration,
      error,
    } = await supabase
      .from("registrations")
      .insert([registration])
      .select()
      .single();

    if (error) {
      console.error(
        "REGISTRATION ERROR:",
        error
      );

      alert(
        `Registration could not be completed.\n\n${error.message}`
      );

      return;
    }

    console.log(
      "REGISTRATION SAVED:",
      savedRegistration
    );


    // ========================================================
    // 7. GET SECURE SIGNED URL FOR ADMIN VIEWING
    // ========================================================

    let proofUrl = "";

    if (savedRegistration.proof_path) {
      proofUrl =
        await getSignedFileUrl(
          STORAGE_BUCKETS.PROOFS,
          savedRegistration.proof_path
        );
    }

    // ========================================================
    // 8. CREATE DISPLAY REGISTRATION
    // ========================================================

    const displayRegistration = {
      ...savedRegistration,

      eventId:
        savedRegistration.event_id,

      eventName:
        bookingEvent.name,

      fullName:
        savedRegistration.full_name,

      phone:
        savedRegistration.phone,

      email:
        savedRegistration.email,

      paymentReference:
        savedRegistration.payment_reference,

      proofFileName:
        savedRegistration.proof_file_name,

      proofFileType:
        savedRegistration.proof_file_type,

      proofData:
        proofUrl,

      registeredAt:
        savedRegistration.created_at,
    };

    // ========================================================
    // 9. UPDATE ADMIN REGISTRATION LIST
    // ========================================================

    setRegistrations(
      old => [
        displayRegistration,
        ...old,
      ]
    );

    // ========================================================
    // 10. CLOSE BOOKING MODAL
    // ========================================================

    setBookingEvent(null);

    // ========================================================
    // 11. SUCCESS
    // ========================================================

    alert(
      "Booking completed successfully!"
    );

  } catch (error) {

    console.error(
      "BOOKING FAILED:",
      error
    );

    alert(
      `Registration could not be completed.\n\n${
        error?.message || error
      }`
    );
  }
}

  // ==========================================================
  // DELETE EVENT
  // ==========================================================

  async function deleteEvent(id) {
    const event =
      events.find(
        (item) =>
          item.id === id
      );

    if (!event) return;

    if (
      !window.confirm(
        `Delete "${event.name}"?`
      )
    ) {
      return;
    }

    try {
      const {
        error,
      } = await supabase
        .from("events")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      setEvents(
        (old) =>
          old.filter(
            (item) =>
              item.id !== id
          )
      );

      setRegistrations(
        (old) =>
          old.filter(
            (item) =>
              (
                item.event_id ||
                item.eventId
              ) !== id
          )
      );

      alert(
        "Event deleted successfully."
      );

    } catch (error) {
      console.error(
        "DELETE EVENT ERROR:",
        error
      );

      alert(
        `Could not delete event.\n\n${
          error.message || error
        }`
      );
    }
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
        (r) => [
          r.event_name ||
            r.eventName,

          r.full_name ||
            r.fullName,

          r.phone,

          r.email,

          r.quantity,

          r.payment_reference ||
            r.paymentReference,

          r.proof_file_name ||
            r.proofFileName,

          new Date(
            r.created_at ||
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
        (row) =>
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
        (event) =>
          String(
            event.name || ""
          )
            .toLowerCase()
            .includes(term) ||

          String(
            event.venue ||
              event.location ||
              ""
          )
            .toLowerCase()
            .includes(term)
      );
    }, [
      events,
      search,
    ]);


  // ==========================================================
  // SHARED EVENT URL
  // ==========================================================

  useEffect(() => {
    const id =
      new URLSearchParams(
        window.location.search
      ).get("event");

    if (!id) return;

    const event =
      events.find(
        (item) =>
          item.id === id
      );

    if (event) {
      setDetailsEvent(event);
    }
  }, [events]);


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="app">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="topbar">

        <div className="nav-inner">

            <span>
              <a className="brand" href="#">
  <img
    src={eventraLogo}
    alt="Eventra"
    className="brand-logo"
  />
</a>

            </span>

       
          <nav
            className={
              mobileMenu
                ? "main-nav open"
                : "main-nav"
            }
          >

            <button
  className={page === "home" ? "active" : ""}
  onClick={() => goTo("home")}
>
  Home
</button>

<button
  className={page === "about" ? "active" : ""}
  onClick={() => goTo("about")}
>
  About
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
                (old) => !old
              )
            }
          >
            <Icon name="menu" />
          </button>

        </div>

      </header>


      {/* ====================================================
          MAIN
      ==================================================== */}

      <main>

        {page === "home" && (
          <Home
            events={events}
            loading={loadingEvents}
            remaining={remaining}
            onView={(event) =>
              setDetailsEvent(event)
            }
            onBook={
              requireLoginForBooking
            }
            onEvents={() =>
              goTo("events")
            }
          />
        )}

{page === "about" && (
  <About />
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
                  Browse events, view the
                  details and reserve your
                  place.
                </p>

              </div>


              <label className="search-box">

                <Icon name="search" />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search events..."
                />

              </label>

            </div>


            {loadingEvents ? (
              <div className="empty-state">
                Loading events...
              </div>
            ) : (
              <EventList
                events={
                  filteredEvents
                }
                remaining={
                  remaining
                }
                onView={(event) =>
                  setDetailsEvent(event)
                }
                onBook={
                  requireLoginForBooking
                }
                onShare={
                  shareEvent
                }
              />
            )}

          </section>
        )}


        {page === "admin" &&
          admin && (
            <Admin
              events={events}
              registrations={
                registrations
              }
              loadingRegistrations={
                loadingRegistrations
              }
              remaining={remaining}
              onCreate={() =>
                setCreateOpen(true)
              }
              onDelete={
                deleteEvent
              }
              onView={(event) =>
                setDetailsEvent(event)
              }
              onProof={(item) =>
                setProof(item)
              }
              onExport={
                exportRegistrations
              }
              onPrint={() =>
                window.print()
              }
              onLogout={
                logout
              }
            />
          )}

      </main>


      {/* ====================================================
          FOOTER
      ==================================================== */}

      <Footer
        onNavigate={goTo}
      />


      {/* ====================================================
          EVENT DETAILS
      ==================================================== */}

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
            const event =
              detailsEvent;

            setDetailsEvent(null);

            requireLoginForBooking(
              event
            );
          }}
          onShare={() =>
            shareEvent(
              detailsEvent
            )
          }
          onSocial={(platform) =>
            socialShare(
              platform,
              detailsEvent
            )
          }
        />
      )}


      {/* ====================================================
          BOOKING
      ==================================================== */}

      {bookingEvent &&
        user && (
          <Booking
            event={
              bookingEvent
            }
            user={user}
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


      {/* ====================================================
          AUTHENTICATION
      ==================================================== */}

      {authOpen && (
        <AuthModal
          mode={authMode}
          user={user}
          onClose={() =>
            setAuthOpen(false)
          }
          onSuccess={
            handleAuthSuccess
          }
          onModeChange={
            setAuthMode
          }
          onAdminSuccess={() => {
            setAdmin(true);
            setAuthOpen(false);
            goTo("admin");
          }}
        />
      )}


      {/* ====================================================
          CREATE EVENT
      ==================================================== */}

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


      {/* ====================================================
          PROOF VIEWER
      ==================================================== */}

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
// AUTH MODAL
// ============================================================

function AuthModal({
  mode,
  user,
  onClose,
  onSuccess,
  onModeChange,
  onAdminSuccess,
}) {

  const [
    form,
    setForm,
  ] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);


  function update(e) {
    setForm(
      (old) => ({
        ...old,
        [e.target.name]:
          e.target.value,
      })
    );
  }


  async function submit(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {

      // ======================================================
      // ADMIN LOGIN
      // ======================================================

      if (mode === "admin") {

        const {
          data,
          error,
        } =
          await supabase.auth
            .signInWithPassword({
              email:
                form.email.trim(),
              password:
                form.password,
            });

        if (error) {
          throw error;
        }

        const {
          data: profile,
          error: profileError,
        } =
          await supabase
            .from("profiles")
            .select("role")
            .eq(
              "id",
              data.user.id
            )
            .maybeSingle();

        if (profileError) {
          await supabase.auth.signOut();

          throw new Error(
            "Could not verify your administrator profile."
          );
        }

        if (
          profile?.role !==
          "admin"
        ) {
          await supabase.auth.signOut();

          throw new Error(
            "This account does not have administrator access."
          );
        }

        onAdminSuccess();

        return;
      }


      // ======================================================
      // USER REGISTRATION
      // ======================================================

      if (
        mode === "register"
      ) {

        if (
          !form.name.trim()
        ) {
          throw new Error(
            "Please enter your full name."
          );
        }

        if (
          !form.phone.trim()
        ) {
          throw new Error(
            "Please enter your phone number."
          );
        }

        if (
          form.password.length < 6
        ) {
          throw new Error(
            "Password must be at least 6 characters."
          );
        }


        const {
          data,
          error,
        } =
          await supabase.auth
            .signUp({
              email:
                form.email.trim(),
              password:
                form.password,

              options: {
                data: {
                  full_name:
                    form.name.trim(),

                  phone:
                    form.phone.trim(),
                },
              },
            });

        if (error) {
          throw error;
        }


        /*
        ------------------------------------------------------
        Create / update profile
        ------------------------------------------------------
        */

        if (
          data?.user
        ) {

          const {
            error:
              profileError,
          } =
            await supabase
              .from("profiles")
              .upsert(
                {
                  id:
                    data.user.id,

                  full_name:
                    form.name.trim(),

                  phone:
                    form.phone.trim(),

                  role:
                    "user",
                },
                {
                  onConflict:
                    "id",
                }
              );

          if (
            profileError
          ) {
            console.error(
              "PROFILE ERROR:",
              profileError
            );
          }
        }


        /*
        ------------------------------------------------------
        Supabase may require email confirmation.
        ------------------------------------------------------
        */

        if (
          !data.session
        ) {

          alert(
            "Registration successful.\n\nPlease check your email and confirm your account before logging in."
          );

          onModeChange(
            "login"
          );

          return;
        }


        alert(
          "Account created successfully!"
        );

        onSuccess();

        return;
      }


      // ======================================================
      // USER LOGIN
      // ======================================================

      if (
        mode === "login"
      ) {

        const {
          error,
        } =
          await supabase.auth
            .signInWithPassword({
              email:
                form.email.trim(),
              password:
                form.password,
            });

        if (error) {
          throw error;
        }

        alert(
          "Login successful!"
        );

        onSuccess();

        return;
      }

    } catch (err) {

      console.error(
        "AUTH ERROR:",
        err
      );

      setError(
        err.message ||
        "Authentication failed."
      );

    } finally {

      setLoading(false);

    }
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
          {mode === "admin"
            ? "ADMINISTRATION"
            : mode === "register"
            ? "CREATE ACCOUNT"
            : "WELCOME BACK"}
        </p>


        <h2>

          {mode === "admin"
            ? "Admin Login"
            : mode === "register"
            ? "Create your account"
            : "User Login"}

        </h2>


        <p className="modal-subtitle">

          {mode === "admin"
            ? "Sign in to manage EventBook."
            : mode === "register"
            ? "Register before booking an event."
            : "Log in to continue booking."}

        </p>


        <form
          className="booking-form"
          onSubmit={
            submit
          }
        >

          {mode ===
            "register" && (
            <>

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

            </>
          )}


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

            Password

            <input
              type="password"
              name="password"
              value={
                form.password
              }
              onChange={
                update
              }
              placeholder="Enter your password"
              minLength="6"
              required
            />

          </label>


          {error && (
            <div className="form-error">
              {error}
            </div>
          )}


          <button
            className="primary-btn submit-btn"
            type="submit"
            disabled={
              loading
            }
          >

            {loading
              ? "Please wait..."
              : mode ===
                "admin"
              ? "Admin Login"
              : mode ===
                "register"
              ? "Create Account"
              : "Login"}

          </button>

        </form>


        {mode !== "admin" && (
          <div
            style={{
              marginTop: "18px",
              textAlign: "center",
            }}
          >

            {mode ===
              "register" ? (
              <p>

                Already have an account?{" "}

                <button
                  type="button"
                  className="text-btn"
                  onClick={() =>
                    onModeChange(
                      "login"
                    )
                  }
                >
                  Login
                </button>

              </p>
            ) : (
              <p>

                Don't have an account?{" "}

                <button
                  type="button"
                  className="text-btn"
                  onClick={() =>
                    onModeChange(
                      "register"
                    )
                  }
                >
                  Register
                </button>

              </p>
            )}

          </div>
        )}


        {mode ===
          "admin" && (
          <div
            style={{
              marginTop: "18px",
              textAlign: "center",
            }}
          >

            <button
              type="button"
              className="text-btn"
              onClick={() =>
                onModeChange(
                  "login"
                )
              }
            >
              User Login
            </button>

          </div>
        )}

      </div>

    </Modal>
  );
}


// ============================================================
// HOME
// ============================================================

function Home({
  events,
  loading,
  remaining,
  onView,
  onBook,
  onEvents,
}) {

  const [
    slide,
    setSlide,
  ] = useState(0);


  useEffect(() => {

    if (
      events.length < 2
    ) {
      return;
    }

    const timer =
      setInterval(() => {

        setSlide(
          (old) =>
            (
              old + 1
            ) %
            events.length
        );

      }, 5000);

    return () =>
      clearInterval(
        timer
      );

  }, [
    events.length,
  ]);


  useEffect(() => {

    if (
      slide >=
      events.length
    ) {
      setSlide(0);
    }

  }, [
    slide,
    events.length,
  ]);


  if (loading) {
    return (
      <section className="hero">

        <div className="hero-copy">

          <div className="eyebrow-pill">
            LOADING EVENTS
          </div>

          <h1>
            BOOK YOUR{" "}
            <span>SEAT.</span>
          </h1>

          <p>
            Loading the latest events...
          </p>

        </div>

      </section>
    );
  }


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
           Create,{" "}
            <span>Connect</span>
            <br />
            & Manage{" "}
            <span>Events.</span>
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
      <section className="hero">

        <div className="hero-copy">

          <div className="eyebrow-pill">
            SIMPLE EVENT MANAGEMENT SYSTEM
          </div>


          <h1>
            Create{" "}
            <span>Connect.</span>
            <br />
            & Manage{" "}
            <span>Events.</span>
          </h1>


          <p>
            View event details,
            register and
            <br />
            upload your proof of payment.
          </p>


          <button
            className="primary-btn hero-btn"
            onClick={
              onEvents
            }
          >

            <Icon
              name="calendar"
            />

            View All Events

            <Icon
              name="arrow"
            />

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
              text="Your information is protected"
            />

            <Feature
              icon="upload"
              title="Upload Proof"
              text="Upload proof of payment easily"
            />

          </div>

        </div>


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
              />
            ) : (
              <FlyerPlaceholder
                event={event}
              />
            )}


            {events.length >
              1 && (
              <>

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
                  <Icon
                    name="left"
                  />
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
                  <Icon
                    name="right"
                  />
                </button>

              </>
            )}

          </div>


          {events.length >
            1 && (
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
                      index ===
                      slide
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
          )}

        </div>

      </section>


      <section className="page-section home-events">

        <div className="section-heading compact">

          <div>

            <h2>
              Upcoming Events
            </h2>

          </div>


          <button
            className="outline-btn"
            onClick={
              onEvents
            }
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
        {String(
          event.name || ""
        )
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
        {String(
          event.venue ||
            event.location ||
            ""
        ).toUpperCase()}
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
        (event) => (

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
                  event={
                    event
                  }
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

                  {event.venue ||
                    event.location}

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

                {remaining(
                  event
                )}

                {" places remaining"}

              </span>

            </div>


            <div className="event-actions">

              <button
                className="outline-btn"
                onClick={() =>
                  onView(
                    event
                  )
                }
              >

                <Icon
                  name="eye"
                />

                View Event

              </button>


              <button
                className="primary-btn"
                disabled={
                  remaining(
                    event
                  ) === 0
                }
                onClick={() =>
                  onBook(
                    event
                  )
                }
              >

                <Icon
                  name="calendar"
                />

                {remaining(
                  event
                )
                  ? "Book Now"
                  : "Fully Booked"}

              </button>


              <button
                className="outline-btn"
                onClick={() =>
                  onShare(
                    event
                  )
                }
              >

                <Icon
                  name="share"
                />

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
// EVENT DETAILS
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
            {event.venue ||
              event.location}
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
            {event.payment_info ||
              event.paymentInfo ||
              "Please make payment using the official payment details provided by the event organiser."}
          </p>

        </div>

      </div>


      <div className="modal-actions">

        <button
          className="primary-btn"
          disabled={
            !remaining
          }
          onClick={
            onBook
          }
        >

          <Icon
            name="calendar"
          />

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

          <Icon
            name="share"
          />

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
// BOOKING
// ============================================================

function Booking({
  event,
  user,
  remaining,
  onClose,
  onSubmit,
}) {

  const [
    form,
    setForm,
  ] = useState({
    name:
      user?.user_metadata
        ?.full_name || "",

    phone:
      user?.user_metadata
        ?.phone || "",

    email:
      user?.email || "",

    quantity: 1,

    paymentReference:
      "",

    proofFile:
      null,
  });


  const [
    error,
    setError,
  ] = useState("");


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  function update(e) {
    setForm(
      (old) => ({
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
        (old) => ({
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
      (old) => ({
        ...old,
        proofFile: file,
      })
    );
  }


  async function submit(e) {
    e.preventDefault();

    if (error) return;

    if (
      !form.name.trim()
    ) {
      setError(
        "Please enter your full name."
      );

      return;
    }

    if (
      !form.phone.trim()
    ) {
      setError(
        "Please enter your phone number."
      );

      return;
    }

    setSubmitting(true);

    try {
      await onSubmit(
        form
      );
    } finally {
      setSubmitting(false);
    }
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

          {event.venue ||
            event.location}

        </p>


        <div className="remaining-line">

          {remaining}
          {" places remaining"}

        </div>


        <form
          className="booking-form"
          onSubmit={
            submit
          }
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
              required
              readOnly
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
              !!error ||
              submitting
            }
          >

            {submitting
              ? "Submitting..."
              : "Submit Registration"}

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
    setForm,
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


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  function update(e) {
    setForm(
      (old) => ({
        ...old,
        [e.target.name]:
          e.target.value,
      })
    );
  }


  async function submit(e) {
    e.preventDefault();

    setSubmitting(true);

    try {
      await onSubmit(
        form
      );
    } finally {
      setSubmitting(false);
    }
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
          onSubmit={
            submit
          }
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
              onChange={(e) =>
                setForm(
                  (old) => ({
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
            disabled={
              submitting
            }
          >

            <Icon
              name="plus"
            />

            {submitting
              ? "Saving Event..."
              : "Create Event"}

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
  loadingRegistrations,
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

            <Icon
              name="plus"
            />

            Create Event

          </button>


          <button
            className="outline-btn"
            onClick={
              onLogout
            }
          >

            <Icon
              name="logout"
            />

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


        {events.length ===
        0 ? (
          <div className="empty-state">
            No events found.
          </div>
        ) : (
          events.map(
            (event) => (

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
                    {event.venue ||
                      event.location}
                  </span>

                  <span>
                    {remaining(
                      event
                    )}
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


        {loadingRegistrations ? (
          <div className="empty-state">
            Loading registrations...
          </div>
        ) : registrations.length ===
          0 ? (
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
                  (r) => (

                    <tr
                      key={
                        r.id
                      }
                    >

                      <td>
                        {r.event_name ||
                          r.eventName}
                      </td>

                      <td>
                        {r.full_name ||
                          r.fullName}
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
                        {r.payment_reference ||
                          r.paymentReference}
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
                          r.created_at ||
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

  const type =
    registration.proof_file_type ||
    registration.proofFileType ||
    "";

  const isImage =
    type.startsWith(
      "image/"
    );

  const isPdf =
    type ===
    "application/pdf";

  const proofUrl =
    registration.proofData ||
    "";


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
          {registration.full_name ||
            registration.fullName}
        </h2>

        <p>
          {registration.proof_file_name ||
            registration.proofFileName}
        </p>

      </div>


      <div className="proof-viewer">

        {!proofUrl && (
          <div className="empty-state">
            Proof of payment could not be loaded.
          </div>
        )}


        {isImage &&
          proofUrl && (
            <img
              src={
                proofUrl
              }
              alt="Proof of payment"
            />
          )}


        {isPdf &&
          proofUrl && (
            <iframe
              src={
                proofUrl
              }
              title="Proof of payment"
            />
          )}

      </div>


      <div className="modal-actions">

        {proofUrl && (
          <a
            className="primary-btn"
            href={
              proofUrl
            }
            target="_blank"
            rel="noreferrer"
          >
            Open Proof
          </a>
        )}


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
// MODAL
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
        className={`modal-card ${className}`}
        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >

        <button
          className="modal-close"
          onClick={
            onClose
          }
        >
          <Icon
            name="close"
          />
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

      


            <span>

             <a className="brand" href="#">
  <img
    src={eventraLogo}
    alt="Eventra"
    className="brand-logo"
  />
</a>

            </span>
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