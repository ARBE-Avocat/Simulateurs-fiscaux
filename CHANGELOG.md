# Changelog

Ce fichier recense les changements notables du projet. Les entrées sont regroupées par version stable ; le travail en cours reste dans `Non publié` jusqu'à sa promotion.

Le projet suit les règles de versionnement décrites dans `AGENTS.md`. Chaque beta et chaque version stable possèdent leur tag. Une unique GitHub Release récapitule chaque série mineure `X.Y` et pointe toujours vers son dernier tag publié.

## [Non publié]

## [0.4.0-beta.8] - 2026-08-26

### Ajouté

- `docs/CORRECTIONS_A_VALIDER.md` : recensement vulgarisé des corrections ayant un effet fiscal, destiné à la validation par le référent juridique. Chaque fiche indique le comportement constaté, l'écart en euros et la question posée.

## [0.4.0-beta.7] - 2026-08-26

### Ajouté

- Calcul de la CDHR du simulateur IRPP isolé du formulaire dans une fonction testable sans navigateur, avec ses tests de part brute, d'abattements et de bornes (issue #4).

### Connu

- La décote CDHR du simulateur IRPP reste toujours nulle : la condition qui la déclenche est inatteignable. La correction est suspendue à la validation de la formule et de l'intervalle par le référent fiscal, demandée sur l'issue #4. Le dépôt contient deux implémentations divergentes, avec un écart pouvant dépasser 45 000 €. Le défaut est enregistré dans la suite de tests, en attente, et signalé dans le code.

## [0.4.0-beta.6] - 2026-08-26

### Corrigé

