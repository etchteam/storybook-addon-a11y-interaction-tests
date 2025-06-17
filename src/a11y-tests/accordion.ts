import { findAllByShadowRole } from 'shadow-dom-testing-library';
import { expect, userEvent } from 'storybook/test';

import {
  getActiveElement,
  userEventTab,
  userEventShiftTab,
  pause,
} from '../utils';

import { a11yDisclosure } from './disclosure';
import { Step } from './types';

const testAccordionKeyboardInteractions = async ({
  key,
  accordions,
  isExclusive,
}: {
  key: '{space}' | '{enter}';
  accordions: HTMLDetailsElement[];
  isExclusive: boolean;
}) => {
  for (const accordion of accordions) {
    const summary = accordion.querySelector('summary') as HTMLElement;

    await userEvent.type(summary, key);
    await pause();
    await expect(accordion.open).toBe(true);

    await userEvent.type(summary, key);
    await pause();
    await expect(accordion.open).toBe(false);

    const otherAccordions = accordions.filter((a) => a !== accordion);

    if (isExclusive && otherAccordions.length > 0) {
      const otherAccordion = otherAccordions[0];
      await userEvent.click(
        otherAccordion.querySelector('summary') as HTMLElement,
      );
      await pause();

      await userEvent.type(summary, key);
      await pause();

      await expect(accordion.open).toBe(true);
      await expect(otherAccordion.open).toBe(false);
    }
  }
};

// https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
// These tests are for an accordion whose items use details and summary elements.
// TODO: implement tests for the other type
// isExclusive option is for when only one panel in a group can be open at a time
export const a11yAccordion = async ({
  step,
  canvasElement,
  isExclusive = true,
}: {
  step: Step;
  canvasElement: HTMLElement;
  isExclusive?: boolean;
}) => {
  // Get all the details elements - these have an implicit role of group
  const accordions = await findAllByShadowRole(canvasElement, 'group');

  // Run disclosure tests on each accordion item as these cover several of the requirements for accordions
  // Don't run their keyboard interactions as these will be covered here
  for (const accordion of accordions) {
    await step('Run disclosure tests on each accordion item', async () => {
      const parent = accordion.parentElement as HTMLElement;
      await a11yDisclosure({
        step,
        canvasElement: parent,
        testKeyboardInteractions: false,
      });
    });
  }

  // TODO: These parts aren't relevant to this implementation of accordions or it's not clear how they could be tested:

  // Each accordion header button is wrapped in an element with role heading that has a value set for aria-level that is appropriate for the information architecture of the page.
  // If the native host language has an element with an implicit heading and aria-level, such as an HTML heading tag, a native host language element may be used.
  // The button element is the only element inside the heading element. That is, if there are other visually persistent elements, they are not included inside the heading element.

  // If the accordion panel associated with an accordion header is visible, and if the accordion does not permit the panel to be collapsed, the header button element has aria-disabled set to true.

  // Optionally, each element that serves as a container for panel content has role region and aria-labelledby with a value that refers to the button that controls display of the panel.
  // Avoid using the region role in circumstances that create landmark region proliferation, e.g., in an accordion that contains more than approximately 6 panels that can be expanded at the same time.
  // Role region is especially helpful to the perception of structure by screen reader users when panels contain heading elements or a nested accordion.

  // Keyboard interactions
  await step('Keyboard interactions', async () => {
    await step(
      'Space: When focus is on the accordion header for a collapsed panel, expands the associated panel. If the implementation allows only one panel to be expanded, and if another panel is expanded, collapses that panel.',
      async () => {
        await testAccordionKeyboardInteractions({
          key: '{space}',
          accordions: accordions as HTMLDetailsElement[],
          isExclusive,
        });
      },
    );

    await step(
      'Enter: When focus is on the accordion header for a collapsed panel, expands the associated panel. If the implementation allows only one panel to be expanded, and if another panel is expanded, collapses that panel.',
      async () => {
        await testAccordionKeyboardInteractions({
          key: '{enter}',
          accordions: accordions as HTMLDetailsElement[],
          isExclusive,
        });
      },
    );

    await step(
      'Tab: Moves focus to the next focusable element; all focusable elements in the accordion are included in the page Tab sequence.',
      async () => {
        (document.activeElement as HTMLElement).blur();
        for (const accordion of accordions) {
          const summary = accordion.querySelector('summary');

          await userEventTab();
          await expect(getActiveElement()).toStrictEqual(summary);
        }
      },
    );
    await step(
      'Shift + Tab: Moves focus to the previous focusable element; all focusable elements in the accordion are included in the page Tab sequence.',
      async () => {
        // Focus last accordion
        const lastSummary = accordions[accordions.length - 1].querySelector(
          'summary',
        ) as HTMLElement;
        lastSummary.focus();

        for (const accordion of [...accordions].reverse()) {
          const summary = accordion.querySelector('summary');

          await userEventShiftTab();
          await expect(getActiveElement()).toStrictEqual(summary);
        }
      },
    );

    // TODO: optional interactions
    // Down Arrow (Optional): If focus is on an accordion header, moves focus to the next accordion header. If focus is on the last accordion header, either does nothing or moves focus to the first accordion header.
    // Up Arrow (Optional): If focus is on an accordion header, moves focus to the previous accordion header. If focus is on the first accordion header, either does nothing or moves focus to the last accordion header.
    // Home (Optional): When focus is on an accordion header, moves focus to the first accordion header.
    // End (Optional): When focus is on an accordion header, moves focus to the last accordion header.
  });
};
