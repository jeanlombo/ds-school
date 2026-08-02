"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import styles from "./module.module.css";

export default function RetourDashboard() {
  const router = useRouter();

  return (
    <button
      type="button"
      className={styles.retour}
      onClick={() => router.push("/dashboard")}
    >
      <ArrowLeft size={18} />
      Retour au Dashboard
    </button>
  );
}
