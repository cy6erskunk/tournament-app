import { FlatCompat } from '@eslint/eslintrc';
import i18next from 'eslint-plugin-i18next';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  ...compat.extends('next/core-web-vitals'),
  {
    plugins: {
      i18next,
    },
    rules: {
      'i18next/no-literal-string': 1,
    },
  },
];
