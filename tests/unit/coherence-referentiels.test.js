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
const { lecteur, contexteAvec, description, domaines } = require('../helpers/referentiels');

/** Ouvre un lecteur du domaine des mutations à titre gratuit. */
const lecteurDmtg = () => lecteur('dmtg');

/**
 * Recopie une valeur venue du contexte isolé d'un simulateur.
 *
 * Les tableaux qui y sont créés n'ont pas le même prototype que ceux du test :
 * une comparaison stricte échouerait alors que les valeurs sont identiques.
 */
function recopier(valeur) {
  return JSON.parse(JSON.stringify(valeur));
}

/**
 * Valeur affichée par un champ une fois la page chargée.
 *
 * Les paramètres fiscaux modifiables ne portent plus d'attribut `value` dans le
 * HTML : le script les écrit au chargement depuis le référentiel. C'est donc
 * après chargement qu'on les relève, et non dans la source de la page.
 */
function valeurAffichee(simulateur, id) {
  const champ = simulateur.dom.document.getElementById(id);
  assert.ok(champ, `champ introuvable : ${id}`);
  assert.notEqual(champ.value, '', `le champ ${id} n'a pas été rempli au chargement`);
  return Number(champ.value);
}

/** Vérifie qu'aucun champ ne porte plus de valeur fiscale écrite dans le HTML. */
function assertAucuneValeurEnDur(cle, ids) {
  const html = lireHtml(cle);
  for (const id of ids) {
    const balise = new RegExp(`<input[^>]*\\bid="${id}"[^>]*>`, 'i').exec(html);
    assert.ok(balise, `champ ${id} introuvable dans le HTML`);
    assert.equal(
      /\bvalue\s*=/i.test(balise[0]),
      false,
      `${id} porte encore une valeur écrite dans le HTML : une mise à jour des `
        + 'données obligerait à modifier la page',
    );
  }
}

test('Démembrement — le formulaire affiche les abattements du référentiel', () => {
  const dmtg = lecteurDmtg();
  const simulateur = chargerSimulateur('demembrement');

  const attendus = {
    p_aba_directe: dmtg.valeur('dmtg.abattement.enfant'),
    p_aba_frere: dmtg.valeur('dmtg.abattement.frere-soeur'),
    p_aba_neveu: dmtg.valeur('dmtg.abattement.neveu-niece'),
    p_aba_autre: dmtg.valeur('dmtg.abattement.autre'),
  };

  for (const [id, attendu] of Object.entries(attendus)) {
    assert.equal(valeurAffichee(simulateur, id), attendu, `${id} affiché dans le formulaire`);
  }
  assertAucuneValeurEnDur('demembrement', Object.keys(attendus));
});

