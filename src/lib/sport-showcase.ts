export const sportShowcase = [
  {
    name: "Football",
    short: "FB",
    accent: "Neon Rush",
    headline: "Friday-night lights energy",
    copy: "Dynamic coverage for tackles, breakaway runs, team entrances, and sideline reactions.",
    toneClass: "football",
    actionTitle: "Full-speed breakaway",
    actionLine: "Explosive cuts, chase-down pressure, and stadium atmosphere framed in one sequence.",
    bestFor: "Kickoff drives, huddles, touchdowns, crowd noise"
  },
  {
    name: "Basketball",
    short: "BB",
    accent: "Court Vision",
    headline: "Fast cuts and clutch moments",
    copy: "Perfect for buzzer-beaters, huddles, player spotlights, and full-court storytelling.",
    toneClass: "basketball",
    actionTitle: "Rim-level intensity",
    actionLine: "Fast transitions, sharp pivots, and high-pressure finishes that feel close enough to hear.",
    bestFor: "Fast breaks, jump shots, team benches, close finishes"
  },
  {
    name: "Pickleball",
    short: "PB",
    accent: "Quick Hands",
    headline: "Sharp action in a compact space",
    copy: "Highlight quick volleys, community play, and modern court-side brand content.",
    toneClass: "pickleball",
    actionTitle: "Quick hands at the kitchen line",
    actionLine: "Compact action, quick reflexes, and community energy packaged in a modern sports look.",
    bestFor: "Volleys, doubles play, club content, social-ready moments"
  },
  {
    name: "Tennis",
    short: "TN",
    accent: "Baseline Focus",
    headline: "Clean lines, intense rallies",
    copy: "Capture serves, match tension, and elegant athlete portraits with a premium editorial feel.",
    toneClass: "tennis",
    actionTitle: "Clean contact, long rally",
    actionLine: "Elegant footwork, explosive serves, and premium athlete portraits with tournament polish.",
    bestFor: "Serves, baseline exchanges, portraits, private lessons"
  },
  {
    name: "Badminton",
    short: "BD",
    accent: "Speed & Lift",
    headline: "Light feet, explosive motion",
    copy: "Ideal for fast exchanges, indoor court drama, and sleek training-session visuals.",
    toneClass: "badminton",
    actionTitle: "Indoor speed in one frame",
    actionLine: "Quick lifts, jump smashes, and indoor-court drama captured with a cleaner, sharper edge.",
    bestFor: "Smashes, footwork drills, club sessions, match highlights"
  },
  {
    name: "Volleyball",
    short: "VB",
    accent: "Rise & Spike",
    headline: "Momentum above the net",
    copy: "Showcase jumps, celebrations, and the rhythm of team coordination in every set.",
    toneClass: "volleyball",
    actionTitle: "Hang time at the net",
    actionLine: "Blocks, spikes, and team celebrations captured with height, rhythm, and momentum.",
    bestFor: "Spikes, serves, team rotations, point celebrations"
  }
] as const;

export type SportShowcaseItem = (typeof sportShowcase)[number];
