# JELSPRAY — Spécification SEO (source de vérité pour la refonte)

> Document de référence à suivre lors de la reconstruction du site (Next.js App Router recommandé).
> **Indépendant du framework** : titres, descriptions, JSON-LD, `robots.txt` et `sitemap.xml` sont
> directement réutilisables. Contenu extrait de la maquette `JELSPRAY - sans prix.html`.
>
> **Domaine canonique arbitré : `https://jelspray.fr`**, sans `www`, sans slash final, en `https`.
> Toutes les URL de ce document, du sitemap et des `canonical` utilisent cette forme.
> À mettre en place côté serveur : redirection 301 permanente de `www.jelspray.fr` vers
> `jelspray.fr`, et de `http` vers `https`, de sorte qu'une seule forme reste accessible.
> Le domaine `jeltrade.fr` reste celui de l'adresse de contact et n'est pas le domaine du site.

---

## 1. Rappel du problème SEO principal

La maquette est une **SPA rendue côté client** (React + Babel dans le navigateur) avec **hash routing**
(`#/produits`, `#/produit/slug`…). Le HTML servi est quasi vide ; tout le contenu est injecté par JS
après chargement. Conséquences : le crawler voit une page vide, et les URL en `#` ne sont pas indexées
comme des pages distinctes.

**Correctif structurant :** passer en **SSR/SSG** (Next.js App Router), une **route réelle par page**,
HTML complet servi au crawler, et remplacer le hash routing par de vraies URL (section 2).

---

## 2. Architecture d'URL

| Route réelle | Ancien hash | Type | Génération | Nb pages |
|---|---|---|---|---|
| `/` | `#/` | Accueil | statique (SSG) | 1 |
| `/produits` | `#/produits` | Catalogue complet | statique | 1 |
| `/produits/[categorie]` | `#/produits?cat=…` | Page catégorie | statique (7) | 7 |
| `/produit/[slug]` | `#/produit/slug` | Fiche produit | statique (21) | 21 |
| `/blog` | `#/blog` | Index blog | statique | 1 |
| `/blog/[slug]` | `#/blog/slug` | Article | statique (4) | 4 |
| `/contact` | `#/contact` | Contact | statique | 1 |
| `/mentions-legales` | `#/mentions-legales` | Légal | statique | 1 |
| `/cgv` | `#/cgv` | Légal | statique | 1 |
| **Total** | | | | **38** |

**Slugs des 7 catégories :** `nettoyage`, `traitement`, `lubrification`, `electricite`, `entretien`,
`interieur`, `colles`.

