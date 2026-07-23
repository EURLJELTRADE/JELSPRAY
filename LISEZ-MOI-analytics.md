# Mise en service de la mesure d'audience

Tout se configure dans un seul bloc, en haut du `<head>` de `index.html`,
repéré par le commentaire `MESURE D'AUDIENCE`.

```js
window.JL_ANALYTICS = {
  GTM_ID: '',                 // non utilisé
  GA4_ID: 'G-RJR1TZJT19',     // configuré
  ANONYMIZE_IP: true,
  REQUIRE_CONSENT: true
};
```

**Configuration retenue : GA4 en direct, sans Tag Manager.** L'identifiant est déjà en place,
il n'y a rien à saisir. Un bandeau de consentement est inclus.

## Quelle configuration choisir

**Option A, Tag Manager seul (recommandée si vous prévoyez d'autres outils).**
Renseignez `GTM_ID`, laissez `GA4_ID` vide. Créez ensuite la balise GA4 dans l'interface GTM.
Le code envoie un évènement `spa_pageview` dans le `dataLayer` à chaque changement de page :
créez dans GTM un déclencheur sur cet évènement, et une balise GA4 de type `page_view` qui lit
les variables `page_path`, `page_location` et `page_title`.

**Option B, GA4 seul (plus simple).**
Renseignez `GA4_ID`, laissez `GTM_ID` vide. Rien d'autre à faire, les vues de page en navigation
interne sont envoyées automatiquement.

**Ne renseignez pas les deux.** Le code donne la priorité à GTM et n'active pas GA4 en direct,
précisément pour éviter le double comptage, mais autant être explicite dans la configuration.

## Le point technique qui compte

Le site utilise un routage `pushState` : la page ne se recharge jamais lors de la navigation.
Sans traitement particulier, GA4 ne compterait que la première vue et toute la navigation interne
serait invisible. Le code écoute les évènements `jl:navigate` et `popstate` et envoie une vue de
page à chaque changement d'URL, après mise à jour du titre.

## Search Console

La balise `google-site-verification` est présente en commentaire dans le `<head>`.

Elle ne sert **que** pour une propriété de type « Préfixe d'URL ». Si vous créez une propriété de
type **Domaine**, ce qui est recommandé, la vérification se fait par un enregistrement **TXT dans
la zone DNS** et cette balise est inutile.

Comparaison :

| Type de propriété | Vérification | Couverture |
|---|---|---|
| Domaine | TXT DNS | apex, www, http, https, sous-domaines |
| Préfixe d'URL | balise meta, fichier HTML, GA, GTM | uniquement `https://jelspray.fr` |

Une fois la propriété créée, soumettez `https://jelspray.fr/sitemap.xml`.

## Consentement et RGPD

`REQUIRE_CONSENT: true` active le Consent Mode v2 avec **tout refusé par défaut** :
`ad_storage`, `ad_user_data`, `ad_personalization` et `analytics_storage` sont sur `denied`
tant que rien n'est accordé.

Deux fonctions sont exposées pour votre bandeau :

```js
window.jlConsent(true);   // l'utilisateur accepte
window.jlConsent(false);  // l'utilisateur refuse
```

Le choix est mémorisé dans `localStorage` sous la clé `jl_consent` et réappliqué aux visites
suivantes.

**Le bandeau est inclus** (`#jl-cookie`, en bas de `index.html`). Refuser y est aussi simple
qu'accepter : deux boutons de même largeur et de même poids visuel. Le choix est mémorisé et
peut être retiré en appelant `window.jlConsentReset()`, par exemple depuis un lien dans les
mentions légales.

Seul `analytics_storage` est accordé à l'acceptation. Les consentements publicitaires restent
refusés en permanence, puisque le bandeau ne les demande pas. Ne les activez que si vous ajoutez
une finalité publicitaire au bandeau **et** aux mentions légales.
En France, le dépôt de traceurs de mesure d'audience et leur configuration relèvent des règles
de la CNIL, et certaines configurations peuvent bénéficier d'une exemption de consentement sous
conditions. Je ne suis pas juriste : faites valider votre configuration et la rédaction de votre
bandeau par votre conseil avant mise en production, ainsi que la mise à jour de vos mentions
légales et de votre politique de confidentialité.

## Vérification après déploiement

1. Ouvrir le site, accepter le bandeau si vous en avez un, ou appeler `window.jlConsent(true)` en console.
2. GA4 → Rapports → Temps réel : votre visite doit apparaître.
3. Naviguer vers `/produits` puis `/produit/gpbc-nettoyant-freins` : deux vues supplémentaires
   doivent remonter, avec les bons titres.
4. Extension Tag Assistant pour contrôler le déclenchement si vous utilisez GTM.
