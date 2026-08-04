import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const jeton = request.cookies.get("ds_school_session")?.value;
  const chemin = request.nextUrl.pathname;

  if (chemin.startsWith("/dashboard") && !jeton) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (chemin === "/connexion" && jeton) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/connexion"],
};