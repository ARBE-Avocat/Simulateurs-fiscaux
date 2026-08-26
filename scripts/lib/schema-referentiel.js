/**
 * Schéma exécutable des référentiels fiscaux (issue #12).
 *
 * Ce module est **la** définition du schéma : la documentation en langage clair
 * se trouve dans `data/schema/README.md`, mais c'est ce fichier qui décide ce
 * qui est valide. Un seul endroit décide, afin qu'une règle écrite et une règle
 * appliquée ne puissent pas diverger.
 *
 * Il ne dépend d'aucune bibliothèque : le dépôt n'a pas de dépendance npm.
 *
 * Il ne connaît aucune valeur fiscale. Il vérifie la forme, la cohérence
 * interne et la traçabilité d'un référentiel, jamais l'exactitude juridique
 * d'un chiffre : celle-ci relève du référent fiscal.
 */

'use strict';

/** Types de valeur reconnus. */
const TYPES = ['bareme', 'taux', 'montant', 'quantite', 'table', 'booleen'];

/**
 * Unités reconnues.
 *
 * `decimal` est la convention retenue pour les taux : 0,172 et non 17,2.
 * Voir `docs/INVENTAIRE_CONVENTIONS.md` §2.
 */
const UNITES = ['EUR', 'decimal', 'annee', 'jour', 'personne', 'sans-unite'];

/** Statuts de validation, au sens du plan d'action. */
const STATUTS = ['non-valide', 'valide', 'conteste'];

/** Clés des simulateurs, alignées sur `tests/helpers/simulateurs.js`. */
const SIMULATEURS = [
  'ir-cehr-cdhr',
  'pv-immobiliere',
  'ifi',
  'irpp',
  'succession',
  'demembrement',
];

/** Mention explicite d'une information non connue. Jamais une valeur inventée. */
const INCONNU = 'inconnue';

const RE_ID = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const RE_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Un rapport de validation : des erreurs bloquantes et des avertissements. */
function rapport() {
  return { erreurs: [], avertissements: [] };
}

function erreur(r, chemin, message) {
  r.erreurs.push({ chemin, message });
}

function avertir(r, chemin, message) {
  r.avertissements.push({ chemin, message });
}

