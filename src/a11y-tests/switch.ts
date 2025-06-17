import { findByShadowRole } from 'shadow-dom-testing-library';
import { expect, userEvent } from 'storybook';

import { Step } from './types';

// https://www.w3.org/WAI/ARIA/apg/patterns/switch/
export const a11ySwitch = async ({
  step,
  canvasElement,
}: {
  canvasElement: HTMLElement;
  step: Step;
}) => {
  const switchElement = await findByShadowRole(canvasElement, 'switch');

  // Aria roles, states and properties

  await step('The switch has role switch', async () => {
    await expect(switchElement).toBeInTheDocument();
  });

  const checkboxSwitch = switchElement as HTMLInputElement;

  // The switch has an accessible label provided by one of the following:
  // - Visible text content contained within the element with role switch.
  // - A visible label referenced by the value of aria-labelledby set on the element with role switch.
  // - aria-label set on the element with role switch.
  await step('The switch has an accessible label', async () => {
    const hasLabel =
      switchElement.getAttribute('aria-label') ||
      switchElement.textContent ||
      switchElement.getAttribute('aria-labelledby');

    await expect(hasLabel).toBeTruthy();
  });

  // If the switch element is an HTML input[type="checkbox"],
  // it uses the HTML checked attribute to show that it is on or off.
  if (switchElement.getAttribute('type') === 'checkbox') {
    await step('The switch sets the checked attribute', async () => {
      if (!checkboxSwitch.checked) {
        await userEvent.click(checkboxSwitch);
      }

      await expect(checkboxSwitch.checked).toBe(true);
      await userEvent.click(checkboxSwitch);
      await expect(checkboxSwitch.checked).toBe(false);
    });
  } else {
    await step('The switch uses the aria-checked property', async () => {
      // Otherwise we use the aria-checked property to show that it is on or off.
      if (switchElement.getAttribute('aria-checked') !== 'true') {
        await userEvent.click(switchElement);
      }

      // When on, the switch element has state aria-checked set to true.
      // When off, the switch element has state aria-checked set to false.
      await expect(switchElement.getAttribute('aria-checked')).toBe('true');
      await userEvent.click(switchElement);
      await expect(switchElement.getAttribute('aria-checked')).toBe('false');
    });
  }

  // Keyboard interaction
  // Space: When focus is on the switch, changes the state of the switch.
  // Enter (Optional): When focus is on the switch, changes the state of the switch.
  await step('The switch can be toggled with the space key', async () => {
    // First make sure the switch is off
    if (
      checkboxSwitch.checked ||
      switchElement.getAttribute('aria-checked') === 'true'
    ) {
      await userEvent.click(switchElement);
    }

    await expect(
      !checkboxSwitch.checked &&
        switchElement.getAttribute('aria-checked') !== 'true',
    ).toBeTruthy();

    await userEvent.type(switchElement, '{space}');

    await expect(
      checkboxSwitch.checked ||
        switchElement.getAttribute('aria-checked') === 'true',
    ).toBeTruthy();
  });

  // TODO: Testing a group of switch elements:
  // If a set of switches is presented as a logical group with a visible label, either:
  // The switches are included in an element with role group that has the property aria-labelledby set to the ID of the element containing the group label.
  // The set is contained in an HTML fieldset and the label for the set is contained in an HTML legend element.
  // If the presentation includes additional descriptive static text relevant to a switch or switch group, the switch or switch group has the property aria-describedby set to the ID of the element containing the description.
};
