# Architecture cible, URL stables et livrables

Document de décision répondant à l'issue
[#20](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/20).

Rédigé le 26 août 2026 sur la branche `clv/y-0.5-donnees`.

Ce document **fixe la cible et l'ordre de migration**. Il ne déplace aucun
fichier par lui-même : chaque étape de migration est réalisée par l'issue qui la
porte. Tant qu'une étape n'est pas réalisée, l'état décrit dans « Aujourd'hui »
reste la référence.

---

## 1. Ce qui est déjà tranché et n'est pas rouvert ici

**Les fichiers HTML n'ont pas vocation à être utilisés seuls ni à rester
autonomes.** Arbitrage de CLV du 26 août 2026, déjà inscrit dans
`docs/PLAN_ACTIONS_AGENTS_IA.md`.

Conséquences retenues comme acquises dans tout ce document :

- des ressources partagées — feuille de style, scripts, données — peuvent être
  référencées par chemin relatif ;
- le dossier doit rester complet ; distribuer un fichier HTML isolé n'est plus un
  cas d'usage à préserver ;
- l'ouverture d'un simulateur par double-clic (`file://`) n'est plus une
  contrainte de conception. Le mode de consultation supporté est un serveur
  HTTP : le site publié, ou `python3 -m http.server 8000` en local.

Ce point répond à la décision « Décider si les HTML autonomes restent un
livrable requis » de #20 : **non**. Les questions dérivées « si oui, les
générer » et « contrainte hors ligne » tombent donc, sauf pour ce qui est dit au
§6 sur les fichiers générés à partir des données.

---

## 2. Décisions d'architecture

### 2.1 — Pas de framework applicatif

Le projet reste en JavaScript natif, sans React, Vue, ni équivalent, et sans
dépendance de production. L'outillage de développement s'appuie sur Node.js 22
ou plus récent, déjà requis par le socle de tests, et n'introduit aucune
dépendance npm tant qu'une issue ne la justifie pas.

Motif : le dépôt est codéveloppé par un juriste et un développeur. Un framework
ajouterait une couche à apprendre sans résoudre le problème réel du projet, qui
est la traçabilité des données fiscales, non la complexité de l'interface.

### 2.2 — Source de vérité de chaque type de fichier

| Type de contenu | Source de vérité | Généré ? |
|---|---|---|
| Valeurs fiscales : barèmes, taux, seuils, abattements, plafonds | `data/referentiels/*.json` | non, écrit ou importé |
| CSV et JSON officiels déposés en entrée | `data/imports/` | non, dépôt brut daté |
| Schéma des référentiels | `data/schema/` | non |
| Référentiels consommés par le navigateur et les tests | `src/genere/referentiels.js` | **oui**, ne jamais éditer à la main |
| Moteurs de calcul | `src/moteurs/` | non |
| Pages des simulateurs | `src/simulateurs/<slug>/index.html` | non |
| Habillage commun | `src/styles/` | non |
| Site publié | `site/` | **oui**, non versionné |
| Outillage : import, validation, génération, build | `scripts/` | non |
| Tests | `tests/` | non |
| Documentation et supports de travail | `docs/` | non, et **jamais publié** |

Règle générale : **une valeur fiscale n'existe qu'à un seul endroit**, dans
`data/`. Tout le reste la lit. Une mise à jour annuelle modifie un fichier de
`data/`, relance la génération et les tests, et ne touche à aucun HTML.

### 2.3 — Arborescence cible

```text
index.html                     redirection ou copie de src/index.html (voir §4)
data/
  schema/                      schéma commun des référentiels (#12)
  referentiels/                un fichier par domaine fiscal, millésimé (#14 à #17)
  imports/                     CSV et JSON officiels déposés, datés (#18)
docs/                          documentation, plan d'action, supports d'arbitrage
scripts/                       outillage Node : import, validation, génération, build
src/
  index.html                   accueil
  simulateurs/
    irpp/index.html
    ir-cehr-cdhr/index.html
    plus-value-immobiliere/index.html
    ifi/index.html
    succession/index.html
    demembrement/index.html
  moteurs/                     calculs sans DOM (#21)
  styles/                      feuille de style commune (#31)
  genere/                      produits par scripts/ — jamais édités à la main
site/                          sortie de build, ignorée par Git
tests/
```

Aujourd'hui, les six HTML et `index.html` sont à la racine et `data/`, `src/`,
`scripts/` et `site/` n'existent pas encore. Le §5 décrit comment on passe de
l'un à l'autre.

### 2.4 — Comment les données arrivent dans le navigateur

Décision : **un fichier JavaScript généré, chargé par balise `<script>`**, et non
un `fetch` de JSON au moment de l'affichage.

```html
<script src="../../genere/referentiels.js"></script>
```

Le fichier généré expose le même objet aux deux mondes :

```js
// src/genere/referentiels.js — fichier généré, ne pas éditer
(function (global) {
  const REFERENTIELS = { /* … contenu produit depuis data/ … */ };
  if (typeof module === 'object' && module.exports) module.exports = REFERENTIELS;
  else global.REFERENTIELS = REFERENTIELS;
})(typeof globalThis !== 'undefined' ? globalThis : this);
```

Trois raisons :

1. **le chargement reste synchrone.** Les six simulateurs calculent aujourd'hui
   de façon synchrone. Passer par `fetch` obligerait à rendre asynchrones des
   dizaines de fonctions de calcul dans la même opération que l'extraction des
   données. Ce serait mélanger une refactorisation de données et une
   refactorisation de flux, avec un risque réel de déplacer un résultat ;
2. **les tests lisent le même fichier que le navigateur.** Le harnais de
   `tests/helpers/simulateurs.js` peut charger le fichier généré tel quel, sans
   simuler le réseau ;
3. **le diff reste lisible dans `data/`.** Le fichier généré n'a pas besoin
   d'être relu : c'est `data/referentiels/*.json` qui est revu en pull request.

`data/` reste donc le format de travail — lisible, diffable, validable — et
`src/genere/referentiels.js` n'est qu'un moyen de transport.

### 2.5 — Statut de validation porté par la donnée

Toute valeur extraite porte sa `source`, sa `dateEffet` et un `statutValidation`
parmi `non-valide`, `valide` et `conteste`, selon le principe des valeurs non
validées inscrit au plan d'action. Le schéma est défini par #12.

Conséquence d'architecture : le référentiel doit pouvoir contenir **deux valeurs
concurrentes pour une même règle** sans que le code n'en choisisse une. C'est ce
que représente le statut `conteste`.

### 2.6 — Publication : seul le site est publié

Contrainte à respecter : `AGENTS.md` interdit que `docs/arbitrages.html` soit
servi par GitHub Pages.

État constaté le 26 août 2026 : GitHub Pages est configuré en mode « legacy »,
branche `main`, dossier racine. **Le jour où le jalon `0.4` sera fusionné dans
`main`, `docs/arbitrages.html` deviendra donc accessible publiquement** à
l'adresse `…/Simulateurs-fiscaux/docs/arbitrages.html`. Le dépôt étant public, ce
n'est pas une fuite de contenu, mais c'est contraire à la règle retenue : un
support de travail ne doit pas figurer parmi les adresses du produit.

Deux mesures, dans cet ordre :

1. **immédiate, sans CI** : un fichier `_config.yml` à la racine exclut `docs/`,
   `tests/`, `scripts/`, `data/` et les fichiers de gouvernance de la
   construction Pages. Livré avec le présent document ;
2. **cible, avec #28** : basculer Pages en mode « GitHub Actions » et publier
   uniquement le contenu de `site/`, produit par `npm run build`. Ce qui n'est pas
   dans `site/` n'est alors plus publiable par construction, ce qui vaut mieux
   qu'une liste d'exclusions à maintenir.

### 2.7 — Fichiers générés

`src/genere/` et `site/` sont produits par `scripts/`. Ils ne sont jamais
modifiés à la main. Chaque fichier généré porte un en-tête le rappelant et
nommant sa commande de régénération.

`site/` est ignoré par Git : il est reconstruit à la publication.
`src/genere/referentiels.js` est **versionné**, afin que le dépôt reste
utilisable et testable sans exécuter d'abord une commande de génération ; un
contrôle automatique vérifie qu'il correspond bien à `data/` (#18, puis #28).

---

## 3. Flux source → tests → build → publication

```text
CSV ou JSON officiel
   │  npm run donnees:importer -- <fichier>
   ▼
data/imports/<source>-<date>.csv         dépôt brut, daté, jamais réécrit
   │  normalisation
   ▼
data/referentiels/<domaine>.json         source de vérité, relue en PR
   │  npm run donnees:valider            schéma, bornes, dates, doublons
   │  npm run donnees:generer
   ▼
src/genere/referentiels.js               versionné, jamais édité à la main
   │
   ├─▶ tests/  ──  npm test              les tests lisent le même fichier
   │
   └─▶ src/simulateurs/…  ──  npm run build
                                  ▼
                               site/  ──▶ GitHub Pages
```

Une mise à jour fiscale annuelle parcourt ce chemin de bout en bout sans qu'un
seul fichier HTML soit modifié.

---

## 4. URL stables

### 4.1 — Adresses cibles

Les adresses actuelles contiennent des espaces, des accents et un millésime :
`Simulateur_PV_Immobili%C3%A8re%20Juillet%202026.html`. Elles changent donc à
chaque mise à jour annuelle, ce qui casse tout lien partagé ou mis en favori.

Adresses retenues, en minuscules, sans accent, sans espace et sans millésime :

| Simulateur | URL cible |
|---|---|
| Accueil | `/` |
| IRPP | `/simulateurs/irpp/` |
| IR, CEHR et CDHR | `/simulateurs/ir-cehr-cdhr/` |
| Plus-value immobilière | `/simulateurs/plus-value-immobiliere/` |
| IFI | `/simulateurs/ifi/` |
| Succession | `/simulateurs/succession/` |
| Démembrement | `/simulateurs/demembrement/` |

Une adresse se termine par un dossier et non par `.html` : le millésime affiché
peut changer, l'extension du fichier peut changer, l'adresse ne bouge plus.

Le millésime n'apparaît plus dans l'adresse. Il est affiché **dans la page**, et
sélectionnable par #19.

### 4.2 — Anciennes adresses

Chaque ancien nom de fichier reste accessible et redirige vers la nouvelle
adresse. Les redirections sont produites par le build à partir d'une table
unique déclarée dans `scripts/`, sous la forme d'une page minimale portant
`<link rel="canonical">` et `<meta http-equiv="refresh">` — GitHub Pages ne
permettant pas de redirection HTTP 301.

Cette table est conservée définitivement : une adresse publiée une fois n'est
jamais rendue morte.

---

## 5. Migration progressive

Aucune étape ne mélange déplacement de fichiers et changement de calcul.

| Étape | Jalon | Contenu | Risque |
|---|---|---|---|
| M1 | 0.5 | `_config.yml` protecteur ; création de `data/`, du schéma (#12) et de l'outillage (#18). Aucun HTML déplacé ni modifié. | nul |
| M2 | 0.5 | Extraction des référentiels (#14 à #17, #13). Les HTML restent à la racine et chargent `src/genere/referentiels.js` par chemin relatif. | faible, verrouillé par comparaison avant/après |
| M3 | 0.6 | Déplacement vers `src/simulateurs/<slug>/`, build `site/`, redirections, bascule de Pages sur GitHub Actions (avec #28). | moyen, concentré sur les chemins |
| M4 | 0.6 | Découplage des moteurs vers `src/moteurs/` (#21). | moyen |
| M5 | 0.6 / 0.7 | Feuille de style commune dans `src/styles/` (#31), en PR distinctes du découplage. | faible |
| M6 | 0.7 | Nettoyage final, `CODEMAP.md`, accessibilité (#29). | faible |

Règle de sûreté valable à chaque étape : **relever les résultats avant, rejouer
après, comparer au centime.** Une étape qui déplace un résultat est un défaut,
pas une amélioration.

Point d'attention pour M2 et M3 : `index.html` et
`tests/helpers/simulateurs.js` contiennent tous deux la liste des fichiers de
simulateurs. Ils doivent être modifiés dans le même commit que tout renommage.

---

## 6. Commandes destinées au co-développeur

Aujourd'hui :

```bash
npm test                        # tous les tests, sans installation préalable
python3 -m http.server 8000     # puis http://localhost:8000/index.html
```

Ajoutées par #18, au jalon 0.5 :

```bash
npm run donnees:valider         # vérifie data/ contre le schéma ; échoue si invalide
npm run donnees:generer         # reconstruit src/genere/referentiels.js depuis data/
npm run donnees:importer -- <fichier.csv>   # normalise un CSV officiel vers data/
```

Ajoutée par M3 :

```bash
npm run build                   # construit site/
```

Aucune de ces commandes n'installe quoi que ce soit : le projet reste sans
dépendance npm.

**Pour modifier une valeur fiscale**, la procédure cible tient en quatre lignes :

1. modifier le fichier concerné dans `data/referentiels/` ;
2. `npm run donnees:valider && npm run donnees:generer` ;
3. `npm test` ;
4. ouvrir une pull request : le diff montre la valeur, sa source, sa date
   d'effet et son statut de validation.

---

## 7. Réponses point par point aux critères d'acceptation de #20

| Critère | Réponse |
|---|---|
| Le projet reste compréhensible sans connaître un framework | Aucun framework, aucune dépendance de production, commandes explicites |
| Une modification de donnée ne touche pas le HTML | `data/` → génération → `src/genere/` ; le HTML lit, ne contient plus |
| Les URL ne changent plus à chaque millésime | Adresses en dossier sans millésime, §4 ; anciennes adresses redirigées |
| Les contraintes hors ligne et de fichier autonome sont explicitement tranchées | §1 : non requises ; serveur HTTP supporté, `file://` abandonné |

---

## 8. Ce que ce document ne tranche pas

- **Le contenu du schéma des référentiels** : c'est #12. Ce document fixe
  seulement où il vit et comment il est consommé.
- **Les conventions d'unités, de bornes et d'arrondis** : c'est #11, et une part
  en revient au référent fiscal. Voir `docs/INVENTAIRE_CONVENTIONS.md`.
- **Toute valeur fiscale.** Aucune décision de ce document ne modifie un montant
  affiché.
- **Le niveau d'unification visuelle** : c'est #31, et le choix du simulateur de
  référence appartient au référent métier.

Aucune validation métier n'est requise pour ce document. Il ne porte que des
choix techniques.
