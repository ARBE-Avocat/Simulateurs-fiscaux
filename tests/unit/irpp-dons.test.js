/**
 * Tests des réductions pour dons du simulateur IRPP (issue #5).
 *
 * Le défaut : la réduction était mémorisée dans une variable partagée avec le
 * revenu net imposable utilisé pour la calculer. Modifier le revenu sans
 * toucher aux dons laissait une réduction périmée à l'écran et dans l'impôt
 * final.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { chargerSimulateur, chemin } = require('../helpers/simulateurs');
const { assertProche, assertTexteAffiche } = require('../helpers/assertions');

const fixture = JSON.parse(
  fs.readFileSync(chemin('tests', 'fixtures', 'irpp-dons-scenarios.json'), 'utf8')
);

/**
 * Prépare un simulateur IRPP.
 *
 * Le barème est renseigné explicitement pour que le scénario reste lisible sans
 * ouvrir la page. Depuis que le harnais applique les valeurs pré-remplies du
 * HTML, ce n'est plus indispensable : un champ non renseigné vaut ce que la
 * page affiche.
 */
function preparerIrpp(champs = {}, coches = []) {
  const simulateur = chargerSimulateur('irpp');
  const document = simulateur.dom.document;
  for (const [id, valeur] of Object.entries({ ...fixture.bareme, ...champs })) {
    document.getElementById(id).value = String(valeur);
  }
  for (const id of coches) {
    document.getElementById(id).checked = true;
  }
  return simulateur;
}

const lire = (simulateur, id) => simulateur.dom.document.getElementById(id).textContent;

// ── Le calcul isolé, sans formulaire ──────────────────────────────────────

test('calculerDons — un don à 66 % sous le plafond est retenu en entier', () => {
  const simulateur = chargerSimulateur('irpp');
  const calculerDons = simulateur.evaluer('calculerDons');

  const r = calculerDons({ dons75: 0, dons66Directs: 5000, rni: 100000, plafond75: 1000 });
  assertProche(r.plaf66, 20000, 0.01, 'plafond de 20 % du revenu');
  assertProche(r.d66_pris, 5000, 0.01, 'don retenu en entier');
  assertProche(r.d66_excedent, 0, 0.01, 'aucun excédent');
  assertProche(r.red_totale, 3300, 0.01, 'réduction de 66 %');
});

test('calculerDons — un don à 66 % exactement au plafond ne crée pas d’excédent', () => {
  const calculerDons = chargerSimulateur('irpp').evaluer('calculerDons');
  const r = calculerDons({ dons75: 0, dons66Directs: 20000, rni: 100000, plafond75: 1000 });
  assertProche(r.d66_pris, 20000, 0.01, 'don retenu en entier');
  assertProche(r.d66_excedent, 0, 0.01, 'aucun excédent');
});

test('calculerDons — un don à 66 % au-dessus du plafond est écrêté', () => {
  const calculerDons = chargerSimulateur('irpp').evaluer('calculerDons');
  const r = calculerDons({ dons75: 0, dons66Directs: 30000, rni: 100000, plafond75: 1000 });
  assertProche(r.d66_pris, 20000, 0.01, 'don retenu au plafond');
  assertProche(r.d66_excedent, 10000, 0.01, 'excédent reporté');
  assertProche(r.red_totale, 13200, 0.01, '66 % du montant retenu');
});

test("calculerDons — l'excédent de la catégorie 75 % bascule en 66 %", () => {
  const calculerDons = chargerSimulateur('irpp').evaluer('calculerDons');
  const r = calculerDons({ dons75: 3000, dons66Directs: 0, rni: 100000, plafond75: 1000 });
  assertProche(r.d75_plaf, 1000, 0.01, 'part retenue à 75 %');
  assertProche(r.d75_excess, 2000, 0.01, 'part basculée en 66 %');
  assertProche(r.red75, 750, 0.01, 'réduction à 75 %');
  assertProche(r.red66, 1320, 0.01, 'réduction à 66 % sur la bascule');
  assertProche(r.red_totale, 2070, 0.01, 'réduction totale');
});

