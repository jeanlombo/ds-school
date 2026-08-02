DS SCHOOL — RBAC GLOBAL V3
===========================

REMPLACEMENT RECOMMANDÉ
-----------------------
Le ZIP contient le dossier app complet ainsi que lib. Pour éviter les mélanges de versions :
1. Sauvegardez votre projet actuel.
2. Remplacez entièrement le dossier app par celui du ZIP.
3. Remplacez entièrement lib/securite par celui du ZIP.
4. Conservez vos autres dossiers lib non concernés.
5. Copiez database/rbac_global_v3_permissions.sql et exécutez-le une seule fois.
6. Ajoutez dans .env : SAFE_CAMPUS_API_KEY=une_cle_longue_et_secrete

CE QUI EST PROTÉGÉ
------------------
- Toutes les fonctions export async des actions.ts détectées reçoivent exigerPermission().
- Les exports API Matières et Élèves exigent une permission.
- Le scan Safe Campus exige x-api-key.
- Les routes principales disposent d’un layout de consultation.
- Les pages /nouveau et /modifier détectées disposent d’un contrôle dédié.
- Chaque refus serveur est journalisé.

ATTENTION
---------
Consultez RAPPORT_AUDIT_RBAC.txt. Les actions sont bloquées côté serveur même si certains anciens boutons peuvent encore rester visibles. Cette liste indique les pages à convertir visuellement avec le composant Permission.

REDÉMARRAGE
-----------
cd /d C:\xampp\htdocs\ds-school
rmdir /s /q .next
npm run dev
