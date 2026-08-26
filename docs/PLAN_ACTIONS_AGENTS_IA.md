# Plan d’action orchestré par agents IA

Ce document propose l’ordre de traitement des issues du dépôt `ARBE-Avocat/Simulateurs-fiscaux`. Il est destiné à un orchestrateur humain qui délègue chaque tâche à un ou plusieurs agents IA.

Dernière mise à jour du plan : 26 août 2026 — synchronisé avec `v0.5.0-beta.2`.

## Objectifs de l’orchestration

- Corriger les risques de résultat fiscal erroné avant les refactorisations.
- Installer les tests avant de déplacer ou mutualiser le code.
- Faire valider par un humain les règles fiscales, sources et résultats attendus.
- Externaliser les données avant de découpler complètement les interfaces.
- Garder des branches et pull requests petites, relisibles et réversibles.
- Éviter que deux agents modifient simultanément les mêmes fichiers ou modules partagés.

## État actuel

- La phase 0 de gouvernance est terminée sur `clv/preprod`.
- La préversion de `clv/preprod` reste `0.3.0-beta.4` ; la version stable visée est `0.3.0`.
- Le jalon `Y = 0.4` est ouvert sur la branche `clv/y-0.4-fiabilite`, en préversion `0.4.0-beta.13`.
- L'étape 1.1 (#10, socle de tests) est réalisée sur cette branche et attend relecture ; elle n'est pas intégrée à `clv/preprod`.
- Les autres issues citées dans ce plan sont encore ouvertes au 26 août 2026.
- L'issue #29 reste ouverte : seule sa première partie documentaire et de gouvernance est amorcée.
- #6 est corrigée sur la branche du jalon et attend relecture : le simulateur IFI ne dépend plus d'une variable globale et un contrôle automatique interdit désormais les noms mélangeant plusieurs alphabets.
- #8 est corrigée pour sa partie technique : un zéro saisi n'est plus remplacé par une valeur par défaut dans les simulateurs IFI, Succession et Démembrement. La validation explicite des champs obligatoires reste ouverte et bascule vers #11.
- #5 est corrigée : la réduction pour dons de l'IRPP est recalculée dès que le revenu change, et le calcul est isolé du formulaire.
- #4 est bloquée sur une validation métier : la formule et l'intervalle de la décote CDHR doivent être confirmés par le référent fiscal avant toute correction.
- Second blocage du jalon, relevé au titre du point de contrôle A : le taux des prélèvements sociaux diverge entre simulateurs, 18,6 % dans le simulateur IR contre 17,2 % dans l'IRPP et la plus-value immobilière, soit 14 000 € d'écart sur une plus-value d'un million. Aucune issue ne le couvrait ; à trancher par le référent fiscal avant promotion.
- #11 et #7 ont été déplacées vers le jalon `0.5` : le jalon `0.4` n'attend plus qu'un seul arbitrage, celui de #4.
- Le jalon `0.4` est donc complet à l'exception de #4. Une fois la décote tranchée, il peut être promu.
- Documents à soumettre au référent juridique : `docs/CORRECTIONS_A_VALIDER.md` pour les arbitrages, `docs/INVENTAIRE_CONVENTIONS.md` pour préparer #11.
- Nouvelle issue #31 — unification de l'identité visuelle et des composants d'interface, ouverte à la demande du référent métier. Elle dépend de #20 et n'appartient pas au jalon `0.4`.
- Le jalon `Y = 0.5` est ouvert sur la branche `clv/y-0.5-donnees`, créée depuis `clv/y-0.4-fiabilite` et non depuis `clv/preprod` : la `0.4` n'est pas encore intégrée, la pile est conservée.
- #20 est traitée : `docs/ARCHITECTURE_CIBLE.md` fixe l'arborescence, les URL stables, la source de vérité de chaque type de fichier et l'ordre de migration. Aucun fichier n'est encore déplacé.
- #12 est traitée : `data/schema/README.md` définit le format commun, `scripts/lib/schema-referentiel.js` en est la définition exécutable, et `docs/INVENTAIRE_REFERENTIELS.md` recense les valeurs fiscales, leur simulateur, leur contexte et ce que le dépôt sait de leur source. Aucune valeur n'est encore extraite.
- #18 est traitée : `npm run donnees:valider`, `npm run donnees:importer` et `npm run donnees:generer` forment la chaîne reproductible qui remplacera la réécriture du HTML. L'import est déterministe et n'écrit rien lorsqu'une donnée est invalide. Procédure et format documentés dans `data/README.md`.
- Deux divergences supplémentaires ont été découvertes pendant l'inventaire et ajoutées aux fiches 2.3 et 2.4 de `docs/CORRECTIONS_A_VALIDER.md` : le plafonnement du quotient familial, appliqué par le simulateur IR et absent de l'IRPP, jusqu'à 19 985,10 € d'écart ; et la méthode de liquidation de l'IFI, différente entre le simulateur IFI et la section IFI de l'IRPP, 668,39 € d'écart sur l'exemple relevé. Aucune n'est tranchée.
- `docs/arbitrages.html` porte désormais ces deux points. **La page publiée n'a pas encore été republiée** : elle doit l'être à la même adresse, par CLV, avant la prochaine sollicitation du référent juridique.

