import { findByShadowRole } from 'shadow-dom-testing-library';
import { expect, userEvent } from 'storybook/test';

import { pause } from '../utils/pause';

import { Step } from './types';

// https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
// Note: The pattern described by WAI-ARIA is for a button and aria attributes.
// But the alternative is to use details and summary elements.
// These tests are for a disclosure using details and summary elements.
// TODO: add tests for the button and aria attributes pattern.
export const a11yDisclosure = async ({
  step,
  canvasElement,
  testKeyboardInteractions = true,
}: {
  step: Step;
  canvasElement: HTMLElement;
  testKeyboardInteractions?: boolean;
}) => {
  const details = await findByShadowRole(canvasElement, 'group'); // <details> elements have an implicit aria role of group.
  const summary = details.querySelector('summary') as HTMLElement;

  await step(
    'Verify that there is a disclosure using details and summary elements',
    async () => {
      await expect(details).toBeInTheDocument();
    },
  );

  // WAI-ARIA states that the element that shows/hides the content should have role button.
  // Summary element ought to have this by default, but it gets exposed differently by different OS/browser combos.
  // See https://www.scottohara.me/blog/2022/09/12/details-summary.html
  // So this test just checks that the summary element is present.
  await step(
    'The element that shows and hides the content has role button.',
    async () => {
      await expect(summary).toBeInTheDocument();
    },
  );

  // Details and summary elements don't use aria-expanded, they use the open attribute on <details>.
  await step(
    'When the content is visible, the element with role button has aria-expanded set to true. When the content area is hidden, it is set to false.',
    async () => {
      await userEvent.click(summary);
      await pause();
      await expect((details as HTMLDetailsElement).open).toBe(true);

      await userEvent.click(summary);
      await pause();
      await expect((details as HTMLDetailsElement).open).toBe(false);
    },
  );

  // 'Optionally, the element with role button has a value specified for aria-controls that refers to the element that contains all the content that is shown or hidden.'
  // This isn't needed for details and summary elements

  // Keyboard interaction
  if (!testKeyboardInteractions) return;

  await step('Keyboard interaction', async () => {
    await step(
      'Space activates the disclosure control and toggles the visibility of the disclosure content',
      async () => {
        await userEvent.type(summary, '{space}');
        await pause();
        await expect((details as HTMLDetailsElement).open).toBe(true);

        await userEvent.type(summary, '{space}');
        await pause();
        await expect((details as HTMLDetailsElement).open).toBe(false);
      },
    );

    await step(
      'Enter activates the disclosure control and toggles the visibility of the disclosure content',
      async () => {
        await userEvent.type(summary, '{enter}');
        await pause();
        await expect((details as HTMLDetailsElement).open).toBe(true);

        await userEvent.type(summary, '{enter}');
        await pause();
        await expect((details as HTMLDetailsElement).open).toBe(false);
      },
    );
  });
};
