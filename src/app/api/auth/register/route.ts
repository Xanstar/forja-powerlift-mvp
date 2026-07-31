import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { coaches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  nombre: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { nombre, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await db.query.coaches.findFirst({
    where: eq(coaches.email, normalizedEmail),
  });
  if (existing) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese email" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.insert(coaches).values({
    nombre,
    email: normalizedEmail,
    passwordHash,
  });

  return NextResponse.json({ ok: true });
}
