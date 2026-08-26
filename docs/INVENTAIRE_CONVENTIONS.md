# Inventaire des conventions de calcul et d'affichage

Document préparatoire à l'issue #11. Il **constate** ce que font aujourd'hui les
six simulateurs. Il ne tranche rien : chaque divergence est présentée avec ses
options et, lorsque c'est un choix purement technique, une recommandation.

Relevé effectué le 26 août 2026 sur la branche `clv/y-0.4-fiabilite`,
préversion `0.4.0-beta.9`. Les écarts chiffrés ont été mesurés en exécutant les
simulateurs, non estimés.

## Résumé des décisions attendues

| # | Sujet | Divergences constatées | Impact mesuré | Qui décide |
|---|---|---|---|---|
| 1 | Représentation des tranches | 4 conventions | jusqu'à 1,27 € d'impôt | référent fiscal |
| 2 | Format des taux | 2 conventions opposées | risque d'erreur ×100 | technique |
| 3 | Décimales affichées | 3 conventions | présentation seulement | référent fiscal |
| 4 | Lecture des saisies | 3 conventions | corrigé pour 3 simulateurs sur 6 | technique |
| 5 | Affichage d'une valeur invalide | 3 comportements | un cas masque l'erreur | technique |
| 6 | Arrondis intermédiaires | 1 cas d'incohérence | affichage ≠ calcul | référent fiscal |
| 7 | Messages d'erreur | aucun n'existe | — | référent fiscal |

---

## 1. Représentation des tranches de barème

Quatre représentations coexistent. Deux d'entre elles perdent un euro d'assiette
à chaque changement de tranche.

| Simulateur | Écriture | Continuité |
|---|---|---|
| IR, CEHR et CDHR | `{ upto: 29579, rate: 0.11 }`, borne basse implicite | continue |
| IRPP | `{ de: borne précédente + 1, a: 29579 }` | **1 € perdu par seuil** |
| IFI | `{ min: 800001, max: 1300000 }` | **1 € perdu par seuil** |
| Succession | `{ min: 8072, max: 12109 }`, bornes jointives | continue |
| Démembrement | `{ low: 8072, high: 12109 }`, bornes jointives | continue |

### Écart mesuré entre le simulateur IR et le simulateur IRPP

Même barème, mêmes revenus, résultats différents :

| Revenu imposable | Simulateur IR | Simulateur IRPP | Écart |
|---|---|---|---|
| 11 601 € | 0,11 € | 0,00 € | −0,11 € |
| 29 579 € | 1 977,69 € | 1 977,58 € | −0,11 € |
| 84 577 € | 18 477,09 € | 18 476,68 € | −0,41 € |
| 181 917 € | 58 386,49 € | 58 385,67 € | −0,82 € |
| 200 000 € et au-delà | 66 523,84 € | 66 522,57 € | −1,27 € |

L'écart se cumule à chaque seuil franchi et se stabilise à 1,27 € une fois la
dernière tranche atteinte.

### Écart mesuré sur l'IFI

Les tranches laissent cinq intervalles d'un euro non couverts : entre 800 000 €
et 800 001 €, puis à 1 300 000 €, 2 570 000 €, 5 000 000 € et 10 000 000 €.
L'écart cumulé atteint 0,05 € pour un patrimoine dépassant la dernière tranche.

### Ce qui doit être tranché

La convention fiscale exacte : une tranche va-t-elle de la borne basse **incluse**
à la borne haute **incluse**, et le premier euro de la tranche suivante
commence-t-il à `borne haute + 1` ? Les cinq barèmes doivent ensuite adopter la
même écriture.

**Remarque de priorité.** L'impact monétaire est faible — au plus 1,27 €. Le vrai
problème est ailleurs : deux simulateurs du même dépôt ne donnent pas le même
impôt pour le même revenu, ce qui décrédibilise l'ensemble et empêchera de
mutualiser les barèmes.

---

## 2. Format interne des taux

Deux conventions opposées, y compris dans des fonctions portant le même nom.

| Simulateur | Ce qu'attend `fmtPct` | Exemple |
|---|---|---|
| IR, CEHR et CDHR | un pourcentage déjà multiplié | `fmtPct(17.2)` → « 17,20 % » |
| PV immobilière | un décimal | `fmtPct(0.172)` → « 17,20 % » |
| Démembrement | un décimal | `fmtPct(0.172)` → « 17,20 % » |

Passer une valeur dans la mauvaise convention produit un résultat faux d'un
facteur 100, sans erreur ni avertissement : `fmtPct(1234.56)` affiche
« 1234,56 % » dans un simulateur et « 123456,00 % » dans un autre.

Dans les barèmes, les taux sont tantôt stockés en décimal (`taux: 0.05`), tantôt
saisis en pourcentage puis divisés par 100 à la lecture (`nombreSaisi(...)/100`
dans le démembrement).

**Recommandation technique.** Un taux est toujours stocké et manipulé en décimal
— 0,172 — et n'est converti en pourcentage qu'au moment de l'affichage. C'est la
convention déjà majoritaire. Décision technique, sans incidence fiscale.

---

## 3. Décimales des montants affichés

