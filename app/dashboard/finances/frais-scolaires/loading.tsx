import styles from "./frais-scolaires.module.css";

export default function Loading() {
  return (
    <div className={styles.chargement}>
      <div />
      <p>Chargement des frais scolaires...</p>
    </div>
  );
}
