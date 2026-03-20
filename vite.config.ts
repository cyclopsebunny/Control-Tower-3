import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages publishes the app under:
  // https://<username>.github.io/Control-Tower-3/
  // so we must set the Vite base path accordingly.
  base: '/Control-Tower-3/',
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
});
