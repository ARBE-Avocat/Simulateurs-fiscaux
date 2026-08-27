/**
 * Taux de change pour les simulateurs qui convertissent un montant en devise
 * (issue #13).
 *
 * Ce fichier est écrit à la main et sert deux usages distincts :
 *
 * 1. la fonction pure `tauxPour` — la règle de remontée aux jours non cotés,
 *    reprise telle quelle du simulateur d'origine et prouvée identique par
 *    `tests/unit/change.test.js` sur 3 375 cas relevés avant l'extraction ;
 * 2. l'orchestration réseau `tauxALaDate` / `tauxALaDateMultiple`, qui
 *    appellent en premier l'API de données de la Banque centrale européenne,
 *    et retombent sur les fichiers versionnés de `data/change/` si l'appel
 *    échoue ou ne renvoie rien. Voir `docs/ARCHITECTURE_CIBLE.md` §7 bis pour
 *    la décision et ses limites.
 *
 * Un point vérifié en interrogeant la vraie API le 27 août 2026, avant l'heure
 * de publication quotidienne de la BCE (~16h) : une requête sur une fenêtre de
 * plusieurs jours ne renvoie pas d'erreur pour le jour manquant, elle omet
 * simplement l'observation absente. Chercher « le taux le plus récent dans une
 * fenêtre de dix jours » rend donc aussi, sans code séparé, « le taux le plus
 * récent publié à ce jour » : les deux usages partagent la même fonction.
 *
 * Cette seconde partie fait des appels réseau : elle n'est pas exercée par les
 * tests, qui n'en font aucun. Seules les fonctions pures sont testées
 * directement ; l'orchestration est testée avec un `fetch` factice.
 */

'use strict';

