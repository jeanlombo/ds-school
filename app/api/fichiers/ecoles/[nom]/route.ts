import {
  lireLogoEcole,
  typeMimeLogo,
} from "@/lib/uploads/logo-ecole";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    nom: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: Props
) {
  const { nom } = await params;
  const contenu = await lireLogoEcole(nom);

  if (!contenu) {
    return NextResponse.json(
      {
        message: "Logo introuvable.",
      },
      {
        status: 404,
      }
    );
  }

  return new NextResponse(contenu, {
    status: 200,
    headers: {
      "Content-Type": typeMimeLogo(nom),
      "Content-Length": String(
        contenu.byteLength
      ),
      "Cache-Control":
        "public, max-age=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
