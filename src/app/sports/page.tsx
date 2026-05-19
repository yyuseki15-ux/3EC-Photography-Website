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
          </div>
        </nav>
      </header>

      <div className="page-shell sports-landing-shell">
        <section className="sports-motion-carousel-section" id="motion-carousel">
          <div className="sports-selector-head">
            <div>
              <span className="sports-strip-label">Auto-moving showcase</span>
              <strong>3D sports in motion</strong>
            </div>
            <span className="sports-selector-note">
              {movingForward ? "Moving left to right" : "Moving right to left"}
            </span>
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

        <section className="sports-closing-card" id="sports-closing">
          <div>
            <span className="sports-strip-label">Ready to book</span>
            <h2>Book the session after the motion showcase.</h2>
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
