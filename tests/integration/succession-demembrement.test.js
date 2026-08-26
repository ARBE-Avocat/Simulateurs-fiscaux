/**
 * Non-régression des simulateurs Succession et Démembrement.
 *
 * Ces tests figent les montants produits par des saisies courantes. Ils ne
 * jugent pas la justesse fiscale des barèmes : ils garantissent qu'une
 * correction technique ne déplace aucun résultat.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { chargerSimulateur, chemin } = require('../helpers/simulateurs');
const { assertProche, assertTexteAffiche } = require('../helpers/assertions');

const fixture = JSON.parse(
  fs.readFileSync(chemin('tests', 'fixtures', 'succession-demembrement-scenarios.json'), 'utf8')
);

/** Renseigne les champs d'un simulateur à partir d'un scénario. */
function saisir(simulateur, champs) {
  for (const [id, valeur] of Object.entries(champs)) {
    simulateur.dom.document.getElementById(id).value = String(valeur);
  }
}

test('Succession — les scénarios de référence donnent les mêmes montants', async (t) => {
  for (const cas of fixture.succession) {
    await t.test(cas.nom, () => {
      const simulateur = chargerSimulateur('succession');
      saisir(simulateur, cas.champs);

      const obtenu = {
        actifBrut: simulateur.evaluer('calcActifBrut')(),
        passif: simulateur.evaluer('calcPassif')(),
        exoTotal: simulateur.evaluer('calcExo')().total,
        actifNetTaxable: simulateur.evaluer('calcActifNetTaxable')(),
      };

      for (const [clef, attendu] of Object.entries(cas.attendu)) {
        assertProche(obtenu[clef], attendu, fixture.tolerance, `${cas.nom} — ${clef}`);
      }
    });
  }
});

test('Démembrement — les scénarios de référence affichent les mêmes montants', async (t) => {
  for (const cas of fixture.demembrement) {
    await t.test(cas.nom, () => {
      const simulateur = chargerSimulateur('demembrement');
      saisir(simulateur, cas.champs);
      simulateur.evaluer('recalculate')();

      for (const [id, attendu] of Object.entries(cas.affichage)) {
        const affiche = simulateur.dom.document.getElementById(id).textContent;
        assertTexteAffiche(affiche, attendu, `${cas.nom} — champ affiché ${id}`);
      }
    });
  }
});
