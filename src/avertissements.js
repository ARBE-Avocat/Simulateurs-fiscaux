/**
 * Avertissements de saisie : avertir sans bloquer (issue #11, reliquat de #8).
 *
 * Politique arrêtée dans `docs/CONVENTIONS.md` §2.3, sur le précédent que le
 * référent fiscal a validé pour l'âge du donateur (fiche 3.2) : une valeur
 * hors des bornes plausibles **continue d'être calculée**, et un avertissement
 * visible signale l'anomalie à côté du champ plutôt que de la laisser passer
 * pour un résultat ordinaire.
 *
 * Les bornes ne sont pas décidées ici. Ce module lit celles que chaque page
 * déclare déjà sur ses champs par les attributs `min` et `max` — un montant
 * jamais négatif, un pourcentage entre 0 et 100, au moins un cédant. Un champ
 * sans borne n'est jamais signalé, et rien n'est inventé.
 *
 * Deux moitiés, séparées volontairement :
 *
 * - `messageHorsBornes()` est pure : une valeur, des bornes, un message ou
 *   `null`. Elle est testée sans navigateur ;
 * - `surveiller()` branche la page : à chaque saisie, un court message est
 *   écrit après le champ, par `textContent`, jamais par `innerHTML`.
 *
 * Un champ qui porte déjà son propre avertissement — l'âge et le nombre de
 * donataires du démembrement, dont les messages ont été validés par le
 * référent — se déclare avec `data-avertissement="manuel"` et n'en reçoit
 * pas un second.
 */

'use strict';

(function (global) {
  var CLASSE_MESSAGE = 'avertissement-saisie';
  var CLASSE_CHAMP = 'saisie-hors-bornes';

  /** Met un nombre en forme pour le message, sans décimales inutiles. */
  function formater(n) {
    return n.toLocaleString('fr-FR', { maximumFractionDigits: 4 });
  }

  /**
   * Message d'avertissement pour une valeur hors bornes, ou `null`.
   *
   * `min` et `max` valent `null` quand la borne n'est pas définie. Un champ
   * vide ou illisible n'est pas une valeur hors bornes : il relève de la
   * valeur par défaut (`Conventions.nombreSaisi`), pas d'un avertissement.
   */
  function messageHorsBornes(valeurBrute, min, max) {
    if (valeurBrute === null || valeurBrute === undefined) return null;
    var texte = String(valeurBrute).trim();
    if (texte === '') return null;
    var valeur = parseFloat(texte);
    if (!isFinite(valeur)) return null;
    if (typeof min === 'number' && isFinite(min) && valeur < min) {
      return 'Valeur inférieure au minimum attendu (' + formater(min) + ') — le calcul continue, vérifiez la saisie.';
    }
    if (typeof max === 'number' && isFinite(max) && valeur > max) {
      return 'Valeur supérieure au maximum attendu (' + formater(max) + ') — le calcul continue, vérifiez la saisie.';
    }
    return null;
  }

  /** Borne numérique d'un attribut, ou `null` s'il est absent ou illisible. */
  function borne(champ, attribut) {
    var brute = champ.getAttribute ? champ.getAttribute(attribut) : null;
    if (brute === null || brute === undefined || String(brute).trim() === '') return null;
    var n = parseFloat(brute);
    return isFinite(n) ? n : null;
  }

  /** Un champ est surveillé s'il est numérique, borné, et sans avertissement propre. */
  function estSurveille(champ) {
    if (!champ || !champ.getAttribute) return false;
    if (String(champ.getAttribute('type') || '').toLowerCase() !== 'number') return false;
    if (champ.getAttribute('data-avertissement') === 'manuel') return false;
    return borne(champ, 'min') !== null || borne(champ, 'max') !== null;
  }

  /** Écrit ou efface le message qui suit un champ. */
  function marquer(champ, message) {
    var suivant = champ.nextElementSibling;
    var existant = suivant && suivant.classList && suivant.classList.contains(CLASSE_MESSAGE) ? suivant : null;

    if (!message) {
      if (existant) existant.remove();
      if (champ.classList) champ.classList.remove(CLASSE_CHAMP);
      if (champ.removeAttribute) champ.removeAttribute('aria-invalid');
      return;
    }

    if (!existant) {
      existant = champ.ownerDocument.createElement('span');
      existant.className = CLASSE_MESSAGE;
      existant.setAttribute('role', 'status');
      champ.insertAdjacentElement('afterend', existant);
    }
    existant.textContent = message;
    if (champ.classList) champ.classList.add(CLASSE_CHAMP);
    if (champ.setAttribute) champ.setAttribute('aria-invalid', 'true');
  }

  /** Vérifie un champ et met son message à jour. */
  function verifier(champ) {
    if (!estSurveille(champ)) return null;
    var message = messageHorsBornes(champ.value, borne(champ, 'min'), borne(champ, 'max'));
    marquer(champ, message);
    return message;
  }

  /** Style minimal du message, injecté une fois : la feuille commune (#31) le reprendra. */
  function injecterStyle(document) {
    if (!document.head || document.getElementById('style-avertissements-saisie')) return;
    var style = document.createElement('style');
    style.id = 'style-avertissements-saisie';
    style.textContent = '.' + CLASSE_MESSAGE + '{display:block;margin-top:4px;font-family:Arial,sans-serif;'
      + 'font-size:11px;line-height:1.4;color:#a06a00;font-weight:600}'
      + '.' + CLASSE_CHAMP + '{outline:2px solid #a06a00;outline-offset:1px}';
    document.head.appendChild(style);
  }

  /**
   * Surveille tous les champs numériques bornés de la page, présents ou
   * ajoutés plus tard — l'écoute est déléguée au document, si bien qu'une ligne
   * de bien ou une carte de cession créée après le chargement est couverte.
   */
  function surveiller(document) {
    if (!document || typeof document.querySelectorAll !== 'function') return;
    injecterStyle(document);
    document.addEventListener('input', function (evenement) {
      if (evenement && evenement.target) verifier(evenement.target);
    }, true);
    var champs = document.querySelectorAll('input[type="number"]');
    for (var i = 0; i < champs.length; i += 1) verifier(champs[i]);
  }

  var api = {
    messageHorsBornes: messageHorsBornes,
    verifier: verifier,
    surveiller: surveiller,
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    global.Avertissements = api;
    if (typeof document !== 'undefined' && document) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { surveiller(document); });
      } else {
        surveiller(document);
      }
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
