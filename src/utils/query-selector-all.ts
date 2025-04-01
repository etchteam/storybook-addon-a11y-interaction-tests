import postcssSelectorParser from 'postcss-selector-parser';

// Had to take this from https://www.npmjs.com/package/kagekiri because it
// exploded on production with what looked like a circular dependency issue
// We've opened an issue so if that gets fixed we might be able to remove this
// https://github.com/salesforce/kagekiri/issues/113

// We couldn't use the querySelectorAll provided by shadow-dom-testing-library
// because it doesn't respect the DOM order, this is the only lib I can find
// that does.

type Context = HTMLElement | Document | ShadowRoot;

function getChildren(node: any) {
  if (node.documentElement) {
    // document, make sure <html> is the first "child"
    return [node.documentElement];
  } else if (node.shadowRoot) {
    // shadow host
    return node.shadowRoot.children;
  } else if (typeof node.assignedElements === 'function') {
    // slot
    // If the slot has assigned slottable nodes (text or elements), then it is rendering
    // those instead of the default content. Otherwise, return the default content.
    // See: https://dom.spec.whatwg.org/#concept-slotable
    return node.assignedNodes().length
      ? node.assignedElements()
      : node.children;
  } else {
    // regular element
    return node.children;
  }
}

class ElementIterator {
  private _queue: Context[];
  constructor(context: Context) {
    this._queue = [context];
    this.next(); // disregard the root
  }

  next() {
    // create the results list in depth-first order
    const node = this._queue.pop();
    if (node) {
      const children = getChildren(node);
      // In IE, children may be undefined if the `node` is the document.
      // We don't run coverage tests for IE, so it's ignored.
      // See: https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/children#Browser_compatibility
      /* istanbul ignore else */
      if (children) {
        for (let i = children.length - 1; i >= 0; i--) {
          this._queue.push(children[i]);
        }
      }
    }
    return node;
  }
}

// given a list of ast nodes, find the final list and stop when hitting
// a combinator. for instance "div span > button span strong.foo" should return "strong.foo"
function getLastNonCombinatorNodes(nodes: any[]) {
  const results = [];
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (node.type === 'combinator') {
      break;
    }
    results.push(node);
  }
  return results.reverse();
}

function getParent(element: any) {
  // If an element is slotted, ignore the "real" parent and use the shadow DOM parent.
  // Unless the slot is also slotted; just return the parent element in this case.
  if (
    typeof element.assignedElements !== 'function' &&
    element.assignedSlot &&
    element.assignedSlot.parentElement
  ) {
    return element.assignedSlot.parentElement;
  }
  if (element.parentElement) {
    return element.parentElement;
  }
  // if an element is inside the shadow DOM, break outside of it
  const rootNode = element.getRootNode();
  /* istanbul ignore else */
  if (rootNode !== document) {
    return rootNode.host;
  }
}

function getFirstMatchingAncestor(element: HTMLElement, nodes: any[]) {
  let ancestor = getParent(element);
  while (ancestor) {
    if (matchesSelector(ancestor, { nodes })) {
      return ancestor;
    }

    ancestor = getParent(ancestor);
  }
}

function getFirstMatchingPreviousSibling(element: Element, nodes: any[]) {
  let sibling = element.previousElementSibling;
  while (sibling) {
    if (matchesSelector(sibling, { nodes })) {
      return sibling;
    }
    sibling = sibling.previousElementSibling;
  }
}

function matchesSelector(element: any, ast: any) {
  const { nodes } = ast;
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    /* istanbul ignore else */
    if (node.type === 'id') {
      if (element.id !== node.value) {
        return false;
      }
    } else if (node.type === 'class') {
      if (!element.classList.contains(node.value)) {
        return false;
      }
    } else if (node.type === 'tag') {
      if (element.tagName.toLowerCase() !== node.value.toLowerCase()) {
        return false;
      }
    } else if (node.type === 'pseudo' || node.type === 'attribute') {
      // For pseudos and attributes, just use the native element matcher.
      // `sourceCode` comes from `attachSourceIfNecessary()`
      if (!element.matches(node.sourceCode)) {
        return false;
      }
    } else if (node.type === 'combinator') {
      /* istanbul ignore else */
      if (node.value === ' ') {
        // walk all ancestors
        const lastNonCombinatorNodes = getLastNonCombinatorNodes(
          nodes.slice(0, i),
        );
        const nodesBeforeLastNonCombinatorNodes = nodes.slice(
          0,
          i - lastNonCombinatorNodes.length,
        );
        return evaluateAncestorTree(
          element,
          lastNonCombinatorNodes,
          nodesBeforeLastNonCombinatorNodes,
        );
      } else if (node.value === '>') {
        // walk immediate parent only
        const precedingNodes = getLastNonCombinatorNodes(nodes.slice(0, i));
        const ancestor = getParent(element);
        if (
          !ancestor ||
          !matchesSelector(ancestor, { nodes: precedingNodes })
        ) {
          return false;
        } else {
          element = ancestor;
          i -= 1;
        }
      } else if (node.value === '+') {
        // walk immediate sibling only
        const precedingNodes = getLastNonCombinatorNodes(nodes.slice(0, i));
        const sibling = element.previousElementSibling;
        if (!sibling || !matchesSelector(sibling, { nodes: precedingNodes })) {
          return false;
        } else {
          i -= precedingNodes.length;
        }
      } else if (node.value === '~') {
        // walk all previous siblings
        const precedingNodes = getLastNonCombinatorNodes(nodes.slice(0, i));
        const sibling = getFirstMatchingPreviousSibling(
          element,
          precedingNodes,
        );
        if (!sibling) {
          return false;
        } else {
          i -= precedingNodes.length;
        }
      }
    }
  }
  return true;
}

