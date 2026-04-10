// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/barberhub/',  // ← Debe ser exactamente el nombre de tu repositorio
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
})
