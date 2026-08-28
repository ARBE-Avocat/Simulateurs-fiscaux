/**
 * Conventions communes de lecture et d'affichage (issue #11).
 *
 * `docs/INVENTAIRE_CONVENTIONS.md` a relevé sept divergences entre les six
 * simulateurs. Quatre d'entre elles sont des choix purement techniques, sans
 * incidence sur un montant d'impôt : ce module les tranche en un seul endroit.
 * Les trois autres — représentation des tranches, nombre de décimales
 * affichées, étapes d'arrondi — appartiennent au référent fiscal et ne sont
 * pas décidées ici. Voir `docs/CONVENTIONS.md`.
 *
 * Aucune fonction de ce module ne modifie un résultat de calcul. Elles lisent
 * une saisie ou mettent en forme une valeur déjà calculée.
 *
 * Règle qui gouverne l'ensemble : **ne jamais présenter une valeur inexploitable
 * comme un résultat**. Un calcul qui n'aboutit pas s'affiche « — », jamais
 * « NaN € » qui n'a pas de sens pour le lecteur, et surtout jamais « 0 € » qui
 * ferait passer une erreur pour un montant nul réel.
 */

'use strict';

(function (global) {
  /** Ce qu'affiche un montant qu'on ne sait pas calculer. */
  var INDISPONIBLE = '—';

  /**
   * Lit une saisie utilisateur sans jamais la corriger en silence.
   *
   * Seuls un champ vide et une saisie illisible autorisent la valeur par
   * défaut. Zéro est un nombre comme un autre : il est respecté. C'est la
   * règle posée par l'issue #8, généralisée ici aux six simulateurs.
   */
  function nombreSaisi(valeurBrute, valeurParDefaut) {
    if (valeurParDefaut === undefined) valeurParDefaut = 0;
    if (valeurBrute === null || valeurBrute === undefined) return valeurParDefaut;
    var texte = String(valeurBrute).trim();
    if (texte === '') return valeurParDefaut;
    var nombre = parseFloat(texte);
    if (!isFinite(nombre)) return valeurParDefaut;
    return nombre;
  }

  /**
   * Lit une case à cocher. Une case introuvable vaut `false`, jamais `true`.
   *
   * L'IRPP employait `$(id)?.checked ?? true` : une faute de frappe dans un
   * identifiant activait donc silencieusement une option, et donc un
   * prélèvement. Les treize identifiants existent aujourd'hui, ce changement
   * ne modifie donc aucun montant ; il empêche la panne future.
   */
  function caseCochee(element) {
    return !!(element && element.checked);
  }

  /** Un nombre exploitable : ni NaN, ni Infinity, ni autre chose qu'un nombre. */
  function estNombreAffichable(n) {
    return typeof n === 'number' && isFinite(n);
  }

  /**
   * Met en forme un montant en euros.
   *
   * Le nombre de décimales reste un paramètre : le choix « à l'euro ou au
   * centime » appartient au référent fiscal et n'est pas tranché. Chaque
   * simulateur conserve donc pour l'instant le sien, et ce module se contente
   * d'unifier le traitement du cas invalide.
   */
  function formaterMontant(n, decimales) {
    if (!estNombreAffichable(n)) return INDISPONIBLE;
    if (decimales === undefined) decimales = 0;
    return n.toLocaleString('fr-FR', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    }) + ' €';
  }

  /**
   * Met en forme un taux **donné en décimal** : 0,172 → « 17,2 % ».
   *
   * Convention unique retenue pour les six simulateurs : un taux est stocké et
   * manipulé en décimal, et n'est converti en pourcentage qu'à l'affichage.
   * C'était déjà l'usage majoritaire. Le simulateur « IR, CEHR et CDHR »
   * employait la convention inverse — `fmtPct(17.2)` — ce qui donnait un
   * résultat faux d'un facteur cent lorsqu'une valeur passait d'un simulateur
   * à l'autre, sans le moindre avertissement.
   */
  function formaterTaux(tauxDecimal, decimales) {
    if (!estNombreAffichable(tauxDecimal)) return INDISPONIBLE;
    var pourcentage = tauxDecimal * 100;
    if (decimales === undefined) {
      // Au plus deux décimales, sans zéros inutiles : 0,172 → « 17,2 % ».
      return pourcentage.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' %';
    }
    return pourcentage.toLocaleString('fr-FR', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    }) + ' %';
  }

  var api = {
    INDISPONIBLE: INDISPONIBLE,
    nombreSaisi: nombreSaisi,
    caseCochee: caseCochee,
    estNombreAffichable: estNombreAffichable,
    formaterMontant: formaterMontant,
    formaterTaux: formaterTaux,
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    global.Conventions = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
