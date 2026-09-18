/**
 * Moteur du simulateur de plus-value immobilière (issue #24).
 *
 * Aucun accès au DOM, aucun appel réseau : les taux de change à la date de
 * cession et d'acquisition sont fournis par la page, déjà résolus, ou `null`
 * s'ils ne le sont pas encore. Le moteur ne devine jamais un taux.
 *
 * `calculer` rend un résultat structuré dont le champ `etat` dit ce que la
 * page doit afficher : `incomplet`, `dates-invalides`, `taux-indisponible`,
 * `moins-value` ou `imposable`. Les montants intermédiaires — prix nets,
 * forfaits, abattements — sont toujours rendus, même sans imposition, car la
 * page les affiche au fil de la saisie.
 *
 * Les formules sont celles de la page avant extraction. Le filet
 * `tests/integration/instantanes-pv-immobiliere.test.js` prouve qu'aucun
 * montant affiché ne bouge.
 */

'use strict';

(function (global) {
  /**
   * Lit les paramètres fiscaux dans les lecteurs ouverts sur le millésime de
   * la cession. Le taux des prélèvements sociaux est contesté (fiche 2.2) :
   * ce simulateur désigne sa variante par défaut, que l'écran laisse modifier.
   */
  function parametresDepuisReferentiels(PVI, PS) {
    return {
      tauxIr: PVI.valeur('pv-immobiliere.taux.impot-revenu'),
      forfaitFraisAcquisition: PVI.valeur('pv-immobiliere.forfait.frais-acquisition'),
      forfaitTravaux: PVI.valeur('pv-immobiliere.forfait.travaux'),
      forfaitTravauxDureeMinimale: PVI.valeur('pv-immobiliere.forfait.travaux.duree-minimale'),
      abattementIr: {
        tauxAnnuel: PVI.valeur('pv-immobiliere.abattement.ir.taux-annuel'),
        anneeDebut: PVI.valeur('pv-immobiliere.abattement.ir.annee-debut'),
        anneeExoneration: PVI.valeur('pv-immobiliere.abattement.ir.annee-exoneration'),
      },
      abattementPs: {
        tauxAnnuel: PVI.valeur('pv-immobiliere.abattement.ps.taux-annuel'),
        tauxAnnee22: PVI.valeur('pv-immobiliere.abattement.ps.taux-annee-22'),
        tauxAnnuelApres22: PVI.valeur('pv-immobiliere.abattement.ps.taux-annuel-apres-22'),
        anneeExoneration: PVI.valeur('pv-immobiliere.abattement.ps.annee-exoneration'),
      },
      surtaxePaliers: PVI.valeur('pv-immobiliere.surtaxe.paliers'),
      tauxPs: PS.variante('ps.taux.global', '17-2'),
    };
  }

  /** Années pleines de détention entre deux dates ; zéro si l'ordre est inversé. */
  function anneesPleines(d1, d2) {
    if (!d1 || !d2 || d2 <= d1) return 0;
    var y = d2.getFullYear() - d1.getFullYear();
    var anniv = new Date(d1);
    anniv.setFullYear(d2.getFullYear());
    if (anniv > d2) y -= 1;
    return Math.max(0, y);
  }

  /** Abattement IR pour durée de détention — CGI art. 150 VC. */
  function abattementIr(years, p) {
    var a = p.abattementIr;
    if (years <= a.anneeDebut) return 0;
    if (years < a.anneeExoneration) return (years - a.anneeDebut) * a.tauxAnnuel;
    return 1;
  }

  /** Abattement PS pour durée de détention — CGI art. 150 VC. */
  function abattementPs(years, p) {
    var ir = p.abattementIr;
    var ps = p.abattementPs;
    var anneesTauxDeBase = ir.anneeExoneration - 1 - ir.anneeDebut;
    var acquisALaVingtDeuxieme = anneesTauxDeBase * ps.tauxAnnuel + ps.tauxAnnee22;

    if (years <= ir.anneeDebut) return 0;
    if (years < ir.anneeExoneration) return (years - ir.anneeDebut) * ps.tauxAnnuel;
    if (years === ir.anneeExoneration) return acquisALaVingtDeuxieme;
    if (years <= ps.anneeExoneration) {
      return acquisALaVingtDeuxieme + (years - ir.anneeExoneration) * ps.tauxAnnuelApres22;
    }
    return 1;
  }

  /**
   * Surtaxe sur les plus-values élevées — art. 1609 nonies G CGI.
   * Chaque palier s'applique tant que la plus-value ne dépasse pas son plafond ;
   * sur les paliers de raccordement, un lissage retranche ce qui manque pour
   * atteindre le plafond.
   */
  function surtaxe(pv, paliers) {
    for (var i = 0; i < paliers.length; i += 1) {
      var palier = paliers[i];
      if (palier.plafond === null || pv <= palier.plafond) {
        var lissage = palier.lissage ? (palier.plafond - pv) * palier.lissage : 0;
        return palier.taux * pv - lissage;
      }
    }
    return 0;
  }

  /**
   * Calcul complet.
   *
   * `s` : { dateAcquisition, dateCession (Date ou null), devise, tauxCession,
   * tauxAcquisition (nombre ou null, ignorés en euros), quotePart, nbCedants,
   * prixImmeuble, valeurMobilier, autresCession, majCesCharges, majCesAssur,
   * majCesAutres, minCesTVA, minCesInter, minCesDiag, minCesEvict, minCesArchi,
   * minCesAutres, prixAcquitte, dmtgGratuit, valeurVenale, renteViagere,
   * demembrement, autresAcqBase, chargesHorsForfait, casGratuitFrais,
   * autresMajAcq, fraisReel, travauxReel, tauxPs (nombre, ou null pour le
   * défaut du référentiel) }.
   */
  function calculer(s, p) {
    var dAcq = s.dateAcquisition;
    var dCes = s.dateCession;
    var isFx = s.devise !== 'EUR';
    var years = (dAcq && dCes) ? anneesPleines(dAcq, dCes) : null;
    var tauxPs = typeof s.tauxPs === 'number' && isFinite(s.tauxPs) ? s.tauxPs : p.tauxPs;

    var qp = (s.quotePart > 0 && s.quotePart <= 100) ? s.quotePart / 100 : 1;
    var nb = (s.nbCedants >= 1) ? s.nbCedants : 1;

    // ---- Prix de cession, en unités de la devise ----
    var cBase = s.prixImmeuble + s.valeurMobilier + s.autresCession;
    var cMaj = s.majCesCharges + s.majCesAssur + s.majCesAutres;
    var cMin = s.minCesTVA + s.minCesInter + s.minCesDiag + s.minCesEvict + s.minCesArchi + s.minCesAutres;
    var cNetCes = cBase + cMaj - cMin;

    // ---- Prix d'acquisition, en unités de la devise ----
    var cAcqBase = s.prixAcquitte + s.dmtgGratuit + s.valeurVenale + s.renteViagere + s.demembrement + s.autresAcqBase;
    var forfaitCharges = cAcqBase * p.forfaitFraisAcquisition;
    var forfaitTravaux = cAcqBase * p.forfaitTravaux;
    var chargesRetenues = s.fraisReel > 0 ? s.fraisReel : forfaitCharges;
    var travauxRetenus = s.travauxReel > 0 ? s.travauxReel : forfaitTravaux;
    var autresMajAcq = s.chargesHorsForfait + s.casGratuitFrais + s.autresMajAcq;
    var cNetAcq = cAcqBase + autresMajAcq + chargesRetenues + travauxRetenus;

    // ---- Conversion en euros ----
    var rateCes = isFx ? s.tauxCession : 1;
    var rateAcq = isFx ? s.tauxAcquisition : 1;
    var netCesEur = isFx ? (rateCes ? cNetCes / rateCes : null) : cNetCes;
    var netAcqEur = isFx ? (rateAcq ? cNetAcq / rateAcq : null) : cNetAcq;

    var r = {
      etat: null,
      isFx: isFx,
      devise: s.devise,
      years: years,
      qp: qp,
      nb: nb,
      tauxPs: tauxPs,
      forfaitTravauxTropCourt: years !== null && years < p.forfaitTravauxDureeMinimale,
      cBase: cBase, cMaj: cMaj, cMin: cMin, cNetCes: cNetCes,
      cAcqBase: cAcqBase, forfaitCharges: forfaitCharges, forfaitTravaux: forfaitTravaux,
      chargesRetenues: chargesRetenues, travauxRetenus: travauxRetenus,
      fraisReelsRetenus: s.fraisReel > 0, travauxReelsRetenus: s.travauxReel > 0,
      autresMajAcq: autresMajAcq, cNetAcq: cNetAcq,
      rateCes: rateCes, rateAcq: rateAcq,
      netCesEur: netCesEur, netAcqEur: netAcqEur,
    };

    if (!dAcq || !dCes || !cBase || !cAcqBase) { r.etat = 'incomplet'; return r; }
    if (dCes <= dAcq) { r.etat = 'dates-invalides'; return r; }
    if (isFx && (netCesEur === null || netAcqEur === null)) { r.etat = 'taux-indisponible'; return r; }

    var pvBruteRaw = netCesEur - netAcqEur;
    r.pvBruteRaw = pvBruteRaw;
    r.pvBrute = pvBruteRaw > 0 ? pvBruteRaw : 0;
    if (pvBruteRaw <= 0) { r.etat = 'moins-value'; return r; }

    var pctIR = abattementIr(years, p);
    var pctPS = abattementPs(years, p);
    r.pctIR = pctIR;
    r.pctPS = pctPS;
    r.pvNetIR = r.pvBrute * (1 - pctIR);
    r.pvNetPS = r.pvBrute * (1 - pctPS);
    r.pvImposIR = r.pvNetIR * qp;
    r.pvImposPS = r.pvNetPS * qp;
    r.ir = r.pvImposIR * p.tauxIr;
    r.ps = r.pvImposPS * tauxPs;
    r.surtaxe = surtaxe(r.pvImposIR, p.surtaxePaliers);
    r.total = r.ir + r.ps + r.surtaxe;
    r.parCedant = r.total / nb;
    r.exoIR = pctIR >= 1;
    r.exoPS = pctPS >= 1;
    r.etat = 'imposable';
    return r;
  }

  var api = {
    parametresDepuisReferentiels: parametresDepuisReferentiels,
    anneesPleines: anneesPleines,
    abattementIr: abattementIr,
    abattementPs: abattementPs,
    surtaxe: surtaxe,
    calculer: calculer,
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    global.MoteurPvImmobiliere = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
