export type ProspectCRM = {
  id: number; ecole_id: number; code: string; nom_eleve: string; postnom_eleve: string | null;
  prenom_eleve: string | null; sexe: string | null; date_naissance: Date | null;
  nom_responsable: string; telephone: string; telephone_secondaire: string | null; email: string | null;
  adresse: string | null; ville: string | null; ecole_origine: string | null; classe_souhaitee: string | null;
  annee_scolaire: string | null; source: string; statut: string; priorite: string; score: number;
  montant_estime: { toString(): string } | number; devise: string; conseiller: string | null;
  prochaine_relance: Date | null; notes: string | null; date_conversion: Date | null;
  created_at: Date; updated_at: Date;
};

export const ETAPES_CRM = [
  ["NOUVEAU", "Nouveau"], ["CONTACTE", "Contacté"], ["INTERESSE", "Intéressé"],
  ["RENDEZ_VOUS", "Rendez-vous"], ["VISITE", "Visite"], ["DOSSIER_RECU", "Dossier reçu"],
  ["VALIDATION", "Validation"], ["PAIEMENT", "Paiement"], ["INSCRIPTION", "Inscription"], ["PERDU", "Perdu"],
] as const;

export function libelleStatut(statut: string) {
  return ETAPES_CRM.find(([code]) => code === statut)?.[1] ?? statut;
}
