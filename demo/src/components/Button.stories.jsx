import { a11yButton } from '../../../src/a11y-tests';

import { Button } from './Button';

export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
};

export const Default = {
  play: a11yButton,
};
