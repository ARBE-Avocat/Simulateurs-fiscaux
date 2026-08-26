/**
 * Normalisation d'un CSV officiel vers le schéma des référentiels (issue #18).
 *
 * L'objectif est de remplacer « envoyer un CSV à une IA pour qu'elle réécrive le
 * HTML » par une chaîne reproductible : même entrée, même sortie, à la virgule
 * près, et un refus explicite plutôt qu'une valeur devinée.
 *
 * L'importeur ne complète jamais une donnée manquante. Une colonne vide devient
 * la mention explicite « inconnue », jamais une valeur plausible.
 */

'use strict';

const { lireCsv } = require('./csv');
const { INCONNU } = require('./schema-referentiel');

const COLONNES_REQUISES = [
  'id',
  'libelle',
  'type',
  'unite',
  'millesime',
  'dateEffet',
  'statutValidation',
  'utilisePar',
];

/** Colonnes reconnues. Toute autre colonne fait échouer l'import. */
const COLONNES_CONNUES = new Set([
  ...COLONNES_REQUISES,
  'dateFin',
  'valeur',
  'borneInf',
  'borneInfIncluse',
  'borneSup',
  'borneSupIncluse',
  'taux',
  'varianteCle',
  'arbitrageDocument',
  'arbitragePoint',
  'arbitrageQuestion',
  'sourceReference',
  'sourceUrl',
  'sourceDateConsultation',
  'validationPar',
  'validationDate',
  'notes',
]);

class ErreurImport extends Error {}

function echouer(ligne, message) {
  throw new ErreurImport(`ligne ${ligne} : ${message}`);
}

/** Lit un nombre écrit à la française ou à l'anglaise, sans jamais deviner. */
function nombre(texte, ligne, colonne) {
  const normalise = texte.replace(/\s| | /g, '').replace(',', '.');
  if (normalise === '') echouer(ligne, `colonne ${colonne} vide, un nombre est attendu`);
  const n = Number(normalise);
  if (!Number.isFinite(n)) {
    echouer(ligne, `colonne ${colonne} : « ${texte} » n'est pas un nombre`);
  }
  return n;
}

/** Lit un booléen écrit `oui` ou `non`. Rien d'autre n'est accepté. */
function booleen(texte, ligne, colonne) {
  if (texte === 'oui') return true;
  if (texte === 'non') return false;
  echouer(ligne, `colonne ${colonne} : « ${texte} » — attendu « oui » ou « non »`);
  return false;
}

function liste(texte, ligne, colonne) {
  const items = texte.split(',').map((s) => s.trim()).filter((s) => s !== '');
  if (items.length === 0) echouer(ligne, `colonne ${colonne} vide`);
  return items;
}

function source(valeurs, ligne) {
  const reference = valeurs.sourceReference || '';
  const date = valeurs.sourceDateConsultation || '';
  if (reference === '' && date === '') return INCONNU;
  if (reference === '') {
    echouer(ligne, 'une date de consultation est donnée sans référence de source');
  }
  if (date === '') {
    echouer(ligne, `source « ${reference} » sans date de consultation : impossible de savoir si elle est périmée`);
  }
  const s = { reference, dateConsultation: date };
  if (valeurs.sourceUrl) s.url = valeurs.sourceUrl;
  return s;
}

/** Construit la valeur d'une ligne selon le type déclaré. */
function valeurDeLigne(valeurs, ligne, type) {
  switch (type) {
    case 'taux':
    case 'montant':
    case 'quantite':
      return nombre(valeurs.valeur ?? '', ligne, 'valeur');
    case 'booleen':
      return booleen(valeurs.valeur ?? '', ligne, 'valeur');
    default:
      echouer(ligne, `type « ${type} » : la colonne valeur n'est pas exploitable ici`);
      return null;
  }
}

function trancheDeLigne(valeurs, ligne) {
  const borneSupBrute = valeurs.borneSup ?? '';
  return {
    borneInf: nombre(valeurs.borneInf ?? '', ligne, 'borneInf'),
    borneInfIncluse: booleen(valeurs.borneInfIncluse ?? '', ligne, 'borneInfIncluse'),
    // Une tranche sans limite haute s'écrit avec une colonne vide. `Infinity`
    // n'existe pas en JSON : le schéma attend null.
    borneSup: borneSupBrute === '' ? null : nombre(borneSupBrute, ligne, 'borneSup'),
    borneSupIncluse: borneSupBrute === '' ? false : booleen(valeurs.borneSupIncluse ?? '', ligne, 'borneSupIncluse'),
    taux: nombre(valeurs.taux ?? '', ligne, 'taux'),
  };
}

