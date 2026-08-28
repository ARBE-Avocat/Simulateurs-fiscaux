# Changelog

Ce fichier recense les changements notables du projet. Les entrées sont regroupées par version stable ; le travail en cours reste dans `Non publié` jusqu'à sa promotion.

Le projet suit les règles de versionnement décrites dans `AGENTS.md`. Chaque beta et chaque version stable possèdent leur tag. Une unique GitHub Release récapitule chaque série mineure `X.Y` et pointe toujours vers son dernier tag publié.

## [Non publié]

## [0.5.0-beta.16] - 2026-08-28

Issue #7 : les tranches de barème sont désormais jointives partout. Le point n'a pas été soumis au référent fiscal, contrairement aux corrections de la beta.14 : un euro qui n'est taxé dans aucune tranche n'est pas une règle fiscale, c'est une erreur d'écriture. La correction est portée en fiche 3.7 de `docs/CORRECTIONS_A_VALIDER.md` pour confirmation, comme toute modification d'un montant affiché.

### Corrigé

- **Les deux simulateurs d'impôt sur le revenu donnent enfin le même impôt pour le même revenu.** L'IRPP faisait commencer chaque tranche un euro au-dessus de la borne précédente ; cet euro n'était taxé nulle part. Pour 200 000 € de revenu imposable, il affichait 66 522,57 € là où le simulateur « IR, CEHR et CDHR » affichait 66 523,84 €. **L'impôt de l'IRPP augmente donc de 1,27 € au maximum**, et rejoint celui de l'autre simulateur à tous les seuils.
- **Le barème de l'IFI ne laisse plus cinq euros sans taux.** Ses tranches commençaient à 800 001 €, 1 300 001 €, etc. Corrigé dans `data/referentiels/ifi.json`, donc pour le simulateur IFI comme pour la section IFI de l'IRPP. **L'IFI augmente de 0,05 € au maximum.** La validation des référentiels ne remonte plus aucun avertissement, contre cinq auparavant.

### Ajouté

- `tests/unit/bornes-baremes.test.js` : les deux simulateurs sont comparés à chaque seuil du barème, à −1, à l'euro près et à +1 ; franchir un seuil d'un euro doit coûter exactement le taux de la tranche ; et les quatre barèmes du dépôt sont vérifiés comme se suivant sans trou.

### Connu

- Les décimales affichées restent hétérogènes — l'euro dans quatre simulateurs, le centime dans deux autres. Ce n'est pas une question de droit et le point n'a pas été soumis au référent ; il est décrit dans `docs/CONVENTIONS.md` §2.1 en attendant une décision interne.
- L'exonération des fermages de l'IFI est toujours arrondie pour l'affichage alors que le calcul emploie la valeur non arrondie (`docs/CONVENTIONS.md` §2.2).
- La politique de messages d'erreur est arrêtée — avertir sans bloquer, comme pour l'âge du donateur — mais reste à appliquer champ par champ (`docs/CONVENTIONS.md` §2.3).

Les instantanés de non-régression des simulateurs IR, IRPP et IFI ont été régénérés : c'est une correction délibérée, pas une dérive. Le test qui figeait les cinq intervalles non couverts de l'IFI vérifie désormais qu'ils ont disparu.

## [0.5.0-beta.15] - 2026-08-28

Première moitié de l'issue #11 : les conventions communes de lecture et d'affichage. `docs/INVENTAIRE_CONVENTIONS.md` avait relevé sept divergences entre les six simulateurs et indiqué, pour chacune, qui devait trancher. Les quatre qui relevaient de la technique sont appliquées ici ; les trois qui commandent un montant ou sa présentation sont posées au référent, fiches 3.7 à 3.10.

### Corrigé

- **Un calcul qui n'aboutit pas ne s'affiche plus comme un montant.** Trois comportements coexistaient : `—`, `NaN €` et `0 €`. Ce dernier, employé par la plus-value immobilière, était le plus dangereux : il présentait une erreur de calcul comme un résultat valide, un utilisateur ne pouvant pas distinguer « le simulateur n'a pas pu calculer » de « vous ne devez rien ». Les six simulateurs affichent désormais `—`. Un vrai zéro continue de s'afficher « 0 € ».
- **Une case à cocher introuvable vaut désormais « décochée » dans l'IRPP**, au lieu de « cochée » : une faute de frappe dans un identifiant activait silencieusement une option, et avec elle un prélèvement. Les treize identifiants lus existent bien aujourd'hui — aucun montant ne change, la panne future est supprimée.

