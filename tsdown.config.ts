import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/jsx-runtime.ts', 'src/jsx-dev-runtime.ts'],
  format: ['esm', 'cjs'],
  platform: 'neutral',
  target: 'es2018',
  dts: true,
  exports: true,
  publint: true,
});
