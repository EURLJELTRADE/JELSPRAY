# Passation : projet SEO JELSPRAY

Document à fournir en début de nouvelle conversation, avec le dossier de livrables.
Dernière mise à jour : 24 juillet 2026.

---

## 1. Le client et le projet

**JELSPRAY**, nom commercial de l'**EURL JELTRADE**, 105 rue de la Chalouère, 49100 Angers.
SIRET 990 453 797 00013, TVA FR7699045379, contact `contact@jeltrade.fr`.

Distributeur officiel de **GRAFEN Professional**, marque de chimie automobile du fabricant
polonais Madejski Industrial Technology (Kraków). Catalogue de **21 références** réparties en
**7 catégories** : nettoyage, traitement, lubrification, électricité, entretien, intérieur,
colles GRAFLOCK.

**Mission** : stratégie SEO complète de type autorité thématique, exécutée de bout en bout.
Le brief client couvre 7 étapes : audit et infrastructure, carte de mots-clés, plan éditorial,
rédaction et publication, contenu défensif face aux concurrents, contenu réactif d'actualité,
autorité éditoriale et backlinks.

**Cible** : audience professionnelle, pas grand public. Mécaniciens réparateurs indépendants,
chefs d'atelier, carrossiers, gestionnaires de flotte, ateliers agricoles et TP, collectivités.

---

## 2. Décisions arrêtées, à ne pas rouvrir

| Sujet | Décision |
|---|---|
| Domaine canonique | `https://jelspray.fr`, apex **sans www**, sans slash final |
| Modèle du site | Vitrine **sans prix**, sans commande, sans compte client |
| Hébergement | **Netlify**, dépôt `github.com/EURLJELTRADE/JELSPRAY` |
| Mesure d'audience | **GA4 en direct**, `G-RJR1TZJT19`, sans Tag Manager |
| Prix | Supprimés **des données**, pas seulement masqués |
| Photos d'usage | Conservées telles quelles, non remplacées |

---

## 3. Règles de rédaction imposées par le client

À respecter en permanence, sans exception :

- Jamais de superlatifs
- **Jamais de tirets cadratins** (em dashes)
- Jamais de langue marketing générique
- Toujours des spécifications concrètes quand un produit est mentionné
- Sources citées **en italique en bas d'article**
- Le produit apparaît en **avant-dernière section**, jamais en ouverture
- Articles longs, 1 200 à 2 000 mots, pour les sujets principaux
- Rédaction en français, ton factuel et direct

Le client valide par « oui » ou « on continue » et attend un enchaînement immédiat.
Il ne veut pas effectuer de modifications manuelles.

Note : trois noms du catalogue contenaient des tirets cadratins. Ils ont été normalisés avec
deux-points. Décision non contestée par le client à ce jour.

---

## 4. État du site

**En production** : `https://jelspray.fr`, SPA React monofichier compilée par Babel dans le
navigateur. Routage `pushState`.

**Version déployée au 24 juillet 2026 : obsolète.** Elle affiche encore les prix et ne contient
aucun des correctifs. Le dépôt GitHub a été vidé par le client puis n'a pas été réalimenté.
L'ancien fichier reste récupérable dans l'historique git au commit `bbe3911`.

**Le site n'est pas indexé.** Aucune page ne remonte sur une recherche combinant le domaine, la
marque et la ville. Conséquence utile : aucun historique à préserver, donc aucun plan de
redirection à construire.

Concurrents occupant le terrain sur la marque : `grafenprofessional.nl` (boutique du fabricant),
Amazon.fr, bol.com, autofixer.fr.

---

## 5. Livrables produits

### 5.1 Dossier `a-pousser/`, prêt pour le dépôt

