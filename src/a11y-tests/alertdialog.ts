import { findByShadowRole } from 'shadow-dom-testing-library';
import { expect } from 'storybook';

import { Step } from './types';

// https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
export const a11yAlertDialog = async ({
  step,
  canvasElement,
}: {
  canvasElement: HTMLElement;
  step: Step;
}) => {
  const alertDialogElement = await findByShadowRole(
    canvasElement,
    'alertdialog',
  );

  // Aria roles, states and properties

  await step('The alert dialog has role alertdialog', async () => {
    await expect(alertDialogElement).toBeInTheDocument();
  });

  await step(
    'The element with role alertdialog has either: A value for aria-labelledby or A value for aria-label if the dialog does not have a visible label.',
    async () => {
      // A value for aria-labelledby that refers to the element containing the title of the dialog if the dialog has a visible label.
      // A value for aria-label if the dialog does not have a visible label.
      const ariaLabel = alertDialogElement.getAttribute('aria-label');
      const ariaLabelledBy = alertDialogElement.getAttribute('aria-labelledby');
      const hasLabel =
        ariaLabel ||
        (ariaLabelledBy && document.getElementById(ariaLabelledBy));

      await expect(hasLabel).toBeTruthy();
    },
  );

  await step(
    'The element with role alertdialog has a value set for aria-describedby that refers to the element containing the alert message.',
    async () => {
      const ariaDescribedBy =
        alertDialogElement.getAttribute('aria-describedby');
      const hasDescription =
        ariaDescribedBy && document.getElementById(ariaDescribedBy);

      await expect(hasDescription).toBeTruthy();
    },
  );

  // TODO: incorporate modal/dialog keyboard tests here once they have been written: https://linear.app/etch/issue/ADS-562/dialog-modal
};
