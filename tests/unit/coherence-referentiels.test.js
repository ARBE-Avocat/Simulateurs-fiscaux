/**
 * Cohérence entre les référentiels et ce que les simulateurs affichent (#16).
 *
 * L'extraction a sorti les valeurs fiscales du JavaScript. Il reste des valeurs
 * pré-remplies dans des attributs `value` du HTML, pour les champs que
 * l'utilisateur peut modifier : elles ne sont pas encore générées.
 *
 * Ces tests garantissent qu'elles ne peuvent pas diverger des données sans être
 * vues. Sans eux, une mise à jour de `data/` laisserait le formulaire afficher
 * l'ancien barème tout en calculant avec le nouveau — l'incohérence la plus
 * difficile à repérer à l'œil.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const { chargerSimulateur, lireHtml, chemin } = require('../helpers/simulateurs');

/** Ouvre un lecteur de référentiel hors navigateur. */
function lecteurDmtg() {
  const contexte = { REFERENTIELS: require('../../src/genere/referentiels.js') };
  vm.runInNewContext(
    fs.readFileSync(chemin('src', 'lecture-referentiels.js'), 'utf8'),
    contexte,
    { filename: 'src/lecture-referentiels.js' },
  );
  return contexte.LectureReferentiels.lecteur('dmtg');
}

/** Lit l'attribut `value` d'un champ du HTML, tel que le navigateur l'affiche. */
function valeurPrerempli(html, id) {
  const motif = new RegExp(`<input[^>]*\\bid="${id}"[^>]*>`, 'i');
  const balise = motif.exec(html);
  assert.ok(balise, `champ ${id} introuvable dans le HTML`);
  const value = /\bvalue="([^"]*)"/i.exec(balise[0]);
  assert.ok(value, `le champ ${id} n'a pas d'attribut value`);
  return Number(value[1]);
}

test('Démembrement — les abattements pré-remplis dans le HTML suivent le référentiel', () => {
  const dmtg = lecteurDmtg();
  const html = lireHtml('demembrement');

  const attendus = {
    p_aba_directe: dmtg.valeur('dmtg.abattement.enfant'),
    p_aba_frere: dmtg.valeur('dmtg.abattement.frere-soeur'),
    p_aba_neveu: dmtg.valeur('dmtg.abattement.neveu-niece'),
    p_aba_autre: dmtg.valeur('dmtg.abattement.autre'),
  };

  for (const [id, attendu] of Object.entries(attendus)) {
    assert.equal(
      valeurPrerempli(html, id),
      attendu,
      `${id} affiché dans le formulaire ne correspond plus à data/referentiels/dmtg.json`,
    );
  }
});

test('Démembrement — le barème pré-rempli dans le HTML suit le référentiel', () => {
  const dmtg = lecteurDmtg();
  const html = lireHtml('demembrement');
  const tranches = dmtg.bareme('dmtg.bareme.ligne-directe');

  tranches.forEach((tranche, index) => {
    const idx = index + 1;
    assert.equal(valeurPrerempli(html, `p_t${idx}_low`), tranche.min, `p_t${idx}_low`);
    assert.equal(valeurPrerempli(html, `p_t${idx}_taux`), tranche.taux * 100, `p_t${idx}_taux`);
    if (tranche.max !== Infinity) {
      assert.equal(valeurPrerempli(html, `p_t${idx}_high`), tranche.max, `p_t${idx}_high`);
    }
  });
});

test('Démembrement — « rétablir les valeurs par défaut » rétablit le référentiel', () => {
  const dmtg = lecteurDmtg();
  const simulateur = chargerSimulateur('demembrement');
  const { document } = simulateur.dom;

  // On dégrade volontairement tous les paramètres avant de demander la remise à
  // zéro : sans cela, le test passerait même si le bouton ne faisait rien.
  for (const id of ['p_aba_directe', 'p_aba_frere', 'p_aba_neveu', 'p_aba_autre']) {
    document.getElementById(id).value = '1';
  }
  for (let idx = 1; idx <= 7; idx += 1) {
    document.getElementById(`p_t${idx}_low`).value = '1';
    document.getElementById(`p_t${idx}_taux`).value = '1';
    const high = document.getElementById(`p_t${idx}_high`);
    if (high) high.value = '1';
  }

  simulateur.evaluer('resetParams')();
  const parametres = simulateur.evaluer('getParams')();

  assert.equal(parametres.aba_directe, dmtg.valeur('dmtg.abattement.enfant'));
  assert.equal(parametres.aba_frere, dmtg.valeur('dmtg.abattement.frere-soeur'));
  assert.equal(parametres.aba_neveu, dmtg.valeur('dmtg.abattement.neveu-niece'));
  assert.equal(parametres.aba_autre, dmtg.valeur('dmtg.abattement.autre'));

  const attendues = dmtg.bareme('dmtg.bareme.ligne-directe');
  assert.equal(parametres.tranches.length, attendues.length);
  parametres.tranches.forEach((tranche, i) => {
    assert.equal(tranche.low, attendues[i].min, `tranche ${i + 1} — borne basse`);
    assert.equal(tranche.high, attendues[i].max, `tranche ${i + 1} — borne haute`);
    // Le taux fait un aller-retour par le pourcentage affiché à l'écran. Cette
    // égalité stricte vérifie qu'il en revient intact.
    assert.equal(tranche.taux, attendues[i].taux, `tranche ${i + 1} — taux`);
  });
});

test('Succession — les abattements par lien viennent du référentiel', () => {
  const dmtg = lecteurDmtg();
  const simulateur = chargerSimulateur('succession');
  const liens = simulateur.evaluer('LIENS');

  const correspondances = {
    enfant: 'dmtg.abattement.enfant',
    ascendant: 'dmtg.abattement.ascendant',
    petitenfant: 'dmtg.abattement.petit-enfant',
    arriere: 'dmtg.abattement.arriere-petit-enfant',
    frere_soeur: 'dmtg.abattement.frere-soeur',
    neveu_niece: 'dmtg.abattement.neveu-niece',
    handicape: 'dmtg.abattement.handicape',
    autre: 'dmtg.abattement.autre',
  };

  for (const [lien, id] of Object.entries(correspondances)) {
    assert.equal(liens[lien].abat, dmtg.valeur(id), `abattement du lien ${lien}`);
  }

  // L'exonération du conjoint reste représentée par une valeur sentinelle dans
  // le calcul, mais par un booléen dans les données.
  assert.equal(liens.conjoint.abat, Infinity);
  assert.equal(dmtg.valeur('dmtg.conjoint.exonere'), true);
});

test('Référentiels — aucune valeur contestée ne peut être lue comme une valeur unique', () => {
  const dmtg = lecteurDmtg();
  assert.throws(
    () => dmtg.valeur('dmtg.bareme.ligne-directe.inexistante'),
    /entrée inconnue/,
  );
});

test('Référentiels — un simulateur signale clairement des données absentes', () => {
  // Panne la plus probable en exploitation : le fichier généré n'a pas été
  // produit. Le message doit dire quoi faire, pas planter sur « undefined ».
  const contexte = {};
  vm.runInNewContext(
    fs.readFileSync(chemin('src', 'lecture-referentiels.js'), 'utf8'),
    contexte,
    { filename: 'src/lecture-referentiels.js' },
  );
  assert.throws(
    () => contexte.LectureReferentiels.lecteur('dmtg'),
    /npm run donnees:generer/,
  );
});