function estObjet(x) {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function estDate(x) {
  if (typeof x !== 'string' || !RE_DATE.test(x)) return false;
  const d = new Date(`${x}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === x;
}

/**
 * Valide une source.
 *
 * La source est obligatoire, mais peut valoir explicitement `"inconnue"` : le
 * dépôt contient aujourd'hui des valeurs sans source, et les inventer serait
 * pire que de le dire. Une valeur sans source ne peut simplement pas être
 * déclarée `valide`.
 */
function validerSource(r, chemin, source) {
  if (source === INCONNU) return;
  if (!estObjet(source)) {
    erreur(r, chemin, `source manquante : attendu un objet ou la chaîne "${INCONNU}"`);
    return;
  }
  if (typeof source.reference !== 'string' || source.reference.trim() === '') {
    erreur(r, `${chemin}.reference`, 'référence de la source manquante (ex. « CGI art. 197 »)');
  }
  if (!estDate(source.dateConsultation)) {
    erreur(r, `${chemin}.dateConsultation`, 'date de consultation manquante ou mal formée (AAAA-MM-JJ)');
  }
  if (source.url !== undefined && typeof source.url !== 'string') {
    erreur(r, `${chemin}.url`, 'url doit être une chaîne');
  }
}

/** Valide une tranche de barème et retourne ses bornes normalisées. */
function validerTranche(r, chemin, tranche, unite) {
  if (!estObjet(tranche)) {
    erreur(r, chemin, 'tranche : objet attendu');
    return null;
  }
  const { borneInf, borneSup } = tranche;

  if (typeof borneInf !== 'number' || !Number.isFinite(borneInf)) {
    erreur(r, `${chemin}.borneInf`, 'borne basse manquante ou non finie');
  }
  if (borneSup !== null && (typeof borneSup !== 'number' || !Number.isFinite(borneSup))) {
    erreur(
      r,
      `${chemin}.borneSup`,
      'borne haute : un nombre fini, ou null pour une tranche sans limite. `Infinity` n\'existe pas en JSON',
    );
  }
  for (const cle of ['borneInfIncluse', 'borneSupIncluse']) {
    if (typeof tranche[cle] !== 'boolean') {
      erreur(r, `${chemin}.${cle}`, 'bornes ouvertes ou fermées : booléen obligatoire, jamais implicite');
    }
  }
  if (typeof tranche.taux !== 'number' || !Number.isFinite(tranche.taux)) {
    erreur(r, `${chemin}.taux`, 'taux manquant ou non fini');
  } else if (unite === 'decimal' && (tranche.taux < 0 || tranche.taux > 1)) {
    erreur(
      r,
      `${chemin}.taux`,
      `taux hors plage pour l'unité decimal : ${tranche.taux}. Un taux de 45 % s'écrit 0.45`,
    );
  }
  if (
    typeof borneInf === 'number' &&
    typeof borneSup === 'number' &&
    borneSup <= borneInf
  ) {
    erreur(r, chemin, `tranche vide ou inversée : ${borneInf} → ${borneSup}`);
  }
  return tranche;
}

/** Valide un barème complet : ordre, chevauchements, trous, dernière tranche. */
function validerBareme(r, chemin, tranches, unite) {
  if (!Array.isArray(tranches) || tranches.length === 0) {
    erreur(r, chemin, 'barème : tableau non vide de tranches attendu');
    return;
  }
  tranches.forEach((t, i) => validerTranche(r, `${chemin}[${i}]`, t, unite));
  if (r.erreurs.some((e) => e.chemin.startsWith(chemin))) return;

  for (let i = 1; i < tranches.length; i += 1) {
    const precedente = tranches[i - 1];
    const courante = tranches[i];
    if (precedente.borneSup === null) {
      erreur(
        r,
        `${chemin}[${i - 1}]`,
        'seule la dernière tranche peut être sans limite haute',
      );
      continue;
    }
    if (courante.borneInf < precedente.borneSup) {
      erreur(
        r,
        `${chemin}[${i}]`,
        `tranches qui se chevauchent : ${precedente.borneSup} puis ${courante.borneInf}`,
      );
    } else if (courante.borneInf === precedente.borneSup) {
      if (precedente.borneSupIncluse && courante.borneInfIncluse) {
        erreur(
          r,
          `${chemin}[${i}]`,
          `la valeur ${courante.borneInf} appartient à deux tranches à la fois`,
        );
      }
      if (!precedente.borneSupIncluse && !courante.borneInfIncluse) {
        erreur(
          r,
          `${chemin}[${i}]`,
          `la valeur ${courante.borneInf} n'appartient à aucune tranche`,
        );
      }
    } else {
      // Trou entre deux tranches. Toléré, car c'est le comportement actuel de
      // plusieurs simulateurs (voir docs/INVENTAIRE_CONVENTIONS.md §1) et que
      // l'extraction ne doit rien corriger. Signalé, jamais silencieux.
      avertir(
        r,
        `${chemin}[${i}]`,
        `intervalle non couvert entre ${precedente.borneSup} et ${courante.borneInf} : `
          + 'aucune tranche ne s\'applique à cette assiette (issue #7)',
      );
    }
  }
  const derniere = tranches[tranches.length - 1];
  if (derniere.borneSup !== null) {
    avertir(
      r,
      `${chemin}[${tranches.length - 1}]`,
      'la dernière tranche porte une limite haute : au-delà, aucun taux ne s\'applique',
    );
  }
}

/** Valide la valeur portée par une entrée, selon son type. */
function validerValeur(r, chemin, valeur, type, unite) {
  switch (type) {
    case 'bareme':
      validerBareme(r, chemin, valeur, unite);
      break;
    case 'taux':
      if (typeof valeur !== 'number' || !Number.isFinite(valeur)) {
        erreur(r, chemin, 'taux : nombre fini attendu');
      } else if (unite === 'decimal' && (valeur < 0 || valeur > 1)) {
        erreur(r, chemin, `taux hors plage pour l'unité decimal : ${valeur}`);
      }
      break;
    case 'montant':
    case 'quantite':
      if (typeof valeur !== 'number' || !Number.isFinite(valeur)) {
        erreur(r, chemin, `${type} : nombre fini attendu`);
      }
      break;
    case 'booleen':
      if (typeof valeur !== 'boolean') erreur(r, chemin, 'booleen attendu');
      break;
    case 'table':
      if (!Array.isArray(valeur) || valeur.length === 0) {
        erreur(r, chemin, 'table : tableau non vide attendu');
      }
      break;
    default:
      break;
  }
}

function validerUtilisePar(r, chemin, utilisePar) {
  if (!Array.isArray(utilisePar) || utilisePar.length === 0) {
    erreur(r, chemin, 'utilisePar : au moins un simulateur attendu');
    return;
  }
  utilisePar.forEach((cle, i) => {
    if (!SIMULATEURS.includes(cle)) {
      erreur(r, `${chemin}[${i}]`, `simulateur inconnu : ${cle}`);
    }
  });
}

