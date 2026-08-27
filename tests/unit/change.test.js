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
const {
  tauxPour,
  anneesUtiles,
  urlAnnee,
  urlBce,
  tauxDepuisReponseBce,
  tauxALaDate,
  tauxALaDateMultiple,
} = require('../../src/change');

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

test("change — le taux le plus récent d'une réponse BCE à plusieurs observations est extrait", () => {
  const exemple = JSON.parse(
    fs.readFileSync(chemin('tests', 'fixtures', 'reponse-bce-exemple.json'), 'utf8'),
  );
  assert.equal(tauxDepuisReponseBce(exemple.reponse), exemple._tauxAttendu);
});

test('change — une réponse BCE sans observation ne rend aucun taux', () => {
  // Cas réel : une requête pour le jour même avant l'heure de publication de la
  // BCE (~16h) renvoie un corps vide, voir docs/ARCHITECTURE_CIBLE.md §7 bis.
  assert.equal(tauxDepuisReponseBce({ dataSets: [{ series: {} }] }), null);
  assert.equal(tauxDepuisReponseBce({}), null);
});

test('change — anneesUtiles couvre les deux années à cheval sur un 1er janvier', () => {
  assert.deepEqual(anneesUtiles('2025-01-02', 10), [2024, 2025]);
  assert.deepEqual(anneesUtiles('2025-06-15', 10), [2025]);
});

test('change — urlAnnee et urlBce pointent vers les emplacements attendus', () => {
  assert.equal(urlAnnee(2025), 'data/change/2025.json');
  assert.match(urlBce('USD', '2025-04-08'), /^https:\/\/data-api\.ecb\.europa\.eu\/.*D\.USD\.EUR\.SP00\.A\?startPeriod=2025-03-29&endPeriod=2025-04-08&format=jsondata$/);
});

