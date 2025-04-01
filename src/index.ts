import { a11yAccordion } from './a11y-tests/accordion';
import { a11yAlert } from './a11y-tests/alert';
import { a11yAlertDialog } from './a11y-tests/alertdialog';
import { a11yButton } from './a11y-tests/button';
import { a11yCarousel } from './a11y-tests/carousel';
import { a11yCheckbox } from './a11y-tests/checkbox';
import { a11yCombobox } from './a11y-tests/combobox';
import { a11yDisclosure } from './a11y-tests/disclosure';
import { a11yLink } from './a11y-tests/link';
import { a11yModal } from './a11y-tests/modal';
import { a11yRadio } from './a11y-tests/radio';
import { a11ySwitch } from './a11y-tests/switch';
import { a11yTable } from './a11y-tests/table';
import { a11yTabs } from './a11y-tests/tabs';

// Re-export all test functions
export {
  a11yAccordion,
  a11yAlert,
  a11yAlertDialog,
  a11yButton,
  a11yCarousel,
  a11yCheckbox,
  a11yCombobox,
  a11yDisclosure,
  a11yLink,
  a11yModal,
  a11yRadio,
  a11ySwitch,
  a11yTable,
  a11yTabs,
};

// Export a convenient object with all tests for easier imports
export const a11yTests = {
  accordion: a11yAccordion,
  alert: a11yAlert,
  alertDialog: a11yAlertDialog,
  button: a11yButton,
  carousel: a11yCarousel,
  checkbox: a11yCheckbox,
  combobox: a11yCombobox,
  disclosure: a11yDisclosure,
  link: a11yLink,
  modal: a11yModal,
  radio: a11yRadio,
  switch: a11ySwitch,
  table: a11yTable,
  tabs: a11yTabs,
};

export default a11yTests;