## Décisions d'architecture déjà arbitrées

Ces décisions sont prises et ne sont plus à rouvrir dans les tâches courantes. Elles sont désormais formalisées dans `docs/ARCHITECTURE_CIBLE.md`, livrable de #20.

- **Les fichiers HTML n'ont pas vocation à être utilisés seuls ni à rester autonomes.** Arbitrage de CLV du 26 août 2026. Il répond au point « Décider si les HTML autonomes restent un livrable requis » de #20. Conséquences : des ressources partagées (feuille de style, scripts, données) peuvent être référencées par chemin relatif ; le dossier doit rester complet ; la distribution d'un fichier HTML isolé n'est plus un cas d'usage à préserver.
- La cible est autorisée, pas une migration opportuniste. `AGENTS.md` §7 continue d'interdire de désassembler un HTML de sa propre initiative dans une tâche sans rapport : un déplacement de fichier n'a lieu que dans l'étape de migration qui le porte, M1 à M6 de `docs/ARCHITECTURE_CIBLE.md`.

## Maintenance obligatoire du plan

Le présent fichier est un document opérationnel. Il doit être actualisé dans la même modification que tout changement affectant l'ordre des travaux, leurs dépendances, l'état d'une phase, les conventions de branches, les versions ou les jalons.

Après chaque tâche, l'agent vérifie explicitement si le plan doit évoluer. Toute mise à jour pertinente doit ajuster les sections concernées, la date et la version de synchronisation. Une étape n'est marquée comme terminée que sur la base d'un commit intégré ou d'une décision humaine explicite.

## Règles de fonctionnement pour les agents

1. Pour CLV, une branche par version mineure `Y` regroupe les issues du jalon. Pour les autres contributeurs, une branche et une pull request par issue ou sous-issue restent la règle normale.
2. Un agent ne fusionne jamais sa propre pull request. L’orchestrateur relit ; seul le propriétaire du dépôt fusionne dans `main`.
3. Une correction de calcul commence par un test reproduisant le défaut.
4. Une valeur fiscale ne peut être ajoutée ou modifiée sans source, millésime et validation métier.
5. Une refactorisation ne doit pas modifier volontairement les résultats fiscaux.
6. Ne jamais mélanger dans la même PR : correction métier, refactorisation générale et changement visuel.
7. Les fichiers générés ne sont jamais modifiés manuellement.
8. Toute PR doit indiquer les commandes exécutées et les résultats obtenus.
9. Utiliser `Closes #N` pour une issue terminée et `Part of #N` pour une contribution partielle à un epic.
10. Les branches `Y` de CLV sont empilées : la première part de `clv/preprod`, la suivante de la branche `Y` précédente. Elles ne sont pas fusionnées dans `clv/preprod` avant les validations requises.

Conventions de branches recommandées :

```text
clv/y-0.4-fiabilite
clv/y-0.5-donnees
clv/y-0.6-architecture
clv/y-0.7-qualite
```

## Workflow CLV — branches `Y` empilées

CLV avançant avant de disposer de tous les arbitrages métier, `clv/preprod` reste sur le dernier état validé. Les développements sont regroupés par jalon mineur et empilés :

```text
clv/preprod (0.3.0-beta.N validée)
└─ clv/y-0.4-fiabilite
   └─ clv/y-0.5-donnees
      └─ clv/y-0.6-architecture
         └─ clv/y-0.7-qualite
```

Règles de la pile :

- une seule branche CLV par `Y`, même si elle traite plusieurs issues ;
- un ou plusieurs commits cohérents par issue, avec références et tests ;
- une draft PR peut cibler la branche `Y` précédente pour isoler le diff du jalon ;
- les questions métier non résolues restent visibles et interdisent la promotion, sans empêcher les travaux techniques indépendants ;
- toute correction d'une branche parente est propagée dans les descendantes avant de poursuivre ;
- les branches sont validées et intégrées dans leur ordre ; aucune branche descendante ne contourne une branche parente non validée ;
- seul CLV autorise une intégration dans `clv/preprod`, et seul le propriétaire fusionne ensuite dans `main`.

