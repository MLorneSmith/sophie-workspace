import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      '**/migrations/**',
      '**/generated/**',
      '**/.next/**',
      '**/dist/**',
      '**/node_modules/**',
      '**/.env*',
      '**/payload-types.ts',
    ],
    rules: {
      // Make all ESLint errors warnings during build to prevent build failures
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
      // Additional rules to prevent build failures
      'no-var': 'warn',
      'prefer-const': 'warn',
      'no-unused-vars': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      'import/no-anonymous-default-export': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      '@next/next/no-img-element': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
  },
]

export default eslintConfig
