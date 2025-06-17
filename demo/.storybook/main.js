const config = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [],

  framework: {
    name: '@storybook/react-vite',
    options: {}
  },

  features: {
    interactionsDebugger: true,
  }
};

export default config;