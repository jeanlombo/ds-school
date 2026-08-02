"use server";
import { exigerPermission } from "@/lib/securite/rbac";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const t = (f: FormData, n: string) => String(f.get(n) || "").trim();

export async function creerLecteurRfid(formData: FormData) {
  await exigerPermission("SAFE_CAMPUS_AJOUTER", "app/dashboard/safe-campus/lecteurs/actions.ts::creerLecteurRfid");
  const code = t(formData, "code").toUpperCase();
  const nom = t(formData, "nom");
  const emplacement = t(formData, "emplacement");

  if (!code || !nom || !emplacement) {
    throw new Error("Code, nom et emplacement obligatoires.");
  }

  await (prisma as any).lecteurRfid.create({
    data: {
      code,
      nom,
      emplacement,
      type: t(formData, "type") || "USB_HID",
      adresseIp: t(formData, "adresseIp") || null,
      port: Number(formData.get("port")) || null,
      directionDefaut: t(formData, "directionDefaut") || null,
      statut: "ACTIF",
    },
  });

  revalidatePath("/dashboard/safe-campus");
  revalidatePath("/dashboard/safe-campus/lecteurs");
}
