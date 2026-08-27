/**
 * Filet de non-régression du simulateur de plus-value immobilière (#17).
 *
 * Relevé **avant** l'extraction de son référentiel, par exécution réelle.
 *
 * Il combine deux approches, parce que ce simulateur écrit son résultat
 * directement en HTML et n'expose pas d'objet de résultat :
 *
 * 1. les fonctions de calcul pur — abattements pour durée de détention et
 *    surtaxe — sont vérifiées exhaustivement, année par année et de part et
 *    d'autre de chaque palier ;
 * 2. les montants et pourcentages réellement affichés sont relevés dans l'ordre
 *    pour dix scénarios complets, ce qui couvre les taux et forfaits que les
 *    fonctions pures ne portent pas.
 *
 * Ne jamais régénérer ce fichier de référence après une modification.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { chargerSimulateur, chemin } = require('../helpers/simulateurs');
const { assertProche } = require('../helpers/assertions');
const { listerAnnees, lireAnnee } = require('../../scripts/lib/change');
const { tauxPour } = require('../../src/change');

const instantane = JSON.parse(
  fs.readFileSync(chemin('tests', 'fixtures', 'instantanes-pv-immobiliere.json'), 'utf8'),
);
const { tolerance } = instantane;

const CHAMPS = [
  'dateAcq', 'dateCes', 'devise', 'quotePart', 'nbCedants', 'prixImmeuble',
  'valeurMobilier', 'autresCession', 'majCesCharges', 'majCesAssur', 'majCesAutres',
  'minCesTVA', 'minCesInter', 'minCesDiag', 'minCesEvict', 'minCesArchi', 'minCesAutres',
  'prixAcquitte', 'dmtgGratuit', 'valeurVenale', 'renteViagere', 'demembrement',
  'autresAcqBase', 'chargesHorsForfait', 'casGratuitFrais', 'autresMajAcq',
  'fraisReel', 'travauxReel',
];

/** Relève les montants et pourcentages affichés, dans l'ordre du document. */
function relever(document) {
  const html = document.getElementById('resultsBody').innerHTML;
  const normaliser = (x) => x.replace(/[   ]/g, ' ').trim();
  return {
    montants: (html.match(/-?[\d    ]+(?:,\d+)?\s?€/g) || []).map(normaliser),
    pourcents: (html.match(/[\d]+(?:,\d+)?\s?%/g) || []).map(normaliser),
  };
}

test('Plus-value immobilière — les abattements pour durée sont inchangés', () => {
  const simulateur = chargerSimulateur('pv-immobiliere');
  const abatIR = simulateur.evaluer('abatIR');
  const abatPS = simulateur.evaluer('abatPS');

  for (const cas of instantane.abattements) {
    assertProche(abatIR(cas.annees), cas.ir, tolerance, `abattement IR à ${cas.annees} ans`);
    assertProche(abatPS(cas.annees), cas.ps, tolerance, `abattement PS à ${cas.annees} ans`);
  }
});

test('Plus-value immobilière — la surtaxe est inchangée à chaque palier', () => {
  // Les montants relevés encadrent chaque palier : c'est là qu'une borne
  // déplacée d'un euro se verrait.
  const surtaxe = chargerSimulateur('pv-immobiliere').evaluer('surtaxe');

  for (const cas of instantane.surtaxes) {
    assertProche(
      surtaxe(cas.plusValue), cas.surtaxe, tolerance,
      `surtaxe pour une plus-value de ${cas.plusValue} €`,
    );
  }
});

test('Plus-value immobilière — aucun montant affiché ne bouge', async (t) => {
  for (const cas of instantane.scenarios) {
    await t.test(cas.nom, () => {
      const simulateur = chargerSimulateur('pv-immobiliere');
      const { document } = simulateur.dom;

      for (const id of CHAMPS) {
        document.getElementById(id).value = String(cas.champs[id] ?? '');
      }
      simulateur.evaluer('compute')();

      const obtenu = relever(document);
      assert.deepEqual(obtenu.montants, cas.attendu.montants, `${cas.nom} — montants affichés`);
      assert.deepEqual(obtenu.pourcents, cas.attendu.pourcents, `${cas.nom} — pourcentages affichés`);
    });
  }
});

test("Plus-value immobilière — la conversion de devise n'a pas bougé avec l'étape 2 de #13", async (t) => {
  // Ces scénarios ont été relevés depuis le code d'AVANT cette étape, quand le
  // taux venait encore d'un bloc embarqué dans le HTML. `tauxCache` est
  // pré-rempli ici avec le taux réel de `data/change/` pour la même date et la
  // même devise, avant `compute()` : les tests ne font aucun appel réseau (voir
  // tests/README.md), donc `assurerTaux` échouerait silencieusement sans ce
  // remplissage, et resterait affiché « chargement… » au lieu d'un montant.
  //
  // Si les deux sources donnent le même taux, la sortie doit être identique au
  // caractère près : c'est ce que ce test prouve, séparément de la valeur du
  // taux lui-même, déjà vérifiée par 301 044 comparaisons dans
  // tests/unit/change.test.js.
  const cotations = {};
  for (const annee of listerAnnees()) {
    Object.assign(cotations, lireAnnee(annee).cotations);
  }

  for (const cas of instantane.scenariosDevise.cas) {
    await t.test(cas.nom, () => {
      const simulateur = chargerSimulateur('pv-immobiliere');
      const { document } = simulateur.dom;

      for (const id of CHAMPS) {
        document.getElementById(id).value = String(cas.champs[id] ?? '');
      }

      const { devise, dateCes, dateAcq } = cas.champs;
      const tauxCache = simulateur.evaluer('tauxCache');
      for (const date of [dateCes, dateAcq]) {
        const taux = tauxPour(cotations, date, devise, 10);
        assert.notEqual(taux, null, `taux introuvable dans data/change/ pour ${date} ${devise}`);
        tauxCache[`${date}|${devise}`] = { taux, source: 'depot' };
      }

      simulateur.evaluer('compute')();

      const obtenu = relever(document);
      assert.deepEqual(obtenu.montants, cas.attendu.montants, `${cas.nom} — montants affichés`);
      assert.deepEqual(obtenu.pourcents, cas.attendu.pourcents, `${cas.nom} — pourcentages affichés`);
    });
  }
});
