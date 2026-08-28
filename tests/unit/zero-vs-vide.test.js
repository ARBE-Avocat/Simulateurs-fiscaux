/**
 * Reproduction des défauts de l'issue #8 : une valeur zéro saisie volontairement
 * était remplacée par une valeur par défaut non nulle.
 *
 * Chaque test compare trois saisies pour le même champ : vide, zéro et une
 * valeur positive. Le champ vide garde la valeur par défaut ; le zéro doit être
 * respecté.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { chargerSimulateur } = require('../helpers/simulateurs');
const { assertProche } = require('../helpers/assertions');

test('IFI — une quote-part de 0 % ne devient pas 100 %', () => {
  const simulateur = chargerSimulateur('ifi');
  let resultat = null;
  simulateur.contexte.renderResults = (r) => {
    resultat = r;
  };

  simulateur.evaluer('addBien')({ valeur: 1000000, quotePart: 100 });
  const bien = simulateur.evaluer('biens')[0];

  // Même lecture que le champ du tableau des biens.
  const lire = simulateur.evaluer('nombreSaisi');
  simulateur.evaluer('setBienVal')(bien.id, 'quotePart', lire('0', 100));
  simulateur.evaluer('compute')();

  assert.equal(simulateur.evaluer('biens')[0].quotePart, 0, 'la quote-part saisie doit rester 0');
  assertProche(resultat.patrimoineBrut, 0, 0.01, 'un bien détenu à 0 % ne pèse rien dans le patrimoine');
});

test('IFI — une quote-part laissée vide conserve la valeur par défaut de 100 %', () => {
  const simulateur = chargerSimulateur('ifi');
  const lire = simulateur.evaluer('nombreSaisi');
  assert.equal(lire('', 100), 100);
});

test('Succession — des frais funéraires à 0 ne repassent pas à 1 500 €', () => {
  const simulateur = chargerSimulateur('succession');
  const document = simulateur.dom.document;
  for (const id of ['passifEmprunt', 'passifFisc', 'passifAutres']) {
    document.getElementById(id).value = '0';
  }
  const calcPassif = simulateur.evaluer('calcPassif');

  document.getElementById('passifFuneraires').value = '';
  assertProche(calcPassif(), 1500, 0.01, 'champ vide : la valeur par défaut s’applique');

  document.getElementById('passifFuneraires').value = '0';
  assertProche(calcPassif(), 0, 0.01, 'zéro saisi : aucun frais funéraire retenu');

  document.getElementById('passifFuneraires').value = '2000';
  assertProche(calcPassif(), 2000, 0.01, 'valeur saisie : reprise telle quelle');
});

test('Démembrement — un taux de tranche à 0 % est appliqué', () => {
  const lireParams = (saisies) => {
    const simulateur = chargerSimulateur('demembrement');
    for (const [id, valeur] of Object.entries(saisies)) {
      simulateur.dom.document.getElementById(id).value = String(valeur);
    }
    return simulateur.evaluer('getParams')();
  };

  assertProche(lireParams({}).tranches[0].taux, 0.05, 1e-9, 'champ vide : taux par défaut');
  assertProche(lireParams({ p_t1_taux: 0 }).tranches[0].taux, 0, 1e-9, 'zéro saisi : taux nul');
  assertProche(lireParams({ p_t1_taux: 7 }).tranches[0].taux, 0.07, 1e-9, 'valeur saisie');
});

test('Démembrement — un abattement à 0 € est appliqué', () => {
  const lireAbattement = (saisies) => {
    const simulateur = chargerSimulateur('demembrement');
    for (const [id, valeur] of Object.entries(saisies)) {
      simulateur.dom.document.getElementById(id).value = String(valeur);
    }
    return simulateur.evaluer('getAbattement')('directe');
  };

  assertProche(lireAbattement({}), 100000, 0.01, 'champ vide : abattement par défaut');
  assertProche(lireAbattement({ p_aba_directe: 0 }), 0, 0.01, 'zéro saisi : aucun abattement');
  assertProche(lireAbattement({ p_aba_directe: 50000 }), 50000, 0.01, 'valeur saisie');
});

test("Démembrement — un âge de 0 an est désormais accepté, le nombre de donataires reste refusé (fiche 3.1)", () => {
  // Fiche 3.1 de docs/CORRECTIONS_A_VALIDER.md, tranchée par le référent
  // fiscal : un âge de 0 an correspond bien à la tranche « moins de 21 ans
  // révolus » du barème de l'usufruit (art. 669 CGI) et est désormais accepté
  // comme n'importe quel autre zéro volontaire (issue #8). Le nombre de
  // donataires, lui, reste mathématiquement contraint à un minimum de 1 :
  // un nombre nul provoquerait une division par zéro.
  const simulateur = chargerSimulateur('demembrement');
  const document = simulateur.dom.document;
  document.getElementById('valeurPP').value = '600000';
  document.getElementById('natureOp').value = 'np';
  document.getElementById('lienParente').value = 'directe';
  document.getElementById('age').value = '0';
  document.getElementById('nbDonataires').value = '0';
  simulateur.evaluer('recalculate')();

  const nbAffiche = String(document.getElementById('nbDonatairesDisplay').textContent);
  assert.equal(nbAffiche, '1', 'un nombre de donataires nul retombe sur 1');

  const getTauxNP = simulateur.evaluer('getTauxNP');
  assert.equal(getTauxNP(0), 0.1, 'un âge de 0 an relève de la tranche « moins de 21 ans révolus »');

  const droits = String(document.getElementById('droitsTotaux').textContent);
  assert.ok(!/NaN|Infinity/.test(droits), `les droits restent calculables (obtenu ${droits})`);
});
