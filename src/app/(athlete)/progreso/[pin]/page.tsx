import { notFound, redirect } from "next/navigation";
import { legacyPinAccessEnabled } from "@/lib/athlete-activation";
import { athleteForAccessPin } from "@/lib/server-authorization";

export default async function LegacyProgresoPage({
  params,
}: {
  params: Promise<{ pin: string }>;
}) {
  const { pin } = await params;
  if (!legacyPinAccessEnabled() || !(await athleteForAccessPin(pin))) notFound();
  redirect("/progreso");
}
