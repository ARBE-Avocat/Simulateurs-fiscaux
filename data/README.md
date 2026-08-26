# Données fiscales

Ce dossier contient les **valeurs fiscales du projet** : barèmes, taux, seuils,
abattements et plafonds. À terme, elles n'existeront plus qu'ici, et les
simulateurs se contenteront de les lire.

| Dossier | Contenu | Édité à la main ? |
|---|---|---|
| `schema/` | Le format commun et ses exemples. Voir `schema/README.md`. | oui |
| `referentiels/` | Les référentiels par domaine fiscal. **Source de vérité.** | oui, ou par import |
| `imports/` | Les CSV officiels déposés tels quels, datés. | déposés, jamais réécrits |

Le fichier `src/genere/referentiels.js` est **produit** à partir de ce dossier.
Il ne se modifie jamais à la main : voir `docs/ARCHITECTURE_CIBLE.md` §2.4.

---

## Modifier une valeur fiscale

C'est la procédure que ce chantier existe pour rendre possible. Elle remplace la
réécriture d'un fichier HTML.

```bash
# 1. Modifier la valeur dans data/referentiels/<domaine>.json
# 2. Vérifier que les données restent cohérentes
npm run donnees:valider

# 3. Reconstruire le fichier que lisent les simulateurs
npm run donnees:generer

# 4. Vérifier qu'aucun résultat n'a bougé sans qu'on le veuille
npm test
```

Puis ouvrir une pull request. Le diff montre la valeur, sa source, sa date
d'effet et son statut de validation : il est relisible par le référent fiscal
sans lire une ligne de code.

**Ne jamais modifier une valeur sans mettre à jour sa source, sa date d'effet et
son statut.** Une valeur juste dont on ignore l'origine n'est pas vérifiable.

---

## Importer un CSV officiel

```bash
npm run donnees:importer -- data/imports/dmtg-2025.csv \
  --domaine dmtg --libelle "Mutations à titre gratuit"
```

Options :

| Option | Effet |
|---|---|
| `--domaine <id>` | identifiant du domaine ; par défaut, le nom du fichier CSV |
| `--libelle <texte>` | libellé lisible du domaine |
| `--sortie <chemin>` | fichier produit ; par défaut `data/referentiels/<domaine>.json` |
| `--verifier` | n'écrit rien, dit seulement si le référentiel existant correspond au CSV |

Deux garanties :

1. **l'import est déterministe.** Les entrées sont triées par identifiant puis
   millésime, les tranches par borne basse, les variantes par clé, et la mise en
   forme est fixe. Réimporter le même CSV ne produit aucun diff, même si ses
   lignes ont été réordonnées entre-temps ;
2. **une donnée invalide fait échouer la commande sans rien écrire.** Le
   référentiel publié n'est jamais laissé dans un état intermédiaire.

Déposer le CSV d'origine dans `data/imports/` avant de l'importer, et ne plus le
modifier : c'est la trace de ce qui a été reçu.

### Colonnes du CSV

Séparateur `;`, encodage UTF-8. Un champ contenant un `;` est entouré de
guillemets doubles. Un BOM éventuel est ignoré.

| Colonne | Obligatoire | Contenu |
|---|---|---|
| `id` | oui | identifiant stable, en minuscules |
| `libelle` | oui | description lisible |
| `type` | oui | `bareme`, `taux`, `montant`, `quantite`, `table`, `booleen` |
| `unite` | oui | `EUR`, `decimal`, `annee`, `jour`, `personne`, `sans-unite` |
| `millesime` | oui | année, entier |
| `dateEffet` | oui | `AAAA-MM-JJ`, ou vide si inconnue |
| `dateFin` | non | `AAAA-MM-JJ`, ou vide |
| `statutValidation` | oui | `non-valide`, `valide`, `conteste` |
| `utilisePar` | oui | clés de simulateurs, séparées par des virgules |
| `valeur` | selon le type | pour un taux, un montant, une quantité ou un booléen |
| `borneInf`, `borneInfIncluse`, `borneSup`, `borneSupIncluse`, `taux` | pour un barème | une ligne par tranche ; `borneSup` vide signifie « sans limite haute » |
| `varianteCle` | pour une entrée contestée | identifiant de la variante, par exemple `17-2` |
| `arbitrageDocument`, `arbitragePoint`, `arbitrageQuestion` | pour une entrée contestée | renvoi vers la fiche soumise au référent, et la question posée |
| `sourceReference`, `sourceUrl`, `sourceDateConsultation` | non | laissées vides, elles deviennent la mention explicite « inconnue » |
| `validationPar`, `validationDate` | pour une entrée validée | qui a validé, et quand |
| `notes` | non | précision d'application ou réserve |

Les booléens s'écrivent `oui` ou `non`. Les nombres acceptent la virgule
décimale et les espaces de milliers. **Un taux s'écrit en décimal** : `0,172` et
non `17,2`.

Un barème occupe **une ligne par tranche**, toutes portant le même `id` et le
même `millesime`. Les colonnes qui décrivent l'entrée et non la tranche —
`utilisePar`, les colonnes de source — doivent être identiques sur toutes ces
lignes, sinon le résultat dépendrait de l'ordre du fichier.

Une entrée contestée occupe **une ligne par variante**, chacune avec sa `valeur`,
sa `varianteCle` et les simulateurs qui l'emploient. L'entrée produite n'a alors
**aucune valeur unique** : l'import ne tranche jamais une divergence.

### Exemples

| Fichier | Ce qu'il montre |
|---|---|
| `imports/exemple-dmtg.csv` | Un import complet : montants, barème à sept tranches, source citée, source inconnue, et une règle contestée à deux variantes. |
| `imports/exemple-invalide-taux-en-pourcentage.csv` | Un refus : un taux écrit `17,2` au lieu de `0,172`. La commande échoue et n'écrit rien. |

Les deux sont vérifiés par `tests/unit/importeur-referentiels.test.js`.

---

## Ce que la validation contrôle

`npm run donnees:valider` vérifie la **forme**, la **cohérence interne** et la
**traçabilité** :

- schéma, types et unités connues ;
- taux dans la plage autorisée pour leur unité ;
- tranches ordonnées, sans chevauchement ni valeur relevant de deux taux ;
- dates d'effet et de fin cohérentes entre elles ;
- source et date de consultation présentes, ou explicitement inconnues ;
- absence de doublon `id` + `millesime` ;
- intervalles non couverts par un barème : **signalés**, sans faire échouer la
  commande, car ils existent réellement dans les données actuelles.

Elle ne vérifie **jamais** qu'un chiffre est juridiquement exact. C'est la
validation du référent fiscal qui fait passer une entrée de `non-valide` à
`valide`.
