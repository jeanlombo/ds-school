import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { NOM_COOKIE_SESSION, supprimerSession } from "@/lib/session";

export async function POST() {
  const magasinCookies = await cookies();
  const jeton = magasinCookies.get(NOM_COOKIE_SESSION)?.value;

  await supprimerSession(jeton);

  // Utilise toujours l'URL publique de l'application
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";

  const reponse = NextResponse.redirect(
    `${appUrl}/connexion`,
    { status: 303 }
  );

  reponse.cookies.set(NOM_COOKIE_SESSION, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });

  return reponse;
}