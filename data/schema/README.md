# Schéma des référentiels fiscaux

Livrable de l'issue
[#12](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/12).

Ce document explique le format commun des données fiscales du projet. La
définition qui fait foi est le fichier `scripts/lib/schema-referentiel.js` :
c'est lui qui accepte ou refuse un référentiel. Le présent texte l'explique, il
ne le double pas — une règle écrite ici sans être appliquée là-bas n'existe pas.

Emplacement des données et rôle de chaque dossier : voir
`docs/ARCHITECTURE_CIBLE.md`.

---

## 1. À quoi sert ce format

Aujourd'hui, un taux ou un barème est écrit directement dans le fichier HTML
d'un simulateur, sans source, sans date et parfois deux fois avec deux valeurs
différentes. Vérifier un chiffre suppose de lire le code ; le mettre à jour
suppose de le réécrire.

Le format ci-dessous fait de chaque valeur fiscale une donnée qui porte, en plus
de son chiffre :

- **d'où elle vient** — sa source ;
- **depuis quand elle s'applique** — sa date d'effet ;
- **ce qu'elle vaut aujourd'hui aux yeux du référent fiscal** — son statut de
  validation ;
- **qui s'en sert** — les simulateurs concernés.

Une mise à jour annuelle devient alors la modification d'une ligne de données,
relue en pull request, plutôt qu'une réécriture de plusieurs blocs HTML.

---

## 2. Un fichier de référentiel

Un fichier couvre un **domaine** : `ir`, `ifi`, `dmtg`, `pv-immobiliere`,
`change`… Il contient une liste d'**entrées**, une par règle.

```json
{
  "schema": 1,
  "domaine": "ir",
  "libelle": "Impôt sur le revenu, CEHR et CDHR",
  "entrees": [ … ]
}
```

| Champ | Obligatoire | Rôle |
|---|---|---|
| `schema` | oui | Version du format. Vaut `1`. |
| `domaine` | oui | Identifiant du domaine, en minuscules. |
| `libelle` | oui | Nom lisible du domaine. |
| `entrees` | oui | Liste non vide des règles du domaine. |

---

## 3. Une entrée

```json
{
  "id": "ir.abattement.salaires.plafond",
  "libelle": "Abattement de 10 % sur les salaires — plafond par déclarant",
  "type": "montant",
  "unite": "EUR",
  "millesime": 2025,
  "dateEffet": "inconnue",
  "dateFin": null,
  "valeur": 14555,
  "utilisePar": ["ir-cehr-cdhr", "irpp"],
  "source": "inconnue",
  "statutValidation": "non-valide"
}
```

| Champ | Obligatoire | Rôle |
|---|---|---|
| `id` | oui | Identifiant **stable**. Minuscules, chiffres, points et tirets. Il ne dépend jamais du nom d'un fichier HTML : renommer un simulateur ne renomme aucune donnée. |
| `libelle` | oui | Description lisible sans lire le code. |
| `type` | oui | `bareme`, `taux`, `montant`, `quantite`, `table` ou `booleen`. |
| `unite` | oui | `EUR`, `decimal`, `annee`, `jour`, `personne` ou `sans-unite`. |
| `millesime` | oui | Année à laquelle la valeur se rapporte. Plusieurs millésimes d'un même `id` cohabitent dans le même fichier. |
| `dateEffet` | oui | Date d'entrée en vigueur, ou la mention `"inconnue"`. |
| `dateFin` | non | Fin d'application, ou `null` si toujours applicable. |
| `valeur` | oui sauf si contesté | La valeur elle-même, selon le `type`. |
| `utilisePar` | oui sauf si contesté | Clés des simulateurs qui emploient la valeur. |
| `source` | oui sauf si contesté | Objet source, ou la mention `"inconnue"`. |
| `statutValidation` | oui | `non-valide`, `valide` ou `conteste`. |
| `validation` | si `valide` | Qui a validé et quand. |
| `notes` | non | Précision d'application, réserve, renvoi à un arbitrage. |

L'unicité porte sur le couple `id` + `millesime`, jamais sur `id` seul.

Depuis l'issue #19, le millésime lu est **choisi, jamais subi** :
`LectureReferentiels.lecteur(domaine, { millesime })` retient l'année demandée,
et `resolution()` dit comment il l'a fait — millésime exact, absence de date de
rattachement, ou millésime hors couverture. Sans option `millesime`, le lecteur
reste utilisable tant qu'un domaine n'en porte qu'un ; au-delà, il refuse de
deviner. Voir `src/lecture-referentiels.js` et `src/millesime.js`.

### 3.1 — Les taux s'écrivent en décimal

Un taux de 17,2 % s'écrit `0.172`, jamais `17.2`. C'est la convention majoritaire
du dépôt et la recommandation de `docs/INVENTAIRE_CONVENTIONS.md` §2. Le schéma
refuse tout taux hors de l'intervalle 0 à 1 lorsque l'unité est `decimal` : une
erreur d'un facteur cent, aujourd'hui silencieuse, devient une erreur de
validation.

---

## 4. Source et date d'effet : obligatoires, mais jamais inventées

L'issue #12 demande une source et une date d'effet pour chaque valeur. Or la
plupart des valeurs actuellement embarquées n'en ont aucune.

Le schéma tranche ainsi : **les deux champs sont obligatoires, et la valeur
`"inconnue"` est admise**. Ce qui est interdit, c'est de laisser le champ absent
— donc de laisser croire à un oubli plutôt qu'à une information manquante — et
c'est d'inventer une source pour faire passer la validation.

En contrepartie, une entrée dont la source ou la date d'effet est `"inconnue"`
**ne peut pas porter le statut `valide`**. La traçabilité n'est donc pas
contournable : elle est seulement différée, et son absence reste visible.

```json
"source": {
  "reference": "CGI art. 779, I",
  "url": "https://www.legifrance.gouv.fr/…",
  "dateConsultation": "2026-08-26"
}
```

`reference` et `dateConsultation` sont obligatoires dès qu'une source est donnée.
Une source sans date de consultation ne permet pas de savoir si elle est périmée.

---

## 5. Les trois statuts de validation

| Statut | Sens | Ce qu'il autorise |
|---|---|---|
| `non-valide` | Valeur relevée dans le code existant, non confirmée par le référent fiscal. | Utilisation, en connaissant sa réserve. C'est le statut de départ de toute extraction. |
| `valide` | Confirmée par le référent fiscal, source et date d'effet connues. | Utilisation sans réserve. |
| `conteste` | Deux simulateurs portent des valeurs différentes pour la même règle. | Aucune lecture d'une valeur unique. |

Attendre les arbitrages avant d'extraire immobiliserait tout le chantier. Le
statut rend l'extraction possible **sans faire passer une valeur non confirmée
pour une valeur confirmée**.

---

## 6. Représenter un désaccord sans le trancher

C'est la règle la plus importante du schéma.

Lorsque deux simulateurs appliquent des valeurs différentes à la même règle, on
ne choisit pas. L'entrée passe en `conteste`, **perd son champ `valeur`** et
porte à la place ses `variantes` :

```json
{
  "id": "ps.taux.plus-values",
  "libelle": "Taux global des prélèvements sociaux appliqué aux plus-values",
  "type": "taux",
  "unite": "decimal",
  "millesime": 2025,
  "dateEffet": "inconnue",
  "statutValidation": "conteste",
  "variantes": [
    { "cle": "17-2", "valeur": 0.172, "utilisePar": ["irpp", "pv-immobiliere"], "source": "inconnue" },
    { "cle": "18-6", "valeur": 0.186, "utilisePar": ["ir-cehr-cdhr"],           "source": "inconnue" }
  ],
  "arbitrage": {
    "document": "docs/CORRECTIONS_A_VALIDER.md",
    "point": "2.2",
    "question": "Quel taux s'applique, à quels revenus, et à compter de quelle date ?"
  }
}
```

Trois conséquences, toutes vérifiées automatiquement :

1. **le code ne peut pas se tromper par inattention.** Il n'y a pas de `valeur` à
   lire ; un simulateur doit désigner explicitement la variante qu'il emploie ;
2. **l'extraction ne peut pas trancher.** Recopier une seule des deux valeurs
   ferait disparaître la divergence ; le schéma refuse une entrée `conteste` qui
   porterait une valeur unique, et refuse une seule variante ;
3. **la divergence reste posée comme question.** Le champ `arbitrage` est
   obligatoire et renvoie à la fiche soumise au référent fiscal.

Le même simulateur ne peut pas figurer dans deux variantes : une divergence
oppose des simulateurs distincts. Deux valeurs différentes **au sein d'un même
simulateur** relèvent d'un défaut, pas d'un désaccord, et se traitent comme tel.

Le jour où l'arbitrage tombe, la correction consiste à remplacer les variantes
par une valeur unique, un statut `valide` et une source. **Aucun code n'est
réécrit.** C'est exactement le bénéfice recherché par l'externalisation.

---

## 7. Barèmes : bornes explicites, pas d'infini

Une tranche s'écrit :

```json
{ "borneInf": 11600, "borneInfIncluse": false,
  "borneSup": 29579, "borneSupIncluse": true, "taux": 0.11 }
```

Quatre règles :

1. **les bornes ouvertes ou fermées sont toujours écrites.** Jamais déduites.
   L'ambiguïté implicite des bornes est précisément l'objet de l'issue #7 ;
2. **une tranche sans limite haute porte `borneSup: null`.** `Infinity` n'existe
   pas en JSON. Seule la dernière tranche peut être sans limite ;
3. **les chevauchements sont refusés.** Une même assiette ne peut pas relever de
   deux taux, que ce soit par recouvrement d'intervalles ou par une borne
   incluse des deux côtés ;
4. **les intervalles non couverts sont acceptés mais signalés.** Plusieurs
   barèmes du dépôt sautent un euro à chaque seuil. L'extraction doit conserver
   ce comportement — sinon elle changerait un résultat — mais ne doit pas le
   rendre invisible. La validation émet un avertissement nominatif par trou.

Cette distinction entre erreur et avertissement est délibérée : le validateur
refuse ce qui est impossible, et signale ce qui est douteux mais réellement
présent. Un validateur qui refuserait les données actuelles serait inutilisable.

---

## 8. Exemples

| Fichier | Ce qu'il montre |
|---|---|
| `exemples/valide.json` | Un référentiel complet : barème, montant, valeur sourcée, valeur contestée. |
| `exemples/avertissement-bareme-avec-trou.json` | Un cas accepté mais signalé : le barème IFI réellement employé aujourd'hui. |
| `exemples/invalides/*.json` | Quinze refus, un par fichier. Le nom du fichier annonce la raison ; son champ `commentaire` l'explique. |

Chaque exemple invalide est vérifié par `tests/unit/schema-referentiel.test.js` :
un fichier du dossier `invalides/` qui deviendrait acceptable ferait échouer les
tests.

---

## 9. Valider un référentiel

Depuis un test ou un script :

```js
const { validerReferentiel, formaterRapport } = require('./scripts/lib/schema-referentiel');

const rapport = validerReferentiel(JSON.parse(contenu));
if (rapport.erreurs.length) console.error(formaterRapport(rapport, 'ir.json'));
```

La commande `npm run donnees:valider`, qui appliquera cette validation à
l'ensemble de `data/` et échouera sur la première erreur, est livrée par
l'issue #18.

---

## 10. Ce que le schéma ne fait pas

Il vérifie la **forme**, la **cohérence interne** et la **traçabilité**. Il ne
vérifie jamais qu'un chiffre est juridiquement exact : aucun contrôle
automatique ne peut le faire, et c'est la validation du référent fiscal qui fait
passer une entrée de `non-valide` à `valide`.
