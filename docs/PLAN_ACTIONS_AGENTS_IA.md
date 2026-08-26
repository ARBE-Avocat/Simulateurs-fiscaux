# Plan d’action orchestré par agents IA

Ce document propose l’ordre de traitement des issues du dépôt `ARBE-Avocat/Simulateurs-fiscaux`. Il est destiné à un orchestrateur humain qui délègue chaque tâche à un ou plusieurs agents IA.

Dernière mise à jour du plan : 26 août 2026 — synchronisé avec `v0.4.0-beta.1`.

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
- Le jalon `Y = 0.4` est ouvert sur la branche `clv/y-0.4-fiabilite`, en préversion `0.4.0-beta.1`.
- L'étape 1.1 (#10, socle de tests) est réalisée sur cette branche et attend relecture ; elle n'est pas intégrée à `clv/preprod`.
- Les autres issues citées dans ce plan sont encore ouvertes au 26 août 2026.
- L'issue #29 reste ouverte : seule sa première partie documentaire et de gouvernance est amorcée.
- Prochaines étapes du jalon : #9 en fil rouge, puis les deux voies de correctifs #4/#5 et #6/#8.

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
Phase 0 Gouvernance ✓ ─> #10 Socle de tests ✓ (en relecture)
 ├─> #4 -> #5                  voie IRPP
 ├─> #6 -> #8                  voie IFI / valeurs par défaut
 └─> #11 -> #7                 bornes, unités et arrondis

#9 Cas fiscaux validés ───────────────┐
#11 Conventions ──────────────────────┼─> #12 Schéma des référentiels
#20 Architecture cible ───────────────┘       │
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

1. [#4 — Corriger la décote CDHR](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/4)
2. [#5 — Recalculer les dons lorsque le RNI change](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/5)

Voie IFI et saisies, à exécuter séquentiellement :

1. [#6 — Supprimer le contournement lié à la variable cyrillique](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/6)
2. [#8 — Distinguer la valeur zéro des champs vides](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/8)

Les deux voies peuvent être confiées à deux agents différents en parallèle. Les issues d’une même voie ne doivent pas être parallélisées car elles touchent les mêmes fichiers.

### Étape 1.4 — Fixer les conventions, puis les bornes

1. [#11 — Définir validation, unités et arrondis](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/11)
2. [#7 — Uniformiser et corriger les bornes des barèmes](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/7)

L’issue #7 ne doit commencer qu’après la décision de #11 sur la représentation des tranches et les arrondis. Elle doit aussi intégrer les correctifs déjà fusionnés dans les fichiers IRPP et IFI.

### Point de contrôle humain A

Avant de poursuivre :

- tous les bugs #4 à #8 ont un test de non-régression ;
- les formules sensibles ont été validées ou signalées comme encore incertaines ;
- les cas de référence #9 couvrent au minimum les parcours utilisés pour les prochaines migrations ;
- aucune divergence 17,2 % / 18,6 % n’est résolue par simple supposition de l’agent.

## Phase 2 — Définir l’architecture et externaliser les données

Branche CLV du jalon : `clv/y-0.5-donnees`, créée depuis la branche `Y = 0.4` validée techniquement mais pas nécessairement encore intégrée.

### Étape 2.1 — Décider de l’architecture cible

- [#20 — Définir l’architecture, les URL stables et les livrables](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/20)

Cette décision précède la création de `src/`, `data/`, `scripts/` et des fichiers générés. L’agent doit proposer une solution simple en JavaScript, sans imposer un framework applicatif.

Le choix « HTML autonomes ou site composé de plusieurs assets » doit être tranché ici.

### Étape 2.2 — Définir le contrat des données

Sous-issue de l’epic [#2](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/2) :

- [#12 — Définir le schéma et l’inventaire des référentiels](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/12)

Dépendances : #9, #11 et #20.

L’agent doit commencer par les exemples et le schéma, sans extraire immédiatement toutes les constantes.

### Étape 2.3 — Construire l’import et la validation

- [#18 — Créer l’importeur CSV et le validateur](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/18)

Cette issue doit fournir la chaîne reproductible qui remplacera l’envoi d’un CSV à une IA pour réécrire le HTML.

Il est recommandé de terminer le validateur minimal avant les extractions par domaine. L’importeur peut ensuite être enrichi à mesure que de nouveaux formats officiels sont rencontrés.

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
5. Nettoyage final : styles et événements inline, exemples explicites, composants partagés et calculs inutiles.

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
| Fiabilité | `clv/y-0.4-fiabilite` | #4 à #11, tests de base et validation métier suffisante | `v0.4.0` indicatif |
| Données | `clv/y-0.5-donnees` | #2 terminé, #20 et CI données/build | `v0.5.0` indicatif |
| Architecture | `clv/y-0.6-architecture` | #21 terminé et six moteurs découplés | `v0.6.0` indicatif |
| Qualité | `clv/y-0.7-qualite` | #28 et #29 terminés | `v0.7.0` indicatif |

Pour CLV, `clv/preprod` utilise `X.Y.Z-beta.N`. Un correctif en beta incrémente `N`, sauf demande contraire. Chaque beta publiée possède son tag annoté et sa GitHub Pre-release.

Pour une version stable, chaque `X.Y.Z` possède un tag annoté immuable. Une seule GitHub Release est conservée par série `X.Y` et rattachée au dernier tag `Z` lors de chaque correctif. Avant toute publication : contrôles applicables, validation des référentiels concernés, `VERSION` et `CHANGELOG.md` à jour.
