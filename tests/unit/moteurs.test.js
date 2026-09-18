/**
 * Les six moteurs de `src/moteurs/` s'exécutent sans page ni faux DOM (#21).
 *
 * Ces tests ne jugent aucune règle fiscale : les montants sont figés par les
 * instantanés d'intégration. Ils vérifient ce que le découplage garantit —
 * un moteur se charge par `require`, reçoit toutes ses entrées explicitement,
 * ne conserve aucun état, et rend un résultat structuré dont les étapes
 * intermédiaires se recoupent.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { lecteur } = require('../helpers/referentiels');
const { assertProche } = require('../helpers/assertions');

const MoteurIr = require('../../src/moteurs/ir-cehr-cdhr');
const MoteurPv = require('../../src/moteurs/pv-immobiliere');
const MoteurIfi = require('../../src/moteurs/ifi');
const MoteurSuccession = require('../../src/moteurs/succession');
const MoteurDemembrement = require('../../src/moteurs/demembrement');
const MoteurIrpp = require('../../src/moteurs/irpp');

/** Recopie une valeur venue du contexte isolé des lecteurs. */
const recopier = (valeur) => JSON.parse(JSON.stringify(valeur));

// ── IR, CEHR et CDHR ────────────────────────────────────────────────────────

test('moteur IR — mêmes saisies, même résultat, sans état entre deux appels', () => {
  const p = MoteurIr.parametresDepuisReferentiels(lecteur('ir'), lecteur('prelevements-sociaux'));
  const saisies = {
    situation: 'couple', enfants: 2, enfantsGarde: 1, salaire1: 80000, salaire2: 40000,
    fraisGarde: 3000, rfrN1: 100000, rfrN2: 100000, pvBruteTotale: 1000000,
    abattementPct: 0, partCedeePct: 1, tauxPS: p.tauxPsParDefaut,
  };
  const a = MoteurIr.calculer(saisies, p);
  const b = MoteurIr.calculer(saisies, p);
  assert.deepEqual(a, b);
  assert.equal(a.totals.length, 3);
  a.totals.forEach((t, i) => {
    const h = [a.hyp1, a.hyp2, a.hyp3][i];
    assertProche(t, h.irNet + a.cehrLissee + h.cdhrRetenue + a.ps, 1e-6, `total de l'hypothèse ${i + 1}`);
  });
});

test('moteur IR — la CDHR retenue est le minimum des deux régimes', () => {
  const p = MoteurIr.parametresDepuisReferentiels(lecteur('ir'), lecteur('prelevements-sociaux'));
  const r = MoteurIr.calculer({
    situation: 'celibataire', enfants: 0, enfantsGarde: 0, salaire1: 200000, salaire2: 0,
    fraisGarde: 0, rfrN1: 0, rfrN2: 0, pvBruteTotale: 500000, abattementPct: 0,
    partCedeePct: 1, tauxPS: 0.172,
  }, p);
  for (const h of [r.hyp1, r.hyp2, r.hyp3]) {
    assert.equal(h.cdhrRetenue, Math.min(h.cdhrSans, h.cdhrAvec));
  }
});

// ── Plus-value immobilière ──────────────────────────────────────────────────

function saisiesPv(surcharge) {
  const base = {
    dateAcquisition: new Date('2010-03-01'), dateCession: new Date('2025-06-01'), devise: 'EUR',
    tauxCession: null, tauxAcquisition: null, quotePart: 100, nbCedants: 1,
    prixImmeuble: 500000, valeurMobilier: 0, autresCession: 0, majCesCharges: 0, majCesAssur: 0,
    majCesAutres: 0, minCesTVA: 0, minCesInter: 0, minCesDiag: 0, minCesEvict: 0, minCesArchi: 0,
    minCesAutres: 0, prixAcquitte: 200000, dmtgGratuit: 0, valeurVenale: 0, renteViagere: 0,
    demembrement: 0, autresAcqBase: 0, chargesHorsForfait: 0, casGratuitFrais: 0, autresMajAcq: 0,
    fraisReel: 0, travauxReel: 0, tauxPs: null,
  };
  return { ...base, ...surcharge };
}