/** Valide une entrée du référentiel. */
function validerEntree(r, chemin, entree) {
  if (!estObjet(entree)) {
    erreur(r, chemin, 'entrée : objet attendu');
    return;
  }
  const { id, type, unite, statutValidation } = entree;

  if (typeof id !== 'string' || !RE_ID.test(id)) {
    erreur(r, `${chemin}.id`, 'identifiant manquant ou mal formé (minuscules, chiffres, points et tirets)');
  }
  if (typeof entree.libelle !== 'string' || entree.libelle.trim() === '') {
    erreur(r, `${chemin}.libelle`, 'libellé manquant : une entrée doit être lisible sans lire le code');
  }
  if (!TYPES.includes(type)) {
    erreur(r, `${chemin}.type`, `type inconnu : ${JSON.stringify(type)}. Attendu : ${TYPES.join(', ')}`);
  }
  if (!UNITES.includes(unite)) {
    erreur(r, `${chemin}.unite`, `unité inconnue : ${JSON.stringify(unite)}. Attendu : ${UNITES.join(', ')}`);
  }
  if (!STATUTS.includes(statutValidation)) {
    erreur(
      r,
      `${chemin}.statutValidation`,
      `statut inconnu : ${JSON.stringify(statutValidation)}. Attendu : ${STATUTS.join(', ')}`,
    );
  }
  if (!Number.isInteger(entree.millesime)) {
    erreur(r, `${chemin}.millesime`, 'millésime manquant : année à laquelle la valeur se rapporte');
  }
  if (entree.dateEffet !== INCONNU && !estDate(entree.dateEffet)) {
    erreur(r, `${chemin}.dateEffet`, `date d'effet manquante ou mal formée (AAAA-MM-JJ, ou "${INCONNU}")`);
  }
  if (entree.dateFin !== null && entree.dateFin !== undefined && !estDate(entree.dateFin)) {
    erreur(r, `${chemin}.dateFin`, 'date de fin mal formée (AAAA-MM-JJ, ou null)');
  }
  if (
    estDate(entree.dateEffet) &&
    estDate(entree.dateFin) &&
    entree.dateFin < entree.dateEffet
  ) {
    erreur(r, `${chemin}.dateFin`, 'la date de fin précède la date d\'effet');
  }

  const conteste = statutValidation === 'conteste';
  const aValeur = Object.prototype.hasOwnProperty.call(entree, 'valeur');
  const aVariantes = Object.prototype.hasOwnProperty.call(entree, 'variantes');

  if (conteste) {
    // Le cœur du schéma : une règle contestée n'a pas de valeur unique. Le code
    // ne peut donc pas en lire une par mégarde, et un agent ne peut pas
    // trancher une divergence en extrayant les données.
    if (aValeur) {
      erreur(
        r,
        `${chemin}.valeur`,
        'une entrée « conteste » ne porte pas de valeur unique : les valeurs concurrentes vont dans variantes',
      );
    }
    validerVariantes(r, `${chemin}.variantes`, entree, type, unite, aVariantes);
    if (!estObjet(entree.arbitrage) || typeof entree.arbitrage.question !== 'string') {
      erreur(
        r,
        `${chemin}.arbitrage`,
        'une entrée « conteste » doit porter la question posée au référent fiscal',
      );
    }
  } else {
    if (aVariantes) {
      erreur(r, `${chemin}.variantes`, 'variantes n\'a de sens que pour le statut « conteste »');
    }
    if (!aValeur) {
      erreur(r, `${chemin}.valeur`, 'valeur manquante');
    } else {
      validerValeur(r, `${chemin}.valeur`, entree.valeur, type, unite);
    }
    validerUtilisePar(r, `${chemin}.utilisePar`, entree.utilisePar);
    validerSource(r, `${chemin}.source`, entree.source);

    if (statutValidation === 'valide') {
      if (entree.source === INCONNU || entree.dateEffet === INCONNU) {
        erreur(
          r,
          `${chemin}.statutValidation`,
          'une valeur ne peut être « valide » sans source ni date d\'effet connues',
        );
      }
      if (!estObjet(entree.validation) || typeof entree.validation.par !== 'string'
        || !estDate(entree.validation.date)) {
        erreur(
          r,
          `${chemin}.validation`,
          'une valeur « valide » doit indiquer qui l\'a validée et quand',
        );
      }
    } else if (entree.validation !== undefined && entree.validation !== null) {
      erreur(
        r,
        `${chemin}.validation`,
        'validation renseignée alors que le statut n\'est pas « valide »',
      );
    }
  }
}