## Phase 0 — Installer la gouvernance initiale — terminée

Livré dans les préversions `0.3.0-beta.1` à `0.3.0-beta.4` :

- `AGENTS.md`, source commune des consignes pour les agents IA ;
- `CLAUDE.md`, qui importe les consignes communes pour Claude Code ;
- `CHANGELOG.md` et `VERSION` ;
- règles de rédaction des issues, de validation juridique et de vulgarisation technique ;
- branche permanente `clv/preprod` et branches de travail `clv/*` ;
- règles `X.Y.Z`, préversions `X.Y.Z-beta.N`, tags et releases ;
- présent plan d'action et obligation de le maintenir à jour ;
- consignes personnelles de CLV dans un fichier local ignoré par Git.
- workflow de branches `Y` empilées dans l'attente des validations métier.

Cette phase ne clôt pas l'issue #29. `CODEMAP.md`, `CONTRIBUTING.md`, les templates GitHub, la protection de `main`, la sécurité du rendu et l'accessibilité desktop restent à traiter.

## Graphe de dépendances simplifié

```text
Phase 0 Gouvernance ✓ ─> #10 Socle de tests ✓
 ├─> #5 ✓        puis #4 (bloquée : décote CDHR)
 └─> #6 ✓ -> #8 ✓  voie IFI / valeurs par défaut

Jalon 0.5 : #11 -> #7           bornes, unités et arrondis

#20 Architecture cible ───────────────────> #12 Schéma des référentiels
#9 et #11 alimentent les statuts,             │
sans bloquer l'extraction                     │
                                               ├─> #18 Import et validation
                                               ├─> #14 Référentiel IR
                                               ├─> #15 Référentiel IFI
                                               ├─> #16 DMTG / usufruit / assurance-vie
                                               ├─> #17 Plus-value immobilière
                                               └─> #13 Changes -> #1 Jours non ouvrés

#13 à #18 ─> #19 Millésimes ─> clôture de l’epic #2

Référentiels stabilisés ─> epic #21
  ├─> #22 IRPP
  ├─> #23 Cession de titres
  ├─> #24 Plus-value immobilière
  ├─> #25 IFI
  ├─> #26 Succession
  └─> #27 Démembrement

#20 Architecture cible ─> #31 Unification de l'interface
                              (par simulateur, après ou avec #21)

En parallèle contrôlé : #28 CI
En finition : #29 Qualité desktop, documentation et gouvernance
```

## Phase 1 — Sécuriser les calculs

Branche CLV du jalon : `clv/y-0.4-fiabilite`. Toutes les issues de cette phase sont traitées séquentiellement ou par commits distincts sur cette branche, sans promotion dans `clv/preprod` avant validation.

### Étape 1.1 — Installer le socle de tests — réalisée, en attente de relecture