(function (global) {
  /** Nombre de jours maximum de remontée en arrière quand un jour n'est pas coté. */
  const REMONTEE_MAX_DEFAUT = 10;

  /**
   * Cherche le dernier jour coté à `date` ou avant, au plus `remonteeMax`
   * jours en arrière, dans une série `{ "AAAA-MM-JJ": { DEV: taux } }`.
   * Retourne `{ taux, date }` — `date` étant celle réellement retenue, qui
   * peut différer de celle demandée — ou `null` si rien n'est trouvé.
   *
   * Règle reprise à l'identique de l'ancien `getRate` du simulateur de
   * plus-value immobilière : elle n'a jamais été écrite ailleurs que dans le
   * code, voir fiche 3.5 de `docs/CORRECTIONS_A_VALIDER.md`.
   */
  function rechercheCotation(cotations, date, devise, remonteeMax) {
    if (typeof remonteeMax !== 'number') remonteeMax = REMONTEE_MAX_DEFAUT;
    if (!date || devise === 'EUR') return { taux: 1, date };
    const d = new Date(`${date}T00:00:00Z`);
    for (let i = 0; i <= remonteeMax; i += 1) {
      const ds = d.toISOString().slice(0, 10);
      const jour = cotations[ds];
      const v = jour ? jour[devise] : undefined;
      if (typeof v === 'number') return { taux: v, date: ds };
      d.setUTCDate(d.getUTCDate() - 1);
    }
    return null;
  }

  /** Comme `rechercheCotation`, mais ne rend que le taux. Compatibilité historique. */
  function tauxPour(cotations, date, devise, remonteeMax) {
    const r = rechercheCotation(cotations, date, devise, remonteeMax);
    return r ? r.taux : null;
  }

  /**
   * Années dont les cotations peuvent être nécessaires pour couvrir la fenêtre
   * de remontée à partir de `date` — l'année de la date, et l'année
   * précédente si la fenêtre déborde en janvier.
   */
  function anneesUtiles(date, remonteeMax) {
    if (typeof remonteeMax !== 'number') remonteeMax = REMONTEE_MAX_DEFAUT;
    const fin = new Date(`${date}T00:00:00Z`);
    const debut = new Date(fin);
    debut.setUTCDate(debut.getUTCDate() - remonteeMax);
    const annees = new Set([fin.getUTCFullYear(), debut.getUTCFullYear()]);
    return Array.from(annees).sort((a, b) => a - b);
  }

  /** Chemin relatif du fichier d'une année, tel que servi par le site. */
  function urlAnnee(annee) {
    return `data/change/${annee}.json`;
  }

  /**
   * URL de l'API de données de la BCE pour une devise, couvrant la fenêtre de
   * remontée jusqu'à `date` incluse.
   */
  function urlBce(devise, date, remonteeMax) {
    if (typeof remonteeMax !== 'number') remonteeMax = REMONTEE_MAX_DEFAUT;
    const fin = new Date(`${date}T00:00:00Z`);
    const debut = new Date(fin);
    debut.setUTCDate(debut.getUTCDate() - remonteeMax);
    const iso = (d) => d.toISOString().slice(0, 10);
    return `https://data-api.ecb.europa.eu/service/data/EXR/D.${devise}.EUR.SP00.A`
      + `?startPeriod=${iso(debut)}&endPeriod=${iso(fin)}&format=jsondata`;
  }

  /**
   * Extrait la plus récente observation d'une réponse de l'API de données de
   * la BCE : `{ taux, date }`, ou `null` si la réponse n'en contient aucune —
   * cas normal un jour férié, ou avant l'heure de publication quotidienne
   * quand la date demandée est celle du jour même. Voir §7 bis.
   */
  function derniereObservationBce(json) {
    const serie = json && json.dataSets && json.dataSets[0] && json.dataSets[0].series;
    if (!serie) return null;
    const premiere = Object.values(serie)[0];
    const observations = premiere && premiere.observations;
    if (!observations) return null;
    const cles = Object.keys(observations).map(Number).sort((a, b) => a - b);
    if (cles.length === 0) return null;
    const derniereCle = cles[cles.length - 1];
    const derniere = observations[derniereCle];
    if (!derniere || typeof derniere[0] !== 'number') return null;
    const valeursDim = json.structure
      && json.structure.dimensions
      && json.structure.dimensions.observation
      && json.structure.dimensions.observation[0]
      && json.structure.dimensions.observation[0].values;
    const date = valeursDim && valeursDim[derniereCle] ? valeursDim[derniereCle].id : null;
    return { taux: derniere[0], date };
  }

  /** Comme `derniereObservationBce`, mais ne rend que le taux. Compatibilité historique. */
  function tauxDepuisReponseBce(json) {
    const r = derniereObservationBce(json);
    return r ? r.taux : null;
  }

  /** Interroge la BCE. Retourne `null` sur tout échec, sans lever d'exception. */
  async function observationEnLigne(devise, date, options) {
    const appelFetch = (options && options.fetch) || global.fetch;
    if (typeof appelFetch !== 'function') return null;
    try {
      const reponse = await appelFetch(urlBce(devise, date), { signal: options && options.signal });
      if (!reponse.ok) return null;
      return derniereObservationBce(await reponse.json());
    } catch (erreur) {
      return null;
    }
  }

  /** Charge un fichier `data/change/<annee>.json`. Retourne `null` sur tout échec. */
  async function chargerAnnee(annee, options) {
    const appelFetch = (options && options.fetch) || global.fetch;
    if (typeof appelFetch !== 'function') return null;
    try {
      const reponse = await appelFetch(urlAnnee(annee));
      if (!reponse.ok) return null;
      return await reponse.json();
    } catch (erreur) {
      return null;
    }
  }

  /** Fusionne les cotations des années utiles à une date. Un échec partiel n'empêche pas les autres. */
  async function cotationsDuDepot(date, options) {
    const cotations = {};
    for (const annee of anneesUtiles(date)) {
      const contenu = await chargerAnnee(annee, options);
      if (contenu) Object.assign(cotations, contenu.cotations);
    }
    return cotations;
  }

  /**
   * Taux à retenir pour convertir un montant en devise à une date donnée.
   *
   * Essaie la BCE en premier, puis le dépôt. Retourne toujours d'où vient le
   * taux retenu et la date réellement appliquée : l'écran doit le dire,
   * jamais le taire.
   */
  async function tauxALaDate(devise, date, options) {
    if (!date || devise === 'EUR') return { taux: 1, source: 'aucune', date };
    const enLigne = await observationEnLigne(devise, date, options);
    if (enLigne) return { taux: enLigne.taux, source: 'bce', date: enLigne.date };
    const cotations = await cotationsDuDepot(date, options);
    const repli = rechercheCotation(cotations, date, devise);
    if (repli) return { taux: repli.taux, source: 'depot', date: repli.date };
    return { taux: null, source: 'aucune', date: null };
  }

  /**
   * Comme `tauxALaDate`, pour plusieurs devises à la fois.
   *
   * La BCE est interrogée une fois par devise — un appel groupé multi-devises
   * existe, mais son adressage résultat→devise s'est révélé ambigu à l'usage,
   * d'où un appel par devise, comme le faisait déjà le simulateur IFI avant
   * cette unification. Le dépôt, lui, n'est chargé qu'une fois pour
   * l'ensemble des devises en repli, plutôt qu'une fois par devise.
   *
   * Retourne `{ [devise]: { taux, source, date } }`.
   */
  async function tauxALaDateMultiple(devises, date, options) {
    const resultats = {};
    const enAttenteDeDepot = [];

    await Promise.all(devises.map(async (devise) => {
      if (devise === 'EUR') {
        resultats[devise] = { taux: 1, source: 'aucune', date };
        return;
      }
      const enLigne = await observationEnLigne(devise, date, options);
      if (enLigne) {
        resultats[devise] = { taux: enLigne.taux, source: 'bce', date: enLigne.date };
      } else {
        enAttenteDeDepot.push(devise);
      }
    }));

    if (enAttenteDeDepot.length > 0) {
      const cotations = await cotationsDuDepot(date, options);
      for (const devise of enAttenteDeDepot) {
        const repli = rechercheCotation(cotations, date, devise);
        resultats[devise] = repli
          ? { taux: repli.taux, source: 'depot', date: repli.date }
          : { taux: null, source: 'aucune', date: null };
      }
    }

    return resultats;
  }

  const api = {
    REMONTEE_MAX_DEFAUT,
    tauxPour,
    rechercheCotation,
    anneesUtiles,
    urlAnnee,
    urlBce,
    tauxDepuisReponseBce,
    derniereObservationBce,
    chargerAnnee,
    tauxALaDate,
    tauxALaDateMultiple,
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    global.ChangeReferentiel = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
