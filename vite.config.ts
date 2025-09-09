import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    ...(mode === 'development' ? [
      {
        name: 'dev-middleware',
        configureServer(server) {
          server.middlewares.use('/_dev', (req, res, next) => {
            if (req.url?.startsWith('/_dev/info')) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                timestamp: Date.now(),
                memory: process.memoryUsage(),
                uptime: process.uptime()
              }));
            } else {
              next();
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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select', 
            '@radix-ui/react-checkbox',
            '@radix-ui/react-toast',
            '@radix-ui/react-switch'
          ],
          'chart-vendor': ['recharts'],
          'date-vendor': ['date-fns'],
          'form-vendor': ['react-hook-form']
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
}));
