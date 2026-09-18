/**
 * Moteur du simulateur IRPP complet (issue #22).
 *
 * Le simulateur combine impôt sur le revenu, prélèvements sociaux, CEHR, CDHR,
 * dons, plus-values mobilières et IFI. Ce fichier en porte tous les calculs,
 * sans aucun accès au DOM :
 *
 * - `calculer(s, pvRows, parametres)` est l'orchestration principale. `s`
 *   est un objet dont les clés sont les identifiants des champs du formulaire
 *   — nombres pour les montants, booléens pour les cases — afin que la page
 *   n'ait qu'à le remplir. Le résultat est structuré par section, étapes
 *   intermédiaires comprises, et la page se contente de l'afficher ;
 * - `calculerIfi` traite l'onglet IFI, qui a ses propres champs ;
 * - les briques — `impot`, `irAvecPlafonnementQuotient`, `calcCEHR`,
 *   `calculerCDHR`, `calculerDons`, `calculerLignePv`,
 *   `calculerMajorationEmploiDomicile` — sont exposées pour les tests.
 *
 * Aucun état n'est conservé entre deux appels : mêmes entrées, même résultat,
 * quel que soit l'ordre des saisies (défaut de l'issue #5, définitivement
 * clos ici). Les formules sont celles de la page avant extraction ; le filet
 * `tests/integration/instantanes-ir.test.js` prouve qu'aucun montant affiché
 * ne bouge.
 *
 * Le barème IFI et sa décote sont ceux de `src/moteurs/ifi.js`, partagés :
 * les deux simulateurs ne peuvent plus diverger (fiche 2.4).
 */

'use strict';

