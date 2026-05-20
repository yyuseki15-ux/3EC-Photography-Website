import Image from "next/image";
import Link from "next/link";
import heroImage from "../../ChatGPT Image May 19, 2026, 06_35_19 PM (4).png";
import editorialImage from "../../ChatGPT Image May 19, 2026, 06_35_17 PM (2).png";
import galleryImage from "../../ChatGPT Image May 19, 2026, 06_35_20 PM (6).png";

export default function Home() {
  return (
    <main className="photo-home">
      <div className="photo-home__glow photo-home__glow--left" aria-hidden="true" />
      <div className="photo-home__glow photo-home__glow--right" aria-hidden="true" />

      <header className="photo-nav">
        <Link className="photo-brand" href="/">
          <span className="photo-brand__mark">3EC</span>
          <span className="photo-brand__text">Luxury Photography</span>
        </Link>
        <nav className="photo-nav__links" aria-label="Primary">
          <a href="#portfolio">Portfolio</a>
          <a href="#experience">Experience</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <section className="photo-hero">
        <div className="photo-hero__copy">
          <span className="photo-kicker">Clean modern. Cinematic dark. Luxury storytelling.</span>
          <h1>Photography designed like a quiet film still.</h1>
          <p>
            3EC creates polished portrait, wedding, and editorial imagery with a restrained
            luxury aesthetic, art-directed light, and a gallery experience that feels intentional
            from the first frame to final delivery.
          </p>
          <div className="photo-hero__actions">
            <Link className="photo-button photo-button--solid" href="/book">
              Book a session
            </Link>
            <a className="photo-button photo-button--ghost" href="#portfolio">
              View signature work
            </a>
          </div>
          <div className="photo-metrics" aria-label="Studio highlights">
            <article>
              <strong>Luxury Direction</strong>
              <span>Editorial posing, refined color, and intentional negative space.</span>
            </article>
            <article>
              <strong>Cinematic Finish</strong>
              <span>Moody contrast, sculpted light, and premium retouching.</span>
            </article>
            <article>
              <strong>Private Experience</strong>
              <span>Calm planning, selective booking, and bespoke gallery delivery.</span>
            </article>
          </div>
        </div>

        <div className="photo-hero__media">
          <article className="photo-frame photo-frame--hero">
            <Image
              src={heroImage}
              alt="Luxury portrait photography hero composition"
              priority
              className="photo-image"
            />
          </article>
          <aside className="photo-note">
            <span className="photo-note__eyebrow">Art Direction</span>
            <strong>
              Built for brands, couples, and portrait sessions that want elegance without excess.
            </strong>
          </aside>
        </div>
      </section>

      <section className="photo-editorial" id="portfolio">
        <div className="photo-section-heading">
          <span>Selected portfolio</span>
          <h2>Three moods, one signature point of view.</h2>
        </div>

        <div className="photo-editorial__grid">
          <article className="photo-panel photo-panel--copy">
            <span className="photo-panel__label">01</span>
            <h3>Luxury portraiture</h3>
            <p>
              Soft direction, sculpted wardrobe tones, and images that feel collected rather than
              crowded.
            </p>
          </article>

          <article className="photo-panel photo-panel--image">
            <Image src={editorialImage} alt="Editorial photography sample" className="photo-image" />
          </article>

          <article className="photo-panel photo-panel--image photo-panel--tall">
            <Image src={galleryImage} alt="Cinematic dark photography sample" className="photo-image" />
          </article>

          <article className="photo-panel photo-panel--copy photo-panel--accent">
            <span className="photo-panel__label">02</span>
            <h3>Cinematic receptions</h3>
            <p>
              Evening light, glossy blacks, and a dramatic finish that still keeps skin and fabric
              believable.
            </p>
          </article>
        </div>
      </section>

      <section className="photo-services" id="experience">
        <div className="photo-section-heading">
          <span>The experience</span>
          <h2>A modern luxury studio flow, from inquiry to delivery.</h2>
        </div>

        <div className="photo-services__grid">
          <article>
            <strong>Pre-production</strong>
            <p>Creative calls, wardrobe guidance, location moodboards, and shot planning.</p>
          </article>
          <article>
            <strong>Shoot day</strong>
            <p>Calm direction on set with a focus on movement, texture, and clean composition.</p>
          </article>
          <article>
            <strong>Final gallery</strong>
            <p>Curated edits, premium retouching, and a private delivery experience.</p>
          </article>
        </div>
      </section>

      <section className="photo-cta" id="contact">
        <div className="photo-cta__copy">
          <span>Now booking</span>
          <h2>Let&apos;s create a gallery that feels expensive, intimate, and timeless.</h2>
        </div>
        <div className="photo-hero__actions">
          <Link className="photo-button photo-button--solid" href="/book">
            Go to booking
          </Link>
          <a className="photo-button photo-button--ghost" href="mailto:hello@3ecphotography.com">
            hello@3ecphotography.com
          </a>
        </div>
      </section>
    </main>
  );
}
