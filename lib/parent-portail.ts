import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";

export type ContexteParent = {
  utilisateur: NonNullable<
    Awaited<ReturnType<typeof obtenirUtilisateurConnecte>>
  >;
  ecoleId: number;
  parentId: number;
};

export async function obtenirContexteParent(): Promise<ContexteParent> {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();

  const lignes = await prisma.$queryRaw<
    Array<{ parent_id: number }>
  >`
    SELECT parent_id
    FROM parents_utilisateurs_portail
    WHERE ecole_id = ${ecole.id}
      AND utilisateur_securite_id =
        ${utilisateur.utilisateurSecuriteId}
      AND actif = 1
    LIMIT 1
  `;

  const parentId = lignes[0]?.parent_id;
  if (!parentId) {
    redirect("/acces-refuse?permission=PARENT_COMPTE_LIE");
  }

  return {
    utilisateur,
    ecoleId: ecole.id,
    parentId,
  };
}

export async function exigerEnfantDuParent(
  eleveId: number,
  autorisation:
    | "autorise_academique"
    | "autorise_finances"
    | "autorise_communication" = "autorise_academique"
): Promise<ContexteParent> {
  const contexte = await obtenirContexteParent();

  const colonne =
    autorisation === "autorise_finances"
      ? "autorise_finances"
      : autorisation === "autorise_communication"
        ? "autorise_communication"
        : "autorise_academique";

  const lignes = await prisma.$queryRawUnsafe<
    Array<{ id: number }>
  >(
    `SELECT id
     FROM parents_eleves
     WHERE ecole_id = ?
       AND parent_id = ?
       AND eleve_id = ?
       AND ${colonne} = 1
     LIMIT 1`,
    contexte.ecoleId,
    contexte.parentId,
    eleveId
  );

  if (!lignes.length) {
    redirect("/acces-refuse?permission=PARENT_ENFANT_AUTORISE");
  }

  return contexte;
}
