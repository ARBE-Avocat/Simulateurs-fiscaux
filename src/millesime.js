/**
 * Millésime fiscal employé : résumé et bandeau partagé (issue #19).
 *
 * Jusqu'ici, le millésime d'un simulateur ne se lisait que dans le nom de son
 * fichier — « Simulation IFI - Avril 2026 ». Rien à l'écran ne disait à quelle
 * année fiscale se rapportaient les barèmes appliqués, ni si cette année
 * correspondait à la date saisie par l'utilisateur.
 *
 * Ce module ne décide rien. Il met en mots ce que `src/lecture-referentiels.js`
 * a réellement retenu, et le rend visible à l'écran comme à l'impression.
 *
 * Deux moitiés, séparées volontairement :
 *
 * - `resumer()` est pure : des résolutions en entrée, du texte en sortie. Elle
 *   est testée sans navigateur ;
 * - `rendre()` construit le bandeau dans le DOM. Elle n'emploie jamais
 *   `innerHTML` : tout passe par `textContent`, y compris la date saisie par
 *   l'utilisateur, qui ne peut donc pas être interprétée comme du HTML.
 */

'use strict';

(function (global) {
  var INCONNU = 'inconnue';

  function pluriel(n, singulier, plurielMot) {
    return n + ' ' + (n > 1 ? plurielMot : singulier);
  }

  /** « 2026-04-17 » → « 17 avril 2026 ». Une date inconnue le reste. */
  function dateLisible(iso) {
    if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return INCONNU;
    var mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    var p = iso.split('-');
    return Number(p[2]) + ' ' + mois[Number(p[1]) - 1] + ' ' + p[0];
  }

  /** Dates d'effet d'un domaine, sous forme d'une seule mention affichable. */
  function mentionDatesEffet(dates) {
    var connues = dates.filter(function (d) { return d !== INCONNU; });
    if (connues.length === 0) return INCONNU;
    if (connues.length === 1 && dates.length === 1) return dateLisible(connues[0]);
    return 'plusieurs (' + connues.map(dateLisible).join(', ')
      + (connues.length < dates.length ? ', et des dates inconnues' : '') + ')';
  }

  /** Résumé du statut de validation des entrées d'un millésime. */
  function mentionValidation(statuts) {
    var ordre = ['conteste', 'non-valide', 'valide'];
    var mots = { conteste: 'contestée', 'non-valide': 'non validée', valide: 'validée' };
    var motsPluriel = { conteste: 'contestées', 'non-valide': 'non validées', valide: 'validées' };
    var parts = [];
    ordre.forEach(function (cle) {
      var n = statuts[cle];
      if (n) parts.push(pluriel(n, mots[cle], motsPluriel[cle]));
    });
    return parts.length ? parts.join(', ') : 'aucune valeur';
  }

  /**
   * Ce qu'il y a à dire d'une résolution, et à quel niveau de gravité.
   *
   * C'est le cœur de l'issue #19 : un millésime qui ne correspond pas à la date
   * de la simulation ne doit jamais passer inaperçu. Mais tous les écarts ne se
   * valent pas, et crier au loup à chaque simulation ferait ignorer le bandeau.
   *
   * - **alerte** : le millésime retenu est *postérieur* à l'année simulée. Du
   *   droit plus récent que les faits est appliqué : c'est faux à coup sûr ;
   * - **mention** : le millésime retenu est *antérieur*, et aucune des valeurs
   *   employées ne porte de date de fin. Il est donc possible qu'elles soient
   *   toujours en vigueur — possible, non vérifié, puisque leur date d'effet
   *   est elle-même inconnue. Le lecteur doit le savoir sans être alarmé ;
   * - **mention** encore : le simulateur ne demande aucune date, et applique
   *   donc son unique millésime à toute situation.
   */
  function noteDe(resolution, ancre) {
    // Le champ est nommé entre guillemets plutôt qu'accordé : « déduite de la
    // date de cession » se lit bien, « déduite de le décès » non. Les guillemets
    // évitent d'avoir à deviner le genre d'un libellé futur.
    var origine = (ancre && ancre.origine)
      || (ancre && ancre.libelle ? 'du champ « ' + ancre.libelle + ' »' : 'de la date de la simulation');

    if (resolution.statut === 'hors-couverture' && resolution.sens === 'posterieur') {
      return {
        niveau: 'alerte',
        texte: 'Aucun référentiel « ' + resolution.libelle + ' » n\'existe pour '
          + resolution.demande + ', année déduite ' + origine + '. Le millésime '
          + resolution.retenu + ' est appliqué faute de mieux : il est postérieur à la '
          + 'situation simulée. Les montants affichés ne reflètent donc pas le droit '
          + 'de ' + resolution.demande + '.',
      };
    }

    if (resolution.statut === 'hors-couverture') {
      return {
        niveau: 'mention',
        texte: 'Le référentiel « ' + resolution.libelle + ' » s\'arrête au millésime '
          + resolution.retenu + ', alors que la simulation porte sur '
          + resolution.demande + ' (déduit ' + origine + '). '
          + (resolution.toutesSansDateFin
            ? 'Aucune de ces valeurs ne porte de date de fin : elles sont peut-être toujours en vigueur, ce qui n\'est pas vérifié.'
            : 'Certaines de ces valeurs portent une date de fin.'),
      };
    }

    if (resolution.statut === 'non-ancre') {
      // Deux situations distinctes : le simulateur a un champ de date encore
      // vide, ou il n'en a aucun. Les confondre laisserait croire à un défaut
      // là où il n'y a qu'un formulaire non rempli.
      if (ancre) {
        return {
          niveau: 'mention',
          texte: 'Tant que le champ « ' + ancre.libelle + ' » n\'est pas renseigné, le millésime '
            + resolution.retenu + ' de « ' + resolution.libelle + ' » s\'applique : '
            + 'c\'est le seul disponible.',
        };
      }
      return {
        niveau: 'mention',
        texte: 'Le simulateur ne demande aucune date permettant de rattacher « '
          + resolution.libelle + ' » à une année. Le millésime ' + resolution.retenu
          + ' est le seul disponible et s\'applique donc à toute simulation, quelle '
          + 'que soit sa date réelle.',
      };
    }

    return null;
  }

  /**
   * Résume un ensemble de résolutions de lecteurs.
   *
   * `ancre` décrit la date qui a servi à choisir le millésime :
   * `{ libelle: 'Date de cession', valeur: '2025-04-05' }`. Elle vaut `null`
   * lorsque le simulateur n'en a aucune.
   */
  function resumer(resolutions, ancre) {
    var notes = [];

    var lignes = resolutions.map(function (r) {
      var note = noteDe(r, ancre);
      if (note) notes.push(note);
      return {
        domaine: r.domaine,
        libelle: r.libelle,
        millesime: r.retenu,
        demande: r.demande,
        statut: r.statut,
        disponibles: r.disponibles.slice(),
        dateEffet: mentionDatesEffet(r.datesEffet),
        revision: r.revision === INCONNU ? INCONNU : dateLisible(r.revision),
        validation: mentionValidation(r.statutsValidation),
        entrees: r.entrees,
        note: note,
      };
    });

    // Une règle absente du millésime retenu est toujours une alerte : la valeur
    // employée ne se rattache même pas au millésime annoncé par le bandeau.
    resolutions.forEach(function (r) {
      r.ecarts.forEach(function (e) {
        notes.push({
          niveau: 'alerte',
          texte: '« ' + e.libelle + ' » n\'existe pas au millésime ' + r.retenu
            + ' : la valeur de ' + e.millesime + ' est employée.',
        });
      });
    });

    var texte = lignes.map(function (l) {
      return l.libelle + ' — millésime ' + l.millesime;
    }).join(' · ');
    if (ancre && ancre.valeur) {
      texte = ancre.libelle + ' : ' + dateLisible(ancre.valeur) + ' · ' + texte;
    }

    return {
      lignes: lignes,
      notes: notes,
      alertes: notes.filter(function (n) { return n.niveau === 'alerte'; }),
      ancre: ancre || null,
      texte: texte,
    };
  }

  /**
   * Feuille de style du bandeau, posée une seule fois par page.
   *
   * Elle vit ici plutôt que dans les six fichiers HTML pour une raison simple :
   * six copies d'un même bloc de style divergent tôt ou tard, et le bandeau
   * doit se lire de la même façon partout. Les couleurs empruntent les
   * variables de la page lorsqu'elles existent, avec un repli explicite pour
   * les simulateurs qui emploient une autre palette.
   *
   * L'impression conserve le bandeau : un résultat imprimé sans son millésime
   * ne peut pas être reproduit, ce que l'issue #19 demande explicitement.
   */
  var STYLE = [
    '.millesime{font-family:Arial,sans-serif;font-size:12px;line-height:1.55;',
    'border:1px solid var(--border,#d4b8a0);border-left:3px solid var(--gold,#c4956a);',
    'border-radius:var(--radius,4px);padding:0.7rem 0.9rem;margin:1rem 0;',
    'background:var(--off-white,#faf6f2);color:var(--text-medium,#4a4a4a);}',
    '.millesime-titre{font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;',
    'font-size:10px;color:var(--navy,#2c1810);margin-bottom:0.4rem;}',
    '.millesime-ancre{margin-bottom:0.3rem;}',
    '.millesime-ligne{display:flex;flex-wrap:wrap;align-items:baseline;gap:0.5rem;margin-top:0.25rem;}',
    '.millesime-domaine{font-weight:bold;color:var(--navy,#2c1810);}',
    '.millesime-valeur{color:var(--text-dark,#2c1810);}',
    '.millesime-detail{color:var(--text-light,#7a7a7a);}',
    '.millesime-choix{font-family:inherit;font-size:12px;padding:1px 4px;',
    'border:1px solid var(--border,#d4b8a0);border-radius:3px;background:var(--white,#fff);}',
    '.millesime-alerte,.millesime-mention{margin-top:0.5rem;padding:0.5rem 0.6rem;',
    'border-radius:3px;border-left:2px solid;}',
    '.millesime-alerte{background:rgba(160,48,48,0.08);border-color:var(--danger,#a03030);',
    'color:var(--danger,#a03030);}',
    '.millesime-mention{background:rgba(0,0,0,0.03);border-color:var(--border,#d4b8a0);',
    'color:var(--text-medium,#4a4a4a);}',
    '@media print{.millesime{break-inside:avoid;background:#fff;}',
    '.millesime-choix{border:none;background:none;-webkit-appearance:none;appearance:none;}',
    '.millesime-alerte,.millesime-mention{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}',
  ].join('');

  function poserStyle(document) {
    if (document.getElementById('millesime-style')) return;
    var style = document.createElement('style');
    style.id = 'millesime-style';
    style.textContent = STYLE;
    (document.head || document.body || document.documentElement).appendChild(style);
  }

  /** Crée un élément avec sa classe et son texte. Jamais d'`innerHTML`. */
  function el(document, balise, classe, texte) {
    var noeud = document.createElement(balise);
    if (classe) noeud.className = classe;
    if (texte !== undefined && texte !== null) noeud.textContent = texte;
    return noeud;
  }

  /**
   * Construit le bandeau « Référentiel employé » dans `cible`.
   *
   * `options.surChangementMillesime(domaine, millesime)` est appelé lorsque
   * l'utilisateur choisit un millésime à la main. Le sélecteur n'apparaît que
   * si le domaine en porte réellement plusieurs : proposer un choix unique
   * laisserait croire à une possibilité qui n'existe pas.
   */
  function rendre(cible, resume, options) {
    if (!cible) return;
    var document = cible.ownerDocument || global.document;
    var opts = options || {};

    poserStyle(document);
    cible.className = 'millesime';
    cible.replaceChildren();
    cible.appendChild(el(document, 'div', 'millesime-titre', 'Référentiel fiscal employé'));

    if (resume.ancre && resume.ancre.valeur) {
      cible.appendChild(el(document, 'div', 'millesime-ancre',
        resume.ancre.libelle + ' : ' + dateLisible(resume.ancre.valeur)));
    }

    resume.lignes.forEach(function (ligne) {
      var l = el(document, 'div', 'millesime-ligne');
      l.appendChild(el(document, 'span', 'millesime-domaine', ligne.libelle));

      if (ligne.disponibles.length > 1 && typeof opts.surChangementMillesime === 'function') {
        var liste = document.createElement('select');
        liste.className = 'millesime-choix';
        ligne.disponibles.forEach(function (m) {
          var option = el(document, 'option', null, String(m));
          option.value = String(m);
          if (m === ligne.millesime) option.selected = true;
          liste.appendChild(option);
        });
        liste.addEventListener('change', function () {
          opts.surChangementMillesime(ligne.domaine, Number(liste.value));
        });
        l.appendChild(liste);
      } else {
        l.appendChild(el(document, 'span', 'millesime-valeur', 'millésime ' + ligne.millesime));
      }

      l.appendChild(el(document, 'span', 'millesime-detail',
        'date d\'effet : ' + ligne.dateEffet
          + ' · révision : ' + ligne.revision
          + ' · ' + pluriel(ligne.entrees, 'valeur', 'valeurs') + ' — ' + ligne.validation));
      cible.appendChild(l);
    });

    resume.notes.forEach(function (note) {
      cible.appendChild(el(document, 'div', 'millesime-' + note.niveau, note.texte));
    });

    return cible;
  }

  var api = {
    resumer: resumer,
    noteDe: noteDe,
    poserStyle: poserStyle,
    rendre: rendre,
    dateLisible: dateLisible,
    mentionDatesEffet: mentionDatesEffet,
    mentionValidation: mentionValidation,
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    global.Millesime = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
