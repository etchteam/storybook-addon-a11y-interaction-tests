# Storybook A11y Interaction Tests

A collection of reusable accessibility interaction tests for common UI patterns that can be used in Storybook's test runner play functions.

## Installation

```bash
npm install --save-dev @etchteam/storybook-addon-a11y-interaction-tests
# or
yarn add -D @etchteam/storybook-addon-a11y-interaction-tests
```

## Usage

This addon provides a set of reusable accessibility interaction tests that you can use in your Storybook stories' play functions. The tests follow the [W3C ARIA Design Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) and test for proper ARIA roles, states, properties, and keyboard interactions.

### Example Usage

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent } from '../utils/test-utils';
import { a11yButton } from '@etchteam/storybook-addon-a11y-interaction-tests';

import { Button } from './Button';

const meta: Meta<typeof Button> = {
  component: Button,
  argTypes: {
    // ... your argTypes
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    label: 'Button',
    primary: true,
  },
  play: async ({ canvasElement, step }) => {
    // Run the a11y button tests
    await a11yButton({
      step,
      canvasElement,
      isDisabled: false,
      isToggle: false,
    });
    
    // Add any additional tests specific to your button component
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Button',
    disabled: true,
  },
  play: async ({ canvasElement, step }) => {
    await a11yButton({
      step,
      canvasElement,
      isDisabled: true,
    });
  },
};
```

### Using Multiple Test Patterns

You can use multiple accessibility tests for components that combine patterns:

```tsx
import { a11yButton, a11yDisclosure } from '@etchteam/storybook-addon-a11y-interaction-tests';

// ...

export const DisclosureButton: Story = {
  args: {
    // ...
  },
  play: async ({ canvasElement, step }) => {
    // Test both button and disclosure aspects
    await a11yButton({ step, canvasElement });
    await a11yDisclosure({ step, canvasElement });
  },
};
```

### Available Tests

This addon includes tests for the following ARIA patterns:

- `a11yAccordion` - Tests for accordion components
- `a11yAlert` - Tests for alert components
- `a11yAlertDialog` - Tests for alert dialog components
- `a11yButton` - Tests for button components
- `a11yCarousel` - Tests for carousel components
- `a11yCheckbox` - Tests for checkbox components
- `a11yCombobox` - Tests for combobox components
- `a11yDisclosure` - Tests for disclosure components
- `a11yLink` - Tests for link components
- `a11yModal` - Tests for modal dialog components
- `a11yRadio` - Tests for radio button components
- `a11ySwitch` - Tests for switch components
- `a11yTable` - Tests for table components
- `a11yTabs` - Tests for tabs components

Each test function accepts parameters specific to that component type.

## License

MIT