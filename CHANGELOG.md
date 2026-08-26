# Changelog

Ce fichier recense les changements notables du projet. Les entrées sont regroupées par version stable ; le travail en cours reste dans `Non publié` jusqu'à sa promotion.

Le projet suit les règles de versionnement décrites dans `AGENTS.md`. Chaque beta et chaque version stable possèdent leur tag. Une unique GitHub Release récapitule chaque série mineure `X.Y` et pointe toujours vers son dernier tag publié.

## [Non publié]

## [0.5.0-beta.6] - 2026-08-26

### Modifié

- Le taux d'imposition, les abattements pour durée de détention, les forfaits de frais et de travaux et les onze paliers de la surtaxe du simulateur de plus-value immobilière vivent désormais dans `data/referentiels/pv-immobiliere.json`. **Aucun montant affiché ne change** : les abattements sont vérifiés année par année de 0 à 40 ans, la surtaxe de part et d'autre de chacun de ses paliers, et dix scénarios complets donnent exactement les mêmes montants et pourcentages à l'écran.
- Les onze paliers de la surtaxe, jusqu'ici écrits en onze conditions successives, sont décrits par une table de données parcourue par une seule boucle. Des contrôles vérifient que les plafonds croissent et que l'impôt reste continu d'un palier à l'autre.
- Le simulateur désigne explicitement la variante de taux de prélèvements sociaux qu'il applique, comme les deux autres simulateurs concernés.

### Ajouté

- L'import de données accepte un nouveau type de règle, pour celles qui ne sont ni un nombre ni un barème par tranches.

## [0.5.0-beta.5] - 2026-08-26

### Modifié

- Le barème, le seuil, la décote, l'abattement sur la résidence principale, les exonérations de biens ruraux, le plafonnement et la réduction pour dons de l'IFI vivent désormais dans `data/referentiels/ifi.json`. Le simulateur IFI et la section IFI du simulateur IRPP les lisent au même endroit : le barème était jusqu'ici écrit deux fois, sous deux formes différentes, sans rien pour garantir qu'ils restent identiques. **Aucun montant affiché ne change** : vingt-cinq scénarios relevés avant l'extraction donnent les mêmes résultats après, détail par tranche compris.

### Connu

- Les deux pages qui calculent l'IFI continuent de le calculer différemment, et un même patrimoine y donne toujours deux impôts. Cette divergence, décrite en fiche 2.4 de `docs/CORRECTIONS_A_VALIDER.md`, n'est pas corrigée : elle porte sur la méthode de liquidation, non sur une valeur, et relève d'une décision du référent fiscal. Un contrôle automatique la fige désormais, écart de 668,39 € compris, pour qu'elle ne disparaisse pas par inadvertance avant d'avoir été tranchée.

## [0.5.0-beta.4] - 2026-08-26

### Modifié

- Les barèmes et taux des simulateurs « IR, CEHR et CDHR » et IRPP ne sont plus inscrits dans les fichiers HTML : barème progressif, abattements sur salaires et pensions, décote, CEHR, CDHR, prélèvement forfaitaire unique et crédit pour frais de garde vivent dans `data/referentiels/ir.json`. **Aucun montant affiché ne change** : trente-sept scénarios relevés avant l'extraction, couvrant chaque tranche des barèmes, le quotient familial, le lissage de la CEHR, les plus-values mobilières et les revenus au forfait, donnent exactement les mêmes résultats après.
- Le taux de 17,2 % de prélèvements sociaux, qui figurait à seize endroits du simulateur IRPP, n'y figure plus qu'une fois, sous forme de lecture d'une donnée.

### Ajouté

- La divergence sur le taux des prélèvements sociaux est désormais **représentée dans les données sans être tranchée** : la règle n'a aucune valeur unique, et chaque simulateur désigne explicitement, dans son code, celle des deux valeurs qu'il applique aujourd'hui. Le jour où le référent fiscal tranchera, la correction sera une modification de données et non de code. Des contrôles automatiques vérifient que les deux simulateurs continuent de déclarer ce qu'ils font réellement.
- Des contrôles automatiques interdisent aux valeurs pré-remplies du formulaire de l'IRPP — bornes du barème, plafonds d'abattement, paramètres de décote — de diverger des données.

