import type { Preview } from '@storybook/react-vite'

import '../src/styles/global.css'

const preview: Preview = {
  /**
   * Proje seviyesinde uygulanan tag'ler — her story otomatik olarak devralır,
   * story dosyalarında tekrar yazmaya gerek yok.
   */
  tags: ['autodocs', 'admin-panel'],

  parameters: {
    layout: 'centered',

    controls: {
      expanded: true,
      sort: 'requiredFirst',
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    /**
     * Admin panel masaüstü öncelikli bir üründür: moderasyon kuyruğu, tablolar ve
     * toplu işlemler geniş ekranda kullanılır. Bu yüzden varsayılan desktop.
     * Mobil viewport'lar yine mevcut — tablet üzerinden hızlı moderasyon senaryosu
     * için kontrol edilebilir.
     */
    viewport: {
      options: {
        mobile390: { name: 'Mobile 390', styles: { width: '390px', height: '844px' } },
        tablet768: { name: 'Tablet 768', styles: { width: '768px', height: '1024px' } },
        desktop1280: { name: 'Desktop 1280', styles: { width: '1280px', height: '900px' } },
        desktop1440: { name: 'Desktop 1440', styles: { width: '1440px', height: '1000px' } },
        desktop1920: { name: 'Desktop 1920', styles: { width: '1920px', height: '1080px' } },
      },
    },

    a11y: {
      // 'todo' - ihlalleri sadece test UI'ında gösterir
      // 'error' - CI'ı a11y ihlalinde kırar
      // 'off'   - a11y kontrolünü tamamen kapatır
      //
      // Ekip Storybook'a alıştıktan ve mevcut ihlaller temizlendikten sonra
      // 'error'a çekilecek. Şimdiden 'error' yapmak ilk günden CI'ı kırar.
      test: 'todo',
    },

    /** Kendi metadata standardımız — AI ajanlarına projenin kimliğini bildirir. */
    project: {
      id: 'admin-panel',
      surface: 'internal-operations',
      domain: 'real-estate',
      componentSource: 'local',
      sharedComponentLibrary: false,
    },

    ai: {
      project: 'admin-panel',
      domain: 'real-estate',
      primaryAudience: ['administrator', 'moderator', 'support-agent', 'operations-user'],
      allowedComponentSource: 'admin-panel',
      forbiddenComponentSources: ['front-pages'],
      desktopFirst: true,
    },
  },

  initialGlobals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false,
    },
  },
}

export default preview