test('change — tauxALaDate interroge la BCE en premier et ne retombe sur le dépôt que si elle échoue', async () => {
  const exemple = JSON.parse(
    fs.readFileSync(chemin('tests', 'fixtures', 'reponse-bce-exemple.json'), 'utf8'),
  );
  let appels = [];
  const fetchFactice = async (url) => {
    appels.push(url);
    return { ok: true, json: async () => exemple.reponse };
  };

  const resultat = await tauxALaDate('USD', '2026-01-02', { fetch: fetchFactice });

  assert.equal(resultat.source, 'bce');
  assert.equal(resultat.taux, exemple._tauxAttendu);
  assert.equal(appels.length, 1, 'le dépôt ne doit pas être interrogé si la BCE répond');
  assert.match(appels[0], /^https:\/\/data-api\.ecb\.europa\.eu\//);
});

test('change — tauxALaDate retombe sur les fichiers du dépôt si la BCE ne répond rien', async () => {
  const cotations = serie();
  const fetchFactice = async (url) => {
    if (url.startsWith('https://data-api.ecb.europa.eu/')) {
      return { ok: true, json: async () => ({ dataSets: [{ series: {} }] }) };
    }
    // Sert les vrais fichiers de data/change/, comme le ferait le navigateur.
    const annee = Number(url.match(/(\d{4})\.json$/)[1]);
    return { ok: true, json: async () => lireAnnee(annee) };
  };

  const resultat = await tauxALaDate('USD', '2025-04-05', { fetch: fetchFactice });

  assert.equal(resultat.source, 'depot');
  assert.equal(resultat.taux, tauxPour(cotations, '2025-04-05', 'USD', 10));
});

test('change — tauxALaDate ne rend aucun taux si ni la BCE ni le dépôt ne répondent', async () => {
  const fetchFactice = async () => ({ ok: false });
  const resultat = await tauxALaDate('USD', '2025-04-05', { fetch: fetchFactice });
  assert.equal(resultat.taux, null);
  assert.equal(resultat.source, 'aucune');
});

test('change — tauxALaDate rend toujours 1 pour l\'euro, sans appel réseau', async () => {
  let appele = false;
  const fetchFactice = async () => { appele = true; return { ok: false }; };
  const resultat = await tauxALaDate('EUR', '2025-04-05', { fetch: fetchFactice });
  assert.equal(resultat.taux, 1);
  assert.equal(appele, false);
});

test('change — tauxALaDate rend aussi la date réellement retenue, quand elle diffère de celle demandée', async () => {
  // Cas d'un samedi (fiche 3.5) : la date retenue doit être le vendredi.
  const cotations = serie();
  const fetchFactice = async (url) => {
    if (url.startsWith('https://data-api.ecb.europa.eu/')) {
      return { ok: true, json: async () => ({ dataSets: [{ series: {} }] }) };
    }
    const annee = Number(url.match(/(\d{4})\.json$/)[1]);
    return { ok: true, json: async () => lireAnnee(annee) };
  };

  const resultat = await tauxALaDate('USD', '2025-04-05', { fetch: fetchFactice });

  assert.equal(resultat.date, '2025-04-04');
  assert.equal(resultat.taux, tauxPour(cotations, '2025-04-05', 'USD', 10));
});

test('change — tauxALaDateMultiple interroge la BCE une fois par devise, en parallèle', async () => {
  const exemple = JSON.parse(
    fs.readFileSync(chemin('tests', 'fixtures', 'reponse-bce-exemple.json'), 'utf8'),
  );
  const appels = [];
  const fetchFactice = async (url) => {
    appels.push(url);
    return { ok: true, json: async () => exemple.reponse };
  };

  const resultats = await tauxALaDateMultiple(['USD', 'GBP', 'EUR'], '2026-01-02', { fetch: fetchFactice });

  assert.equal(resultats.USD.source, 'bce');
  assert.equal(resultats.USD.taux, exemple._tauxAttendu);
  assert.equal(resultats.GBP.source, 'bce');
  assert.deepEqual(resultats.EUR, { taux: 1, source: 'aucune', date: '2026-01-02' });
  // L'euro ne doit déclencher aucun appel : deux devises, deux appels.
  assert.equal(appels.length, 2);
});

test('change — tauxALaDateMultiple ne charge le dépôt qu’une fois pour toutes les devises en repli', async () => {
  const cotations = serie();
  let appelsDepot = 0;
  const fetchFactice = async (url) => {
    if (url.startsWith('https://data-api.ecb.europa.eu/')) {
      return { ok: true, json: async () => ({ dataSets: [{ series: {} }] }) };
    }
    appelsDepot += 1;
    const annee = Number(url.match(/(\d{4})\.json$/)[1]);
    return { ok: true, json: async () => lireAnnee(annee) };
  };

  const resultats = await tauxALaDateMultiple(['USD', 'GBP', 'JPY'], '2025-04-05', { fetch: fetchFactice });

  for (const devise of ['USD', 'GBP', 'JPY']) {
    assert.equal(resultats[devise].source, 'depot');
    assert.equal(resultats[devise].taux, tauxPour(cotations, '2025-04-05', devise, 10));
  }
  // Une seule année utile pour cette date : un seul appel au dépôt, quel que
  // soit le nombre de devises en repli.
  assert.equal(appelsDepot, 1);
});

test("change — tauxALaDateMultiple mélange les sources honnêtement quand certaines devises réussissent en ligne et d'autres non", async () => {
  const fetchFactice = async (url) => {
    if (url.includes('.USD.')) {
      const exemple = JSON.parse(
        fs.readFileSync(chemin('tests', 'fixtures', 'reponse-bce-exemple.json'), 'utf8'),
      );
      return { ok: true, json: async () => exemple.reponse };
    }
    if (url.startsWith('https://data-api.ecb.europa.eu/')) {
      return { ok: true, json: async () => ({ dataSets: [{ series: {} }] }) };
    }
    const annee = Number(url.match(/(\d{4})\.json$/)[1]);
    return { ok: true, json: async () => lireAnnee(annee) };
  };

  const resultats = await tauxALaDateMultiple(['USD', 'GBP'], '2026-01-02', { fetch: fetchFactice });

  assert.equal(resultats.USD.source, 'bce');
  assert.equal(resultats.GBP.source, 'depot');
});
