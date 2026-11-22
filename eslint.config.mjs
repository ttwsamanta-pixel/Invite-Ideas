import tseslint from 'typescript-eslint'
export default [{ ignores: ['**/.next/**', '**/dist/**', '**/generated/**', '**/next-env.d.ts'] }, ...tseslint.configs.recommended]