## [0.5.0-beta.3] - 2026-08-26

### Modifié

- Les barèmes, abattements et taux des simulateurs Succession et Démembrement ne sont plus inscrits dans les fichiers HTML : ils vivent dans `data/referentiels/dmtg.json`, où chaque valeur porte sa source lorsqu'elle est connue, sa date d'effet et son statut de validation. **Aucun montant affiché ne change** : quarante-deux scénarios relevés avant l'extraction, couvrant les neuf liens de parenté, chaque tranche des barèmes, les donations antérieures et l'assurance-vie, donnent exactement les mêmes résultats après.
- Le barème en ligne directe et les abattements existaient en deux exemplaires, figés dans la succession et modifiables dans le démembrement, sans rien pour garantir qu'ils restent identiques. Il n'y en a plus qu'un.
- Le bouton « rétablir les valeurs par défaut » du simulateur de démembrement rétablit désormais le barème du référentiel, et non des chiffres recopiés dans le code : après une mise à jour des données, il rétablit bien le barème à jour.
- Les deux simulateurs concernés chargent maintenant deux fichiers voisins et ne sont donc plus distribuables isolément, conformément à l'architecture arrêtée.

### Ajouté

- Un contrôle automatique interdit aux valeurs pré-remplies affichées dans le formulaire du démembrement de diverger des données. Sans lui, une mise à jour ferait afficher l'ancien barème tout en calculant avec le nouveau.

## [0.5.0-beta.2] - 2026-08-26

### Ajouté

- Chaîne reproductible de mise à jour des données fiscales. Trois commandes sans installation : `npm run donnees:valider` vérifie la cohérence des référentiels, `npm run donnees:importer` normalise un CSV officiel vers le format commun, `npm run donnees:generer` reconstruit le fichier que liront les simulateurs. Une mise à jour annuelle devient la modification d'une ligne de données relue en pull request, au lieu d'une réécriture de blocs HTML.
- L'import est déterministe : le même CSV produit toujours le même fichier, même si ses lignes ont été réordonnées. Une donnée invalide fait échouer la commande **sans rien écrire**, de sorte qu'un référentiel n'est jamais laissé dans un état intermédiaire.
- Un CSV d'exemple complet et un CSV volontairement fautif, tous deux vérifiés par les tests. `data/README.md` décrit la procédure de mise à jour d'une valeur fiscale et le format accepté.

### Modifié

- `README.md` signale que l'autonomie des fichiers HTML n'est plus une propriété garantie du produit : l'architecture cible prévoit des ressources partagées et un mode de consultation par serveur HTTP.

## [0.5.0-beta.1] - 2026-08-26

### Ajouté

- Schéma commun des référentiels fiscaux et son contrôle automatique. Toute valeur extraite du code devra désormais porter sa source, sa date d'effet et son statut de validation. Le schéma sait représenter un désaccord entre deux simulateurs sans en choisir un : une règle contestée n'a pas de valeur unique, seulement des variantes rattachées aux simulateurs qui les emploient, et la question posée au référent fiscal.
- Dix-neuf contrôles automatiques du schéma, dont quinze exemples de référentiels invalides : un fichier qui redeviendrait acceptable fait échouer les tests.

### Connu

- Deux nouvelles divergences entre simulateurs, relevées pendant l'inventaire des valeurs fiscales et **non corrigées** faute de décision du référent fiscal. Le plafonnement de l'avantage procuré par les demi-parts supplémentaires est appliqué par le simulateur « IR, CEHR et CDHR » et absent du simulateur IRPP : jusqu'à 19 985,10 € d'écart d'impôt pour un célibataire avec trois enfants et 200 000 € de revenu. L'IFI, calculé à deux endroits, l'est selon deux méthodes différentes : 668,39 € d'écart sur un patrimoine de 1 450 000 € grevé de 100 000 € de passif. Les deux points sont décrits dans `docs/CORRECTIONS_A_VALIDER.md`.

