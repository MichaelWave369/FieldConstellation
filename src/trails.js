/**
 * Guided trails are editorial tours, not code dependency or integration claims.
 * Resolve every stop against the validated public inventory before presenting it.
 */
export const TRAILS = [
  {
    id: 'first-light',
    title: 'First Light',
    description: 'Start at the library and observatory, then visit intelligence, art and play.',
    names: ['FieldAtlas', 'FieldConstellation', 'SuperPhiVessel', 'Domistika', 'PhiCade']
  },
  {
    id: 'makers-workshop',
    title: 'The Makers’ Workshop',
    description: 'Explore the languages, tools and creative studios used to build new worlds.',
    names: ['Phithon', 'Vibe', 'GitPorch', 'FramefieldStudio', 'RastaPhi']
  },
  {
    id: 'research-receipts',
    title: 'Research & Receipts',
    description: 'Visit research and trust projects, from hypotheses to provenance and security.',
    names: ['NestedBubbleGear', 'MRIPHI', 'RegenerationAtlas', 'FieldAccord', 'WhiteHatLedger369']
  }
];

/**
 * Missing/private projects are silently excluded; routes with fewer than three
 * public stops are not presented. No unknown name triggers a GitHub lookup.
 */
export function availableTrails(repos) {
  const publicByName = new Map(
    repos.filter(repo => repo.visibility === 'public')
      .map(repo => [repo.name.toLowerCase(), repo])
  );
  return TRAILS.map(trail => ({
    id: trail.id,
    title: trail.title,
    description: trail.description,
    stops: trail.names.map(name => publicByName.get(name.toLowerCase())).filter(Boolean)
  })).filter(trail => trail.stops.length >= 3);
}
