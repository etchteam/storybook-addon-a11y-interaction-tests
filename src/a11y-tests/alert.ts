import { expect } from '@storybook/test';
import { findByShadowRole } from 'shadow-dom-testing-library';

import { Step } from './types';

// https://www.w3.org/WAI/ARIA/apg/patterns/alert/
export const a11yAlert = async ({
  step,
  canvasElement,
}: {
  canvasElement: HTMLElement;
  step: Step;
}) => {
  const alertElement = await findByShadowRole(canvasElement, 'alert');

  // Aria roles, states and properties

  await step('The alert has role alert', async () => {
    await expect(alertElement).toBeInTheDocument();
  });
};
