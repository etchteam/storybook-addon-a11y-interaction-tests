// document.activeElement does not pierce shadow DOM so we have to roll our own
// via https://www.abeautifulsite.net/posts/finding-the-active-element-in-a-shadow-root/
export function getActiveElement(
  root: Document | ShadowRoot = document,
): Element | null {
  const activeEl = root.activeElement;

  if (!activeEl) {
    return null;
  }

  if (activeEl.shadowRoot) {
    return getActiveElement(activeEl.shadowRoot);
  } else {
    return activeEl;
  }
}
