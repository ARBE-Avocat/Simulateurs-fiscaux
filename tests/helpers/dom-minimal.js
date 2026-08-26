/**
 * Faux DOM minimal pour exécuter, sans navigateur, le JavaScript embarqué dans
 * les simulateurs.
 *
 * Objectif : pouvoir appeler les fonctions de calcul dans Node alors que le
 * script contient aussi du câblage d'interface (`getElementById`,
 * `addEventListener`, rendu HTML). Ce faux DOM ne simule rien : il absorbe les
 * appels d'interface sans erreur pour laisser le moteur de calcul accessible.
 *
 * Il ne remplace pas une vérification visuelle dans un vrai navigateur.
 */

/** Crée un élément factice qui accepte les opérations d'interface courantes. */
function creerElement(tagName = 'div') {
  const element = {
    tagName: String(tagName).toUpperCase(),
    id: '',
    className: '',
    value: '',
    textContent: '',
    innerHTML: '',
    innerText: '',
    checked: false,
    disabled: false,
    selectedIndex: 0,
    children: [],
    style: {},
    dataset: {},
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() {
        return false;
      },
    },
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return true;
    },
    setAttribute() {},
    getAttribute() {
      return null;
    },
    removeAttribute() {},
    appendChild(enfant) {
      this.children.push(enfant);
      return enfant;
    },
    insertBefore(enfant) {
      this.children.push(enfant);
      return enfant;
    },
    removeChild() {},
    replaceChildren() {
      this.children = [];
    },
    remove() {},
    focus() {},
    blur() {},
    click() {},
    scrollIntoView() {},
    closest() {
      return null;
    },
    getBoundingClientRect() {
      return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
    },
    querySelector() {
      return creerElement();
    },
    querySelectorAll() {
      return [];
    },
  };
  return element;
}

/**
 * Construit un objet global minimal (`document`, `window`, ...) utilisable
 * comme contexte d'exécution du script d'un simulateur.
 */
function creerFauxDom() {
  // Les éléments sont mémorisés par identifiant : deux appels successifs à
  // getElementById('salaire1') doivent renvoyer le même objet, sinon une
  // valeur écrite par un test serait perdue.
  const parId = new Map();

  const document = {
    getElementById(id) {
      if (!parId.has(id)) {
        const element = creerElement();
        element.id = id;
        parId.set(id, element);
      }
      return parId.get(id);
    },
    createElement: (tagName) => creerElement(tagName),
    querySelector: () => creerElement(),
    querySelectorAll: () => [],
    addEventListener() {},
    removeEventListener() {},
    body: creerElement('body'),
    documentElement: creerElement('html'),
    readyState: 'complete',
  };

  const global = {
    document,
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    /** Le faux DOM ne charge rien depuis le réseau : les tests restent hors ligne. */
    fetch() {
      throw new Error("Appel réseau interdit dans les tests (fetch)");
    },
    alert() {},
    confirm() {
      return true;
    },
    print() {},
    addEventListener() {},
    removeEventListener() {},
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    requestAnimationFrame: (callback) => setTimeout(() => callback(0), 0),
    localStorage: {
      getItem: () => null,
      setItem() {},
      removeItem() {},
      clear() {},
    },
  };
  global.window = global;
  global.self = global;

  return { global, document, elementsParId: parId };
}

module.exports = { creerFauxDom, creerElement };
