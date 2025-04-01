import { a11yButton } from '@etchteam/storybook-addon-a11y-interaction-tests';

import { Button } from './Button';

export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
};

export const Default = {
  play: async ({ canvasElement, step }) => {
    await a11yButton({ canvasElement, step });
  },
};
