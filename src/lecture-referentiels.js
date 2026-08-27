/**
 * Lecture des référentiels fiscaux par les simulateurs.
 *
 * Ce fichier est écrit à la main, contrairement à `src/genere/referentiels/`
 * qui est produit depuis `data/`. Il fournit le peu de code nécessaire pour
 * qu'un simulateur lise une valeur sans recopier la même boucle six fois.
 *
 * Trois principes, qui expliquent pourquoi ces fonctions échouent bruyamment
 * plutôt que de retourner une valeur de repli :
 *
 * 1. une donnée absente est un défaut de déploiement, pas un cas de calcul. La
 *    faire passer pour zéro produirait un montant faux d'apparence normale ;
 * 2. une entrée **contestée** n'a pas de valeur unique. Le code doit désigner
 *    explicitement la variante qu'il emploie, faute de quoi il trancherait une
 *    divergence sans le dire ;
 * 3. `Infinity` n'existe pas dans les données : une tranche sans limite haute y
 *    porte `null`, et c'est ici qu'elle redevient `Infinity`.
 *
 * Un quatrième principe est ajouté par l'issue #19 : **le millésime employé est
 * choisi, jamais subi.** Un référentiel peut contenir plusieurs millésimes d'une
 * même règle ; jusqu'ici la dernière entrée lue l'emportait, sans que rien ne le
 * signale. Le lecteur s'ouvre désormais sur un millésime, et rend compte de la
 * façon dont il l'a résolu — voir `resolution()`.
 */

'use strict';

