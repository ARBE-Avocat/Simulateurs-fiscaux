/**
 * Tests du schéma des référentiels fiscaux (issue #12).
 *
 * Le schéma est exécutable : `scripts/lib/schema-referentiel.js` en est la
 * définition, `data/schema/README.md` son explication. Ces tests vérifient que
 * les deux restent d'accord, en s'appuyant sur les exemples versionnés.
 *
 * Le principe des exemples invalides est celui de la vérification « le test
 * a-t-il des dents » de `tests/README.md` : chaque fichier du dossier
 * `invalides/` doit être rejeté, et pour la raison annoncée par son nom.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  validerReferentiel,
  formaterRapport,
  SIMULATEURS,
} = require('../../scripts/lib/schema-referentiel');

const EXEMPLES = path.resolve(__dirname, '..', '..', 'data', 'schema', 'exemples');

function lire(...segments) {
  return JSON.parse(fs.readFileSync(path.join(EXEMPLES, ...segments), 'utf8'));
}

test("schéma — l'exemple de référence est valide et sans avertissement", () => {
  const rapport = validerReferentiel(lire('valide.json'));
  assert.deepEqual(
    rapport.erreurs,
    [],
    `l'exemple de référence doit rester valide :\n${formaterRapport(rapport, 'valide.json')}`,
  );
  assert.deepEqual(rapport.avertissements, []);
});

test('schéma — un barème dont les tranches laissent un trou est accepté mais signalé', () => {
  // L'extraction conserve le comportement existant : un barème « de N+1 à M »
  // ne doit pas faire échouer la validation, sans quoi les données actuelles
  // seraient inextractibles. Il doit en revanche être visible.
  const rapport = validerReferentiel(lire('avertissement-bareme-avec-trou.json'));
  assert.deepEqual(rapport.erreurs, [], formaterRapport(rapport, ''));
  assert.equal(
    rapport.avertissements.length,
    5,
    'le barème IFI actuel laisse cinq intervalles d\'un euro non couverts',
  );
});

const INVALIDES = path.join(EXEMPLES, 'invalides');

for (const fichier of fs.readdirSync(INVALIDES).sort()) {
  test(`schéma — l'exemple invalide « ${fichier} » est rejeté`, () => {
    const rapport = validerReferentiel(lire('invalides', fichier));
    assert.ok(
      rapport.erreurs.length > 0,
      `${fichier} devrait être rejeté par le schéma, il ne l'est pas`,
    );
  });
}

test('schéma — une valeur contestée ne peut pas être lue comme une valeur unique', () => {
  // C'est la garantie centrale du jalon : l'extraction ne doit jamais trancher
  // une divergence entre simulateurs.
  const referentiel = lire('valide.json');
  const contestee = referentiel.entrees.find((e) => e.statutValidation === 'conteste');

  assert.ok(contestee, 'l\'exemple de référence doit contenir une entrée contestée');
  assert.equal(contestee.valeur, undefined);
  assert.ok(contestee.variantes.length >= 2);

  contestee.valeur = contestee.variantes[0].valeur;
  const rapport = validerReferentiel(referentiel);
  assert.ok(
    rapport.erreurs.some((e) => e.chemin.endsWith('.valeur')),
    'ajouter une valeur unique à une entrée contestée doit être refusé',
  );
});

test('schéma — les clés de simulateur du schéma sont celles du dépôt', () => {
  // Si un simulateur est renommé, le schéma et le harnais de tests doivent être
  // corrigés ensemble ; ce test le rend impossible à oublier.
  const { SIMULATEURS: DU_HARNAIS } = require('../helpers/simulateurs');
  assert.deepEqual(
    [...SIMULATEURS].sort(),
    DU_HARNAIS.map((s) => s.cle).sort(),
  );
});
