import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // This app is also shipped as a single self-contained HTML file (see
    // README) with no server to fetch separate chunks from — so dynamic
    // import()s (e.g. the lazily-loaded xlsx parser) must resolve inline
    // rather than as a runtime fetch of a second file.
    rolldownOptions: {
      output: {
        codeSplitting: false,
      },
    },
  },
})
