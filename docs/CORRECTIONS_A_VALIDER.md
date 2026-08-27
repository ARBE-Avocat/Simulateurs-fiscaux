# Corrections à valider par le référent fiscal

Ce document s'adresse au référent juridique et fiscal du projet. Il recense les
points où le comportement d'un simulateur a été jugé fautif et modifié, ou bien
jugé fautif mais **laissé en l'état** faute de certitude.

Aucune connaissance technique n'est nécessaire pour le lire.

Dernière mise à jour : 27 août 2026 — jalon `0.5`, chantier des référentiels.

**Version interactive :** <https://claude.ai/code/artifact/ed86515a-2108-4df9-b7fc-acc15b0682d3>
Cette page reprend le contenu ci-dessous et permet de répondre point par point.
Les réponses y sont enregistrées et peuvent être exportées. Le présent fichier
reste la version de référence, versionnée avec le code.

Cette page est **partagée nominativement** et n'est pas publiée sur le site : elle
est un outil de travail, pas un livrable. Attention toutefois : le dépôt étant
public, le présent document et les issues associées sont, eux, librement
consultables.

Son source est `docs/arbitrages.html`. Pour la faire évoluer, modifier ce fichier
puis le republier à la **même adresse** : republier depuis un autre chemin
créerait une seconde page et perdrait les arbitrages déjà saisis. Les points
affichés sont décrits dans le tableau `POINTS` en tête du script ; ajouter ou
retirer un point ne demande rien d'autre que de modifier ce tableau.

## Pourquoi votre validation est demandée

Un développeur peut constater qu'un simulateur se comporte de façon incohérente.
Il ne peut pas décider seul si le comportement d'origine était une erreur ou une
règle voulue. Trois cas de figure sont possibles pour chaque point ci-dessous :

1. **c'était bien une erreur** : la correction est confirmée, rien à faire ;
2. **ce n'était pas une erreur** : le comportement d'origine avait une raison
   fiscale, et il faut le rétablir ;
3. **c'était une erreur, mais la correction n'est pas la bonne** : il faut
   indiquer le comportement attendu.

Merci d'indiquer votre réponse pour chaque point. Une réponse en une ligne suffit.

## Comment lire chaque fiche

Chaque correction est présentée ainsi :

- **Ce que voyait l'utilisateur** : le comportement constaté, avec un exemple chiffré ;
- **Pourquoi cela paraît anormal** : le raisonnement suivi ;
- **Ce qui a été changé** : la nouvelle façon de faire ;
- **Ce que cela change en euros** : l'écart concret ;
- **Ce qui est attendu de vous** : la question précise.

---

# Partie 1 — Corrections appliquées qui modifient un résultat

Ces quatre points modifient des montants affichés. Ce sont ceux qui demandent
votre confirmation en priorité.

## 1.1 — IFI : un bien détenu à 0 % était compté en totalité

**Ce que voyait l'utilisateur.** Dans le tableau des biens du simulateur IFI, la
colonne « quote-part » indique le pourcentage de détention du bien. En saisissant
`0`, le simulateur ne retenait pas 0 % mais **100 %**. Le bien était donc intégré
en totalité au patrimoine taxable.

**Pourquoi cela paraît anormal.** Saisir 0 est une action volontaire et sans
ambiguïté : l'utilisateur indique qu'il ne détient pas ce bien, ou qu'il souhaite
le neutraliser pour comparer deux hypothèses. Rien à l'écran ne signalait que sa
saisie était remplacée.

L'origine est un raccourci d'écriture courant en informatique, qui traite la
valeur zéro comme une absence de réponse. Un champ vide et un zéro étaient donc
confondus.

**Ce qui a été changé.** Un champ laissé vide conserve la valeur par défaut de
100 %, comme avant. Un `0` réellement saisi vaut désormais 0 %.

**Ce que cela change en euros.** Un bien de 2 000 000 € saisi avec une quote-part
de 0 % :

| | Patrimoine brut retenu | IFI dû |
|---|---|---|
| Avant | 2 000 000 € | 7 348,19 € |
| Après | 0 € | 0 € |

