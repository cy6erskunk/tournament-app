/**
 * Helpers for full placement bracket (consolation bracket) tournaments.
 *
 * In a full placement bracket with placement_size N, every player receives a
 * defined final placement. Losers from each round of a bracket section continue
 * competing in a consolation sub-section.
 *
 * Section naming convention: "c{topPlace}-{bottomPlace}"
 *   null      → main bracket (backwards compatible)
 *   "c3-4"    → 3rd/4th place match
 *   "c5-8"    → 5th–8th consolation bracket
 *   "c9-16"   → 9th–16th consolation bracket
 *   etc.
 *
 * Math: For a section covering places [top, bottom] with size N = bottom - top + 1,
 * losers of round R (1-indexed within the section) go to the consolation section:
 *   consTop    = top + N / 2^R
 *   consBottom = top + N / 2^(R-1) - 1
 *
 * The recursion terminates when consTop >= consBottom (final match → no sub-consolation).
 */

export type SectionRange = { top: number; bottom: number };

/** Parse a bracket_section string (or null for main) into a { top, bottom } range. */
export function parseBracketSection(
  section: string | null,
  placementSize: number,
): SectionRange {
  if (!section) return { top: 1, bottom: placementSize };
  const parts = section.slice(1).split("-");
  return { top: Number(parts[0]), bottom: Number(parts[1]) };
}

/** Format a { top, bottom } range as a bracket_section string. */
export function formatBracketSection(top: number, bottom: number): string {
  return `c${top}-${bottom}`;
}

/**
 * Given the current bracket section range and the round within that section (1-indexed),
 * returns the consolation section range that losers of that round should go to.
 * Returns null if this is the final match of the section (no further consolation).
 */
export function getConsolationSectionRange(
  sectionTop: number,
  sectionBottom: number,
  roundWithinSection: number,
): SectionRange | null {
  const N = sectionBottom - sectionTop + 1;
  const consTop = sectionTop + N / Math.pow(2, roundWithinSection);
  const consBottom = sectionTop + N / Math.pow(2, roundWithinSection - 1) - 1;

  // Final match of this section — no sub-consolation
  if (consTop >= consBottom) return null;

  return { top: Math.round(consTop), bottom: Math.round(consBottom) };
}

/**
 * Given a bracket match and section, returns the consolation section + match slot
 * for the loser of that match.
 *
 * matchNumberInSection: 1-indexed match number within the round of this section.
 * roundWithinSection:   1-indexed round number within this section.
 *
 * Returns null if this match's losers don't go to a consolation (e.g. the final).
 */
export function getLoserConsolationInfo(
  sectionTop: number,
  sectionBottom: number,
  roundWithinSection: number,
  matchNumberInSection: number,
): { section: string; matchSlot: number } | null {
  const consRange = getConsolationSectionRange(
    sectionTop,
    sectionBottom,
    roundWithinSection,
  );
  if (!consRange) return null;

  // Consolation match slot: pairs of losers from consecutive matches
  // Loser of match 1 and match 2 → consolation match 1
  // Loser of match 3 and match 4 → consolation match 2, etc.
  const matchSlot = Math.ceil(matchNumberInSection / 2);

  return {
    section: formatBracketSection(consRange.top, consRange.bottom),
    matchSlot,
  };
}

/**
 * Returns all consolation section ranges for a placement bracket of the given size,
 * in display order (best places first):
 * For size 16: c3-4, c5-8, c7-8, c9-16, c11-12, c13-16, c15-16
 */
export function getAllConsolationSections(placementSize: number): string[] {
  const sections: string[] = [];

  function recurse(top: number, bottom: number) {
    const N = bottom - top + 1;
    const rounds = Math.log2(N);

    // Add consolation sections from last round to first (best places first)
    for (let r = rounds - 1; r >= 1; r--) {
      const consTop = top + N / Math.pow(2, r);
      const consBottom = top + N / Math.pow(2, r - 1) - 1;
      if (consTop >= consBottom) continue;

      const section = formatBracketSection(
        Math.round(consTop),
        Math.round(consBottom),
      );
      sections.push(section);
      recurse(Math.round(consTop), Math.round(consBottom));
    }
  }

  recurse(1, placementSize);
  return sections;
}

/**
 * Human-readable label for a bracket section.
 * null → "Main bracket", "c3-4" → "3rd – 4th Place", etc.
 */
export function sectionLabel(section: string | null): string {
  if (!section) return "Main Bracket";
  const { top, bottom } = parseBracketSection(section, 0);
  if (bottom - top === 1) {
    return `${ordinal(top)} / ${ordinal(bottom)} Place`;
  }
  return `${ordinal(top)} – ${ordinal(bottom)} Place`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
