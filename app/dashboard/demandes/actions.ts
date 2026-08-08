"use server";
import prisma from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { revalidatePath } from "next/cache";

const STATUTS = new Set(["NOUVELLE","EN_COURS","TRAITEE","REJETEE","CLOTUREE"]);

export async function traiterDemande(fd: FormData) {
  const u = await obtenirUtilisateurConnecte();
  if (!u?.superAdministrateur) throw new Error("Accès réservé au Super Administrateur DIGIGROUPE.");
  const id = Number(fd.get("id"));
  const statut = String(fd.get("statut")||"").toUpperCase();
  const observation = String(fd.get("observation")||"").trim().slice(0,4000);
  if (!id || !STATUTS.has(statut)) throw new Error("Demande ou statut invalide.");
  await prisma.$transaction(async tx => {
    await tx.$executeRaw`UPDATE demandes_vitrine SET statut=${statut}, observation_admin=${observation || null}, traite_par=${u.id}, date_traitement=NOW(), updated_at=NOW() WHERE id=${id}`;
    await tx.$executeRaw`INSERT INTO historique_demandes_vitrine(demande_id,utilisateur_id,statut,observation) VALUES(${id},${u.id},${statut},${observation || null})`;
  });
  revalidatePath("/dashboard/demandes");
}
