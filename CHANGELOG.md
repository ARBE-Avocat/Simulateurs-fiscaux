# Changelog

Ce fichier recense les changements notables du projet. Les entrées sont regroupées par version stable ; le travail en cours reste dans `Non publié` jusqu'à sa promotion.

Le projet suit les règles de versionnement décrites dans `AGENTS.md`. Chaque beta et chaque version stable possèdent leur tag. Une unique GitHub Release récapitule chaque série mineure `X.Y` et pointe toujours vers son dernier tag publié.

## [Non publié]

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

[Non publié]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.4.0-beta.3...HEAD
[0.4.0-beta.3]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.4.0-beta.2...v0.4.0-beta.3
[0.4.0-beta.2]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.4.0-beta.1...v0.4.0-beta.2
[0.4.0-beta.1]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.3.0-beta.4...v0.4.0-beta.1
[0.3.0-beta.4]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.3.0-beta.3...v0.3.0-beta.4
[0.3.0-beta.3]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.3.0-beta.2...v0.3.0-beta.3
[0.3.0-beta.2]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.3.0-beta.1...v0.3.0-beta.2
[0.3.0-beta.1]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.2.0...v0.3.0-beta.1
[0.2.0]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/releases/tag/v0.1.0
