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
  }
};

  if (typeof module === 'object' && module.exports) {
    module.exports = REFERENTIELS;
  } else {
    global.REFERENTIELS = REFERENTIELS;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
