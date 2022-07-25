import { defineConfig } from 'vite'

export default defineConfig({
    test: {
        include: ['tests/unit/**/*.test.ts'],
        /**
         * not to ESM ported packages
         */
        exclude: [
            'dist', '.idea', '.git', '.cache',
            '**/node_modules/**'
        ],
        coverage: {
            enabled: false,
            exclude: ['node_modules', '**/out/**'],
            // lines: 90,
            // functions: 90,
            // branches: 90,
            // statements: 90
        }
    }
})
