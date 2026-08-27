/**
 * Sélection et affichage du millésime fiscal (issue #19).
 *
 * Deux comportements sont vérifiés ici, et un seul compte vraiment :
 *
 * 1. le millésime employé est **choisi**, à partir de la date de la simulation,
 *    et non subi par l'ordre des entrées du fichier ;
 * 2. lorsque le millésime demandé n'existe pas, ou qu'aucune date ne permet de
 *    le demander, **le simulateur le dit**. C'est le point de l'issue : ne
 *    jamais basculer silencieusement sur un autre millésime.
 *
 * Les référentiels du dépôt ne portent aujourd'hui qu'un seul millésime par
 * domaine. Les cas à plusieurs millésimes sont donc joués sur un référentiel
 * de test construit ici, valide au regard de `scripts/lib/schema-referentiel.js`.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const { chemin } = require('../helpers/simulateurs');
const { contexteAvec, description } = require('../helpers/referentiels');
const { validerReferentiel } = require('../../scripts/lib/schema-referentiel');

/** Une entrée minimale, non validée, du millésime demandé. */
function entree(id, millesime, valeur, options = {}) {
  return {
    id,
    libelle: `Valeur d'essai ${id} (${millesime})`,
    type: 'montant',
    unite: 'EUR',
    millesime,
    dateEffet: options.dateEffet || 'inconnue',
    dateFin: null,
    statutValidation: 'non-valide',
    valeur,
    utilisePar: ['irpp'],
    source: options.source || 'inconnue',
  };
}

/**
 * Ouvre un lecteur sur un référentiel construit à la volée.
 *
 * Le référentiel est d'abord passé au schéma : un cas de test qui ne serait pas
 * un référentiel acceptable ne prouverait rien du comportement réel.
 */
function lecteurSur(entrees, options) {
  const domaine = {
    schema: 1, domaine: 'essai', libelle: "Domaine d'essai", entrees,
  };
  const rapport = validerReferentiel(domaine);
  assert.deepEqual(rapport.erreurs, [], "le référentiel d'essai doit être valide");

  const contexte = { REFERENTIELS: { essai: domaine } };
  vm.runInNewContext(
    fs.readFileSync(chemin('src', 'lecture-referentiels.js'), 'utf8'),
    contexte,
    { filename: 'src/lecture-referentiels.js' },
  );
  return contexte.LectureReferentiels.lecteur('essai', options);
}

/**
 * Recopie une valeur venue d'un contexte isolé.
 *
 * Les tableaux qui y sont créés n'ont pas le même prototype que ceux du test :
 * `deepEqual` échouerait alors que les valeurs sont identiques.
 */
function recopier(valeur) {
  return JSON.parse(JSON.stringify(valeur));
}

/** Charge `src/millesime.js` dans un contexte isolé. */
function moduleMillesime() {
  const contexte = {};
  vm.runInNewContext(
    fs.readFileSync(chemin('src', 'millesime.js'), 'utf8'),
    contexte,
    { filename: 'src/millesime.js' },
  );
  return contexte.Millesime;
}

const DEUX_MILLESIMES = [
  entree('essai.plafond', 2024, 1000),
  entree('essai.plafond', 2025, 1100),
];

// ── Sélection ────────────────────────────────────────────────────────────────

test('millésime — la valeur lue est celle de l\'année demandée, pas la dernière du fichier', () => {
  assert.equal(lecteurSur(DEUX_MILLESIMES, { millesime: 2024 }).valeur('essai.plafond'), 1000);
  assert.equal(lecteurSur(DEUX_MILLESIMES, { millesime: 2025 }).valeur('essai.plafond'), 1100);
});

test("millésime — l'ordre des entrées dans le fichier ne change rien", () => {
  const inverse = [DEUX_MILLESIMES[1], DEUX_MILLESIMES[0]];
  assert.equal(lecteurSur(inverse, { millesime: 2024 }).valeur('essai.plafond'), 1000);
});

test('millésime — une année demandée en chiffres ou en texte donne le même résultat', () => {
  assert.equal(lecteurSur(DEUX_MILLESIMES, { millesime: '2024' }).valeur('essai.plafond'), 1000);
});

test('millésime — un seul millésime disponible s\'applique sans date, mais le statut le dit', () => {
  const l = lecteurSur([entree('essai.plafond', 2025, 1100)]);
  assert.equal(l.valeur('essai.plafond'), 1100);
  assert.equal(l.resolution().statut, 'non-ancre');
});

test('millésime — plusieurs millésimes sans date de rattachement : le lecteur refuse de deviner', () => {
  assert.throws(
    () => lecteurSur(DEUX_MILLESIMES),
    /millésimes disponibles/,
    'deviner l\'année fiscale reviendrait à la choisir sans le dire',
  );
});

// ── Date non couverte ────────────────────────────────────────────────────────

test('millésime — une année postérieure aux données retient le dernier millésime connu et le signale', () => {
  const r = lecteurSur(DEUX_MILLESIMES, { millesime: 2030 }).resolution();
  assert.equal(r.retenu, 2025);
  assert.equal(r.statut, 'hors-couverture');
  assert.equal(r.sens, 'anterieur');
  assert.equal(r.demande, 2030);
});

test('millésime — une année antérieure aux données retient le plus ancien millésime et le signale', () => {
  const r = lecteurSur(DEUX_MILLESIMES, { millesime: 1998 }).resolution();
  assert.equal(r.retenu, 2024);
  assert.equal(r.statut, 'hors-couverture');
  assert.equal(r.sens, 'posterieur');
});

