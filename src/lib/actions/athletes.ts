"use server";

import { randomInt } from "node:crypto";
import { db } from "@/db";
import { athleteActivationChallenges, athletes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizePhoneE164 } from "@/lib/athlete-activation";
import { requireCoachId } from "@/lib/server-authorization";

function generarPin() {
  return randomInt(1000, 10_000).toString();
}

export async function crearAtleta(formData: FormData) {
  const coachId = await requireCoachId();

  const nombre = formData.get("nombre") as string;
  const apellido = formData.get("apellido") as string;
  const fechaNacimiento = formData.get("fechaNacimiento") as string;
  const pesoCorporal = formData.get("pesoCorporal") as string;
  const altura = formData.get("altura") as string;
  const categoria = formData.get("categoria") as string;
  const sexo = formData.get("sexo") as "masculino" | "femenino" | "";
  const notas = formData.get("notas") as string;
  const telefonoE164 = normalizePhoneE164(formData.get("telefono"));
  if (!telefonoE164) throw new Error("El teléfono debe estar en formato E.164.");

  const [nuevo] = await db
    .insert(athletes)
    .values({
      coachId,
      nombre,
      apellido,
      fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
      pesoCorporal: pesoCorporal ? parseFloat(pesoCorporal) : null,
      altura: altura ? parseFloat(altura) : null,
      categoria: categoria || null,
      sexo: sexo || null,
      notas: notas || null,
      telefonoE164,
      accessPin: generarPin(),
    })
    .returning();

  revalidatePath("/atletas");
  redirect(`/atletas/${nuevo.id}`);
}

export async function actualizarAtleta(atletaId: string, formData: FormData) {
  const coachId = await requireCoachId();

  const nombre = formData.get("nombre") as string;
  const apellido = formData.get("apellido") as string;
  const fechaNacimiento = formData.get("fechaNacimiento") as string;
  const pesoCorporal = formData.get("pesoCorporal") as string;
  const altura = formData.get("altura") as string;
  const categoria = formData.get("categoria") as string;
  const sexo = formData.get("sexo") as "masculino" | "femenino" | "";
  const estado = formData.get("estado") as "activo" | "inactivo";
  const notas = formData.get("notas") as string;
  const telefonoE164 = normalizePhoneE164(formData.get("telefono"));
  if (!telefonoE164) throw new Error("El teléfono debe estar en formato E.164.");

  const actual = await db.query.athletes.findFirst({
    where: and(eq(athletes.id, atletaId), eq(athletes.coachId, coachId)),
  });
  if (!actual) throw new Error("No autorizado");

  await db
    .update(athletes)
    .set({
      nombre,
      apellido,
      fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
      pesoCorporal: pesoCorporal ? parseFloat(pesoCorporal) : null,
      altura: altura ? parseFloat(altura) : null,
      categoria: categoria || null,
      sexo: sexo || null,
      estado,
      notas: notas || null,
      telefonoE164,
      telefonoVerificadoAt:
        actual.telefonoE164 === telefonoE164 ? actual.telefonoVerificadoAt : null,
      invitacionEnviadaAt:
        actual.telefonoE164 === telefonoE164 ? actual.invitacionEnviadaAt : null,
    })
    .where(and(eq(athletes.id, atletaId), eq(athletes.coachId, coachId)));

  if (actual.telefonoE164 !== telefonoE164) {
    await db
      .delete(athleteActivationChallenges)
      .where(eq(athleteActivationChallenges.athleteId, atletaId));
  }

  revalidatePath(`/atletas/${atletaId}`);
}

export async function eliminarAtleta(atletaId: string) {
  const coachId = await requireCoachId();

  await db
    .delete(athletes)
    .where(and(eq(athletes.id, atletaId), eq(athletes.coachId, coachId)));

  revalidatePath("/atletas");
  redirect("/atletas");
}
