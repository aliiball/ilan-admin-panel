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
   * vanilla-extract'in recipe runtime'ı story dosyalarından dolaylı olarak
   * yükleniyor ve Vite tarafından ancak test çalışırken keşfediliyordu. Bu, test
   * ortasında bağımlılıkların yeniden optimize edilip sayfanın reload olmasına,
   * dolayısıyla bütün story testlerinin "Failed to fetch dynamically imported
   * module" ile patlamasına yol açıyordu. Önceden bildirerek reload'u engelliyoruz.
   */
  optimizeDeps: {
    include: ['@vanilla-extract/recipes/createRuntimeFn'],
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
