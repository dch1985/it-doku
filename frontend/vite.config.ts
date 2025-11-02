import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle Analyzer - zeigt Bundle Size Breakdown
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    // Source Maps für Production (optional, deaktivieren für kleinere Bundles)
    sourcemap: false,
    
    // Chunk Size Warning erhöhen (optional)
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        // Manual Chunks für besseres Code Splitting
        manualChunks: {
          // React Core
          'react-vendor': ['react', 'react-dom'],
          
          // UI Libraries
          'ui-vendor': ['lucide-react'],
          
          // State Management
          'state-vendor': ['zustand', 'immer'],
          
          // Utilities
          'utils-vendor': ['date-fns', 'clsx'],
        },
      },
    },
    
    // Minification
    minify: 'esbuild',
    
    // Target modern browsers for smaller bundles
    target: 'es2020',
  },

  // Dev Server Optimization
  server: {
    port: 5173,
    strictPort: false,
    open: false,
  },

  // Optimize Deps
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand'],
  },
})