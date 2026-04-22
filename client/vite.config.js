import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Map the shared constants (CJS) to our ESM wrapper
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    fs: {
      // Allow access to the shared folder outside the client root
      allow: ['.', '../shared'],
    },
  },
})
