# Workflow éditorial SEO JELSPRAY

Chaque article est un fichier JSON dans `content/blog/`. Le nom du fichier doit être identique au slug.

## Brief recommandé
- Mot-clé principal
- Intention de recherche
- Question concrète à résoudre
- Produits GRAFEN réellement pertinents
- Public visé : particulier, garage, atelier ou revendeur
- Angle différenciant / expérience JELSPRAY

## Règles
1. Répondre d'abord à l'intention de recherche ; ne pas écrire pour remplir une longueur.
2. Ne jamais inventer une caractéristique produit, une norme, un prix, un avis ou un résultat de test.
3. Utiliser les références GRAFEN dans `related` uniquement lorsqu'elles sont pertinentes.
4. Un seul H1 est fourni par `title`; les objets `body[].h` deviennent les sections de l'article.
5. Éviter les articles quasi identiques ciblant seulement des variantes de mots-clés.
6. Préférer un maillage vers les fiches produits et les articles complémentaires.
7. Toute publication passe par une branche/PR et une validation humaine avant merge.

## Publication
Créer le JSON depuis `content/blog/_template.json`, puis exécuter `npm run validate:blog`. Le build Netlify génère ensuite les données du blog, la page statique SEO et l'entrée sitemap.
