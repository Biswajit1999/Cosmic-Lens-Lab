import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173 },
  resolve: {
    alias: {
      '@cosmiclens/physics-core': fileURLToPath(new URL('../../packages/physics-core/src/index.ts', import.meta.url)),
      '@cosmiclens/schema': fileURLToPath(new URL('../../packages/schema/src/index.ts', import.meta.url)),
    },
  },
});
