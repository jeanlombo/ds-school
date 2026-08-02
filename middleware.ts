import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const jeton = request.cookies.get("ds_school_session")?.value;
  const chemin = request.nextUrl.pathname;

  if (chemin.startsWith("/dashboard") && !jeton) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }

  if (chemin === "/connexion" && jeton) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/connexion"],
};
