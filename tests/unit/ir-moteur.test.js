/**
 * Tests du moteur de l'impôt sur le revenu, exécutés sans navigateur.
 *
 * Ils montrent le patron à reprendre pour les autres simulateurs : charger le
 * simulateur avec le faux DOM, récupérer une fonction de calcul, puis
 * l'appeler directement.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { chargerSimulateur, chemin } = require('../helpers/simulateurs');
const { assertProche } = require('../helpers/assertions');

const fixture = JSON.parse(
  fs.readFileSync(chemin('tests', 'fixtures', 'ir-bareme-2025.json'), 'utf8')
);

const simulateur = chargerSimulateur('ir-cehr-cdhr');
const bareme = simulateur.evaluer('bareme');
const cehrBareme = simulateur.evaluer('cehrBareme');
const irAvecQuotientFamilial = simulateur.evaluer('irAvecQuotientFamilial');

test('bareme — les cas de la fixture donnent les montants attendus', async (t) => {
  for (const cas of fixture.cas) {
    await t.test(cas.nom, () => {
      assertProche(
        bareme(cas.revenuParPart),
        cas.impotAttendu,
        fixture.tolerance,
        `bareme(${cas.revenuParPart})`
      );
    });
  }
});

test('bareme — le montant ne décroît jamais quand le revenu augmente', () => {
  const revenus = [0, 5000, 10000, 30000, 90000, 200000, 500000];
  for (let i = 1; i < revenus.length; i += 1) {
    assert.ok(
      bareme(revenus[i]) >= bareme(revenus[i - 1]),
      `bareme(${revenus[i]}) ne devrait pas être inférieur à bareme(${revenus[i - 1]})`
    );
  }
});

test('bareme — au-dessus de la première tranche imposée, le montant augmente', () => {
  // En deçà du seuil d'imposition, plusieurs revenus donnent le même montant
  // nul : la stricte croissance ne peut être vérifiée qu'au-delà.
  const revenus = [30000, 90000, 200000, 500000];
  for (let i = 1; i < revenus.length; i += 1) {
    assert.ok(
      bareme(revenus[i]) > bareme(revenus[i - 1]),
      `bareme(${revenus[i]}) devrait dépasser bareme(${revenus[i - 1]})`
    );
  }
});

test("irAvecQuotientFamilial — sans part supplémentaire, le résultat est celui du barème", () => {
  // Quand le nombre de parts est identique à la référence, il n'y a aucun
  // avantage de quotient familial à plafonner : le calcul doit revenir au
  // barème appliqué au revenu par part.
  for (const parts of [1, 2]) {
    for (const revenu of [12000, 60000, 250000]) {
      assertProche(
        irAvecQuotientFamilial(revenu, parts, parts),
        bareme(revenu / parts) * parts,
        0.01,
        `irAvecQuotientFamilial(${revenu}, ${parts}, ${parts})`
      );
    }
  }
});

test('irAvecQuotientFamilial — un revenu nul ou négatif ne produit aucun impôt', () => {
  assert.equal(irAvecQuotientFamilial(0, 2, 2), 0);
  assert.equal(irAvecQuotientFamilial(-1000, 2.5, 2), 0);
});

test("irAvecQuotientFamilial — des parts supplémentaires ne peuvent pas augmenter l'impôt", () => {
  const revenu = 120000;
  const impotSansEnfant = irAvecQuotientFamilial(revenu, 2, 2);
  const impotAvecEnfant = irAvecQuotientFamilial(revenu, 2.5, 2);
  assert.ok(
    impotAvecEnfant <= impotSansEnfant,
    `une demi-part de plus devrait alléger ou laisser l'impôt inchangé (${impotAvecEnfant} > ${impotSansEnfant})`
  );
});

test('cehrBareme — sous le premier seuil, la contribution est nulle', () => {
  const seuils = [500000, 1000000];
  assert.equal(cehrBareme(0, seuils), 0);
  assert.equal(cehrBareme(499999, seuils), 0);
  assert.equal(cehrBareme(500000, seuils), 0);
});

test('cehrBareme — les deux tranches sont appliquées séparément', () => {
  // Les seuils sont fournis en entrée par l'appelant : ce test vérifie la
  // mécanique de découpage en tranches, pas la valeur juridique des seuils.
  const seuils = [500000, 1000000];
  assertProche(cehrBareme(600000, seuils), 100000 * 0.03, 0.01, 'première tranche seule');
  assertProche(
    cehrBareme(1200000, seuils),
    500000 * 0.03 + 200000 * 0.04,
    0.01,
    'première et seconde tranches'
  );
});