| Fichier | Rôle |
|---|---|
| `index.html` (**182 Ko**) | Le site corrigé |
| `_redirects` | Canonique www vers apex, exclusions 404, fallback SPA |
| `404.html` | Page d'erreur sobre |
| `robots.txt` | Directives et déclaration du sitemap |
| `sitemap.xml` | 38 URL réelles |
| `photos/` | 45 fichiers WebP |
| 2 fichiers `LISEZ-MOI` | Guides analytics et test local |

Corrections intégrées à `index.html` :

1. **Prix supprimés des données** (21 champs `ttc` et `ht` retirés)
2. **Routage en vraies URL** : 49 liens `#/` convertis, `hashchange` remplacé par `popstate`,
   intercepteur de clics global
3. **Métadonnées dans le HTML servi**, plus une carte de 38 routes mettant à jour `title`,
   `description`, `canonical`, Open Graph et Twitter à chaque navigation
4. **JSON-LD** : `AutoPartsStore` statique, plus 25 blocs par route dont `Product` **sans
   `offers`** et `BreadcrumbList`
5. **Contenu statique de repli** dans `#root`, 13 500 caractères, remplacé par React au montage
6. **GA4** avec suivi des vues en navigation SPA
7. **Bandeau de consentement**, Consent Mode v2, `analytics_storage` seul accordé
8. **Logo du pied de page** corrigé de JEL+AUTO en JEL+SPRAY
9. **Sortie complète du base64** : 3,78 Mo vers 182 Ko
10. **Chemins FDS** rendus absolus

### 5.2 Documentation, dossier `docs/`

- `00-spec-seo.md` : spécification complète, métadonnées des 38 pages, gabarits JSON-LD
- `01-audit-technique.md` : audit de la maquette, **obsolète**
- `01b-audit-site-deploye.md` : audit de la production, **fait foi**
- `02-carte-mots-cles.md` : 3 niveaux d'intention, plus saisonnier, concurrents, réglementaire
- `03-plan-editorial.md` : 20 articles séquencés en entonnoir, avec maillage interne

### 5.3 Contenu, dossier `content/`

**9 articles sur 20 rédigés, 12 972 mots.** Tous entre 1 242 et 1 513 mots.

| # | Slug | Cluster |
|---|---|---|
| 01 | `nettoyage-freins-atelier-methode-risques` | Procédure |
| 02 | `cov-atelier-automobile-exposition-reduction` | Réglementaire |
| 03 | `fiche-donnees-securite-atelier-obligations` | Réglementaire |
| 04 | `stockage-aerosols-atelier` | Réglementaire |
| 05 | `dechets-chimiques-atelier-filiere-tracabilite` | Réglementaire |
| 06 | `grippage-corrosion-boulonnerie-prevention` | Technique |
| 07 | `frein-filet-anaerobie-fonctionnement` | Technique |
| 08 | `silicone-atelier-zone-peinture` | Technique |
| 09 | `climatisation-contamination-protocole-assainissement` | Technique |

Données : `products.json` (21 produits, descriptions complètes, **aucun champ de prix**),
`categories.json`, `posts.json`.

---

## 6. Reste à faire

### Articles 10 à 20, phase comparative et transactionnelle

Détail complet dans `docs/03-plan-editorial.md`. Ordre prévu :

- **10 à 15, comparatif** : nettoyant solvanté ou aqueux, frein-filet bleu vert rouge,
  lecture d'une spécification de frein-filet, aérosol ou bidon 5 L, dégrippant avec ou sans
  silicone, finition de tableau de bord
- **16 à 18, marques concurrentes** : GRAFLOCK face à Loctite, multi-pénétrant face à WD-40,
  couverture comparée des gammes d'atelier
- **19 et 20, transactionnel** : choisir un fournisseur de chimie d'atelier, approvisionnement
  en Pays de la Loire

### Étapes du brief non entamées

**Étape 6, contenu réactif** : dispositif de veille sur les évolutions CLP, restrictions REACH,
valeurs limites d'exposition, rappels produits, réglementation des fluides frigorigènes.