### Ajouté

- `src/conventions.js`, chargé par les six simulateurs : lecture d'une saisie, lecture d'une case, mise en forme d'un montant et d'un taux. La règle de l'issue #8 — un zéro saisi est respecté, seul un champ vide ou illisible prend la valeur par défaut — était copiée dans trois simulateurs et absente des trois autres ; elle est désormais unique et s'applique aux six.
- `docs/CONVENTIONS.md` : ce qui est tranché, ce qui ne l'est pas, et ce qu'un contributeur doit employer.
- Quatre fiches soumises au référent fiscal : représentation des tranches de barème (3.7, objet de l'issue #7), décimales affichées (3.8), étapes d'arrondi (3.9), champs obligatoires et messages d'erreur (3.10).

### Connu

- **Deux simulateurs ne donnent toujours pas le même impôt pour le même revenu** : jusqu'à 1,27 €, parce que l'IRPP fait commencer chaque tranche un euro au-dessus de la borne précédente là où le simulateur « IR, CEHR et CDHR » les rend jointives. L'IFI a le même défaut, pour 0,05 €. Rien n'a été modifié : la convention exacte est une question fiscale, posée en fiche 3.7.
- Les montants restent affichés à l'euro dans quatre simulateurs et au centime dans deux autres, faute de règle tranchée (fiche 3.8).
- `fmtPct()` du simulateur « IR, CEHR et CDHR » reçoit encore un pourcentage déjà multiplié là où les cinq autres reçoivent un décimal. L'aligner supposerait de reprendre chacun de ses appelants ; l'écart est signalé sur place.

Aucun montant valide n'est modifié : les 390 contrôles automatiques, instantanés compris, donnent les mêmes résultats avant et après.

## [0.5.0-beta.14] - 2026-08-28

Le référent fiscal a répondu à `docs/CORRECTIONS_A_VALIDER.md` : les corrections suivantes appliquent ses décisions. Le détail de chaque question et de chaque réponse reste dans ce document, fiche par fiche.

### Corrigé

- **La décote de la CDHR, jusqu'ici toujours nulle, se déclenche désormais** (fiche 2.1, issue #4). Le référent a désigné la formule du simulateur « IR, CEHR et CDHR » comme celle qui fait foi : bande de 250 000 € à 330 000 € pour un célibataire, 500 000 € à 660 000 € pour un couple, retranchée de la cible de 20 % avant imputation de l'impôt et de la CEHR déjà retenus. L'écart pouvait atteindre 45 000 € pour un célibataire proche du seuil.
- **Le plafonnement du quotient familial s'applique désormais dans l'IRPP**, comme il le fait déjà dans le simulateur « IR, CEHR et CDHR » (fiche 2.3). L'écart pouvait atteindre 19 985,10 € pour une famille de trois enfants à revenu élevé.
- **La section IFI de l'IRPP calcule désormais l'impôt selon la même méthode en deux temps que le simulateur IFI** (fiche 2.4) : l'IFI théorique est retranché du patrimoine net avant le calcul définitif et sa décote. L'écart pouvait atteindre 668,39 € sur l'exemple soumis au référent.
- **L'abattement de droit commun pour durée de détention des plus-values mobilières s'ouvre désormais dès deux ans révolus**, et non seulement au-delà (fiche 2.5). Détenir des titres deux ans exactement coûtait jusqu'à 112 500 € d'impôt de plus que de les détenir un jour de plus.
- **Le taux de change retenu un jour non coté est désormais le jour coté le plus proche**, en avant comme en arrière, un jour chaumé isolé se résolvant vers le jour suivant à égalité d'écart (fiche 3.5, issue #1). Un dimanche retient ainsi le taux du lundi plutôt que celui du vendredi précédent ; un samedi continue de retenir le vendredi, plus proche. L'échantillon de non-régression de 3 375 taux a été mis à jour en conséquence.
- **Le champ « âge du donateur » du simulateur de démembrement accepte désormais un 0 volontaire** (fiche 3.1), comme les champs corrigés en beta.1 à beta.6 : la tranche « moins de 21 ans révolus » du barème de l'usufruit (art. 669 CGI) le couvre. Un avertissement visible signale désormais un âge hors des bornes plausibles, 1 jour à 123 ans (fiche 3.2).

### Ajouté

- **Le taux des prélèvements sociaux est désormais modifiable dans l'IRPP et la plus-value immobilière**, comme il l'était déjà dans le simulateur IR (fiche 2.2). Le référent a confirmé que 17,2 % et 18,6 % sont tous deux justes selon la nature du revenu concerné (LF2026) et a demandé de conserver le taux par défaut de chaque simulateur tout en le rendant modifiable plutôt que de choisir un taux unique.
- Le simulateur de succession cite désormais l'art. 775 CGI dans la partie « Passif » à propos du forfait de 1 500 € de frais funéraires (fiche 1.2).

### Connu

- Les fiches 1.1, 1.3 et 1.4 étaient déjà corrigées ; le référent a confirmé qu'il s'agissait bien d'erreurs.
- La fiche 3.3 (sources et dates des barèmes) et la fiche 3.6 (millésime fiscal des cinq simulateurs sans date) restent ouvertes : la première sera traitée avec le chantier de référentiels, la seconde fait l'objet d'un chantier séparé.
- Les valeurs concernées restent au statut « non validé » dans `data/referentiels/` : le référent a tranché la méthode et la formule à appliquer, pas la source officielle de chaque montant.

Aucun test de non-régression n'a été retouché sans raison : les instantanés qui figeaient volontairement les anciens défauts (décote CDHR, plafonnement du quotient, méthode IFI) ont été régénérés sur le simulateur corrigé, et les deux tests qui figeaient explicitement une divergence vérifient désormais qu'elle a disparu.

## [0.5.0-beta.13] - 2026-08-27

### Ajouté

- **Chaque simulateur affiche désormais le millésime fiscal qu'il emploie.** Un bandeau « Référentiel fiscal employé » indique, pour chaque domaine chargé, le millésime des barèmes utilisés, leur date d'effet, leur date de dernière révision et le statut de validation de leurs valeurs. Jusqu'ici, la seule indication de fraîcheur fiscale était le nom du fichier — « Simulation IFI - Avril 2026 » — et une simulation imprimée ne disait pas de quel référentiel elle provenait. Le bandeau est conservé à l'impression, et l'export PowerPoint de la succession le mentionne sur sa couverture.
- **Le simulateur de plus-value immobilière choisit son référentiel d'après la date de cession saisie.** C'est le seul des six à demander une date fiscale. Une cession de 2019 affiche donc, en rouge, que le référentiel appliqué est postérieur à la situation simulée et que les montants ne reflètent pas le droit de 2019 — ce qui était déjà vrai avant, sans que rien ne le dise.
- Un sélecteur de millésime apparaît dès qu'un domaine en porte plusieurs. Aucun n'en porte aujourd'hui : il ne s'affiche donc pas, plutôt que de proposer un choix unique. Un choix manuel est abandonné dès que l'année de cession change.

### Modifié

- Le lecteur de référentiels résout maintenant le millésime explicitement. Il indexait ses entrées par identifiant seul : deux millésimes d'une même règle dans un fichier, et la dernière entrée lue l'emportait sans que rien ne le signale. Trois issues sont désormais nommées — millésime exact, absence de date de rattachement, millésime hors couverture — et aucune n'est silencieuse.

Aucun montant affiché ne change : les instantanés de non-régression des six simulateurs passent au centime.

### Connu

- **Cinq simulateurs sur six ne demandent aucune date fiscale** : ni année de revenus, ni date de décès, de donation, ni année de valorisation au 1er janvier. Ils appliquent donc leur unique millésime à toute situation, et le bandeau l'annonce désormais au lieu de le taire. Ajouter un champ de date suppose de décider quelle date commande quel millésime : question posée en fiche 3.6 de `docs/CORRECTIONS_A_VALIDER.md`.
- Le nom des fichiers ne correspond pas toujours aux données : le simulateur « IR 2025 et CEHR/CDHR 2026 » porte des valeurs entièrement de millésime 2025, et le simulateur de démembrement « Juin 2026 » emploie un barème de mutations à titre gratuit de 2025. Même fiche.
- La règle appliquée lorsque le millésime exact manque — retenir le dernier millésime antérieur, à défaut le plus ancien — n'a aujourd'hui aucun effet, puisqu'un seul millésime existe par domaine. Elle attend l'arbitrage du référent avant qu'un second n'apparaisse.

## [0.5.0-beta.12] - 2026-08-27

### Modifié

- **Le simulateur IFI ne fait plus appel à `exchangerate-api.com`, un service commercial tiers sans engagement de disponibilité.** Il partage désormais le même service de change que la plus-value immobilière : la BCE en ligne pour chacune des 25 devises, `data/change/` en repli. Le repli figé `FX_FALLBACK`, dont l'ancienneté n'était pas visible à l'écran, est retiré. #13 est terminée.
- L'ordre historique de l'IFI (`exchangerate-api.com` avant la BCE) répondait à un vrai problème : la BCE ne publie son taux du jour qu'en fin d'après-midi, une requête avant cette heure pour la date du jour renvoie une réponse vide. Vérifié en interrogeant l'API réelle avant l'heure de publication. Mais interroger la BCE sur une fenêtre de plusieurs jours plutôt qu'un seul résout ce même problème sans service tiers : le jour manquant est simplement omis, la fenêtre rend le dernier jour disponible.
- Conséquence visible : la conversion en devise n'est plus instantanée dans aucun des deux simulateurs. L'IFI affiche « Chargement des taux de change en cours… » pendant le court aller-retour réseau (moins d'une seconde en pratique) plutôt qu'un résultat construit avec des devises non converties.

### Corrigé

- **Un bien en devise étrangère dont le taux n'était pas encore résolu comptait pour 0 € dans le patrimoine taxable de l'IFI**, silencieusement, au lieu d'attendre le taux. Trouvé en construisant l'étape ci-dessus : `computePatrimoineBrut()` traite maintenant un taux manquant comme un calcul non encore possible, pas comme une valeur nulle. Une relecture équivalente sur la plus-value immobilière n'a rien trouvé d'atteignable : un contrôle déjà présent y empêche l'affichage tant qu'un taux manque.

### Connu

- Le repli sur `data/change/` ne couvre que les dates déjà extraites au moment de la génération des fichiers. Pour une date très récente si la BCE est aussi indisponible, aucune des deux sources ne répond, et l'écran l'indique plutôt que d'afficher un chiffre inventé.

## [0.5.0-beta.11] - 2026-08-27

### Modifié

- **Le simulateur de plus-value immobilière ne télécharge plus la série complète des taux de change.** Il interroge désormais l'API de données de la Banque centrale européenne pour la date de cession et la date d'acquisition, et ne retombe sur les fichiers versionnés de `data/change/` que si la BCE ne répond rien. L'écran affiche laquelle des deux sources a servi. Le repli n'est pas la Banque de France elle-même, qui ne publie aucune API interrogeable : voir `docs/ARCHITECTURE_CIBLE.md` §7 bis pour le détail de cette décision technique.
- **Conséquence visible pour l'utilisateur : la conversion d'un montant en devise n'est plus instantanée.** Le taux s'affichait jusqu'ici sans délai, lu dans un bloc embarqué dans la page. Il demande maintenant un aller-retour réseau ; le badge affiche « chargement… » le temps de la réponse, en général moins d'une seconde. Aucun montant final ne change : vérifié en rejouant quatre scénarios en devise capturés depuis le code d'avant ce changement, avec les vraies données de `data/change/`, puis confirmé dans un navigateur réel — y compris le cas où l'appel à la BCE échoue, et celui où la date tombe un week-end.

### Connu

- Le repli sur `data/change/` porte toujours la mention « source à confirmer » à l'écran : ces taux n'ont pas de source établie, voir fiche 3.5 de `docs/CORRECTIONS_A_VALIDER.md`.

## [0.5.0-beta.10] - 2026-08-27

### Ajouté

- **Les contrôles du dépôt s'exécutent désormais tout seuls, à chaque envoi de code et sur chaque proposition de fusion.** Ils vérifient la syntaxe de tout le JavaScript, la cohérence des référentiels fiscaux, le fait que les fichiers générés correspondent bien aux données, la validité de la série de taux de change, puis lancent les 321 tests. Jusqu'ici, rien n'obligeait à les lancer : une erreur pouvait arriver dans le dépôt sans que personne ne s'en aperçoive avant d'ouvrir une page.
- `npm run verifier` enchaîne exactement les mêmes contrôles en local, dans le même ordre. Un échec constaté en ligne se reproduit sur le poste sans attendre.
- `npm run verifier:syntaxe` compile, sans les exécuter, les 44 sources JavaScript du dépôt, y compris celles embarquées dans les pages HTML. Le dépôt n'ayant aucune étape de compilation, une parenthèse manquante ne se voyait jusqu'ici qu'à l'ouverture de la page concernée.

Aucun simulateur n'est modifié : aucun montant affiché ne change.

## [0.5.0-beta.9] - 2026-08-27

### Ajouté

- La série de taux de change — 1999 à 2026, 30 devises, 7 034 jours cotés — vit désormais dans `data/change/`, à raison d'un fichier par année. Elle était embarquée dans le simulateur de plus-value immobilière, qui la faisait télécharger en entier, près de 4 Mo, à qui ouvrait la page pour convertir deux dates. Le simulateur ne l'utilise pas encore depuis cet emplacement : cette étape ne fait que sortir la donnée, sans rien changer à l'écran.
- `npm run change:valider` vérifie la cohérence de la série et que son manifeste décrit bien ce que contiennent les fichiers.

### Connu

- La règle qui décide du taux applicable lorsqu'une date tombe un week-end ou un jour férié — retenir le dernier jour coté avant, en remontant au plus dix jours — n'était écrite nulle part : elle a été déduite du code. Elle est conservée à l'identique, désormais décrite et vérifiée, mais **elle n'est pas confirmée**. Sur une cession d'un million de dollars un samedi, retenir le vendredi plutôt que le lundi change le prix converti de 7 421,94 €. Question posée en fiche 3.5 de `docs/CORRECTIONS_A_VALIDER.md`.
- L'origine de ces taux n'est pas établie. Aucune source ne figurait dans le fichier d'origine ; la série commence au premier jour de cotation de l'euro et porte les devises habituellement publiées comme taux de référence, ce qui suggère une reprise des taux de la Banque centrale européenne relayés par la Banque de France. Tant que ce n'est pas confirmé, la source reste inscrite comme « inconnue ».

## [0.5.0-beta.8] - 2026-08-26

### Corrigé

- **Les chiffres de la fiche 1.4 du dossier de validation étaient faux.** Elle annonçait un plafond de dons de 12 000 €, une réduction de 7 920 € et un écart d'impôt de 3 183,58 €. Les montants réels sont 10 800 €, 7 128 € et 2 175,58 €. Le défaut décrit et la correction apportée sont inchangés : seuls les chiffres l'étaient, parce qu'ils venaient d'un banc d'essai où l'abattement de 10 % sur les salaires ne s'appliquait jamais. Les autres fiches ont été revérifiées, aucune n'est concernée.

### Modifié

- Les paramètres fiscaux modifiables des formulaires — barème et abattements de l'IRPP, barème du démembrement, taux de prélèvements sociaux du simulateur IR — ne sont plus inscrits dans les pages : ils y sont écrits au chargement depuis les données. **Une mise à jour annuelle ne touche donc plus aucun fichier HTML**, ce qui était l'objet du chantier. Les champs restent modifiables à l'écran.
- Aucun montant affiché ne change : les résultats ont été rejoués sur le code d'avant l'extraction, 188 comparaisons sans un seul écart.

### Ajouté

- Dix scénarios de contrôle pour un contribuable célibataire dans le simulateur « IR, CEHR et CDHR ». Ils manquaient : la situation du foyer n'étant pas un champ de formulaire, tous les contrôles existants tournaient en imposition commune, et les seuils propres au célibataire — CEHR à 250 000 €, bande de décote de la CDHR — n'étaient jamais exercés.

## [0.5.0-beta.7] - 2026-08-26

### Modifié

- Chaque simulateur ne charge plus que les données fiscales dont il se sert. Les référentiels étaient réunis dans un fichier unique servi aux six pages ; ils sont désormais découpés par domaine. Le simulateur de succession télécharge 12 Ko au lieu de 44, et surtout il ne téléchargera pas l'historique des taux de change — près de 4 Mo — quand celui-ci sortira du simulateur de plus-value immobilière.
- La correspondance entre un simulateur et les données qu'il charge n'est écrite nulle part à la main : elle se déduit de ce que les données déclarent, et un contrôle automatique la confronte à ce que chaque page charge réellement. Une valeur extraite pour un simulateur dont la page n'a pas été mise à jour fait échouer les tests, en nommant le fichier manquant.
- Un référentiel supprimé des données voit son fichier généré effacé, pour qu'aucune page ne continue de charger des données mortes.

Aucun montant affiché ne change.

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
