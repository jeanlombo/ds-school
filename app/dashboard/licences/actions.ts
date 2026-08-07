"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuInitialiserLicence } from "@/lib/licence";

function texte(f: FormData, c: string) { return String(f.get(c) ?? "").trim(); }
function entier(f: FormData, c: string, defaut = 0) { const n = Number(f.get(c)); return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : defaut; }
function coche(f: FormData, c: string) { return f.get(c) === "on" || f.get(c) === "1"; }
function dateOuNull(v: string) { if (!v) return null; const d = new Date(`${v}T00:00:00`); return Number.isNaN(d.getTime()) ? null : d; }

async function superAdmin() {
  const u = await obtenirUtilisateurConnecte();
  if (!u) redirect("/connexion");
  if (u.superAdministrateur !== true) redirect("/acces-refuse?permission=SUPER_ADMIN_LICENCES");
  return u;
}

export async function enregistrerLicence(formData: FormData) {
  const u = await superAdmin();
  const ecoleId = entier(formData, "ecoleId");
  if (!ecoleId) redirect("/dashboard/licences?erreur=ecole");
  const ancienne = await obtenirOuInitialiserLicence(ecoleId);

  const formule = texte(formData,"formule") || "Standard";
  const planStandard = texte(formData,"planStandard") || formule;
  const statut = (["actif","expire","suspendu","en_attente"].includes(texte(formData,"statut")) ? texte(formData,"statut") : "actif") as "actif"|"expire"|"suspendu"|"en_attente";
  const dateDebut = dateOuNull(texte(formData,"dateDebut"));
  const dateExpiration = dateOuNull(texte(formData,"dateExpiration"));
  const maxEleves=entier(formData,"maxEleves",300), maxEnseignants=entier(formData,"maxEnseignants",30), maxUtilisateurs=entier(formData,"maxUtilisateurs",10);
  const maxParents=entier(formData,"maxParents",300), maxClasses=entier(formData,"maxClasses",20), maxSections=entier(formData,"maxSections",10), maxSalles=entier(formData,"maxSalles",50);
  const stockageMaxGo=entier(formData,"stockageMaxGo",5), smsMax=entier(formData,"smsMax"), emailsMax=entier(formData,"emailsMax");
  const quotaPersonnalise=coche(formData,"quotaPersonnalise"), elevesIllimite=coche(formData,"elevesIllimite"), enseignantsIllimite=coche(formData,"enseignantsIllimite"), utilisateursIllimite=coche(formData,"utilisateursIllimite"), stockageIllimite=coche(formData,"stockageIllimite");
  const observations=texte(formData,"observations") || null, motif=texte(formData,"motif") || "Mise à jour administrative de la licence";

  await prisma.$executeRaw`
    UPDATE licences SET
      formule=${formule}, quota_personnalise=${quotaPersonnalise?1:0}, plan_standard=${planStandard},
      observations=${observations}, date_debut=${dateDebut}, date_expiration=${dateExpiration}, statut=${statut},
      max_eleves=${maxEleves}, max_enseignants=${maxEnseignants}, max_utilisateurs=${maxUtilisateurs}, max_parents=${maxParents},
      max_classes=${maxClasses}, max_sections=${maxSections}, max_salles=${maxSalles}, stockage_max_go=${stockageMaxGo},
      sms_max=${smsMax}, emails_max=${emailsMax}, eleves_illimite=${elevesIllimite?1:0}, enseignants_illimite=${enseignantsIllimite?1:0},
      utilisateurs_illimite=${utilisateursIllimite?1:0}, stockage_illimite=${stockageIllimite?1:0}, updated_at=NOW()
    WHERE id=${ancienne.id}
  `;

  const nouveau = await obtenirOuInitialiserLicence(ecoleId);
  const changements: Array<[string, unknown, unknown]> = [
    ["Formule",ancienne.formule,nouveau.formule],["Quota élèves",ancienne.maxEleves,nouveau.maxEleves],
    ["Quota enseignants",ancienne.maxEnseignants,nouveau.maxEnseignants],["Quota utilisateurs",ancienne.maxUtilisateurs,nouveau.maxUtilisateurs],
    ["Quota parents",ancienne.maxParents,nouveau.maxParents],["Quota classes",ancienne.maxClasses,nouveau.maxClasses],
    ["Quota sections",ancienne.maxSections,nouveau.maxSections],["Quota salles",ancienne.maxSalles,nouveau.maxSalles],
    ["Stockage Go",ancienne.stockageMaxGo,nouveau.stockageMaxGo],["Statut",ancienne.statut,nouveau.statut],
    ["Date expiration",ancienne.dateExpiration?.toISOString().slice(0,10) ?? "",nouveau.dateExpiration?.toISOString().slice(0,10) ?? ""],
  ];
  for (const [champ,avant,apres] of changements) {
    if (String(avant ?? "") === String(apres ?? "")) continue;
    await prisma.$executeRaw`
      INSERT INTO licence_historique (licence_id, utilisateur_id, action, ancienne_valeur, nouvelle_valeur, motif, created_at)
      VALUES (${nouveau.id}, ${u.utilisateurSecuriteId ?? null}, ${champ}, ${String(avant ?? "")}, ${String(apres ?? "")}, ${motif}, NOW())
    `;
  }
  revalidatePath("/dashboard/licences"); revalidatePath("/dashboard");
  redirect(`/dashboard/licences?succes=${encodeURIComponent("Licence mise à jour")}`);
}

export async function enregistrerPaiementLicence(formData: FormData) {
  const u = await superAdmin();
  const ecoleId=entier(formData,"ecoleId");
  const licence=await obtenirOuInitialiserLicence(ecoleId);
  const montant=Number(texte(formData,"montant") || 0), devise=texte(formData,"devise") || "USD", mode=texte(formData,"modePaiement") || "Autre";
  const reference=texte(formData,"reference") || null, datePaiement=dateOuNull(texte(formData,"datePaiement")) || new Date(), nouvelleExpiration=dateOuNull(texte(formData,"nouvelleExpiration"));
  if (!(montant>0)) redirect("/dashboard/licences?erreur=montant");
  await prisma.$executeRaw`
    INSERT INTO licence_paiements (licence_id,montant,devise,mode_paiement,reference,date_paiement,date_expiration,created_at)
    VALUES (${licence.id},${montant},${devise},${mode},${reference},${datePaiement},${nouvelleExpiration},NOW())
  `;
  if (nouvelleExpiration) await prisma.$executeRaw`UPDATE licences SET date_expiration=${nouvelleExpiration}, statut='actif', updated_at=NOW() WHERE id=${licence.id}`;
  await prisma.$executeRaw`
    INSERT INTO licence_historique (licence_id,utilisateur_id,action,ancienne_valeur,nouvelle_valeur,motif,created_at)
    VALUES (${licence.id},${u.utilisateurSecuriteId ?? null},'PAIEMENT','',${`${montant} ${devise}`},${reference ? `Référence ${reference}` : 'Renouvellement / paiement'},NOW())
  `;
  revalidatePath("/dashboard/licences"); revalidatePath("/dashboard");
  redirect(`/dashboard/licences?succes=${encodeURIComponent("Paiement enregistré")}`);
}
