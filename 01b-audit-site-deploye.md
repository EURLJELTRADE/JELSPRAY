# Étape 1 bis : audit du site déployé

Audit réalisé le 23 juillet 2026 sur le site en production `https://jelspray.fr` et sur le dépôt
`github.com/EURLJELTRADE/JELSPRAY`, commit `bbe3911`.

Ce document remplace `01-audit-technique.md`, qui portait sur la maquette et non sur la production.

## Ce qui est réellement déployé

Le dépôt contient deux fichiers : `index.html` de 5,68 Mo, et un fichier nommé `HTML` contenant un
seul saut de ligne, sans usage. Aucun système de build, aucun fichier de configuration d'hébergement.

`index.html` est un export de bundler : une application React compilée dans le navigateur, avec les
images en base64, le contenu et les données dans un script unique.

**Point le plus important : ce n'est pas la version sans prix.** Voir le constat n° 1.

---

## Constat n° 1 : le site en production affiche des prix

Le fichier déployé contient les 21 produits avec leurs champs `ttc` et `ht`, et ces prix sont
affichés à l'écran en cinq endroits distincts : vignette catalogue, produit mis en avant, bloc
best-sellers, fiche produit, et récapitulatif de commande.

- 21 prix TTC, de 4,32 à 32,64 euros
- Mention « Livraison 15,00 € · France métropolitaine », affichée en plusieurs points
- Bloc de réassurance « Forfait 15,00 € · métropole »
- Routes de commerce actives dans le routeur : `/panier`, `/checkout`, `/checkout/success`,
  `/compte/connexion`, `/compte/profil`, `/compte/commandes`, `/compte/commande/`
- Composants `CartPage`, `CheckoutPage`, `LoginPage`, `ProfilePage`, `OrdersPage`, `CartDrawer`
  présents et atteignables

Le brief de travail décrit un site vitrine sans prix, sans prise de commande et sans compte client.
La production fait l'inverse. **Cet écart doit être tranché avant toute autre décision**, car il
détermine le balisage `Product` (avec ou sans `offers`), la stratégie de requêtes transactionnelles,
le contenu des CGV et le périmètre de la refonte.

---

## Constat n° 2 : le crawler ne reçoit aucun contenu

Une requête sur `https://jelspray.fr` renvoie un document dont la totalité du texte exploitable est :

> JELSPRAY — GRAFEN Professional JELSPRAY Unpacking...

Le `<head>` servi fait 1 694 caractères et contient : la déclaration d'encodage, un `<title>`, un
bloc `<style>` pour l'écran de chargement, et un `<noscript>` indiquant que la page nécessite
JavaScript. Aucune balise `meta description` n'est présente dans le HTML servi.

Le `<body>` servi contient un écran de chargement rouge avec le logo en SVG et la mention
« Unpacking... ». Tout le reste est produit par JavaScript.

---

## Constat n° 3 : les métadonnées existent mais sont injectées par JavaScript

Le fichier contient bien un jeu de balises complet : `title`, `description`, `canonical`,
`og:type`, `og:title`, `og:description`, `og:locale`, `twitter:card`, `robots`. Elles se trouvent
à environ 1,73 Mo dans le fichier, à l'intérieur d'une chaîne JavaScript, échappées.

Elles ne sont donc présentes qu'après exécution du script. Un moteur qui n'exécute pas le
JavaScript, ou qui l'exécute avec retard, ne les voit pas.

**Deux erreurs à corriger dans ces balises :**

1. Le `canonical` pointe vers `https://www.jelspray.fr/`, avec `www`. Le domaine canonique retenu
   est l'apex `https://jelspray.fr`. En l'état, la balise désigne une autre URL que celle servie.
2. La `meta description` est rédigée pour un site marchand, avec la mention « Livraison France ».
   Elle est cohérente avec le constat n° 1 et incohérente avec le brief.

---

## Constat n° 4 : les URL profondes renvoient probablement une erreur 404

C'est le constat qui appelle la vérification la plus urgente.