| Simulateur | Décimales | Exemple pour 1 234,56 € |
|---|---|---|
| IR, CEHR et CDHR | 0, arrondi | 1 235 € |
| PV immobilière | 0 | 1 235 € |
| IFI | 0 | 1 235 € |
| Succession | 0, sauf 3 affichages à 1 ou 2 décimales | 1 235 € |
| Démembrement | jusqu'à 2, selon le montant | 1 234,56 € |
| IRPP | **2 décimales dans 144 affichages sur 160** | 1 234,56 € |

Un même montant s'affiche donc « 28 389 € » dans un simulateur et
« 28 388,70 € » dans un autre.

**Ce qui doit être tranché.** Les résultats fiscaux doivent-ils être présentés à
l'euro, ou au centime ? La réponse peut différer selon qu'il s'agit d'un montant
d'impôt dû ou d'un détail intermédiaire.

---

## 4. Lecture des valeurs saisies

| Simulateur | Écriture | Un `0` saisi |
|---|---|---|
| IFI, Succession, Démembrement | `nombreSaisi(saisie, défaut)` | respecté depuis l'issue #8 |
| IRPP | `parseFloat(champ.value) \|\| 0` | sans effet, la valeur par défaut étant 0 |
| PV immobilière | `isNaN(v) ? 0 : v` | respecté |

Trois écritures pour un même besoin. L'IRPP et la PV immobilière ne présentent
pas le défaut corrigé en #8, mais uniquement parce que leur valeur par défaut est
zéro : le jour où l'un de ces champs recevra une valeur par défaut non nulle, le
défaut réapparaîtra.

Un point distinct mérite attention dans l'IRPP : `cb = id => $(id)?.checked ?? true`
renvoie **vrai lorsque la case à cocher n'existe pas**. Une faute de frappe dans
un identifiant active donc silencieusement une option.

**Recommandation technique.** Généraliser `nombreSaisi` aux six simulateurs, et
faire renvoyer `false` à `cb` pour une case introuvable.

---

## 5. Affichage d'une valeur invalide

Trois comportements différents lorsqu'un calcul ne produit pas de nombre :

| Simulateur | Affichage pour une valeur invalide |
|---|---|
| IFI, Succession | `—` |
| IR, IRPP, Démembrement | **`NaN €`**, visible par l'utilisateur |
| PV immobilière | **`0 €`** |

Les deux derniers cas posent problème pour des raisons opposées : `NaN €` est
incompréhensible, et `0 €` est pire encore car il **présente une erreur de calcul
comme un résultat valide**.

**Recommandation technique.** Retenir le tiret, déjà utilisé par deux
simulateurs, et ne jamais afficher zéro à la place d'un calcul impossible.

---

## 6. Arrondis intermédiaires

Les arrondis sont presque partout réservés à l'affichage, ce qui est sain. Une
exception a été relevée.

**IFI, exonération des fermages.** Le montant exonéré est arrondi à l'euro avant
d'être inscrit dans le champ de résultat affiché, alors que le calcul de l'IFI
réutilise la valeur **non arrondie**. Le détail présenté à l'utilisateur peut donc
différer de quelques centimes du montant réellement retenu.

**Ce qui doit être tranché.** À quelles étapes un arrondi fiscal s'applique-t-il :
sur la base taxable, sur le montant d'impôt, sur chaque tranche ? Et dans quel
sens : au plus proche, à l'inférieur, à l'euro ou au centime ?

---

## 7. Messages d'erreur et avertissements

Aucun simulateur n'affiche aujourd'hui de message d'erreur de saisie. Les valeurs
invalides sont soit remplacées par une valeur par défaut, soit acceptées telles
quelles.

Cas relevés dans le simulateur de démembrement :

| Saisie | Comportement actuel |
|---|---|
| Âge de 0 an | remplacé par 68 ans, sans avertissement |
| Âge de −5 ans | accepté, taux de nue-propriété de 10 % |
| Âge de 200 ans | accepté, taux de nue-propriété de 90 % |
| 0 donataire | remplacé par 1, sans avertissement |

**Ce qui doit être tranché.** Pour chaque champ : est-il obligatoire, quelles
bornes sont acceptées, et que voit l'utilisateur lorsqu'il sort de ces bornes ?

Ce point reprend le reliquat de l'issue #8, volontairement non traité faute de
décision.

---

## 8. Valeurs infinies dans les données

`Infinity` est utilisé pour représenter l'absence de borne haute de la dernière
tranche, dans les cinq simulateurs qui ont un barème.

Cette écriture fonctionne en JavaScript mais **n'existe pas dans les formats de
données courants** : un fichier CSV ou JSON ne peut pas la contenir. Une
convention devra être retenue lorsque les barèmes sortiront du code, par exemple
une borne haute absente, ou un mot-clé explicite.

**Recommandation technique.** Décision à prendre avec le schéma des référentiels
plutôt qu'isolément ; elle est notée ici pour mémoire.

---

## Méthode

Les conventions ont été relevées par lecture des six fichiers, puis **vérifiées en
exécutant les simulateurs** : chaque écart chiffré de ce document provient d'une
exécution réelle, non d'une lecture du code.

Les écarts de barème ont été obtenus en comparant les moteurs entre eux sur des
revenus identiques. Les comportements d'affichage ont été obtenus en appelant
directement les fonctions de formatage avec des valeurs invalides.
