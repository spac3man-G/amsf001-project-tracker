import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // ============================================
  // VITEST CONFIGURATION
  // ============================================
  test: {
    // Use jsdom for DOM testing
    environment: 'jsdom',
    
    // Make test functions global (describe, it, expect)
    globals: true,
    
    // Setup file to run before tests
    setupFiles: ['./src/__tests__/setup/vitest.setup.js'],
    
    // Include patterns for test files
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    
    // Exclude patterns
    exclude: ['node_modules', 'dist', '.git'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/__tests__/**',
        'src/main.jsx',
        'src/**/*.test.{js,jsx}',
        'src/**/*.spec.{js,jsx}',
      ],
    },
    
    // Watch mode exclusions
    watchExclude: ['node_modules', 'dist'],
    
    // Timeout for tests (in ms)
    testTimeout: 10000,
    
    // Reporter configuration
    reporters: ['verbose'],
  },
  
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',
    
    // Generate source maps for production debugging
    sourcemap: false,
    
    // Chunk size warning threshold (in KB)
    chunkSizeWarningLimit: 500,
    
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // React core - changes rarely
          'vendor-react': [
            'react',
            'react-dom',
            'react-router-dom'
          ],
          
          // Supabase - changes rarely
          'vendor-supabase': [
            '@supabase/supabase-js'
          ],
          
          // Charts library - only used on Dashboard/Reports
          'vendor-charts': [
            'recharts'
          ],
          
          // Icons - tree-shake what we need
          'vendor-icons': [
            'lucide-react'
          ]
        },
        
        // Consistent chunk naming for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        
        // Asset file naming
        assetFileNames: 'assets/[name]-[hash][extname]',
        
        // Entry file naming
        entryFileNames: 'assets/[name]-[hash].js'
      }
    },
    
    // Use esbuild for minification (faster, included by default)
    minify: 'esbuild'
  },
  
  // Development server settings
  server: {
    port: 5173,
    open: true,
    cors: true
  },
  
  // Preview server (for testing production builds locally)
  preview: {
    port: 4173
  },
  
  // Optimise dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'recharts',
      'lucide-react'
    ]
  },
  
  // esbuild options for removing console.log in production
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  }
})