Le routeur utilise `history.pushState` et l'événement `popstate`, avec de vraies URL et non du
hash routing. Sur ce point la production est en meilleur état que la maquette ne le laissait
supposer.

Mais ce mode de routage impose une réécriture côté serveur : toutes les URL doivent renvoyer
`index.html` avec un code 200. Or le dépôt ne contient **aucun fichier de configuration
d'hébergement** : ni `404.html`, ni `_redirects`, ni `netlify.toml`, ni `vercel.json`.

Conséquence attendue : seule l'URL racine fonctionne. Un accès direct à `/produits`,
`/produit/gpbc-nettoyant-freins` ou `/blog` renvoie une erreur, aussi bien pour un visiteur qui
clique sur un lien partagé que pour un robot.

**Test à faire immédiatement** : ouvrir `https://jelspray.fr/produits` dans une fenêtre de
navigation privée. Si la page ne s'affiche pas, le constat est confirmé et devient la priorité
absolue, devant tout travail éditorial.

Correctif selon l'hébergeur :

| Hébergeur | Fichier à ajouter | Contenu |
|---|---|---|
| Netlify | `_redirects` | `/*  /index.html  200` |
| Vercel | `vercel.json` | règle de rewrite vers `/index.html` |
| GitHub Pages | `404.html` | copie de `index.html` |

---

## Constat n° 5 : le site n'est pas indexé

Une recherche combinant le nom de domaine, la marque distribuée et la ville ne fait remonter aucune
page de `jelspray.fr`.

Les résultats sont occupés par d'autres acteurs vendant la même marque : la boutique du fabricant
`grafenprofessional.nl`, Amazon.fr, bol.com et autofixer.fr. Sur ce dernier, le spray pour
ceintures de sécurité GRAFEN en 400 ml est proposé à 4,34 euros TTC, réservé aux entités
commerciales enregistrées.

Deux conséquences pour la stratégie :

1. Il n'y a pas d'historique d'indexation à préserver. La refonte peut donc modifier librement la
   structure d'URL, sans plan de redirection à construire.
2. La concurrence sur les requêtes de marque GRAFEN inclut le fabricant lui-même et des places de
   marché. C'est un élément à intégrer à l'étape 5.

---

## Constat n° 6 : performance

Un fichier unique de 5,68 Mo, images en base64, React et Babel chargés depuis un CDN, compilation
du JSX effectuée dans le navigateur du visiteur à chaque visite. Aucune mise en cache granulaire
possible, aucun format d'image moderne, aucun découpage par route.

---

## Ordre de priorité

| Rang | Action | Bloquant pour |
|---|---|---|
| 1 | Trancher la question des prix, constat n° 1 | Toute la suite |
| 2 | Vérifier et corriger le 404 sur les URL profondes, constat n° 4 | Indexation et partage de liens |
| 3 | Publier `robots.txt` et `sitemap.xml` à la racine | Découverte |
| 4 | Corriger le `canonical` vers l'apex, constat n° 3 | Cohérence |
| 5 | Créer la propriété Search Console, vérification par TXT DNS | Mesure |
| 6 | Reconstruction en rendu serveur ou statique | Constats 2, 3 et 6 |

Les points 2, 3 et 4 sont des correctifs applicables sur le site actuel, sans attendre la refonte.
Les fichiers `robots.txt` et `sitemap.xml` sont déjà produits dans `public/`, avec le domaine apex.

---

## Ce que je ne peux pas faire

Le dépôt a été cloné en lecture seule. Je ne peux pas pousser de commit : cela demande une
authentification, et je ne manipule ni jeton, ni mot de passe, ni clé d'API. Deux voies possibles :
autoriser un connecteur GitHub, qui passe par une autorisation OAuth sans que les identifiants me
soient transmis, ou appliquer vous-même un correctif que je fournis sous forme de fichiers prêts à
committer.

Search Console et GA4 restent à créer. La vérification de propriété par enregistrement TXT dans la
zone DNS relève de vous, aucun tiers ne peut la réaliser à votre place.
