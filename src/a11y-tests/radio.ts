import { expect, userEvent } from '@storybook/test';
import {
  findAllByShadowRole,
  queryByShadowRole,
} from 'shadow-dom-testing-library';

import { Step } from './types';

// https://www.w3.org/WAI/ARIA/apg/patterns/radio/
export const a11yRadio = async ({
  step,
  canvasElement,
}: {
  canvasElement: HTMLElement;
  step: Step;
}) => {
  // Radio group can be a fieldset or role radiogroup
  const radios = await findAllByShadowRole(canvasElement, 'radio');
  const radioGroup = queryByShadowRole(canvasElement, 'radiogroup');
  const fieldset = queryByShadowRole(canvasElement, 'group');

  // Aria roles, states and properties

  await step(
    'The radio buttons are contained in or owned by an element with role radiogroup.',
    async () => {
      await expect(radioGroup || fieldset).toBeInTheDocument();
    },
  );

  // Each radio button element has role radio.
  await step('Each radio button element has role radio.', async () => {
    await expect(radios.length).toBeGreaterThan(0);
  });

  await step(
    'If a radio button is checked, the radio element has aria-checked set to true. If it is not checked, it has aria-checked set to false.',
    async () => {
      // Select the second radio
      const secondRadio = radios[1];
      await userEvent.click(secondRadio);

      // Check that only one radio is checked
      const checkedRadios = radios.filter(
        (radio) =>
          radio.getAttribute('aria-checked') === 'true' ||
          (radio as HTMLInputElement).checked,
      );

      // Check the other radios are unchecked
      const uncheckedRadios = radios.filter(
        (radio) =>
          radio.getAttribute('aria-checked') === 'false' ||
          (radio.tagName === 'INPUT' && !(radio as HTMLInputElement).checked),
      );

      await expect(checkedRadios.length).toBe(1);
      await expect(uncheckedRadios.length).toBe(radios.length - 1);
    },
  );

  await step(
    'Each radio element is labelled by its content, has a visible label referenced by aria-labelledby, or has a label specified with aria-label.',
    async () => {
      await Promise.all(
        radios.map(async (radio) => {
          const hasLabel =
            radio.getAttribute('aria-label') ||
            radio.textContent ||
            radio.getAttribute('aria-labelledby') ||
            ((radio as HTMLInputElement).labels?.length || 0) > 0;

          await expect(hasLabel).toBeTruthy();
        }),
      );
    },
  );

  await step(
    'The radiogroup element has a visible label referenced by aria-labelledby or has a label specified with aria-label.',
    async () => {
      if (radioGroup) {
        const hasLabel =
          radioGroup.getAttribute('aria-label') ||
          (radioGroup.getAttribute('aria-labelledby') &&
            document.getElementById(
              radioGroup.getAttribute('aria-labelledby') || '',
            )?.textContent);

        await expect(hasLabel).toBeTruthy();
      } else {
        const hasLabel = fieldset?.querySelector('legend')?.textContent;

        await expect(hasLabel).toBeTruthy();
      }
    },
  );

  // TODO If elements providing additional information about either the radio group or each radio button are present, those elements are referenced by the radiogroup element or radio elements with the aria-describedby property.

  // Keyboard interaction
  await step('Keyboard interaction', async () => {
    // Tab and Shift + Tab: Move focus into and out of the radio group. When focus moves into a radio group:
    // Set focus on the body
    (document.activeElement as HTMLElement).blur();
    await userEvent.tab();

    await step(
      ' If a radio button is checked, focus is set on the checked button.',
      async () => {
        const checked = radios.find(
          (radio) =>
            radio.getAttribute('aria-checked') === 'true' ||
            (radio as HTMLInputElement).checked,
        );

        await expect(checked).toHaveFocus();
      },
    );

    // Uncheck all the radios
    radios.forEach((radio) => {
      if (radio.getAttribute('aria-checked') === 'true') {
        radio.setAttribute('aria-checked', 'false');
      }

      if ((radio as HTMLInputElement).checked) {
        (radio as HTMLInputElement).checked = false;
      }
    });

    await step(
      'If none of the radio buttons are checked, focus is set on the first radio button in the group.',
      async () => {
        (document.activeElement as HTMLElement).blur();
        await userEvent.tab();
        const firstRadio = radios[0];
        await expect(firstRadio).toHaveFocus();
      },
    );

    await step(
      'Space: checks the focused radio button if it is not already checked.',
      async () => {
        const firstRadio = radios[0];
        await userEvent.type(firstRadio, '{space}');
        const isChecked =
          firstRadio.getAttribute('aria-checked') === 'true' ||
          (firstRadio as HTMLInputElement).checked;
        await expect(isChecked).toBeTruthy();
      },
    );

    await step('Arrow keys select previous and next', async () => {
      const firstRadio = radios[0];
      const secondRadio = radios[1];
      const lastRadio = radios[radios.length - 1];
      let keys;

      const isChecked = (radio: HTMLElement) => {
        return (
          radio.getAttribute('aria-checked') === 'true' ||
          (radio as HTMLInputElement).checked
        );
      };

      // Right Arrow and Down Arrow: move focus to the next radio button in the group,
      // uncheck the previously focused button, and check the newly focused button.
      // If focus is on the last button, focus moves to the first button.

      // Hey Developer!
      // There's a bug in @testing-library/user-event that makes the keypresses on
      // radio buttons backwards. This should be fixed in 14.6.1, but 14.5.2 is bundled
      // with ../utils/test-utils in index.mjs at the time I'm writing this so I can't fix it.
      // If your tests just fell over they probably fixed it and these arrows need flipping.
      // https://github.com/testing-library/user-event/pull/1049
      keys = ['{arrowleft}', '{arrowdown}'];
      for (const arrow of keys) {
        await userEvent.click(firstRadio);
        await userEvent.keyboard(arrow);
        await expect(secondRadio).toHaveFocus();
        await expect(isChecked(secondRadio)).toBeTruthy();

        await userEvent.click(lastRadio);
        await userEvent.type(lastRadio, arrow);
        await expect(firstRadio).toHaveFocus();
        await expect(isChecked(firstRadio)).toBeTruthy();
      }

      // Left Arrow and Up Arrow: move focus to the previous radio button in the group,
      // uncheck the previously focused button, and check the newly focused button.
      // If focus is on the first button, focus moves to the last button.
      keys = ['{arrowright}', '{arrowup}'];
      for (const arrow of keys) {
        await userEvent.click(firstRadio);
        await userEvent.keyboard(arrow);
        await expect(lastRadio).toHaveFocus();
        await expect(isChecked(lastRadio)).toBeTruthy();

        await userEvent.click(secondRadio);
        await userEvent.keyboard(arrow);
        await expect(firstRadio).toHaveFocus();
        await expect(isChecked(firstRadio)).toBeTruthy();
      }
    });
  });
};
