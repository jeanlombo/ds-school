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

const corps = new Uint8Array(contenu);

return new NextResponse(corps, {
  status: 200,
  headers: {
    "Content-Type": typeMimeLogo(nom),
    "Content-Length": String(corps.byteLength),
    "Cache-Control": "public, max-age=3600",
  },
});;
}