**Redirections 301 à prévoir** (les anciennes URL en `#` ne se redirigent pas côté serveur, mais si
d'anciens liens indexés existent en `?cat=`, prévoir les 301 correspondantes). Éviter tout doublon
www/non-www et trailing slash via une règle de redirection unique + `canonical`.

---

## 3. Balises communes à toutes les pages

Chaque page génère : `<title>`, `<meta name="description">`, `<link rel="canonical">`, Open Graph
(`og:title`, `og:description`, `og:url`, `og:image`, `og:type`, `og:locale=fr_FR`,
`og:site_name=JELSPRAY`) et Twitter Card (`summary_large_image`). `lang="fr"` sur `<html>`.
Un seul `<h1>` par page (déjà respecté dans la maquette).

Image OG par défaut : `https://jelspray.fr/og/jelspray-default.jpg` (1200×630). Pour les fiches
produit et articles, utiliser l'image du produit / la couverture de l'article.

---

## 4. Métadonnées par page

Longueurs visées : **title ≤ ~60 caractères**, **description ~150–160 caractères**. Toutes uniques.

### 4.1 Pages principales

| Route | `title` | `meta description` |
|---|---|---|
| `/` | JELSPRAY — GRAFEN Professional, chimie auto \| Angers 49 | Distributeur officiel GRAFEN Professional à Angers (49). Chimie automobile pour particuliers et professionnels : nettoyage, lubrification, GRAFLOCK. |
| `/produits` | Tous les produits GRAFEN Professional \| JELSPRAY | Le catalogue complet GRAFEN Professional : 21 références de chimie automobile — nettoyage, traitement, lubrification, colles GRAFLOCK. Distribué par JELSPRAY. |
| `/contact` | Contact — JELSPRAY, distributeur GRAFEN à Angers | Contactez JELSPRAY (EURL JELTRADE), distributeur officiel GRAFEN Professional à Angers (49100). Questions produits, conseils et devis pros. contact@jeltrade.fr |
| `/mentions-legales` | Mentions légales \| JELSPRAY | Mentions légales du site JELSPRAY — EURL JELTRADE, 105 rue de la Chalouère, 49100 Angers. Éditeur, hébergeur et informations légales. |
| `/cgv` | Conditions générales de vente (CGV) \| JELSPRAY | Conditions générales de vente de JELSPRAY (EURL JELTRADE), distributeur GRAFEN Professional à Angers. Cadre contractuel applicable à la gamme. |

### 4.2 Pages catégories `/produits/[categorie]`

| Slug | `title` | `meta description` |
|---|---|---|
| `nettoyage` | Nettoyage auto GRAFEN — freins, moteur, carrosserie \| JELSPRAY | Nettoyants GRAFEN Professional pour l'auto : freins, carburateurs, moteur, goudron et insectes. Séchage rapide, sans résidu. Distribués par JELSPRAY à Angers. |
| `traitement` | Traitement métal GRAFEN — dérouillant, pénétrant \| JELSPRAY | Sprays de traitement GRAFEN Professional : dérouilleur, multi-pénétrant, spray de soudage. Desserrent, protègent et préviennent la corrosion. JELSPRAY, Angers. |
| `lubrification` | Lubrification GRAFEN — sprays & silicone \| JELSPRAY | Lubrifiants techniques GRAFEN Professional : spray lubrifiant liquide et silicone incolore. Réduisent friction et usure, hydrophobes. Distribués par JELSPRAY. |
| `electricite` | Électricité auto GRAFEN — contacts & connexions \| JELSPRAY | Spray de contact électrique GRAFEN Professional pour l'entretien des contacts, câbles et connexions. Séchage rapide, anti-corrosion, sans résidu. JELSPRAY Angers. |
| `entretien` | Entretien extérieur GRAFEN — pneus & finitions \| JELSPRAY | Produits d'entretien extérieur GRAFEN Professional : brillance et protection UV des pneus, effet neuf durable. Distribués par JELSPRAY à Angers (49). |
| `interieur` | Intérieur auto GRAFEN — bord, sièges, clim \| JELSPRAY | Entretien de l'habitacle avec GRAFEN Professional : tableau de bord brillant ou mat, nettoyant sièges, climatisation, ceintures. JELSPRAY, Angers. |
| `colles` | GRAFLOCK — frein-filet & étanchéité filetage \| JELSPRAY | Colles anaérobies GRAFLOCK (GRAFEN Professional) : étanchéité du filetage — bleu démontable, vert haute charge, rouge haute température. JELSPRAY Angers. |

### 4.3 Fiches produit `/produit/[slug]`

| Réf | Slug | `title` | `meta description` |
|---|---|---|---|
| GPBC | `gpbc-nettoyant-freins` | Nettoyant freins GRAFEN GPBC 500 ml \| JELSPRAY | Nettoyant freins GRAFEN Professional (GPBC, 500 ml) : élimine poussière et graisse des disques et tambours sans démontage. Séchage rapide, 360°, sans résidu. |
| GPCCS | `gpccs-nettoyant-carburateurs` | Nettoyant carburateurs GRAFEN GPCCS 500 ml \| JELSPRAY | Nettoyant carburateurs GRAFEN Professional (GPCCS, 500 ml) : dissout gomme, dépôts et laque, restaure les performances et préserve les sondes O₂. JELSPRAY. |
| GPEC | `gpec-nettoyant-moteur` | Nettoyant moteur GRAFEN GPEC 500 ml \| JELSPRAY | Nettoyant moteur GRAFEN Professional (GPEC, 500 ml) : élimine graisse, huile et saleté sans mousser, antistatique, éclat durable sur toutes surfaces. JELSPRAY. |
| GPTPC | `gptpc-goudron-insectes` | Nettoyant goudron & insectes GRAFEN GPTPC \| JELSPRAY | Nettoyant goudron et insectes GRAFEN Professional (GPTPC, 500 ml) : retire goudron, graisse et salissures sans abîmer la peinture. Application facile. JELSPRAY. |
| GPLR | `gplr-nettoyant-etiquettes` | Nettoyant étiquettes & autocollants GRAFEN \| JELSPRAY | Nettoyant étiquettes GRAFEN Professional (GPLR, 200 ml) : retire adhésifs et colle sans résidu, non corrosif, sans CFC. Distribué par JELSPRAY, Angers. |
| GPBCM | `gpbcm-nettoyant-freins-5l` | Nettoyant freins concentré 5 L GRAFEN GPBCM \| JELSPRAY | Nettoyant freins GRAFEN Professional en bidon 5 L (GPBCM) : format atelier pour garages et pros. Élimine poussière et graisse sans démontage. JELSPRAY Angers. |
| GPRR | `gprr-spray-derouilleur` | Spray dérouilleur GRAFEN GPRR 500 ml \| JELSPRAY | Spray dérouilleur GRAFEN Professional (GPRR, 500 ml) sans silicone : desserre les pièces rouillées et crée une couche anti-corrosion protectrice. JELSPRAY, Angers. |
| GPMP | `gpmp-multi-penetrant` | Multi-pénétrant GRAFEN GPMP 400 ml — 5-en-1 \| JELSPRAY | Multi-pénétrant GRAFEN Professional (GPMP, 400 ml) : 5 actions en 1 — lubrifie, nettoie, desserre, protège, chasse l'humidité. Sans silicone, 360°. JELSPRAY. |
| GPWS | `gpws-spray-soudage` | Spray de soudage sans silicone GRAFEN GPWS \| JELSPRAY | Spray de soudage GRAFEN Professional (GPWS, 400 ml) sans silicone : empêche l'adhérence des projections sur la buse, non inflammable, longue durée. JELSPRAY. |
| GPLG | `gplg-spray-lubrifiant` | Spray lubrifiant liquide GRAFEN GPLG 500 ml \| JELSPRAY | Spray lubrifiant liquide GRAFEN Professional (GPLG, 500 ml) : réduit la friction métal/plastique, tient de -10°C à +140°C, adhère à la verticale. JELSPRAY. |
| GPSS | `gpss-silicone-spray` | Silicone en spray GRAFEN GPSS 500 ml \| JELSPRAY | Silicone en spray GRAFEN Professional (GPSS, 500 ml) : lubrifiant incolore huile + silicone, réduit usure et friction, hydrophobe, anti-corrosion. JELSPRAY. |
| GPCS | `gpcs-contact-electrique` | Spray contact électrique GRAFEN GPCS 500 ml \| JELSPRAY | Spray de contact électrique GRAFEN Professional (GPCS, 500 ml) : entretien des contacts et câbles, protège de la corrosion, séchage rapide, sans résidu. JELSPRAY. |
| GPTS | `gpts-produit-pneus` | Brillant pneus GRAFEN GPTS 500 ml — protection UV \| JELSPRAY | Produit pour pneus GRAFEN Professional (GPTS, 500 ml) : fait briller, protège des UV et du dessèchement, effet neuf durable, antistatique. JELSPRAY. |
| GPCC | `gpcc-tableau-bord-brillant` | Tableau de bord brillant GRAFEN GPCC — 6 parfums \| JELSPRAY | Rénovateur tableau de bord GRAFEN Professional (GPCC, 200 ml) : fini brillant durable, prévient les fissures, 6 parfums au choix. Plastiques intérieurs. JELSPRAY. |
| GPAC | `gpac-nettoyant-climatisation` | Nettoyant climatisation auto GRAFEN GPAC \| JELSPRAY | Nettoyant climatisation GRAFEN Professional (GPAC, 150 ml) : désinfecte, détruit les bactéries et élimine les mauvaises odeurs. Usage unique. JELSPRAY Angers. |
| GPCCM | `gpccm-tableau-bord-mat` | Tableau de bord mat GRAFEN GPCCM 500 ml \| JELSPRAY | Rénovateur tableau de bord mat GRAFEN Professional (GPCCM, 500 ml) : fini mat d'origine invisible, aussi pour le cuir, séchage instantané, anti-fissures. JELSPRAY. |
| GPSC | `gpsc-nettoyant-sieges` | Nettoyant sièges & tissus GRAFEN GPSC 500 ml \| JELSPRAY | Nettoyant tissus et sièges GRAFEN Professional (GPSC, 500 ml) : mousse active qui pénètre en profondeur, ravive velours et textiles, anti-resalissure. JELSPRAY. |
| GPSBL | `gpsbl-spray-ceintures` | Spray ceintures de sécurité GRAFEN GPSBL \| JELSPRAY | Spray d'entretien des ceintures de sécurité GRAFEN Professional (GPSBL, 400 ml) : restaure l'élasticité, non collant, sans trace, protection UV. JELSPRAY. |
| GP3243 | `gp3243-graflock-bleu` | GRAFLOCK 3243 bleu — frein-filet moyen 50 ml \| JELSPRAY | GRAFLOCK 3243 (GRAFEN Professional, 50 ml) : frein-filet anaérobie de résistance moyenne, démontable, Ø 6-20 mm, -20°C à +150°C. Équivalent LOCTITE 243. JELSPRAY. |
| GP3270 | `gp3270-graflock-vert` | GRAFLOCK 3270 vert — frein-filet haute charge \| JELSPRAY | GRAFLOCK 3270 (GRAFEN Professional, 50 ml) : frein-filet anaérobie haute charge jusqu'à Ø 25 mm, -20°C à +150°C. Équivalent LOCTITE 270. Distribué par JELSPRAY. |
| GP3272 | `gp3272-graflock-rouge` | GRAFLOCK 3272 rouge — frein-filet haute temp. \| JELSPRAY | GRAFLOCK 3272 (GRAFEN Professional, 50 ml) : frein-filet anaérobie haute température, fixation maximale, -20°C à +250°C. Équivalent LOCTITE 272. JELSPRAY, Angers. |

### 4.4 Blog `/blog` et articles `/blog/[slug]`

| Route / Slug | `title` | `meta description` |
|---|---|---|
| `/blog` | Blog & conseils GRAFEN Professional \| JELSPRAY | Conseils d'experts pour l'entretien auto avec GRAFEN Professional : nettoyage des freins, choix du frein-filet GRAFLOCK, entretien du tableau de bord. Par JELSPRAY. |
| `grafen-corentin-vigor-piste` | GRAFEN, du garage à la piste avec Corentin Vigor \| JELSPRAY | Comment la gamme GRAFEN Professional accompagne la performance, du garage amateur à la compétition. Portrait et retour d'expérience. Blog JELSPRAY. |
| `nettoyer-freins-efficacement` | Comment nettoyer ses freins efficacement \| JELSPRAY | Guide pas à pas pour nettoyer disques et tambours sans démontage avec le nettoyant freins GRAFEN. Séchage rapide, sans résidu. Conseils JELSPRAY. |
| `graflock-quelle-colle` | GRAFLOCK : quel frein-filet choisir ? \| JELSPRAY | Comparatif des freins-filets GRAFLOCK : 3243 bleu démontable, 3270 vert haute charge, 3272 rouge haute température. Bien choisir selon l'assemblage. JELSPRAY. |
| `tableau-de-bord-brillant-ou-mat` | Tableau de bord : finition brillante ou mate ? \| JELSPRAY | Brillant (GPCC) ou mat (GPCCM) : comment choisir la finition de votre tableau de bord et l'appliquer sans traces. Conseils d'entretien GRAFEN par JELSPRAY. |

---

## 5. Données structurées (JSON-LD)

À injecter dans le HTML **servi** (pas après coup). Un bloc `<script type="application/ld+json">` par
type.

### 5.1 `LocalBusiness` / `Organization` — sur toutes les pages (ou au minimum accueil + contact)

```json
{
  "@context": "https://schema.org",
  "@type": "AutoPartsStore",
  "@id": "https://jelspray.fr/#business",
  "name": "JELSPRAY",
  "legalName": "EURL JELTRADE",
  "url": "https://jelspray.fr/",
  "logo": "https://jelspray.fr/logo.png",
  "image": "https://jelspray.fr/og/jelspray-default.jpg",
  "description": "Distributeur officiel de la gamme GRAFEN Professional. Chimie automobile pour particuliers et professionnels à Angers (49).",
  "email": "contact@jeltrade.fr",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "105 rue de la Chalouère",
    "postalCode": "49100",
    "addressLocality": "Angers",
    "addressRegion": "Pays de la Loire",
    "addressCountry": "FR"
  },
  "vatID": "FR7699045379",
  "taxID": "990 453 797 00013",
  "brand": { "@type": "Brand", "name": "GRAFEN Professional" },
  "areaServed": { "@type": "Country", "name": "France" }
}
```

> Ajouter `geo` (latitude/longitude) et `openingHours` si disponibles. `AutoPartsStore` est un
> sous-type de `Store`/`LocalBusiness` adapté ; à défaut, utiliser `Store`.

### 5.2 `Product` — sur chaque fiche produit (⚠️ **sans `offers` / prix**)

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Nettoyant pour freins GRAFEN GPBC 500 ml",
  "sku": "GPBC",
  "mpn": "GPBC",
  "category": "Nettoyage",
  "brand": { "@type": "Brand", "name": "GRAFEN Professional" },
  "manufacturer": { "@type": "Organization", "name": "GRAFEN Professional" },
  "image": [
    "https://jelspray.fr/produits/gpbc-nettoyant-freins-product.webp",
    "https://jelspray.fr/produits/gpbc-nettoyant-freins-usage.webp"
  ],
  "description": "Élimine la poussière et la graisse de toutes les parties des freins (disques, tambours) sans démontage. Séchage rapide, application 360°, sans résidu.",
  "url": "https://jelspray.fr/produit/gpbc-nettoyant-freins"
}
```

> Le site n'affichant ni prix ni vente, on **omet volontairement `offers`**. Conséquence attendue :
> pas de rich result « produit » avec prix dans Google (normal). `name`, `sku`, `brand`, `image`,
> `description`, `category` restent utiles pour la compréhension sémantique. Générer un bloc par
> produit à partir des données `PRODUCTS` (ref, slug, name, cat, desc).

### 5.3 `BreadcrumbList` — sur les pages profondes (fiche produit, catégorie, article)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Accueil",  "item": "https://jelspray.fr/" },
    { "@type": "ListItem", "position": 2, "name": "Produits", "item": "https://jelspray.fr/produits" },
    { "@type": "ListItem", "position": 3, "name": "Nettoyage","item": "https://jelspray.fr/produits/nettoyage" },
    { "@type": "ListItem", "position": 4, "name": "Nettoyant pour freins" }
  ]
}
```

