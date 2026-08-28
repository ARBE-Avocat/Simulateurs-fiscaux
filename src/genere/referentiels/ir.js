/**
 * FICHIER GÉNÉRÉ — NE PAS MODIFIER À LA MAIN.
 *
 * Source de vérité : data/referentiels/ir.json
 * Régénération    : npm run donnees:generer
 *
 * Toute correction se fait dans data/, jamais ici : une modification manuelle
 * serait perdue à la prochaine génération, et « npm run donnees:generer --
 * --verifier » la signale.
 *
 * Chargé par : ir-cehr-cdhr, irpp
 */

'use strict';

(function (global) {
  var DOMAINE = {
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
        "ir-cehr-cdhr",
        "irpp"
      ],
      "source": "inconnue",
      "notes": "Fiche 2.1 de docs/CORRECTIONS_A_VALIDER.md : le référent fiscal a désigné la formule du simulateur « IR, CEHR et CDHR » comme celle qui fait foi. Le simulateur IRPP applique désormais la même bande de décote."
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
        "ir-cehr-cdhr",
        "irpp"
      ],
      "source": "inconnue",
      "notes": "Fiche 2.1 de docs/CORRECTIONS_A_VALIDER.md : même origine que cdhr.decote.borne-haute.celibataire."
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
      "notes": "Les deux simulateurs emploient désormais ce coefficient dans la même formule, celle du simulateur « IR, CEHR et CDHR », choisie par le référent fiscal (fiche 2.1 de docs/CORRECTIONS_A_VALIDER.md, issue #4)."
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
      "notes": "Tranches jointives : la borne haute appartient à la tranche, la borne basse à la précédente. Les deux simulateurs appliquent désormais cette écriture. L’IRPP faisait auparavant commencer chaque tranche un euro au-dessus de la borne précédente et rendait, pour un même revenu, un impôt inférieur de 1,27 € à celui du simulateur « IR, CEHR et CDHR » (issue #7)."
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
        "ir-cehr-cdhr",
        "irpp"
      ],
      "source": "inconnue",
      "notes": "Fiche 2.3 de docs/CORRECTIONS_A_VALIDER.md : le référent fiscal a demandé l’ajout du plafonnement dans le simulateur IRPP, avec la même méthode et le même plafond que le simulateur « IR, CEHR et CDHR ». Réserve non tranchée : l’IRPP déduit la part de référence de la case « second déclarant », faute de demander la situation familiale exacte."
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
};

  if (typeof module === 'object' && module.exports) {
    module.exports = DOMAINE;
  } else {
    global.REFERENTIELS = global.REFERENTIELS || {};
    global.REFERENTIELS["ir"] = DOMAINE;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
