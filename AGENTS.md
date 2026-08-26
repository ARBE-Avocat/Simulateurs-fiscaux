# Consignes communes pour les agents IA

Ce fichier est la source de vérité commune pour Codex, Claude Code et tout autre agent travaillant sur ce dépôt. Le lire intégralement avant toute analyse, modification, revue ou création d'issue.

## 1. Contexte et responsabilités

Le dépôt contient des simulateurs fiscaux et patrimoniaux français à usage informatif. Il est codéveloppé par deux profils complémentaires :

- le propriétaire du dépôt est avocat, référent juridique et métier, et seul responsable de la fusion finale dans `main` ;
- le mainteneur technique est plus expérimenté en développement et responsable de la qualité et de l'évolutivité du dépôt, mais il ne valide pas seul une interprétation juridique.

Un choix technique ne vaut jamais validation juridique. Une intention métier ne dispense jamais des contrôles techniques.

État actuel : fichiers HTML statiques autonomes avec CSS, JavaScript et données principalement embarqués, sans installation ni serveur applicatif. Cette architecture évoluera progressivement ; ne pas la remplacer implicitement dans une autre tâche. Le site vise prioritairement l'ordinateur : le responsive mobile est hors périmètre sauf issue explicite.

## 2. Instructions et documents de référence

Appliquer dans cet ordre : demande explicite du responsable de la tâche, issue et décisions validées, présent fichier, documentation liée, puis conventions du code et des tests.

Une instruction locale non versionnée peut compléter ce socle, mais jamais autoriser l'invention d'une règle fiscale, affaiblir la sécurité ou contourner la validation du propriétaire.

- `README.md` : utilisation et simulateurs disponibles.
- `docs/PLAN_ACTIONS_AGENTS_IA.md` : ordre des chantiers et dépendances.
- `docs/CORRECTIONS_A_VALIDER.md` : corrections à effet fiscal en attente de validation du propriétaire. Toute correction modifiant un montant affiché y est ajoutée dans la même PR.
- `docs/INVENTAIRE_CONVENTIONS.md` : constat des conventions d'unités, de taux, d'arrondis et de bornes réellement employées. Document préparatoire à #11, sans valeur normative.
- `docs/arbitrages.html` : source de la page d'arbitrage soumise au référent juridique. Elle est publiée en artifact claude.ai, partagée nominativement, et **jamais servie par GitHub Pages ni liée depuis `index.html`** : c'est un outil de travail interne, pas un livrable du produit. La republier suppose de conserver la même adresse, sous peine de perdre les arbitrages déjà saisis.
- `AGENTS.md` : règles communes canoniques.
- `CLAUDE.md` : import de ces règles par Claude Code ; ne pas y recopier ce contenu.

Si un document annoncé n'existe pas encore, ne pas inventer son contenu.

## 3. Avant toute modification

1. Lire l'issue, ses critères, dépendances et éventuelles issues parentes.
2. Lire les instructions et la documentation applicables.
3. Vérifier la branche, l'état Git et les changements locaux à préserver.
4. Identifier les décisions juridiques encore nécessaires.
5. Identifier les commandes de vérification réellement disponibles.
6. Limiter le travail au plus petit périmètre cohérent.

Ne pas commencer une issue bloquée par une dépendance non intégrée, sauf demande explicite de préparation sans fusion.

## 4. Règles fiscales et validation métier

Ne jamais inventer, compléter de mémoire ou déduire silencieusement :

- taux, seuil, abattement, plafond ou barème ;
- date d'effet, millésime ou condition d'éligibilité ;
- exception, unité, méthode d'arrondi ou interprétation juridique.

Toute règle ou donnée fiscale ajoutée ou modifiée doit préciser selon le cas : source officielle, période d'application, date de consultation ou révision, exemples de test et validation du propriétaire si une interprétation est nécessaire.

Si deux valeurs ou sources divergent, ne pas arbitrer seul. Isoler le point, montrer les conséquences des options et demander une décision au propriétaire.

Une refactorisation conserve les résultats existants. Une modification volontaire du résultat est une évolution métier distincte, sourcée et testée.

## 5. Création des issues

Une issue doit être comprise par le propriétaire, un développeur et un agent IA. Commencer par le problème concret et le résultat attendu, pas par une technologie.

Structure recommandée :

1. contexte et problème ;
2. résultat attendu et bénéfice ;
3. `Questions métier / avis de l'avocat` ;
4. approche technique recommandée et vulgarisée ;
5. périmètre inclus et exclusions ;
6. critères d'acceptation et vérifications ;
7. dépendances, risques et sources.

