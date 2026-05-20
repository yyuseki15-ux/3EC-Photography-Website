"use client";

import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { CSSProperties, TouchEvent, useEffect, useRef, useState } from "react";
import basketballImage from "../../../ChatGPT Image May 19, 2026, 06_35_17 PM (1).png";
import badmintonImage from "../../../ChatGPT Image May 19, 2026, 06_35_17 PM (2).png";
import pickleballImage from "../../../ChatGPT Image May 19, 2026, 06_35_17 PM (3).png";
import tennisImage from "../../../ChatGPT Image May 19, 2026, 06_35_19 PM (4).png";
import footballImage from "../../../ChatGPT Image May 19, 2026, 06_35_19 PM (5).png";
import volleyballImage from "../../../ChatGPT Image May 19, 2026, 06_35_20 PM (6).png";

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
    name: "Badminton",
    image: badmintonImage,
    accent: "Air Control",
    motion: "High jump timing and full-body extension in one frame.",
    description: "Sharp indoor action with speed, lift, and match-night intensity."
  },
  {
    name: "Pickleball",
    image: pickleballImage,
    accent: "Quick Reach",
    motion: "Low stance, quick hands, and split-second court reactions.",
    description: "A clean modern look for fast exchanges and club content."
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
  },
  {
    name: "Volleyball",
    image: volleyballImage,
    accent: "Net Power",
    motion: "Hang time above the court with full attacking momentum.",
    description: "Ideal for spikes, blocks, and dramatic mid-air team moments."
  }
];

export default function SportsLandingPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [movingForward, setMovingForward] = useState(true);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const pauseAutoplayUntil = useRef<number>(0);

  function pauseAutoplay(durationMs = 5000) {
    pauseAutoplayUntil.current = Date.now() + durationMs;
  }

  function goToNextSlide() {
    setActiveIndex((current) => (current >= motionSlides.length - 1 ? 0 : current + 1));
  }

  function goToPreviousSlide() {
    setActiveIndex((current) => (current <= 0 ? motionSlides.length - 1 : current - 1));
  }

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (Date.now() < pauseAutoplayUntil.current) {
        return;
      }

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

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    pauseAutoplay();
    setIsDragging(true);
    setDragOffset(0);
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
    touchEndX.current = null;
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    const currentX = event.changedTouches[0]?.clientX ?? null;
    touchEndX.current = currentX;

    if (touchStartX.current !== null && currentX !== null) {
      setDragOffset(currentX - touchStartX.current);
    }
  }

  function handleTouchEnd() {
    setIsDragging(false);

    if (touchStartX.current === null || touchEndX.current === null) {
      setDragOffset(0);
      return;
    }

    const swipeDistance = touchStartX.current - touchEndX.current;
    const minimumSwipeDistance = 24;

    if (swipeDistance > minimumSwipeDistance) {
      goToNextSlide();
    } else if (swipeDistance < -minimumSwipeDistance) {
      goToPreviousSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
    setDragOffset(0);
  }

  return (
    <main className="sports-landing-page">
      <div className="customer-backdrop" aria-hidden="true" />
      <div className="page-shell sports-landing-shell">
        <section className="sports-motion-carousel-section" id="motion-carousel">
          <div className="sports-motion-topbar">
            <div className="sports-nav-brand">
              <span className="sports-nav-mark">3EC</span>
              <span className="sports-nav-name">Sports Photography</span>
            </div>
            <div className="sports-nav-links">
              <Link href="/">Book Now</Link>
            </div>
          </div>

          <div
            className={`sports-motion-carousel ${isDragging ? "dragging" : ""}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            {motionSlides.map((slide, index) => {
              const offset = index - activeIndex;
              const isActive = offset === 0;
              const distance = Math.abs(offset);
              const translateX = offset * 165 + dragOffset;
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
                      zIndex,
                      transition: isDragging ? "none" : undefined
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
      </div>
    </main>
  );
}