**Ce qui est attendu de vous.** Confirmez qu'une quote-part de 0 % doit bien
neutraliser le bien. Si vous préférez qu'une quote-part de 0 % soit refusée par
un message d'erreur plutôt qu'acceptée, dites-le : c'est une autre option
possible.

## 1.2 — Succession : des frais funéraires à 0 € repassaient à 1 500 €

**Ce que voyait l'utilisateur.** Le champ « Frais funéraires » du simulateur de
succession propose 1 500 € par défaut. En saisissant `0`, le simulateur retenait
quand même **1 500 €** au passif de la succession.

**Pourquoi cela paraît anormal.** Même mécanisme qu'au point précédent : le zéro
était confondu avec une absence de saisie. Un utilisateur qui indique
volontairement qu'aucun frais funéraire n'est déduit — parce qu'ils ont déjà été
réglés autrement, ou qu'il souhaite les exclure de la simulation — voyait sa
saisie ignorée.

**Ce qui a été changé.** Le champ vide conserve la valeur par défaut de 1 500 €.
Un `0` saisi vaut désormais 0 €.

**Ce que cela change en euros.** Sur une succession de 800 000 € d'actif, sans
autre passif :

| Frais funéraires saisis | Passif retenu | Actif net taxable |
|---|---|---|
| Champ laissé vide | 1 500 € | 798 500 € |
| `0` saisi — avant | 1 500 € | 798 500 € |
| `0` saisi — après | 0 € | 800 000 € |

**Ce qui est attendu de vous.** Deux questions distinctes :

1. confirmez qu'un utilisateur doit pouvoir ramener ce poste à 0 € ;
2. **la valeur par défaut de 1 500 € est-elle toujours d'actualité ?** Elle est
   inscrite en dur dans le simulateur, sans source ni date. Si un montant
   forfaitaire différent s'applique, merci d'indiquer lequel et sa source.

## 1.3 — Démembrement : le barème modifiable refusait la valeur zéro

**Ce que voyait l'utilisateur.** Le simulateur de donation en nue-propriété
permet de modifier les paramètres du barème : abattements par lien de parenté,
bornes des tranches et taux de chaque tranche. Ces champs sont pré-remplis avec
les valeurs en vigueur.

En saisissant `0` dans l'un d'eux, la valeur d'origine était **silencieusement
rétablie**. Il était donc impossible de simuler une donation sans abattement, ou
d'annuler une tranche du barème.

**Pourquoi cela paraît anormal.** Ces champs existent précisément pour permettre
de tester des hypothèses. Un abattement mis à 0 est une hypothèse légitime : par
exemple pour simuler une donation intervenant après épuisement de l'abattement
disponible sur la période de rappel fiscal.

**Ce qui a été changé.** Un champ vide conserve la valeur pré-remplie. Un `0`
saisi est désormais appliqué.

**Ce que cela change en euros.** Donation en nue-propriété de 600 000 €,
donateur de 68 ans, deux donataires en ligne directe :

| Hypothèse | Droits totaux avant | Droits totaux après |
|---|---|---|
| Barème inchangé | 28 388,70 € | 28 388,70 € |
| Abattement ramené à 0 € | 28 388,70 € — *saisie ignorée* | 68 388,70 € |
| Taux de la 1ʳᵉ tranche ramené à 0 % | 28 388,70 € — *saisie ignorée* | 27 581,50 € |

**Ce qui est attendu de vous.** Confirmez que ces paramètres doivent pouvoir être
mis à zéro. Deux remarques à trancher :

1. faut-il **avertir** l'utilisateur qu'il s'écarte du barème en vigueur ? Rien
   ne le signale aujourd'hui, et un barème modifié ne laisse aucune trace sur les
   résultats affichés ou exportés ;
2. les valeurs pré-remplies de ce barème sont inscrites en dur, sans source ni
   millésime. Elles devront être confirmées dans le cadre du chantier de
   référentiels.

## 1.4 — IRPP : la réduction pour dons ne suivait pas les changements de revenu

**Ce que voyait l'utilisateur.** La réduction d'impôt pour dons est plafonnée à
20 % du revenu net imposable. Le simulateur affichait bien ce plafond et le
mettait à jour dès que le revenu changeait.

