import { expect, userEvent } from '@storybook/test';
import { findAllByShadowRole } from 'shadow-dom-testing-library';

import { Step } from './types';

// https://www.w3.org/WAI/ARIA/apg/patterns/link/
export const a11yLink = async ({
  step,
  canvasElement,
}: {
  step: Step;
  canvasElement: HTMLElement;
}) => {
  const links = await findAllByShadowRole(canvasElement, 'link');

  // Aria roles, states and properties
  await step('The link has role of link', async () => {
    await expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      await expect(link).toHaveRole('link');
    }
  });

  await step('Each link has an accessible label', async () => {
    for (const link of links) {
      await expect(link).toHaveAccessibleName();
    }
  });

  await step('Each link has an href attribute', async () => {
    for (const link of links) {
      await expect(link).toHaveAttribute('href');
    }
  });

  // Keyboard interaction
  await step('Keyboard interaction', async () => {
    await step('Enter: Executes the link', async () => {
      for (const link of links) {
        let clicked = false;
        const handleClick = (e: MouseEvent) => {
          e.preventDefault();
          clicked = true;
        };

        link.addEventListener('click', handleClick);

        link.focus();
        await userEvent.keyboard('{enter}');

        await expect(clicked).toBe(true);

        link.removeEventListener('click', handleClick);
      }
    });
  });
};
