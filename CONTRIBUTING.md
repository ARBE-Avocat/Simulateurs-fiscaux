# Contribuer

Ce guide s'adresse aux personnes qui modifient le dépôt : le propriétaire
(avocat, référent juridique), le mainteneur technique et tout contributeur
occasionnel. Les agents IA suivent en plus `AGENTS.md`, qui reste la source de
vérité des règles communes ; en cas de doute, c'est lui qui prime.

## Ce qu'il faut savoir avant de toucher à quoi que ce soit

- **Un chiffre fiscal n'existe qu'à un seul endroit** : `data/referentiels/`.
  On ne modifie jamais un taux, un seuil ou un barème dans une page HTML ou un
  moteur. Voir `data/README.md` pour la procédure.
- **Un choix technique ne vaut jamais validation juridique.** Toute correction
  qui change un montant affiché est décrite dans `docs/CORRECTIONS_A_VALIDER.md`
  et soumise au référent. Un développeur ne tranche pas seul une règle fiscale.
- **Personne ne développe dans `main`.** Seul le propriétaire y fusionne.
- `docs/CODEMAP.md` dit où vit chaque chose.

## Installer

Le seul prérequis est Node.js 22 ou plus récent. Il n'y a aucune dépendance à
installer.

```bash
git clone https://github.com/ARBE-Avocat/Simulateurs-fiscaux.git
cd Simulateurs-fiscaux
npm run dev        # http://localhost:8000/
npm run verifier   # tous les contrôles, comme la CI
```

## Le cycle d'une modification

1. **Partir d'une issue.** Elle décrit le problème et le résultat attendu. S'il
   n'y en a pas, en ouvrir une en suivant `AGENTS.md` §5 : le problème d'abord,
   la technique ensuite, et la section « Questions métier » près du début.
2. **Créer une branche courte** depuis `main` à jour : `fix/…`, `feat/…`,
   `data/…`, `docs/…` ou `refactor/…`. Le mainteneur technique suit un
   régime différent, décrit dans `AGENTS.md` §9 (branches `clv/y-X.Y-<slug>`).
3. **Commencer par un test** qui reproduit le défaut ou décrit la règle. Les
   moteurs de `src/moteurs/` se testent par `require`, sans navigateur ; voir
   `tests/README.md`.
4. **Faire le changement**, et rien d'autre. Ne pas mélanger correction
   métier, refactorisation et changement visuel dans la même branche.
5. **Vérifier** : `npm run verifier` doit passer. Ouvrir ensuite les pages
   concernées dans un navigateur (`npm run dev`) et regarder la console.
6. **Documenter** dans la même branche : `CHANGELOG.md` sous `Non publié`,
   `docs/CORRECTIONS_A_VALIDER.md` si un montant change, `README.md` si
   l'usage change, `docs/CODEMAP.md` si un fichier change de rôle.
7. **Ouvrir une pull request** vers `main` avec : ce qui change pour
   l'utilisateur, l'issue (`Closes #N` ou `Part of #N`), le comportement avant
   et après, les commandes exécutées, les validations métier attendues, et une
   capture si l'interface change.

## Modifier une valeur fiscale

C'est le cas le plus courant, et le seul qui ne demande pas de toucher au
code :

```bash
# 1. modifier data/referentiels/<domaine>.json — valeur, source, date d'effet, statut
npm run donnees:valider
npm run donnees:generer
npm test
```

Le diff montre la valeur, sa source, sa date d'effet et son statut de
validation : le référent peut le relire sans lire une ligne de code. Une valeur
sans source connue reste au statut `non-valide` ; ce n'est pas un blocage,
c'est une information honnête.

## Ajouter ou modifier un simulateur

- La page vit dans `simulateurs/<slug>/index.html` ; son adresse est le
  dossier, sans millésime ni extension, et ne change plus. Un renommage impose
  de mettre à jour `index.html`, `tests/helpers/simulateurs.js` et la table des
  anciennes adresses de `scripts/lib/redirections.js` dans le même commit.
- Le calcul vit dans `src/moteurs/<slug>.js` : entrées explicites, aucun accès
  au DOM, résultat structuré. La page lit son formulaire, appelle le moteur et
  affiche.
- Les valeurs fiscales sont lues par `parametresDepuisReferentiels()` dans
  les référentiels générés, jamais recopiées.
- Une saisie se lit par `Conventions.nombreSaisi()`, un montant s'affiche par
  le `fmt()` de la page, un calcul impossible s'affiche « — » : voir
  `docs/CONVENTIONS.md`.
- Une donnée saisie par l'utilisateur ne va jamais dans `innerHTML` sans être
  échappée ; préférer `textContent`.

## Versions

`VERSION` porte la version de la branche, `CHANGELOG.md` les changements
visibles. Les règles — quand incrémenter `X`, `Y` ou `Z`, quand tagger, ce qui
ne mérite aucun bump — sont dans `AGENTS.md` §11. En résumé : un support de
travail peut changer dix fois sans qu'une version bouge ; un centime affiché
qui change reçoit un bump.

## Relecture

Une pull request est relue par quelqu'un d'autre que son auteur. La relecture
cherche d'abord : règle non sourcée, mauvais millésime, confusion vide/zéro,
bornes ou arrondis incohérents, lien cassé, injection HTML, absence de test.
Les retours sont classés `Bloquant` ou `Amélioration facultative`.
