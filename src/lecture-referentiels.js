/**
 * Lecture des référentiels fiscaux par les simulateurs.
 *
 * Ce fichier est écrit à la main, contrairement à `src/genere/referentiels.js`
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
 */

'use strict';

(function (global) {
  function referentiels() {
    var source = global.REFERENTIELS;
    if (!source) {
      throw new Error(
        'Référentiels absents : la page doit charger src/genere/referentiels.js '
          + 'avant son script. Si le fichier manque, lancer : npm run donnees:generer',
      );
    }
    return source;
  }

  /** Ouvre un domaine — « dmtg », « ir », « ifi »… — et retourne son lecteur. */
  function lecteur(domaine) {
    var contenu = referentiels()[domaine];
    if (!contenu) {
      throw new Error('Référentiel absent : domaine « ' + domaine + ' »');
    }

    var parId = {};
    contenu.entrees.forEach(function (entree) {
      parId[entree.id] = entree;
    });

    function entree(id) {
      var trouvee = parId[id];
      if (!trouvee) {
        throw new Error('Référentiel ' + domaine + ' : entrée inconnue « ' + id + ' »');
      }
      return trouvee;
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

    return { entree: entree, valeur: valeur, variante: variante, bareme: bareme };
  }

  var api = { lecteur: lecteur };

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    global.LectureReferentiels = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
