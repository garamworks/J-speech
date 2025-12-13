import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: './src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    minify: 'terser',
    sourcemap: false,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/pages/flashcards.html'),
        player: path.resolve(__dirname, 'src/pages/player.html'),
        episodes: path.resolve(__dirname, 'src/pages/episodes.html')
      },
      output: {
        manualChunks(id) {
          if (id.includes('/lib/audio.js')) {
            return 'audio';
          }
          if (id.includes('/lib/api-client.js')) {
            return 'api';
          }
          if (id.includes('/lib/helpers.js')) {
            return 'helpers';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
