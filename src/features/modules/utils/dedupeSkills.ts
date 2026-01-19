export interface SkillItem {
  criterion_key?: string;
  criterion_id?: string;
  criterion_name?: string;
  average_score?: number;
  key?: string;
  name?: string;
}

export function dedupeClientSkills(rawSkills: SkillItem[] | undefined): SkillItem[] {
  if (!Array.isArray(rawSkills)) return [];

  const seen = new Set<string>();
  const result: SkillItem[] = [];

  for (const skill of rawSkills) {
    const id = (skill.criterion_key || skill.criterion_id || skill.key || skill.name || '')
      .toString()
      .trim()
      .toLowerCase();

    if (!id) {
      result.push(skill);
      continue;
    }

    if (seen.has(id)) continue;

    seen.add(id);
    result.push(skill);
  }

  return result;
}