test('moteur PV immobilière — chaque état est nommé, jamais un montant faux', () => {
  const p = MoteurPv.parametresDepuisReferentiels(lecteur('pv-immobiliere'), lecteur('prelevements-sociaux'));
  assert.equal(MoteurPv.calculer(saisiesPv({ prixImmeuble: 0 }), p).etat, 'incomplet');
  assert.equal(MoteurPv.calculer(saisiesPv({ dateCession: new Date('2009-01-01') }), p).etat, 'dates-invalides');
  assert.equal(MoteurPv.calculer(saisiesPv({ devise: 'USD' }), p).etat, 'taux-indisponible');
  assert.equal(MoteurPv.calculer(saisiesPv({ prixAcquitte: 900000 }), p).etat, 'moins-value');
  const r = MoteurPv.calculer(saisiesPv({}), p);
  assert.equal(r.etat, 'imposable');
  assertProche(r.total, r.ir + r.ps + r.surtaxe, 1e-6, 'total = IR + PS + surtaxe');
  assert.equal(r.tauxPs, p.tauxPs, 'sans saisie, le taux des PS est celui du référentiel');
});

test('moteur PV immobilière — un taux de PS saisi remplace le défaut, un taux effacé y revient', () => {
  const p = MoteurPv.parametresDepuisReferentiels(lecteur('pv-immobiliere'), lecteur('prelevements-sociaux'));
  assert.equal(MoteurPv.calculer(saisiesPv({ tauxPs: 0.186 }), p).tauxPs, 0.186);
  assert.equal(MoteurPv.calculer(saisiesPv({ tauxPs: null }), p).tauxPs, p.tauxPs);
});

// ── IFI ─────────────────────────────────────────────────────────────────────

test('moteur IFI — un taux de change non résolu rend null, jamais une somme partielle', () => {
  const p = MoteurIfi.parametresDepuisReferentiels(lecteur('ifi'));
  const biens = [
    { valeur: 1000000, devise: 'EUR', quotePart: 100, rp: false, decote: false },
    { valeur: 1000000, devise: 'USD', quotePart: 100, rp: false, decote: false },
  ];
  const sansTaux = (montant, devise) => (devise === 'EUR' ? montant : null);
  const avecTaux = (montant, devise) => (devise === 'EUR' ? montant : montant / 1.25);
  assert.equal(MoteurIfi.patrimoineBrut(biens, sansTaux, p), null);
  assertProche(MoteurIfi.patrimoineBrut(biens, avecTaux, p), 1800000, 1e-6, 'patrimoine converti');
});

test('moteur IFI — les étapes du résultat se recoupent', () => {
  const p = MoteurIfi.parametresDepuisReferentiels(lecteur('ifi'));
  const r = MoteurIfi.calculer({
    patrimoineBrut: 2600000, dedTaxes: 10000, dedInterets: 0, dedTravaux: 0, dedAutres: 0,
    fermage75Valeur: 0, fermage50Valeur: 0, donsVerses: 0, revenus: 0, ir: 0, autresImpots: 0,
  }, p);
  assertProche(r.patrimoineNet, r.patrimoineBrut - r.totalDed, 1e-6, 'patrimoine net');
  assertProche(r.ifiAvantDecote, r.detailFinal.reduce((s, t) => s + t.impot, 0), 1e-6, 'somme des tranches');
  assert.equal(r.sousLeSeuil, false);
  assert.equal(r.ifiFinal, r.ifiApresReduction, 'sans revenus, aucun plafonnement');
});

// ── Succession ──────────────────────────────────────────────────────────────

test('moteur Succession — un champ absent vaut zéro, sauf les frais funéraires et le taux Dutreil', () => {
  const p = MoteurSuccession.parametresDepuisReferentiels(lecteur('dmtg'));
  const r = MoteurSuccession.calculer({ actifImmo: 1000000, heritiers: [] }, p);
  assertProche(r.passif, MoteurSuccession.FRAIS_FUNERAIRES_PAR_DEFAUT, 1e-6, 'frais funéraires par défaut');
  assert.equal(r.exo.total, 0);
  assertProche(r.actifNetTaxable, 1000000 - 1500, 1e-6, 'actif net taxable');
});

