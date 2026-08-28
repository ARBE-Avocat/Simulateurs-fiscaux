/**
 * Convention de bornes des barèmes (issue #7).
 *
 * Une tranche s'arrête à sa borne haute incluse, et la suivante reprend
 * exactement là. Deux écritures coexistaient : le simulateur « IR, CEHR et
 * CDHR » et les barèmes de mutations à titre gratuit rendaient les tranches
 * jointives, tandis que l'IRPP et l'IFI faisaient commencer chaque tranche un
 * euro au-dessus de la borne précédente. Cet euro n'était taxé nulle part.
 *
 * Conséquence mesurée avant correction : pour un même revenu, les deux
 * simulateurs d'impôt sur le revenu donnaient deux impôts différents, jusqu'à
 * 1,27 € d'écart ; l'IFI perdait 0,05 €.
 *
 * Ces tests vérifient que l'écart a disparu et qu'aucun euro d'assiette n'est
 * omis. Ils portent sur les seuils eux-mêmes, là où une convention de borne se
 * trahit, plutôt que sur des montants ronds.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { chargerSimulateur } = require('../helpers/simulateurs');
const { lecteur } = require('../helpers/referentiels');

/** Seuils du barème de l'impôt sur le revenu, millésime employé par les tests. */
const SEUILS_IR = [11600, 29579, 84577, 181917];

test('IR — les deux simulateurs donnent le même impôt pour le même revenu', async (t) => {
  const baremeIR = chargerSimulateur('ir-cehr-cdhr').evaluer('bareme');
  const impotIRPP = chargerSimulateur('irpp').evaluer('impot');

  // Chaque seuil est éprouvé à −1, à l'euro près et à +1 : c'est exactement là
  // qu'une borne mal placée se voit.
  const revenus = [0, 1, 200000, 300000, 1000000];
  for (const seuil of SEUILS_IR) revenus.push(seuil - 1, seuil, seuil + 1);

  for (const revenu of [...new Set(revenus)].sort((a, b) => a - b)) {
    await t.test(`revenu de ${revenu} €`, () => {
      assert.ok(
        Math.abs(baremeIR(revenu) - impotIRPP(revenu)) < 0.005,
        `${revenu} € : ${baremeIR(revenu).toFixed(2)} € dans « IR, CEHR et CDHR » `
          + `contre ${impotIRPP(revenu).toFixed(2)} € dans l'IRPP`,
      );
    });
  }
});

test('IR — franchir un seuil d’un euro coûte le taux de la tranche, pas davantage', () => {
  const impotIRPP = chargerSimulateur('irpp').evaluer('impot');
  const TAUX_APRES_SEUIL = { 11600: 0.11, 29579: 0.30, 84577: 0.41, 181917: 0.45 };

  for (const [seuil, taux] of Object.entries(TAUX_APRES_SEUIL)) {
    const borne = Number(seuil);
    const supplement = impotIRPP(borne + 1) - impotIRPP(borne);
    assert.ok(
      Math.abs(supplement - taux) < 0.005,
      `un euro au-dessus de ${borne} € doit coûter ${taux} €, et non ${supplement.toFixed(4)} €`,
    );
  }
});

test('Les barèmes du dépôt ne laissent aucun euro sans taux', async (t) => {
  // Le schéma sait décrire une tranche ouverte ou fermée à chaque extrémité.
  // Deux tranches consécutives se suivent sans trou lorsque la borne haute de
  // l'une est la borne basse de l'autre et qu'une seule des deux l'inclut.
  const BAREMES = [
    ['ir', 'ir.bareme.progressif'],
    ['ifi', 'ifi.bareme.progressif'],
    ['dmtg', 'dmtg.bareme.ligne-directe'],
    ['dmtg', 'dmtg.bareme.frere-soeur'],
  ];

  for (const [domaine, identifiant] of BAREMES) {
    await t.test(identifiant, () => {
      const tranches = lecteur(domaine).bareme(identifiant);
      tranches.slice(0, -1).forEach((tranche, i) => {
        assert.equal(
          tranches[i + 1].min, tranche.max,
          `${identifiant} : la tranche ${i + 2} doit reprendre à ${tranche.max}`,
        );
      });
    });
  }
});

test('IFI — les deux simulateurs partagent le même barème, jointif', () => {
  // Les barèmes viennent de trois contextes d'exécution distincts : une
  // recopie par JSON les ramène aux tableaux de ce contexte-ci, faute de quoi
  // la comparaison stricte échoue sur des valeurs pourtant identiques.
  const normaliser = (tranches) => JSON.parse(JSON.stringify(
    tranches.map((t) => [t.min, t.max === Infinity ? null : t.max, t.taux]),
  ));

  const attendu = normaliser(lecteur('ifi').bareme('ifi.bareme.progressif'));
  const depuisIfi = normaliser(chargerSimulateur('ifi').evaluer('BAREME'));
  const depuisIrpp = normaliser(chargerSimulateur('irpp').evaluer('IFI').bareme);

  assert.deepEqual(depuisIfi, attendu, 'barème du simulateur IFI');
  assert.deepEqual(depuisIrpp, attendu, 'barème de la section IFI de l’IRPP');

  // Aucune borne ne doit être décalée d'un euro par rapport à la précédente.
  attendu.slice(0, -1).forEach(([, max], i) => {
    assert.equal(attendu[i + 1][0], max, `la tranche ${i + 2} doit reprendre à ${max}`);
  });
});
