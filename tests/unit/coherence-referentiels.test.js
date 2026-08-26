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

/**
 * Recopie une valeur venue du contexte isolé d'un simulateur.
 *
 * Les tableaux qui y sont créés n'ont pas le même prototype que ceux du test :
 * une comparaison stricte échouerait alors que les valeurs sont identiques.
 */
function recopier(valeur) {
  return JSON.parse(JSON.stringify(valeur));
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

// ── Impôt sur le revenu (#14) ───────────────────────────────────────────────

/** Ouvre un lecteur de référentiel pour un domaine quelconque. */
function lecteur(domaine) {
  const contexte = { REFERENTIELS: require('../../src/genere/referentiels.js') };
  vm.runInNewContext(
    fs.readFileSync(chemin('src', 'lecture-referentiels.js'), 'utf8'),
    contexte,
    { filename: 'src/lecture-referentiels.js' },
  );
  return contexte.LectureReferentiels.lecteur(domaine);
}

test('IRPP — le barème pré-rempli dans le formulaire suit le référentiel', () => {
  const ir = lecteur('ir');
  const html = lireHtml('irpp');
  const tranches = ir.bareme('ir.bareme.progressif');

  assert.equal(valeurPrerempli(html, 't1_de'), tranches[0].min, 'début de la première tranche');
  tranches.slice(0, -1).forEach((tranche, index) => {
    assert.equal(
      valeurPrerempli(html, `t${index + 1}_a`),
      tranche.max,
      `borne haute de la tranche ${index + 1}`,
    );
  });
  tranches.slice(1).forEach((tranche, index) => {
    assert.equal(
      valeurPrerempli(html, `t${index + 2}_tx`),
      tranche.taux * 100,
      `taux de la tranche ${index + 2}`,
    );
  });
});

test('IRPP — les paramètres pré-remplis du formulaire suivent le référentiel', () => {
  const ir = lecteur('ir');
  const html = lireHtml('irpp');

  const attendus = {
    aba_sal: 'ir.abattement.salaires.plafond',
    aba_pen: 'ir.abattement.pensions.plafond',
    dec_cel_seuil: 'ir.decote.celibataire.seuil',
    dec_cel_mt: 'ir.decote.celibataire.montant',
    dec_cou_seuil: 'ir.decote.couple.seuil',
    dec_cou_mt: 'ir.decote.couple.montant',
    cdhr_aba_ic: 'cdhr.abattement.imposition-commune',
    cdhr_aba_pac: 'cdhr.abattement.personne-a-charge',
  };

  for (const [champ, id] of Object.entries(attendus)) {
    assert.equal(
      valeurPrerempli(html, champ),
      ir.valeur(id),
      `${champ} affiché dans le formulaire ne correspond plus à data/referentiels/ir.json`,
    );
  }
});

test('IR, CEHR et CDHR — le taux de prélèvements sociaux pré-rempli est bien la variante employée', () => {
  // Le champ est modifiable et sa valeur pré-remplie reste écrite dans le HTML.
  // Ce contrôle garantit qu'elle reste celle que le simulateur déclare employer,
  // et rend visible le jour où le référent fiscal tranchera la fiche 2.2.
  const ps = lecteur('prelevements-sociaux');
  const html = lireHtml('ir-cehr-cdhr');

  assert.equal(
    valeurPrerempli(html, 'tauxPS'),
    ps.variante('ps.taux.global', '18-6') * 100,
  );
});

test('Prélèvements sociaux — les deux simulateurs désignent des variantes différentes', () => {
  // C'est la divergence de la fiche 2.2, représentée et non tranchée. Si un jour
  // les deux simulateurs lisaient la même variante, ce test le signalerait :
  // l'arbitrage doit passer par les données, pas par une retouche de code.
  const ps = lecteur('prelevements-sociaux');
  const entree = ps.entree('ps.taux.global');

  assert.equal(entree.statutValidation, 'conteste');
  assert.equal(entree.valeur, undefined, 'une règle contestée n\'a pas de valeur unique');

  const parSimulateur = {};
  entree.variantes.forEach((variante) => {
    variante.utilisePar.forEach((cle) => { parSimulateur[cle] = variante.cle; });
  });
  assert.equal(parSimulateur.irpp, '17-2');
  assert.equal(parSimulateur['pv-immobiliere'], '17-2');
  assert.equal(parSimulateur['ir-cehr-cdhr'], '18-6');

  assert.match(
    lireHtml('irpp'),
    /PS\.variante\('ps\.taux\.global', '17-2'\)/,
    'le simulateur IRPP doit désigner explicitement sa variante',
  );
  assert.match(
    lireHtml('ir-cehr-cdhr'),
    /PS\.variante\('ps\.taux\.global', '18-6'\)/,
    'le simulateur IR doit désigner explicitement sa variante',
  );
});

// ── Impôt sur la fortune immobilière (#15) ──────────────────────────────────

test('IFI — les deux simulateurs lisent le même barème, il n’en existe plus qu’un', () => {
  // Avant l'extraction, le barème IFI était écrit deux fois, sous deux formes
  // différentes. Rien ne garantissait qu'ils restent identiques.
  const attendu = lecteur('ifi').bareme('ifi.bareme.progressif')
    .map((t) => [t.min, t.max === Infinity ? null : t.max, t.taux]);

  const depuisIfi = chargerSimulateur('ifi').evaluer('BAREME')
    .map((t) => [t.min, t.max === Infinity ? null : t.max, t.taux]);
  assert.deepEqual(recopier(depuisIfi), attendu, 'barème du simulateur IFI');

  const depuisIrpp = chargerSimulateur('irpp').evaluer('IFI').bareme
    .map((t) => [t.min, t.max === Infinity ? null : t.max, t.taux]);
  assert.deepEqual(recopier(depuisIrpp), attendu, 'barème de la section IFI de l’IRPP');
});

test('IFI — le barème du référentiel signale ses intervalles non couverts', () => {
  // Le barème réellement employé fait commencer chaque tranche un euro au-dessus
  // de la précédente. L'extraction conserve ce comportement — le corriger
  // changerait un résultat — mais la validation doit continuer de le dire.
  const { validerReferentiel } = require('../../scripts/lib/schema-referentiel');
  const referentiel = require('../../data/referentiels/ifi.json');
  const rapport = validerReferentiel(referentiel);

  assert.deepEqual(rapport.erreurs, []);
  assert.equal(
    rapport.avertissements.filter((a) => /intervalle non couvert/.test(a.message)).length,
    5,
    'cinq intervalles d’un euro restent sans taux (issue #7)',
  );
});