### 5.4 `BlogPosting` — sur chaque article

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Comment nettoyer ses freins efficacement",
  "description": "Guide pas à pas pour nettoyer disques et tambours sans démontage avec le nettoyant freins GRAFEN.",
  "datePublished": "2026-05-28",
  "dateModified": "2026-05-28",
  "articleSection": "Conseils d'utilisation",
  "image": "https://jelspray.fr/blog/nettoyer-freins-efficacement.webp",
  "author":    { "@type": "Organization", "name": "JELSPRAY" },
  "publisher": {
    "@type": "Organization",
    "name": "JELSPRAY",
    "logo": { "@type": "ImageObject", "url": "https://jelspray.fr/logo.png" }
  },
  "mainEntityOfPage": "https://jelspray.fr/blog/nettoyer-freins-efficacement"
}
```

---

## 6. `robots.txt`

```
User-agent: *
Allow: /

Sitemap: https://jelspray.fr/sitemap.xml
```

> Ne rien bloquer d'indexable. Si des routes techniques existent (`/api/…`), les `Disallow`.
> Pages légales : indexables (standard) ; on peut les mettre en `priority` basse dans le sitemap.

---

## 7. `sitemap.xml`

Lister **les 38 URL réelles** (pas de `#`). Exemple de structure (à compléter pour toutes) :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://jelspray.fr/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://jelspray.fr/produits</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>

  <!-- 7 catégories -->
  <url><loc>https://jelspray.fr/produits/nettoyage</loc><priority>0.8</priority></url>
  <url><loc>https://jelspray.fr/produits/traitement</loc><priority>0.8</priority></url>
  <url><loc>https://jelspray.fr/produits/lubrification</loc><priority>0.8</priority></url>
  <url><loc>https://jelspray.fr/produits/electricite</loc><priority>0.8</priority></url>
  <url><loc>https://jelspray.fr/produits/entretien</loc><priority>0.8</priority></url>
  <url><loc>https://jelspray.fr/produits/interieur</loc><priority>0.8</priority></url>
  <url><loc>https://jelspray.fr/produits/colles</loc><priority>0.8</priority></url>

  <!-- 21 produits : /produit/{slug} (voir slugs section 4.3) -->
  <url><loc>https://jelspray.fr/produit/gpbc-nettoyant-freins</loc><priority>0.7</priority></url>
  <!-- … 20 autres … -->

  <!-- blog -->
  <url><loc>https://jelspray.fr/blog</loc><priority>0.7</priority></url>
  <url><loc>https://jelspray.fr/blog/grafen-corentin-vigor-piste</loc><priority>0.6</priority></url>
  <url><loc>https://jelspray.fr/blog/nettoyer-freins-efficacement</loc><priority>0.6</priority></url>
  <url><loc>https://jelspray.fr/blog/graflock-quelle-colle</loc><priority>0.6</priority></url>
  <url><loc>https://jelspray.fr/blog/tableau-de-bord-brillant-ou-mat</loc><priority>0.6</priority></url>

  <!-- légal / contact -->
  <url><loc>https://jelspray.fr/contact</loc><priority>0.5</priority></url>
  <url><loc>https://jelspray.fr/mentions-legales</loc><priority>0.2</priority></url>
  <url><loc>https://jelspray.fr/cgv</loc><priority>0.2</priority></url>
