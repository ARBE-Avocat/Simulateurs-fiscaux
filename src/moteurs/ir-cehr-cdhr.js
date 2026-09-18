/**
 * Moteur du simulateur « IR, CEHR et CDHR — cession de titres » (issue #23).
 *
 * Ce fichier ne connaît ni le formulaire ni l'écran. Il reçoit des nombres et
 * rend des nombres : c'est ce qui permet de le tester sans navigateur et de
 * garantir qu'un résultat ne dépend que des saisies et des paramètres.
 *
 * Trois niveaux :
 *
 * - `parametresDepuisReferentiels(IR, PS)` lit une fois les valeurs fiscales
 *   dans les lecteurs de référentiels et les range dans un objet simple. C'est
 *   la seule fonction qui touche aux référentiels ;
 * - `bareme`, `irAvecQuotientFamilial`, `cehrBareme` sont les briques, toutes
 *   pures, exposées pour les tests unitaires ;
 * - `calculer(saisies, parametres)` est l'orchestration : les trois hypothèses
 *   d'imposition d'une même cession, avec CEHR lissée, CDHR et prélèvements
 *   sociaux. Elle rend un objet structuré, que la page se contente d'afficher.
 *
 * Les formules sont celles de la page avant extraction, reprises à
 * l'identique : le filet `tests/integration/instantanes-ir.test.js` le prouve
 * au centime.
 */

'use strict';

