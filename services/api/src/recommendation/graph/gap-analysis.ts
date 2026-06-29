// Given a topologically sorted list of all skill IDs and the user's known skill IDs,
// return only the skills the user still needs to learn — in correct learning order.
export function gapAnalysis(
  sortedSkillIds: string[],
  knownSkillIds: Set<string>
): string[] {
  return sortedSkillIds.filter(id => !knownSkillIds.has(id));
}
