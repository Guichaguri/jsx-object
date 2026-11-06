// @ts-ignore
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const src = (file: string) => fileURLToPath(new URL(`./src/${file}`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^jsx-object\/jsx-runtime$/, replacement: src('jsx-runtime.ts') },
      { find: /^jsx-object\/jsx-dev-runtime$/, replacement: src('jsx-dev-runtime.ts') },
      { find: /^jsx-object$/, replacement: src('index.ts') },
    ],
  },
  oxc: {
    jsx: {
      runtime: 'automatic',
      importSource: 'jsx-object',
    },
  },
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
  },
});