- [#10 — Mettre en place le socle de tests automatisés](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/10)

Cette issue précède les correctifs : chaque bug doit pouvoir être reproduit puis verrouillé par un test. Le premier socle est volontairement minimal et n’anticipe pas l’architecture finale décidée en #20.

Livré sur `clv/y-0.4-fiabilite` :

- commande unique `npm test`, sans dépendance, avec le lanceur intégré à Node.js ;
- chargeur de simulateur et faux DOM minimal pour exécuter les calculs hors navigateur, sans modifier les HTML autonomes ;
- dossiers `tests/unit`, `tests/integration`, `tests/fixtures` et `tests/helpers` ;
- tests de fumée des six simulateurs et contrôle des liens relatifs de l’accueil ;
- premiers tests du moteur IR et fixture associée, marquée non validée tant que #9 n’a pas tranché ;
- documentation dans `tests/README.md` et `README.md`.

Les correctifs #4 à #8 doivent désormais commencer par un test reproduisant le défaut, écrit avec ce socle.

### Étape 1.2 — Lancer la validation métier en fil rouge

- [#9 — Établir et valider les cas fiscaux de référence](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/9)

Un agent peut inventorier les cas, préparer les fixtures et retrouver les sources. L’approbation des résultats reste une étape humaine obligatoire. Cette issue peut avancer en parallèle de tous les correctifs, mais elle doit être suffisamment aboutie avant l’extraction des référentiels.

### Étape 1.3 — Corriger les bugs par voies indépendantes

Voie IRPP, à exécuter séquentiellement :

1. [#4 — Corriger la décote CDHR](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/4) — **bloquée sur validation métier**. Le calcul est isolé et testé, le défaut est enregistré en attente dans la suite de tests, et la question a été posée sur l'issue. Le dépôt contient deux implémentations divergentes de la décote ; l'écart atteint 45 000 € pour un célibataire proche du seuil. Ne pas trancher sans réponse du référent fiscal.
2. [#5 — Recalculer les dons lorsque le RNI change](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/5) — corrigée, en attente de relecture

L'ordre a été inversé : #5 est purement technique et a été traitée d'abord, tandis que #4 attend une décision métier. Les deux touchent le même fichier et restent séquentielles.

Voie IFI et saisies, à exécuter séquentiellement :

1. [#6 — Supprimer le contournement lié à la variable cyrillique](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/6) — corrigée, en attente de relecture
2. [#8 — Distinguer la valeur zéro des champs vides](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/8) — corrigée pour la partie zéro contre vide ; la validation des champs obligatoires est reportée sur #11

Les deux voies peuvent être confiées à deux agents différents en parallèle. Les issues d’une même voie ne doivent pas être parallélisées car elles touchent les mêmes fichiers.

### Étape 1.4 — Conventions et bornes — déplacée vers le jalon `0.5`

Les issues #11 et #7 ne font plus partie du jalon `0.4`. Décision du 26 août 2026, motivée par :

- #11 est déjà une dépendance de #12, le schéma des référentiels, qui appartient à la phase 2 ; sa place naturelle est avec le chantier données ;
- #7 dépend de #11, les deux se traitent ensemble ;
- leur maintien dans `0.4` obligeait à attendre trois arbitrages distincts avant de clore le jalon, alors qu'un seul, #4, porte un enjeu financier réel.

L'écart mesuré sur #7 plafonne à 1,27 € d'impôt, contre près de 50 000 € pour #4. Le défaut de #7 reste réel — deux simulateurs ne donnent pas le même impôt pour le même revenu — mais relève de la cohérence, non de l'exactitude matérielle.

Travail préparatoire déjà livré : `docs/INVENTAIRE_CONVENTIONS.md` recense les conventions réellement employées par les six simulateurs, chiffre les écarts et présente les options. Il ne tranche rien.

Voir l'étape 2.0.

### Point de contrôle humain A

`docs/INVENTAIRE_CONVENTIONS.md` prépare #11 : il constate les conventions employées, chiffre les écarts et présente les options, sans rien trancher.

Le document `docs/CORRECTIONS_A_VALIDER.md` rassemble, en langage non technique, toutes les corrections ayant un effet fiscal et les questions correspondantes. Il est destiné à être soumis tel quel au référent juridique.

Décisions métier attendues, par ordre d'urgence :

1. #4 — formule, intervalle et point d'application de la décote CDHR.
2. Le taux des prélèvements sociaux, 17,2 % ou 18,6 %, et son champ d'application.
3. #9 — cas fiscaux de référence, qui permettront de faire passer les fixtures actuelles de « non validé » à « validé ».
4. #11 — champs obligatoires, bornes acceptées et messages d'erreur, reliquat de #8.

Avant de poursuivre :

- tous les bugs #4 à #8 ont un test de non-régression ;
- les formules sensibles ont été validées ou signalées comme encore incertaines ;
- les cas de référence #9 couvrent au minimum les parcours utilisés pour les prochaines migrations ;
- aucune divergence 17,2 % / 18,6 % n’est résolue par simple supposition de l’agent.

## Phase 2 — Définir l’architecture et externaliser les données

Branche CLV du jalon : `clv/y-0.5-donnees`, créée depuis la branche `Y = 0.4` validée techniquement mais pas nécessairement encore intégrée.

### Étape 2.0 — Fixer les conventions, puis les bornes

1. [#11 — Définir validation, unités et arrondis](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/11) — reprend aussi le reliquat de #8 : quels champs sont obligatoires, quelles bornes sont acceptées et quel message d'erreur s'affiche
2. [#7 — Uniformiser et corriger les bornes des barèmes](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/7)

Déplacées depuis le jalon `0.4`. #7 ne commence qu'après la décision de #11 sur la représentation des tranches et les arrondis, et doit intégrer les correctifs déjà livrés dans les fichiers IRPP et IFI.

L'inventaire préparatoire `docs/INVENTAIRE_CONVENTIONS.md` est à lire avant d'ouvrir ces deux issues : il évite de refaire le relevé et transforme #11 en une série de choix à cocher.

### Étape 2.1 — Décider de l’architecture cible — réalisée

- [#20 — Définir l’architecture, les URL stables et les livrables](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/20)

Cette décision précède la création de `src/`, `data/`, `scripts/` et des fichiers générés. L’agent doit proposer une solution simple en JavaScript, sans imposer un framework applicatif.

Le choix « HTML autonomes ou site composé de plusieurs assets » est déjà arbitré : voir la section « Décisions d'architecture déjà arbitrées ». Les fichiers HTML ne sont pas destinés à un usage isolé, et #20 doit acter ce point plutôt que le rouvrir.

Livrable : `docs/ARCHITECTURE_CIBLE.md`. Décisions retenues, résumées :

- pas de framework applicatif, aucune dépendance de production ;
- source de vérité fiscale unique dans `data/`, transportée vers le navigateur et les tests par un fichier généré `src/genere/referentiels.js`, chargé de façon synchrone ; pas de `fetch` de JSON pendant l'extraction, afin de ne pas rendre asynchrones les calculs dans la même opération ;
- URL cibles en dossier, sans espace, sans accent et sans millésime, avec redirections définitives depuis les anciens noms ;
- publication du seul dossier `site/` construit par `npm run build`, via GitHub Actions (#28). Mesure immédiate en attendant : un `_config.yml` exclut `docs/`, `tests/`, `scripts/` et `data/` de la construction Pages. Sans cette mesure, la fusion de la `0.4` dans `main` aurait rendu `docs/arbitrages.html` accessible publiquement, contrairement à la règle d'`AGENTS.md` ;
- migration en six étapes M1 à M6, réparties sur les jalons `0.5` à `0.7` ; aucune n'associe déplacement de fichiers et changement de calcul.

Contraintes d'entrée intégrées au document de décision :

- l'externalisation des données (#2 et suivantes) suppose des ressources partagées ;
- l'unification de l'interface (#31) suppose une feuille de style commune à un seul endroit ;
- l'emplacement de cette feuille commune et des données doit être fixé ici, avant toute migration visuelle.

### Étape 2.2 — Définir le contrat des données — réalisée

Sous-issue de l’epic [#2](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/2) :

- [#12 — Définir le schéma et l’inventaire des référentiels](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/12)

Dépendance stricte : #20, pour savoir où vivent les données.

#9 et #11 ne bloquent plus cette étape, à une condition : **le schéma doit savoir porter une valeur non validée.** Décision du 26 août 2026.

L’agent doit commencer par les exemples et le schéma, sans extraire immédiatement toutes les constantes.

Livré :

- `data/schema/README.md`, explication du format en langage clair ;
- `scripts/lib/schema-referentiel.js`, définition exécutable qui décide seule de ce qui est valide ;
- `data/schema/exemples/` : un référentiel valide, un cas accepté mais signalé, quinze cas invalides ;
- `tests/unit/schema-referentiel.test.js`, dix-neuf contrôles ;
- `docs/INVENTAIRE_REFERENTIELS.md`, inventaire valeur → simulateur → contexte → source.

Choix structurants à connaître avant les extractions :

- source et date d'effet sont **obligatoires**, mais la valeur `"inconnue"` est admise ; en contrepartie une entrée dont l'une des deux est inconnue ne peut pas porter le statut `valide`. Rien n'est inventé, rien n'est masqué ;
- une entrée `conteste` **perd son champ `valeur`** et porte des `variantes` rattachées chacune aux simulateurs qui l'emploient, plus la question posée au référent. Le code ne peut donc pas lire une valeur unique par inattention, et l'extraction ne peut pas trancher ;
- les bornes de tranches sont écrites explicitement, `Infinity` est remplacé par `null`, et un intervalle non couvert est **accepté mais signalé** : refuser les barèmes actuels rendrait les données inextractibles.

### Principe des valeurs non validées

Attendre les arbitrages du référent juridique pour extraire les référentiels reviendrait à immobiliser tout le chantier données. Ce n'est pas nécessaire, et c'est même contraire à l'objet de l'externalisation.

Toute valeur fiscale extraite porte donc, en plus de sa valeur :

- sa `source` et sa `dateEffet` lorsqu'elles sont connues, sinon la mention explicite qu'elles ne le sont pas ;
- un `statutValidation` : `non-valide`, `valide` ou `conteste` ;
- la `dateValidation` et l'identité du valideur, le cas échéant.

Conséquences pratiques :

- l'extraction conserve les valeurs actuellement embarquées, sans les corriger ni les arbitrer ; c'est une refactorisation, elle ne change aucun résultat ;
- un arbitrage ultérieur du référent juridique devient **la modification d'une donnée et d'un statut**, non une réécriture de code. C'est exactement le bénéfice recherché ;
- lorsque deux simulateurs portent des valeurs différentes pour une même règle, le schéma doit pouvoir représenter le désaccord avec le statut `conteste` plutôt que d'en choisir une. Un agent ne tranche jamais une divergence par extraction.

Deux divergences de ce type sont déjà connues et devront être représentées ainsi : la décote CDHR (#4) et le taux des prélèvements sociaux, 17,2 % contre 18,6 %.

Le travail d'extraction est par ailleurs le meilleur moyen d'en découvrir d'autres : passer chaque valeur en revue oblige à la regarder. Toute nouvelle divergence rejoint `docs/CORRECTIONS_A_VALIDER.md` et la page d'arbitrage, sans interrompre le chantier.

### Étape 2.3 — Construire l’import et la validation — réalisée

- [#18 — Créer l’importeur CSV et le validateur](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/18)

Cette issue doit fournir la chaîne reproductible qui remplacera l’envoi d’un CSV à une IA pour réécrire le HTML.

Il est recommandé de terminer le validateur minimal avant les extractions par domaine. L’importeur peut ensuite être enrichi à mesure que de nouveaux formats officiels sont rencontrés.

Livré :

- `scripts/valider-referentiels.js`, `scripts/importer-referentiel.js`, `scripts/generer-referentiels.js` et leurs commandes `npm` ;
- `scripts/lib/csv.js`, `scripts/lib/importer.js`, `scripts/lib/referentiels.js` ;
- `data/imports/exemple-dmtg.csv` et `data/imports/exemple-invalide-taux-en-pourcentage.csv` ;
- `data/README.md`, procédure de mise à jour d'une valeur fiscale et format des CSV ;
- `tests/unit/importeur-referentiels.test.js`, dix-sept contrôles.

Deux garanties à connaître avant les extractions :

- **l'import est déterministe** — entrées triées par identifiant puis millésime, tranches par borne basse, variantes par clé. Réordonner un CSV ne produit aucun diff ;
- **une donnée invalide n'écrit rien.** Le référentiel publié n'est jamais laissé dans un état intermédiaire.

`npm run donnees:generer -- --verifier` échoue si `src/genere/referentiels.js` ne correspond plus à `data/` : c'est ce contrôle qui rend visible une modification manuelle d'un fichier généré. Il a vocation à rejoindre la CI de #28.

Reste hors périmètre, à traiter lors des extractions qui en auront besoin : les contrôles propres aux devises et aux jours de cotation, qui appartiennent à #13 et #1, et l'import d'un barème contesté, aujourd'hui explicitement refusé plutôt que deviné.

### Étape 2.4 — Extraire les référentiels par vagues

Vague A, parallélisable car les fichiers concernés sont distincts :

- [#14 — Référentiel IR, CEHR, CDHR, PFU et PS](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/14)
- [#16 — Référentiels DMTG, usufruit et assurance-vie](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/16)

Vague B, après fusion de la vague A :

- [#15 — Référentiel IFI partagé](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/15)
- [#17 — Référentiel de plus-value immobilière](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/17)

Ces deux issues peuvent être parallélisées si les agents ne modifient pas simultanément les mêmes helpers partagés.

Vague C, après stabilisation des interfaces IFI et PV immobilière :

- [#13 — Externaliser et unifier les taux de change](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/13)
  - [#1 — Gérer les week-ends et jours fériés](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/1)

Traiter d’abord le service de change commun de #13, puis sa sous-issue #1. Le service doit exister avant d’implémenter les règles de résolution des dates.

### Étape 2.5 — Ajouter la sélection de millésime

- [#19 — Sélectionner et afficher le millésime fiscal](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/19)

Cette issue vient après les référentiels : elle les relie aux dates de revenus, cession, décès, donation ou valorisation IFI.

### Étape 2.6 — Clore l’epic des référentiels

- [#2 — Externaliser les référentiels](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/2)

L’epic #2 n’est pas une branche de développement autonome. Il est clos uniquement lorsque #12 à #19 et la chaîne #13 → #1 sont terminées et documentées.

### Point de contrôle humain B

- Une modification annuelle passe par les données et non par le HTML.
- Le diff d’une mise à jour est lisible et validé automatiquement.
- Les sources, dates d’effet et révisions sont visibles.
- Les simulateurs fonctionnent avec un référentiel explicitement fourni.
- Le blob de changes n’est plus intégré au HTML de la PV immobilière.

## Phase 3 — Découpler les moteurs et les interfaces

Branche CLV du jalon : `clv/y-0.6-architecture`, créée depuis `clv/y-0.5-donnees`.

Epic parent :

- [#21 — Découpler les moteurs de calcul de l’interface](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/21)

L’epic ne reçoit pas de PR globale. Chaque sous-issue doit produire une PR indépendante.

### Vague 1 — Simulateurs aux dépendances les plus isolées

Ces trois sous-issues peuvent être parallélisées :

- [#23 — Cession de titres](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/23)
- [#26 — Succession](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/26)
- [#27 — Démembrement](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/27)

Condition : les interfaces des référentiels #14 et #16 sont figées avant le démarrage.

### Vague 2 — Simulateurs utilisant les changes

- [#24 — Plus-value immobilière](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/24)
- [#25 — IFI](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/25)

Ils peuvent être parallélisés seulement si le module de change de #13 est considéré comme stable. Sinon, traiter #24 puis #25 afin d’éviter deux modifications simultanées de ce module.

### Vague 3 — Simulateur intégrateur

- [#22 — IRPP complet](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/22)

Le simulateur IRPP passe en dernier car il combine IR, dons, plus-values et IFI. Il doit réutiliser les interfaces et moteurs stabilisés par les vagues précédentes plutôt que créer une nouvelle variante.

### Étape 3.3 bis — Unification visuelle, en pull requests distinctes

- [#31 — Unifier l’identité visuelle et les composants d’interface](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/31)

Une fois un simulateur découplé, son habillage peut être aligné sur la charte commune. Ce travail suit immédiatement le découplage, mais **jamais dans la même pull request** : `AGENTS.md` interdit de mélanger refactorisation et changement visuel, sinon plus personne ne sait ce qui a modifié un résultat.

Ne pas commencer avant que #20 ait fixé l’emplacement de la feuille de style commune, ni avant que le simulateur de référence et le niveau d’unification aient été choisis par le référent métier.

### Étape 3.4 — Clore l’epic de refactorisation

Clore #21 uniquement lorsque :

- les six moteurs s’exécutent sans DOM ;
- les interfaces utilisent des résultats structurés ;
- les cas validés de #9 passent ;
- aucune variable fiscale dérivée globale n’est nécessaire ;
- les fonctions partagées ne réintroduisent pas de dépendance entre régimes distincts.

## Phase transversale — Intégration continue

- [#28 — Ajouter l’outillage minimal et la CI](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/28)

Cette issue peut être traitée en plusieurs PR liées à la même issue :

1. après #10 : tests et contrôle de syntaxe obligatoires ;
2. après #18 : validation des référentiels ;
3. après #20 : build et vérification des livrables ;
4. après #21 : smoke tests desktop des six simulateurs.

Ne pas conserver une branche #28 ouverte pendant tout le projet. Pour CLV, chaque PR partielle repart de la dernière version de `clv/preprod` ; pour un autre contributeur, de la base indiquée ou de `main`. Chaque PR référence #28 avec `Part of #28`, et la dernière utilise `Closes #28`.

## Phase 4 — Qualité desktop, documentation et gouvernance

Branche CLV du jalon : `clv/y-0.7-qualite`, créée depuis `clv/y-0.6-architecture`.

- [#29 — Chantier P2 commun](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/29)

Le mobile et le responsive restent hors périmètre.

Ordre interne recommandé :

1. Documentation restante : `CODEMAP.md`, `CONTRIBUTING.md`, commandes et procédure détaillée de modification fiscale. Maintenir `AGENTS.md`, `CHANGELOG.md`, `VERSION` et le présent plan au fil des changements.
2. Gouvernance GitHub : protection de `main`, templates, branches courtes, squash merge et releases.
3. Sécurité du rendu : suppression des injections de données utilisateur dans `innerHTML`, dépendances contrôlées et absence de mot de passe client.
4. Accessibilité desktop : labels, clavier, focus des modales, annonces des résultats et contrastes.
5. Nettoyage final : styles et événements inline, exemples explicites, composants partagés et calculs inutiles. Ce que #31 n'a pas absorbé est traité ici ; le reliquat visuel de #31 est clos dans ce jalon.

Le socle documentaire commun a déjà été livré en phase 0. Les documents dépendant de l'architecture finale, notamment `CODEMAP.md`, seront complétés après #20. Le reste demeure une phase de finition.

## Matrice des conflits à éviter

Ne pas exécuter en parallèle deux tâches appartenant à la même ligne :

| Zone | Issues qui risquent de modifier les mêmes fichiers |
|---|---|
| IRPP | #4, #5, #7, #14, #15, #22 |
| IFI | #6, #7, #8, #13, #15, #25 |
| PV immobilière | #13, #17, #24 |
| Cession de titres | #7, #14, #23 |
| Succession | #8, #16, #26 |
| Démembrement | #8, #16, #27 |
| Outils partagés | #10, #11, #12, #18, #20, #28 |
| Interface et styles | #31 et toute issue modifiant le même simulateur (#22 à #27, #29) |

Deux issues de zones différentes peuvent avancer en parallèle si leurs dépendances sont fusionnées et si leurs agents ne changent pas les mêmes modules communs.

Pour une orchestration avec quatre agents, conserver idéalement :

- un agent intégrateur ou relecteur ;
- deux agents de domaine maximum ;
- un agent tests, données ou documentation.

## Définition de terminé pour une issue

Une issue est terminée lorsque :

- ses dépendances ont été fusionnées ;
- ses critères d’acceptation sont couverts ;
- les tests reproduisant le défaut ou la règle existent ;
- toutes les commandes locales et CI réussissent ;
- les sources fiscales et millésimes sont documentés si nécessaire ;
- aucune modification non liée n’est incluse ;
- la PR explique le comportement avant et après ;
- la validation humaine requise est obtenue ;
- une branche `Y` empilée est conservée tant que ses descendantes en dépendent ; elle n'est supprimée qu'après validation et intégration de toute la chaîne concernée ; `clv/preprod` reste permanente.

## Modèle de consigne à donner à un agent

```text
Tu travailles uniquement sur l’issue #N du dépôt ARBE-Avocat/Simulateurs-fiscaux.

1. Lis entièrement l’issue, ses dépendances et ses issues parentes.
2. Identifie le jalon mineur `Y` de l'issue et vérifie que ses dépendances existent dans la branche parente de la pile.
3. Pour CLV, travaille dans l'unique branche `clv/y-X.Y-<slug>` du jalon ; ne crée pas de branche par issue. Pour un autre contributeur, utilise la base indiquée ou `main`.
4. Commence par reproduire le comportement actuel avec un test.
5. Implémente uniquement le périmètre de l’issue.
6. N’invente ni taux, ni seuil, ni règle fiscale. Signale tout point non sourcé.
7. Exécute lint, tests, validation des données et build applicables.
8. Relis le diff pour retirer toute modification sans rapport.
9. Prépare une PR avec : résumé, avant/après, tests, sources et risques.
10. Utilise « Closes #N » si l’issue est entièrement terminée, sinon « Part of #N ».
11. Ne fusionne pas la branche `Y` dans `clv/preprod`. Signale les validations manquantes et n'enchaîne sur une autre issue que si elle appartient au jalon autorisé.
```

## Jalons de release suggérés

Chaque nouvelle version mineure `Y` reste soumise à une validation explicite de l'utilisateur. Les jalons après `0.3.0` sont donc indicatifs.

| Jalon | Branche CLV | Contenu minimal | Version indicative |
|---|---|---|---|
| Gouvernance initiale | `clv/preprod` | Phase 0, consignes, plan, changelog et préprod | `v0.3.0` — actuellement en beta |
| Fiabilité | `clv/y-0.4-fiabilite` | #10, #6, #8, #5 et #4, tests de base et validation métier suffisante | `v0.4.0` indicatif |
| Données | `clv/y-0.5-donnees` | #11 et #7, #2 terminé, #20 et CI données/build | `v0.5.0` indicatif |
| Architecture | `clv/y-0.6-architecture` | #21 terminé, six moteurs découplés et #31 engagé | `v0.6.0` indicatif |
| Qualité | `clv/y-0.7-qualite` | #28, #29 et #31 terminés | `v0.7.0` indicatif |

Chaque `beta.N` ou correctif stable `Z` possède son tag annoté immuable. Il n'existe toutefois qu'une seule GitHub Release par série `X.Y`.

Pendant les beta, cette release est une prerelease glissante : elle est rattachée au dernier tag beta et ses notes cumulent le changelog de toutes les beta du jalon. Une nouvelle beta met à jour cette prerelease ; elle n'en crée pas une autre.

Lors du merge dans `main`, toutes les sections beta sont fusionnées en une section stable `X.Y.Z` dans `CHANGELOG.md`. Un nouveau tag stable est créé et une release `Latest` reprend ce changelog consolidé. Après vérification, la prerelease glissante est supprimée sans supprimer les tags beta.

Pour chaque correctif stable `Z`, créer le tag puis rattacher la même release stable du `Y` au dernier tag et mettre ses notes à jour. Avant toute publication : contrôles applicables, validation des référentiels concernés, `VERSION` et `CHANGELOG.md` à jour.