La section métier doit être proche du début. Poser des questions précises, fournir options, exemples et sources, et expliquer ce que la réponse débloque. Appliquer le label de validation métier prévu s'il existe. Si aucun avis n'est attendu, écrire explicitement `Aucune validation métier requise`.

Pour une question technique, partir du problème observable, expliquer simplement pourquoi l'action est utile, présenter le bénéfice et le risque raisonnable du statu quo, puis donner une recommandation claire avec ses compromis. Ne pas laisser au propriétaire une liste d'options techniques sans conclusion.

## 6. Accompagnement des contributeurs

Le code doit rester compréhensible par un développeur débutant sans réduire les standards de qualité.

Face à un usage fragile de Git, du code ou d'un outil IA :

- reconnaître le besoin légitime ;
- expliquer le risque par une conséquence concrète ;
- proposer immédiatement une alternative sûre et simple ;
- valoriser les gains : moins d'erreurs, moins de répétition, revue et évolutions facilitées ;
- fournir au besoin un modèle, une commande, un exemple ou une checklist réutilisable ;
- automatiser les garde-fous simples et répétitifs ;
- rester respectueux et ne jamais infantiliser.

Préférer l'orientation à l'interdiction sèche. Si une action menace `main`, l'historique, les données, la sécurité ou la fiabilité fiscale, la bloquer fermement tout en expliquant le risque et le chemin sûr.

## 7. Code et architecture

- Préserver l'intention métier avant de réorganiser l'implémentation.
- Préférer fonctions courtes, noms explicites et flux lisibles aux abstractions prématurées.
- Ne pas ajouter de framework ou dépendance de production sans issue et justification.
- Préserver les HTML autonomes tant que l'architecture cible n'est pas validée.
- Ne pas mélanger correction métier, refactorisation générale et évolution visuelle.
- Éviter les reformattages, renommages ou nettoyages massifs hors périmètre.
- Ne jamais injecter de donnée utilisateur non échappée dans `innerHTML`.
- Préserver les liens relatifs vers `index.html` et vérifier tout renommage depuis l'accueil.
- Ne pas éditer manuellement un fichier déclaré comme généré : modifier sa source et relancer la génération documentée.
- Extraire progressivement les calculs en fonctions pures et testables lorsque l'issue l'autorise.
- Rendre les unités explicites lorsque leur confusion est possible.

Une mise à jour annuelle doit à terme modifier une donnée fiscale dans une source unique, validée et traçable, et non réécrire plusieurs blocs HTML.

## 8. Tests et vérifications

Une correction commence, dès que le socle le permet, par un test reproduisant le défaut. Une refactorisation doit prouver la conservation du comportement.

Le dépôt initial ne garantit encore aucune commande automatisée de test ou build. Ne jamais prétendre avoir exécuté un contrôle inexistant. Utiliser les commandes documentées dès leur introduction.

Contrôle manuel minimal actuel :

```bash
python3 -m http.server 8000
```

Sur ordinateur, vérifier `http://localhost:8000/index.html`, les liens, les parcours concernés, la console et les cas limites pertinents. Vérifier aussi l'ouverture directe des HTML si leur autonomie est concernée.

Chaque compte rendu indique les commandes et contrôles réellement exécutés, leurs résultats et les zones non vérifiées.

## 9. Git et pull requests

- Ne jamais développer directement dans `main` ; seul le propriétaire y fusionne les PR.
- Un agent ne fusionne jamais sa propre PR.
- Pour les contributeurs autres que CLV, une issue correspond normalement à une branche courte et une PR cohérente.
- Pour CLV, une branche regroupe toutes les issues d'une version mineure `Y` du plan. Ces branches utilisent `clv/y-X.Y-<slug>` et sont empilées dans l'ordre des jalons.
- `clv/preprod` est la branche permanente des travaux déjà validés de CLV. Aucun développement majeur directement dessus ; seulement de petits commits d'entretien explicitement demandés.
- Sans les validations métier requises, ne jamais fusionner une branche `Y` dans `clv/preprod`. Créer la branche `Y` suivante depuis la précédente afin de conserver la pile.
- Les autres contributeurs utilisent la base indiquée par le responsable ou, à défaut, `main` à jour.
- Ne pas forcer un push, réécrire l'historique partagé ou supprimer une branche distante. Les tags et releases suivent exclusivement les règles de versionnement ci-dessous.
- Préserver tous les changements locaux hors périmètre.

Utiliser `Closes #N` si la PR termine réellement l'issue et `Part of #N` pour une étape partielle, une sous-issue d'epic ou un travail encore empilé hors de `main`.