(function (global) {
  /** Mention explicite d'une information non connue. Jamais une valeur inventée. */
  var INCONNU = 'inconnue';

  /**
   * Résout le millésime employé à partir de celui demandé et de ceux présents.
   *
   * Trois issues, toutes nommées, aucune silencieuse :
   *
   * - `exact` : le millésime demandé existe dans les données ;
   * - `non-ancre` : le simulateur n'a pas dit à quelle année il se rapporte. Un
   *   seul millésime disponible : il s'impose sans ambiguïté. Plusieurs : le
   *   lecteur refuse plutôt que de deviner ;
   * - `hors-couverture` : le millésime demandé n'existe pas. Le lecteur retient
   *   le dernier millésime **antérieur ou égal**, à défaut le plus ancien, et
   *   `sens` dit lequel des deux cas s'applique.
   *
   * Cette règle de repli n'a aujourd'hui **aucun effet** : chaque domaine ne
   * porte qu'un millésime. Elle est soumise au référent fiscal avant qu'un
   * second millésime n'apparaisse (fiche 3.6 de `docs/CORRECTIONS_A_VALIDER.md`).
   */
  function resoudreMillesime(demande, disponibles) {
    if (disponibles.length === 0) {
      throw new Error('Référentiel vide : aucun millésime disponible');
    }

    if (!Number.isInteger(demande)) {
      if (disponibles.length > 1) {
        throw new Error(
          'Référentiel : ' + disponibles.length + ' millésimes disponibles ('
            + disponibles.join(', ') + ') et aucune date de rattachement fournie. '
            + 'Le simulateur doit passer { millesime: … } : deviner reviendrait à '
            + 'choisir une année fiscale sans le dire.',
        );
      }
      return { retenu: disponibles[0], statut: 'non-ancre', sens: null };
    }

    if (disponibles.indexOf(demande) !== -1) {
      return { retenu: demande, statut: 'exact', sens: null };
    }

    var anterieurs = disponibles.filter(function (m) { return m < demande; });
    if (anterieurs.length > 0) {
      return {
        retenu: anterieurs[anterieurs.length - 1],
        statut: 'hors-couverture',
        sens: 'anterieur',
      };
    }
    return { retenu: disponibles[0], statut: 'hors-couverture', sens: 'posterieur' };
  }

  /** Date la plus tardive d'une liste de chaînes `AAAA-MM-JJ`, ou `"inconnue"`. */
  function plusTardive(dates) {
    var connues = dates.filter(function (d) { return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d); });
    if (connues.length === 0) return INCONNU;
    return connues.sort()[connues.length - 1];
  }

  /**
   * Ouvre un domaine — « dmtg », « ir », « ifi »… — et retourne son lecteur.
   *
   * Chaque domaine est un fichier généré distinct, que la page charge par une
   * balise `<script>` avant son propre script. Un simulateur ne charge donc que
   * ce dont il se sert. Le message d'erreur dit quelle balise manque, parce que
   * c'est la panne la plus probable après l'ajout d'un domaine.
   *
   * `options.millesime` est l'année à laquelle la simulation se rapporte :
   * année des revenus, année de la cession, du décès, de la donation, ou année
   * de valorisation au 1er janvier pour l'IFI. Omise, le lecteur reste
   * utilisable tant qu'un seul millésime existe.
   */
  function lecteur(domaine, options) {
    var contenu = (global.REFERENTIELS || {})[domaine];
    if (!contenu) {
      throw new Error(
        'Référentiel « ' + domaine + ' » non chargé. La page doit contenir '
          + '<script src="src/genere/referentiels/' + domaine + '.js"></script> '
          + 'avant son propre script. Si le fichier manque, lancer : '
          + 'npm run donnees:generer',
      );
    }

    var demande = (options || {}).millesime;
    if (typeof demande === 'string' && /^\d{4}$/.test(demande)) demande = Number(demande);

    // Entrées regroupées par identifiant, chacune triée par millésime croissant.
    var parId = {};
    var millesimes = [];
    contenu.entrees.forEach(function (entree) {
      if (!parId[entree.id]) parId[entree.id] = [];
      parId[entree.id].push(entree);
      if (millesimes.indexOf(entree.millesime) === -1) millesimes.push(entree.millesime);
    });
    Object.keys(parId).forEach(function (id) {
      parId[id].sort(function (a, b) { return a.millesime - b.millesime; });
    });
    millesimes.sort(function (a, b) { return a - b; });

    var resolu = resoudreMillesime(demande, millesimes);

    // Écarts d'entrée : une règle qui n'existe pas au millésime retenu est lue à
    // son millésime le plus proche. Chaque cas est mémorisé, jamais tu.
    var ecarts = [];
    var ecartsVus = {};

    function entree(id) {
      var candidats = parId[id];
      if (!candidats) {
        throw new Error('Référentiel ' + domaine + ' : entrée inconnue « ' + id + ' »');
      }

      var exacte = candidats.filter(function (e) { return e.millesime === resolu.retenu; })[0];
      if (exacte) return exacte;

      var anterieures = candidats.filter(function (e) { return e.millesime < resolu.retenu; });
      var repli = anterieures.length > 0 ? anterieures[anterieures.length - 1] : candidats[0];
      if (!ecartsVus[id]) {
        ecartsVus[id] = true;
        ecarts.push({ id: id, libelle: repli.libelle, millesime: repli.millesime });
      }
      return repli;
    }

    function valeur(id) {
      var e = entree(id);
      if (e.statutValidation === 'conteste') {
        throw new Error(
          'Référentiel ' + domaine + ' : « ' + id + ' » est contestée et n\'a pas de valeur '
            + 'unique. Le simulateur doit désigner une variante par son nom.',
        );
      }
      return e.valeur;
    }

    /** Valeur d'une variante d'une entrée contestée, désignée par sa clé. */
    function variante(id, cle) {
      var e = entree(id);
      var trouvee = (e.variantes || []).filter(function (v) { return v.cle === cle; })[0];
      if (!trouvee) {
        throw new Error(
          'Référentiel ' + domaine + ' : « ' + id + ' » n\'a pas de variante « ' + cle + ' »',
        );
      }
      return trouvee.valeur;
    }

    /**
     * Barème normalisé : `{ min, max, taux }`, `max` valant `Infinity` pour la
     * tranche sans limite haute. Les bornes incluses ou exclues restent
     * disponibles pour un calcul qui en dépend.
     */
    function bareme(id) {
      return valeur(id).map(function (tranche) {
        return {
          min: tranche.borneInf,
          max: tranche.borneSup === null ? Infinity : tranche.borneSup,
          minInclus: tranche.borneInfIncluse,
          maxInclus: tranche.borneSupIncluse,
          taux: tranche.taux,
        };
      });
    }

    /**
     * Ce que le lecteur emploie réellement, sous une forme affichable.
     *
     * C'est l'objet que le bandeau de `src/millesime.js` met à l'écran : le
     * millésime retenu, comment il a été résolu, la traçabilité des entrées de
     * ce millésime et les écarts d'entrée constatés jusqu'ici.
     */
    function resolution() {
      var retenues = contenu.entrees.filter(function (e) { return e.millesime === resolu.retenu; });

      var datesEffet = [];
      var statuts = {};
      var revisions = [];
      var toutesSansDateFin = true;
      retenues.forEach(function (e) {
        if (e.dateFin) toutesSansDateFin = false;
        if (datesEffet.indexOf(e.dateEffet) === -1) datesEffet.push(e.dateEffet);
        statuts[e.statutValidation] = (statuts[e.statutValidation] || 0) + 1;
        if (e.source && e.source !== INCONNU && e.source.dateConsultation) {
          revisions.push(e.source.dateConsultation);
        }
        if (e.validation && e.validation.date) revisions.push(e.validation.date);
        (e.variantes || []).forEach(function (v) {
          if (v.source && v.source !== INCONNU && v.source.dateConsultation) {
            revisions.push(v.source.dateConsultation);
          }
        });
      });
      datesEffet.sort();

      return {
        domaine: domaine,
        libelle: contenu.libelle,
        demande: Number.isInteger(demande) ? demande : null,
        retenu: resolu.retenu,
        statut: resolu.statut,
        sens: resolu.sens,
        disponibles: millesimes.slice(),
        entrees: retenues.length,
        datesEffet: datesEffet,
        toutesSansDateFin: toutesSansDateFin,
        revision: plusTardive(revisions),
        statutsValidation: statuts,
        ecarts: ecarts.slice(),
      };
    }

    return {
      entree: entree,
      valeur: valeur,
      variante: variante,
      bareme: bareme,
      millesime: resolu.retenu,
      resolution: resolution,
    };
  }

  /** Millésimes présents dans un domaine chargé, par ordre croissant. */
  function millesimesDisponibles(domaine) {
    var contenu = (global.REFERENTIELS || {})[domaine];
    if (!contenu) return [];
    var vus = [];
    contenu.entrees.forEach(function (e) {
      if (vus.indexOf(e.millesime) === -1) vus.push(e.millesime);
    });
    return vus.sort(function (a, b) { return a - b; });
  }

  var api = {
    lecteur: lecteur,
    millesimesDisponibles: millesimesDisponibles,
    resoudreMillesime: resoudreMillesime,
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    global.LectureReferentiels = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
