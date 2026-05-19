export const sports = [
  "Football",
  "Basketball",
  "Pickleball",
  "Tennis",
  "Badminton",
  "Volleyball"
] as const;

export type Sport = (typeof sports)[number];
