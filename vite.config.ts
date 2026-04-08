import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const isTauri = !!process.env.TAURI_ENV_PLATFORM

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Prevent vite from obscuring Rust errors in Tauri dev
  clearScreen: false,
  // Tauri expects a fixed port
  server: {
    port: 5173,
    strictPort: true,
    // COOP/COEP headers only needed for SQL.js WASM in browser mode
    ...(!isTauri && {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    }),
  },
  optimizeDeps: {
    include: ['sql.js'],
  },
  // Environment variable to detect Tauri from frontend code
  define: {
    __TAURI__: isTauri,
  },
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS/Linux
    target: isTauri ? 'esnext' : 'es2022',
    // Don't minify for debug builds in Tauri
    minify: !isTauri ? 'esbuild' : !!process.env.TAURI_ENV_DEBUG ? false : 'esbuild',
    // Produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
})
