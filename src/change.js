/**
 * Taux de change pour les simulateurs qui convertissent un montant en devise
 * (issue #13).
 *
 * Ce fichier est écrit à la main et sert deux usages distincts :
 *
 * 1. la fonction pure `tauxPour` — la règle de remontée aux jours non cotés,
 *    reprise telle quelle du simulateur d'origine et prouvée identique par
 *    `tests/unit/change.test.js` sur 3 375 cas relevés avant l'extraction ;
 * 2. l'orchestration réseau `tauxALaDate`, qui appelle en premier l'API de
 *    données de la Banque centrale européenne, et retombe sur les fichiers
 *    versionnés de `data/change/` si l'appel échoue ou ne renvoie rien. Voir
 *    `docs/ARCHITECTURE_CIBLE.md` §7 bis pour la décision et ses limites.
 *
 * Cette seconde partie fait des appels réseau : elle n'est pas exercée par les
 * tests, qui n'en font aucun. Seule `tauxPour`, purement synchrone, est testée
 * directement.
 */

'use strict';

(function (global) {
  /** Nombre de jours maximum de remontée en arrière quand un jour n'est pas coté. */
  const REMONTEE_MAX_DEFAUT = 10;

  /**
   * Taux retenu pour une date, à partir d'une série `{ "AAAA-MM-JJ": { DEV: taux } }`.
   *
   * Remonte au dernier jour coté à cette date ou avant, au plus `remonteeMax`
   * jours en arrière. Règle reprise à l'identique de l'ancien `getRate` du
   * simulateur de plus-value immobilière : elle n'a jamais été écrite ailleurs
   * que dans le code, voir fiche 3.5 de `docs/CORRECTIONS_A_VALIDER.md`.
   */
  function tauxPour(cotations, date, devise, remonteeMax) {
    if (typeof remonteeMax !== 'number') remonteeMax = REMONTEE_MAX_DEFAUT;
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
   * Extrait le taux le plus récent d'une réponse de l'API de données de la BCE.
   * Retourne `null` si la réponse n'en contient aucun — cas normal un jour
   * férié ou avant l'heure de publication quotidienne, voir §7 bis.
   */
  function tauxDepuisReponseBce(json) {
    const serie = json && json.dataSets && json.dataSets[0] && json.dataSets[0].series;
    if (!serie) return null;
    const premiere = Object.values(serie)[0];
    const observations = premiere && premiere.observations;
    if (!observations) return null;
    const cles = Object.keys(observations).map(Number).sort((a, b) => a - b);
    if (cles.length === 0) return null;
    const derniere = observations[cles[cles.length - 1]];
    return derniere && typeof derniere[0] === 'number' ? derniere[0] : null;
  }

  /** Interroge la BCE. Retourne `null` sur tout échec, sans lever d'exception. */
  async function tauxEnLigne(devise, date, options) {
    const appelFetch = (options && options.fetch) || global.fetch;
    if (typeof appelFetch !== 'function') return null;
    try {
      const reponse = await appelFetch(urlBce(devise, date), { signal: options && options.signal });
      if (!reponse.ok) return null;
      return tauxDepuisReponseBce(await reponse.json());
    } catch (erreur) {
      return null;
    }
  }

  /**
   * Repli sur les fichiers versionnés du dépôt. Récupère les années utiles et
   * applique la même règle de remontée que la source en ligne.
   */
  async function tauxDepuisDepot(devise, date, options) {
    const appelFetch = (options && options.fetch) || global.fetch;
    if (typeof appelFetch !== 'function') return null;
    const cotations = {};
    for (const annee of anneesUtiles(date)) {
      try {
        const reponse = await appelFetch(urlAnnee(annee));
        if (!reponse.ok) continue;
        const contenu = await reponse.json();
        Object.assign(cotations, contenu.cotations);
      } catch (erreur) {
        // Année suivante essayée quand même : la fenêtre de remontée peut être
        // couverte par une seule des deux années utiles.
      }
    }
    return tauxPour(cotations, date, devise);
  }

  /**
   * Taux à retenir pour convertir un montant en devise à une date donnée.
   *
   * Essaie la BCE en premier, puis le dépôt. Retourne toujours d'où vient le
   * taux retenu : l'écran doit le dire, jamais le taire.
   */
  async function tauxALaDate(devise, date, options) {
    if (!date || devise === 'EUR') return { taux: 1, source: 'aucune' };
    const enLigne = await tauxEnLigne(devise, date, options);
    if (typeof enLigne === 'number') return { taux: enLigne, source: 'bce' };
    const repli = await tauxDepuisDepot(devise, date, options);
    if (typeof repli === 'number') return { taux: repli, source: 'depot' };
    return { taux: null, source: 'aucune' };
  }

  const api = {
    REMONTEE_MAX_DEFAUT,
    tauxPour,
    anneesUtiles,
    urlAnnee,
    urlBce,
    tauxDepuisReponseBce,
    tauxALaDate,
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    global.ChangeReferentiel = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
