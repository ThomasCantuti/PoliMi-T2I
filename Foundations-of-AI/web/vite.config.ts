import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Dev: `npm run dev` (http://127.0.0.1:5173) proxies the Python API.
// Prod: `npm run build` → dist/, served by ../server.py on http://127.0.0.1:8765.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:8765', '/content': 'http://127.0.0.1:8765' },
  },
  build: { outDir: 'dist', emptyOutDir: true, chunkSizeWarningLimit: 3000 },
});
