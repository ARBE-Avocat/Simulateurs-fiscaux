# Corrections à valider par le référent fiscal

Ce document s'adresse au référent juridique et fiscal du projet. Il recense les
points où le comportement d'un simulateur a été jugé fautif et modifié, ou bien
jugé fautif mais **laissé en l'état** faute de certitude.

Aucune connaissance technique n'est nécessaire pour le lire.

Dernière mise à jour : 26 août 2026 — préversion `0.4.0-beta.10`.

**Version interactive :** <https://claude.ai/code/artifact/ed86515a-2108-4df9-b7fc-acc15b0682d3>
Cette page reprend le contenu ci-dessous et permet de répondre point par point.
Les réponses y sont enregistrées et peuvent être exportées. Le présent fichier
reste la version de référence, versionnée avec le code.

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
incohérents : un plafond de 12 000 € et une réduction de 13 200 €, supérieure au
plafond. Le résultat dépendait de l'ordre dans lequel l'utilisateur avait rempli
le formulaire, ce qui n'a aucune justification fiscale.

**Ce que cela change en euros.** Revenu ramené de 200 000 € à 60 000 €, avec
20 000 € de dons à des organismes ouvrant droit à la réduction de 66 % :

| | Plafond affiché | Réduction retenue | Impôt net |
|---|---|---|---|
| Avant | 12 000 € | 13 200 € | 0,00 € |
| Après | 12 000 € | 7 920 € | 3 183,58 € |

L'écart est de **3 183,58 € d'impôt**, dans le sens favorable au contribuable :
le simulateur sous-estimait l'impôt dû.

**Ce qui est attendu de vous.** Confirmez le principe retenu : la réduction pour
dons se calcule toujours avec le revenu net imposable courant, et le résultat ne
doit jamais dépendre de l'ordre de saisie.

---

# Partie 2 — Correction **non appliquée**, en attente de votre décision

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
