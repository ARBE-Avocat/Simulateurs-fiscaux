/**
 * Conventions communes de lecture et d'affichage (issue #11).
 *
 * Ces tests portent sur le module partagé `src/conventions.js`. Ils vérifient
 * les quatre décisions techniques prises par l'issue #11, et notamment celle
 * qui a un effet visible : un calcul qui n'aboutit pas s'affiche « — » et
 * jamais « 0 € ».
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const Conventions = require('../../src/conventions');

test('nombreSaisi — le vide et l’illisible prennent le défaut, pas le zéro', async (t) => {
  const CAS = [
    { nom: 'champ vide', saisie: '', defaut: 100, attendu: 100 },
    { nom: 'espaces seuls', saisie: '   ', defaut: 100, attendu: 100 },
    { nom: 'valeur absente', saisie: undefined, defaut: 100, attendu: 100 },
    { nom: 'valeur nulle', saisie: null, defaut: 100, attendu: 100 },
    { nom: 'texte invalide', saisie: 'abc', defaut: 100, attendu: 100 },
    { nom: 'zéro saisi', saisie: '0', defaut: 100, attendu: 0 },
    { nom: 'zéro décimal', saisie: '0.00', defaut: 100, attendu: 0 },
    { nom: 'valeur positive', saisie: '42.5', defaut: 100, attendu: 42.5 },
    { nom: 'valeur négative', saisie: '-12', defaut: 100, attendu: -12 },
    { nom: 'espaces autour', saisie: ' 7 ', defaut: 100, attendu: 7 },
  ];

  for (const cas of CAS) {
    await t.test(cas.nom, () => {
      assert.equal(Conventions.nombreSaisi(cas.saisie, cas.defaut), cas.attendu);
    });
  }
});

test('nombreSaisi — le défaut vaut zéro lorsqu’il n’est pas précisé', () => {
  assert.equal(Conventions.nombreSaisi(''), 0);
});

test('caseCochee — une case absente vaut faux, jamais vrai', () => {
  assert.equal(Conventions.caseCochee(null), false);
  assert.equal(Conventions.caseCochee(undefined), false);
  assert.equal(Conventions.caseCochee({ checked: false }), false);
  assert.equal(Conventions.caseCochee({ checked: true }), true);
});

test('formaterMontant — un calcul impossible ne s’affiche jamais comme un montant', async (t) => {
  const INVALIDES = [NaN, Infinity, -Infinity, null, undefined, 'abc'];
  for (const valeur of INVALIDES) {
    await t.test(`${String(valeur)} donne « — »`, () => {
      assert.equal(Conventions.formaterMontant(valeur), Conventions.INDISPONIBLE);
    });
  }
});

test('formaterMontant — un zéro réel reste un zéro affiché', () => {
  // Distinction essentielle : « 0 € » doit rester possible pour un vrai zéro,
  // et devenir impossible pour une erreur de calcul.
  assert.equal(Conventions.formaterMontant(0), '0 €');
});

test('formaterMontant — décimales et séparateurs français', () => {
  assert.equal(Conventions.formaterMontant(1234.56, 2).replace(/ | /g, ' '), '1 234,56 €');
  assert.equal(Conventions.formaterMontant(1234.56, 0).replace(/ | /g, ' '), '1 235 €');
});

test('formaterTaux — le taux est donné en décimal, jamais en pourcentage', () => {
  assert.equal(Conventions.formaterTaux(0.172), '17,2 %');
  assert.equal(Conventions.formaterTaux(0.19), '19 %');
  assert.equal(Conventions.formaterTaux(0.172, 2), '17,20 %');
});

test('formaterTaux — un taux invalide ne s’affiche pas comme un pourcentage', () => {
  assert.equal(Conventions.formaterTaux(NaN), Conventions.INDISPONIBLE);
  assert.equal(Conventions.formaterTaux(undefined), Conventions.INDISPONIBLE);
});
