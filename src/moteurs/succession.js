/**
 * Moteur du simulateur Succession (issue #26).
 *
 * Aucun accès au DOM : le moteur reçoit un état de succession — actif, passif,
 * exonérations, héritiers, assurance-vie — et rend un résultat structuré.
 * La page lit le formulaire, appelle `calculer`, puis affiche. Le comparateur
 * de scénarios appelle le même moteur sur chaque scénario mémorisé : il ne
 * recopie plus les formules, et ne peut donc plus s'en écarter.
 *
 * Les formules sont celles de la page avant extraction. Le filet
 * `tests/integration/instantanes-dmtg.test.js` prouve qu'aucun montant ne
 * bouge.
 */

'use strict';

(function (global) {
  /**
   * Taux d'exonération partielle des biens ruraux et forestiers (art. 793 CGI)
   * et taux Dutreil par défaut (art. 787 B CGI), tels que la page les
   * appliquait. Ils n'ont pas encore été extraits vers `data/referentiels/` :
   * ils sont regroupés ici, à un seul endroit, en attendant.
   */
  var TAUX_EXONERATION = {
    dutreilParDefaut: 0.75,
    biensRurauxPlein: 0.75,
    biensRurauxReduit: 0.50,
  };

  /** Frais funéraires déductibles par défaut lorsque le champ est vide. */
  var FRAIS_FUNERAIRES_PAR_DEFAUT = 1500;

  /**
   * Lit les paramètres fiscaux dans le lecteur du référentiel DMTG.
   *
   * L'exonération du conjoint et du partenaire de PACS était écrite comme un
   * abattement infini. Le référentiel la porte comme un booléen — `Infinity`
   * n'existe pas dans un fichier de données — et elle redevient ici la valeur
   * sentinelle qu'attend le reste du calcul. Aucun montant ne change.
   */
  function parametresDepuisReferentiels(DMTG) {
    var direct = DMTG.bareme('dmtg.bareme.ligne-directe');
    var freres = DMTG.bareme('dmtg.bareme.frere-soeur');
    var neveux = DMTG.bareme('dmtg.bareme.neveu-niece');
    var tiers = DMTG.bareme('dmtg.bareme.tiers');
    var exonere = DMTG.valeur('dmtg.conjoint.exonere') ? Infinity : 0;

    return {
      liens: {
        conjoint: { label: 'Conjoint / PACS', abat: exonere, bareme: [] },
        enfant: { label: 'Enfant', abat: DMTG.valeur('dmtg.abattement.enfant'), bareme: direct },
        ascendant: { label: 'Père / Mère', abat: DMTG.valeur('dmtg.abattement.ascendant'), bareme: direct },
        petitenfant: { label: 'Petit-enfant', abat: DMTG.valeur('dmtg.abattement.petit-enfant'), bareme: direct },
        arriere: { label: 'Arrière-petit-enfant', abat: DMTG.valeur('dmtg.abattement.arriere-petit-enfant'), bareme: direct },
        frere_soeur: { label: 'Frère / Sœur', abat: DMTG.valeur('dmtg.abattement.frere-soeur'), bareme: freres },
        neveu_niece: { label: 'Neveu / Nièce', abat: DMTG.valeur('dmtg.abattement.neveu-niece'), bareme: neveux },
        handicape: { label: 'Handicapé (art. 779 II)', abat: DMTG.valeur('dmtg.abattement.handicape'), bareme: direct },
        autre: { label: 'Autre (non-parent)', abat: DMTG.valeur('dmtg.abattement.autre'), bareme: tiers },
      },
      assuranceVie: {
        avant70: {
          abattement: DMTG.valeur('dmtg.assurance-vie.avant-70.abattement'),
          bareme: DMTG.bareme('dmtg.assurance-vie.avant-70.bareme'),
        },
        apres70: {
          abattement: DMTG.valeur('dmtg.assurance-vie.apres-70.abattement'),
        },
      },
    };
  }

  /** Droits par tranches jointives sur une base nette. */
  function calcDroits(base, bareme) {
    if (!bareme || !bareme.length) return 0;
    var imp = 0;
    for (var i = 0; i < bareme.length; i += 1) {
      var t = bareme[i];
      if (base <= t.min) break;
      imp += (Math.min(base, t.max) - t.min) * t.taux;
    }
    return imp;
  }

  /** Prélèvement de l'assurance-vie avant 70 ans (art. 990 I) sur la base nette d'abattement. */
  function prelevementAssuranceVieAvant70(base, parametres) {
    if (base <= 0) return 0;
    return calcDroits(base, parametres.assuranceVie.avant70.bareme);
  }

  /**
   * Liquidation de l'actif : brut, passif, exonérations et actif net taxable.
   *
   * `s` porte les montants saisis : actifImmo, actifTitres, actifLiquidites,
   * actifAV, actifParts, actifMeubles, actifAutres, passifEmprunt, passifFisc,
   * passifAutres, passifFuneraires, dutreilValeur, dutreilTaux, ruralValeur75,
   * ruralValeur50, exoMonuments, exoAutres. Un champ absent vaut zéro, sauf
   * les frais funéraires et le taux Dutreil qui ont un défaut propre.
   */
  function calculerActif(s) {
    var n = function (cle) { return typeof s[cle] === 'number' && isFinite(s[cle]) ? s[cle] : 0; };
    var brut = n('actifImmo') + n('actifTitres') + n('actifLiquidites') + n('actifAV')
      + n('actifParts') + n('actifMeubles') + n('actifAutres');
    var funeraires = typeof s.passifFuneraires === 'number' && isFinite(s.passifFuneraires)
      ? s.passifFuneraires : FRAIS_FUNERAIRES_PAR_DEFAUT;
    var passif = n('passifEmprunt') + n('passifFisc') + n('passifAutres') + funeraires;
    var tauxDutreil = typeof s.dutreilTaux === 'number' && isFinite(s.dutreilTaux)
      ? s.dutreilTaux : TAUX_EXONERATION.dutreilParDefaut;
    var exo = {
      dutreil: n('dutreilValeur') * tauxDutreil,
      r75: n('ruralValeur75') * TAUX_EXONERATION.biensRurauxPlein,
      r50: n('ruralValeur50') * TAUX_EXONERATION.biensRurauxReduit,
      mon: n('exoMonuments'),
      aut: n('exoAutres'),
    };
    exo.total = exo.dutreil + exo.r75 + exo.r50 + exo.mon + exo.aut;
    var actifNet = Math.max(0, brut - passif);
    return {
      brut: brut,
      passif: passif,
      exo: exo,
      actifNet: actifNet,
      actifNetTaxable: Math.max(0, brut - passif - exo.total),
    };
  }

  /** Part, abattement, base et droits d'un héritier sur l'actif net taxable. */
  function calculerHeritier(h, actifNetTaxable, parametres) {
    var info = parametres.liens[h.lien] || parametres.liens.autre;
    var donations = h.donations || 0;
    var mont = actifNetTaxable * ((h.part || 0) / 100);
    var abat = info.abat === Infinity ? mont + donations : info.abat;
    var base = Math.max(0, mont + donations - abat);
    var droits = info.abat === Infinity ? 0 : calcDroits(base, info.bareme);
    return {
      id: h.id,
      nom: h.nom,
      lien: h.lien,
      part: h.part,
      donations: h.donations,
      lienLabel: info.label,
      exonere: info.abat === Infinity,
      montant: mont,
      abattementApplicable: abat,
      abat: Math.min(abat, mont + donations),
      base: base,
      droits: droits,
    };
  }

  /**
   * Calcul complet d'une succession.
   *
   * `s` : les montants de `calculerActif`, plus `heritiers` (tableau de
   * { id, nom, lien, part, donations }), `av1List` (tableau de { capital }) et
   * `av2Primes`.
   */
  function calculer(s, parametres) {
    var actif = calculerActif(s);
    var ant = actif.actifNetTaxable;

    var totMont = 0;
    var totDroits = 0;
    var totParts = 0;
    var heritiers = (s.heritiers || []).map(function (h) {
      var r = calculerHeritier(h, ant, parametres);
      totMont += r.montant;
      totDroits += r.droits;
      totParts += h.part || 0;
      return r;
    });

    var av = parametres.assuranceVie;
    var av1TotCap = 0;
    var av1TotBase = 0;
    var av1TotPrel = 0;
    (s.av1List || []).forEach(function (a) {
      var capital = a.capital || 0;
      var base = Math.max(0, capital - av.avant70.abattement);
      av1TotCap += capital;
      av1TotBase += base;
      av1TotPrel += prelevementAssuranceVieAvant70(base, parametres);
    });

    var av2primes = s.av2Primes || 0;

    return {
      brut: actif.brut,
      passif: actif.passif,
      exo: actif.exo,
      actifNet: actif.actifNet,
      actifNetTaxable: ant,
      heritiers: heritiers,
      totalMontant: totMont,
      totalDroits: totDroits,
      totalParts: totParts,
      av1TotCap: av1TotCap,
      av1TotBase: av1TotBase,
      av1TotPrel: av1TotPrel,
      av2primes: av2primes,
      av2abat: Math.min(av2primes, av.apres70.abattement),
      av2taxable: Math.max(0, av2primes - av.apres70.abattement),
    };
  }

  var api = {
    TAUX_EXONERATION: TAUX_EXONERATION,
    FRAIS_FUNERAIRES_PAR_DEFAUT: FRAIS_FUNERAIRES_PAR_DEFAUT,
    parametresDepuisReferentiels: parametresDepuisReferentiels,
    calcDroits: calcDroits,
    prelevementAssuranceVieAvant70: prelevementAssuranceVieAvant70,
    calculerActif: calculerActif,
    calculerHeritier: calculerHeritier,
    calculer: calculer,
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    global.MoteurSuccession = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
