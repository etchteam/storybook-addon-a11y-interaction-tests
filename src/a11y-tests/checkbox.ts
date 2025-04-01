import { expect, userEvent } from '@storybook/test';
import {
  findAllByShadowRole,
  queryAllByShadowRole,
} from 'shadow-dom-testing-library';

import { Step } from './types';

// https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
export const a11yCheckbox = async ({
  step,
  canvasElement,
}: {
  step: Step;
  canvasElement: HTMLElement;
}) => {
  const checkboxes = await findAllByShadowRole(canvasElement, 'checkbox');
  const groups = queryAllByShadowRole(canvasElement, 'group');

  // Aria roles, states and properties

  await step('Each checkbox element has role checkbox.', async () => {
    await expect(checkboxes.length).toBeGreaterThan(0);
  });

  await step(
    'If a checkbox is checked, the checkbox element has aria-checked set to true. If it is not checked, it has aria-checked set to false.',
    async () => {
      const checkbox = checkboxes[0];

      // Check that the first checkbox is checked when initiially clicked
      await userEvent.click(checkbox);
      await expect(
        checkbox.getAttribute('aria-checked') === 'true' ||
          (checkbox as HTMLInputElement).checked,
      );

      // Check that this checkbox is unchecked when clicked again
      await userEvent.click(checkbox);
      await expect(
        checkbox.getAttribute('aria-checked') === 'false' ||
          !(checkbox as HTMLInputElement).checked,
      );

      // TODO: not currently testing partially checked (tri-state/mixed state) checkboxes as we're not using them
      // https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/examples/checkbox-mixed/
    },
  );

  await step(
    'Each checkbox element is labelled by its content, has a visible label referenced by aria-labelledby, or has a label specified with aria-label.',
    async () => {
      await Promise.all(
        checkboxes.map(async (checkbox) => {
          const hasLabel =
            checkbox.getAttribute('aria-label') ||
            checkbox.textContent ||
            checkbox.getAttribute('aria-labelledby') ||
            ((checkbox as HTMLInputElement).labels?.length || 0) > 0;

          await expect(hasLabel).toBeTruthy();
        }),
      );
    },
  );

  await step(
    'If a set of checkboxes is presented as a logical group with a visible label, the checkboxes are included in an element with role group.',
    async () => {
      // If there are multiple checkboxes with the same name value, they should be in a group
      const checkboxGroups = checkboxes
        .filter((checkbox) => (checkbox as HTMLInputElement).name)
        .reduce((acc: { [key: string]: HTMLElement[] }, checkbox) => {
          const name = (checkbox as HTMLInputElement).name;
          if (!Object.keys(acc).includes(name)) {
            acc[name] = [];
          }
          acc[name].push(checkbox);
          return acc;
        }, {});

      // Check that there is an ancestor for each checkbox in the group with role 'group', or a fieldset
      Object.values(checkboxGroups)
        .filter((group) => group.length > 1)
        .forEach((group) => {
          group.forEach(async (checkbox) => {
            const checkboxGroup = checkbox.closest('[role="group"]');
            const checkboxFieldset = checkbox.closest('fieldset');
            await expect(checkboxGroup || checkboxFieldset).toBeTruthy();
          });
        });
    },
  );

  await step(
    'The group element has a visible label referenced by aria-labelledby or has a label specified with aria-label.',
    async () => {
      await Promise.all(
        groups?.map(async (group) => {
          const hasLabel =
            group.getAttribute('aria-label') ||
            group.querySelector('legend')?.textContent ||
            (group.getAttribute('aria-labelledby') &&
              document.getElementById(
                group.getAttribute('aria-labelledby') || '',
              )?.textContent);

          await expect(hasLabel).toBeTruthy();
        }),
      );
    },
  );

  // TODO: If the presentation includes additional descriptive static text relevant to a checkbox or checkbox group, the checkbox or checkbox group has the property aria-describedby set to the ID of the element containing the description.

  // Keyboard interaction

  await step(
    'When the checkbox has focus, pressing the Space key changes the state of the checkbox.',
    async () => {
      // Tab to move focus to a checkbox
      (document.activeElement as HTMLElement).blur();
      await userEvent.tab();

      // Space to toggle the state of a checkbox
      await userEvent.keyboard('{Space}');
      const checkbox = document.activeElement as HTMLElement;
      await expect(
        checkbox.getAttribute('aria-checked') === 'true' ||
          (checkbox as HTMLInputElement).checked,
      );
    },
  );
};
