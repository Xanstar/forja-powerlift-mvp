import { z } from "zod";
import type { db } from "@/db";
import { accessRequests } from "@/db/schema";

const accessRequestSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  organization: z.string().trim().max(120),
  profile: z.enum(["coach", "gym"]),
});

export type AccessRequestInput = z.infer<typeof accessRequestSchema>;

export function parseAccessRequest(formData: FormData) {
  return accessRequestSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    organization: formData.get("organization") ?? "",
    profile: formData.get("profile"),
  });
}

export async function persistAccessRequest(
  database: Pick<typeof db, "insert">,
  request: AccessRequestInput
) {
  await database
    .insert(accessRequests)
    .values({
      name: request.name,
      email: request.email,
      organization: request.organization || null,
      profile: request.profile,
    })
    .onConflictDoNothing({ target: accessRequests.email });
}
