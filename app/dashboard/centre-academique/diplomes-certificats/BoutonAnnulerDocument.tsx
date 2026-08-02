"use client";

import { Ban } from "lucide-react";
import { useState } from "react";

type Props = {
  documentId: number;
  action: (formData: FormData) => void | Promise<void>;
};

export default function BoutonAnnulerDocument({
  documentId,
  action,
}: Props) {
  const [enCours, setEnCours] = useState(false);

  return (
    <form
      action={async (formData) => {
        const confirme = window.confirm(
          "Annuler définitivement ce document académique ?"
        );

        if (!confirme) return;

        try {
          setEnCours(true);
          await action(formData);
        } finally {
          setEnCours(false);
        }
      }}
    >
      <input
        type="hidden"
        name="id"
        value={documentId}
      />

      <button
        type="submit"
        disabled={enCours}
      >
        <Ban size={16} />
        {enCours ? "Annulation..." : "Annuler"}
      </button>
    </form>
  );
}
