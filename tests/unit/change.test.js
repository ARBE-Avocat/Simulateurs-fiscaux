/**
 * Taux de change extraits hors des simulateurs (issue #13).
 *
 * Deux garanties distinctes :
 *
 * 1. les fichiers de `data/change/` sont cohérents, et le manifeste décrit bien
 *    ce qu'ils contiennent — c'est lui que la page consulte pour savoir quelles
 *    années elle peut demander ;
 * 2. ils rendent **exactement** les taux que rendait la série embarquée, y
 *    compris la remontée aux jours non cotés. L'échantillon a été relevé avant
 *    l'extraction : c'est la seule trace exploitable une fois la série retirée
 *    du fichier HTML.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { chemin } = require('../helpers/simulateurs');
const {
  FICHIER_MANIFESTE,
  listerAnnees,
  lireAnnee,
  validerAnnee,
  formaterRapport,
} = require('../../scripts/lib/change');

const echantillon = JSON.parse(
  fs.readFileSync(chemin('tests', 'fixtures', 'change-echantillon.json'), 'utf8'),
);

const manifeste = JSON.parse(fs.readFileSync(FICHIER_MANIFESTE, 'utf8'));

/** Série reconstituée depuis `data/change/`, comme le ferait le navigateur. */
function serie() {
  const cotations = {};
  for (const annee of listerAnnees()) {
    Object.assign(cotations, lireAnnee(annee).cotations);
  }
  return cotations;
}

/**
 * Taux retenu pour une date : le dernier jour coté à cette date ou avant, en
 * remontant au plus dix jours. Règle reprise telle quelle du simulateur.
 */
function tauxPour(cotations, date, devise, remonteeMax) {
  if (!date || devise === 'EUR') return 1;
  const d = new Date(`${date}T00:00:00Z`);
  for (let i = 0; i <= remonteeMax; i += 1) {
    const jour = cotations[d.toISOString().slice(0, 10)];
    const v = jour ? jour[devise] : undefined;
    if (typeof v === 'number') return v;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return null;
}

test('change — chaque année est cohérente', () => {
  const annees = listerAnnees();
  assert.ok(annees.length > 0, 'aucune année dans data/change/');

  for (const annee of annees) {
    const rapport = validerAnnee(lireAnnee(annee));
    assert.deepEqual(rapport.erreurs, [], `${annee}.json\n${formaterRapport(rapport, '')}`);
  }
});

test('change — le manifeste décrit ce que contiennent les fichiers', () => {
  // Une année absente du manifeste serait invisible pour la page, alors que son
  // fichier existe : l'incohérence ne se verrait qu'à l'usage.
  const annees = listerAnnees();
  assert.deepEqual(manifeste.annees, annees);

  const devises = new Set();
  let joursCotes = 0;
  let joursNonCotes = 0;
  for (const annee of annees) {
    const contenu = lireAnnee(annee);
    contenu.devises.forEach((d) => devises.add(d));
    joursCotes += Object.keys(contenu.cotations).length;
    joursNonCotes += contenu.joursNonCotes.length;
  }

  assert.deepEqual(manifeste.devises, [...devises].sort());
  assert.equal(manifeste.joursCotes, joursCotes);
  assert.equal(manifeste.joursNonCotes, joursNonCotes);
});

test('change — les taux rendus sont identiques à ceux de la série embarquée', () => {
  const cotations = serie();
  const { remonteeMaximaleJours } = echantillon;
  let compares = 0;

  for (const cas of echantillon.cas) {
    const obtenu = tauxPour(cotations, cas.date, cas.devise, remonteeMaximaleJours);
    assert.equal(
      obtenu, cas.taux,
      `${cas.date} ${cas.devise} — ${cas.motif}`,
    );
    compares += 1;
  }

  assert.ok(compares > 3000, `échantillon trop maigre : ${compares} cas`);
});

test('change — une date hors de la série ne rend aucun taux plutôt qu’un taux voisin', () => {
  // Remonter indéfiniment donnerait un taux de 1999 pour une acquisition de
  // 1995. La limite de dix jours est ce qui l'en empêche.
  const cotations = serie();
  assert.equal(tauxPour(cotations, '1990-06-15', 'USD', 10), null);
  assert.equal(tauxPour(cotations, manifeste.premiereCotation, 'USD', 10) > 0, true);
});