test("millésime — une règle absente du millésime retenu est lue ailleurs, et l'écart est relevé", () => {
  const l = lecteurSur([
    entree('essai.plafond', 2024, 1000),
    entree('essai.plafond', 2025, 1100),
    entree('essai.ancienne', 2024, 42),
  ], { millesime: 2025 });

  assert.equal(l.valeur('essai.ancienne'), 42);
  const ecarts = l.resolution().ecarts;
  assert.equal(ecarts.length, 1);
  assert.equal(ecarts[0].id, 'essai.ancienne');
  assert.equal(ecarts[0].millesime, 2024);

  // Un écart d'entrée est toujours une alerte : la valeur employée ne se
  // rattache même pas au millésime que le bandeau annonce.
  const Millesime = moduleMillesime();
  const resume = Millesime.resumer([l.resolution()], null);
  assert.equal(resume.alertes.length, 1);
  assert.match(resume.alertes[0].texte, /n'existe pas au millésime 2025/);
});

// ── Traçabilité affichée ─────────────────────────────────────────────────────

test('millésime — la résolution rend la date d\'effet et la révision réellement présentes', () => {
  const r = lecteurSur([
    entree('essai.a', 2025, 1, {
      dateEffet: '2025-01-01',
      source: { reference: 'CGI art. 1er', dateConsultation: '2026-08-01' },
    }),
    entree('essai.b', 2025, 2, {
      dateEffet: '2025-01-01',
      source: { reference: 'CGI art. 2', dateConsultation: '2026-08-20' },
    }),
  ], { millesime: 2025 }).resolution();

  assert.deepEqual(recopier(r.datesEffet), ['2025-01-01']);
  assert.equal(r.revision, '2026-08-20', 'la révision est la consultation la plus tardive');
  assert.deepEqual(recopier(r.statutsValidation), { 'non-valide': 2 });
});

test("millésime — une date d'effet inconnue n'est jamais remplacée par une date inventée", () => {
  const r = lecteurSur([entree('essai.a', 2025, 1)], { millesime: 2025 }).resolution();
  assert.deepEqual(recopier(r.datesEffet), ['inconnue']);
  assert.equal(r.revision, 'inconnue');
});

// ── Mise en mots ─────────────────────────────────────────────────────────────

test("millésime — un millésime plus ancien que l'année simulée est mentionné, sans alarmer", () => {
  // Une valeur sans date de fin peut être toujours en vigueur. Le bandeau le
  // dit, mais ne prétend pas que le résultat est faux.
  const Millesime = moduleMillesime();
  const r = lecteurSur(DEUX_MILLESIMES, { millesime: 2030 }).resolution();
  const resume = Millesime.resumer([r], { libelle: 'Date de cession', valeur: '2030-06-15' });

  assert.equal(resume.notes.length, 1);
  assert.equal(resume.notes[0].niveau, 'mention');
  assert.deepEqual(recopier(resume.alertes), []);
  assert.match(resume.notes[0].texte, /2030/);
  assert.match(resume.notes[0].texte, /2025/);
  assert.match(resume.notes[0].texte, /toujours en vigueur/);
  assert.match(resume.texte, /Date de cession : 15 juin 2030/);
});

test("millésime — un millésime postérieur à l'année simulée est une alerte", () => {
  // Appliquer 2024 à une cession de 1998, c'est appliquer du droit qui n'existait
  // pas encore : là, le résultat est faux à coup sûr.
  const Millesime = moduleMillesime();
  const r = lecteurSur(DEUX_MILLESIMES, { millesime: 1998 }).resolution();
  const resume = Millesime.resumer([r], { libelle: 'Date de cession', valeur: '1998-06-15' });

  assert.equal(resume.alertes.length, 1);
  assert.match(resume.alertes[0].texte, /ne reflètent donc pas le droit de 1998/);
});

test("millésime — le résumé signale l'absence de date de rattachement", () => {
  const Millesime = moduleMillesime();
  const r = lecteurSur([entree('essai.a', 2025, 1)]).resolution();
  const resume = Millesime.resumer([r], null);

  assert.equal(resume.notes.length, 1);
  assert.equal(resume.notes[0].niveau, 'mention');
  assert.match(resume.notes[0].texte, /ne demande aucune date/i);
});

test('millésime — un millésime exact ne produit aucun avertissement', () => {
  const Millesime = moduleMillesime();
  const r = lecteurSur(DEUX_MILLESIMES, { millesime: 2025 }).resolution();
  assert.deepEqual(
    recopier(Millesime.resumer([r], { libelle: 'Date de cession', valeur: '2025-06-15' }).notes),
    [],
  );
});

test('millésime — le résumé nomme la source et le statut de validation des valeurs employées', () => {
  const Millesime = moduleMillesime();
  const r = lecteurSur(DEUX_MILLESIMES, { millesime: 2025 }).resolution();
  const ligne = Millesime.resumer([r], null).lignes[0];

  assert.equal(ligne.millesime, 2025);
  assert.equal(ligne.dateEffet, 'inconnue');
  assert.equal(ligne.revision, 'inconnue');
  assert.match(ligne.validation, /non validée/);
});

// ── Les référentiels réels du dépôt ──────────────────────────────────────────

test("millésime — chaque référentiel du dépôt s'ouvre sur son propre millésime", () => {
  for (const domaine of Object.keys(require('../helpers/referentiels').MANIFESTE.domaines)) {
    const contexte = contexteAvec(domaine);
    const disponibles = contexte.LectureReferentiels.millesimesDisponibles(domaine);
    assert.ok(disponibles.length >= 1, `${domaine} doit porter au moins un millésime`);

    const l = contexte.LectureReferentiels.lecteur(domaine, { millesime: disponibles[0] });
    assert.equal(l.resolution().statut, 'exact');
    assert.equal(l.millesime, disponibles[0]);
    assert.equal(l.resolution().entrees, description(domaine).entrees);
  }
});
