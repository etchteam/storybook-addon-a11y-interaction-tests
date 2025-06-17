import {
  findAllByShadowRole,
  deepQuerySelector,
} from 'shadow-dom-testing-library';
import { expect } from 'storybook/test';

import { a11yTabs } from './tabs';
import { Step } from './types';

type CarouselStyle =
  | 'basic' // No slide picker controls
  | 'tabbed' // Slide picker controls implemented as tabs
  | 'grouped'; // Slide picker controls implemented as a group of buttons

// https://www.w3.org/WAI/ARIA/apg/patterns/carousel/
export const a11yCarousel = async ({
  step,
  canvasElement,
  carouselStyle = 'basic',
}: {
  step: Step;
  canvasElement: HTMLElement;
  carouselStyle: CarouselStyle;
}) => {
  let carouselContainerGroups: HTMLElement[];

  try {
    carouselContainerGroups = await findAllByShadowRole(canvasElement, 'group');
  } catch (error) {
    carouselContainerGroups = [];
  }

  let carouselContainerRegions: HTMLElement[];
  try {
    carouselContainerRegions = await findAllByShadowRole(
      canvasElement,
      'region',
    );
  } catch (error) {
    carouselContainerRegions = [];
  }

  const possibleCarouselContainers = [
    ...carouselContainerGroups,
    ...carouselContainerRegions,
  ];

  // This test checks for the presence of any elements with group or region that could be the carousel container
  // It may pass if the carousel container is not the only element with the role group or region
  // But the next test checks that one of the found elements is actually the carousel container so that should catch that case
  await step(
    'A carousel container element that encompasses all components of the carousel, including both carousel controls and slides, has either role region or role group.',
    async () => {
      await expect(possibleCarouselContainers.length).toBeGreaterThan(0);
    },
  );

  const carouselContainers = possibleCarouselContainers.filter(
    (container) =>
      container.getAttribute('aria-roledescription') === 'carousel',
  );

  // Check that one (and only one) of the possible carousel containers has the aria-roledescription property set to carousel
  await step(
    'The carousel container has the aria-roledescription property set to carousel.',
    async () => {
      await expect(carouselContainers.length).toEqual(1);
    },
  );

  const carouselContainer = carouselContainers[0];

  const ariaLabel = carouselContainer.getAttribute('aria-label');
  const ariaLabelledBy = document.getElementById(
    carouselContainer.getAttribute('aria-labelledby') || '',
  )?.textContent;

  await step(
    'If the carousel has a visible label, its accessible label is provided by the property aria-labelledby on the carousel container set to the ID of the element containing the visible label. Otherwise, an accessible label is provided by the property aria-label set on the carousel container.',
    async () => {
      await expect(ariaLabel || ariaLabelledBy).toBeTruthy();
    },
  );

  await step(
    'Since the aria-roledescription is set to "carousel", the label does not contain the word "carousel".',
    async () => {
      await expect(ariaLabel?.toLowerCase().includes('carousel')).toBeFalsy();
      await expect(
        ariaLabelledBy?.toLowerCase().includes('carousel'),
      ).toBeFalsy();
    },
  );

  // TODO: tests for rotation control, next slide control and previous slide control. These are not used in the current implementation (but should they be?)
  // TODO: optional test for aria-atomic and aria-live properties on the carousel container

  // The carousel implemented here has slide picker controls as tabs
  // TODO: tests for basic and grouped carousel styles

  if (carouselStyle === 'tabbed') {
    const slideContainers = await findAllByShadowRole(
      carouselContainer,
      'tabpanel',
    );

    await step(
      'Each slide container has role tabpanel in lieu of group, and it does not have the aria-roledescription property.',
      async () => {
        await expect(slideContainers.length).toBeGreaterThan(0);
        await Promise.all(
          slideContainers.map(async (slide) => {
            await expect(
              slide.getAttribute('aria-roledescription'),
            ).toBeFalsy();
          }),
        );
      },
    );

    await step('Each slide has an accessible name', async () => {
      slideContainers.forEach(async (slide) => {
        const ariaLabel = slide.getAttribute('aria-label');
        const id = slide.getAttribute('aria-labelledby');
        const ariaLabelledBy = deepQuerySelector(canvasElement, `[id="${id}"]`);

        await expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      });
    });

    const controls = await findAllByShadowRole(carouselContainer, 'tablist', {
      hidden: true,
    });

    await step(
      'The set of controls is grouped in a tablist element',
      async () => {
        await expect(controls.length).toEqual(1);
      },
    );

    const controlsElement = controls[0];

    // If controls are hidden, assume this is because the screen is wide enough to show all slides at once
    // Remaining tests are not relevant so can return early
    if (!controlsElement.checkVisibility()) {
      return;
    }

    await step(
      'The set of controls has an accessible name provided by the value of aria-label that identifies the purpose of the tabs, e.g., "Choose slide to display."',
      async () => {
        const ariaLabel = controlsElement.getAttribute('aria-label');
        await expect(ariaLabel).toBeTruthy();
      },
    );

    await step(
      'Each control is a tab element, so activating a tab displays the slide associated with that tab.',
      async () => {
        const tabs = await findAllByShadowRole(controlsElement, 'tab');
        await expect(tabs.length).toBeGreaterThan(0);
      },
    );

    await step(
      'The accessible name of each tab indicates which slide it will display by including the name or number of the slide, e.g., "Slide 3". Slide names are preferable if each slide has a unique name.',
      async () => {
        const tabs = await findAllByShadowRole(controlsElement, 'tab');
        await Promise.all(
          tabs.map(async (tab) => {
            const ariaLabel = tab.getAttribute('aria-label');
            const ariaLabelledBy = document.getElementById(
              tab.getAttribute('aria-labelledby') || '',
            )?.textContent;

            await expect(ariaLabel || ariaLabelledBy).toBeTruthy();
          }),
        );
      },
    );

    await step(
      'The tab, tablist, and tabpanel implement the properties specified in the tabs pattern.',
      async () => {
        await a11yTabs({
          step,
          canvasElement,
          inverted: true,
        });
      },
    );
  }
};