/** Champs qui doivent être identiques sur toutes les lignes d'une même entrée. */
const CHAMPS_PARTAGES = ['libelle', 'type', 'unite', 'dateEffet', 'dateFin', 'statutValidation'];

/**
 * Champs qui décrivent l'entrée et non la ligne.
 *
 * Pour un barème, chaque ligne est une tranche mais l'entrée n'a qu'un
 * rattachement et qu'une source : les répéter différemment d'une ligne à
 * l'autre rendrait le résultat dépendant de l'ordre du CSV.
 */
const CHAMPS_ENTREE = ['utilisePar', 'sourceReference', 'sourceUrl', 'sourceDateConsultation'];

/**
 * Transforme un CSV en référentiel conforme au schéma.
 *
 * @param {string} contenu texte du CSV
 * @param {{domaine: string, libelle: string}} entete description du domaine
 * @returns {object} référentiel prêt à valider
 */
function importer(contenu, entete) {
  const { entetes, lignes } = lireCsv(contenu);

  const inconnues = entetes.filter((e) => !COLONNES_CONNUES.has(e));
  if (inconnues.length) {
    throw new ErreurImport(`colonnes inconnues : ${inconnues.join(', ')}`);
  }
  const manquantes = COLONNES_REQUISES.filter((c) => !entetes.includes(c));
  if (manquantes.length) {
    throw new ErreurImport(`colonnes obligatoires absentes : ${manquantes.join(', ')}`);
  }
  if (lignes.length === 0) {
    throw new ErreurImport('aucune ligne de données');
  }

  const groupes = new Map();

  for (const { numero, valeurs } of lignes) {
    if (!valeurs.id) echouer(numero, 'identifiant vide');
    const millesime = nombre(valeurs.millesime, numero, 'millesime');
    if (!Number.isInteger(millesime)) {
      echouer(numero, `millésime « ${valeurs.millesime} » : un entier est attendu`);
    }
    const cle = `${valeurs.id}@${millesime}`;

    if (!groupes.has(cle)) {
      groupes.set(cle, {
        id: valeurs.id,
        millesime,
        premiereLigne: numero,
        partages: Object.fromEntries(CHAMPS_PARTAGES.map((c) => [c, valeurs[c] ?? ''])),
        lignes: [],
      });
    }
    const groupe = groupes.get(cle);

    for (const champ of CHAMPS_PARTAGES) {
      if ((valeurs[champ] ?? '') !== groupe.partages[champ]) {
        echouer(
          numero,
          `« ${champ} » diffère de la ligne ${groupe.premiereLigne} pour la même entrée ${cle}`,
        );
      }
    }
    groupe.lignes.push({ numero, valeurs });
  }

  const entrees = [];

  for (const groupe of groupes.values()) {
    const { type, statutValidation } = groupe.partages;
    const conteste = statutValidation === 'conteste';
    const estBareme = type === 'bareme';

    if (estBareme && groupe.lignes.length > 1) {
      const premiere = groupe.lignes[0];
      for (const { numero, valeurs } of groupe.lignes.slice(1)) {
        for (const champ of CHAMPS_ENTREE) {
          if ((valeurs[champ] ?? '') !== (premiere.valeurs[champ] ?? '')) {
            echouer(
              numero,
              `« ${champ} » décrit l'entrée, pas la tranche : il doit être identique à la ligne ${premiere.numero}`,
            );
          }
        }
      }
    }

    if (conteste && estBareme) {
      echouer(
        groupe.premiereLigne,
        'un barème contesté n\'est pas couvert par l\'import : à décrire à la main dans le JSON',
      );
    }

    const commun = {
      id: groupe.id,
      libelle: groupe.partages.libelle,
      type,
      unite: groupe.partages.unite,
      millesime: groupe.millesime,
      dateEffet: groupe.partages.dateEffet || INCONNU,
      dateFin: groupe.partages.dateFin === '' ? null : groupe.partages.dateFin,
      statutValidation,
    };

    if (conteste) {
      // La question posée décrit l'entrée, pas la variante : deux formulations
      // différentes rendraient le résultat dépendant de l'ordre des lignes.
      const premiereLigne = groupe.lignes[0];
      for (const { numero, valeurs } of groupe.lignes.slice(1)) {
        for (const champ of ['arbitrageDocument', 'arbitragePoint', 'arbitrageQuestion']) {
          if ((valeurs[champ] ?? '') !== (premiereLigne.valeurs[champ] ?? '')) {
            echouer(
              numero,
              `« ${champ} » décrit l'entrée, pas la variante : il doit être identique à la ligne ${premiereLigne.numero}`,
            );
          }
        }
      }
      const variantes = groupe.lignes.map(({ numero, valeurs }) => {
        if (!valeurs.varianteCle) {
          echouer(numero, 'entrée contestée : la colonne varianteCle est obligatoire');
        }
        return {
          cle: valeurs.varianteCle,
          valeur: valeurDeLigne(valeurs, numero, type),
          utilisePar: liste(valeurs.utilisePar, numero, 'utilisePar'),
          source: source(valeurs, numero),
        };
      });
      const premiere = groupe.lignes[0].valeurs;
      // Ordre stable des variantes : leur ordre dans le CSV n'a aucun sens et
      // ne doit pas produire de diff.
      variantes.sort((a, b) => a.cle.localeCompare(b.cle, 'fr'));
      commun.variantes = variantes;
      commun.arbitrage = {
        question: premiere.arbitrageQuestion || '',
      };
      if (premiere.arbitrageDocument) commun.arbitrage.document = premiere.arbitrageDocument;
      if (premiere.arbitragePoint) commun.arbitrage.point = premiere.arbitragePoint;
      if (!commun.arbitrage.question) {
        echouer(
          groupe.premiereLigne,
          'entrée contestée sans arbitrageQuestion : une divergence non posée resterait invisible',
        );
      }
    } else if (estBareme) {
      // Tri par borne basse : la sortie ne doit pas dépendre de l'ordre des
      // lignes du CSV, sinon deux imports du même fichier réordonné
      // produiraient deux diffs.
      commun.valeur = groupe.lignes
        .map(({ numero, valeurs }) => trancheDeLigne(valeurs, numero))
        .sort((a, b) => a.borneInf - b.borneInf);
      commun.utilisePar = liste(
        groupe.lignes[0].valeurs.utilisePar,
        groupe.lignes[0].numero,
        'utilisePar',
      );
      commun.source = source(groupe.lignes[0].valeurs, groupe.lignes[0].numero);
    } else {
      if (groupe.lignes.length > 1) {
        echouer(
          groupe.lignes[1].numero,
          `l'entrée ${groupe.id}@${groupe.millesime} apparaît plusieurs fois alors qu'elle n'est ni un barème ni une entrée contestée`,
        );
      }
      const { numero, valeurs } = groupe.lignes[0];
      commun.valeur = valeurDeLigne(valeurs, numero, type);
      commun.utilisePar = liste(valeurs.utilisePar, numero, 'utilisePar');
      commun.source = source(valeurs, numero);
      if (valeurs.validationPar || valeurs.validationDate) {
        commun.validation = { par: valeurs.validationPar, date: valeurs.validationDate };
      }
    }

    // Une note décrit l'entrée, pas la ligne. On tolère qu'elle ne soit écrite
    // que sur l'une des lignes d'un barème — c'est plus lisible dans un
    // tableur — mais deux notes différentes seraient ambiguës, donc refusées.
    const notes = [...new Set(groupe.lignes.map(({ valeurs }) => valeurs.notes).filter(Boolean))];
    if (notes.length > 1) {
      echouer(
        groupe.premiereLigne,
        `l'entrée ${groupe.id}@${groupe.millesime} porte ${notes.length} notes différentes : laquelle décrit l'entrée ?`,
      );
    }
    if (notes.length === 1) [commun.notes] = notes;

    entrees.push(commun);
  }

  // Ordre stable : deux imports du même contenu produisent le même fichier.
  entrees.sort((a, b) => (a.id === b.id ? a.millesime - b.millesime : a.id.localeCompare(b.id, 'fr')));

  return {
    schema: 1,
    domaine: entete.domaine,
    libelle: entete.libelle,
    entrees,
  };
}

module.exports = { importer, ErreurImport, COLONNES_REQUISES };
