/**
 * Avertissements de saisie (issue #11, reliquat de #8) : avertir sans bloquer.
 *
 * La règle est celle de `docs/CONVENTIONS.md` §2.3. Les bornes viennent des
 * attributs `min` et `max` que chaque page déclare déjà ; ce module n'en
 * invente aucune.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const Avertissements = require('../../src/avertissements');
const { SIMULATEURS, lireHtml } = require('../helpers/simulateurs');

test('messageHorsBornes — une valeur dans les bornes ne produit aucun message', () => {
  assert.equal(Avertissements.messageHorsBornes('50', 0, 100), null);
  assert.equal(Avertissements.messageHorsBornes('0', 0, 100), null, 'la borne basse est incluse');
  assert.equal(Avertissements.messageHorsBornes('100', 0, 100), null, 'la borne haute est incluse');
});

test('messageHorsBornes — une valeur hors bornes est signalée, sans être corrigée', () => {
  assert.match(Avertissements.messageHorsBornes('-1', 0, null), /inférieure au minimum attendu \(0\)/);
  assert.match(Avertissements.messageHorsBornes('150', 0, 100), /supérieure au maximum attendu \(100\)/);
  assert.match(Avertissements.messageHorsBornes('150', 0, 100), /le calcul continue/);
});

test('messageHorsBornes — un champ vide ou illisible n’est pas une valeur hors bornes', () => {
  // Il relève de la valeur par défaut (Conventions.nombreSaisi), pas d'un
  // avertissement : ne pas signaler deux fois la même chose.
  assert.equal(Avertissements.messageHorsBornes('', 1, 10), null);
  assert.equal(Avertissements.messageHorsBornes(null, 1, 10), null);
  assert.equal(Avertissements.messageHorsBornes('abc', 1, 10), null);
});

test('messageHorsBornes — sans borne déclarée, rien n’est signalé', () => {
  assert.equal(Avertissements.messageHorsBornes('-999999', null, null), null);
});

test('chaque simulateur charge le module et déclare des bornes sur ses champs', () => {
  for (const { cle } of SIMULATEURS) {
    const html = lireHtml(cle);
    assert.match(html, /<script src="\.\.\/\.\.\/src\/avertissements\.js"><\/script>/, `${cle} doit charger src/avertissements.js`);
    assert.ok(/<input[^>]*type="number"[^>]*\b(min|max)="/i.test(html), `${cle} doit borner au moins un champ`);
  }
});

test('les avertissements propres du démembrement ne sont pas doublés', () => {
  const html = lireHtml('demembrement');
  for (const id of ['age', 'nbDonataires']) {
    const balise = new RegExp(`<input[^>]*id="${id}"[^>]*>`).exec(html);
    assert.ok(balise, `champ ${id} introuvable`);
    assert.match(balise[0], /data-avertissement="manuel"/, `${id} porte déjà son propre avertissement`);
  }
});