En revanche, **la réduction elle-même restait figée** sur le revenu saisi au
moment où les dons avaient été renseignés. Elle ne se mettait à jour que si
l'utilisateur retouchait un champ de dons.

**Le scénario concret.** Un utilisateur saisit un revenu élevé, puis ses dons. Il
s'aperçoit d'une erreur et corrige son revenu à la baisse. À l'écran, le plafond
diminue correctement, mais la réduction affichée reste celle calculée avec
l'ancien revenu — et l'impôt final en tient compte.

**Pourquoi cela paraît anormal.** Deux montants affichés côte à côte devenaient
incohérents : un plafond de 10 800 € et une réduction de 13 200 €, supérieure au
plafond. Le résultat dépendait de l'ordre dans lequel l'utilisateur avait rempli
le formulaire, ce qui n'a aucune justification fiscale.

**Ce que cela change en euros.** Salaire ramené de 200 000 € à 60 000 €, avec
20 000 € de dons à des organismes ouvrant droit à la réduction de 66 %. Le
revenu net imposable retenu est le salaire diminué de l'abattement de 10 %, soit
54 000 € : le plafond des dons vaut donc 20 % de 54 000 €.

| | Plafond affiché | Réduction retenue | Impôt net |
|---|---|---|---|
| Avant | 10 800 € | 13 200 € | 0,00 € |
| Après | 10 800 € | 7 128 € | 2 175,58 € |

L'écart est de **2 175,58 € d'impôt**, dans le sens favorable au contribuable :
le simulateur sous-estimait l'impôt dû.

> **Correction d'une version antérieure de cette fiche.** Elle annonçait un
> plafond de 12 000 €, une réduction de 7 920 € et un écart de 3 183,58 €. Ces
> montants étaient faux, non pas dans leur principe mais dans leur calcul : ils
> provenaient d'un banc d'essai qui n'appliquait pas les valeurs pré-remplies de
> la page, et où l'abattement de 10 % sur les salaires ne s'appliquait donc
> jamais. Le défaut décrit et la correction apportée sont inchangés ; seuls les
> chiffres le sont. Le banc d'essai a été corrigé le 26 août 2026, et les
> montants ci-dessus ont été relevés sur le simulateur lui-même, avant et après
> correction. Les autres fiches ont été revérifiées : aucune n'est concernée.

**Ce qui est attendu de vous.** Confirmez le principe retenu : la réduction pour
dons se calcule toujours avec le revenu net imposable courant, et le résultat ne
doit jamais dépendre de l'ordre de saisie.

---

# Partie 2 — Corrections **non appliquées**, en attente de votre décision

## 2.1 — IRPP : la décote de la CDHR ne se déclenche jamais

**C'est le point le plus important de ce document.**

**Ce que voyait l'utilisateur.** Le simulateur IRPP présente un tableau
« Sans décote / Avec décote » pour la contribution différentielle sur les hauts
revenus. Les deux colonnes affichent **toujours le même montant** : la décote
calculée est nulle dans tous les cas.

**Pourquoi cela paraît anormal.** La condition qui déclenche la décote ne peut
jamais être satisfaite : elle ne s'applique qu'en dessous du seuil
d'assujettissement, alors que le calcul qu'elle contient ne produit un résultat
qu'au-dessus. Le mécanisme est donc inatteignable, quel que soit le revenu.
Vérifié pour un célibataire sur toute la plage de 200 000 € à 400 000 €.

**Pourquoi rien n'a été corrigé.** Le dépôt contient **deux calculs de décote
différents et incompatibles** :

| | Simulateur IRPP | Simulateur « IR, CEHR et CDHR » |
|---|---|---|
| Quand la décote s'applique | en dessous du seuil | dans une bande **au-dessus** du seuil |
| Bande pour un célibataire | — | de 250 000 € à 330 000 € |
| Bande pour un couple | — | de 500 000 € à 660 000 € |
| Ce qui est retranché | 0,825 × (revenu − seuil) | 20 % du revenu − 0,825 × (revenu − seuil) |
| À quel moment | de la contribution brute | de la cible de 20 %, avant imputation de l'impôt déjà payé |

Choisir entre ces deux versions revient à trancher une question fiscale. Cela n'a
donc pas été fait.

