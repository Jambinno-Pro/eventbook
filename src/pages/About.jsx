import React from "react";
import "./About.css";

export default function About() {
  return (
    <main className="about-page">

      {/* =====================================================
          ABOUT HERO
      ====================================================== */}
      <section className="about-hero">
        <div className="about-hero-content">

          <span className="about-eyebrow">
            ABOUT EVENTRA
          </span>

          <h1>
            Events. People. Records.
          </h1>

          <p className="about-hero-text">
            Eventra is a simple event management platform designed
            to help event owners publish their events, collect
            participant registrations and keep their attendee
            records organised in one place.
          </p>

          <div className="about-hero-actions">
            <a href="#how-it-works" className="about-primary-btn">
              How It Works
            </a>

            <a href="#why-eventra" className="about-secondary-btn">
              Why Eventra
            </a>
          </div>

        </div>

        {/* Decorative Eventra visual */}
        <div className="about-hero-card">

          <div className="about-card-glow"></div>

          <div className="about-card-content">

            <div className="about-card-logo">
              E
            </div>

            <span>EVENTRA</span>

            <strong>
              Your Events.
              <br />
              Your People.
              <br />
              Your Records.
            </strong>

          </div>

        </div>
      </section>


      {/* =====================================================
          WHAT IS EVENTRA
      ====================================================== */}
      <section className="about-section" id="why-eventra">

        <div className="about-section-heading">

          <span className="about-eyebrow">
            WHAT IS EVENTRA?
          </span>

          <h2>
            Built for event owners.
          </h2>

          <p>
            Eventra brings the essential parts of event registration
            and participant management together in one simple
            platform.
          </p>

        </div>


        <div className="about-feature-grid">

          {/* Feature 1 */}
          <article className="about-feature-card">

            <div className="about-feature-icon">
              📅
            </div>

            <h3>
              Publish Events
            </h3>

            <p>
              Create and showcase your events with important details
              such as the date, time, venue, capacity, description
              and event flyer.
            </p>

          </article>


          {/* Feature 2 */}
          <article className="about-feature-card">

            <div className="about-feature-icon">
              👥
            </div>

            <h3>
              Collect Participants
            </h3>

            <p>
              Participants can register for your events and provide
              the information you need to keep accurate attendance
              records.
            </p>

          </article>


          {/* Feature 3 */}
          <article className="about-feature-card">

            <div className="about-feature-icon">
              📎
            </div>

            <h3>
              Receive Proof
            </h3>

            <p>
              Participants can upload proof of payment together
              with their registration, making it easier for event
              owners to keep everything connected.
            </p>

          </article>


          {/* Feature 4 */}
          <article className="about-feature-card">

            <div className="about-feature-icon">
              📊
            </div>

            <h3>
              Manage Records
            </h3>

            <p>
              Keep your participant information organised so you
              can easily view who registered for your events.
            </p>

          </article>

        </div>

      </section>


      {/* =====================================================
          HOW IT WORKS
      ====================================================== */}
      <section
        className="about-section about-how-section"
        id="how-it-works"
      >

        <div className="about-section-heading">

          <span className="about-eyebrow">
            HOW IT WORKS
          </span>

          <h2>
            From event to participant.
          </h2>

          <p>
            Eventra keeps the process simple for both event owners
            and participants.
          </p>

        </div>


        <div className="about-steps">

          {/* Step 1 */}
          <div className="about-step">

            <div className="about-step-number">
              01
            </div>

            <div>
              <h3>
                Create Your Event
              </h3>

              <p>
                Add your event information, date, venue, capacity,
                description and promotional flyer.
              </p>
            </div>

          </div>


          {/* Step 2 */}
          <div className="about-step">

            <div className="about-step-number">
              02
            </div>

            <div>
              <h3>
                Share Your Event
              </h3>

              <p>
                Promote your event and direct interested participants
                to your Eventra registration page.
              </p>
            </div>

          </div>


          {/* Step 3 */}
          <div className="about-step">

            <div className="about-step-number">
              03
            </div>

            <div>
              <h3>
                Participants Register
              </h3>

              <p>
                Participants provide their details, booking
                information and proof of payment where required.
              </p>
            </div>

          </div>


          {/* Step 4 */}
          <div className="about-step">

            <div className="about-step-number">
              04
            </div>

            <div>
              <h3>
                Manage Your Records
              </h3>

              <p>
                Event owners can view their registrations and keep
                their participant records organised.
              </p>
            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FOR EVENT OWNERS
      ====================================================== */}
      <section className="about-owner-section">

        <div className="about-owner-content">

          <span className="about-eyebrow">
            FOR EVENT OWNERS
          </span>

          <h2>
            Spend less time managing lists.
          </h2>

          <p>
            Your event should be about the experience, not endless
            spreadsheets, messages and scattered registration
            information.
          </p>

          <p>
            Eventra gives you one central place to publish your
            events and collect the participant information you need.
          </p>

          <div className="about-owner-points">

            <div>
              <span>✓</span>
              Easy event publishing
            </div>

            <div>
              <span>✓</span>
              Centralised participant records
            </div>

            <div>
              <span>✓</span>
              Proof-of-payment uploads
            </div>

            <div>
              <span>✓</span>
              Simple event management
            </div>

          </div>

        </div>


        <div className="about-owner-visual">

          <div className="owner-dashboard-card">

            <div className="owner-dashboard-header">
              <span>EVENTRA</span>
              <span>Participants</span>
            </div>

            <div className="owner-stat-row">

              <div className="owner-stat">
                <strong>128</strong>
                <span>Participants</span>
              </div>

              <div className="owner-stat">
                <strong>04</strong>
                <span>Events</span>
              </div>

            </div>

            <div className="owner-list">

              <div className="owner-list-item">
                <span className="owner-avatar">JM</span>
                <div>
                  <strong>John M.</strong>
                  <small>Registered participant</small>
                </div>
              </div>

              <div className="owner-list-item">
                <span className="owner-avatar">SN</span>
                <div>
                  <strong>Sarah N.</strong>
                  <small>Registered participant</small>
                </div>
              </div>

              <div className="owner-list-item">
                <span className="owner-avatar">TK</span>
                <div>
                  <strong>Thabo K.</strong>
                  <small>Registered participant</small>
                </div>
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          MISSION
      ====================================================== */}
      <section className="about-mission">

        <div className="about-mission-inner">

          <span className="about-eyebrow">
            OUR PURPOSE
          </span>

          <h2>
            Making event management simpler.
          </h2>

          <p>
            Eventra was created to make it easier for event owners
            to connect their events with the people attending them.
            By bringing event publishing, registration and
            participant records together, organisers can stay
            organised and focus on creating great experiences.
          </p>

        </div>

      </section>


      {/* =====================================================
          FINAL CTA
      ====================================================== */}
      <section className="about-cta">

        <div>

          <span className="about-eyebrow">
            READY TO GET STARTED?
          </span>

          <h2>
            Create your next event.
          </h2>

          <p>
            Publish your event, collect registrations and keep
            your participant records organised with Eventra.
          </p>

        </div>

        <a href="#events" className="about-cta-btn">
          Explore Events
        </a>

      </section>

    </main>
  );
}