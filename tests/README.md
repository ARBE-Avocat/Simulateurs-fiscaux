# Tests automatisés

## Lancer les tests

```bash
npm test
```

Aucune installation préalable n'est nécessaire : les tests utilisent uniquement
le lanceur intégré à Node.js (`node --test`). Le projet n'a aucune dépendance.
Node.js 22 ou plus récent est requis.

Pour ne lancer qu'un fichier :

```bash
node --test tests/unit/ir-moteur.test.js
```

Les tests ne font aucun appel réseau et n'ouvrent aucun navigateur : ils
s'exécutent hors ligne, en quelques centaines de millisecondes.

## Organisation

```
tests/
  unit/          # calculs isolés : une fonction, des entrées, un résultat attendu
  integration/   # comportement d'ensemble d'un simulateur (tests de fumée)
  fixtures/      # jeux de cas et résultats attendus, avec leur provenance
  helpers/       # outils communs : chargement des simulateurs, faux DOM, assertions
```

## Comment un simulateur est testé sans navigateur

Les simulateurs sont des fichiers HTML autonomes : le JavaScript de calcul est
embarqué dans une balise `<script>`, mêlé au câblage de l'interface. Tant que
l'architecture cible n'est pas décidée (issue #20), ce code n'est pas déplacé.

`tests/helpers/simulateurs.js` lit donc le fichier HTML, en extrait le script et
l'exécute dans Node avec un faux DOM minimal
(`tests/helpers/dom-minimal.js`). Les appels d'interface sont absorbés sans
erreur, et les fonctions de calcul deviennent appelables directement.

Les fonctions déclarées au premier niveau du script ne sont pas des propriétés
de l'objet global : on les récupère avec `evaluer`.

```js
const { chargerSimulateur } = require('../helpers/simulateurs');

const simulateur = chargerSimulateur('ir-cehr-cdhr');
const bareme = simulateur.evaluer('bareme');

bareme(30000); // appel direct, sans navigateur
```

Pour un calcul qui lit encore des champs de formulaire, on prépare les champs
via le faux DOM avant d'appeler la fonction :

```js
simulateur.dom.document.getElementById('salaire1').value = '50000';
simulateur.evaluer('compute')();
```

Pour rejouer l'initialisation d'une page, les écouteurs d'événements sont
mémorisés et peuvent être déclenchés :

```js
simulateur.dom.declencher('DOMContentLoaded');
```

Ce faux DOM ne remplace pas une vérification visuelle dans un vrai navigateur :
il sert à tester les calculs, pas l'apparence.

## Écrire un nouveau test

1. Choisir le dossier : `unit` pour une fonction de calcul, `integration` pour
   le chargement ou l'enchaînement complet d'un simulateur.
2. Nommer le fichier `<sujet>.test.js` : le lanceur ne prend que ce motif.
3. Utiliser `node:test` et `node:assert/strict`.
4. Pour comparer des montants, utiliser `assertProche` plutôt qu'une égalité
   stricte : les calculs en virgule flottante tombent rarement juste.
5. Donner au test un nom qui décrit le comportement attendu, en français, afin
   que l'échec soit lisible sans lire le code.

```js
const test = require('node:test');
const { chargerSimulateur } = require('../helpers/simulateurs');
const { assertProche } = require('../helpers/assertions');

test("succession — l'abattement s'applique une seule fois", () => {
  const simulateur = chargerSimulateur('succession');
  assertProche(simulateur.evaluer('maFonction')(100000), 12345, 0.01, 'contexte du calcul');
});
```

## Règle sur les valeurs fiscales attendues

Un résultat attendu n'est jamais inventé ni déduit de mémoire. Chaque fixture
indique sa provenance et son statut de validation. Les fixtures actuelles
verrouillent le **comportement existant** des simulateurs afin de détecter une
régression ; elles ne certifient pas l'exactitude juridique des barèmes, qui
relève des cas de référence validés par le référent métier (issue #9).

Lorsqu'un cas est validé, mettre à jour `statutValidation` dans la fixture
concernée en citant la source et la date de validation.

## Vérifier qu'un test a des dents

Un test qui passe ne prouve rien tant qu'on n'a pas vu ce qui le fait échouer.
Après avoir écrit un test, introduire volontairement le défaut dans le code,
vérifier que le test échoue, puis rétablir le code. Sans cette vérification, un
test peut rester vert alors qu'il ne contrôle rien.

Exemple rencontré : `fmtEur` transforme une valeur absente en tiret. Chercher
« NaN » dans l'affichage ne détectait donc aucune erreur, et il a fallu compter
les endroits où un montant doit apparaître.

## Corriger un bug

Écrire d'abord un test qui reproduit le défaut et qui échoue, puis corriger le
code jusqu'à ce qu'il passe. Le test reste ensuite comme garde-fou contre le
retour du bug.