**Un indice, qui ne vaut pas validation.** Avec la formule du second simulateur,
la décote atteint exactement zéro lorsque le revenu atteint la borne haute de la
bande : pour un célibataire, 20 % de 330 000 € font 66 000 €, et
0,825 × (330 000 − 250 000) font également 66 000 €. La formule et la bande
s'emboîtent parfaitement, ce qui suggère qu'elles proviennent d'une même source.
**C'est une observation sur le code, pas une vérification juridique.**

**Ce que l'écart représente.** Célibataire, sans abattement ni impôt déjà retenu :

| Revenu retraité | Contribution brute | Décote actuelle | Décote selon l'autre simulateur | Écart |
|---|---|---|---|---|
| 250 001 € | 50 000 € | 0 € | 49 999 € | **49 999 €** |
| 260 000 € | 52 000 € | 0 € | 43 750 € | 43 750 € |
| 280 000 € | 56 000 € | 0 € | 31 250 € | 31 250 € |
| 300 000 € | 60 000 € | 0 € | 18 750 € | 18 750 € |
| 320 000 € | 64 000 € | 0 € | 6 250 € | 6 250 € |
| 330 000 € | 66 000 € | 0 € | 0 € | 0 € |

Le simulateur IRPP peut donc **surestimer la contribution de plusieurs dizaines
de milliers d'euros** pour un revenu situé juste au-dessus du seuil.

**Ce qui est attendu de vous.** Quatre questions :

1. quelle formule fait foi : celle du second simulateur, une autre à préciser, ou
   bien les deux situations sont-elles réellement différentes et justifient-elles
   deux calculs distincts ?
2. quel est l'intervalle exact d'application, pour un célibataire et pour un
   couple ? Les bornes de 330 000 € et 660 000 € sont-elles confirmées ?
3. la décote se retranche-t-elle de la contribution brute, ou de la cible de 20 %
   avant imputation de l'impôt déjà payé ? Les deux versions ne l'appliquent pas
   au même endroit, ce qui change le résultat même à formule identique ;
4. quelle source et quel millésime citer ?

Dès votre réponse, la correction est immédiate : le calcul a déjà été isolé et
préparé pour ne plus dépendre que de cette formule.

## 2.2 — Le taux des prélèvements sociaux n'est pas le même partout

**Ce que voyait l'utilisateur.** Les simulateurs n'appliquent pas le même taux de
prélèvements sociaux à une plus-value :

| Simulateur | Taux appliqué | Comment |
|---|---|---|
| IR, CEHR et CDHR | **18,6 %** | champ modifiable, pré-rempli à 18,6 |
| IRPP | **17,2 %** | inscrit en dur, à seize endroits |
| Plus-value immobilière | **17,2 %** | inscrit en dur |

**Pourquoi cela paraît anormal.** Un même prélèvement porte deux taux différents
selon la page ouverte. Aucune mention n'explique l'écart : ni date d'effet, ni
nature de revenu, ni source. Un utilisateur qui compare deux simulations du même
projet obtient deux résultats, sans savoir lequel retenir.

**Ce qui a été changé.** Rien. Choisir entre deux taux est une décision fiscale.

**Ce que cela change en euros.** Sur une plus-value de cession de 1 000 000 € :

| Taux appliqué | Prélèvements sociaux |
|---|---|
| 18,6 % — simulateur IR | 186 000 € |
| 17,2 % — IRPP et PV immobilière | 172 000 € |
| Écart | **14 000 €** |

**Ce qui est attendu de vous.**

1. Quel taux s'applique, et à quels revenus ? Le 18,6 % correspond-il à une
   assiette ou à une période différente du 17,2 %, ou bien l'un des deux est-il
   simplement périmé ?
2. Si les deux sont justes selon le cas, lequel s'applique à quoi, et faut-il
   l'indiquer à l'écran ?
3. Le taux doit-il rester modifiable dans le simulateur IR, alors qu'il est figé
   dans les deux autres ?
4. Quelle source et quelle date d'effet citer ?

## 2.3 — IRPP : le plafonnement du quotient familial n'est pas appliqué

**Ce que voit l'utilisateur.** Le simulateur IRPP demande un nombre de parts,
divise le revenu par ce nombre, calcule l'impôt sur le quotient obtenu et
multiplie le résultat par le nombre de parts. Aucun plafond n'intervient.

