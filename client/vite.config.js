import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    target: ['es2020', 'safari14', 'ios14'],
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})
