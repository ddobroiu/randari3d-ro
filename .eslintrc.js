module.exports = {
  root: true,
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off', // 🛑 dezactivăm regula blocantă
    '@typescript-eslint/no-unused-vars': 'warn',
    '@next/next/no-img-element': 'warn',
    '@next/next/no-html-link-for-pages': 'warn',
    'jsx-a11y/alt-text': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
};
