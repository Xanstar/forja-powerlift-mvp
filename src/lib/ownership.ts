export const AUTHORIZATION_ERROR = "No autorizado.";

export type ResourceKind =
  | "athlete"
  | "week"
  | "day"
  | "exercise"
  | "plannedSet"
  | "record";

export type ResourceOwnership = {
  athleteId: string;
  coachId: string;
};

type LoadOwnership = (
  kind: ResourceKind,
  resourceId: string
) => Promise<ResourceOwnership | null>;

function deny(): never {
  throw new Error(AUTHORIZATION_ERROR);
}

export function createOwnershipAuthorizer(loadOwnership: LoadOwnership) {
  return {
    async requireCoach(
      coachId: string | null | undefined,
      kind: ResourceKind,
      resourceId: string,
      expectedAthleteId?: string
    ) {
      if (!coachId) deny();
      const owner = await loadOwnership(kind, resourceId);
      if (
        !owner ||
        owner.coachId !== coachId ||
        (expectedAthleteId != null && owner.athleteId !== expectedAthleteId)
      ) {
        deny();
      }
      return owner;
    },

    async requireAthlete(
      athleteId: string | null | undefined,
      kind: ResourceKind,
      resourceId: string
    ) {
      if (!athleteId) deny();
      const owner = await loadOwnership(kind, resourceId);
      if (!owner || owner.athleteId !== athleteId) deny();
      return owner;
    },
  };
}