**Étape 7, autorité éditoriale** : identification de 5 à 10 experts, rédaction des e-mails
d'approche, construction des signaux E-E-A-T.

### Actions qui incombent au client

1. **Pousser le dossier `a-pousser/`** sur le dépôt, dossiers `photos/` inclus
2. **Fournir les 21 PDF de fiches de données de sécurité**, à placer dans `/fds/`.
   Sans eux, vider le champ `fds` pour que le bouton bascule sur le lien de contact.
   Noms attendus visibles dans `index.html`, motif `<REF>-<slug>-FDS.pdf`
3. **Créer la propriété Search Console**, type **Domaine**, vérification par TXT DNS,
   puis soumettre `https://jelspray.fr/sitemap.xml`
4. **Faire valider par un conseil juridique** le bandeau de consentement, les mentions légales
   et la politique de confidentialité
5. **Tester après déploiement** : le menu principal, puis `https://jelspray.fr/produits` en
   accès direct et en navigation privée, puis GA4 Temps réel

---

## 7. Points de vigilance

**Accès.** Le dépôt se clone en lecture seule. Aucun commit n'est possible sans authentification,
et aucun jeton, mot de passe ou clé d'API ne doit être transmis en conversation. Le client pousse
lui-même, ou autorise un connecteur GitHub en OAuth.

**Search Console et GA4** ne sont pas accessibles. Les données doivent être exportées en CSV par
le client.

**Volumes de recherche.** Aucun connecteur Ahrefs ou Semrush. Les volumes de la carte de mots-clés
sont des bandes qualitatives assumées, jamais présentées comme des relevés d'outil.

**Chiffres réglementaires.** Les seuils ICPE, codes déchets et délais de conservation ont été
volontairement omis faute de vérification à la source. Les articles décrivent la démarche et
renvoient vers la DREAL. Ne pas introduire de valeurs non vérifiées.

**Publicité comparative.** Les articles 16 à 18 nomment des marques tierces. Encadré en France par
les articles L. 122-1 et suivants du Code de la consommation. Rédaction sur caractéristiques
publiées et vérifiables uniquement, relecture juridique recommandée avant mise en ligne.

**Équivalences LOCTITE.** Formulées prudemment, du type « correspond aux caractéristiques d'un
LOCTITE 243 », avec renvoi à la documentation constructeur. Il s'agit d'organes de sécurité.

**Composants morts.** `CartPage`, `CheckoutPage`, `LoginPage`, `ProfilePage`, `OrdersPage`,
`CartDrawer` subsistent dans `index.html`. Ils sont inatteignables, aucune route ne les dessert.
Ils planteraient si on y accédait, les prix ayant disparu. Suppression réservée à la
reconstruction.

**React en version development** chargé depuis unpkg, avec hachages d'intégrité. Non modifié pour
ne pas casser la mise en production. Le passage en version production reste un gain à prendre.

**Protocole `file:`.** Le fichier bascule en routage par hash et en chemins d'images relatifs quand
il est ouvert par double-clic, pour permettre un aperçu local. En `https:`, routage `pushState` et
chemins absolus. Toute modification du routage ou des chemins doit préserver cette bascule.

**Validation systématique.** Chaque modification de `index.html` a été contrôlée par
`node --check` sur les scripts et recompilation Babel des blocs JSX. Conserver cette pratique :
plusieurs régressions ont été interceptées ainsi, dont une navigation principale entièrement
cassée par des liens `link('#/...')` non convertis.

---

## 8. La reconstruction, non entamée

Le correctif livré traite les métadonnées, le routage, le balisage et le poids. Il **ne règle pas
le rendu côté client** : le contenu reste produit par JavaScript, avec un repli statique pour les
robots.

La cible reste **Next.js App Router**, en rendu statique, une route réelle par page, telle que
spécifiée dans `docs/00-spec-seo.md`. Ce chantier n'a pas commencé.
