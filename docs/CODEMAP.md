# Carte du dépôt

Où vit chaque chose, et qui a le droit de la modifier. À lire avant de chercher
un fichier ; à mettre à jour dès qu'un fichier change de rôle ou d'emplacement.

Le dépôt et le site publié ont la même arborescence : ce qui est servi depuis
la racine du dépôt est ce qui est publié. Voir `docs/ARCHITECTURE_CIBLE.md`
pour les décisions et l'historique de la migration.

## Pages

| Chemin | Rôle | Édité à la main ? |
|---|---|---|
| `index.html` | Accueil : liste et liens vers les six simulateurs | oui |
| `simulateurs/irpp/index.html` | Calculateur IR complet : IR, CEHR, CDHR, plus-values, dons, IFI | oui |
| `simulateurs/ir-cehr-cdhr/index.html` | Cession de titres : flat tax, barème, quotient, 150-0 B ter | oui |
| `simulateurs/plus-value-immobiliere/index.html` | Plus-value immobilière et surtaxe | oui |
| `simulateurs/ifi/index.html` | Impôt sur la fortune immobilière | oui |
| `simulateurs/succession/index.html` | Droits de succession par héritier | oui |
| `simulateurs/demembrement/index.html` | Donation en nue-propriété | oui |

Chaque page porte son style et son câblage d'interface. Elle charge par
`<script src="../../src/…">` les ressources partagées ci-dessous, dans cet
ordre : référentiels générés du domaine, conventions, lecture des
référentiels, millésime, puis le cas échéant taux de change et moteur.

Une adresse est un dossier, sans millésime : renommer un dossier casserait
des liens partagés. La liste des simulateurs est tenue à trois endroits qui
doivent bouger ensemble : `index.html`, `tests/helpers/simulateurs.js` et la
table des anciennes adresses de `scripts/lib/redirections.js`.

## Scripts partagés — `src/`

| Chemin | Rôle | Testé par |
|---|---|---|
| `src/conventions.js` | Lecture d'une saisie, d'une case ; mise en forme des montants et taux ; règle du « — » | `tests/unit/conventions.test.js` |
| `src/lecture-referentiels.js` | Accès aux référentiels générés : valeur, barème, variante d'une entrée contestée, résolution du millésime | `tests/unit/millesime.test.js` |
| `src/millesime.js` | Résumé et bandeau du millésime employé | `tests/unit/millesime.test.js`, `tests/integration/millesime-simulateurs.test.js` |
| `src/change.js` | Taux de change à une date : BCE en ligne, puis repli sur `data/change/` ; recherche du jour coté le plus proche | `tests/unit/change.test.js` |
| `src/moteurs/<slug>.js` | Calculs d'un simulateur, sans DOM : entrées explicites, résultat structuré | `tests/unit/<slug>-moteur.test.js` |
| `src/genere/referentiels/<domaine>.js` | **Généré** depuis `data/referentiels/` par `npm run donnees:generer`. Ne jamais éditer | `tests/unit/importeur-referentiels.test.js` |
| `src/genere/referentiels/manifeste.json` | **Généré** : quel domaine est chargé par quel simulateur | idem |

Tous ces fichiers s'exécutent aussi bien dans le navigateur, par balise
`<script>`, que dans Node, par `require` : c'est ce qui permet de les tester
sans navigateur.

## Données — `data/`

| Chemin | Rôle | Édité à la main ? |
|---|---|---|
| `data/referentiels/<domaine>.json` | **Source de vérité** des valeurs fiscales : taux, seuils, barèmes, avec source, date d'effet et statut de validation | oui, ou par import |
| `data/schema/` | Format commun des référentiels et ses exemples | oui |
| `data/imports/` | CSV officiels déposés tels quels, datés | déposés, jamais réécrits |
| `data/change/<annee>.json` | Série de taux de change, repli quand la BCE ne répond pas ; seule partie de `data/` livrée dans `site/` | par extraction |
| `data/README.md` | Procédure de mise à jour d'une valeur fiscale | oui |

Une valeur fiscale n'existe qu'à un seul endroit, dans `data/referentiels/`.
Tout le reste la lit.

## Outillage — `scripts/`

| Commande | Script | Rôle |
|---|---|---|
| `npm run dev` | `scripts/servir.js` | Serveur HTTP local sur la racine du dépôt |
| `npm run build` | `scripts/construire-site.js` | Construit `site/` : liste blanche, redirections, contrôle des liens |
| `npm run verifier` | — | Enchaîne tous les contrôles, comme la CI |
| `npm run verifier:syntaxe` | `scripts/verifier-syntaxe.js` | Compile sans exécuter tout le JavaScript, pages comprises |
| `npm run donnees:valider` | `scripts/valider-referentiels.js` | Vérifie `data/referentiels/` contre le schéma |
| `npm run donnees:generer` | `scripts/generer-referentiels.js` | Reconstruit `src/genere/` ; `-- --verifier` échoue si un fichier généré a dérivé |
| `npm run donnees:importer` | `scripts/importer-referentiel.js` | Normalise un CSV officiel vers `data/referentiels/` |
| `npm run change:valider` | `scripts/valider-change.js` | Vérifie la série de `data/change/` |
| `npm test` | — | Tous les tests, avec le lanceur intégré à Node |

Les bibliothèques de ces scripts sont dans `scripts/lib/` : schéma exécutable,
lecture CSV, import, génération, taux de change, table des anciennes adresses.

## Tests — `tests/`

| Dossier | Contenu |
|---|---|
| `tests/unit/` | Une fonction, des entrées, un résultat attendu : moteurs, conventions, schéma, import, change |
| `tests/integration/` | Le simulateur complet chargé dans un faux DOM : fumée, millésime, instantanés de non-régression |
| `tests/fixtures/` | Cas et résultats attendus, avec leur provenance et leur statut de validation |
| `tests/helpers/` | Chargement des simulateurs, faux DOM, référentiels, assertions |

Les instantanés de `tests/fixtures/instantanes-*.json` sont des relevés faits
**avant** une refactorisation ; ils ne se régénèrent qu'à l'occasion d'une
correction délibérée, documentée dans `CHANGELOG.md`.

## Documentation et gouvernance

| Chemin | Rôle | Publié ? |
|---|---|---|
| `README.md` | Utilisation | non, hors `site/` |
| `AGENTS.md`, `CLAUDE.md` | Règles communes des agents IA | non |
| `CHANGELOG.md`, `VERSION` | Changements par version, version portée par la branche | non |
| `docs/PLAN_ACTIONS_AGENTS_IA.md` | Ordre des chantiers, état des jalons | non |
| `docs/ARCHITECTURE_CIBLE.md` | Décisions d'architecture et migration | non |
| `docs/CONVENTIONS.md` | Conventions de calcul et d'affichage | non |
| `docs/CORRECTIONS_A_VALIDER.md` | Fiches soumises au référent fiscal | non |
| `docs/arbitrages.html`, `docs/sources-fiscales.html` | Sources des pages d'arbitrage publiées en artifact, jamais par Pages | non |
| `docs/INVENTAIRE_*.md` | Constats préparatoires, sans valeur normative | non |

## Publication

| Chemin | Rôle |
|---|---|
| `.github/workflows/controles.yml` | À chaque push et pull request : `npm run verifier`, sans rien publier |
| `.github/workflows/publier.yml` | Sur `main` : construit `site/` et le déploie sur GitHub Pages |
| `_config.yml` | Exclusions Jekyll, provisoires tant que Pages sert la branche `main` |
| `site/` | Sortie de build, ignorée par Git |
