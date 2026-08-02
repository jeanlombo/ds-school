# DS School Premium

Architecture initiale d'une application de gestion scolaire développée avec Next.js, TypeScript, MySQL et Prisma.

## Installation

1. Extraire le ZIP dans le dossier de votre choix.
2. Ouvrir le dossier dans VS Code.
3. Copier `.env.example` vers `.env`.
4. Créer la base MySQL `ds_school_premium`.
5. Adapter `DATABASE_URL` dans `.env`.
6. Exécuter :

```bash
npm install
npx prisma generate
npx prisma migrate dev --name initialisation
npm run dev
```

Ouvrir ensuite `http://localhost:3000`.

## Important

Ce ZIP correspond à la fondation du projet. Il faut placer le dossier complet `ds-school-premium` sur l'ordinateur. Ne le fusionnez pas encore avec un ancien projet PHP.
