# Conventions de calcul et d'affichage

Spécification de l'issue #11. Elle **tranche** ce qui relève de la technique et
**laisse ouvert** ce qui relève du référent fiscal.

Le constat qui l'a précédée est dans `docs/INVENTAIRE_CONVENTIONS.md` : sept
divergences relevées entre les six simulateurs, chiffrées par exécution réelle.
Ce document-ci est la suite : il dit ce qui s'applique désormais.

Implémentation : `src/conventions.js`, chargé par les six simulateurs.
Tests : `tests/unit/conventions.test.js`.

---

## 1. Ce qui est tranché

Ces quatre points étaient des choix techniques. Aucun ne modifie un montant
d'impôt ; ils ont été appliqués sans validation métier, conformément à
`AGENTS.md` §11.

### 1.1 Les taux sont stockés en décimal

Un taux vaut `0.172`, jamais `17.2`. La conversion en pourcentage se fait au
seul moment de l'affichage.

C'était déjà la convention majoritaire. Elle est désormais la seule, parce que
l'autre produisait un résultat faux d'un facteur cent sans aucun avertissement
dès qu'une valeur passait d'un simulateur à l'autre.

Une exception subsiste, signalée dans le code : `fmtPct()` du simulateur « IR,
CEHR et CDHR » reçoit encore un pourcentage déjà multiplié. L'aligner
supposerait de reprendre chacun de ses appelants, ce qui dépasse le périmètre
de #11 ; le commentaire sur place empêche la confusion.

### 1.2 Une saisie n'est jamais corrigée en silence

`Conventions.nombreSaisi(valeur, défaut)` est la lecture commune aux six
simulateurs. Seuls un champ vide et une saisie illisible prennent la valeur par
défaut. **Zéro est un nombre comme un autre** et est respecté.

C'est la règle posée par l'issue #8 pour trois simulateurs, généralisée ici aux
six. L'IRPP et la plus-value immobilière ne présentaient pas le défaut, mais
seulement parce que leurs valeurs par défaut valaient zéro : le défaut serait
réapparu au premier champ doté d'un défaut non nul.

### 1.3 Une case à cocher introuvable vaut « décochée »

L'IRPP lisait `$(id)?.checked ?? true` : une faute de frappe dans un
identifiant activait donc silencieusement une option, et avec elle un
prélèvement. `Conventions.caseCochee()` renvoie `false` pour une case absente.

Les treize identifiants lus existent aujourd'hui : ce changement ne modifie
aucun montant. Il supprime une panne future, pas une panne actuelle.

### 1.4 Un calcul impossible s'affiche « — »

Trois comportements coexistaient : `—`, `NaN €` et `0 €`.

`0 €` était le plus dangereux : il **présente une erreur de calcul comme un
résultat valide**. Un utilisateur ne peut pas distinguer « le simulateur n'a
pas pu calculer » de « vous ne devez rien ».

Règle unique : une valeur qui n'est pas un nombre fini s'affiche `—`. Un vrai
zéro continue de s'afficher « 0 € ».

Cette règle change ce qui est affiché, mais seulement dans les cas où
l'affichage précédent était déjà faux ou incompréhensible. Aucun montant
valide n'est modifié : les 390 contrôles automatiques, instantanés compris,
donnent les mêmes résultats avant et après.

---

## 2. Ce qui reste à trancher par le référent fiscal

Ces trois points commandent des montants ou leur présentation. Ils ne sont pas
décidés, et aucun agent ne doit les décider seul.

| Sujet | Où en est la question |
|---|---|
| Représentation des tranches de barème | Fiche 3.7, en attente. C'est l'objet de l'issue #7. |
| Nombre de décimales affichées | Fiche 3.8, en attente. |
| Étapes auxquelles s'applique un arrondi | Fiche 3.9, en attente. |
| Champs obligatoires, bornes et messages d'erreur | Fiche 3.10, en attente. |

Ces fiches sont dans `docs/CORRECTIONS_A_VALIDER.md` et sur la page
d'arbitrage. Tant qu'elles n'ont pas de réponse :

- chaque simulateur conserve son propre nombre de décimales ;
- les barèmes conservent leurs bornes actuelles, y compris celles qui laissent
  un euro sans taux ;
- aucun message d'erreur de saisie n'est ajouté, hors les deux cas du
  démembrement déjà tranchés en fiches 3.1 et 3.2.

`Conventions.formaterMontant()` prend donc le nombre de décimales en paramètre
plutôt que de l'imposer : le jour où la réponse arrive, elle se pose à un seul
endroit.

---

## 3. Valeurs infinies dans les données

Tranché par le schéma des référentiels (#12), rappelé ici pour mémoire :
`Infinity` n'existe dans aucun format de données courant. Une borne haute
absente s'écrit `null`. Voir `data/schema/README.md`.

---

## 4. Ce qu'un contributeur doit retenir

- lire une saisie : `Conventions.nombreSaisi(valeur, défaut)` ;
- lire une case : `Conventions.caseCochee(élément)` ;
- afficher un montant : passer par le `fmt()` du simulateur, qui applique la
  règle du « — » ;
- un taux se manipule en décimal et ne devient un pourcentage qu'à l'écran ;
- ne jamais afficher `0` à la place d'un calcul qui n'a pas abouti.
