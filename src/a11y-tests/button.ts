import { expect, userEvent } from '@storybook/test';
import {
  findAllByShadowRole,
  deepQuerySelector,
} from 'shadow-dom-testing-library';

import { Step } from './types';

// https://www.w3.org/WAI/ARIA/apG/patterns/button/
export const a11yButton = async ({
  step,
  canvasElement,
  isDisabled,
  isToggle,
}: {
  step: Step;
  canvasElement: HTMLElement;
  isDisabled?: boolean;
  isToggle?: boolean;
}) => {
  const buttons = await findAllByShadowRole(canvasElement, 'button');

  // Aria roles, states and properties
  await step('The button has role of button', async () => {
    await expect(buttons.length).toBeGreaterThan(0);
  });

  await step('The button has an accessible label', async () => {
    for (const button of buttons) {
      await expect(button).toHaveAccessibleName();
    }
  });

  await step(
    `If a description of the button's function is present, the button element has aria-describedby set to the ID of the element containing the description`,
    async () => {
      for (const button of buttons) {
        const descriptionId = button.getAttribute('aria-describedby');
        const descriptionElement = deepQuerySelector(
          document,
          `#${descriptionId}`,
        );

        if (descriptionId) {
          await expect(descriptionElement).toBeInTheDocument();
        }
      }
    },
  );

  if (isDisabled) {
    await step(
      'When the action associated with a button is unavailable, the button has aria-disabled set to true',
      async () => {
        for (const button of buttons) {
          await expect(button).toBeDisabled();
        }
      },
    );
  }

  if (isToggle) {
    await step(
      `If the button is a toggle button, it has an aria-pressed state. When the button is toggled on, the value of this state is true, and when toggled off, the state is false.`,
      async () => {
        for (const button of buttons) {
          const pressedAttr = button.getAttribute('aria-pressed');
          await expect(pressedAttr).toBeTruthy();
        }
      },
    );
  }

  // Keyboard interactions
  await step('Keyboard interaction', async () => {
    const toggleActivated = (button: HTMLElement) => {
      button.dataset.activated =
        button.dataset.activated === 'true' ? 'false' : 'true';
    };

    if (!isDisabled) {
      await step('Space: activates the button', async () => {
        for (const button of buttons) {
          button.dataset.activated = 'false';

          const toggleActivatedListener = () => toggleActivated(button);
          button.addEventListener('click', toggleActivatedListener);

          await userEvent.type(button, '{space}');
          await expect(button.dataset.activated).toBe('true');

          await userEvent.type(button, '{space}');
          await expect(button.dataset.activated).toBe('false');

          button.removeEventListener('click', toggleActivatedListener);
        }
      });

      await step('Enter: activates the button', async () => {
        for (const button of buttons) {
          button.dataset.activated = 'false';

          const toggleActivatedListener = () => toggleActivated(button);
          button.addEventListener('click', toggleActivatedListener);

          button.focus();

          await userEvent.keyboard('{enter}');
          await expect(button.dataset.activated).toBe('true');

          await userEvent.keyboard('{enter}');
          await expect(button.dataset.activated).toBe('false');

          button.removeEventListener('click', toggleActivatedListener);
        }
      });
    }

    // TODO: extra keyboard interaction tests around setting focus following button activation:
    // If activating the button opens a dialog, the focus moves inside the dialog. (see dialog pattern)
    // If activating the button closes a dialog, focus typically returns to the button that opened the dialog unless the function performed in the dialog context logically leads to a different element. For example, activating a cancel button in a dialog returns focus to the button that opened the dialog. However, if the dialog were confirming the action of deleting the page from which it was opened, the focus would logically move to a new context.
    // If activating the button does not dismiss the current context, then focus typically remains on the button after activation, e.g., an Apply or Recalculate button.
    // If the button action indicates a context change, such as move to next step in a wizard or add another search criteria, then it is often appropriate to move focus to the starting point for that action.
    // If the button is activated with a shortcut key, the focus usually remains in the context from which the shortcut key was activated. For example, if Alt + U were assigned to an "Up" button that moves the currently focused item in a list one position higher in the list, pressing Alt + U when the focus is in the list would not move the focus from the list.
  });
};