(function (global) {
  /**
   * Lit les paramètres fiscaux dans les lecteurs de référentiels.
   *
   * `IR` et `PS` sont des lecteurs ouverts par `LectureReferentiels.lecteur`.
   * Une valeur absente fait échouer la lecture bruyamment : c'est voulu, une
   * donnée manquante est un défaut de déploiement, pas un cas de calcul.
   */
  function parametresDepuisReferentiels(IR, PS) {
    return {
      bareme: IR.bareme('ir.bareme.progressif').map(function (t) {
        return { upto: t.max, rate: t.taux };
      }),
      plafondDemiPart: IR.valeur('ir.quotient.plafond-demi-part'),
      tauxPfu: IR.valeur('pfu.taux.impot-revenu'),
      cehr: {
        celibataire: IR.bareme('cehr.bareme.celibataire'),
        couple: IR.bareme('cehr.bareme.couple'),
      },
      cdhr: {
        tauxCible: IR.valeur('cdhr.taux.cible'),
        coefficientDecote: IR.valeur('cdhr.decote.coefficient'),
        seuil: {
          celibataire: IR.valeur('cdhr.seuil.celibataire'),
          couple: IR.valeur('cdhr.seuil.couple'),
        },
        borneHauteDecote: {
          celibataire: IR.valeur('cdhr.decote.borne-haute.celibataire'),
          couple: IR.valeur('cdhr.decote.borne-haute.couple'),
        },
        abattementImpositionCommune: IR.valeur('cdhr.abattement.imposition-commune'),
        abattementParPersonneACharge: IR.valeur('cdhr.abattement.personne-a-charge'),
      },
      abattementSalaires: {
        taux: IR.valeur('ir.abattement.salaires.taux'),
        plafond: IR.valeur('ir.abattement.salaires.plafond'),
      },
      creditGarde: {
        taux: IR.valeur('ir.credit.garde-enfants.taux'),
        plafondParEnfant: IR.valeur('ir.credit.garde-enfants.plafond'),
      },
      // Le taux des prélèvements sociaux est contesté : deux simulateurs du
      // dépôt en appliquent un différent. Ce simulateur désigne explicitement
      // la variante qu'il emploie par défaut (fiche 2.2 de
      // docs/CORRECTIONS_A_VALIDER.md) ; l'écran la laisse modifiable.
      tauxPsParDefaut: PS.variante('ps.taux.global', '18-6'),
    };
  }

  /** Impôt du barème progressif sur un revenu par part. Tranches jointives. */
  function bareme(x, tranches) {
    if (x <= 0) return 0;
    var tax = 0;
    var prevCap = 0;
    for (var i = 0; i < tranches.length; i += 1) {
      var b = tranches[i];
      if (x > b.upto) {
        tax += (b.upto - prevCap) * b.rate;
        prevCap = b.upto;
      } else {
        tax += (x - prevCap) * b.rate;
        break;
      }
    }
    return tax;
  }

  /**
   * Impôt avec quotient familial, avantage plafonné par demi-part
   * supplémentaire au-delà des parts de référence.
   */
  function irAvecQuotientFamilial(revenu, parts, partsRef, parametres) {
    if (revenu <= 0) return 0;
    var taxN = bareme(revenu / parts, parametres.bareme) * parts;
    var taxRef = bareme(revenu / partsRef, parametres.bareme) * partsRef;
    var avantage = taxRef - taxN;
    var demiPartsSup = (parts - partsRef) * 2;
    var plafond = Math.max(0, demiPartsSup) * parametres.plafondDemiPart;
    if (avantage > plafond) return taxRef - plafond;
    return taxN;
  }

  /** CEHR : chaque tranche n'est imposée que sur la part du revenu qu'elle couvre. */
  function cehrBareme(rfr, tranches) {
    return tranches.reduce(function (total, t) {
      return total + Math.max(0, Math.min(rfr, t.max) - t.min) * t.taux;
    }, 0);
  }

  /**
   * Une hypothèse d'imposition de la plus-value : `pfu`, `bareme` ou
   * `quotient`. Rend l'IR net et la CDHR, sans et avec le régime des revenus
   * exceptionnels, dont le minimum est retenu.
   */
  function calculerHypothese(mode, ctx, parametres) {
    var cdhr = parametres.cdhr;
    var irQF = function (revenu) {
      return irAvecQuotientFamilial(revenu, ctx.parts, ctx.partsRef, parametres);
    };

    var irNet;
    if (mode === 'pfu') {
      irNet = irQF(ctx.salairesNets) + ctx.pvBruteCedee * parametres.tauxPfu - ctx.credit;
    } else if (mode === 'bareme') {
      irNet = irQF(ctx.salairesNets + ctx.pvNetteCedee) - ctx.credit;
    } else {
      var irOrdinaire = irQF(ctx.salairesNets);
      var irOrdPlusQuart = irQF(ctx.salairesNets + ctx.pvNetteCedee / 4);
      irNet = irOrdinaire + (irOrdPlusQuart - irOrdinaire) * 4 - ctx.credit;
    }

    // ---- CDHR sans régime exceptionnel ----
    var targetSans = ctx.rfrPlein * cdhr.tauxCible;
    var cdhrSans = Math.max(0, targetSans - (irNet + ctx.cehrNonLissee + ctx.majoration));

    // ---- CDHR avec régime exceptionnel ----
    var targetBrutExc = ctx.rfrRetraiteExc * cdhr.tauxCible;
    var decoteExc = 0;
    if (ctx.rfrRetraiteExc > ctx.decoteSeuils[0] && ctx.rfrRetraiteExc <= ctx.decoteSeuils[1]) {
      decoteExc = Math.max(
        0,
        targetBrutExc - cdhr.coefficientDecote * (ctx.rfrRetraiteExc - ctx.decoteSeuils[0]),
      );
    }
    var targetExc = targetBrutExc - decoteExc;

    var ratioExcCEHR = ctx.rfrPlein > 0 ? ctx.pvBruteCedee / ctx.rfrPlein : 0;
    var cehrRetenuExc = ctx.cehrNonLissee * (1 - ratioExcCEHR)
      + (ctx.cehrNonLissee * ratioExcCEHR) / 4;

    var irRetenuExc;
    if (mode === 'pfu') {
      irRetenuExc = irQF(ctx.salairesNets) + (ctx.pvBruteCedee * parametres.tauxPfu) / 4 - ctx.credit;
    } else {
      var rngi = ctx.salairesNets + ctx.pvNetteCedee;
      var ds = irQF(rngi);
      var ratioOrd = rngi > 0 ? ctx.salairesNets / rngi : 0;
      var ratioExc = rngi > 0 ? ctx.pvNetteCedee / rngi : 0;
      irRetenuExc = ds * ratioOrd + (ds * ratioExc) / 4 - ctx.credit;
    }

    var cdhrAvec = Math.max(0, targetExc - (irRetenuExc + cehrRetenuExc + ctx.majoration));

    return {
      irNet: irNet,
      cdhrSans: cdhrSans,
      cdhrAvec: cdhrAvec,
      cdhrRetenue: Math.min(cdhrSans, cdhrAvec),
      irRetenuExc: irRetenuExc,
      cehrRetenuExc: cehrRetenuExc,
      decoteExc: decoteExc,
      targetExc: targetExc,
      rfrRetraiteExc: ctx.rfrRetraiteExc,
    };
  }

  /**
   * Calcul complet à partir des saisies.
   *
   * `saisies` : { situation: 'couple' | 'celibataire', enfants, enfantsGarde,
   * salaire1, salaire2, fraisGarde, rfrN1, rfrN2, pvBruteTotale,
   * abattementPct (0–1), partCedeePct (0–1), tauxPS (0–1) }.
   *
   * Le salaire du second déclarant n'est retenu qu'en imposition commune.
   */
  function calculer(saisies, parametres) {
    var couple = saisies.situation === 'couple';
    var enfants = saisies.enfants;

    // ---- Parts fiscales ----
    var base = couple ? 2 : 1;
    var parts = base + Math.min(enfants, 2) * 0.5 + Math.max(0, enfants - 2) * 1;
    var partsRef = base;

    // ---- Salaires nets de l'abattement forfaitaire plafonné ----
    var aba = parametres.abattementSalaires;
    var abattt10 = function (s) { return Math.max(s * (1 - aba.taux), s - aba.plafond); };
    var salairesNets = abattt10(saisies.salaire1) + (couple ? abattt10(saisies.salaire2) : 0);

    // ---- Plus-value ----
    var pvBruteCedee = saisies.pvBruteTotale * saisies.partCedeePct;
    var pvNetteCedee = pvBruteCedee * (1 - saisies.abattementPct);

    // ---- RFR plein ----
    var rfrPlein = salairesNets + pvBruteCedee;

    // ---- Crédit d'impôt garde d'enfants ----
    var garde = parametres.creditGarde;
    var plafondGarde = garde.plafondParEnfant * Math.min(saisies.enfantsGarde, enfants);
    var credit = Math.min(saisies.fraisGarde, plafondGarde) * garde.taux;

    // ---- Seuils CEHR / CDHR ----
    var cdhr = parametres.cdhr;
    var tranchesCEHR = couple ? parametres.cehr.couple : parametres.cehr.celibataire;
    var seuilsCEHR = [tranchesCEHR[0].min, tranchesCEHR[1].min];
    var seuilCDHR = couple ? cdhr.seuil.couple : cdhr.seuil.celibataire;
    var decoteSeuils = [seuilCDHR, couple ? cdhr.borneHauteDecote.couple : cdhr.borneHauteDecote.celibataire];
    var majoration = (couple ? cdhr.abattementImpositionCommune : 0)
      + cdhr.abattementParPersonneACharge * enfants;

    // ---- CEHR non lissée ----
    var cehrNonLissee = cehrBareme(rfrPlein, tranchesCEHR);

    // ---- CEHR lissée (art. 223 sexies, II) ----
    var moyenneN1N2 = (saisies.rfrN1 + saisies.rfrN2) / 2;
    var eligibleLissage = saisies.rfrN1 <= seuilsCEHR[0] && saisies.rfrN2 <= seuilsCEHR[0]
      && rfrPlein >= 1.5 * moyenneN1N2 && moyenneN1N2 > 0;
    var cehrLissee = cehrNonLissee;
    if (eligibleLissage) {
      var excedent = rfrPlein - moyenneN1N2;
      cehrLissee = cehrBareme(moyenneN1N2 + excedent / 2, tranchesCEHR) * 2;
    }

    var ctx = {
      salairesNets: salairesNets,
      pvNetteCedee: pvNetteCedee,
      pvBruteCedee: pvBruteCedee,
      parts: parts,
      partsRef: partsRef,
      rfrPlein: rfrPlein,
      cehrNonLissee: cehrNonLissee,
      cehrLissee: cehrLissee,
      credit: credit,
      majoration: majoration,
      decoteSeuils: decoteSeuils,
      rfrRetraiteExc: salairesNets + pvBruteCedee / 4,
    };

    var hyp1 = calculerHypothese('pfu', ctx, parametres);
    var hyp2 = calculerHypothese('bareme', ctx, parametres);
    var hyp3 = calculerHypothese('quotient', ctx, parametres);

    var ps = pvBruteCedee * saisies.tauxPS;
    var totals = [hyp1, hyp2, hyp3].map(function (h) {
      return h.irNet + cehrLissee + h.cdhrRetenue + ps;
    });
    var rates = totals.map(function (t) { return rfrPlein > 0 ? (t / rfrPlein) * 100 : 0; });

    return {
      hyp1: hyp1,
      hyp2: hyp2,
      hyp3: hyp3,
      ps: ps,
      cehrLissee: cehrLissee,
      cehrNonLissee: cehrNonLissee,
      totals: totals,
      rates: rates,
      rfrPlein: rfrPlein,
      eligibleLissage: eligibleLissage,
      credit: credit,
      majoration: majoration,
    };
  }

  var api = {
    parametresDepuisReferentiels: parametresDepuisReferentiels,
    bareme: bareme,
    irAvecQuotientFamilial: irAvecQuotientFamilial,
    cehrBareme: cehrBareme,
    calculerHypothese: calculerHypothese,
    calculer: calculer,
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    global.MoteurIrCehrCdhr = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
