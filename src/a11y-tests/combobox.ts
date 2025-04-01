import { expect, userEvent } from '@storybook/test';
import {
  findByShadowRole,
  queryAllByShadowRole,
} from 'shadow-dom-testing-library';

import { Step } from './types';
import { focusable, pause, querySelectorAll, userEventTab } from '../utils';

async function resetCombobox(combobox: HTMLElement) {
  // Clear the input
  await userEvent.clear(combobox);
  // Remove focus
  combobox.blur();
}

// https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
// These tests are for a combobox that uses a listbox for the popup.
// TODO: implement tests for tree, grid, and dialog
export const a11yCombobox = async ({
  step,
  canvasElement,
}: {
  canvasElement: HTMLElement;
  step: Step;
}) => {
  await pause(200);

  const combobox = await findByShadowRole(canvasElement, 'combobox');

  await step(
    'The element that serves as an input and displays the combobox value has role combobox.',
    async () => {
      await expect(combobox).toBeInTheDocument();
    },
  );

  await step(
    'The combobox element has aria-controls set to a value that refers to the element that serves as the popup.',
    async () => {
      await expect(combobox).toHaveAttribute('aria-controls');
    },
  );

  await step(
    'If the combobox has a visible label and the combobox element is an HTML element that can be labelled using the HTML label element (e.g., the input element), it is labeled using the label element. Otherwise, if it has a visible label, the combobox element has aria-labelledby set to a value that refers to the labelling element. Otherwise, the combobox element has a label provided by aria-label.',
    async () => {
      // Essentially checking whether it has an accessible name
      await expect(combobox).toHaveAccessibleName();
    },
  );

  await step(
    'The combobox element has aria-autocomplete set to a value that corresponds to its autocomplete behavior',
    async () => {
      await expect(combobox).toHaveAttribute('aria-autocomplete', 'list'); // TODO: other values
    },
  );

  await step(
    'When the combobox popup is not visible, the element with role combobox has aria-expanded set to false.',
    async () => {
      await expect(combobox).toHaveAttribute('aria-expanded', 'false');
    },
  );

  const popup = await findByShadowRole(canvasElement, 'listbox', {
    hidden: true,
  });

  await step(
    'The popup is an element that has role listbox, tree, grid, or dialog.',
    async () => {
      await expect(popup).toBeInTheDocument();
    },
  );

  await step(
    'When the popup element is visible, aria-expanded is set to true.',
    async () => {
      await userEvent.click(combobox);
      await userEvent.type(combobox, 'a');
      await pause();
      const expandedPopup = await findByShadowRole(canvasElement, 'listbox', {
        hidden: false,
      });
      await expect(expandedPopup).toBeInTheDocument();
      await expect(combobox).toHaveAttribute('aria-expanded', 'true');
    },
  );

  await step(
    'When a combobox receives focus, DOM focus is placed on the combobox element.',
    async () => {
      combobox.focus();
      await expect(combobox).toHaveFocus();
    },
  );

  await step(
    'When a descendant of a listbox, grid, or tree popup is focused, DOM focus remains on the combobox and the combobox has aria-activedescendant set to a value that refers to the focused element within the popup.',
    async () => {
      await userEvent.type(combobox, '{arrowdown}');
      await expect(combobox).toHaveFocus();
      const options = queryAllByShadowRole(canvasElement, 'option');
      await expect(combobox).toHaveAttribute(
        'aria-activedescendant',
        options[0].id,
      );
    },
  );

  await step(
    'For a combobox that controls a listbox, grid, or tree popup, when a suggested value is visually indicated as the currently selected value, the option, gridcell, row, or treeitem containing that value has aria-selected set to true.',
    async () => {
      // TODO: implement for grid and tree popups too
      const options = queryAllByShadowRole(canvasElement, 'option');
      await userEvent.type(combobox, '{enter}');
      await pause(200);
      await expect(options[0]).toHaveAttribute('aria-selected', 'true');
    },
  );

  await resetCombobox(combobox);
  await expect(combobox).toHaveValue('');
  await expect(combobox).toHaveAttribute('aria-expanded', 'false');
  await pause(200);
  const allOptions = queryAllByShadowRole(canvasElement, 'option', {
    hidden: true,
  });
  await expect(allOptions[0]).toHaveAttribute('aria-selected', 'false');

  // TODO: implement keyboard interaction tests for other popup types
  await step('Keyboard interactions', async () => {
    const focusableElements = querySelectorAll(focusable, document.body).filter(
      (element: HTMLElement) => element.nodeName !== 'IFRAME',
    );

    await step('Tab: The combobox is in the page Tab sequence.', async () => {
      await expect(focusableElements).toContain(combobox);
    });

    await step(
      'The popup indicator icon or button (if present), the popup, and the popup descendants are excluded from the page Tab sequence.',
      async () => {
        // TODO: add popup indicator/button
        await expect(focusableElements).not.toContain(popup);
        await expect(focusableElements).not.toContain(allOptions[0]);
      },
    );

    // When focus is in the combobox:
    await userEventTab();
    await expect(combobox).toHaveFocus();
    await userEvent.type(combobox, 'a');
    const filteredOptions = queryAllByShadowRole(canvasElement, 'option');

    await step(
      'Down Arrow: If the popup is available, moves focus into the popup',
      // Note: DOM Focus is maintained on the combobox and the assistive technology focus is moved within the listbox using aria-activedescendant
      async () => {
        await userEvent.type(combobox, '{arrowdown}');
        await expect(combobox).toHaveFocus();
        await expect(combobox).toHaveAttribute(
          'aria-activedescendant',
          filteredOptions[0].id,
        );

        // Listbox, Down Arrow: Moves focus to and selects the next option. If focus is on the last option, either returns focus to the combobox or does nothing.
        await userEvent.type(combobox, '{arrowdown}');
        await expect(combobox).toHaveAttribute(
          'aria-activedescendant',
          filteredOptions[1].id,
        );
        combobox.setAttribute(
          'aria-activedescendant',
          filteredOptions[filteredOptions.length - 1].id,
        );
        await userEvent.type(combobox, '{arrowdown}');
        await expect(combobox).toHaveAttribute('aria-activedescendant', '');
      },
    );

    await step(
      'Up Arrow (Optional): If the popup is available, places focus on the last focusable element in the popup.',
      async () => {
        await userEvent.type(combobox, '{arrowup}');
        await expect(combobox).toHaveFocus();
        await expect(combobox).toHaveAttribute(
          'aria-activedescendant',
          filteredOptions[filteredOptions.length - 1].id,
        );

        // Listbox, Up Arrow: Moves focus to and selects the previous option. If focus is on the first option, either returns focus to the combobox or does nothing.
        await userEvent.type(combobox, '{arrowup}');
        await expect(combobox).toHaveAttribute(
          'aria-activedescendant',
          filteredOptions[filteredOptions.length - 2].id,
        );
        combobox.setAttribute('aria-activedescendant', filteredOptions[0].id);
        await userEvent.type(combobox, '{arrowup}');
        await expect(combobox).toHaveAttribute('aria-activedescendant', '');
      },
    );

    await step(
      'Escape: Dismisses the popup if it is visible. Optionally, if the popup is hidden before Escape is pressed, clears the combobox.',
      async () => {
        await userEvent.keyboard('{escape}');
        await expect(combobox).toHaveAttribute('aria-expanded', 'false');
        await expect(combobox).toHaveValue('a');
        // Listbox, Escape: Closes the popup and returns focus to the combobox. Optionally, if the combobox is editable, clears the contents of the combobox.
        await expect(combobox).toHaveAttribute('aria-activeDescendant', '');
      },
    );

    await step(
      'Enter: If the combobox is editable and an autocomplete suggestion is selected in the popup, accepts the suggestion either by placing the input cursor at the end of the accepted value in the combobox or by performing a default action on the value.',
      async () => {
        // TODO: implement other possible 'accept' actions
        await resetCombobox(combobox);
        await userEvent.type(combobox, 'a');
        await userEvent.keyboard('{arrowdown}');
        await userEvent.keyboard('{enter}');
        await expect(combobox).toHaveValue(filteredOptions[0].textContent);

        // Listbox, Enter: Accepts the focused option in the listbox by closing the popup, placing the accepted value in the combobox, and if the combobox is editable, placing the input cursor at the end of the value.
        await expect(combobox).toHaveAttribute('aria-expanded', 'false');
      },
    );

    resetCombobox(combobox);
  });
};