(function (global) {
  var MoteurIfi = (typeof module === 'object' && module.exports)
    ? require('./ifi')
    : global.MoteurIfi;

  /**
   * Taux et plafonds encore inscrits dans le code, tels que la page les
   * appliquait. Ils n'ont pas été extraits vers `data/referentiels/` : ils
   * sont regroupés ici, à un seul endroit, en attendant (voir
   * docs/INVENTAIRE_REFERENTIELS.md).
   */
  var CONSTANTES = {
    /** Abattement forfaitaire des BSPCE et des micro-BIC ventes. */
    abattementBspce: 0.71,
    /** Abattement de 10 % des pensions, avant plancher et plafond. */
    abattementPensionsTaux: 0.10,
    /** Prélèvements sociaux sur les pensions étrangères. */
    tauxPsPensionsEtrangeres: 0.092,
    /** Abattements des régimes micro, par ligne du formulaire. */
    abattementsMicro: [
      ['microfon', 0.30, 'psx_microfon'],
      ['loc', 0.30, 'psx_loc'],
      ['microbnc', 0.34, 'psx_microbnc'],
      ['microbic_vente', 0.71, 'psx_microbic_vente'],
      ['microbic_serv', 0.50, 'psx_microbic_serv'],
    ],
    /** Réductions pour dons : taux et plafonds (art. 200 CGI). */
    dons: { taux75: 0.75, taux66: 0.66, plafond66Taux: 0.20, plafond75Avant: 1000, plafond75LF2026: 2000 },
    /** Plafond de l'emploi à domicile (art. 199 sexdecies CGI). */
    emploiDomicile: { anneeReference: 2025, plafondBase: 12000, plafondInvalide: 20000, majorationUnitaire: 1500, plafondMajore: 15000, ageMajoration: 65 },
    /** Abattements pour durée de détention des plus-values mobilières (art. 150-0 D CGI). */
    abattementDureePv: {
      droitCommun: [[8, 0.65], [2, 0.5]],
      renforce: [[8, 0.85], [4, 0.65], [2, 0.5]],
    },
  };

  /** Lit les paramètres fiscaux dans les trois lecteurs de référentiels. */
  function parametresDepuisReferentiels(IR, PS, REF_IFI) {
    return {
      // Le taux des prélèvements sociaux est contesté (fiche 2.2) : ce
      // simulateur désigne explicitement sa variante par défaut, que l'écran
      // laisse modifier.
      psTauxDefaut: PS.variante('ps.taux.global', '17-2'),
      baremeIr: IR.bareme('ir.bareme.progressif'),
      pfuTauxIr: IR.valeur('pfu.taux.impot-revenu'),
      abattement: {
        salairesTaux: IR.valeur('ir.abattement.salaires.taux'),
        salairesPlafond: IR.valeur('ir.abattement.salaires.plafond'),
        pensionsTaux: IR.valeur('ir.abattement.pensions.taux'),
        pensionsPlafond: IR.valeur('ir.abattement.pensions.plafond'),
        pensionsPlancher: IR.valeur('ir.abattement.pensions.plancher'),
      },
      decote: {
        taux: IR.valeur('ir.decote.taux'),
        celibataire: { seuil: IR.valeur('ir.decote.celibataire.seuil'), montant: IR.valeur('ir.decote.celibataire.montant') },
        couple: { seuil: IR.valeur('ir.decote.couple.seuil'), montant: IR.valeur('ir.decote.couple.montant') },
      },
      cehr: {
        celibataire: IR.bareme('cehr.bareme.celibataire'),
        couple: IR.bareme('cehr.bareme.couple'),
      },
      cdhr: {
        tauxCible: IR.valeur('cdhr.taux.cible'),
        coefficientDecote: IR.valeur('cdhr.decote.coefficient'),
        seuilCelibataire: IR.valeur('cdhr.seuil.celibataire'),
        seuilCouple: IR.valeur('cdhr.seuil.couple'),
        borneHauteDecoteCelibataire: IR.valeur('cdhr.decote.borne-haute.celibataire'),
        borneHauteDecoteCouple: IR.valeur('cdhr.decote.borne-haute.couple'),
        abattementImpositionCommune: IR.valeur('cdhr.abattement.imposition-commune'),
        abattementParPersonneACharge: IR.valeur('cdhr.abattement.personne-a-charge'),
      },
      // Plafonnement du quotient familial (art. 197, I, 2 CGI), ajouté à la
      // suite de la fiche 2.3 ; méthode et plafond repris du simulateur
      // « IR, CEHR et CDHR ».
      plafondDemiPart: IR.valeur('ir.quotient.plafond-demi-part'),
      ifi: {
        bareme: REF_IFI.bareme('ifi.bareme.progressif'),
        seuil: REF_IFI.valeur('ifi.seuil.assujettissement'),
        decoteMontant: REF_IFI.valeur('ifi.decote.montant'),
        decoteTaux: REF_IFI.valeur('ifi.decote.taux'),
        decotePlafond: REF_IFI.valeur('ifi.decote.plafond'),
        abattementResidencePrincipale: REF_IFI.valeur('ifi.residence-principale.abattement'),
        reductionDonsTaux: REF_IFI.valeur('ifi.reduction.dons.taux'),
      },
    };
  }

  // ── Barème et impôt ───────────────────────────────────────────────────────

  /**
   * Barème tel que l'écran le présente : le taux de la première tranche vient
   * du référentiel, les bornes et les autres taux sont ceux du formulaire, où
   * l'utilisateur peut les ajuster. Tranches jointives (issue #7).
   */
  function baremeDepuisSaisies(s, p) {
    return [
      { de: s.t1_de, a: s.t1_a, tx: p.baremeIr[0].taux },
      { de: s.t1_a, a: s.t2_a, tx: s.t2_tx / 100 },
      { de: s.t2_a, a: s.t3_a, tx: s.t3_tx / 100 },
      { de: s.t3_a, a: s.t4_a, tx: s.t4_tx / 100 },
      { de: s.t4_a, a: Infinity, tx: s.t5_tx / 100 },
    ];
  }

  /** Impôt du barème progressif sur un revenu par part. */
  function impot(rev, bareme) {
    return bareme.reduce(function (total, t) {
      return total + Math.max(0, Math.min(rev, t.a) - t.de) * t.tx;
    }, 0);
  }

  /**
   * Impôt du foyer après plafonnement de l'avantage du quotient familial.
   * Compare l'impôt avec le nombre de parts déclaré à celui calculé avec la
   * part de référence (1 ou 2) ; si l'économie dépasse le plafond par
   * demi-part, elle est ramenée à ce plafond.
   */
  function irAvecPlafonnementQuotient(revenu, parts, partsRef, bareme, plafondDemiPart) {
    if (revenu <= 0) return 0;
    var taxN = impot(revenu / parts, bareme) * parts;
    var taxRef = impot(revenu / partsRef, bareme) * partsRef;
    var avantage = taxRef - taxN;
    var demiPartsSup = Math.max(0, parts - partsRef) * 2;
    var plafond = demiPartsSup * plafondDemiPart;
    if (avantage > plafond) return taxRef - plafond;
    return taxN;
  }

  /** CEHR : chaque tranche n'est imposée que sur la part du revenu qu'elle couvre. */
  function calcCEHR(rfr, tranches) {
    return tranches.reduce(function (total, t) {
      return total + Math.max(0, Math.min(rfr, t.max) - t.min) * t.taux;
    }, 0);
  }

  /**
   * CDHR à partir d'entrées explicites (fiche 2.1, issue #4) : la décote
   * s'applique dans la bande entre le seuil et une borne haute, et se
   * retranche de la cible avant l'imputation de l'impôt et de la CEHR déjà
   * retenus.
   */
  function calculerCDHR(entrees, cdhr) {
    var cible = entrees.rfrr * cdhr.tauxCible;
    var decote = (entrees.rfrr > entrees.seuil && entrees.rfrr <= entrees.borneHaute)
      ? Math.max(0, cible - cdhr.coefficientDecote * (entrees.rfrr - entrees.seuil))
      : 0;
    var cibleApresDecote = Math.max(0, cible - decote);
    var net = Math.max(0, cibleApresDecote - entrees.irCehr - entrees.abattementTotal);
    return {
      brut: Math.max(0, cible - entrees.irCehr - entrees.abattementTotal),
      decote: decote,
      net: net,
      seuil: entrees.seuil,
    };
  }

  /** Réductions pour dons (art. 200 CGI). Fonction pure : aucun état entre deux appels (issue #5). */
  function calculerDons(e) {
    var d = CONSTANTES.dons;
    var d75_plaf = Math.min(e.dons75, e.plafond75);
    var d75_excess = Math.max(0, e.dons75 - e.plafond75);
    var red75 = d75_plaf * d.taux75;

    var d66_total = e.dons66Directs + d75_excess;
    var rniConnu = e.rni > 0;
    var plaf66 = rniConnu ? e.rni * d.plafond66Taux : Infinity;
    var d66_pris = rniConnu ? Math.min(d66_total, plaf66) : d66_total;
    var d66_excedent = Math.max(0, d66_total - d66_pris);
    var red66 = d66_pris * d.taux66;

    var red_totale = red75 + red66;
    var total_verses = e.dons75 + e.dons66Directs;

    return {
      plafond75: e.plafond75,
      rniConnu: rniConnu,
      d75: e.dons75,
      d75_plaf: d75_plaf,
      d75_excess: d75_excess,
      red75: red75,
      d66_total: d66_total,
      plaf66: plaf66,
      d66_pris: d66_pris,
      d66_excedent: d66_excedent,
      red66: red66,
      red_totale: red_totale,
      total_verses: total_verses,
      taux_moyen: total_verses > 0 ? (red_totale / total_verses) * 100 : 0,
    };
  }

  // ── Emploi à domicile ─────────────────────────────────────────────────────

  /** Majoration du plafond de l'emploi à domicile (art. 199 sexdecies CGI). */
  function calculerMajorationEmploiDomicile(s) {
    var c = CONSTANTES.emploiDomicile;
    var hasD2 = !!s.has_d2;
    var invD1 = !!(s.inv_d1 || s.cmi_d1);
    var invD2 = hasD2 && !!(s.inv_d2 || s.cmi_d2);
    var anyInvalide = invD1 || invD2;

    var naissD1 = s.naiss_d1 > 0 ? s.naiss_d1 : 0;
    var naissD2 = s.naiss_d2 > 0 ? s.naiss_d2 : 0;
    var ageD1 = naissD1 > 0 ? c.anneeReference - naissD1 : 0;
    var ageD2 = naissD2 > 0 ? c.anneeReference - naissD2 : 0;
    var d1Sup65 = ageD1 >= c.ageMajoration;
    var d2Sup65 = hasD2 && ageD2 >= c.ageMajoration;

    var plafondBase = anyInvalide ? c.plafondInvalide : c.plafondBase;
    var mjInvalide = anyInvalide ? (c.plafondInvalide - c.plafondBase) : 0;
    var nbEnfants = Math.max(0, s.enfants_charge || 0);
    var mjEnfants = nbEnfants * c.majorationUnitaire;
    var mjAge = ((d1Sup65 ? 1 : 0) + (d2Sup65 ? 1 : 0)) * c.majorationUnitaire;
    var nbApa = Math.max(0, s.ascendants_apa || 0);
    var mjApa = nbApa * c.majorationUnitaire;
    var plafondMax = anyInvalide ? c.plafondInvalide : c.plafondMajore;

    return {
      anneeReference: c.anneeReference,
      naissD1: naissD1,
      naissD2: naissD2,
      ageD1: ageD1,
      ageD2: ageD2,
      d1Sup65: d1Sup65,
      d2Sup65: d2Sup65,
      anyInvalide: anyInvalide,
      mjInvalide: mjInvalide,
      mjEnfants: mjEnfants,
      mjAge: mjAge,
      mjApa: mjApa,
      plafondBase: plafondBase,
      plafondTotal: Math.min(plafondMax, plafondBase + mjEnfants + mjAge + mjApa),
    };
  }

  // ── Plus-values mobilières ────────────────────────────────────────────────

  /** Années pleines entre deux dates ISO ; `null` si l'une manque ou est invalide. */
  function dureeAnnees(d1, d2) {
    if (!d1 || !d2) return null;
    var a = new Date(d1);
    var b = new Date(d2);
    if (isNaN(a) || isNaN(b)) return null;
    var y = b.getFullYear() - a.getFullYear();
    if (b.getMonth() < a.getMonth() || (b.getMonth() === a.getMonth() && b.getDate() < a.getDate())) y -= 1;
    return Math.max(0, y);
  }

  /**
   * Abattement pour durée de détention (fiche 2.5) : le droit commun s'ouvre
   * dès la durée révolue, deux ans puis huit ans, comme le régime renforcé.
   */
  function tauxAbattementDuree(y, renforce) {
    if (y === null) return 0;
    var paliers = renforce ? CONSTANTES.abattementDureePv.renforce : CONSTANTES.abattementDureePv.droitCommun;
    for (var i = 0; i < paliers.length; i += 1) {
      if (y >= paliers[i][0]) return paliers[i][1];
    }
    return 0;
  }

  /** Une ligne de cession : prix de revient, produit net, plus ou moins-value, abattement, PS. */
  function calculerLignePv(r, psTaux) {
    var ba = r.pu_a * r.qte;
    var na = (ba + r.fr_a) / (r.fx_a || 1);
    var bc = r.pu_c * r.qte;
    var nc = (bc - r.fr_c) / (r.fx_c || 1);
    var pvmv = nc - na;
    var y = dureeAnnees(r.da, r.dc);
    var tx = tauxAbattementDuree(y, r.renf);
    var mt = pvmv > 0 ? pvmv * tx : 0;
    // Les PS portent sur la plus-value brute, avant abattement pour durée.
    var ps = r.psx ? Math.max(0, pvmv) * psTaux : 0;
    return { id: r.id, ba: ba, na: na, bc: bc, nc: nc, pvmv: pvmv, y: y, tx: tx, mt: mt, net: pvmv - mt, ps: ps };
  }

  /** Toutes les cessions, avec imputation des moins-values reportables. */
  function calculerPlusValues(pvRows, mvReport, psTaux) {
    var lignes = pvRows.map(function (r) { return calculerLignePv(r, psTaux); });
    var totPvmv = 0;
    var totNetRaw = 0;
    var ps = 0;
    lignes.forEach(function (c) { totPvmv += c.pvmv; totNetRaw += c.net; ps += c.ps; });
    return {
      lignes: lignes,
      mvReport: mvReport,
      totPvmv: totPvmv,
      totNetRaw: totNetRaw,
      net: Math.max(0, totNetRaw - mvReport),
      mvResiduelle: Math.max(0, mvReport - totNetRaw),
      mvImputee: mvReport > 0 ? Math.min(mvReport, Math.max(0, totNetRaw)) : 0,
      ps: ps,
    };
  }

  // ── IFI ───────────────────────────────────────────────────────────────────

  /**
   * Onglet IFI : liquidation « en deux temps » retenue par le référent fiscal
   * (fiche 2.4), avec le barème et la décote partagés de `src/moteurs/ifi.js`.
   */
  function calculerIfi(biens, s, ifi) {
    var decoteParams = { montant: ifi.decoteMontant, taux: ifi.decoteTaux, plafond: ifi.decotePlafond };
    var totVenale = 0;
    var totIfiVal = 0;
    var totDette = 0;
    var lignes = biens.map(function (b) {
      var valIfi = b.rp ? b.valeur * (1 - ifi.abattementResidencePrincipale) : b.valeur;
      var valNette = Math.max(0, valIfi - b.dette);
      totVenale += b.valeur;
      totIfiVal += valIfi;
      totDette += b.dette;
      return { id: b.id, valIfi: valIfi, valNette: valNette };
    });

    var totNetBiens = Math.max(0, totIfiVal - totDette);
    var redDons = s.ifi_dons_verses * ifi.reductionDonsTaux;
    var totDed = s.ifi_taxes + s.ifi_interets + s.ifi_depenses;
    var patBrut = totIfiVal;
    var patNetAvant = Math.max(0, patBrut - totDette - totDed);

    var decoteTheo = MoteurIfi.calcDecote(patNetAvant, decoteParams);
    var ifiTheoriqueApresDecote = Math.max(0, MoteurIfi.calcIFI(patNetAvant, ifi.bareme).total - decoteTheo);
    var ifiTheoriqueNet = Math.max(0, ifiTheoriqueApresDecote - redDons);
    var patNetApres = Math.max(0, patNetAvant - ifiTheoriqueNet);

    var definitif = MoteurIfi.calcIFI(patNetApres, ifi.bareme);
    var decote = MoteurIfi.calcDecote(patNetApres, decoteParams);
    var ifiFinal = Math.max(0, definitif.total - decote - redDons);

    return {
      lignes: lignes,
      totVenale: totVenale,
      totIfiVal: totIfiVal,
      totDette: totDette,
      totNetBiens: totNetBiens,
      totDed: totDed,
      redDons: redDons,
      patBrut: patBrut,
      patNetAvant: patNetAvant,
      ifiTheoriqueApresDecote: ifiTheoriqueApresDecote,
      patNetApres: patNetApres,
      montantsParTranche: definitif.detail.map(function (t) { return t.impot; }),
      decote: decote,
      ifiFinal: ifiFinal,
      ifiDu: patNetAvant >= ifi.seuil ? ifiFinal : 0,
      sousLeSeuil: patNetAvant < ifi.seuil,
    };
  }

  // ── Calcul principal ──────────────────────────────────────────────────────

  /**
   * Calcul complet de l'impôt du foyer.
   *
   * `s` : valeurs du formulaire par identifiant (voir `lireSaisies` dans la
   * page) ; `s.ps_taux` vaut `null` quand le champ est vide.
   * `pvRows` : les lignes de cession de l'onglet Plus-values.
   */
  function calculer(s, pvRows, p) {
    var psTaux = s.ps_taux === null || s.ps_taux === undefined ? p.psTauxDefaut : s.ps_taux / 100;
    var hasD2 = !!s.has_d2;
    var d2 = function (cle) { return hasD2 ? s[cle] : 0; };
    var bareme = baremeDepuisSaisies(s, p);

    var majoration = calculerMajorationEmploiDomicile(s);

    // ── PFU ──
    var pfu = { lignes: {}, brut: 0, ir: 0, ps: 0 };
    [['div', 'div_brut', 'div_mv', 'psx_div'], ['int', 'int_brut', 'int_mv', 'psx_int'], ['autre', 'autre_brut', 'autre_mv', 'psx_autre']]
      .forEach(function (def) {
        var base = Math.max(0, s[def[1]] - s[def[2]]);
        var ir = base * p.pfuTauxIr;
        var ps = s[def[3]] ? base * psTaux : 0;
        pfu.lignes[def[0]] = { base: base, ir: ir, ps: ps, tot: ir + ps, net: base - ir - ps };
        pfu.brut += s[def[1]];
        pfu.ir += ir;
        pfu.ps += ps;
      });
    pfu.tot = pfu.ir + pfu.ps;
    pfu.net = pfu.brut - pfu.tot;

    // ── Salaires et BSPCE ──
    var abaSal = function (b) { return Math.min(b * p.abattement.salairesTaux, s.aba_sal); };
    var salBD1 = s.sal_brut_d1;
    var salBD2 = d2('sal_brut_d2');
    var sal = { abaD1: abaSal(salBD1), abaD2: abaSal(salBD2) };
    sal.impD1 = Math.max(0, salBD1 - sal.abaD1);
    sal.impD2 = Math.max(0, salBD2 - sal.abaD2);
    sal.impTot = sal.impD1 + sal.impD2;
    sal.ps = s.psx_sal ? sal.impTot * psTaux : 0;

    var bspceBD1 = s.bspce_brut_d1;
    var bspceBD2 = d2('bspce_brut_d2');
    var bspce = { abaD1: bspceBD1 * CONSTANTES.abattementBspce, abaD2: bspceBD2 * CONSTANTES.abattementBspce };
    bspce.impD1 = Math.max(0, bspceBD1 - bspce.abaD1);
    bspce.impD2 = Math.max(0, bspceBD2 - bspce.abaD2);
    bspce.impTot = bspce.impD1 + bspce.impD2;
    bspce.ps = s.psx_bspce ? bspce.impTot * psTaux : 0;

    var salaires = {
      abaD1: sal.abaD1, impD1: sal.impD1, abaD2: sal.abaD2, impD2: sal.impD2, impTot: sal.impTot, ps: sal.ps,
      bspce: bspce,
      totD1: sal.impD1 + bspce.impD1,
      totD2: sal.impD2 + bspce.impD2,
      grandTot: sal.impTot + bspce.impTot,
      psTot: sal.ps + bspce.ps,
    };

    // ── Pensions françaises et étrangères ──
    var abaPension = function (brut) {
      var abaCalc = brut * CONSTANTES.abattementPensionsTaux;
      return {
        abaCalc: abaCalc,
        aba: Math.min(Math.max(abaCalc, brut > 0 ? p.abattement.pensionsPlancher : 0), s.aba_pen),
      };
    };
    var penBrut = s.pen_brut_d1 + d2('pen_brut_d2');
    var penAba = abaPension(penBrut);
    var pensions = {
      brut: penBrut,
      abaCalc: penAba.abaCalc,
      aba: penAba.aba,
      imp: Math.max(0, penBrut - penAba.aba),
      tauxPs: s.pen_taux_ps / 100,
    };
    pensions.ps = penBrut * pensions.tauxPs;

    var peBrut = s.pen_etr_brut_d1 + d2('pen_etr_brut_d2');
    var peAba = abaPension(peBrut);
    pensions.etr = {
      brut: peBrut,
      aba: peAba.aba,
      imp: Math.max(0, peBrut - peAba.aba),
      ps: s.psx_pen_etr ? peBrut * CONSTANTES.tauxPsPensionsEtrangeres : 0,
    };
    pensions.grandTot = pensions.imp + pensions.etr.imp;
    pensions.psTot = pensions.ps + pensions.etr.ps;

    // ── Revenus avec abattement forfaitaire (régimes micro) ──
    var abattus = { lignes: {}, impTot: 0, psTot: 0 };
    CONSTANTES.abattementsMicro.forEach(function (def) {
      var prefixe = def[0];
      var b = s[prefixe + '_brut_d1'] + d2(prefixe + '_brut_d2');
      var aba = b * def[1];
      var imp = Math.max(0, b - aba);
      var ps = s[def[2]] ? imp * psTaux : 0;
      abattus.lignes[prefixe] = { brut: b, aba: aba, imp: imp, ps: ps };
      abattus.impTot += imp;
      abattus.psTot += ps;
    });

    // ── Revenus sans abattement ──
    var reelLigne = function (prefixe, charges, psx) {
      var b = s[prefixe + '_brut_d1'] + d2(prefixe + '_brut_d2');
      var imp = Math.max(0, b - charges);
      return { brut: b, imp: imp, ps: s[psx] ? imp * psTaux : 0 };
    };
    var reel = {
      fon: reelLigne('fon', s.fon_charges, 'psx_fon'),
      bnc: reelLigne('bnc', s.bnc_charges, 'psx_bnc'),
      bic: reelLigne('bic', s.bic_charges, 'psx_bic'),
      autre: reelLigne('autre_rev', 0, 'psx_autre_rev'),
    };
    reel.impTot = reel.fon.imp + reel.bnc.imp + reel.bic.imp + reel.autre.imp;
    reel.psTot = reel.fon.ps + reel.bnc.ps + reel.bic.ps + reel.autre.ps;

    // ── Plus-values mobilières ──
    var pv = calculerPlusValues(pvRows, s.mv_report, psTaux);

    // ── Revenu imposable au barème, RFR, quotient ──
    var csgDed = s.csg_ded_montant;
    var totalBarBrut = salaires.grandTot + pensions.grandTot + abattus.impTot + reel.impTot + pv.net;
    var totalBar = Math.max(0, totalBarBrut - csgDed);
    var rfr = totalBarBrut + pfu.brut;

    var nb = Math.max(1, s.nb_parts);
    var couple = nb >= 2;
    var partsRef = couple ? 2 : 1;
    var impFoy = irAvecPlafonnementQuotient(totalBar, nb, partsRef, bareme, p.plafondDemiPart);
    pv.irEstime = impot(pv.net / nb, bareme) * nb;

    // ── Décote ──
    var decote = couple
      ? (impFoy > s.dec_cou_seuil ? 0 : Math.max(0, s.dec_cou_mt - impFoy * p.decote.taux))
      : (impFoy > s.dec_cel_seuil ? 0 : Math.max(0, s.dec_cel_mt - impFoy * p.decote.taux));

    // ── Réductions, crédits, retenues ──
    var pas = s.pas;
    var redHorsDons = s.red_scola + s.red_pens;
    var credits = s.credit;
    var retenues = s.ras + s.acomptes + s.avances;
    var psPayes = s.ps_payes;

    // Réduction dons : calculée avec le revenu net imposable à jour (issue #5).
    var dons = calculerDons({
      plafond75: s.don75_lf2026 ? CONSTANTES.dons.plafond75LF2026 : CONSTANTES.dons.plafond75Avant,
      dons75: s['don75_restoscœur'] + s.don75_secourspop + s.don75_croixrouge + s.don75_autres,
      dons66Directs: s.don66_fondations + s.don66_partis + s.don66_cultuels + s.don66_nature + s.don66_autres,
      rni: totalBar,
    });
    var redDons = dons.red_totale;
    var impNet = Math.max(0, impFoy - decote - redHorsDons - redDons - pas);

    // ── Prélèvements sociaux, CEHR, CDHR ──
    var psFonReel = reel.psTot + abattus.psTot + salaires.psTot;
    var cehr = calcCEHR(rfr, couple ? p.cehr.couple : p.cehr.celibataire);

    var rfrr = s.rfr_ret;
    var pac = Math.max(0, Math.round(s.cdhr_pac));
    var cdhr = calculerCDHR({
      rfrr: rfrr,
      irCehr: impNet + pfu.ir + cehr,
      seuil: couple ? p.cdhr.seuilCouple : p.cdhr.seuilCelibataire,
      borneHaute: couple ? p.cdhr.borneHauteDecoteCouple : p.cdhr.borneHauteDecoteCelibataire,
      abattementTotal: (couple ? s.cdhr_aba_ic : 0) + pac * s.cdhr_aba_pac,
    }, p.cdhr);

    var psTotal = pensions.ps + pensions.etr.ps + psFonReel + pfu.ps + pv.ps;
    var avance60 = s.avance_60;
    var finalVal = impNet + pfu.ir + cehr + cdhr.net + psTotal - credits - retenues - psPayes + avance60;

    return {
      psTaux: psTaux,
      hasD2: hasD2,
      abaSalVal: s.aba_sal,
      abaPenVal: s.aba_pen,
      bareme: bareme,
      majoration: majoration,
      pfu: pfu,
      salaires: salaires,
      pensions: pensions,
      abattus: abattus,
      reel: reel,
      pv: pv,
      csgDed: csgDed,
      totalBarBrut: totalBarBrut,
      totalBar: totalBar,
      rfr: rfr,
      nb: nb,
      couple: couple,
      quotient: totalBar / nb,
      impFoy: impFoy,
      decote: decote,
      pas: pas,
      redHorsDons: redHorsDons,
      credits: credits,
      retenues: retenues,
      psPayes: psPayes,
      dons: dons,
      redDons: redDons,
      impNet: impNet,
      psFonReel: psFonReel,
      cehr: cehr,
      rfrr: rfrr,
      cdhr: cdhr,
      psTotal: psTotal,
      avance60: avance60,
      final: finalVal,
    };
  }

  var api = {
    CONSTANTES: CONSTANTES,
    parametresDepuisReferentiels: parametresDepuisReferentiels,
    baremeDepuisSaisies: baremeDepuisSaisies,
    impot: impot,
    irAvecPlafonnementQuotient: irAvecPlafonnementQuotient,
    calcCEHR: calcCEHR,
    calculerCDHR: calculerCDHR,
    calculerDons: calculerDons,
    calculerMajorationEmploiDomicile: calculerMajorationEmploiDomicile,
    dureeAnnees: dureeAnnees,
    tauxAbattementDuree: tauxAbattementDuree,
    calculerLignePv: calculerLignePv,
    calculerPlusValues: calculerPlusValues,
    calculerIfi: calculerIfi,
    calculer: calculer,
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    global.MoteurIrpp = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
