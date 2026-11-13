/** Urgency levels as the API sends them (triage level). */
export const URGENCY_LEVELS = ["RED", "ORANGE", "YELLOW", "GREEN"] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export type UrgencyShape = "octagon" | "triangle" | "diamond" | "circle";

export interface UrgencyDefinition {
  level: UrgencyLevel;
  label: string;
  description: string;
  shape: UrgencyShape;
  /** 0 is most urgent. Use for sorting (live board: urgency first, then time left). */
  rank: number;
}

export const URGENCY: Record<UrgencyLevel, UrgencyDefinition> = {
  RED: { level: "RED", label: "Critical", description: "Life-threatening", shape: "octagon", rank: 0 },
  ORANGE: { level: "ORANGE", label: "Urgent", description: "Serious, needs care soon", shape: "triangle", rank: 1 },
  YELLOW: {
    level: "YELLOW",
    label: "Moderate",
    description: "Needs care, not immediately dangerous",
    shape: "diamond",
    rank: 2,
  },
  GREEN: { level: "GREEN", label: "Minor", description: "Minor injury or illness", shape: "circle", rank: 3 },
};

export function isUrgencyLevel(value: unknown): value is UrgencyLevel {
  return typeof value === "string" && (URGENCY_LEVELS as readonly string[]).includes(value);
}

/** Comparator: most urgent first. */
export function compareUrgency(a: UrgencyLevel, b: UrgencyLevel): number {
  return URGENCY[a].rank - URGENCY[b].rank;
}
