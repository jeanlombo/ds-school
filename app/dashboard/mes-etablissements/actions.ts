"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_ECOLE_ACTIVE, verifierAccesEcole } from "@/lib/multi-etablissement";

export async function choisirEtablissement(formData: FormData) {
  const ecoleId = Number(formData.get("ecole_id"));
  if (!Number.isInteger(ecoleId) || ecoleId <= 0) throw new Error("Établissement invalide.");

  if (!(await verifierAccesEcole(ecoleId))) {
    throw new Error("Vous n'êtes pas autorisé à accéder à cet établissement.");
  }

  const magasin = await cookies();
  magasin.set(COOKIE_ECOLE_ACTIVE, String(ecoleId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/dashboard");
}
