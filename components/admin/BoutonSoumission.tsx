"use client";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Save } from "lucide-react";
import styles from "./admin.module.css";

export default function BoutonSoumission({ texte = "Enregistrer" }: { texte?: string }) {
  const { pending } = useFormStatus();
  return <button className={styles.boutonPrimaire} type="submit" disabled={pending}>{pending ? <LoaderCircle className={styles.rotation} size={18}/> : <Save size={18}/>} {pending ? "Traitement..." : texte}</button>;
}
