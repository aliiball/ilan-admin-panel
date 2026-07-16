import type { Decorator, Preview } from '@storybook/react-vite'

import { withQuery, withRouter } from '../src/storybook/decorators'
import '../src/tokens/globals.css'

type ThemeName = 'corporate-blue' | 'neutral-slate' | 'warm-amber'

/**
 * Seçili paleti `<html data-theme="...">` üzerinden uygular.
 *
 * Token'lar CSS custom property olduğu için tema değişiminde reload gerekmez;
 * açık olan story anında güncellenir.
 */
const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals['theme'] ?? 'corporate-blue') as ThemeName

  if (typeof document !== 'undefined') {
    document.documentElement.dataset['theme'] = theme
  }

  return <Story />
}

const preview: Preview = {
  /**
   * Proje seviyesinde uygulanan tag'ler — her story otomatik olarak devralır,
   * story dosyalarında tekrar yazmaya gerek yok.
   */
  tags: ['autodocs', 'admin-panel'],

  /**
   * Bütün story'lere uygulanan sarmalayıcılar. Sıra dıştan içe doğrudur:
   * tema en dışta, sonra router, en içte query.
   */
  decorators: [withTheme, withQuery, withRouter],

  globalTypes: {
    theme: {
      name: 'Tema',
      description: 'Geçici design token paleti',
      toolbar: {
        icon: 'paintbrush',
        dynamicTitle: true,
        items: [
          { value: 'corporate-blue', title: 'Kurumsal Mavi' },
          { value: 'neutral-slate', title: 'Nötr Slate' },
          { value: 'warm-amber', title: 'Sıcak Amber' },
        ],
      },
    },
  },

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
     * Brifing kuralı: mobil temel görünümdür, 320 piksel taban alınır.
     * Masaüstü düzenleri bunun üzerine `min-width` sorgularıyla eklenir.
     */
    viewport: {
      options: {
        mobile320: { name: 'Mobil 320', styles: { width: '320px', height: '800px' } },
        mobile430: { name: 'Mobil 430', styles: { width: '430px', height: '900px' } },
        tablet768: { name: 'Tablet 768', styles: { width: '768px', height: '1024px' } },
        desktop1440: { name: 'Desktop 1440', styles: { width: '1440px', height: '1000px' } },
      },
    },

    options: {
      storySort: {
        order: ['Foundations', 'Primitives', 'Composites', 'Screens', 'Patterns'],
      },
    },

    a11y: {
      // 'todo' - ihlalleri sadece test UI'ında gösterir
      // 'error' - CI'ı a11y ihlalinde kırar
      // 'off'   - a11y kontrolünü tamamen kapatır
      //
      // Ekip Storybook'a alıştıktan ve mevcut ihlaller temizlendikten sonra
      // 'error'a çekilecek. Brifing "axe raporunda kritik ihlal bulunmamalıdır"
      // diyor; o kapıya Faz 1 sonunda geçeceğiz.
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
      mobileFirst: true,
    },
  },

  initialGlobals: {
    theme: 'corporate-blue',
  },
}

export default preview
