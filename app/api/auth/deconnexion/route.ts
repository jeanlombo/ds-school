import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  NOM_COOKIE_SESSION,
  supprimerSession,
} from "@/lib/session";

export async function POST() {
  const magasinCookies = await cookies();
  const jeton = magasinCookies.get(NOM_COOKIE_SESSION)?.value;

  await supprimerSession(jeton);

  const reponse = NextResponse.json(
    {
      succes: true,
      redirection: "/connexion",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
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