</urlset>
```

> En Next.js, générer le sitemap et le robots via `app/sitemap.ts` et `app/robots.ts` à partir des
> tableaux `PRODUCTS` / `CATEGORIES` / `POSTS` (une seule source, zéro oubli).

---

## 8. Images

- Sortir du **base64** (`window.PHOTO_DATA`, 3,7 Mo) : servir chaque image en **fichier séparé optimisé**.
- Convention de nommage issue de la maquette : `{slug}-product` et `{slug}-usage`.
  → p. ex. `/produits/gpbc-nettoyant-freins-product.webp`, `…-usage.webp`.
- Formats modernes **WebP/AVIF**, `loading="lazy"` (sauf image LCP au-dessus de la ligne de flottaison),
  `width`/`height` explicites (anti-CLS), `alt` descriptif et unique.
- Modèle d'`alt` produit : « {Nom du produit} GRAFEN Professional — {contenance} » (ex. « Nettoyant pour
  freins GRAFEN Professional — aérosol 500 ml »). Pour l'image d'usage : décrire l'action montrée.

---

## 9. Performance (Core Web Vitals)

- Supprimer React/Babel côté navigateur (le SSR/SSG les rend inutiles au runtime) → gros gain LCP/TBT.
- Précharger les polices **Archivo, Inter, JetBrains Mono** (`next/font` ou `<link rel="preload">`),
  `font-display: swap` (déjà présent).
- Code-splitting par route (natif App Router), images responsives (`next/image`).
- Viser LCP < 2,5 s, CLS < 0,1, INP < 200 ms.

---

## 10. Maillage interne

- Depuis chaque **fiche produit** : lien vers sa **catégorie**, vers les **produits liés**
  (champ `related` présent dans les articles ; pour les produits, relier par catégorie / best-sellers)
  et vers l'**article de blog** pertinent.
- Depuis chaque **article** : liens vers les produits cités (champ `related`, ex. `['GPCC','GPCCM']`,
  `['GPBC']`, `['GP3243','GP3270','GP3272']`).
- Depuis les **catégories** : lien retour catalogue + inter-catégories.
- Fil d'Ariane visible (déjà présent) = support naturel du `BreadcrumbList`.

Correspondances article → produits (source maquette) :
- `nettoyer-freins-efficacement` → GPBC (+ GPBCM 5 L)
- `graflock-quelle-colle` → GP3243, GP3270, GP3272
- `tableau-de-bord-brillant-ou-mat` → GPCC, GPCCM
- `grafen-corentin-vigor-piste` → gamme GRAFEN (best-sellers)

---

## 11. Rappel — ne PAS reporter dans la refonte

Composants morts hérités de la version e-commerce, présents dans la maquette mais **non atteignables** :
`CartPage`, `CheckoutPage`, `SuccessPage`, `LoginPage`, `ProfilePage`, `OrdersPage`, `CartDrawer`.
Pas de panier, pas de commande, pas de compte, **pas de prix**. Les champs `ttc`/`ht` du tableau
`PRODUCTS` **ne doivent pas** être affichés ni injectés dans le JSON-LD.

---

## 12. Ordre de mise en œuvre suggéré

1. Scaffolding Next.js (App Router) + design tokens repris de la maquette (couleurs, polices, radius).
2. Routes réelles (section 2) avec données depuis `PRODUCTS` / `CATEGORIES` / `POSTS`.
3. `generateMetadata` par route (section 4) + OG/Twitter + `canonical`.
4. JSON-LD par type (section 5).
5. `app/sitemap.ts` + `app/robots.ts` (sections 6–7).
6. Pipeline images (section 8) + `next/font` (section 9).
7. Maillage interne (section 10) + recette de vérification (Search Console, Rich Results Test, Lighthouse).
