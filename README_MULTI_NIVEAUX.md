# DS School Enterprise — Socle multi-niveaux

Ce correctif introduit une terminologie dynamique selon la section.

- Primaire / Secondaire / Humanités → Élève, Classe, Matière, Bulletin scolaire, Carte d'élève.
- Université → Étudiant, Promotion, Faculté/Département, Cours/UE, Semestre, Relevé de notes, Carte d'étudiant.
- Institut supérieur → Étudiant, Promotion, Section/Département, Cours/UE, Semestre, Relevé de notes, Carte d'étudiant.

Important : on ne renomme pas la table Prisma `Eleve` maintenant. Elle reste interne pour éviter de casser inscriptions, parents, Safe Campus, paiements, notes et documents.

Les pages doivent importer `obtenirProfilAcademique()` ou `obtenirProfilAcademiqueParEleve()` et utiliser les libellés dynamiques.

Exemple :
```tsx
const profil = await obtenirProfilAcademiqueParEleve(eleve.id);
<h1>{profil.carteTitre}</h1>
```