test('Démembrement — le formulaire affiche le barème du référentiel', () => {
  const dmtg = lecteurDmtg();
  const simulateur = chargerSimulateur('demembrement');
  const tranches = dmtg.bareme('dmtg.bareme.ligne-directe');
  const champs = [];

  tranches.forEach((tranche, index) => {
    const idx = index + 1;
    assert.equal(valeurAffichee(simulateur, `p_t${idx}_low`), tranche.min, `p_t${idx}_low`);
    assert.equal(valeurAffichee(simulateur, `p_t${idx}_taux`), tranche.taux * 100, `p_t${idx}_taux`);
    champs.push(`p_t${idx}_low`, `p_t${idx}_taux`);
    if (tranche.max !== Infinity) {
      assert.equal(valeurAffichee(simulateur, `p_t${idx}_high`), tranche.max, `p_t${idx}_high`);
      champs.push(`p_t${idx}_high`);
    }
  });
  assertAucuneValeurEnDur('demembrement', champs);
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

test('Référentiels — un domaine non chargé produit un message qui dit quoi faire', () => {
  // Panne la plus probable après l'ajout d'un domaine : la page a oublié une
  // balise. Le message doit nommer le fichier à charger, pas planter sur
  // « undefined ».
  const contexte = contexteAvec();
  assert.throws(
    () => contexte.LectureReferentiels.lecteur('dmtg'),
    /src\/genere\/referentiels\/dmtg\.js/,
  );
});

// ── Impôt sur le revenu (#14) ───────────────────────────────────────────────

test('IRPP — le formulaire affiche le barème du référentiel', () => {
  const ir = lecteur('ir');
  const simulateur = chargerSimulateur('irpp');
  const tranches = ir.bareme('ir.bareme.progressif');
  const champs = ['t1_de'];

  assert.equal(valeurAffichee(simulateur, 't1_de'), tranches[0].min, 'début de la première tranche');
  tranches.slice(0, -1).forEach((tranche, index) => {
    assert.equal(
      valeurAffichee(simulateur, `t${index + 1}_a`), tranche.max,
      `borne haute de la tranche ${index + 1}`,
    );
    champs.push(`t${index + 1}_a`);
  });
  tranches.slice(1).forEach((tranche, index) => {
    assert.equal(
      valeurAffichee(simulateur, `t${index + 2}_tx`), tranche.taux * 100,
      `taux de la tranche ${index + 2}`,
    );
    champs.push(`t${index + 2}_tx`);
  });
  assertAucuneValeurEnDur('irpp', champs);
});

test('IRPP — le formulaire affiche les paramètres du référentiel', () => {
  const ir = lecteur('ir');
  const simulateur = chargerSimulateur('irpp');

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
    assert.equal(valeurAffichee(simulateur, champ), ir.valeur(id), `${champ} affiché`);
  }
  assertAucuneValeurEnDur('irpp', Object.keys(attendus));
});

test('IR, CEHR et CDHR — le taux de prélèvements sociaux affiché est la variante employée', () => {
  // Le champ reste modifiable, mais ce qu'il affiche vient du référentiel. Le
  // jour où le référent fiscal tranchera la fiche 2.2, la page suivra sans être
  // modifiée.
  const ps = lecteur('prelevements-sociaux');
  const simulateur = chargerSimulateur('ir-cehr-cdhr');

  assert.equal(
    valeurAffichee(simulateur, 'tauxPS'),
    ps.variante('ps.taux.global', '18-6') * 100,
  );
  assertAucuneValeurEnDur('ir-cehr-cdhr', ['tauxPS']);
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
  // `recopier` des deux côtés : les lecteurs de référentiel s'exécutent eux
  // aussi dans un contexte isolé, comme les simulateurs.
  const attendu = recopier(lecteur('ifi').bareme('ifi.bareme.progressif')
    .map((t) => [t.min, t.max === Infinity ? null : t.max, t.taux]));

  const depuisIfi = chargerSimulateur('ifi').evaluer('BAREME')
    .map((t) => [t.min, t.max === Infinity ? null : t.max, t.taux]);
  assert.deepEqual(recopier(depuisIfi), attendu, 'barème du simulateur IFI');

  const depuisIrpp = chargerSimulateur('irpp').evaluer('IFI').bareme
    .map((t) => [t.min, t.max === Infinity ? null : t.max, t.taux]);
  assert.deepEqual(recopier(depuisIrpp), attendu, 'barème de la section IFI de l’IRPP');
});

test('IFI — le barème du référentiel ne laisse plus aucun intervalle sans taux', () => {
  // Ce test figeait auparavant le défaut : le barème faisait commencer chaque
  // tranche un euro au-dessus de la précédente, et il vérifiait que la
  // validation signalait bien les cinq intervalles d'un euro ainsi laissés
  // sans taux. L'issue #7 les a supprimés en rendant les tranches jointives,
  // comme celles de l'impôt sur le revenu et des mutations à titre gratuit.
  // Le test vérifie donc désormais que le trou a disparu, au lieu de le
  // décrire.
  const { validerReferentiel } = require('../../scripts/lib/schema-referentiel');
  const referentiel = require('../../data/referentiels/ifi.json');
  const rapport = validerReferentiel(referentiel);

  assert.deepEqual(rapport.erreurs, []);
  assert.deepEqual(
    rapport.avertissements.filter((a) => /intervalle non couvert/.test(a.message)),
    [],
    'aucun euro ne doit rester sans taux (issue #7)',
  );
});

// ── Plus-value immobilière (#17) ────────────────────────────────────────────

test('Plus-value immobilière — le simulateur désigne la variante 17,2 %', () => {
  assert.match(
    lireHtml('pv-immobiliere'),
    /REF_PS\.variante\('ps\.taux\.global', '17-2'\)/,
    'le simulateur doit désigner explicitement la variante qu’il applique',
  );
});

test('Plus-value immobilière — les paliers de surtaxe se suivent sans trou', () => {
  // La surtaxe est décrite par une table et non par un barème : le schéma ne
  // peut pas en vérifier la continuité. Ce contrôle le fait ici.
  const paliers = lecteur('pv-immobiliere').valeur('pv-immobiliere.surtaxe.paliers');

  assert.ok(paliers.length >= 2);
  assert.equal(paliers[paliers.length - 1].plafond, null, 'le dernier palier est sans plafond');

  paliers.slice(0, -1).forEach((palier, i) => {
    assert.equal(typeof palier.plafond, 'number', `palier ${i + 1} — plafond`);
    if (i > 0) {
      assert.ok(
        palier.plafond > paliers[i - 1].plafond,
        `palier ${i + 1} — les plafonds doivent croître`,
      );
    }
    assert.ok(palier.taux >= 0 && palier.taux <= 1, `palier ${i + 1} — taux hors plage`);
  });
});

test('Plus-value immobilière — la surtaxe reste continue au-delà du seuil d’entrée', () => {
  // Une table mal saisie produirait un saut d'impôt à un euro près. On compare
  // la valeur au plafond d'un palier et un euro au-dessus.
  //
  // Le tout premier passage est exclu : le franchissement de 50 000 € est un
  // seuil d'entrée, et la surtaxe passe réellement de 0 € à environ 500 €. Ce
  // n'est pas un défaut de la table mais le comportement du simulateur, figé
  // par ailleurs dans le filet de non-régression.
  const surtaxe = chargerSimulateur('pv-immobiliere').evaluer('surtaxe');
  const paliers = lecteur('pv-immobiliere').valeur('pv-immobiliere.surtaxe.paliers');

  paliers.slice(1, -1).forEach((palier) => {
    const avant = surtaxe(palier.plafond);
    const apres = surtaxe(palier.plafond + 1);
    assert.ok(
      Math.abs(apres - avant) < 1,
      `saut de ${(apres - avant).toFixed(2)} € au passage du palier de ${palier.plafond} €`,
    );
  });

  assert.equal(surtaxe(50000), 0, 'la surtaxe ne s’applique pas jusqu’à 50 000 €');
  assert.ok(surtaxe(50001) > 400, 'le franchissement du seuil d’entrée est un saut, non un lissage');
});
