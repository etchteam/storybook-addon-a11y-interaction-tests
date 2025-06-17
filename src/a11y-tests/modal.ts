import { findByShadowRole } from 'shadow-dom-testing-library';
import { expect, userEvent } from 'storybook/test';

import { pause } from '../utils';

import { Step } from './types';

// https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
export const a11yModal = async ({
  step,
  canvasElement,
}: {
  step: Step;
  canvasElement: HTMLElement;
}) => {
  const dialog = await findByShadowRole(canvasElement, 'dialog');

  // Aria roles, states and properties
  await step(
    'The element that serves as the dialog container has a role of dialog.',
    async () => {
      await expect(dialog).toBeInTheDocument();
    },
  );

  await step(
    'All elements required to operate the dialog are descendants of the element that has role dialog.',
    async () => {
      // Check for close button
      const closeButton = await findByShadowRole(dialog, 'button', {
        name: /close|cancel|✕|×/i,
      });
      await expect(closeButton).toBeInTheDocument();
    },
  );

  await step(
    'The dialog container element has aria-modal set to true.',
    async () => {
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
    },
  );

  await step('The dialog has an accessible label', async () => {
    const ariaLabel = dialog.getAttribute('aria-label');
    const ariaLabelledBy = dialog.getAttribute('aria-labelledby');
    const labelElement = (ariaLabelledBy &&
      document.getElementById(ariaLabelledBy)) as HTMLElement;

    await expect(Boolean(ariaLabel || labelElement?.textContent)).toBe(true);
  });

  // Optional: Check for aria-describedby
  await step(
    'If dialog has aria-describedby, it references existing content',
    async () => {
      const describedBy = dialog.getAttribute('aria-describedby');
      if (describedBy) {
        const descriptionElement = document.getElementById(describedBy);
        await expect(descriptionElement).toBeInTheDocument();
      }
    },
  );

  // Keyboard interaction
  await step('Keyboard interaction', async () => {
    // TODO: This is not working as expected.
    // We need to find a way to test the tabbing behavior correctly.
    // Because tabbing is fake, the modal focus trap becomes irrelevant
    // When a dialog opens, focus moves to an element inside the dialog.
    // Tab: Moves focus to next tabbable element inside dialog
    // Shift+Tab: Moves focus to previous tabbable element inside dialog
    // Focus returns to the triggering element when dialog closes

    await step('Escape: Closes the dialog', async () => {
      await userEvent.keyboard('{Escape}');

      await pause(500);

      // Check if dialog is hidden or removed
      await expect(dialog).not.toBeVisible();
    });
  });
};
