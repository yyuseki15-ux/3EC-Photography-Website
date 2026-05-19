"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { sportShowcase } from "@/lib/sport-showcase";

export default function SportsLandingPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSport = sportShowcase[activeIndex];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % sportShowcase.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="sports-landing-page">
      <div className="customer-backdrop" aria-hidden="true" />
      <header className="sports-nav-shell">
        <nav className="sports-nav">
          <div className="sports-nav-brand">
            <span className="sports-nav-mark">3EC</span>
            <span className="sports-nav-name">Sports Photography</span>
          </div>
          <div className="sports-nav-links">
            <Link href="/">Book Now</Link>
            <a href="#sport-action-grid">6 Sports</a>
            <a href="#sports-closing">Contact</a>
          </div>
        </nav>
      </header>

      <div className="page-shell sports-landing-shell">
        <section className="sports-landing-hero">
          <div className="sports-landing-copy">
            <span className="sports-strip-label">Separate Sports Landing Page</span>
            <h1>Six sports. One action-first camera style.</h1>
            <p>
              A dedicated showcase for football, basketball, pickleball, tennis, badminton,
              and volleyball. Built to feel more like a sports campaign than a plain booking
              page.
            </p>

            <div className="sports-landing-actions">
              <Link href="/" className="sports-landing-primary">
                Go to booking page
              </Link>
              <a href="#sport-action-grid" className="sports-landing-secondary">
                Explore all 6 sports
              </a>
            </div>

            <div className="sports-landing-metrics">
              <div>
                <strong>6</strong>
                <span>Sports covered</span>
              </div>
              <div>
                <strong>Action-first</strong>
                <span>Built for movement, not static poses</span>
              </div>
              <div>
                <strong>Editorial feel</strong>
                <span>High-contrast layouts with cinematic energy</span>
              </div>
            </div>
          </div>

          <div className={`sports-action-stage ${activeSport.toneClass}`}>
            <div className="sports-action-stage-copy">
              <span className="sports-strip-label">{activeSport.accent}</span>
              <h2>{activeSport.actionTitle}</h2>
              <p>{activeSport.actionLine}</p>
            </div>
            <div className="sports-action-figure" aria-hidden="true">
              <span className="sports-action-initials">{activeSport.short}</span>
              <span className="sports-action-glow" />
              <span className="sports-action-slice sports-action-slice-one" />
              <span className="sports-action-slice sports-action-slice-two" />
            </div>
          </div>
        </section>

        <section className="sports-landing-selector">
          <div className="sports-selector-head">
            <div>
              <span className="sports-strip-label">Auto-rotating spotlight</span>
              <strong>Select a sport or let the page rotate on its own</strong>
            </div>
            <span className="sports-selector-note">Switches every 4.5 seconds</span>
          </div>

          <div className="sports-logo-grid sports-landing-logo-grid" role="tablist" aria-label="Six sports showcase">
            {sportShowcase.map((sport, index) => (
              <button
                key={sport.name}
                className={`sports-logo-button ${activeIndex === index ? "active" : ""}`}
                type="button"
                onClick={() => setActiveIndex(index)}
              >
                <span className="sports-logo-mark">{sport.short}</span>
                <span className="sports-logo-name">{sport.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="sports-action-grid" id="sport-action-grid">
          {sportShowcase.map((sport, index) => (
            <article
              key={sport.name}
              className={`sports-action-card ${sport.toneClass} ${activeIndex === index ? "active" : ""}`}
            >
              <div className="sports-action-card-top">
                <span className="sports-strip-label">{sport.name}</span>
                <span className="sports-action-card-index">0{index + 1}</span>
              </div>
              <h3>{sport.headline}</h3>
              <p>{sport.copy}</p>
              <div className="sports-action-card-photo" aria-hidden="true">
                <span>{sport.short}</span>
              </div>
              <div className="sports-action-card-footer">
                <strong>{sport.actionTitle}</strong>
                <span>{sport.bestFor}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="sports-landing-editorial">
          <article className="sports-landing-editorial-main">
            <span className="sports-strip-label">Editorial layout</span>
            <h2>Designed like a sports feature spread.</h2>
            <p>
              This separate landing page gives each sport space to feel distinct while still
              pointing people back to one simple booking flow.
            </p>
          </article>
          <article>
            <span className="sports-strip-label">Use it for</span>
            <strong>Parents, teams, schools, clubs</strong>
            <p>Send this page when you want customers to feel the style before they book.</p>
          </article>
          <article>
            <span className="sports-strip-label">Best moment types</span>
            <strong>Motion, reaction, spotlight portraits</strong>
            <p>It frames each sport around action, pace, and athlete presence.</p>
          </article>
        </section>

        <section className="sports-closing-card" id="sports-closing">
          <div>
            <span className="sports-strip-label">Ready to book</span>
            <h2>Send customers from the showcase straight into booking.</h2>
            <p>
              Keep this page as your style-first entry point, then move them to the live
              booking calendar when they are ready.
            </p>
          </div>
          <div className="sports-landing-actions">
            <Link href="/" className="sports-landing-primary">
              Book a sports session
            </Link>
            <Link href="/unavailable-dates" className="sports-landing-secondary">
              View unavailable dates
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