test('moteur Succession — le conjoint est exonéré, un enfant est taxé après abattement', () => {
  const p = MoteurSuccession.parametresDepuisReferentiels(lecteur('dmtg'));
  const r = MoteurSuccession.calculer({
    actifLiquidites: 601500,
    heritiers: [
      { id: 1, lien: 'conjoint', part: 50, donations: 0 },
      { id: 2, lien: 'enfant', part: 50, donations: 0 },
    ],
  }, p);
  assert.equal(r.heritiers[0].exonere, true);
  assert.equal(r.heritiers[0].droits, 0);
  assert.equal(r.heritiers[1].exonere, false);
  assertProche(r.heritiers[1].base, 300000 - p.liens.enfant.abat, 1e-6, "base nette de l'enfant");
  assertProche(r.totalDroits, r.heritiers[1].droits, 1e-6, 'total des droits');
  assertProche(r.totalParts, 100, 1e-6, 'parts distribuées');
});

// ── Démembrement ────────────────────────────────────────────────────────────

test('moteur Démembrement — en pleine propriété, la nue-propriété vaut tout', () => {
  const p = MoteurDemembrement.parametresDepuisReferentiels(lecteur('dmtg'));
  const params = {
    usufruit: p.usufruit,
    abattements: p.abattements,
    tranches: p.tranches.map((t) => ({ low: t.min, high: t.max, taux: t.taux })),
  };
  const pp = MoteurDemembrement.calculer({ age: 68, nbDonataires: 2, valeurPP: 600000, lien: 'directe', nature: 'pp' }, params);
  assert.equal(pp.tauxNP, 1);
  assertProche(pp.valeurNP, 600000, 1e-6, 'valeur transmise');
  const np = MoteurDemembrement.calculer({ age: 68, nbDonataires: 2, valeurPP: 600000, lien: 'directe', nature: 'np' }, params);
  assert.ok(np.tauxNP < 1, 'en nue-propriété, le taux est inférieur à 1');
  assertProche(np.valeurNP + np.valeurUSU, 600000, 1e-6, 'nue-propriété + usufruit = pleine propriété');
  assertProche(np.droitsTotaux, np.droitsParDona * 2, 1e-6, 'droits totaux');
});

// ── IRPP ────────────────────────────────────────────────────────────────────

test('moteur IRPP — le plafond de l’emploi à domicile suit les majorations', () => {
  const sans = MoteurIrpp.calculerMajorationEmploiDomicile({});
  assert.equal(sans.plafondTotal, 12000);
  const enfants = MoteurIrpp.calculerMajorationEmploiDomicile({ enfants_charge: 2 });
  assert.equal(enfants.plafondTotal, 15000);
  const invalide = MoteurIrpp.calculerMajorationEmploiDomicile({ inv_d1: true, enfants_charge: 3 });
  assert.equal(invalide.plafondTotal, 20000, 'plafonné à 20 000 € en cas d’invalidité');
});

test('moteur IRPP — la section IFI applique le barème partagé', () => {
  const p = MoteurIrpp.parametresDepuisReferentiels(lecteur('ir'), lecteur('prelevements-sociaux'), lecteur('ifi'));
  const r = MoteurIrpp.calculerIfi(
    [{ id: 0, valeur: 2000000, dette: 0, rp: false, societe: false }],
    { ifi_taxes: 0, ifi_interets: 0, ifi_depenses: 0, ifi_dons_verses: 0 },
    p.ifi,
  );
  const partage = MoteurIfi.calcIFI(r.patNetApres, p.ifi.bareme);
  assert.deepEqual(recopier(r.montantsParTranche), recopier(partage.detail.map((t) => t.impot)));
  assert.equal(r.sousLeSeuil, false);
});
