import { defineConfig } from 'vitest/config';
import legacy from '@vitejs/plugin-legacy';

/**
 * Mobile support strategy:
 * - Modern chunk (ES modules) is down-levelled to the plugin's built-in modern targets
 *   (Chrome/Android Chrome 64+, Safari/iOS 12+, Edge 79+, Firefox 67+).
 * - Browsers without ES-module support (old Android WebView / Samsung Internet / old Chrome)
 *   receive a separate legacy bundle (Babel + core-js polyfills + SystemJS) via <script nomodule>.
 */
const LEGACY_TARGETS = ['defaults', 'Android >= 7', 'Chrome >= 61', 'Samsung >= 8', 'iOS >= 12'];

export default defineConfig({
  base: './',
  plugins: [
    legacy({
      targets: LEGACY_TARGETS,
      modernPolyfills: true,
    }),
  ],
  build: {
    cssTarget: ['chrome61', 'safari12'],
    chunkSizeWarningLimit: 1500,
  },
  server: {
    host: true,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
