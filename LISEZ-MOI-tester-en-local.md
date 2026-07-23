# Tester le site en local avant de le pousser

## Le double-clic fonctionne désormais

Ouvrir `index.html` par double-clic affiche l'accueil. La navigation utilise alors des URL
en `#/`, par exemple `index.html#/produits`. C'est un mode de repli réservé à l'aperçu local.

**Ce mode ne reflète pas la production.** En ligne, le site utilise de vraies URL
(`https://jelspray.fr/produits`), sans `#`. La bascule est automatique et se fait sur le protocole :

| Contexte | Protocole | Routage |
|---|---|---|
| Double-clic sur le fichier | `file:` | hash, `#/produits` |
| Netlify | `https:` | vraies URL, `/produits` |

## Pour un test fidèle à la production

Le double-clic ne permet pas de vérifier `_redirects` ni les vraies URL. Lancez un serveur local,
depuis le dossier contenant `index.html` :

**Avec Python (déjà installé sur macOS et Linux)**
```
python3 -m http.server 8000
```
puis ouvrez `http://localhost:8000`

**Avec Node**
```
npx serve .
```

Attention : un serveur statique simple ne rejoue pas la règle `_redirects` de Netlify. Un accès
direct à `http://localhost:8000/produits` renverra donc une 404 en local, alors qu'il fonctionnera
sur Netlify. C'est attendu.

**Test réellement fidèle, avec Netlify CLI**
```
npx netlify-cli dev
```
Cette commande applique `_redirects`, ce qui permet de valider les URL profondes avant déploiement.

## Ce qu'il faut vérifier

En local, par double-clic ou serveur simple :

1. L'accueil s'affiche, les deux logos indiquent bien JELSPRAY, en-tête et pied de page.
2. Les 4 entrées du menu répondent : Produits, GRAFLOCK, Blog, Contact.
3. Une fiche produit s'ouvre et n'affiche aucun prix.
4. Le bandeau de consentement apparaît à la première visite, et les deux boutons fonctionnent.

Après déploiement sur Netlify, en navigation privée :

5. `https://jelspray.fr/produits` en accès direct s'affiche. Valide `_redirects`.
6. Les URL n'ont plus de `#`.
7. GA4 → Temps réel, après acceptation du bandeau.
8. Naviguer entre deux fiches : deux vues distinctes doivent remonter, avec des titres différents.
