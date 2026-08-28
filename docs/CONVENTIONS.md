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

Les quatre premiers points étaient des choix purement techniques : aucun ne
modifie un montant d'impôt, et ils ont été appliqués sans validation métier,
conformément à `AGENTS.md` §11.

Le cinquième, la convention de bornes des barèmes, modifie des montants. Il a
été tranché en interne parce qu'il ne s'agit pas d'une interprétation fiscale
mais d'une erreur d'écriture, et il est porté en fiche 3.7 de
`docs/CORRECTIONS_A_VALIDER.md` pour confirmation.

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

### 1.5 Les tranches de barème sont jointives

Une tranche s'arrête à sa borne haute **incluse**, et la suivante reprend
exactement là. Aucun euro n'échappe à une tranche.

Deux écritures coexistaient. Le simulateur « IR, CEHR et CDHR » et les barèmes
de mutations à titre gratuit étaient jointifs ; l'IRPP et l'IFI faisaient
commencer chaque tranche un euro au-dessus de la borne précédente. Cet euro
n'était taxé nulle part, et les deux simulateurs d'impôt sur le revenu
donnaient **deux impôts différents pour le même revenu**, jusqu'à 1,27 €
d'écart. L'IFI perdait 0,05 €.

C'est l'objet de l'issue #7. Le point a été tranché en interne plutôt que
soumis au référent : un euro qui n'est taxé dans aucune tranche n'est pas une
règle fiscale, c'est une erreur d'écriture du barème. La correction est
néanmoins portée en fiche 3.7 de `docs/CORRECTIONS_A_VALIDER.md`, comme toute
modification d'un montant affiché, pour confirmation.

Contrôles : `tests/unit/bornes-baremes.test.js` compare les deux simulateurs à
chaque seuil, à −1, à l'euro près et à +1, et vérifie que les quatre barèmes du
dépôt se suivent sans trou.

---

## 2. Ce qui reste ouvert

### 2.1 Nombre de décimales affichées — non tranché, décision interne

| Simulateur | Ce qui s'affiche pour 1 234,56 € |
|---|---|
| IR, CEHR et CDHR, IFI, plus-value immobilière, succession | 1 235 € |
| IRPP, démembrement | 1 234,56 € |

Le calcul est identique ; seul l'affichage diffère. Le point **n'a pas été posé
au référent** : ce n'est pas une question de droit mais de présentation.

Aucune décision n'est prise pour l'instant, et chaque simulateur conserve donc
sa présentation. `Conventions.formaterMontant()` prend le nombre de décimales
en paramètre plutôt que de l'imposer : le jour où le choix sera fait, il se
posera à un seul endroit.

### 2.2 Arrondis intermédiaires — un cas isolé à corriger

Les arrondis sont partout réservés à l'affichage, ce qui est sain. Une
exception : dans l'IFI, l'exonération des fermages est arrondie à l'euro pour
l'affichage alors que le calcul réutilise la valeur non arrondie. Le détail
montré peut donc différer de quelques centimes du montant réellement retenu.

C'est une incohérence interne, pas une question de droit : l'affichage doit
montrer ce que le calcul emploie. Reste à corriger.

### 2.3 Champs obligatoires et messages d'erreur — politique à appliquer

Aucun simulateur ne signale une saisie invalide, hors les deux cas du
démembrement tranchés en fiches 3.1 et 3.2.

La politique retenue reprend le précédent que le référent a validé sur l'âge du
donateur : **avertir sans bloquer**. Une valeur hors des bornes plausibles
continue d'être calculée, et un avertissement visible signale l'anomalie à côté
du résultat plutôt que de la laisser passer pour un résultat ordinaire.

Reste à appliquer champ par champ aux six simulateurs. C'est le reliquat de
l'issue #8 et la part la plus longue de #11.

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
