import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hacherMotDePasse,
  verifierMotDePasse,
} from "@/lib/mot-de-passe";
import {
  creerSession,
  NOM_COOKIE_SESSION,
} from "@/lib/session";

type UtilisateurSecurite = {
  id: number;
  nom: string;
  email: string;
  mot_de_passe_hash: string;
  statut: string;
  role_nom: string;
};

function estStatutActif(statut: string | null | undefined): boolean {
  return String(statut ?? "").trim().toLowerCase() === "actif";
}

async function verifierHashCompatible(
  motDePasse: string,
  hashStocke: string
): Promise<boolean> {
  if (hashStocke.startsWith("scrypt:")) {
    return verifierMotDePasse(motDePasse, hashStocke);
  }

  // Compatibilité temporaire avec les comptes créés par la V1 du Centre
  // de Sécurité, qui utilisait un SHA-256 simple.
  if (/^[a-f0-9]{64}$/i.test(hashStocke)) {
    const hashPropose = createHash("sha256")
      .update(motDePasse)
      .digest("hex");

    return hashPropose.toLowerCase() === hashStocke.toLowerCase();
  }

  return false;
}

export async function POST(request: Request) {
  try {
    const corps = await request.json();
    const email = String(corps.email ?? "").trim().toLowerCase();
    const motDePasse = String(corps.motDePasse ?? "");

    if (!email || !motDePasse) {
      return NextResponse.json(
        {
          message:
            "Veuillez renseigner l’adresse e-mail et le mot de passe.",
        },
        { status: 400 }
      );
    }

    let utilisateur = await prisma.utilisateur.findUnique({
      where: { email },
    });

    if (utilisateur) {
      const valide = await verifierMotDePasse(
        motDePasse,
        utilisateur.motDePasse
      );

      if (!valide || !estStatutActif(utilisateur.statut)) {
        return NextResponse.json(
          { message: "Identifiants incorrects ou compte inactif." },
          { status: 401 }
        );
      }
    } else {
      const comptes = await prisma.$queryRaw<UtilisateurSecurite[]>`
        SELECT
          us.id,
          us.nom,
          us.email,
          us.mot_de_passe_hash,
          us.statut,
          rs.nom AS role_nom
        FROM utilisateurs_securite us
        INNER JOIN roles_securite rs ON rs.id = us.role_id
        WHERE LOWER(us.email) = ${email}
        LIMIT 1
      `;

      const compteSecurite = comptes[0];
      const valide = compteSecurite
        ? await verifierHashCompatible(
            motDePasse,
            compteSecurite.mot_de_passe_hash
          )
        : false;

      if (
        !compteSecurite ||
        !valide ||
        !estStatutActif(compteSecurite.statut)
      ) {
        return NextResponse.json(
          { message: "Identifiants incorrects ou compte inactif." },
          { status: 401 }
        );
      }

      const nouveauHash = await hacherMotDePasse(motDePasse);

      utilisateur = await prisma.$transaction(async (tx) => {
        const comptePrincipal = await tx.utilisateur.create({
          data: {
            nom: compteSecurite.nom,
            email: compteSecurite.email.toLowerCase(),
            motDePasse: nouveauHash,
            role: compteSecurite.role_nom,
            statut: "actif",
          },
        });

        await tx.$executeRaw`
          UPDATE utilisateurs_securite
          SET
            mot_de_passe_hash = ${nouveauHash},
            derniere_connexion = NOW(),
            tentatives_echouees = 0,
            verrouille_jusqua = NULL,
            updated_at = NOW()
          WHERE id = ${compteSecurite.id}
        `;

        return comptePrincipal;
      });
    }

    await prisma.$executeRaw`
      UPDATE utilisateurs_securite
      SET
        derniere_connexion = NOW(),
        tentatives_echouees = 0,
        verrouille_jusqua = NULL,
        updated_at = NOW()
      WHERE LOWER(email) = ${email}
    `.catch(() => undefined);

    const jeton = await creerSession(utilisateur.id);
    const reponse = NextResponse.json({
      succes: true,
      redirection: "/dashboard",
    });

    reponse.cookies.set(NOM_COOKIE_SESSION, jeton, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 8 * 60 * 60,
    });

    return reponse;
  } catch (erreur) {
    console.error("Erreur de connexion :", erreur);

    return NextResponse.json(
      { message: "Une erreur interne empêche la connexion." },
      { status: 500 }
    );
  }
}
