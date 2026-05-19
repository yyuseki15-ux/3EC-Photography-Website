"use client";

import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { CSSProperties, useEffect, useState } from "react";
import basketballImage from "../../../ChatGPT Image May 19, 2026, 06_35_17 PM (1).png";
import pickleballImage from "../../../ChatGPT Image May 19, 2026, 06_35_17 PM (2).png";
import badmintonImage from "../../../ChatGPT Image May 19, 2026, 06_35_17 PM (3).png";
import volleyballImage from "../../../ChatGPT Image May 19, 2026, 06_35_19 PM (4).png";
import tennisImage from "../../../ChatGPT Image May 19, 2026, 06_35_19 PM (5).png";
import footballImage from "../../../ChatGPT Image May 19, 2026, 06_35_20 PM (6).png";

type SportsMotionSlide = {
  name: string;
  image: StaticImageData;
  accent: string;
  motion: string;
  description: string;
};

const motionSlides: SportsMotionSlide[] = [
  {
    name: "Basketball",
    image: basketballImage,
    accent: "Arena Lift",
    motion: "Explosive elevation under bright arena lights.",
    description: "Built for posters, dunks, fast breaks, and athlete-first hero shots."
  },
  {
    name: "Pickleball",
    image: pickleballImage,
    accent: "Quick Reach",
    motion: "Low stance, quick hands, and split-second court reactions.",
    description: "A clean modern look for fast exchanges and club content."
  },
  {
    name: "Badminton",
    image: badmintonImage,
    accent: "Air Control",
    motion: "High jump timing and full-body extension in one frame.",
    description: "Sharp indoor action with speed, lift, and match-night intensity."
  },
  {
    name: "Volleyball",
    image: volleyballImage,
    accent: "Net Power",
    motion: "Hang time above the court with full attacking momentum.",
    description: "Ideal for spikes, blocks, and dramatic mid-air team moments."
  },
  {
    name: "Tennis",
    image: tennisImage,
    accent: "Baseline Pressure",
    motion: "Controlled reach and clean strike mechanics under stadium light.",
    description: "Premium action frames for rallies, serves, and match portraits."
  },
  {
    name: "Football",
    image: footballImage,
    accent: "Pitch Impact",
    motion: "Explosive leg drive and match-winning power through contact.",
    description: "Perfect for game-winning kicks, pace, and stadium atmosphere."
  }
];

export default function SportsLandingPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [movingForward, setMovingForward] = useState(true);
  const activeSlide = motionSlides[activeIndex];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => {
        if (movingForward) {
          if (current >= motionSlides.length - 1) {
            setMovingForward(false);
            return current - 1;
          }

          return current + 1;
        }

        if (current <= 0) {
          setMovingForward(true);
          return current + 1;
        }

        return current - 1;
      });
    }, 2600);

    return () => window.clearInterval(interval);
  }, [movingForward]);

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
            <a href="#motion-carousel">In Motion</a>
            <a href="#sports-closing">Contact</a>
          </div>
        </nav>
      </header>

      <div className="page-shell sports-landing-shell">
        <section className="sports-landing-hero sports-motion-hero">
          <div className="sports-landing-copy">
            <span className="sports-strip-label">3D Sports Motion Landing Page</span>
            <h1>Six sports moving left to right in one cinematic showcase.</h1>
            <p>
              This page uses your real action images as a 3D-style motion gallery so customers
              can feel the energy before they book.
            </p>

            <div className="sports-landing-actions">
              <Link href="/" className="sports-landing-primary">
                Go to booking page
              </Link>
              <a href="#motion-carousel" className="sports-landing-secondary">
                Watch the showcase
              </a>
            </div>

            <div className="sports-landing-metrics">
              <div>
                <strong>6 sports</strong>
                <span>Real action frames across court, field, and net sports.</span>
              </div>
              <div>
                <strong>3D motion feel</strong>
                <span>Cards tilt, scale, and slide automatically from left to right.</span>
              </div>
              <div>
                <strong>Sport-first storytelling</strong>
                <span>Each frame focuses on athlete motion instead of static promo blocks.</span>
              </div>
            </div>
          </div>

          <div className="sports-motion-summary">
            <span className="sports-strip-label">{activeSlide.accent}</span>
            <h2>{activeSlide.name} in motion.</h2>
            <p>{activeSlide.motion}</p>
            <div className="sports-motion-summary-copy">
              <strong>Current spotlight</strong>
              <span>{activeSlide.description}</span>
            </div>
            <div className="sports-motion-direction">
              <span>{movingForward ? "Moving left to right" : "Moving right to left"}</span>
            </div>
          </div>
        </section>

        <section className="sports-motion-carousel-section" id="motion-carousel">
          <div className="sports-selector-head">
            <div>
              <span className="sports-strip-label">Auto-moving showcase</span>
              <strong>3D carousel using your six sports images</strong>
            </div>
            <span className="sports-selector-note">Auto slides every 2.6 seconds</span>
          </div>

          <div className="sports-motion-carousel">
            {motionSlides.map((slide, index) => {
              const offset = index - activeIndex;
              const isActive = offset === 0;
              const distance = Math.abs(offset);
              const translateX = offset * 290;
              const rotateY = offset * -18;
              const scale = Math.max(0.64, 1 - distance * 0.12);
              const opacity = Math.max(0.2, 1 - distance * 0.16);
              const zIndex = motionSlides.length - distance;

              return (
                <button
                  key={slide.name}
                  type="button"
                  className={`sports-motion-card ${isActive ? "active" : ""}`}
                  style={
                    {
                      transform: `translate(-50%, -50%) translateX(${translateX}px) rotateY(${rotateY}deg) scale(${scale})`,
                      opacity,
                      zIndex
                    } as CSSProperties
                  }
                  onClick={() => setActiveIndex(index)}
                >
                  <div className="sports-motion-card-image-wrap">
                    <Image
                      src={slide.image}
                      alt={`${slide.name} athlete in motion`}
                      className="sports-motion-card-image"
                      priority={index < 2}
                    />
                    <div className="sports-motion-card-overlay" />
                  </div>
                  <div className="sports-motion-card-copy">
                    <span className="sports-strip-label">{slide.accent}</span>
                    <strong>{slide.name}</strong>
                    <p>{slide.motion}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="sports-motion-dots" aria-label="Sports image positions">
            {motionSlides.map((slide, index) => (
              <button
                key={slide.name}
                type="button"
                className={`sports-motion-dot ${activeIndex === index ? "active" : ""}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show ${slide.name}`}
              />
            ))}
          </div>
        </section>

        <section className="sports-landing-editorial sports-motion-editorial">
          {motionSlides.map((slide) => (
            <article key={slide.name}>
              <span className="sports-strip-label">{slide.name}</span>
              <strong>{slide.accent}</strong>
              <p>{slide.description}</p>
            </article>
          ))}
        </section>

        <section className="sports-closing-card" id="sports-closing">
          <div>
            <span className="sports-strip-label">Ready to book</span>
            <h2>Use the motion showcase, then send them straight to the calendar.</h2>
            <p>
              Keep this as the style-first landing page for customers who want to see the
              action before they reserve a session.
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