/**
 * Even though the first ancestor matches the selector, the ancestor should match all preceding nodes.
 * For example, consider a tree like `body > div > div > div > button`.
 * The selector `body > div button` should match the button, but it won't if we simply grab the first
 * div that is an ancestor of the button. Instead, we have to keep walking up the tree, trying all divs, until
 * we find one that matches the *previous selectors*, i.e. until we match the div that is the immediate
 * child of the body.
 * Note that this can get quite expensive, as it is an O(n^2) algorithm, but it is correct. Also, this algorithm
 * only needs to be implemented for the space (`' '`) combinator - the `'>'` combinator only needs to
 * look at the immediate parent, so it doesn't need to iterate through all possible matching ancestors.
 */
function evaluateAncestorTree(
  element: HTMLElement,
  lastNonCombinatorNodes: any[],
  nodesBeforeLastNonCombinatorNodes: any[],
) {
  let ancestor = getFirstMatchingAncestor(element, lastNonCombinatorNodes);
  if (!ancestor) {
    return false;
  }
  // Even though first ancestor matches the selector, ancestor should match all preceding nodes
  while (ancestor) {
    // If this ancestor is compatible with the preceding nodes, then it is a match
    // If not, walk up the ancestor tree until a match is found
    if (
      matchesSelector(ancestor, { nodes: nodesBeforeLastNonCombinatorNodes })
    ) {
      return true;
    }
    ancestor = getFirstMatchingAncestor(ancestor, lastNonCombinatorNodes);
  }
  // While loop has exhausted all the possible ancestors and not found a match
  return false;
}

function getMatchingElements(
  elementIterator: ElementIterator,
  ast: postcssSelectorParser.Root,
) {
  const results: any[] = [];
  let element;
  while ((element = elementIterator.next())) {
    for (const node of ast.nodes) {
      // comma-separated selectors, e.g. .foo, .bar
      if (matchesSelector(element, node)) {
        results.push(element);
      }
    }
  }
  return results;
}

// For convenience, attach the source to all pseudo selectors.
// We need this later, and it's easier than passing the selector into every function.
function attachSourceIfNecessary(
  { nodes }: { nodes: any[] },
  selector: string,
) {
  for (const node of nodes) {
    if (node.type === 'pseudo' || node.type === 'attribute') {
      const splitSelector = selector.split('\n');
      const { start, end } = node.source;
      let sourceCode = '';
      for (let i = start.line - 1; i < end.line; i++) {
        const line = splitSelector[i];
        const stringStart = i === start.line - 1 ? start.column : 0;
        const stringEnd = i === end.line - 1 ? end.column : line.length;
        sourceCode += line.substring(stringStart, stringEnd);
      }
      node.sourceCode = (node.type === 'pseudo' ? ':' : '[') + sourceCode;
    }
    if (node.nodes) {
      attachSourceIfNecessary(node, selector);
    }
  }
}

function parse(selector: string) {
  const ast = postcssSelectorParser().astSync(selector);
  attachSourceIfNecessary(ast, selector);
  return ast;
}

function query(selector: string, context: Context) {
  const ast = parse(selector);
  const elementIterator = new ElementIterator(context);
  return getMatchingElements(elementIterator, ast);
}

export function querySelectorAll(
  selector: string,
  context: Context = document,
): HTMLElement[] {
  const elements = query(selector, context);

  // Dedupe the elements
  // Not sure why query returns duplicates, probably
  // from the shadow dom penetration logic
  const elementsSet = new Set(elements);
  return Array.from(elementsSet);
}
