/*

A collection of re-usable a11y tests that can be used on
any component that implements these patterns.

Guides to design Patterns come from:
https://www.w3.org/WAI/ARIA/apg/patterns/

Tests should plug straight into Storybook interaction tests.

*/

// Re-export utility functions
export * from '../utils';

export { a11yAccordion } from './accordion';
export { a11yAlert } from './alert';
export { a11yAlertDialog } from './alertdialog';
export { a11yButton } from './button';
export { a11yCarousel } from './carousel';
export { a11yCheckbox } from './checkbox';
export { a11yCombobox } from './combobox';
export { a11yDisclosure } from './disclosure';
export { a11yRadio } from './radio';
export { a11ySwitch } from './switch';
export { a11yTabs } from './tabs';
export { a11yModal } from './modal';
export { a11yLink } from './link';
export { a11yTable } from './table';
