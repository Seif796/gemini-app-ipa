import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Custom plugin to remove 'crossorigin' attributes which cause WKWebView / Capacitor CORS blocks on iOS
const removeCrossOriginPlugin = () => {
  return {
    name: 'remove-crossorigin',
    transformIndexHtml(html) {
      return html
        .replace(/\s+crossorigin="[^"]*"/g, '')
        .replace(/\s+crossorigin='[^']*'/g, '')
        .replace(/\s+crossorigin/g, '');
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    removeCrossOriginPlugin()
  ],
  build: {
    target: ['es2020', 'safari14', 'ios14'],
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    cssMinify: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons: ['lucide-react']
        }
      }
    }
  }
})
