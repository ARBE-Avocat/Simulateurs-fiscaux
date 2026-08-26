/**
 * Tests de la CDHR du simulateur IRPP (issue #4).
 *
 * Le calcul est isolé du formulaire, ce qui permet de le vérifier sans
 * navigateur. La décote reste volontairement non corrigée : sa formule et son
 * intervalle doivent être confirmés par le référent fiscal.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { chargerSimulateur } = require('../helpers/simulateurs');
const { assertProche } = require('../helpers/assertions');

const SEUIL_CELIBATAIRE = 250000;
const SEUIL_COUPLE = 500000;

const calculer = () => chargerSimulateur('irpp').evaluer('calculerCDHR');

test('CDHR — la part brute vaut 20 % du revenu, diminuée de ce qui est déjà retenu', () => {
  const calculerCDHR = calculer();
  const r = calculerCDHR({
    rfrr: 400000,
    irCehr: 50000,
    seuil: SEUIL_CELIBATAIRE,
    abattementTotal: 0,
  });
  assertProche(r.brut, 400000 * 0.2 - 50000, 0.01, 'CDHR brute');
});

test('CDHR — les abattements réduisent la part brute', () => {
  const calculerCDHR = calculer();
  const sans = calculerCDHR({ rfrr: 600000, irCehr: 0, seuil: SEUIL_COUPLE, abattementTotal: 0 });
  const avec = calculerCDHR({
    rfrr: 600000,
    irCehr: 0,
    seuil: SEUIL_COUPLE,
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
    abattementTotal: 0,
  });
  assertProche(r.brut, 0, 0.01, '20 % de 200 000 € sont couverts par 40 000 € déjà retenus');
});

test('CDHR — mêmes entrées, même résultat', () => {
  const calculerCDHR = calculer();
  const entrees = { rfrr: 700000, irCehr: 120000, seuil: SEUIL_COUPLE, abattementTotal: 12500 };
  assert.deepEqual(calculerCDHR(entrees), calculerCDHR(entrees));
});

test(
  'CDHR — la décote devrait être non nulle quelque part au-dessus du seuil',
  {
    todo:
      "Défaut de l'issue #4 : la décote est toujours nulle. La condition " +
      "`rfrr < seuil` la rend inatteignable. La formule et l'intervalle exacts " +
      'doivent être validés par le référent fiscal avant correction.',
  },
  () => {
    const calculerCDHR = calculer();
    const revenus = [];
    for (let rfrr = 250001; rfrr <= 400000; rfrr += 5000) {
      revenus.push(rfrr);
    }

    const avecDecote = revenus.filter(
      (rfrr) =>
        calculerCDHR({ rfrr, irCehr: 0, seuil: SEUIL_CELIBATAIRE, abattementTotal: 0 }).decote > 0
    );

    assert.ok(
      avecDecote.length > 0,
      `aucun revenu testé entre 250 001 € et 400 000 € ne produit de décote (${revenus.length} valeurs essayées)`
    );
  }
);

test('CDHR — état actuel documenté : la décote est nulle partout', () => {
  // Ce test fige le défaut pour que sa correction soit un changement visible et
  // non un effet de bord. Il devra être remplacé lorsque #4 sera tranchée.
  const calculerCDHR = calculer();
  for (const rfrr of [200000, 249999, 250000, 250001, 280000, 330000, 400000]) {
    const r = calculerCDHR({ rfrr, irCehr: 0, seuil: SEUIL_CELIBATAIRE, abattementTotal: 0 });
    assert.equal(r.decote, 0, `décote pour un revenu de ${rfrr} €`);
    assert.equal(r.net, r.brut, `net et brut identiques pour ${rfrr} €`);
  }
});
