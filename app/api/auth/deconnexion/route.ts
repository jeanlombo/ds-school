import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { NOM_COOKIE_SESSION, supprimerSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const magasinCookies = await cookies();
  const jeton = magasinCookies.get(NOM_COOKIE_SESSION)?.value;

  await supprimerSession(jeton);

  const reponse = NextResponse.redirect(
    new URL("/connexion", request.url),
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
