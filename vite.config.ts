/// <reference types="vitest/config" />
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  /**
   * Her story'nin dolaylı olarak yüklediği bağımlılıklar önden bildirilir.
   *
   * Bildirilmezlerse Vite bunları ancak test çalışırken keşfeder, bağımlılıkları
   * yeniden optimize eder ve sayfayı reload eder; o an fetch edilmiş modüllerin
   * hash'leri geçersiz kalır ve bütün story'ler "Failed to fetch dynamically
   * imported module" ile patlar.
   *
   * react-router ve react-query buraya dahil, çünkü preview.tsx'teki global
   * decorator'lar üzerinden istisnasız her story'ye yükleniyorlar.
   */
  optimizeDeps: {
    include: [
      '@vanilla-extract/recipes/createRuntimeFn',
      'react-router',
      '@tanstack/react-query',
    ],
  },

  // https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
  test: {
    projects: [
      {
        extends: true,
        plugins: [storybookTest({ configDir: path.join(dirname, '.storybook') })],
        test: {
          name: 'storybook',
          // setupFiles gerekmiyor: Storybook 10.3'ten beri addon-vitest,
          // preview.tsx'teki proje ayarlarını testlere otomatik uyguluyor.
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