Le simulateur « IR, CEHR et CDHR », lui, calcule d'abord l'impôt sans les parts
supplémentaires, puis limite l'avantage qu'elles procurent à **1 807 € par
demi-part**.

**Pourquoi cela paraît anormal.** Deux simulateurs du même dépôt appliquent des
règles différentes au même mécanisme. Le simulateur IRPP est celui qui calcule
un impôt sur le revenu complet ; c'est donc celui où l'absence de plafond a le
plus d'effet. Le montant du plafond, 1 807 €, est par ailleurs inscrit en dur
dans le simulateur IR, sans source ni millésime.

**Ce qui a été changé.** Rien. Ajouter un plafonnement, ou confirmer qu'il ne
doit pas s'appliquer, est une décision fiscale.

**Ce que cela change en euros.** Célibataire avec enfants à charge, revenu net
imposable indiqué en première colonne, impôt sur le revenu avant décote et
réductions :

| Revenu | Situation | Simulateur IR | Simulateur IRPP | Écart |
|---|---|---|---|---|
| 60 000 € | 1 enfant — 1,5 part | 9 296,99 € | 7 655,37 € | 1 641,62 € |
| 60 000 € | 2 enfants — 2 parts | 7 489,99 € | 4 207,16 € | 3 282,83 € |
| 100 000 € | 2 enfants — 2 parts | 21 186,52 € | 16 207,16 € | **4 979,36 €** |
| 200 000 € | 2 enfants — 2 parts | 62 909,84 € | 49 599,40 € | 13 310,44 € |
| 200 000 € | 3 enfants — 3 parts | 59 295,84 € | 39 310,74 € | **19 985,10 €** |

L'écart croît avec le revenu et avec le nombre d'enfants. Le simulateur IRPP est
celui qui annonce le montant le plus faible : il **sous-estime l'impôt dû**, si
le plafonnement est bien applicable.

**Une réserve importante.** Le simulateur IRPP ne demande pas la situation
familiale mais un nombre de parts. Pour un couple sans enfant, 2 parts, il n'y a
rien à plafonner et les deux simulateurs concordent. La divergence n'apparaît
que lorsque les parts proviennent de personnes à charge, ce que le simulateur
IRPP n'a aujourd'hui aucun moyen de distinguer.

**Ce qui est attendu de vous.** Trois questions :

1. le plafonnement de l'avantage en impôt procuré par les demi-parts
   supplémentaires doit-il s'appliquer dans le simulateur IRPP ?
2. si oui, le montant de 1 807 € par demi-part est-il le bon, et pour quel
   millésime ? Quelle source citer ?
3. le simulateur doit-il alors demander la situation familiale plutôt qu'un
   simple nombre de parts, afin de savoir quelles parts sont plafonnables ?

## 2.4 — L'IFI n'est pas calculé de la même façon dans les deux simulateurs qui le calculent

**Ce que voit l'utilisateur.** L'IFI est calculé à deux endroits : dans le
simulateur IFI, et dans une section du simulateur IRPP. Pour un même patrimoine,
les deux ne donnent pas le même impôt.

Le barème et ses taux sont pourtant identiques dans les deux fichiers. Ce sont
la méthode et la décote qui diffèrent :

| | Simulateur IFI | Section IFI de l'IRPP |
|---|---|---|
| Assiette | l'IFI théorique est **retranché du patrimoine**, puis l'impôt est recalculé sur cette base réduite | un seul calcul, sur le patrimoine net |
| Condition de la décote | patrimoine net après IFI théorique inférieur à 1 400 000 € | patrimoine **brut** compris entre 1 300 000 € et 1 400 000 € |
| Base de la décote | patrimoine net après IFI théorique | patrimoine net |

**Pourquoi cela paraît anormal.** Un utilisateur qui saisit le même patrimoine
dans les deux pages du même cabinet obtient deux montants différents, sans
qu'aucune mention n'explique pourquoi. Les deux méthodes ne peuvent pas être
justes en même temps.

La seconde différence a un effet de seuil marqué : dès que le passif fait passer
le patrimoine sous 1 400 000 € alors que le brut le dépasse, un simulateur
accorde la décote et l'autre la refuse entièrement.

