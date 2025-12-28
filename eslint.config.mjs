import nextConfig from 'eslint-config-next/core-web-vitals';
import i18next from 'eslint-plugin-i18next';

export default [
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