Les commits sont petits et cohérents. Une PR fournit : résumé non technique, issue et périmètre, comportement avant/après, choix techniques vulgarisés, validations métier attendues, sources et millésimes, tests exécutés, limites et risques, et capture si l'interface change visiblement.

Scinder une PR trop large. L'exception CLV « une branche par `Y` » conserve un commit ou groupe de commits cohérent par issue et une checklist de validation, afin que le regroupement reste relisible.

## 10. Documentation

Mettre la documentation à jour dans la même PR qu'un changement de comportement, de workflow ou d'architecture.

- `README.md` reste centré sur l'utilisation.
- Le futur `CODEMAP.md` localisera données, moteurs, interfaces et scripts.
- `CHANGELOG.md` décrit les changements visibles par version et la prochaine version en préparation.
- `VERSION` contient la version exacte portée par la branche, sans préfixe `v`.
- Le futur `CONTRIBUTING.md` détaillera le workflow humain.
- Les règles durables des agents restent dans `AGENTS.md`.

## 11. Versionnement, préversions et releases

Le projet utilise des versions `X.Y.Z` avec les règles d'autorisation suivantes :

- `X`, version majeure : rupture importante de compatibilité ou de fonctionnement. Ne jamais l'incrémenter ni l'anticiper sans demande explicite de l'utilisateur.
- `Y`, version mineure : nouvelle fonctionnalité, refactorisation significative ou évolution compatible. Après validation explicite de l'utilisateur, réaliser le travail sur une branche dédiée ; le bump, le tag et la release restent soumis à cette validation.
- `Z`, correctif stable : correction compatible, petit entretien, documentation ou maintenance de données sans nouveau parcours. Hors préversion, l'agent peut décider et effectuer ce bump en autonomie dans le cadre d'une tâche autorisée, avec les contrôles et validations métier requis.

### Changements sans incidence visible

Faire évoluer la méthode de conception d'un projet n'est pas faire évoluer le projet. Modifier la façon dont on travaille, dont on décide ou dont on prépare une décision ne change rien pour qui utilise les simulateurs, et n'a donc pas à laisser de trace versionnée.

Ces changements ne reçoivent **ni bump `Z`, ni bump `beta.N`, ni tag, ni entrée de changelog**. Ils sont simplement committés et poussés, et se retrouvent inclus dans la préversion ou le correctif suivant. L'historique Git suffit à les retracer.

La version suit le **produit** et ce que le dépôt **garantit**. Elle ne suit ni les outils de travail, ni la documentation de pilotage, ni les supports préparant une décision.

Relèvent du cas sans bump :

- les consignes destinées aux agents : `AGENTS.md`, `CLAUDE.md`, instructions locales ;
- le pilotage interne : `docs/PLAN_ACTIONS_AGENTS_IA.md`, mise à jour d'état, d'ordre ou de jalon ;
- les supports de travail servant à préparer une décision, y compris lorsqu'ils sont destinés au propriétaire ou au référent juridique : `docs/CORRECTIONS_A_VALIDER.md`, `docs/INVENTAIRE_CONVENTIONS.md`, `docs/arbitrages.html` et la page publiée correspondante ;
- les corrections de forme sans changement de fond : orthographe, reformulation, mise en page ;
- les commentaires de code et les renommages internes sans effet sur le comportement ;
- les fichiers de travail non livrés.

Reçoivent au contraire un bump :

- tout changement de comportement d'un simulateur, fût-il d'un centime ;
- toute donnée fiscale : taux, seuil, abattement, barème ou millésime ;
- l'outillage qui change ce que le dépôt garantit : tests, contrôles automatiques, build, intégration continue ;
- `README.md` et la documentation d'usage du produit ;
- toute modification d'un livrable publié.

En cas de doute, la question n'est pas « quelqu'un verra-t-il la différence ? » mais : « **le produit du dépôt, ou ce qu'il garantit, a-t-il changé ?** ». Un support de travail peut évoluer dix fois dans la journée sans qu'aucune version ne bouge.

Un commit sans bump reste un commit normal : message clair, périmètre limité, poussé sur la branche du jalon. Cette règle ne vaut que pour les changements à venir ; un tag déjà publié n'est jamais renuméroté ni supprimé.

Un changement de taux reste soumis à la validation juridique même s'il n'incrémente que `Z`. L'autonomie de versionnement ne donne aucune autonomie d'interprétation fiscale. Chaque bump met à jour `VERSION` et `CHANGELOG.md` dans le même commit ; les tags ajoutent le préfixe `v` à la valeur de `VERSION`.

### Tags et release unique par `Y`

