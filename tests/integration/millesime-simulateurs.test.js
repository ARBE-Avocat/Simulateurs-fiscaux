/**
 * Le millésime employé est visible dans les six simulateurs (issue #19).
 *
 * Avant ce chantier, la seule indication de fraîcheur fiscale était le nom du
 * fichier HTML — « Simulation IFI - Avril 2026 ». Rien à l'écran ne disait quel
 * millésime servait au calcul, ni si ce millésime correspondait à la date de la
 * situation simulée.
 *
 * Ces tests vérifient que le bandeau existe, qu'il est rempli, et surtout
 * qu'aucun simulateur n'applique un millésime sans le dire.
 *
 * Le faux DOM ne prouve pas l'apparence du bandeau : celle-ci a été vérifiée en
 * navigateur réel, voir le compte rendu de la pull request.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { chargerSimulateur, SIMULATEURS, lireHtml } = require('../helpers/simulateurs');

/** Textes empilés dans le bandeau, dans l'ordre où ils y ont été ajoutés. */
function textesDuBandeau(simulateur) {
  const bandeau = simulateur.dom.document.getElementById('bandeauMillesime');
  return bandeau.children.map((enfant) => enfant.textContent).filter(Boolean);
}

test('millésime — chaque simulateur charge le module et réserve un emplacement', () => {
  for (const { cle } of SIMULATEURS) {
    const html = lireHtml(cle);
    assert.match(html, /<script src="src\/millesime\.js"><\/script>/, `${cle} doit charger src/millesime.js`);
    assert.match(html, /id="bandeauMillesime"/, `${cle} doit porter le bandeau`);
  }
});

test('millésime — chaque simulateur affiche le référentiel qu\'il emploie', () => {
  for (const { cle } of SIMULATEURS) {
    const simulateur = chargerSimulateur(cle);
    const textes = textesDuBandeau(simulateur);

    assert.ok(textes.length >= 2, `${cle} : le bandeau doit être rempli au chargement`);
    assert.equal(textes[0], 'Référentiel fiscal employé', `${cle} : titre du bandeau`);
    assert.ok(
      textes.some((t) => /millésime \d{4}|^\d{4}$/.test(t)),
      `${cle} : un millésime doit être affiché — obtenu ${JSON.stringify(textes)}`,
    );
  }
});

test("millésime — aucun simulateur n'applique un millésime en silence", () => {
  // Les cinq simulateurs sans date fiscale saisie doivent le dire, et celui qui
  // en a une doit dire qu'elle n'est pas encore renseignée. Dans les deux cas,
  // le bandeau porte une note : c'est exactement ce que demande l'issue.
  for (const { cle } of SIMULATEURS) {
    const simulateur = chargerSimulateur(cle);
    const textes = textesDuBandeau(simulateur);
    assert.ok(
      textes.some((t) => /ne demande aucune date|n'est pas renseigné/i.test(t)),
      `${cle} : le bandeau doit signaler l'absence de date de rattachement`,
    );
  }
});

test("millésime — la plus-value immobilière suit la date de cession saisie", () => {
  const simulateur = chargerSimulateur('pv-immobiliere');
  const { document } = simulateur.dom;

  document.getElementById('dateCes').value = '2019-06-01';
  simulateur.evaluer('compute')();

  assert.equal(simulateur.evaluer('millesimeCharge'), 2019, 'le millésime demandé suit la cession');
  const textes = textesDuBandeau(simulateur);
  assert.ok(
    textes.some((t) => /ne reflètent donc pas le droit de 2019/.test(t)),
    `une cession de 2019 calculée avec un référentiel postérieur doit être signalée — obtenu ${JSON.stringify(textes)}`,
  );
  assert.ok(
    textes.some((t) => /Date de cession : 1 juin 2019/.test(t)),
    'la date qui a servi au choix doit être affichée',
  );
});

test("millésime — une cession de l'année du référentiel ne déclenche aucune alerte", () => {
  const simulateur = chargerSimulateur('pv-immobiliere');
  const { document } = simulateur.dom;

  document.getElementById('dateCes').value = '2026-06-01';
  simulateur.evaluer('compute')();

  const textes = textesDuBandeau(simulateur);
  assert.ok(
    !textes.some((t) => /ne reflètent donc pas le droit/.test(t)),
    `aucune alerte attendue pour une cession de 2026 — obtenu ${JSON.stringify(textes)}`,
  );
  // Le référentiel des prélèvements sociaux s'arrête pourtant à 2025 : le
  // bandeau le mentionne sans prétendre que le résultat est faux, faute de
  // date de fin connue. Voir fiche 3.6 de docs/CORRECTIONS_A_VALIDER.md.
  assert.ok(
    textes.some((t) => /Prélèvements sociaux » s'arrête au millésime 2025/.test(t)),
    `l'écart des prélèvements sociaux doit rester visible — obtenu ${JSON.stringify(textes)}`,
  );
});

test('millésime — le choix de la date de cession pilote réellement la lecture des valeurs', () => {
  // Le bandeau pourrait annoncer un millésime sans que le calcul le suive. Ce
  // test vérifie le lien réel : le lecteur employé par `compute()` porte bien
  // l'année demandée.
  const simulateur = chargerSimulateur('pv-immobiliere');
  const { document } = simulateur.dom;

  document.getElementById('dateCes').value = '2024-03-15';
  simulateur.evaluer('compute')();
  assert.equal(simulateur.evaluer('PVI.resolution()').demande, 2024);

  document.getElementById('dateCes').value = '2026-03-15';
  simulateur.evaluer('compute')();
  assert.equal(simulateur.evaluer('PVI.resolution()').demande, 2026);
  assert.equal(simulateur.evaluer('PVI.resolution()').statut, 'exact');
});

test('millésime — un choix manuel est abandonné dès que l\'année de cession change', () => {
  // Sans cela, une seconde simulation continuerait d'employer le millésime
  // choisi pour la première, sans que rien ne le rappelle : exactement le
  // silence que l'issue #19 corrige.
  const simulateur = chargerSimulateur('pv-immobiliere');
  const { document } = simulateur.dom;

  document.getElementById('dateCes').value = '2026-06-01';
  simulateur.evaluer('compute')();

  simulateur.evaluer('(() => { millesimeManuel = 2026; })')();
  document.getElementById('dateCes').value = '2026-09-30';
  simulateur.evaluer('compute')();
  assert.equal(simulateur.evaluer('millesimeManuel'), 2026, 'même année : le choix est conservé');

  document.getElementById('dateCes').value = '2019-09-30';
  simulateur.evaluer('compute')();
  assert.equal(simulateur.evaluer('millesimeManuel'), null, 'autre année : le choix est abandonné');
  assert.equal(simulateur.evaluer('millesimeCharge'), 2019);
});

test('millésime — après un choix manuel, le bandeau ne prétend plus suivre la date de cession', () => {
  const simulateur = chargerSimulateur('pv-immobiliere');
  const { document } = simulateur.dom;

  document.getElementById('dateCes').value = '2019-06-01';
  simulateur.evaluer('compute')();
  simulateur.evaluer('(() => { millesimeManuel = 2026; })')();
  simulateur.evaluer('compute')();

  const textes = textesDuBandeau(simulateur);
  assert.ok(
    textes.some((t) => /choix manuel de millésime/.test(t)),
    `l'origine du millésime doit être annoncée — obtenu ${JSON.stringify(textes)}`,
  );
});
