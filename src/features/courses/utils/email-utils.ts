/**
 * Shared utilities for email processing
 */

export interface Skill {
  name: string;
  key?: string;
  score: number;
  individualScores?: (number | string)[];
}

export interface ClientSkill {
  criterion_id?: string;
  criterion_key?: string;
  criterion_name?: string;
  average_score?: number;
  score?: number;
}

/**
 * Utility for removing/merging duplicate criteria
 */
export function dedupeSkills(skills: Skill[]): Skill[] {
  function normalizeId(s?: string): string {
    if (!s) return '';
    try {
      const normalized = s
        .toString()
        .normalize('NFKD')
        .replace(/\p{M}/gu, '')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()
        .toLowerCase();
      return normalized;
    } catch {
      return s.toString().trim().toLowerCase();
    }
  }

  const map = new Map<string, Skill>();
  const unkeyed: Skill[] = [];

  for (const skill of skills) {
    const rawId = skill.key ?? skill.name ?? '';
    const id = normalizeId(rawId);

    if (!id) {
      unkeyed.push(skill);
      continue;
    }

    const existing = map.get(id);
    if (!existing) {
      map.set(id, {
        name: skill.name,
        key: skill.key,
        score: skill.score,
        individualScores: skill.individualScores ? [...skill.individualScores] : undefined,
      });
    } else {
      // Use longer name if available
      if (skill.name && skill.name.length > (existing.name ?? '').length) {
        existing.name = skill.name;
      }
      // Add key if missing
      if (!existing.key && skill.key) {
        existing.key = skill.key;
      }

      // Calculate average score
      const avg = Math.round((((existing.score ?? 0) + (skill.score ?? 0)) / 2) * 10) / 10;
      existing.score = avg;

      // Merge individual scores
      if (skill.individualScores && skill.individualScores.length > 0) {
        existing.individualScores = Array.from(
          new Set([...(existing.individualScores ?? []), ...skill.individualScores]),
        );
      }
    }
  }

  return [...map.values(), ...unkeyed];
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(str: unknown): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Normalize score to 1 decimal place
 */
export function normalizeScore(score: number | undefined | null): number | undefined {
  if (typeof score === 'number' && Number.isFinite(score)) {
    return Math.round(score * 10) / 10;
  }
  return undefined;
}