**Ce qui a été changé.** Rien. Choisir une méthode de liquidation est une
décision fiscale.

**Ce que cela change en euros.** Un bien immobilier de 1 450 000 €, un passif
déductible de 100 000 €, aucun don ni plafonnement :

| Étape | Simulateur IFI | Section IFI de l'IRPP |
|---|---|---|
| Patrimoine brut | 1 450 000 € | 1 450 000 € |
| Patrimoine net | 1 350 000 € | 1 350 000 € |
| Impôt au barème | 2 849,99 € | 2 849,99 € |
| Décote | 625,00 € puis 652,81 € | **0 €** |
| Base du second calcul | 1 347 775,01 € | — |
| **IFI dû** | **2 181,60 €** | **2 849,99 €** |

L'écart est de **668,39 €**, soit près d'un tiers de l'impôt annoncé par le
simulateur IFI.

**Ce qui est attendu de vous.** Quatre questions :

1. l'IFI théorique doit-il être retranché du patrimoine avant le calcul
   définitif, comme le fait le simulateur IFI, ou l'impôt se liquide-t-il en une
   seule fois, comme le fait l'IRPP ?
2. la décote s'apprécie-t-elle sur le patrimoine **brut** ou sur le patrimoine
   **net** ? Et sur lequel des deux se calcule-t-elle ?
3. la borne de 1 400 000 € et la formule « 17 500 € − 1,25 % du patrimoine »
   sont-elles confirmées, et pour quel millésime ?
4. quelle source citer ?

## 2.5 — IRPP : l'abattement pour durée de détention des plus-values mobilières emploie deux règles opposées

**Ce que voit l'utilisateur.** Le simulateur applique un abattement pour durée
de détention aux plus-values de cession de titres, avec un régime de droit
commun et un régime renforcé. Les deux sont calculés dans la même expression,
mais ne comptent pas les années de la même façon :

| Durée de détention | Abattement de droit commun | Abattement renforcé |
|---|---|---|
| 1 an | 0 % | 0 % |
| **2 ans** | **0 %** | **50 %** |
| 3 ans | 50 % | 50 % |
| **4 ans** | 50 % | **65 %** |
| 7 ans | 50 % | 65 % |
| **8 ans** | 50 % | **85 %** |
| 9 ans | 65 % | 85 % |

**Pourquoi cela paraît anormal.** Le régime renforcé applique son palier
**dès** 2, 4 et 8 ans révolus. Le régime de droit commun ne l'applique
qu'**au-delà** : à 2 ans exactement, aucun abattement ; à 8 ans exactement,
toujours celui des 2 ans. Les deux écritures cohabitent dans la même ligne de
code. Elles ne peuvent pas être justes en même temps.

Le mot employé par le texte fiscal — « au moins deux ans » ou « plus de deux
ans » — décide de la bonne. Un développeur ne peut pas trancher cela.

**Ce qui a été changé.** Rien. Corriger l'une ou l'autre modifie l'impôt.

**Ce que cela change en euros.** Cession de 1 000 titres achetés 100 € et
revendus 600 €, soit 500 000 € de plus-value. Salaire de 60 000 €, une part,
régime de droit commun :

| Durée de détention | Impôt net affiché |
|---|---|
| 1 an | 225 822,57 € |
| **2 ans** | **225 822,57 €** |
| 3 ans | 113 322,57 € |

Détenir les titres deux ans exactement coûte **112 500 € d'impôt de plus** que
de les détenir un jour de plus. Si la règle est « au moins deux ans », le
montant à deux ans devrait être celui de la troisième ligne.

**Ce qui est attendu de vous.** Trois questions :

1. l'abattement de droit commun s'ouvre-t-il **à partir de** deux ans révolus,
   ou seulement **au-delà** de deux ans ?
2. la même réponse vaut-elle pour le passage au palier supérieur — huit ans pour
   le droit commun, quatre et huit ans pour le renforcé ?
3. quelle source et quel millésime citer ?

---

# Partie 3 — Points relevés, non corrigés, qui demandent un arbitrage

Ces points ne sont pas des corrections mais des incohérences constatées. Aucun
n'a été modifié.

