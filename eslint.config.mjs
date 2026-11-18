import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'docs/**/*', 'node_modules/**/*', 'src/**/*', 'tests/**/*', 'scripts/**/*'],
  },
  firebaseRulesPlugin.configs['flat/recommended'],
];
