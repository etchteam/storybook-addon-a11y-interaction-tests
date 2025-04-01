import { focusable } from './focusable';
import { getActiveElement } from './get-active-element';
import { querySelectorAll } from './query-selector-all';

const getVisibleFocusableElements = async () => {
  // Gets all the focusable elements
  const focusableElements = (await querySelectorAll(
    focusable,
    document.body,
  ).filter(
    (element: HTMLElement) => element.nodeName !== 'IFRAME',
  )) as HTMLElement[];

  // Filter by visible ones, could optionally allow seeing these
  // Still works for visually hidden ones
  const visibleFocusableElements = focusableElements.filter(
    (element: HTMLElement) => element.checkVisibility(),
  );

  return visibleFocusableElements;
};

const getCurrentIndex = (elements: HTMLElement[]) => {
  const currentlyFocusedElement = getActiveElement();
  return elements.indexOf(currentlyFocusedElement as HTMLElement);
};

// testing library userEvent.tab() does not support shadow DOM tabbing so we have to roll out own tab util
export const userEventTab = async () => {
  const visibleFocusableElements = await getVisibleFocusableElements();

  const index = getCurrentIndex(visibleFocusableElements);

  const nextIndex = index + 1;
  const nextElement = visibleFocusableElements[nextIndex];

  if (nextElement) {
    nextElement.focus();
  }
};

export const userEventShiftTab = async () => {
  const visibleFocusableElements = await getVisibleFocusableElements();

  const index = getCurrentIndex(visibleFocusableElements);

  const previousIndex = index - 1;
  const previousElement = visibleFocusableElements[previousIndex];

  if (previousElement) {
    previousElement.focus();
  }
};
