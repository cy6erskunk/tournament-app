import nextConfig from 'eslint-config-next/core-web-vitals';
import i18next from 'eslint-plugin-i18next';

const config = [
  ...nextConfig,
  {
    plugins: {
      i18next,
    },
    rules: {
      'i18next/no-literal-string': 1,
    },
  },
];

export default config;
