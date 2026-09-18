/**
 * Moteur du simulateur IFI (issue #25).
 *
 * Aucun accès au DOM, aucun appel réseau. La conversion des biens en devise
 * est confiée à une fonction fournie par la page — `convertir(montant,
 * devise)` — qui rend `null` tant qu'un taux n'est pas résolu. Le moteur ne
 * traite jamais un taux manquant comme zéro : il rend `null` à son tour, et la
 * page affiche un état d'attente plutôt qu'un montant faux (fiche 4.3).
 *
 * Les formules sont celles de la page avant extraction, y compris la
 * liquidation « en deux temps » retenue par le référent fiscal (fiche 2.4).
 * Le filet `tests/integration/instantanes-ifi.test.js` prouve qu'aucun
 * montant ne bouge.
 */

'use strict';

(function (global) {
  /** Lit les paramètres fiscaux dans le lecteur du référentiel IFI. */
  function parametresDepuisReferentiels(REF) {
    return {
      bareme: REF.bareme('ifi.bareme.progressif'),
      seuilAssujettissement: REF.valeur('ifi.seuil.assujettissement'),
      decote: {
        montant: REF.valeur('ifi.decote.montant'),
        taux: REF.valeur('ifi.decote.taux'),
        plafond: REF.valeur('ifi.decote.plafond'),
      },
      abattementResidencePrincipale: REF.valeur('ifi.residence-principale.abattement'),
      exonerationBiensRuraux: {
        tauxPlein: REF.valeur('ifi.exoneration.biens-ruraux.taux-plein'),
        tauxReduit: REF.valeur('ifi.exoneration.biens-ruraux.taux-reduit'),
      },
      plafonnementTaux: REF.valeur('ifi.plafonnement.taux'),
      reductionDonsTaux: REF.valeur('ifi.reduction.dons.taux'),
    };
  }

  /** Barème progressif : total et détail par tranche. */
  function calcIFI(base, bareme) {
    var total = 0;
    var detail = [];
    for (var i = 0; i < bareme.length; i += 1) {
      var tranche = bareme[i];
      if (base <= tranche.min) {
        detail.push({ taux: tranche.taux, assiette: 0, impot: 0 });
        continue;
      }
      var upper = Math.min(base, tranche.max === Infinity ? base : tranche.max);
      var assiette = Math.max(0, upper - tranche.min);
      var impot = assiette * tranche.taux;
      total += impot;
      detail.push({ taux: tranche.taux, assiette: assiette, impot: impot });
    }
    return { total: total, detail: detail };
  }

  /** Décote pour les patrimoines sous le plafond (art. 977 CGI). */
  function calcDecote(patrimoineNet, decote) {
    if (patrimoineNet >= decote.plafond) return 0;
    return Math.max(0, decote.montant - decote.taux * patrimoineNet);
  }

  /**
   * Valeur taxable d'un bien, à partir de sa valeur déjà convertie en euros.
   * Rend `null` si la conversion n'a pas abouti.
   */
  function valeurTaxableBien(bien, valeurEur, parametres) {
    if (valeurEur === null || valeurEur === undefined) return null;
    var rpAbat = bien.rp ? (1 - parametres.abattementResidencePrincipale) : 1.0;
    var decoteAbat = bien.decote ? Math.max(0, 1 - (bien.decotePct || 0) / 100) : 1.0;
    return valeurEur * rpAbat * decoteAbat * (bien.quotePart / 100);
  }

  /**
   * Patrimoine brut taxable. Rend `null` tant qu'un bien en devise n'a pas de
   * taux résolu — jamais une somme partielle qui sous-évaluerait le patrimoine.
   */
  function patrimoineBrut(biens, convertir, parametres) {
    var indisponible = false;
    var total = 0;
    for (var i = 0; i < biens.length; i += 1) {
      var b = biens[i];
      var taxable = valeurTaxableBien(b, convertir(b.valeur, b.devise), parametres);
      if (taxable === null) { indisponible = true; continue; }
      total += taxable;
    }
    return indisponible ? null : total;
  }

  /** Exonération partielle des biens ruraux donnés à bail à long terme (art. 975 CGI). */
  function exonerationFermages(val75, val50, parametres) {
    var exo75 = val75 * parametres.exonerationBiensRuraux.tauxPlein;
    var exo50 = val50 * parametres.exonerationBiensRuraux.tauxReduit;
    return { exo75: exo75, exo50: exo50, total: exo75 + exo50 };
  }

  /**
   * Liquidation de l'IFI.
   *
   * `saisies` : { patrimoineBrut, dedTaxes, dedInterets, dedTravaux, dedAutres,
   * fermage75Valeur, fermage50Valeur, donsVerses, revenus, ir, autresImpots }.
   * Rend l'objet que la page affiche, étapes intermédiaires comprises.
   */
  function calculer(saisies, parametres) {
    var fermages = exonerationFermages(saisies.fermage75Valeur, saisies.fermage50Valeur, parametres);
    var fermageExo = fermages.total;
    var totalDed = saisies.dedTaxes + saisies.dedInterets + saisies.dedTravaux + saisies.dedAutres + fermageExo;
    var donsReduction = saisies.donsVerses * parametres.reductionDonsTaux;
    var patrimoineNet = Math.max(0, saisies.patrimoineBrut - totalDed);

    // Étape 1 : IFI théorique sur le patrimoine net, décote puis dons.
    var decote = calcDecote(patrimoineNet, parametres.decote);
    var theorique = calcIFI(patrimoineNet, parametres.bareme);
    var ifiTheoriqueApresDecote = Math.max(0, theorique.total - decote);
    var ifiTheoriqueNet = Math.max(0, ifiTheoriqueApresDecote - donsReduction);

    // Étape 2 : IFI définitif sur le patrimoine net diminué de l'IFI théorique net.
    var patrimoineNetApresIFITheo = Math.max(0, patrimoineNet - ifiTheoriqueNet);
    var decoteFinale = calcDecote(patrimoineNetApresIFITheo, parametres.decote);
    var definitif = calcIFI(patrimoineNetApresIFITheo, parametres.bareme);
    var ifiAvantDecote = definitif.total;
    var ifiApresDecote = Math.max(0, ifiAvantDecote - decoteFinale);
    var ifiApresReduction = Math.max(0, ifiApresDecote - donsReduction);

    // Plafonnement (art. 979 CGI).
    var plafond = 0;
    var reductionPlafond = 0;
    var ifiFinal = ifiApresReduction;
    if (saisies.revenus > 0) {
      plafond = saisies.revenus * parametres.plafonnementTaux;
      var totalImpots = saisies.ir + saisies.autresImpots + ifiApresReduction;
      if (totalImpots > plafond) {
        reductionPlafond = totalImpots - plafond;
        ifiFinal = Math.max(0, ifiApresReduction - reductionPlafond);
      }
    }

    return {
      patrimoineBrut: saisies.patrimoineBrut,
      totalDed: totalDed,
      patrimoineNet: patrimoineNet,
      ifiTheorique: ifiTheoriqueApresDecote,
      ifiTheoriqueNet: ifiTheoriqueNet,
      decote: decoteFinale,
      patrimoineNetApresIFITheo: patrimoineNetApresIFITheo,
      ifiAvantDecote: ifiAvantDecote,
      ifiApresDecote: ifiApresDecote,
      donsReduction: donsReduction,
      ifiApresReduction: ifiApresReduction,
      detailFinal: definitif.detail,
      revenus: saisies.revenus,
      ir: saisies.ir,
      autresImpots: saisies.autresImpots,
      plafond: plafond,
      reductionPlafond: reductionPlafond,
      ifiFinal: ifiFinal,
      fermageExo: fermageExo,
      fermages: fermages,
      sousLeSeuil: patrimoineNet < parametres.seuilAssujettissement,
    };
  }

  var api = {
    parametresDepuisReferentiels: parametresDepuisReferentiels,
    calcIFI: calcIFI,
    calcDecote: calcDecote,
    valeurTaxableBien: valeurTaxableBien,
    patrimoineBrut: patrimoineBrut,
    exonerationFermages: exonerationFermages,
    calculer: calculer,
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    global.MoteurIfi = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