## [0.4.0-beta.15] - 2026-08-26

### Modifié

- Page d'arbitrage : une fiche déjà tranchée se réduit à son titre, avec un repère vert et la décision retenue. Elle reste consultable d'un clic. Le repli intervient au rechargement, pas au moment de la réponse, afin de ne pas refermer une fiche pendant qu'on y écrit une précision.

## [0.4.0-beta.14] - 2026-08-26

### Corrigé

- Page d'arbitrage : la capacité de téléchargement est retirée, car elle interdisait le partage par lien. La synthèse reste récupérable par le bouton de copie.
- Les réponses d'un lecteur invité, qui n'a pas le droit de republier la page, sont conservées dans son navigateur et ne sont plus perdues au rechargement. La barre lui propose de copier ses réponses au lieu d'un bouton d'enregistrement inopérant.

## [0.4.0-beta.13] - 2026-08-26

### Modifié

- Le dossier d'arbitrage est diffusé uniquement par partage nominatif, jamais servi par GitHub Pages ni lié depuis la page d'accueil. Convention inscrite dans `AGENTS.md`.

## [0.4.0-beta.12] - 2026-08-26

### Modifié

- Page d'arbitrage : suppression du bloc d'introduction. Le titre est porté par le bandeau, et les explications utiles restent en tête de chaque groupe de points.

## [0.4.0-beta.11] - 2026-08-26

### Ajouté

- `docs/arbitrages.html` : source versionné de la page d'arbitrage, jusque-là présent uniquement en ligne.

### Modifié

- La page d'arbitrage n'annonce plus un nombre de points figé : son contenu est destiné à évoluer au fil des corrections soumises à validation.

## [0.4.0-beta.10] - 2026-08-26

### Ajouté

- Version interactive du dossier de validation, permettant au référent juridique de répondre point par point, d'enregistrer ses arbitrages et de les exporter. Lien inscrit dans `docs/CORRECTIONS_A_VALIDER.md`, qui reste la version de référence versionnée.

## [0.4.0-beta.9] - 2026-08-26

### Ajouté

- `docs/INVENTAIRE_CONVENTIONS.md` : constat chiffré des conventions d'unités, de taux, d'arrondis, de bornes et de lecture des saisies employées par les six simulateurs. Document préparatoire à l'issue #11, sans valeur normative.

### Modifié

- Les issues #11 et #7 quittent le jalon `0.4` pour le jalon `0.5`, où #11 rejoint sa dépendance #12. Le jalon `0.4` n'attend plus qu'un seul arbitrage, celui de la décote CDHR de l'issue #4.

### Connu

- Deux simulateurs ne produisent pas le même impôt pour un même revenu : les conventions de bornes de l'IRPP et de l'IFI perdent un euro d'assiette à chaque seuil, pour un écart cumulé atteignant 1,27 €. Documenté et chiffré, correction reportée sur #7.

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

[Non publié]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.4.0-beta.15...HEAD
[0.4.0-beta.15]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.4.0-beta.14...v0.4.0-beta.15
[0.4.0-beta.14]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.4.0-beta.13...v0.4.0-beta.14
[0.4.0-beta.13]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.4.0-beta.12...v0.4.0-beta.13
[0.4.0-beta.12]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.4.0-beta.11...v0.4.0-beta.12
[0.4.0-beta.11]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.4.0-beta.10...v0.4.0-beta.11
[0.4.0-beta.10]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.4.0-beta.9...v0.4.0-beta.10
[0.4.0-beta.9]: https://github.com/ARBE-Avocat/Simulateurs-fiscaux/compare/v0.4.0-beta.8...v0.4.0-beta.9
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
