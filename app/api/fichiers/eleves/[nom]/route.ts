import {
  lirePhotoEleve,
  typeMimePhotoEleve,
} from "@/lib/uploads/photo-eleve";

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

  const contenu = await lirePhotoEleve(nom);

  if (!contenu) {
    return NextResponse.json(
      {
        message: "Photo introuvable.",
      },
      {
        status: 404,
      }
    );
  }

  /*
   * Conversion propre du Buffer Node.js en ArrayBuffer.
   * Cela évite l’erreur TypeScript :
   * Buffer<ArrayBufferLike> incompatible avec BodyInit.
   */
  const corps = contenu.buffer.slice(
    contenu.byteOffset,
    contenu.byteOffset + contenu.byteLength
  ) as ArrayBuffer;

  return new Response(corps, {
    status: 200,
    headers: {
      "Content-Type": typeMimePhotoEleve(nom),
      "Content-Length": String(contenu.byteLength),
      "Cache-Control":
        "public, max-age=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}