/** Valide les variantes concurrentes d'une entrée contestée. */
function validerVariantes(r, chemin, entree, type, unite, aVariantes) {
  if (!aVariantes || !Array.isArray(entree.variantes) || entree.variantes.length < 2) {
    erreur(r, chemin, 'une entrée « conteste » porte au moins deux variantes concurrentes');
    return;
  }
  const cles = new Set();
  entree.variantes.forEach((variante, i) => {
    const cheminV = `${chemin}[${i}]`;
    if (!estObjet(variante)) {
      erreur(r, cheminV, 'variante : objet attendu');
      return;
    }
    if (typeof variante.cle !== 'string' || !RE_ID.test(variante.cle)) {
      erreur(r, `${cheminV}.cle`, 'clé de variante manquante ou mal formée');
    } else if (cles.has(variante.cle)) {
      erreur(r, `${cheminV}.cle`, `clé de variante en double : ${variante.cle}`);
    } else {
      cles.add(variante.cle);
    }
    if (!Object.prototype.hasOwnProperty.call(variante, 'valeur')) {
      erreur(r, `${cheminV}.valeur`, 'valeur manquante');
    } else {
      validerValeur(r, `${cheminV}.valeur`, variante.valeur, type, unite);
    }
    validerUtilisePar(r, `${cheminV}.utilisePar`, variante.utilisePar);
    validerSource(r, `${cheminV}.source`, variante.source);
  });

  // Une divergence se constate entre simulateurs : deux variantes ne peuvent
  // pas être employées par le même simulateur au même endroit.
  const vus = new Map();
  entree.variantes.forEach((variante, i) => {
    (Array.isArray(variante.utilisePar) ? variante.utilisePar : []).forEach((cle) => {
      if (vus.has(cle)) {
        erreur(
          r,
          `${chemin}[${i}].utilisePar`,
          `${cle} figure déjà dans la variante « ${vus.get(cle)} » : une divergence oppose des simulateurs distincts`,
        );
      } else {
        vus.set(cle, variante.cle);
      }
    });
  });
}

/**
 * Valide un fichier de référentiel complet.
 *
 * @param {unknown} referentiel contenu JSON déjà analysé
 * @returns {{erreurs: Array, avertissements: Array}} rapport, erreurs vides si valide
 */
function validerReferentiel(referentiel) {
  const r = rapport();

  if (!estObjet(referentiel)) {
    erreur(r, '', 'référentiel : objet attendu');
    return r;
  }
  if (referentiel.schema !== 1) {
    erreur(r, '.schema', 'version de schéma attendue : 1');
  }
  if (typeof referentiel.domaine !== 'string' || !RE_ID.test(referentiel.domaine)) {
    erreur(r, '.domaine', 'domaine manquant ou mal formé (ex. « ir », « ifi », « dmtg »)');
  }
  if (typeof referentiel.libelle !== 'string' || referentiel.libelle.trim() === '') {
    erreur(r, '.libelle', 'libellé du domaine manquant');
  }
  if (!Array.isArray(referentiel.entrees) || referentiel.entrees.length === 0) {
    erreur(r, '.entrees', 'entrees : tableau non vide attendu');
    return r;
  }

  const vus = new Set();
  referentiel.entrees.forEach((entree, i) => {
    const chemin = `.entrees[${i}]`;
    validerEntree(r, chemin, entree);
    if (estObjet(entree) && typeof entree.id === 'string') {
      // Plusieurs millésimes cohabitent : c'est le couple id + millésime qui
      // doit être unique, pas l'identifiant seul.
      const cle = `${entree.id}@${entree.millesime}`;
      if (vus.has(cle)) {
        erreur(r, `${chemin}.id`, `entrée en double pour ce millésime : ${cle}`);
      } else {
        vus.add(cle);
      }
    }
  });

  return r;
}

/** Version courte : vrai si le référentiel ne porte aucune erreur bloquante. */
function estValide(referentiel) {
  return validerReferentiel(referentiel).erreurs.length === 0;
}

/** Rend un rapport lisible dans un terminal ou dans un échec de test. */
function formaterRapport(r, nom = 'référentiel') {
  const lignes = [];
  r.erreurs.forEach((e) => lignes.push(`  ✗ ${nom}${e.chemin} — ${e.message}`));
  r.avertissements.forEach((a) => lignes.push(`  ⚠ ${nom}${a.chemin} — ${a.message}`));
  return lignes.join('\n');
}

module.exports = {
  TYPES,
  UNITES,
  STATUTS,
  SIMULATEURS,
  INCONNU,
  validerReferentiel,
  estValide,
  formaterRapport,
};
