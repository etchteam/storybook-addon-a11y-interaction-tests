import { expect, userEvent } from '@storybook/test';
import {
  findByShadowRole,
  findAllByShadowRole,
  deepQuerySelector,
} from 'shadow-dom-testing-library';

import { Step } from './types';
import {
  getActiveElement,
  userEventTab,
  focusable,
  querySelectorAll,
} from '../utils';

// https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
export const a11yTabs = async ({
  step,
  canvasElement,
  inverted = false,
}: {
  canvasElement: HTMLElement;
  step: Step;
  inverted?: boolean; // Set to true if the tablist sits below the tabpanel rather than above it
}) => {
  const tablistElement = await findByShadowRole(canvasElement, 'tablist');
  const tabElements = await findAllByShadowRole(canvasElement, 'tab');
  const notDisabledTabElements = tabElements.filter(
    (tab) => !(tab as any).disabled,
  );
  const tabsInTabList = await findAllByShadowRole(tablistElement, 'tab');
  const tabPanelElements = await findAllByShadowRole(
    canvasElement,
    'tabpanel',
    { hidden: true },
  );

  // Aria roles, states and properties

  await step(
    'The element that serves as the container for the set of tabs has role tablist.',
    async () => {
      await expect(tablistElement).toBeInTheDocument();
    },
  );
  await step(
    'Each element that serves as a tab has role tab and is contained within the element with role tablist.',
    async () => {
      await expect(tabElements).toHaveLength(tabsInTabList.length);
    },
  );

  await step(
    'Each element that contains the content panel for a tab has role tabpanel.',
    async () => {
      await expect(tabPanelElements).toHaveLength(tabsInTabList.length);
    },
  );

  await step(
    'If the tab list has a visible label, the element with role tablist has aria-labelledby set to a value that refers to the labelling element. Otherwise, the tablist element has a label provided by aria-label.',
    async () => {
      const ariaLabel = tablistElement.getAttribute('aria-label');
      const ariaLabelledBy = tablistElement.getAttribute('aria-labelledby');

      await expect(ariaLabel || ariaLabelledBy).toBeTruthy();
    },
  );

  await step(
    'Each element with role tab has the property aria-controls referring to its associated tabpanel element.',
    async () => {
      for (const tab of tabElements) {
        const tabPanelId = tab.getAttribute('aria-controls');
        const tabPanel = tabPanelElements.find(
          (tabPanel) => tabPanel.id === tabPanelId,
        );

        await expect(tabPanel).toBeTruthy();
      }
    },
  );

  await step(
    'The active tab element has the state aria-selected set to true and all other tab elements have it set to false.',
    async () => {
      await expect(
        tabElements.filter((tab) => tab.hasAttribute('aria-selected')),
      ).toHaveLength(1);
    },
  );

  await step(
    'Each element with role tabpanel has the property aria-labelledby referring to its associated tab element.',
    async () => {
      for (const tabPanel of tabPanelElements) {
        const tabId = tabPanel.getAttribute('aria-labelledby');
        const tab = tabElements.find((tab) => {
          return tab.id === tabId;
        });

        await expect(tab).toBeTruthy();
      }
    },
  );

  // TODO: We don't support these currently
  // If a tab element has a popup menu, it has the property aria-haspopup set to either menu or true.
  // If the tablist element is vertically oriented, it has the property aria-orientation set to vertical. The default value of aria-orientation for a tablist element is horizontal.

  // Keyboard navigation

  const focusTablist = async () => {
    (document.activeElement as HTMLElement).blur();

    if (inverted) {
      const previousSibling =
        tablistElement.previousElementSibling as HTMLElement;

      const focusableElements = querySelectorAll(focusable, previousSibling) as HTMLElement[];

      const focusableBeforeTablist =
        focusableElements.length > 0
          ? focusableElements[focusableElements.length - 1]
          : previousSibling?.closest(focusable);

      (focusableBeforeTablist as HTMLElement)?.focus();
    }

    await userEventTab();
  };

  // Tab:
  await step(
    'When focus moves into the tab list, places focus on the active tab element.',
    async () => {
      await focusTablist();

      await expect(
        (getActiveElement() as HTMLElement).hasAttribute('aria-selected'),
      ).toBeTruthy();
    },
  );

  await step(
    `When the tab list contains the focus, moves focus to the next element in the page tab
    sequence outside the tablist, which is the tabpanel unless the first element containing
    meaningful content inside the tabpanel is focusable.`,
    async () => {
      await focusTablist();

      // Check that the active tab in the tablist has focus
      await expect(deepQuerySelector(tablistElement, '[aria-selected]')).toBe(
        getActiveElement(),
      );

      const activeTabPanel = tabPanelElements.find(
        (tabPanel) =>
          tabPanel.getAttribute('aria-labelledby') === (getActiveElement() as HTMLElement).id,
      );

      // Tab again and check that the focus is not in the tablist
      await userEventTab();

      if (
        !inverted &&
        Boolean(querySelectorAll(focusable, activeTabPanel).length)
      ) {
        await expect(
          activeTabPanel?.contains(document.activeElement),
        ).toBeTruthy();
      } else {
        await expect(
          tablistElement.contains(document.activeElement),
        ).toBeFalsy();
      }
    },
  );

  // // When focus is on a tab element in a horizontal tab list:

  await step(
    'Left Arrow: moves focus to the previous tab. If focus is on the first tab, moves focus to the last tab. Optionally, activates the newly focused tab.',
    async () => {
      // Focus on tab in tablist
      await focusTablist();

      // Check that the active tab in the tablist has focus
      const activeElement = getActiveElement();
      const activeTab = tabElements.find((tab) =>
        tab.hasAttribute('aria-selected'),
      ) as HTMLElement;
      await expect(activeElement).toBe(activeTab);

      // Get the previous tab (or the last tab if the active tab is the first one)
      const previousTab =
        notDisabledTabElements.indexOf(activeTab) === 0
          ? notDisabledTabElements[notDisabledTabElements.length - 1]
          : notDisabledTabElements[
              notDisabledTabElements.indexOf(activeTab) - 1
            ];

      await userEvent.keyboard('{arrowleft}');

      const newActiveElement = getActiveElement();

      if (previousTab) {
        await expect(newActiveElement).toEqual(previousTab);
      }
    },
  );

  await step(
    'Right Arrow: Moves focus to the next tab. If focus is on the last tab element, moves focus to the first tab. Optionally, activates the newly focused tab.',
    async () => {
      await focusTablist();

      // Check that the active tab in the tablist has focus
      const activeElement = getActiveElement();
      const activeTab = tabElements.find((tab) =>
        tab.hasAttribute('aria-selected'),
      ) as HTMLElement;
      await expect(activeElement).toBe(activeTab);

      // Get the next tab (or the first tab if the active tab is the last one)
      const nextTab =
        notDisabledTabElements.indexOf(activeTab) ===
        notDisabledTabElements.length - 1
          ? notDisabledTabElements[0]
          : notDisabledTabElements[
              notDisabledTabElements.indexOf(activeTab) + 1
            ];

      await userEvent.keyboard('{arrowright}');

      const newActiveElement = getActiveElement();

      if (nextTab) {
        await expect(newActiveElement).toEqual(nextTab);
      }
    },
  );

  // When focus is on a tab in a tablist with either horizontal or vertical orientation:

  // TODO: we auto select on focus
  // Space or Enter: Activates the tab if it was not activated automatically on focus.

  // TODO: optional
  // Home (Optional): Moves focus to the first tab. Optionally, activates the newly focused tab (See note below).
  // End (Optional): Moves focus to the last tab. Optionally, activates the newly focused tab (See note below).

  // TODO: We don't support these currently
  // Shift + F10: If the tab has an associated popup menu, opens the menu.
  // Delete (Optional): If deletion is allowed, deletes (closes) the current
  // tab element and its associated tab panel, sets focus on the tab following
  // the tab that was closed, and optionally activates the newly focused tab.
  // If there is not a tab that followed the tab that was deleted, e.g., the
  // deleted tab was the right-most tab in a left-to-right horizontal tab list,
  // sets focus on and optionally activates the tab that preceded the deleted tab.
  // If the application allows all tabs to be deleted, and the user deletes the
  // last remaining tab in the tab list, the application moves focus to another
  // element that provides a logical work flow. As an alternative to Delete, or
  // in addition to supporting Delete, the delete function is available in a
  // context menu.
};