- Simulateur IRPP : la réduction pour dons est recalculée dès que le revenu change (issue #5). Elle restait auparavant figée sur le revenu d'une saisie précédente tant qu'un champ de dons n'était pas modifié, ce qui pouvait afficher une réduction très supérieure à celle réellement applicable, et donc un impôt final trop faible.
- Suppression d'un calcul mort qui appliquait un plafond de 1 000 € codé en dur, sans tenir compte de l'option à 2 000 €.

### Ajouté

- Fonction de calcul des dons isolée du formulaire et de l'affichage, testable sans navigateur.
- Tests couvrant un don sous le plafond, au plafond et au-dessus, les deux valeurs du plafond à 75 %, et l'indépendance du résultat vis-à-vis de l'ordre de saisie.
- Scénarios de non-régression des réductions pour dons du simulateur IRPP.

## [0.4.0-beta.5] - 2026-08-26

### Corrigé

- Une valeur zéro saisie volontairement n'est plus remplacée par une valeur par défaut (issue #8). Une quote-part IFI de 0 % reste 0 % au lieu de devenir 100 %, des frais funéraires à 0 € restent 0 € au lieu de repasser à 1 500 €, et les paramètres de barème du simulateur de démembrement acceptent enfin la valeur 0.
- Les valeurs relues depuis un scénario de succession enregistré conservent également le zéro.

### Ajouté

- Helper `nombreSaisi`, qui distingue explicitement un champ vide, une saisie illisible et un zéro réellement saisi, dans les simulateurs IFI, Succession et Démembrement.
- Scénarios de non-régression des simulateurs Succession et Démembrement.
- Tests couvrant le champ vide, le zéro, la valeur négative, le texte invalide et la valeur positive.

### Connu

- L'âge et le nombre de donataires du simulateur de démembrement refusent toujours la valeur zéro et retombent silencieusement sur leur valeur par défaut. Ce comportement est conservé et documenté ; la validation explicite attendue reste à définir avec l'issue #11.

## [0.4.0-beta.4] - 2026-08-26

### Corrigé

- Simulateur IFI : suppression du contournement lié à un nom de variable contenant des caractères cyrilliques (issue #6). Le calcul ne dépend plus d'une variable globale, `compute` n'est plus redéfini après sa déclaration et le code mort associé est retiré. Aucun montant n'est modifié.

### Ajouté

- Contrôle automatique interdisant les noms qui mélangent alphabet latin et alphabet cyrillique ou grec, appliqué aux six simulateurs.
- Scénarios de non-régression du simulateur IFI : patrimoine, déductions, décote, dons, plafonnement, initialisation de la page et recalcul après modification d'un bien.
- Faux DOM capable de rejouer un événement, afin de tester l'initialisation d'une page.

## [0.4.0-beta.3] - 2026-08-26

### Modifié

- Arbitrage acté : les fichiers HTML n'ont pas vocation à être utilisés seuls ni à rester autonomes. Le point correspondant de l'issue #20 est tranché et documenté dans le plan d'action.
- Plan d'action complété avec l'issue #31 (unification de l'identité visuelle et des composants d'interface), ses dépendances, sa place dans les jalons et la matrice des conflits.

## [0.4.0-beta.2] - 2026-08-26

### Corrigé

- Une série mineure `Y` utilise désormais une seule release glissante, mise à jour à chaque tag `beta.N` ou `Z`, au lieu d'une release par beta.
- Le workflow de stabilisation consolide les changelogs beta dans la release `Latest` créée lors du merge dans `main`.

## [0.4.0-beta.1] - 2026-08-26

### Ajouté

- Socle de tests automatisés exécutable avec `npm test`, sans dépendance ni installation, à partir du lanceur intégré à Node.js (issue #10).
- Chargeur de simulateur et faux DOM minimal permettant de tester les fonctions de calcul hors navigateur, sans modifier les fichiers HTML autonomes.
- Tests de fumée pour les six simulateurs et vérification des liens relatifs de la page d'accueil.
- Premiers tests du moteur de l'impôt sur le revenu (barème, quotient familial, CEHR) et fixture correspondante.
- Documentation des tests dans `tests/README.md` et dans le `README.md`.

## [0.3.0-beta.4] - 2026-08-26

### Modifié

- Adoption pour CLV d'une branche empilée par version mineure `Y`, regroupant les issues du jalon.
- Conservation des branches hors de `clv/preprod` jusqu'à obtention des validations métier nécessaires.
- Mise à jour du plan, du modèle de consigne et des jalons avec les branches `clv/y-X.Y-<slug>`.

## [0.3.0-beta.3] - 2026-08-26

### Modifié

- Synchronisation du plan d'action avec la gouvernance, le workflow `clv/preprod`, les préversions et les jalons réellement en vigueur.
- Ajout d'une phase 0 terminée et correction du modèle de consigne destiné aux agents.

## [0.3.0-beta.2] - 2026-08-26

### Modifié

- En préversion, un correctif incrémente désormais le numéro `beta.N` plutôt que le correctif stable `Z`, sauf demande explicite contraire.

## [0.3.0-beta.1] - 2026-08-26

### Ajouté

- Plan d'action ordonné pour l'orchestration des chantiers par agents IA.
- Instructions communes aux agents IA dans `AGENTS.md` et point d'entrée dédié à Claude Code dans `CLAUDE.md`.
- Conventions de branches `clv/*`, branche d'intégration `clv/preprod` et règles de préversion `X.Y.Z-beta.N`.
- Fichier `VERSION` servant de source explicite pour la version portée par une branche.

### Modifié

- Formalisation des responsabilités respectives du référent juridique et du mainteneur technique.
- Formalisation du workflow des issues, pull requests, validations métier, versions, tags et releases.

## [0.2.0] - 2026-08-26

### Ajouté

- Page d'accueil `index.html` listant les six simulateurs.
- Bouton « Accueil » dans chaque simulateur.
- `README.md` présentant le projet, les simulateurs et leur utilisation locale.

## [0.1.0] - 2026-08-26

### Ajouté

- Première version regroupant six simulateurs HTML autonomes : IR et CEHR/CDHR, plus-value immobilière, IFI, IRPP, succession et démembrement immobilier.

[Non publié]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.4.0-beta.8...HEAD
[0.4.0-beta.8]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.4.0-beta.7...v0.4.0-beta.8
[0.4.0-beta.7]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.4.0-beta.6...v0.4.0-beta.7
[0.4.0-beta.6]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.4.0-beta.5...v0.4.0-beta.6
[0.4.0-beta.5]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.4.0-beta.4...v0.4.0-beta.5
[0.4.0-beta.4]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.4.0-beta.3...v0.4.0-beta.4
[0.4.0-beta.3]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.4.0-beta.2...v0.4.0-beta.3
[0.4.0-beta.2]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.4.0-beta.1...v0.4.0-beta.2
[0.4.0-beta.1]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.3.0-beta.4...v0.4.0-beta.1
[0.3.0-beta.4]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.3.0-beta.3...v0.3.0-beta.4
[0.3.0-beta.3]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.3.0-beta.2...v0.3.0-beta.3
[0.3.0-beta.2]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.3.0-beta.1...v0.3.0-beta.2
[0.3.0-beta.1]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.2.0...v0.3.0-beta.1
[0.2.0]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/releases/tag/v0.1.0