test('calculerDons — les deux valeurs du plafond à 75 % sont prises en compte', () => {
  const calculerDons = chargerSimulateur('irpp').evaluer('calculerDons');
  const entrees = { dons75: 3000, dons66Directs: 0, rni: 100000 };

  const a1000 = calculerDons({ ...entrees, plafond75: 1000 });
  const a2000 = calculerDons({ ...entrees, plafond75: 2000 });

  assertProche(a1000.d75_plaf, 1000, 0.01, 'plafond de 1 000 €');
  assertProche(a2000.d75_plaf, 2000, 0.01, 'plafond de 2 000 €');
  assert.ok(
    a2000.red_totale > a1000.red_totale,
    'le plafond à 2 000 € doit donner une réduction au moins égale'
  );
});

test('calculerDons — sans revenu connu, aucun plafond de 20 % ne s’applique', () => {
  const calculerDons = chargerSimulateur('irpp').evaluer('calculerDons');
  const r = calculerDons({ dons75: 0, dons66Directs: 50000, rni: 0, plafond75: 1000 });
  assert.equal(r.rniConnu, false);
  assertProche(r.d66_pris, 50000, 0.01, 'tout le don est provisoirement retenu');
  assertProche(r.d66_excedent, 0, 0.01, 'aucun excédent tant que le revenu est inconnu');
});

test('calculerDons — mêmes entrées, même résultat', () => {
  const calculerDons = chargerSimulateur('irpp').evaluer('calculerDons');
  const entrees = { dons75: 1500, dons66Directs: 8000, rni: 90000, plafond75: 2000 };
  assert.deepEqual(calculerDons(entrees), calculerDons(entrees));
});

// ── Le défaut de l'issue #5, vu depuis le formulaire ──────────────────────

test("IRPP — changer le revenu actualise immédiatement la réduction pour dons", () => {
  const simulateur = preparerIrpp({
    nb_parts: 1,
    sal_brut_d1: 200000,
    don66_fondations: 20000,
  });

  // L'utilisateur saisit ses dons avec un revenu élevé : le plafond ne mord pas.
  simulateur.evaluer('calcDons')();
  assertTexteAffiche(lire(simulateur, 'dons_red_totale'), '13 200,00 €', 'réduction initiale');

  // Puis il corrige fortement son revenu, sans retoucher aux dons.
  simulateur.dom.document.getElementById('sal_brut_d1').value = '60000';
  simulateur.evaluer('calc')();

  // Le revenu net imposable retenu est le salaire diminué de l'abattement de
  // 10 %, soit 54 000 € : le plafond des dons vaut donc 20 % de 54 000 €.
  assertTexteAffiche(lire(simulateur, 'dons_plafond_20p'), '10 800,00 €', 'plafond actualisé');
  assertTexteAffiche(lire(simulateur, 'dons_red_totale'), '7 128,00 €', 'réduction actualisée');
  assertTexteAffiche(lire(simulateur, 'dons_excedent'), '9 200,00 €', 'excédent actualisé');
  assertTexteAffiche(lire(simulateur, 's_impot_net'), '2 175,58 €', 'impôt net actualisé');
});

test("IRPP — le résultat ne dépend pas de l'ordre de saisie", () => {
  const champs = { nb_parts: 1, sal_brut_d1: 60000, don66_fondations: 20000 };

  // Ordre 1 : revenu élevé, dons, puis correction du revenu.
  const parCorrection = preparerIrpp({ ...champs, sal_brut_d1: 200000 });
  parCorrection.evaluer('calcDons')();
  parCorrection.dom.document.getElementById('sal_brut_d1').value = '60000';
  parCorrection.evaluer('calc')();

  // Ordre 2 : tout saisi d'emblée.
  const dEmblee = preparerIrpp(champs);
  dEmblee.evaluer('calc')();

  for (const id of ['dons_plafond_20p', 'dons_red_totale', 'dons_excedent', 's_impot_net']) {
    assertTexteAffiche(
      lire(parCorrection, id),
      lire(dEmblee, id),
      `${id} doit être identique quel que soit l'ordre de saisie`
    );
  }
});

// ── Non-régression ────────────────────────────────────────────────────────

test('IRPP — les scénarios de référence affichent les mêmes montants', async (t) => {
  for (const cas of fixture.cas) {
    await t.test(cas.nom, () => {
      const simulateur = preparerIrpp(cas.champs, cas.coches || []);
      simulateur.evaluer('calcDons')();
      for (const [id, attendu] of Object.entries(cas.attendu)) {
        assertTexteAffiche(lire(simulateur, id), attendu, `${cas.nom} — ${id}`);
      }
    });
  }
});
