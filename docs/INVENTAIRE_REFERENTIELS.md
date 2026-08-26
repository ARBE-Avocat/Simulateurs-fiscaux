# Inventaire des référentiels fiscaux

Livrable de l'issue
[#12](https://github.com/ARBE-Avocat/Simulateurs-fiscaux/issues/12), avec
`data/schema/README.md` qui définit le format d'accueil.

Relevé effectué le 26 août 2026 sur la branche `clv/y-0.5-donnees`. Il recense
**où vivent aujourd'hui les valeurs fiscales**, quel simulateur les emploie, dans
quel contexte, et ce que le dépôt sait de leur source.

Ce document ne modifie rien et ne tranche rien. Il prépare l'extraction des
issues #13 à #17.

---

## Comment lire ce document

- **Simulateurs** : quelles pages emploient la valeur.
- **Écriture actuelle** : comment elle est écrite dans le code.
- **Source dans le dépôt** : ce que le fichier indique lui-même. « aucune »
  signifie qu'aucune référence n'y figure — pas que la valeur est fausse.
- **Statut prévu** : le `statutValidation` que portera l'entrée à l'extraction,
  au sens de `data/schema/README.md` §5.

Sauf mention contraire, **le statut prévu est `non-valide`** : la valeur est
recopiée de l'existant, et seule la validation du référent fiscal la fera passer
à `valide`. Les entrées marquées `conteste` correspondent à une divergence entre
simulateurs, représentée sans être tranchée.

Clés de simulateur employées : `ir-cehr-cdhr`, `irpp`, `ifi`, `pv-immobiliere`,
`succession`, `demembrement`.

---

## 1. Vue d'ensemble par domaine

| Domaine | Fichier de destination | Simulateurs concernés | Issue d'extraction |
|---|---|---|---|
| Impôt sur le revenu, CEHR, CDHR, PFU | `data/referentiels/ir.json` | `ir-cehr-cdhr`, `irpp` | #14 |
| Prélèvements sociaux | `data/referentiels/prelevements-sociaux.json` | les trois qui les appliquent | #14 |
| IFI | `data/referentiels/ifi.json` | `ifi`, `irpp` | #15 |
| Mutations à titre gratuit, usufruit, assurance-vie | `data/referentiels/dmtg.json` | `succession`, `demembrement` | #16 — **extrait** |
| Plus-value immobilière | `data/referentiels/pv-immobiliere.json` | `pv-immobiliere` | #17 |
| Plus-value mobilière | `data/referentiels/pv-mobiliere.json` | `irpp`, `ir-cehr-cdhr` | #14 |
| Taux de change | `data/referentiels/change/` | `ifi`, `pv-immobiliere` | #13 |

---

## 2. Impôt sur le revenu, CEHR, CDHR et PFU

| Valeur | Simulateurs | Écriture actuelle | Source dans le dépôt | Statut prévu |
|---|---|---|---|---|
| Barème progressif — 0 / 11 / 30 / 41 / 45 % | `ir-cehr-cdhr`, `irpp` | constante `BAREME` d'un côté, **champs de formulaire modifiables** de l'autre | aucune | non-valide |
| Bornes du barème — 11 600, 29 579, 84 577, 181 917 € | `ir-cehr-cdhr`, `irpp` | idem | aucune | non-valide |
| Plafond de l'avantage par demi-part — 1 807 € | `ir-cehr-cdhr` **seulement** | `PLAFOND_DEMI_PART` | aucune | **conteste** — voir §8.1 |
| Abattement de 10 % sur les salaires — plafond 14 555 € par déclarant | `ir-cehr-cdhr`, `irpp` | formule en dur d'un côté, champ modifiable de l'autre | aucune | non-valide |
| Abattement de 10 % sur les pensions — plafond 4 439 € par foyer, plancher 442 € | `irpp` | champ modifiable et constante | aucune | non-valide |
| Décote de l'IR — seuils 1 965 € et 3 249 €, montants 889 € et 1 470 €, taux 45,25 % | `irpp` | champs modifiables, taux 0,4525 en dur | aucune | non-valide |
| CEHR — seuils 250 000 / 500 000 / 1 000 000 €, taux 3 % et 4 % | `ir-cehr-cdhr`, `irpp` | constantes locales dans les deux | aucune | non-valide |
| CDHR — seuil 250 000 € ou 500 000 €, taux cible 20 % | `ir-cehr-cdhr`, `irpp` | constantes locales | aucune | non-valide |
| CDHR — abattements 12 500 € pour imposition commune et 1 500 € par personne à charge | `ir-cehr-cdhr`, `irpp` | constante d'un côté, champs modifiables de l'autre | aucune | non-valide |
| CDHR — décote : formule et intervalle | `ir-cehr-cdhr`, `irpp` | **deux formules incompatibles** | aucune | **conteste** — issue #4, fiche 2.1 |
| PFU — taux d'impôt sur le revenu 12,8 % | `ir-cehr-cdhr`, `irpp` | `PFU_RATE` / `0.128` en dur | aucune | non-valide |
| Crédit d'impôt garde d'enfants — 50 %, plafond 3 500 € par enfant | `ir-cehr-cdhr` | constantes en dur | aucune | non-valide |
| Crédit emploi à domicile — plafond 12 000 €, majorations 1 500 € et 6 000 €, maximum 15 000 €, 20 000 € en cas d'invalidité | `irpp` | constantes en dur | « art. 199 sexdecies CGI » cité dans une info-bulle | non-valide |
| Réduction pour dons — 66 % et 75 %, plafond global 20 % du revenu net imposable, report 5 ans | `irpp` | constantes en dur | « art. 200 CGI », « art. 200 1° b » cités dans le texte de la page | non-valide |
| Plafond des dons à 75 % — 1 000 € puis 2 000 € | `irpp` | constantes, bascule par case à cocher | « Art. 28 LF 2026 », date du 14 octobre 2025 citée dans le texte | non-valide |
| CSG déductible — 6,8 % | `irpp` | champ modifiable | aucune | non-valide |
| Année de référence des revenus — 2025 | `irpp` | `ANNEE_REF` | pied de page : « Barème 2026 · Revenus 2025 · v4 » | non-valide |

**Point de vigilance.** Le barème et une partie des paramètres de l'IRPP sont
des **champs de formulaire modifiables par l'utilisateur**, pré-remplis dans le
HTML. Extraire ces valeurs suppose de décider si le référentiel fournit la
valeur pré-remplie tout en laissant la modification possible — ce que la fiche
1.3 de `docs/CORRECTIONS_A_VALIDER.md` soulève déjà pour le démembrement.

---

## 3. Prélèvements sociaux

| Valeur | Simulateurs | Écriture actuelle | Source dans le dépôt | Statut prévu |
|---|---|---|---|---|
| Taux global appliqué aux plus-values | `ir-cehr-cdhr` : 18,6 % · `irpp` et `pv-immobiliere` : 17,2 % | champ modifiable pré-rempli d'un côté, valeur en dur aux autres | aucune | **conteste** — fiche 2.2 |

Le taux 17,2 % apparaît **seize fois** dans le simulateur IRPP et plusieurs fois
dans la plus-value immobilière. L'extraction consiste ici autant à supprimer des
duplications qu'à externaliser une valeur.

---

## 4. Impôt sur la fortune immobilière

| Valeur | Simulateurs | Écriture actuelle | Source dans le dépôt | Statut prévu |
|---|---|---|---|---|
| Barème — 0 / 0,5 / 0,7 / 1 / 1,25 / 1,5 % | `ifi`, `irpp` | constante `BAREME` d'un côté, tableau local de l'autre. Écritures différentes, valeurs identiques | aucune | non-valide |
| Bornes — 800 000, 1 300 000, 2 570 000, 5 000 000, 10 000 000 € | `ifi`, `irpp` | `{min, max}` d'un côté, `{de, a}` de l'autre, toutes deux en « borne + 1 » | aucune | non-valide |
| Seuil d'assujettissement — 1 300 000 € | `ifi`, `irpp` | constante locale | aucune | non-valide |
| Décote — 17 500 € − 1,25 % du patrimoine, plafond 1 400 000 € | `ifi`, `irpp` | **conditions et bases différentes** | commentaire de code, sans référence | **conteste** — fiche 2.4 |
| Méthode de liquidation — IFI théorique déduit de l'assiette, ou calcul unique | `ifi`, `irpp` | deux méthodes différentes | aucune | **conteste** — fiche 2.4 |
| Abattement de 30 % sur la résidence principale | `ifi`, `irpp` | `0.70` en dur dans les deux | libellé d'info-bulle | non-valide |
| Exonération des biens ruraux — 75 % et 50 % | `ifi` | constantes en dur | « art. 975 II CGI » cité à l'affichage | non-valide |
| Plafonnement — 75 % des revenus | `ifi` | constante en dur | texte de la page | non-valide |
| Réduction pour dons IFI — 75 % | `ifi`, `irpp` | constante en dur | « art. 978 CGI » cité dans un commentaire | non-valide |

---

## 5. Mutations à titre gratuit, usufruit et assurance-vie

| Valeur | Simulateurs | Écriture actuelle | Source dans le dépôt | Statut prévu |
|---|---|---|---|---|
| Barème en ligne directe — 7 tranches, 5 % à 45 % | `succession`, `demembrement` | `BAREME_DIRECT` d'un côté, champs modifiables de l'autre | « CGI art. 777 » cité dans un avertissement du démembrement | non-valide |
| Bornes — 8 072, 12 109, 15 932, 552 324, 902 838, 1 805 677 € | `succession`, `demembrement` | idem | idem | non-valide |
| Barème frères et sœurs — 35 % puis 45 %, borne 24 430 € | `succession` | `BAREME_FRERES` | aucune | non-valide |
| Barème neveux et nièces — 55 % | `succession` | `BAREME_NEVEUX` | aucune | non-valide |
| Barème autres — 60 % | `succession` | `BAREME_TIERS` | aucune | non-valide |
| Abattement ligne directe — 100 000 € | `succession`, `demembrement` | table `LIENS` / champ modifiable | « CGI art. 779-I » cité dans le démembrement | non-valide |
| Abattement frères et sœurs — 15 932 € | `succession`, `demembrement` | idem | idem | non-valide |
| Abattement neveux et nièces — 7 967 € | `succession`, `demembrement` | idem | idem | non-valide |
| Abattement par défaut — 1 594 € | `succession`, `demembrement` | idem | idem | non-valide |
| Abattement personne handicapée — 159 325 € | `succession` | table `LIENS` | « art. 779 II » dans le libellé | non-valide |
| Exonération du conjoint et du partenaire de PACS | `succession` | abattement `Infinity`, barème vide | aucune | non-valide |
| Barème de l'usufruit par tranche d'âge — 10 % à 90 % | `demembrement` | fonction `getTauxNP`, seuils tous les 10 ans | « CGI art. 669 » cité en commentaire | non-valide |
| Assurance-vie, primes avant 70 ans — abattement 152 500 €, prélèvement 20 % jusqu'à 700 000 € puis 31,25 % | `succession` | `AV1_ABAT` et fonction dédiée | texte de la page | non-valide |
| Assurance-vie, primes après 70 ans — abattement global 30 500 € | `succession` | valeur en dur, répétée à trois endroits | texte de la page | non-valide |
| Rappel fiscal des donations — 15 ans | `succession` | libellé et champ de saisie | « art. 784 CGI » cité dans le texte | non-valide |

**Extraction réalisée (#16).** Ces valeurs vivent désormais dans
`data/referentiels/dmtg.json` et les deux simulateurs les lisent. La colonne
« écriture actuelle » ci-dessus décrit donc l'état d'avant.

Le duplicat qui motivait l'extraction est supprimé : le barème en ligne directe
et les abattements existaient en deux exemplaires — constantes figées dans la
succession, champs modifiables dans le démembrement — dont rien ne garantissait
la synchronisation.

Deux points subsistent : l'abattement infini du conjoint est devenu un booléen
`dmtg.conjoint.exonere`, `Infinity` n'existant pas dans un fichier de données ;
et les valeurs pré-remplies des champs modifiables du démembrement restent
écrites dans des attributs `value` du HTML. Un contrôle automatique
(`tests/unit/coherence-referentiels.test.js`) interdit qu'elles divergent des
données ; leur génération relève d'une étape ultérieure.

---

## 6. Plus-value immobilière

| Valeur | Simulateurs | Écriture actuelle | Source dans le dépôt | Statut prévu |
|---|---|---|---|---|
| Taux d'impôt sur le revenu — 19 % | `pv-immobiliere` | `0.19` en dur | aucune | non-valide |
| Abattement pour durée, impôt sur le revenu — 6 % par an de la 6ᵉ à la 21ᵉ année, exonération à la 22ᵉ | `pv-immobiliere` | fonction `abatIR` | « CGI art. 150 VC » en commentaire | non-valide |
| Abattement pour durée, prélèvements sociaux — 1,65 % par an, 1,60 % la 22ᵉ année, 9 % par an ensuite, exonération à la 30ᵉ | `pv-immobiliere` | fonction `abatPS` | « CGI art. 150 VC » en commentaire | non-valide |
| Surtaxe des plus-values supérieures à 50 000 € — paliers de 2 % à 6 % | `pv-immobiliere` | fonction `surtaxe`, onze paliers en dur | « art. 1609 nonies G CGI / BOI-RFPI-TPVIE-20 » en commentaire | non-valide |
| Forfait de frais d'acquisition — 7,5 % | `pv-immobiliere` | `0.075` en dur | texte de la page | non-valide |
| Forfait de travaux — 15 %, immeubles bâtis détenus depuis plus de 5 ans | `pv-immobiliere` | `0.15` en dur | texte de la page | non-valide |

---

## 7. Plus-value mobilière

| Valeur | Simulateurs | Écriture actuelle | Source dans le dépôt | Statut prévu |
|---|---|---|---|---|
| Abattement de droit commun pour durée — 50 % puis 65 % | `irpp` | fonction `abTx` | aucune | non-valide |
| Abattement renforcé — 50 %, 65 % puis 85 % | `irpp` | même fonction | « BSPCE, PME < 10 ans » mentionné dans le texte | non-valide |

**Incohérence de bornes relevée.** Dans la même expression, l'abattement
renforcé emploie des comparaisons **au moins** — 2, 4 et 8 ans inclus — tandis
que l'abattement de droit commun emploie des comparaisons **strictement
supérieur** : la 2ᵉ et la 8ᵉ année n'ouvrent pas droit au palier. Les deux
écritures ne peuvent pas être justes en même temps. Ce point rejoint l'issue #7
et la question des bornes ; il n'a pas d'écart chiffré tant que la convention
n'est pas tranchée, la durée de détention étant un entier d'années.

---

## 8. Divergences à représenter avec le statut `conteste`

Aucune n'est tranchée par l'extraction. Chacune est décrite en langage clair
dans `docs/CORRECTIONS_A_VALIDER.md` et soumise au référent fiscal.

| # | Règle | Valeurs concurrentes | Écart mesuré | Fiche |
|---|---|---|---|---|
| 8.1 | Plafonnement de l'avantage par demi-part | appliqué dans `ir-cehr-cdhr`, absent de `irpp` | jusqu'à 19 985,10 € | 2.3 |
| 8.2 | Décote de la CDHR | deux formules et deux intervalles | jusqu'à 49 999 € | 2.1 · issue #4 |
| 8.3 | Taux des prélèvements sociaux | 17,2 % contre 18,6 % | 14 000 € par million de plus-value | 2.2 |
| 8.4 | Méthode de liquidation de l'IFI et décote | deux méthodes | 668,39 € sur l'exemple relevé | 2.4 |

Les points 8.1 et 8.4 ont été découverts pendant ce relevé. Ils confirment
l'attendu du plan d'action : passer chaque valeur en revue oblige à la regarder.

---

## 9. Taux de change

| Valeur | Simulateurs | Écriture actuelle | Source dans le dépôt |
|---|---|---|---|
| Taux de repli — 25 devises | `ifi` | constante `FX_FALLBACK`, sans date | aucune |
| Historique quotidien — 29 devises, plusieurs mois | `pv-immobiliere` | objet `FX` embarqué, **une seule ligne de plusieurs mégaoctets** | aucune |
| Taux du jour | `ifi` | appels réseau à `exchangerate-api.com` puis à la BCE | l'origine est visible dans le code |

Le change n'est pas une donnée fiscale : il ne porte ni date d'effet ni statut de
validation au même sens. Il relève de l'issue #13 et d'un fichier distinct, avec
sa propre notion de date de cotation et de jours non cotés — c'est l'objet de
l'issue #1.

Le fichier de la plus-value immobilière pèse aujourd'hui 3,8 Mo, presque
entièrement à cause de ce bloc. Le sortir du HTML est le gain le plus visible du
chantier.

---

## 10. Ce que cet inventaire ne fait pas

- Il ne relève pas les valeurs d'affichage, de mise en page ni les libellés.
- Il ne vérifie **aucune** valeur auprès d'une source officielle : les colonnes
  « source dans le dépôt » rapportent ce que le code affirme, rien de plus.
- Il ne préjuge pas du découpage définitif des fichiers de `data/referentiels/`,
  qui pourra évoluer au fil des extractions.
- Il ne tranche aucune divergence.
