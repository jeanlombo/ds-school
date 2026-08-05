export function chaine(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

export function entier(value: FormDataEntryValue | null): number | null {
  const nombre = Number(value);
  return Number.isInteger(nombre) && nombre > 0 ? nombre : null;
}

export function nombreNonNegatif(
  value: FormDataEntryValue | null,
  defaut = 0
): number {
  const nombre = Number(value);
  return Number.isFinite(nombre) && nombre >= 0 ? nombre : defaut;
}

export function creerCodeRessource(): string {
  const maintenant = new Date();
  const date = [
    maintenant.getFullYear(),
    String(maintenant.getMonth() + 1).padStart(2, "0"),
    String(maintenant.getDate()).padStart(2, "0"),
  ].join("");

  const aleatoire = Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase();

  return `BIB-${date}-${aleatoire}`;
}