## 3.1 — Démembrement : l'âge et le nombre de donataires refusent le zéro

Contrairement aux autres champs, ces deux-là remplacent toujours un `0` par leur
valeur par défaut — 68 ans et 1 donataire. Ce comportement a été **conservé
volontairement** : un âge de 0 an ne correspond à aucune tranche du barème de
l'usufruit, et un nombre de donataires nul empêcherait tout partage.

**Ce qui est attendu de vous.** Ces deux champs devraient plutôt afficher un
message d'erreur qu'appliquer une valeur par défaut silencieuse. Quelles bornes
faut-il accepter ? Un âge minimum et maximum, un nombre maximum de donataires ?

## 3.2 — Démembrement : un âge aberrant est accepté sans avertissement

Toujours sur le champ « âge du donateur », une valeur manifestement impossible
est acceptée et produit un résultat d'apparence normale :

| Âge saisi | Taux de nue-propriété retenu |
|---|---|
| −5 ans | 10 % |
| 0 an | 60 % — la valeur par défaut de 68 ans s'applique |
| 68 ans | 60 % |
| 200 ans | 90 % |

Un âge négatif ou de 200 ans est donc rattaché à la tranche extrême du barème,
sans que rien ne signale l'anomalie. Le résultat affiché paraît crédible alors
qu'il ne repose sur aucune situation réelle.

Le comportement n'a pas été modifié, faute de savoir ce qui doit s'afficher à la
place. Voir la question posée au point 3.1.

## 3.3 — Les barèmes ne portent ni source ni date

Tous les barèmes, seuils, abattements et taux des simulateurs sont inscrits
directement dans les fichiers, sans mention de leur source ni de leur date
d'application. Il est donc impossible, aujourd'hui, de vérifier un chiffre sans
le rechercher soi-même.

C'est l'objet d'un chantier séparé. Il supposera, pour chaque valeur, une source
officielle et un millésime que vous seul pouvez confirmer.

## 3.4 — Plus-value immobilière : le seuil de la surtaxe n'est pas lissé

**Ce que voit l'utilisateur.** La surtaxe sur les plus-values immobilières
supérieures à 50 000 € comporte des paliers de raccordement, destinés à éviter
qu'un euro de plus-value supplémentaire ne déclenche brutalement plusieurs
milliers d'euros d'impôt. Ces raccordements fonctionnent partout, sauf au
premier seuil :

| Plus-value imposable | Surtaxe |
|---|---|
| 50 000 € | 0 € |
| **50 001 €** | **500,07 €** |
| 60 000 € | 1 200 € |
| 100 000 € | 2 000 € |
| 100 001 € | 2 000,13 € |

Un euro de plus-value supplémentaire coûte 500 € de surtaxe. Au palier suivant,
le même euro n'en coûte que treize centimes.

**Pourquoi ce point est signalé sans être présenté comme un défaut.** Le
coefficient employé sur la première bande suit la progression régulière des
autres — 1/20, puis 1/10, 0,15, 0,20, 0,25 — et correspond à la table publiée
que le code cite en référence. Il est donc possible que ce ressaut soit voulu
par le texte lui-même, un seuil d'entrée n'ayant pas la même fonction qu'un
raccordement entre deux taux.

**Ce qui a été changé.** Rien, et rien ne le sera sans votre réponse. Un
contrôle automatique constate désormais ce ressaut plutôt que de le laisser
passer pour une continuité.

**Ce qui est attendu de vous.** Le franchissement de 50 000 € doit-il produire
ce ressaut de 500 €, ou la première bande doit-elle ramener la surtaxe à zéro au
seuil, comme le font les autres raccordements ? Quelle source citer ?

## 3.5 — Quel taux de change retenir lorsque la date tombe un jour non coté

**Ce que voit l'utilisateur.** Les simulateurs de plus-value immobilière et
d'IFI acceptent des montants en devises et les convertissent en euros. La série
de taux dont ils disposent ne comporte que les jours de cotation : sur 10 034
jours entre 1999 et 2026, **3 000 ne sont pas cotés** — week-ends et jours
fériés.

Une cession datée d'un samedi n'a donc pas de taux du jour.

