/**
 * FICHIER GÉNÉRÉ — NE PAS MODIFIER À LA MAIN.
 *
 * Source de vérité : data/referentiels/
 * Régénération    : npm run donnees:generer
 *
 * Toute correction se fait dans data/, jamais ici : une modification manuelle
 * serait perdue à la prochaine génération, et « npm run donnees:generer --
 * --verifier » la signale.
 */

'use strict';

(function (global) {
  var REFERENTIELS = {
  "dmtg": {
    "schema": 1,
    "domaine": "dmtg",
    "libelle": "Mutations à titre gratuit, usufruit et assurance-vie",
    "entrees": [
      {
        "id": "dmtg.abattement.arriere-petit-enfant",
        "libelle": "Abattement — arrière-petit-enfant",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 1594,
        "utilisePar": [
          "succession"
        ],
        "source": {
          "reference": "CGI art. 779",
          "dateConsultation": "2026-08-26"
        }
      },
      {
        "id": "dmtg.abattement.ascendant",
        "libelle": "Abattement — père ou mère",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 100000,
        "utilisePar": [
          "succession"
        ],
        "source": {
          "reference": "CGI art. 779",
          "dateConsultation": "2026-08-26"
        }
      },
      {
        "id": "dmtg.abattement.autre",
        "libelle": "Abattement — non-parent",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 1594,
        "utilisePar": [
          "succession",
          "demembrement"
        ],
        "source": {
          "reference": "CGI art. 779",
          "dateConsultation": "2026-08-26"
        }
      },
      {
        "id": "dmtg.abattement.enfant",
        "libelle": "Abattement — enfant",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 100000,
        "utilisePar": [
          "succession",
          "demembrement"
        ],
        "source": {
          "reference": "CGI art. 779",
          "dateConsultation": "2026-08-26"
        },
        "notes": "Le simulateur de démembrement pré-remplit cette valeur dans un champ modifiable."
      },
      {
        "id": "dmtg.abattement.frere-soeur",
        "libelle": "Abattement — frère ou sœur",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 15932,
        "utilisePar": [
          "succession",
          "demembrement"
        ],
        "source": {
          "reference": "CGI art. 779",
          "dateConsultation": "2026-08-26"
        }
      },
      {
        "id": "dmtg.abattement.handicape",
        "libelle": "Abattement — personne handicapée",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 159325,
        "utilisePar": [
          "succession"
        ],
        "source": {
          "reference": "CGI art. 779, II",
          "dateConsultation": "2026-08-26"
        }
      },
      {
        "id": "dmtg.abattement.neveu-niece",
        "libelle": "Abattement — neveu ou nièce",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 7967,
        "utilisePar": [
          "succession",
          "demembrement"
        ],
        "source": {
          "reference": "CGI art. 779",
          "dateConsultation": "2026-08-26"
        }
      },
      {
        "id": "dmtg.abattement.petit-enfant",
        "libelle": "Abattement — petit-enfant",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 1594,
        "utilisePar": [
          "succession"
        ],
        "source": {
          "reference": "CGI art. 779",
          "dateConsultation": "2026-08-26"
        }
      },
      {
        "id": "dmtg.assurance-vie.apres-70.abattement",
        "libelle": "Assurance-vie, primes versées après 70 ans — abattement global",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 30500,
        "utilisePar": [
          "succession"
        ],
        "source": "inconnue",
        "notes": "Abattement global tous bénéficiaires confondus. Aucune source ne figure dans le code."
      },
      {
        "id": "dmtg.assurance-vie.avant-70.abattement",
        "libelle": "Assurance-vie, primes versées avant 70 ans — abattement par bénéficiaire",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 152500,
        "utilisePar": [
          "succession"
        ],
        "source": "inconnue",
        "notes": "Aucune source ne figure dans le code."
      },
      {
        "id": "dmtg.assurance-vie.avant-70.bareme",
        "libelle": "Assurance-vie, primes versées avant 70 ans — prélèvement",
        "type": "bareme",
        "unite": "decimal",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": [
          {
            "borneInf": 0,
            "borneInfIncluse": false,
            "borneSup": 700000,
            "borneSupIncluse": true,
            "taux": 0.2
          },
          {
            "borneInf": 700000,
            "borneInfIncluse": false,
            "borneSup": null,
            "borneSupIncluse": false,
            "taux": 0.3125
          }
        ],
        "utilisePar": [
          "succession"
        ],
        "source": "inconnue",
        "notes": "Aucune source ne figure dans le code."
      },
      {
        "id": "dmtg.bareme.frere-soeur",
        "libelle": "Barème des droits de mutation entre frères et sœurs",
        "type": "bareme",
        "unite": "decimal",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": [
          {
            "borneInf": 0,
            "borneInfIncluse": false,
            "borneSup": 24430,
            "borneSupIncluse": true,
            "taux": 0.35
          },
          {
            "borneInf": 24430,
            "borneInfIncluse": false,
            "borneSup": null,
            "borneSupIncluse": false,
            "taux": 0.45
          }
        ],
        "utilisePar": [
          "succession"
        ],
        "source": "inconnue",
        "notes": "Aucune source ne figure dans le code."
      },
      {
        "id": "dmtg.bareme.ligne-directe",
        "libelle": "Barème des droits de mutation en ligne directe",
        "type": "bareme",
        "unite": "decimal",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": [
          {
            "borneInf": 0,
            "borneInfIncluse": false,
            "borneSup": 8072,
            "borneSupIncluse": true,
            "taux": 0.05
          },
          {
            "borneInf": 8072,
            "borneInfIncluse": false,
            "borneSup": 12109,
            "borneSupIncluse": true,
            "taux": 0.1
          },
          {
            "borneInf": 12109,
            "borneInfIncluse": false,
            "borneSup": 15932,
            "borneSupIncluse": true,
            "taux": 0.15
          },
          {
            "borneInf": 15932,
            "borneInfIncluse": false,
            "borneSup": 552324,
            "borneSupIncluse": true,
            "taux": 0.2
          },
          {
            "borneInf": 552324,
            "borneInfIncluse": false,
            "borneSup": 902838,
            "borneSupIncluse": true,
            "taux": 0.3
          },
          {
            "borneInf": 902838,
            "borneInfIncluse": false,
            "borneSup": 1805677,
            "borneSupIncluse": true,
            "taux": 0.4
          },
          {
            "borneInf": 1805677,
            "borneInfIncluse": false,
            "borneSup": null,
            "borneSupIncluse": false,
            "taux": 0.45
          }
        ],
        "utilisePar": [
          "succession",
          "demembrement"
        ],
        "source": {
          "reference": "CGI art. 777",
          "dateConsultation": "2026-08-26"
        },
        "notes": "Tranches jointives : la borne haute appartient à la tranche, la borne basse à la précédente. Référence citée par le simulateur de démembrement ; le rattachement des montants à cet article reste à confirmer."
      },
      {
        "id": "dmtg.bareme.neveu-niece",
        "libelle": "Barème des droits de mutation entre neveux et nièces",
        "type": "bareme",
        "unite": "decimal",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": [
          {
            "borneInf": 0,
            "borneInfIncluse": false,
            "borneSup": null,
            "borneSupIncluse": false,
            "taux": 0.55
          }
        ],
        "utilisePar": [
          "succession"
        ],
        "source": "inconnue",
        "notes": "Aucune source ne figure dans le code."
      },
      {
        "id": "dmtg.bareme.tiers",
        "libelle": "Barème des droits de mutation entre non-parents",
        "type": "bareme",
        "unite": "decimal",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": [
          {
            "borneInf": 0,
            "borneInfIncluse": false,
            "borneSup": null,
            "borneSupIncluse": false,
            "taux": 0.6
          }
        ],
        "utilisePar": [
          "succession"
        ],
        "source": "inconnue",
        "notes": "Aucune source ne figure dans le code."
      },
      {
        "id": "dmtg.conjoint.exonere",
        "libelle": "Exonération du conjoint survivant et du partenaire de PACS",
        "type": "booleen",
        "unite": "sans-unite",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": true,
        "utilisePar": [
          "succession"
        ],
        "source": "inconnue",
        "notes": "Le code représentait cette exonération par un abattement infini. Un booléen l'exprime sans recourir à une valeur qui n'existe pas en JSON."
      },
      {
        "id": "dmtg.usufruit.taux-nue-propriete",
        "libelle": "Barème de l’usufruit — taux de la nue-propriété selon l’âge de l’usufruitier",
        "type": "bareme",
        "unite": "decimal",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": [
          {
            "borneInf": 0,
            "borneInfIncluse": true,
            "borneSup": 20,
            "borneSupIncluse": true,
            "taux": 0.1
          },
          {
            "borneInf": 20,
            "borneInfIncluse": false,
            "borneSup": 30,
            "borneSupIncluse": true,
            "taux": 0.2
          },
          {
            "borneInf": 30,
            "borneInfIncluse": false,
            "borneSup": 40,
            "borneSupIncluse": true,
            "taux": 0.3
          },
          {
            "borneInf": 40,
            "borneInfIncluse": false,
            "borneSup": 50,
            "borneSupIncluse": true,
            "taux": 0.4
          },
          {
            "borneInf": 50,
            "borneInfIncluse": false,
            "borneSup": 60,
            "borneSupIncluse": true,
            "taux": 0.5
          },
          {
            "borneInf": 60,
            "borneInfIncluse": false,
            "borneSup": 70,
            "borneSupIncluse": true,
            "taux": 0.6
          },
          {
            "borneInf": 70,
            "borneInfIncluse": false,
            "borneSup": 80,
            "borneSupIncluse": true,
            "taux": 0.7
          },
          {
            "borneInf": 80,
            "borneInfIncluse": false,
            "borneSup": 90,
            "borneSupIncluse": true,
            "taux": 0.8
          },
          {
            "borneInf": 90,
            "borneInfIncluse": false,
            "borneSup": null,
            "borneSupIncluse": false,
            "taux": 0.9
          }
        ],
        "utilisePar": [
          "demembrement"
        ],
        "source": {
          "reference": "CGI art. 669",
          "dateConsultation": "2026-08-26"
        },
        "notes": "Les bornes sont des âges en années révolues, non des euros. Le code retient la tranche dès que l’âge est inférieur ou égal à la borne haute : un âge négatif relève donc de la première tranche et un âge de 200 ans de la dernière, sans avertissement. Point soumis au référent fiscal, fiche 3.2."
      }
    ]
  },
  "ir": {
    "schema": 1,
    "domaine": "ir",
    "libelle": "Impôt sur le revenu, CEHR, CDHR et PFU",
    "entrees": [
      {
        "id": "cdhr.abattement.imposition-commune",
        "libelle": "Contribution différentielle — abattement pour imposition commune",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 12500,
        "utilisePar": [
          "ir-cehr-cdhr",
          "irpp"
        ],
        "source": "inconnue"
      },
      {
        "id": "cdhr.abattement.personne-a-charge",
        "libelle": "Contribution différentielle — abattement par personne à charge",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 1500,
        "utilisePar": [
          "ir-cehr-cdhr",
          "irpp"
        ],
        "source": "inconnue"
      },
      {
        "id": "cdhr.decote.borne-haute.celibataire",
        "libelle": "Contribution différentielle — borne haute de la bande de décote, personne seule",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 330000,
        "utilisePar": [
          "ir-cehr-cdhr"
        ],
        "source": "inconnue",
        "notes": "Présente dans le seul simulateur « IR, CEHR et CDHR ». Le simulateur IRPP n’a pas de bande de décote. Bornes à confirmer, fiche 2.1."
      },
      {
        "id": "cdhr.decote.borne-haute.couple",
        "libelle": "Contribution différentielle — borne haute de la bande de décote, imposition commune",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 660000,
        "utilisePar": [
          "ir-cehr-cdhr"
        ],
        "source": "inconnue"
      },
      {
        "id": "cdhr.decote.coefficient",
        "libelle": "Contribution différentielle — coefficient de la décote",
        "type": "taux",
        "unite": "decimal",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 0.825,
        "utilisePar": [
          "ir-cehr-cdhr",
          "irpp"
        ],
        "source": "inconnue",
        "notes": "Les deux simulateurs emploient ce coefficient, mais pas dans la même formule ni au même endroit du calcul. La divergence porte sur la formule, non sur cette valeur : voir la fiche 2.1 de docs/CORRECTIONS_A_VALIDER.md et l’issue #4."
      },
      {
        "id": "cdhr.seuil.celibataire",
        "libelle": "Contribution différentielle — seuil d’assujettissement, personne seule",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 250000,
        "utilisePar": [
          "ir-cehr-cdhr",
          "irpp"
        ],
        "source": "inconnue"
      },
      {
        "id": "cdhr.seuil.couple",
        "libelle": "Contribution différentielle — seuil d’assujettissement, imposition commune",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 500000,
        "utilisePar": [
          "ir-cehr-cdhr",
          "irpp"
        ],
        "source": "inconnue"
      },
      {
        "id": "cdhr.taux.cible",
        "libelle": "Contribution différentielle sur les hauts revenus — taux d’imposition minimal visé",
        "type": "taux",
        "unite": "decimal",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 0.2,
        "utilisePar": [
          "ir-cehr-cdhr",
          "irpp"
        ],
        "source": "inconnue"
      },
      {
        "id": "cehr.bareme.celibataire",
        "libelle": "Contribution exceptionnelle sur les hauts revenus — personne seule",
        "type": "bareme",
        "unite": "decimal",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": [
          {
            "borneInf": 250000,
            "borneInfIncluse": false,
            "borneSup": 500000,
            "borneSupIncluse": true,
            "taux": 0.03
          },
          {
            "borneInf": 500000,
            "borneInfIncluse": false,
            "borneSup": null,
            "borneSupIncluse": false,
            "taux": 0.04
          }
        ],
        "utilisePar": [
          "ir-cehr-cdhr",
          "irpp"
        ],
        "source": "inconnue",
        "notes": "Le simulateur IRPP écrivait une tranche intermédiaire de 500 000 € à 1 000 000 € au même taux de 4 % que celle qui suit ; les deux se confondent et donnent le même impôt."
      },
      {
        "id": "cehr.bareme.couple",
        "libelle": "Contribution exceptionnelle sur les hauts revenus — imposition commune",
        "type": "bareme",
        "unite": "decimal",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": [
          {
            "borneInf": 500000,
            "borneInfIncluse": false,
            "borneSup": 1000000,
            "borneSupIncluse": true,
            "taux": 0.03
          },
          {
            "borneInf": 1000000,
            "borneInfIncluse": false,
            "borneSup": null,
            "borneSupIncluse": false,
            "taux": 0.04
          }
        ],
        "utilisePar": [
          "ir-cehr-cdhr",
          "irpp"
        ],
        "source": "inconnue"
      },
      {
        "id": "ir.abattement.pensions.plafond",
        "libelle": "Abattement forfaitaire sur les pensions — plafond par foyer",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 4439,
        "utilisePar": [
          "irpp"
        ],
        "source": "inconnue"
      },
      {
        "id": "ir.abattement.pensions.plancher",
        "libelle": "Abattement forfaitaire sur les pensions — plancher par foyer",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 442,
        "utilisePar": [
          "irpp"
        ],
        "source": "inconnue"
      },
      {
        "id": "ir.abattement.pensions.taux",
        "libelle": "Abattement forfaitaire sur les pensions — taux",
        "type": "taux",
        "unite": "decimal",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 0.1,
        "utilisePar": [
          "irpp"
        ],
        "source": "inconnue"
      },
      {
        "id": "ir.abattement.salaires.plafond",
        "libelle": "Abattement forfaitaire sur les salaires — plafond par déclarant",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 14555,
        "utilisePar": [
          "ir-cehr-cdhr",
          "irpp"
        ],
        "source": "inconnue"
      },
      {
        "id": "ir.abattement.salaires.taux",
        "libelle": "Abattement forfaitaire sur les salaires — taux",
        "type": "taux",
        "unite": "decimal",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 0.1,
        "utilisePar": [
          "ir-cehr-cdhr",
          "irpp"
        ],
        "source": "inconnue"
      },
      {
        "id": "ir.bareme.progressif",
        "libelle": "Barème progressif de l’impôt sur le revenu, par part",
        "type": "bareme",
        "unite": "decimal",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": [
          {
            "borneInf": 0,
            "borneInfIncluse": false,
            "borneSup": 11600,
            "borneSupIncluse": true,
            "taux": 0
          },
          {
            "borneInf": 11600,
            "borneInfIncluse": false,
            "borneSup": 29579,
            "borneSupIncluse": true,
            "taux": 0.11
          },
          {
            "borneInf": 29579,
            "borneInfIncluse": false,
            "borneSup": 84577,
            "borneSupIncluse": true,
            "taux": 0.3
          },
          {
            "borneInf": 84577,
            "borneInfIncluse": false,
            "borneSup": 181917,
            "borneSupIncluse": true,
            "taux": 0.41
          },
          {
            "borneInf": 181917,
            "borneInfIncluse": false,
            "borneSup": null,
            "borneSupIncluse": false,
            "taux": 0.45
          }
        ],
        "utilisePar": [
          "ir-cehr-cdhr",
          "irpp"
        ],
        "source": "inconnue",
        "notes": "Bornes et taux identiques dans les deux simulateurs. Ils ne les appliquent pas de la même façon : le simulateur IR traite les tranches comme jointives, l’IRPP fait commencer chaque tranche à la borne précédente augmentée d’un euro. L’écart atteint 1,27 € d’impôt et relève de l’issue #7 ; il tient au code, non à ces valeurs."
      },
      {
        "id": "ir.credit.garde-enfants.plafond",
        "libelle": "Crédit d’impôt pour frais de garde — plafond de dépenses par enfant",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 3500,
        "utilisePar": [
          "ir-cehr-cdhr"
        ],
        "source": "inconnue"
      },
      {
        "id": "ir.credit.garde-enfants.taux",
        "libelle": "Crédit d’impôt pour frais de garde — taux",
        "type": "taux",
        "unite": "decimal",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 0.5,
        "utilisePar": [
          "ir-cehr-cdhr"
        ],
        "source": "inconnue"
      },
      {
        "id": "ir.decote.celibataire.montant",
        "libelle": "Décote de l’impôt sur le revenu — montant fixe, personne seule",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 889,
        "utilisePar": [
          "irpp"
        ],
        "source": "inconnue"
      },
      {
        "id": "ir.decote.celibataire.seuil",
        "libelle": "Décote de l’impôt sur le revenu — seuil, personne seule",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 1965,
        "utilisePar": [
          "irpp"
        ],
        "source": "inconnue"
      },
      {
        "id": "ir.decote.couple.montant",
        "libelle": "Décote de l’impôt sur le revenu — montant fixe, imposition commune",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 1470,
        "utilisePar": [
          "irpp"
        ],
        "source": "inconnue"
      },
      {
        "id": "ir.decote.couple.seuil",
        "libelle": "Décote de l’impôt sur le revenu — seuil, imposition commune",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 3249,
        "utilisePar": [
          "irpp"
        ],
        "source": "inconnue"
      },
      {
        "id": "ir.decote.taux",
        "libelle": "Décote de l’impôt sur le revenu — taux appliqué à l’impôt",
        "type": "taux",
        "unite": "decimal",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 0.4525,
        "utilisePar": [
          "irpp"
        ],
        "source": "inconnue"
      },
      {
        "id": "ir.quotient.plafond-demi-part",
        "libelle": "Plafonnement de l’avantage en impôt procuré par une demi-part supplémentaire",
        "type": "montant",
        "unite": "EUR",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 1807,
        "utilisePar": [
          "ir-cehr-cdhr"
        ],
        "source": "inconnue",
        "notes": "Le simulateur IRPP n’applique aucun plafonnement du quotient familial : il divise par le nombre de parts sans limiter l’avantage. Divergence soumise au référent fiscal, fiche 2.3 de docs/CORRECTIONS_A_VALIDER.md, jusqu’à 19 985,10 € d’écart mesuré. Aucune valeur n’est ajoutée à l’IRPP ici : ce serait trancher."
      },
      {
        "id": "pfu.taux.impot-revenu",
        "libelle": "Prélèvement forfaitaire unique — part d’impôt sur le revenu",
        "type": "taux",
        "unite": "decimal",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "non-valide",
        "valeur": 0.128,
        "utilisePar": [
          "ir-cehr-cdhr",
          "irpp"
        ],
        "source": "inconnue"
      }
    ]
  },
  "prelevements-sociaux": {
    "schema": 1,
    "domaine": "prelevements-sociaux",
    "libelle": "Prélèvements sociaux",
    "entrees": [
      {
        "id": "ps.taux.global",
        "libelle": "Taux global des prélèvements sociaux",
        "type": "taux",
        "unite": "decimal",
        "millesime": 2025,
        "dateEffet": "inconnue",
        "dateFin": null,
        "statutValidation": "conteste",
        "variantes": [
          {
            "cle": "17-2",
            "valeur": 0.172,
            "utilisePar": [
              "irpp",
              "pv-immobiliere"
            ],
            "source": "inconnue"
          },
          {
            "cle": "18-6",
            "valeur": 0.186,
            "utilisePar": [
              "ir-cehr-cdhr"
            ],
            "source": "inconnue"
          }
        ],
        "arbitrage": {
          "question": "Quel taux de prélèvements sociaux s’applique, à quels revenus, et à compter de quelle date ? 17,2 % ou 18,6 % ?",
          "document": "docs/CORRECTIONS_A_VALIDER.md",
          "point": "2.2"
        },
        "notes": "17,2 % est inscrit en dur, à seize endroits du simulateur IRPP et à plusieurs endroits de la plus-value immobilière. 18,6 % est un champ modifiable, pré-rempli, dans le simulateur « IR, CEHR et CDHR ». Écart mesuré entre les deux : 14 000 € par million de plus-value. Aucun des deux n’est retenu comme valeur unique : chaque simulateur désigne explicitement la variante qu’il emploie aujourd’hui."
      }
    ]
  }
};

  if (typeof module === 'object' && module.exports) {
    module.exports = REFERENTIELS;
  } else {
    global.REFERENTIELS = REFERENTIELS;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
