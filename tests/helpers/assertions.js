/** Petites assertions communes aux tests de calcul. */

const assert = require('node:assert/strict');

/**
 * Compare deux montants avec une tolérance, car les calculs en virgule
 * flottante ne tombent presque jamais sur une égalité exacte.
 *
 * @param {number} obtenu montant produit par le code testé
 * @param {number} attendu montant attendu
 * @param {number} tolerance écart maximal accepté, dans la même unité
 * @param {string} message contexte affiché en cas d'échec
 */
function assertProche(obtenu, attendu, tolerance, message) {
  assert.equal(
    typeof obtenu,
    'number',
    `${message} : un nombre était attendu, reçu ${typeof obtenu}`
  );
  assert.ok(
    Number.isFinite(obtenu),
    `${message} : résultat non fini (${obtenu})`
  );
  const ecart = Math.abs(obtenu - attendu);
  assert.ok(
    ecart <= tolerance,
    `${message} : attendu ${attendu}, obtenu ${obtenu} (écart ${ecart} > tolérance ${tolerance})`
  );
}

module.exports = { assertProche };
