/**
 * FICHIER GÉNÉRÉ — NE PAS MODIFIER À LA MAIN.
 *
 * Source de vérité : data/referentiels/ifi.json
 * Régénération    : npm run donnees:generer
 *
 * Toute correction se fait dans data/, jamais ici : une modification manuelle
 * serait perdue à la prochaine génération, et « npm run donnees:generer --
 * --verifier » la signale.
 *
 * Chargé par : ifi, irpp
 */

'use strict';

(function (global) {
  var DOMAINE = {
  "schema": 1,
  "domaine": "ifi",
  "libelle": "Impôt sur la fortune immobilière",
  "entrees": [
    {
      "id": "ifi.bareme.progressif",
      "libelle": "Barème progressif de l’impôt sur la fortune immobilière",
      "type": "bareme",
      "unite": "decimal",
      "millesime": 2026,
      "dateEffet": "inconnue",
      "dateFin": null,
      "statutValidation": "non-valide",
      "valeur": [
        {
          "borneInf": 0,
          "borneInfIncluse": true,
          "borneSup": 800000,
          "borneSupIncluse": true,
          "taux": 0
        },
        {
          "borneInf": 800001,
          "borneInfIncluse": true,
          "borneSup": 1300000,
          "borneSupIncluse": true,
          "taux": 0.005
        },
        {
          "borneInf": 1300001,
          "borneInfIncluse": true,
          "borneSup": 2570000,
          "borneSupIncluse": true,
          "taux": 0.007
        },
        {
          "borneInf": 2570001,
          "borneInfIncluse": true,
          "borneSup": 5000000,
          "borneSupIncluse": true,
          "taux": 0.01
        },
        {
          "borneInf": 5000001,
          "borneInfIncluse": true,
          "borneSup": 10000000,
          "borneSupIncluse": true,
          "taux": 0.0125
        },
        {
          "borneInf": 10000001,
          "borneInfIncluse": true,
          "borneSup": null,
          "borneSupIncluse": false,
          "taux": 0.015
        }
      ],
      "utilisePar": [
        "ifi",
        "irpp"
      ],
      "source": "inconnue",
      "notes": "Écriture reprise telle quelle des deux simulateurs : chaque tranche commence à la borne haute précédente augmentée d’un euro, ce qui laisse cinq intervalles d’un euro sans taux. Écart cumulé mesuré : 0,05 €. La validation le signale ; la correction relève de l’issue #7."
    },
    {
      "id": "ifi.decote.montant",
      "libelle": "Décote — montant fixe",
      "type": "montant",
      "unite": "EUR",
      "millesime": 2026,
      "dateEffet": "inconnue",
      "dateFin": null,
      "statutValidation": "non-valide",
      "valeur": 17500,
      "utilisePar": [
        "ifi",
        "irpp"
      ],
      "source": "inconnue",
      "notes": "Les deux simulateurs emploient cette formule mais ne l’appliquent ni au même patrimoine ni sous la même condition, et l’un retranche l’IFI théorique de l’assiette avant de recalculer. Divergence de méthode soumise au référent fiscal, fiche 2.4 de docs/CORRECTIONS_A_VALIDER.md : 668,39 € d’écart mesuré. Ces valeurs, elles, sont identiques des deux côtés."
    },
    {
      "id": "ifi.decote.plafond",
      "libelle": "Décote — patrimoine au-delà duquel elle ne s’applique plus",
      "type": "montant",
      "unite": "EUR",
      "millesime": 2026,
      "dateEffet": "inconnue",
      "dateFin": null,
      "statutValidation": "non-valide",
      "valeur": 1400000,
      "utilisePar": [
        "ifi",
        "irpp"
      ],
      "source": "inconnue"
    },
    {
      "id": "ifi.decote.taux",
      "libelle": "Décote — taux appliqué au patrimoine",
      "type": "taux",
      "unite": "decimal",
      "millesime": 2026,
      "dateEffet": "inconnue",
      "dateFin": null,
      "statutValidation": "non-valide",
      "valeur": 0.0125,
      "utilisePar": [
        "ifi",
        "irpp"
      ],
      "source": "inconnue"
    },
    {
      "id": "ifi.exoneration.biens-ruraux.taux-plein",
      "libelle": "Exonération des biens ruraux loués à long terme — taux plein",
      "type": "taux",
      "unite": "decimal",
      "millesime": 2026,
      "dateEffet": "inconnue",
      "dateFin": null,
      "statutValidation": "non-valide",
      "valeur": 0.75,
      "utilisePar": [
        "ifi"
      ],
      "source": {
        "reference": "CGI art. 975, II",
        "dateConsultation": "2026-08-26"
      }
    },
    {
      "id": "ifi.exoneration.biens-ruraux.taux-reduit",
      "libelle": "Exonération des biens ruraux loués à long terme — taux réduit au-delà du seuil",
      "type": "taux",
      "unite": "decimal",
      "millesime": 2026,
      "dateEffet": "inconnue",
      "dateFin": null,
      "statutValidation": "non-valide",
      "valeur": 0.5,
      "utilisePar": [
        "ifi"
      ],
      "source": {
        "reference": "CGI art. 975, II",
        "dateConsultation": "2026-08-26"
      }
    },
    {
      "id": "ifi.plafonnement.taux",
      "libelle": "Plafonnement — part maximale des revenus que peuvent représenter IFI et impôts sur les revenus",
      "type": "taux",
      "unite": "decimal",
      "millesime": 2026,
      "dateEffet": "inconnue",
      "dateFin": null,
      "statutValidation": "non-valide",
      "valeur": 0.75,
      "utilisePar": [
        "ifi"
      ],
      "source": "inconnue"
    },
    {
      "id": "ifi.reduction.dons.taux",
      "libelle": "Réduction d’impôt pour dons",
      "type": "taux",
      "unite": "decimal",
      "millesime": 2026,
      "dateEffet": "inconnue",
      "dateFin": null,
      "statutValidation": "non-valide",
      "valeur": 0.75,
      "utilisePar": [
        "ifi",
        "irpp"
      ],
      "source": {
        "reference": "CGI art. 978",
        "dateConsultation": "2026-08-26"
      }
    },
    {
      "id": "ifi.residence-principale.abattement",
      "libelle": "Abattement sur la résidence principale",
      "type": "taux",
      "unite": "decimal",
      "millesime": 2026,
      "dateEffet": "inconnue",
      "dateFin": null,
      "statutValidation": "non-valide",
      "valeur": 0.3,
      "utilisePar": [
        "ifi",
        "irpp"
      ],
      "source": "inconnue",
      "notes": "Écrit dans le code sous la forme d’un coefficient de 0,70 appliqué à la valeur du bien."
    },
    {
      "id": "ifi.seuil.assujettissement",
      "libelle": "Seuil d’assujettissement à l’IFI",
      "type": "montant",
      "unite": "EUR",
      "millesime": 2026,
      "dateEffet": "inconnue",
      "dateFin": null,
      "statutValidation": "non-valide",
      "valeur": 1300000,
      "utilisePar": [
        "ifi",
        "irpp"
      ],
      "source": "inconnue"
    }
  ]
};

  if (typeof module === 'object' && module.exports) {
    module.exports = DOMAINE;
  } else {
    global.REFERENTIELS = global.REFERENTIELS || {};
    global.REFERENTIELS["ifi"] = DOMAINE;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
