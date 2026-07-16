import { createGlobalTheme } from '@vanilla-extract/css'

/**
 * Admin Panel design token'ları.
 *
 * Bu değerler CSS custom property olarak `:root` altına yazılır ve
 * `vars` üzerinden tip güvenli şekilde kullanılır.
 *
 * DİKKAT: Buradaki renkler geçici başlangıç değerleridir, marka kararı değildir.
 * Tasarımcı/Figma geldiğinde bu dosya tek değişim noktasıdır — component'ler
 * ham renk kodu içermediği için hiçbiri elle düzenlenmez.
 */
export const vars = createGlobalTheme(':root', {
  color: {
    /* Yüzeyler */
    surface: {
      base: '#ffffff',
      subtle: '#f8fafc',
      muted: '#f1f5f9',
      inset: '#e2e8f0',
      overlay: 'rgba(15, 23, 42, 0.55)',
    },

    /* Metin */
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      muted: '#64748b',
      disabled: '#94a3b8',
      onBrand: '#ffffff',
      onDanger: '#ffffff',
    },

    /* Kenarlıklar */
    border: {
      subtle: '#e2e8f0',
      default: '#cbd5e1',
      strong: '#94a3b8',
      focus: '#2563eb',
    },

    /* Marka — geçici placeholder */
    brand: {
      subtle: '#eff6ff',
      muted: '#bfdbfe',
      default: '#2563eb',
      hover: '#1d4ed8',
      active: '#1e40af',
    },

    /* Durum renkleri — moderasyon akışında kullanılacak */
    success: {
      subtle: '#f0fdf4',
      default: '#16a34a',
      hover: '#15803d',
      text: '#166534',
    },
    warning: {
      subtle: '#fffbeb',
      default: '#d97706',
      hover: '#b45309',
      text: '#92400e',
    },
    danger: {
      subtle: '#fef2f2',
      default: '#dc2626',
      hover: '#b91c1c',
      active: '#991b1b',
      text: '#991b1b',
    },
    info: {
      subtle: '#eff6ff',
      default: '#2563eb',
      text: '#1e40af',
    },
  },

  space: {
    none: '0',
    '2xs': '0.125rem',
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    '3xl': '3rem',
  },

  radius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },

  font: {
    family: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
    },
    size: {
      xs: '0.75rem',
      sm: '0.8125rem',
      md: '0.875rem',
      lg: '1rem',
      xl: '1.125rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    weight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  shadow: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(15, 23, 42, 0.06)',
    md: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)',
    lg: '0 10px 15px -3px rgba(15, 23, 42, 0.10), 0 4px 6px -4px rgba(15, 23, 42, 0.06)',
    focus: '0 0 0 3px rgba(37, 99, 235, 0.35)',
  },

  /* Admin panelde yoğun tablo/liste olduğu için kontrol yükseklikleri sabitlenir */
  size: {
    control: {
      sm: '1.75rem',
      md: '2.25rem',
      lg: '2.75rem',
    },
  },

  duration: {
    fast: '120ms',
    normal: '200ms',
  },
})
