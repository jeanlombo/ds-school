import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  NOM_COOKIE_SESSION,
  supprimerSession,
} from "@/lib/session";

function obtenirUrlPublique(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto =
    request.headers.get("x-forwarded-proto") || "https";

  /*
   * Sur Railway, x-forwarded-host contient normalement :
   * ds-school-production.up.railway.app
   */
  if (
    forwardedHost &&
    !forwardedHost.includes("localhost") &&
    !forwardedHost.includes("127.0.0.1")
  ) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const variableUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "";

  if (
    variableUrl &&
    !variableUrl.includes("localhost") &&
    !variableUrl.includes("127.0.0.1")
  ) {
    return variableUrl.startsWith("http://") ||
      variableUrl.startsWith("https://")
      ? variableUrl.replace(/\/+$/, "")
      : `https://${variableUrl.replace(/\/+$/, "")}`;
  }

  /*
   * Utilisé uniquement en développement local.
   */
  return "http://localhost:3000";
}

export async function POST(request: NextRequest) {
  const magasinCookies = await cookies();
  const jeton = magasinCookies.get(NOM_COOKIE_SESSION)?.value;

  await supprimerSession(jeton);

  const urlPublique = obtenirUrlPublique(request);
  const urlConnexion = new URL("/connexion", urlPublique);

  const reponse = NextResponse.redirect(urlConnexion, {
    status: 303,
  });

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