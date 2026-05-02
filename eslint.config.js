import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    plugins: { '@stylistic': stylistic },
    rules: {
      '@stylistic/indent': [ 'error', 2 ],
      '@stylistic/no-tabs': 'error',
    },
  },
  { ignores: [ 'dist' ] }
);