**La règle appliquée aujourd'hui.** Le simulateur retient **le dernier jour coté
à la date demandée ou avant, en remontant au plus dix jours**. Au-delà, il
n'affiche aucun résultat plutôt qu'un montant faux.

Cette règle n'est écrite nulle part : elle a été **déduite du code**. Elle n'a
pas été modifiée, et l'extraction des taux hors des fichiers HTML l'a conservée
à l'identique.

**Pourquoi cela demande votre avis.** Le choix du jour change le montant, et
parfois nettement. Cession de 1 000 000 USD, un samedi :

| Date de cession | Jour retenu | Taux | Prix converti |
|---|---|---|---|
| samedi 5 avril 2025 | vendredi 4 avril — règle actuelle | 1,1057 | 904 404,45 € |
| samedi 5 avril 2025 | lundi 7 avril — si l'on retenait le jour suivant | 1,0967 | 911 826,39 € |

Soit **7 421,94 € de prix de cession** d'écart, donc autant de plus-value
imposable, pour un même acte.

**Ce qui a été changé.** Rien. La règle est seulement devenue visible et
vérifiable : elle est décrite dans `data/change/README.md` et un contrôle
automatique la rejoue sur 3 375 taux.

**Ce qui est attendu de vous.** Trois questions :

1. lorsqu'une date tombe un jour non coté, quel taux s'applique — celui du
   dernier jour coté **avant**, celui du premier jour coté **après**, ou une
   autre règle ?
2. la limite de dix jours de remontée est-elle acceptable ? Elle n'a d'effet
   qu'en cas de fermeture prolongée ou de date antérieure à 1999 ;
3. **d'où viennent ces taux ?** Aucune source n'était indiquée dans le fichier
   d'origine. La série commence le 4 janvier 1999, premier jour de cotation de
   l'euro, et porte les devises habituellement publiées comme taux de référence,
   ce qui suggère une reprise des taux de la Banque centrale européenne relayés
   par la Banque de France. **Ce n'est qu'une supposition** : tant qu'elle n'est
   pas confirmée, la source reste inscrite comme « inconnue ».

---

# Partie 4 — Corrections sans aucun effet sur les résultats

Mentionnées pour information et pour transparence. **Aucune ne demande de
validation de votre part** : aucun montant affiché ne change.

## 4.1 — IFI : un nom de variable contenant des caractères invisibles à l'œil

Le code du simulateur IFI contenait un nom de variable mêlant alphabet latin et
alphabet cyrillique, deux jeux de caractères dont certaines lettres sont
visuellement identiques. Un contournement avait été ajouté pour compenser. Le
tout a été remis au propre.

Les montants affichés sont rigoureusement identiques avant et après. Un contrôle
automatique interdit désormais ce type de nom dans les six simulateurs.

## 4.2 — IRPP : suppression d'un calcul inutilisé

Un bloc de calcul du plafond des dons n'était jamais utilisé et employait un
plafond de 1 000 € inscrit en dur, sans tenir compte de l'option à 2 000 €. Comme
son résultat n'était lu nulle part, sa suppression ne change aucun montant.

---

# Comment ces corrections ont été vérifiées

Pour chaque correction, la même méthode a été suivie :

1. le comportement fautif a d'abord été **reproduit** par un test automatique ;
2. les résultats des simulateurs ont été **relevés avant** toute modification, sur
   une série de situations courantes ;
3. la correction a été appliquée ;
4. les mêmes situations ont été **rejouées** : hormis le cas défectueux lui-même,
   tous les montants sont identiques au centime près.

Ces vérifications tournent automatiquement à chaque modification. Elles
garantissent qu'une correction ne déplace pas un résultat sans qu'on s'en
aperçoive.

## Une limite importante à connaître

Ces contrôles vérifient que les simulateurs **continuent de faire ce qu'ils
faisaient**. Ils ne vérifient pas que ce qu'ils font est **juridiquement exact**.

Toutes les valeurs de référence utilisées par les tests portent aujourd'hui la
mention « non validé ». Elles ont été relevées sur le comportement existant, et
non établies à partir d'une source officielle.

C'est votre validation, point par point, qui les fera passer de « non validé » à
« validé », et qui donnera aux tests la valeur d'une garantie fiscale et non
seulement technique.
