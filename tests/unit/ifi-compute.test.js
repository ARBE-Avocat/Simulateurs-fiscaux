/**
 * Tests du simulateur IFI.
 *
 * Deux objectifs :
 * 1. reproduire le défaut de l'issue #6 — le calcul s'appuie sur une variable
 *    globale et sur une redéfinition de `compute` après sa définition ;
 * 2. figer les résultats existants pour prouver que la correction ne change
 *    aucun montant.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { chargerSimulateur, chemin, lireHtml } = require('../helpers/simulateurs');
const { assertProche } = require('../helpers/assertions');

const fixture = JSON.parse(
  fs.readFileSync(chemin('tests', 'fixtures', 'ifi-scenarios.json'), 'utf8')
);

/**
 * Prépare un simulateur IFI isolé, saisit un scénario et retourne le résultat
 * transmis à l'affichage.
 *
 * Le calcul ne renvoie pas encore son résultat : il appelle `renderResults`.
 * On remplace donc cette fonction pour intercepter l'objet produit. Découpler
 * réellement le moteur de l'affichage est l'objet de l'issue #25.
 */
function calculerScenario({ biens = [], champs = {} }) {
  const simulateur = chargerSimulateur('ifi');
  let resultat = null;
  simulateur.contexte.renderResults = (r) => {
    resultat = r;
  };

  for (const bien of biens) {
    simulateur.evaluer('addBien')(bien);
  }
  for (const [id, valeur] of Object.entries(champs)) {
    simulateur.dom.document.getElementById(id).value = String(valeur);
  }
  simulateur.evaluer('compute')();

  assert.ok(resultat, "le calcul n'a produit aucun résultat");
  return { simulateur, resultat };
}

test('IFI — les scénarios de référence donnent les mêmes montants', async (t) => {
  for (const cas of fixture.cas) {
    await t.test(cas.nom, () => {
      const { resultat } = calculerScenario(cas);
      for (const [clef, attendu] of Object.entries(cas.attendu)) {
        assertProche(resultat[clef], attendu, fixture.tolerance, `${cas.nom} — ${clef}`);
      }
    });
  }
});

test("IFI — le calcul ne dépend d'aucune variable globale de patrimoine", () => {
  // Défaut de l'issue #6 : `compute()` lit un `patrimoinebrut` global alimenté
  // par une fonction enveloppe. Le résultat dépend alors d'un état extérieur au
  // calcul, et non des seules saisies.
  const { simulateur } = calculerScenario({ biens: [{ valeur: 2000000 }] });
  assert.equal(
    typeof simulateur.contexte.patrimoinebrut,
    'undefined',
    'aucune variable globale de patrimoine ne doit subsister après un calcul'
  );
});

test("IFI — le calcul donne le même résultat quel que soit l'ordre des appels", () => {
  // Un second calcul sans nouvelle saisie doit produire exactement le même
  // résultat que le premier : rien ne doit être mémorisé entre deux appels.
  const simulateur = chargerSimulateur('ifi');
  const resultats = [];
  simulateur.contexte.renderResults = (r) => resultats.push(r);

  simulateur.evaluer('addBien')({ valeur: 2500000 });
  simulateur.dom.document.getElementById('dedInterets').value = '300000';
  simulateur.evaluer('compute')();
  simulateur.evaluer('compute')();

  const premier = resultats[resultats.length - 2];
  const second = resultats[resultats.length - 1];
  assertProche(second.patrimoineNet, premier.patrimoineNet, 0.01, 'patrimoine net stable');
  assertProche(second.ifiFinal, premier.ifiFinal, 0.01, 'IFI final stable');
});

test("IFI — le calcul n'est défini qu'une seule fois", () => {
  // Redéfinir `compute` après coup crée deux versions du calcul : celle que
  // l'interface appelle et celle que le reste du script référence.
  const html = lireHtml('ifi');
  assert.ok(
    !/window\.compute\s*=/.test(html),
    'le calcul ne doit pas être redéfini via window.compute après sa déclaration'
  );
  assert.ok(
    !/const\s+_compute\s*=/.test(html),
    'aucune copie de sauvegarde du calcul ne doit subsister'
  );
});

test("IFI — l'initialisation de la page produit un résultat sans erreur", () => {
  // Critère de l'issue #6 : le résultat initial doit s'afficher au chargement.
  // La page ajoute un bien d'exemple puis lance un calcul depuis
  // `DOMContentLoaded` ; on rejoue cet enchaînement.
  const simulateur = chargerSimulateur('ifi');
  let resultat = null;
  simulateur.contexte.renderResults = (r) => {
    resultat = r;
  };

  const ecouteursAppeles = simulateur.dom.declencher('DOMContentLoaded');

  assert.ok(ecouteursAppeles > 0, "aucune initialisation n'a été déclenchée");
  assert.ok(resultat, "l'initialisation n'a produit aucun résultat");
  assert.equal(resultat.patrimoineBrut, 0, 'le bien d’exemple est ajouté avec une valeur nulle');
  assert.equal(resultat.ifiFinal, 0, 'aucun IFI dû sur un patrimoine nul');
});

test("IFI — le recalcul après modification d'un bien reflète la nouvelle valeur", () => {
  // Second critère de l'issue #6 : après modification d'un bien, le calcul doit
  // repartir des données à jour et non d'un état mémorisé ailleurs.
  const simulateur = chargerSimulateur('ifi');
  const resultats = [];
  simulateur.contexte.renderResults = (r) => resultats.push(r);

  simulateur.evaluer('addBien')({ valeur: 2000000 });
  const bien = simulateur.evaluer('biens')[0];

  // Même enchaînement que le gestionnaire de la page :
  // setBienVal(...) ; renderBiens() ; compute().
  simulateur.evaluer('setBienVal')(bien.id, 'valeur', 3000000);
  simulateur.evaluer('renderBiens')();
  simulateur.evaluer('compute')();

  const dernier = resultats[resultats.length - 1];
  assertProche(dernier.patrimoineBrut, 3000000, 0.01, 'patrimoine brut après modification');
});

test("IFI — l'affichage des résultats reçoit bien tous les montants", () => {
  // Ce test n'intercepte pas l'affichage : il exerce le vrai rendu, afin de
  // vérifier que les montants transmis par le calcul portent bien les noms
  // attendus par le gabarit HTML.
  const simulateur = chargerSimulateur('ifi');
  simulateur.evaluer('addBien')({ valeur: 2000000 });
  simulateur.dom.document.getElementById('dedInterets').value = '200000';
  simulateur.evaluer('compute')();

  const rendu = String(simulateur.dom.document.getElementById('resultsBody').innerHTML);

  assert.ok(rendu.length > 0, "aucun résultat n'a été affiché");

  // `fmtEur` remplace une valeur absente par un tiret : on ne peut donc pas se
  // contenter de chercher « NaN » ou « undefined » dans le rendu. Le gabarit
  // affiche le patrimoine brut à deux endroits, la synthèse et le détail ; on
  // vérifie que les deux sont servis, ce qui échoue si l'un d'eux lit une clé
  // qui n'existe plus dans l'objet résultat.
  const brutFormate = simulateur.evaluer('fmtEur')(2000000);
  const occurrences = rendu.split(brutFormate).length - 1;
  assert.equal(
    occurrences,
    2,
    `le patrimoine brut doit apparaître dans la synthèse et dans le détail (trouvé ${occurrences} fois)`
  );
});
