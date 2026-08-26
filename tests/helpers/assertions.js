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

/**
 * Remplace toutes les espaces insécables ou fines par une espace ordinaire.
 *
 * Les montants sont formatés en français : `toLocaleString('fr-FR')` sépare les
 * milliers par une espace fine insécable (U+202F), invisible à la lecture d'un
 * test. Comparer ces caractères à l'identique rendrait les attentes illisibles
 * et casserait les tests au moindre changement de version de Node.
 *
 * @param {string} texte
 * @returns {string}
 */
function normaliserEspaces(texte) {
  return String(texte).replace(/[\u00A0\u202F\u2009]/g, ' ').trim();
}

/**
 * Compare deux textes affichés en ignorant le type d'espace utilisé.
 */
function assertTexteAffiche(obtenu, attendu, message) {
  assert.equal(normaliserEspaces(obtenu), normaliserEspaces(attendu), message);
}

module.exports = { assertProche, assertTexteAffiche, normaliserEspaces };
