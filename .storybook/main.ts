import type { StorybookConfig } from '@storybook/react-vite'

const config = {
  framework: '@storybook/react-vite',

  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],

  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-mcp',
  ],

  /**
   * Sidebar filtre menüsünde varsayılan olarak hariç tutulan tag'ler.
   *
   * Not: `admin-panel` tag'i bilerek buraya eklenmedi — preview.tsx'te her story'ye
   * uygulandığı için ona göre filtrelemek hiçbir şeyi elemezdi. O tag yalnızca
   * AI manifest'inde kaynağı işaretlemek için duruyor.
   */
  tags: {
    experimental: { defaultFilterSelection: 'exclude' },
    deprecated: { defaultFilterSelection: 'exclude' },
  },

  /** AI/MCP için component manifest üretimini açar (React-only, preview aşamasında). */
  features: {
    componentsManifest: true,
  },

  staticDirs: ['../public'],
} satisfies StorybookConfig

export default config
