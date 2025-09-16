import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::", // Per accesso rete locale (tablet/smartphone)
    port: 8080, // Porta standard per negozi
    strictPort: true,
    // Ottimizzazioni per computer meno potenti
    hmr: {
      overlay: mode === 'development' ? true : false
    },
    // Caching per performance locale
    headers: {
      'Cache-Control': mode === 'production' ? 'public, max-age=31536000' : 'no-cache'
    }
  },
  plugins: [
    react({
      // Ottimizzazioni SWC per computer lenti
      plugins: [
        // Rimuovi console.log in production
        mode === 'production' && ['@swc/plugin-remove-console', { exclude: ['error', 'warn'] }]
      ].filter(Boolean)
    }),
    // Plugin per monitoring performance in dev
    ...(mode === 'development' ? [
      {
        name: 'performance-monitor',
        configureServer(server) {
          server.middlewares.use('/_perf', (req, res, next) => {
            if (req.url?.startsWith('/_perf/stats')) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                timestamp: Date.now(),
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                platform: process.platform,
                arch: process.arch,
                nodeVersion: process.version
              }));
            } else {
              next();
            }
          });
        }
      }
    ] : []),
    // Plugin per ottimizzazioni production
    ...(mode === 'production' ? [
      {
        name: 'production-optimizer',
        generateBundle(options, bundle) {
          // Log dimensioni bundle per ottimizzazione
          Object.keys(bundle).forEach(fileName => {
            const chunk = bundle[fileName];
            if (chunk.type === 'chunk' && chunk.code) {
              const size = Math.round(chunk.code.length / 1024);
              console.log(`📦 ${fileName}: ${size}KB`);
            }
          });
        }
      }
    ] : [])
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Ottimizzazioni per computer con RAM limitata
  optimizeDeps: {
    include: [
      'react', 
      'react-dom',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      'lucide-react'
    ],
    exclude: ['@tanstack/react-query-devtools'] // Exclude devtools in production
  },
  build: {
    // Target per computer meno recenti
    target: 'es2020',
    // Ottimizzazioni dimensioni
    minify: mode === 'production' ? 'terser' : false,
    terserOptions: mode === 'production' ? {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug']
      },
      mangle: true,
      format: {
        comments: false
      }
    } : undefined,
    rollupOptions: {
      output: {
        // Chunk splitting ottimizzato per negozi
        manualChunks: (id) => {
          // Vendor chunks per caching efficace
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('recharts') || id.includes('d3')) {
              return 'chart-vendor';
            }
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            if (id.includes('react-hook-form')) {
              return 'form-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            // Altri vendor in chunk generico
            return 'vendor';
          }
          
          // Feature-based chunks per lazy loading
          if (id.includes('components/Statistics') || id.includes('components/AdvancedAnalytics')) {
            return 'analytics';
          }
          if (id.includes('components/Garage') || id.includes('components/Individual')) {
            return 'garage';
          }
          if (id.includes('components/Dev') || id.includes('components/Settings')) {
            return 'admin';
          }
        },
        // Nomi file cache-friendly
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name;
          if (name === 'vendor' || name.includes('vendor')) {
            return 'assets/[name].[hash].js';
          }
          return 'assets/[name].[hash].js';
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return 'assets/images/[name].[hash][extname]';
          }
          if (/css/i.test(ext)) {
            return 'assets/css/[name].[hash][extname]';
          }
          return 'assets/[name].[hash][extname]';
        }
      },
      // External dependencies per ridurre bundle size
      external: mode === 'production' ? [] : undefined,
      // Warning management
      onwarn(warning, warn) {
        // Sopprime warning non critici per non confondere utenti
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return;
        }
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') {
          return;
        }
        warn(warning);
      }
    },
    // Warnings ottimizzati
    chunkSizeWarningLimit: 800, // Aumentato per componenti negozio
    // Ottimizzazioni CSS
    cssCodeSplit: true,
    // Source maps leggeri per debugging
    sourcemap: mode === 'development' ? true : false,
    // Output ottimizzato
    outDir: 'dist',
    assetsDir: 'assets'
  },
  // CSS ottimizzazioni
  css: {
    devSourcemap: mode === 'development'
  },
  // Preview ottimizzazioni
  preview: {
    port: 8080,
    host: "::",
    strictPort: true,
    headers: {
      'Cache-Control': 'public, max-age=600' // 10 minuti
    }
  }
}));
