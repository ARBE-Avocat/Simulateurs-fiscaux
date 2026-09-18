/**
 * Moteur du simulateur Démembrement — donation en nue-propriété (issue #27).
 *
 * Aucun accès au DOM. Le moteur reçoit l'âge de l'usufruitier, la valeur en
 * pleine propriété, le nombre de donataires, le lien de parenté, la nature de
 * l'opération et les paramètres du barème — que l'écran laisse modifier — et
 * rend un résultat structuré.
 *
 * Les formules sont celles de la page avant extraction. Le filet
 * `tests/integration/instantanes-dmtg.test.js` prouve qu'aucun montant
 * affiché ne bouge.
 */

'use strict';

(function (global) {
  /** Valeurs par défaut du référentiel DMTG : barème de l'usufruit, abattements, tranches. */
  function parametresDepuisReferentiels(DMTG) {
    return {
      usufruit: DMTG.bareme('dmtg.usufruit.taux-nue-propriete'),
      abattements: {
        directe: DMTG.valeur('dmtg.abattement.enfant'),
        frere: DMTG.valeur('dmtg.abattement.frere-soeur'),
        neveu: DMTG.valeur('dmtg.abattement.neveu-niece'),
        autre: DMTG.valeur('dmtg.abattement.autre'),
      },
      tranches: DMTG.bareme('dmtg.bareme.ligne-directe'),
    };
  }

  /**
   * Taux de la nue-propriété selon l'âge de l'usufruitier (CGI art. 669).
   *
   * Comportement inchangé : la première tranche dont la borne haute n'est pas
   * dépassée l'emporte. Un âge négatif relève donc toujours de la première
   * tranche, et un âge aberrant de la dernière — anomalie soumise au référent
   * fiscal, fiche 3.2 de docs/CORRECTIONS_A_VALIDER.md.
   */
  function tauxNuePropriete(age, usufruit) {
    for (var i = 0; i < usufruit.length; i += 1) {
      if (age <= usufruit[i].max) return usufruit[i].taux;
    }
    return usufruit[usufruit.length - 1].taux;
  }

  /** Abattement (CGI art. 779) selon le lien de parenté, dans les abattements fournis. */
  function abattementPour(lien, abattements) {
    switch (lien) {
      case 'directe': return abattements.directe;
      case 'frere': return abattements.frere;
      case 'neveu': return abattements.neveu;
      default: return abattements.autre;
    }
  }

  /**
   * Droits par tranches. Les tranches sont celles de l'écran :
   * `{ low, high, taux }`, `high` valant `Infinity` pour la dernière.
   * Rend le total et le détail par tranche, pour le tableau du barème.
   */
  function calcDroits(base, tranches) {
    var droits = 0;
    var detail = [];
    for (var i = 0; i < tranches.length; i += 1) {
      var t = tranches[i];
      if (base <= t.low) {
        detail.push({ montant: 0, droits: 0, taux: t.taux, low: t.low, high: t.high });
        continue;
      }
      var montant = Math.min(base, t.high === Infinity ? base : t.high) - t.low;
      var d = montant * t.taux;
      droits += d;
      detail.push({ montant: montant, droits: d, taux: t.taux, low: t.low, high: t.high });
    }
    return { droits: droits, detail: detail };
  }

  /**
   * Calcul complet d'une donation.
   *
   * `saisies` : { age, nbDonataires (≥ 1), valeurPP, lien, nature: 'np' | 'pp' }.
   * `parametres` : { usufruit, abattements: { directe, frere, neveu, autre },
   * tranches } — les abattements et tranches sont ceux affichés à l'écran,
   * éventuellement modifiés par l'utilisateur.
   */
  function calculer(saisies, parametres) {
    var nb = saisies.nbDonataires;
    var vpp = saisies.valeurPP;
    var enNuePropriete = saisies.nature === 'np';

    var tauxNP = enNuePropriete ? tauxNuePropriete(saisies.age, parametres.usufruit) : 1.0;
    var tauxUSU = 1 - tauxNP;

    var valeurNP = vpp * tauxNP;
    var valeurUSU = vpp * tauxUSU;
    var partParDona = valeurNP / nb;

    var aba = abattementPour(saisies.lien, parametres.abattements);
    var abaTotal = aba * nb;
    var baseNetteParDona = Math.max(0, partParDona - aba);
    var baseNetteTotale = baseNetteParDona * nb;

    var droits = calcDroits(baseNetteParDona, parametres.tranches);
    var droitsTotaux = droits.droits * nb;

    return {
      enNuePropriete: enNuePropriete,
      tauxNP: tauxNP,
      tauxUSU: tauxUSU,
      valeurPP: vpp,
      valeurNP: valeurNP,
      valeurUSU: valeurUSU,
      nbDonataires: nb,
      partParDona: partParDona,
      abattement: aba,
      abattementTotal: abaTotal,
      baseNetteParDona: baseNetteParDona,
      baseNetteTotale: baseNetteTotale,
      droitsParDona: droits.droits,
      droitsTotaux: droitsTotaux,
      detail: droits.detail,
      tauxEffectif: valeurNP > 0 ? droitsTotaux / valeurNP : 0,
    };
  }

  var api = {
    parametresDepuisReferentiels: parametresDepuisReferentiels,
    tauxNuePropriete: tauxNuePropriete,
    abattementPour: abattementPour,
    calcDroits: calcDroits,
    calculer: calculer,
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    global.MoteurDemembrement = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
