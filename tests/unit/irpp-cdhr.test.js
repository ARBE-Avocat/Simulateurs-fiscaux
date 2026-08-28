/**
 * Tests de la CDHR du simulateur IRPP (issue #4).
 *
 * Le calcul est isolé du formulaire, ce qui permet de le vérifier sans
 * navigateur. La décote a été corrigée à la suite de la fiche 2.1 de
 * docs/CORRECTIONS_A_VALIDER.md : le référent fiscal a désigné la formule du
 * simulateur « IR, CEHR et CDHR » comme celle qui fait foi. `calculerCDHR`
 * exige donc désormais une `borneHaute`, en plus du `seuil`.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { chargerSimulateur } = require('../helpers/simulateurs');
const { assertProche } = require('../helpers/assertions');

const SEUIL_CELIBATAIRE = 250000;
const SEUIL_COUPLE = 500000;
const BORNE_HAUTE_CELIBATAIRE = 330000;
const BORNE_HAUTE_COUPLE = 660000;

const calculer = () => chargerSimulateur('irpp').evaluer('calculerCDHR');

test('CDHR — la part brute vaut 20 % du revenu, diminuée de ce qui est déjà retenu', () => {
  const calculerCDHR = calculer();
  const r = calculerCDHR({
    rfrr: 400000,
    irCehr: 50000,
    seuil: SEUIL_CELIBATAIRE,
    borneHaute: BORNE_HAUTE_CELIBATAIRE,
    abattementTotal: 0,
  });
  assertProche(r.brut, 400000 * 0.2 - 50000, 0.01, 'CDHR brute');
});

test('CDHR — les abattements réduisent la part brute', () => {
  const calculerCDHR = calculer();
  const sans = calculerCDHR({
    rfrr: 700000,
    irCehr: 0,
    seuil: SEUIL_COUPLE,
    borneHaute: BORNE_HAUTE_COUPLE,
    abattementTotal: 0,
  });
  const avec = calculerCDHR({
    rfrr: 700000,
    irCehr: 0,
    seuil: SEUIL_COUPLE,
    borneHaute: BORNE_HAUTE_COUPLE,
    abattementTotal: 12500 + 2 * 1500,
  });
  assertProche(sans.brut - avec.brut, 15500, 0.01, 'effet des abattements');
});

test('CDHR — un impôt déjà supérieur à la cible ne produit aucune contribution', () => {
  const calculerCDHR = calculer();
  const r = calculerCDHR({
    rfrr: 300000,
    irCehr: 200000,
    seuil: SEUIL_CELIBATAIRE,
    borneHaute: BORNE_HAUTE_CELIBATAIRE,
    abattementTotal: 0,
  });
  assertProche(r.brut, 0, 0.01, 'la CDHR ne peut pas être négative');
  assertProche(r.net, 0, 0.01, 'la CDHR nette non plus');
});

test('CDHR — un revenu sous le seuil ne déclenche pas de contribution nette anormale', () => {
  const calculerCDHR = calculer();
  const r = calculerCDHR({
    rfrr: 200000,
    irCehr: 40000,
    seuil: SEUIL_CELIBATAIRE,
    borneHaute: BORNE_HAUTE_CELIBATAIRE,
    abattementTotal: 0,
  });
  assertProche(r.brut, 0, 0.01, '20 % de 200 000 € sont couverts par 40 000 € déjà retenus');
});

test('CDHR — mêmes entrées, même résultat', () => {
  const calculerCDHR = calculer();
  const entrees = {
    rfrr: 700000,
    irCehr: 120000,
    seuil: SEUIL_COUPLE,
    borneHaute: BORNE_HAUTE_COUPLE,
    abattementTotal: 12500,
  };
  assert.deepEqual(calculerCDHR(entrees), calculerCDHR(entrees));
});

test('CDHR — la décote est non nulle dans la bande, et nulle à ses bornes (fiche 2.1)', () => {
  const calculerCDHR = calculer();
  const revenus = [];
  for (let rfrr = 250001; rfrr <= 400000; rfrr += 5000) {
    revenus.push(rfrr);
  }

  const avecDecote = revenus.filter(
    (rfrr) =>
      calculerCDHR({
        rfrr,
        irCehr: 0,
        seuil: SEUIL_CELIBATAIRE,
        borneHaute: BORNE_HAUTE_CELIBATAIRE,
        abattementTotal: 0,
      }).decote > 0
  );

  assert.ok(
    avecDecote.length > 0,
    `aucun revenu testé entre 250 001 € et 400 000 € ne produit de décote (${revenus.length} valeurs essayées)`
  );

  // Aux bornes de la bande, la décote s'annule : au seuil, elle ne s'est pas
  // encore déclenchée ; à la borne haute, 20 % du revenu et le montant
  // retranché s'égalent exactement (constaté en fiche 2.1).
  const auSeuil = calculerCDHR({
    rfrr: SEUIL_CELIBATAIRE,
    irCehr: 0,
    seuil: SEUIL_CELIBATAIRE,
    borneHaute: BORNE_HAUTE_CELIBATAIRE,
    abattementTotal: 0,
  });
  assertProche(auSeuil.decote, 0, 0.01, 'décote au seuil');

  const aLaBorneHaute = calculerCDHR({
    rfrr: BORNE_HAUTE_CELIBATAIRE,
    irCehr: 0,
    seuil: SEUIL_CELIBATAIRE,
    borneHaute: BORNE_HAUTE_CELIBATAIRE,
    abattementTotal: 0,
  });
  assertProche(aLaBorneHaute.decote, 0, 0.01, 'décote à la borne haute');
});

test('CDHR — au-delà de la borne haute de la bande, la décote redevient nulle', () => {
  const calculerCDHR = calculer();
  const r = calculerCDHR({
    rfrr: 400000,
    irCehr: 0,
    seuil: SEUIL_CELIBATAIRE,
    borneHaute: BORNE_HAUTE_CELIBATAIRE,
    abattementTotal: 0,
  });
  assert.equal(r.decote, 0, 'décote au-delà de la borne haute');
});
