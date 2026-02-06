import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 设计系统路径映射
      '@design-system': path.resolve(__dirname, '../../libs/design-system'),
      '@design-system/tokens': path.resolve(__dirname, '../../libs/design-system/tokens'),
      '@design-system/components': path.resolve(__dirname, '../../libs/design-system/components'),
      // 组件路径映射
      '@components': path.resolve(__dirname, 'src/components'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // prevent vite from obscuring rust errors
  clearScreen: false,
  // Tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    // Enable LAN access (v1.5.0 enhancement)
    host: '0.0.0.0',
    // Allow accessing from any network interface
    allowedHosts: ['all'],
    // CORS settings for LAN access
    cors: true,
  },
  // to make use of `TAURI_PLATFORM`, `TAURI_ARCH`, `TAURI_FAMILY`,
  // `TAURI_PLATFORM_VERSION`, `TAURI_PLATFORM_TYPE` and `TAURI_DEBUG`
  // env variables
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target: process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    // don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
