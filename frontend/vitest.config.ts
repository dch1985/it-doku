import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  
  test: {
    // Test Environment
    environment: 'jsdom',
    
    // Setup Files
    setupFiles: ['./src/test/setup.ts'],
    
    // Global Test APIs
    globals: true,
    
    // Coverage Configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
      ],
    },
    
    // Include/Exclude patterns
    include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    
    // Watch options
    watch: false,
    
    // Test timeout
    testTimeout: 10000,
    
    // Reporters
    reporters: ['verbose'],
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