- Chaque beta et chaque version stable `X.Y.Z` reçoit son propre tag annoté et immuable. Ne jamais réutiliser, déplacer ou écraser un tag publié.
- Un nouveau tag `Z` ou `beta.N` ne crée pas une nouvelle GitHub Release : une seule release est conservée pour chaque série mineure `X.Y`.
- Pendant les beta, créer une unique GitHub Pre-release glissante pour la série. À chaque beta, rattacher cette même prerelease au nouveau tag et mettre ses notes cumulées à jour avec le changelog de toutes les beta du `Y`.
- Lors du merge dans `main`, fusionner les sections beta de `CHANGELOG.md` en une seule section stable `X.Y.Z`, créer le nouveau tag stable, puis créer la release stable marquée `Latest` avec ce changelog consolidé.
- **La consolidation est un tri, pas une concaténation.** Le changelog stable ne retient que ce qui a changé pour l'utilisateur des simulateurs. Sont écartées les entrées ne décrivant que la méthode de conception ou un support de travail : règles de branches, de versions ou de releases, mises à jour du plan d'action, documents préparant une décision, page d'arbitrage. Certaines préversions n'y laisseront donc aucune trace, ce qui est normal.
- Une nuance : une entrée `Connu` qui décrit une limitation ou un défaut du **produit** est conservée, même si elle a été introduite en même temps qu'un support de travail. Ce qui compte est ce que l'entrée décrit, non ce qui l'a motivée.
- Après vérification de la release stable, supprimer la prerelease glissante sans supprimer ses tags beta. Il ne reste ainsi qu'une release pour le `Y`.
- Après stabilisation, chaque correctif `Z` crée un nouveau tag, puis rattache la même release stable au dernier tag et enrichit son changelog. Ne jamais créer une release supplémentaire pour un `Z`.
- Le titre identifie la série, par exemple `v0.4 — Fiabilité`, et le corps indique toujours le dernier tag disponible.
- Avant tout tag : contrôles pertinents, validation des référentiels concernés, `VERSION` et `CHANGELOG.md` à jour.

L'agent peut préparer et committer un bump `Z` sans nouvelle autorisation. Il ne doit jamais contourner la règle selon laquelle seul le propriétaire fusionne dans `main`. Le tag stable et la mise à jour distante de la release interviennent seulement après cette fusion.

### Préversions de CLV

- `clv/preprod` reflète la dernière préversion validée, jamais une version stable.
- Chaque branche `Y` empilée porte la préversion de sa propre cible, même avant son intégration dans `clv/preprod`.
- Utiliser le format `X.Y.Z-beta.N`, par exemple `0.3.0-beta.1`.
- `X.Y.Z` est exactement la version stable visée ultérieurement dans `main` ; la promotion retire seulement le suffixe `-beta.N`.
- Tant que la version est en beta, un correctif incrémente `N` et conserve `X.Y.Z`, sauf demande explicite de l'utilisateur visant une autre version stable.
- Incrémenter aussi `N` pour chaque autre état cohérent de préprod identifié comme nouvelle préversion. Ne jamais réutiliser un numéro de beta déjà publié.
- Les tags `vX.Y.Z-beta.N` sont des tags de préversion et ne remplacent pas le tag stable `vX.Y.Z`.
- Chaque beta publiée reçoit son propre tag, mais toutes les beta d'un même `Y` partagent une seule GitHub Pre-release glissante.
- Ne jamais créer ou mettre à jour la release stable de la série depuis `clv/preprod`.

Si le propriétaire fusionne entre-temps une autre PR propre dans `main`, synchroniser d'abord `main` et les tags, identifier la dernière version stable réellement publiée, puis recalculer la cible de préversion. Continuer la numérotation disponible sans écraser un tag et reporter proprement les entrées `Non publié` du changelog.

## 12. Revue et définition de terminé

En revue, rechercher en priorité : règle non sourcée, mauvais millésime, confusion vide/zéro, bornes ou arrondis incohérents, dépendance au DOM ou à une globale, lien cassé, injection HTML, absence de test ou validation métier et changements hors périmètre.

Classer les retours en `Bloquant` ou `Amélioration facultative`. Pour chaque blocage, expliquer le risque et proposer une correction.

Une tâche est terminée seulement si :

- périmètre et critères d'acceptation respectés ;
- dépendances disponibles ;
- règles fiscales sourcées et validations humaines obtenues ;
- tests et contrôles réussis, ou limites documentées ;
- diff sans changement accidentel ;
- documentation utile mise à jour ;
- branche, commits et PR conformes ;
- explication suffisante pour que le propriétaire décide de la fusion.

Sinon, indiquer clairement ce qui reste à faire. Le code écrit ne suffit pas à déclarer une tâche terminée.
