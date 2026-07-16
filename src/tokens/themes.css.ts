import { assignVars, createGlobalTheme, globalStyle } from '@vanilla-extract/css'
import { vars } from './contract.css'

/**
 * Token değerleri ve üç geçici palet.
 *
 * DİKKAT: Renkler geçici başlangıç değerleridir, marka kararı değildir.
 * Tasarım netleştiğinde değişecek tek yer burasıdır — component'ler ham renk
 * içermediği için hiçbiri elle düzenlenmez.
 *
 * Yapı brifing 4.2 ile aynı: `corporate-blue` `:root` üzerinde tam olarak
 * tanımlanır; diğer iki tema yalnızca `neutral` ve `primary` skalalarını
 * geçersiz kılar, semantik takma adlar (`--color-bg-canvas` gibi) bu skalalara
 * `var()` ile referans verdiği için otomatik olarak yeni palete uyar.
 */

/* Temadan bağımsız durum renkleri: üç palette de aynı kalır. */
const success = {
  50: '#f0fdf4',
  100: '#dcfce7',
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
}

const warning = {
  50: '#fffbeb',
  100: '#fef3c7',
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
}

const danger = {
  50: '#fef2f2',
  100: '#fee2e2',
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
}

const info = {
  50: '#f0f9ff',
  100: '#e0f2fe',
  600: '#0284c7',
  700: '#0369a1',
  800: '#075985',
  900: '#0c4a6e',
}

const slateNeutral = {
  0: '#ffffff',
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
}

const blueScale = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6',
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
}

const slateScale = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
}

const stoneNeutral = {
  0: '#ffffff',
  50: '#fafaf9',
  100: '#f5f5f4',
  200: '#e7e5e4',
  300: '#d6d3d1',
  400: '#a8a29e',
  500: '#78716c',
  600: '#57534e',
  700: '#44403c',
  800: '#292524',
  900: '#1c1917',
}

const amberScale = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
}

/**
 * Varsayılan tema: corporate-blue.
 *
 * `:root` seçicisi kullanıldığı için `data-theme` hiç verilmese de geçerlidir;
 * diğer temalar bu değerlerin üzerine yazar.
 */
createGlobalTheme(':root', vars, {
  color: {
    neutral: slateNeutral,
    primary: blueScale,
    success,
    warning,
    danger,
    info,

    bg: {
      canvas: vars.color.neutral[50],
      surface: vars.color.neutral[0],
      subtle: vars.color.neutral[100],
      elevated: vars.color.neutral[0],
      disabled: vars.color.neutral[200],
      overlay: 'rgb(15 23 42 / 0.58)',
    },

    text: {
      primary: vars.color.neutral[900],
      secondary: vars.color.neutral[700],
      muted: vars.color.neutral[600],
      disabled: vars.color.neutral[500],
      inverse: vars.color.neutral[0],
      link: vars.color.primary[700],
      linkHover: vars.color.primary[900],
    },

    border: {
      default: vars.color.neutral[300],
      strong: vars.color.neutral[500],
      subtle: vars.color.neutral[200],
    },

    action: {
      primary: {
        bg: vars.color.primary[700],
        hover: vars.color.primary[800],
        active: vars.color.primary[900],
        text: vars.color.neutral[0],
      },
      secondary: {
        bg: vars.color.neutral[0],
        hover: vars.color.neutral[100],
        active: vars.color.neutral[200],
        text: vars.color.neutral[900],
        border: vars.color.neutral[400],
      },
      ghost: {
        hover: vars.color.neutral[100],
        active: vars.color.neutral[200],
        text: vars.color.neutral[800],
      },
      danger: {
        bg: vars.color.danger[700],
        hover: vars.color.danger[800],
        active: vars.color.danger[900],
        text: vars.color.neutral[0],
      },
    },

    focus: { ring: vars.color.primary[500] },
    selection: { bg: vars.color.primary[100] },
    table: { rowHover: vars.color.neutral[100] },

    status: {
      draft: {
        bg: vars.color.neutral[100],
        text: vars.color.neutral[800],
        border: vars.color.neutral[400],
      },
      pending: {
        bg: vars.color.warning[50],
        text: vars.color.warning[800],
        border: vars.color.warning[600],
      },
      changes: {
        bg: vars.color.info[50],
        text: vars.color.info[800],
        border: vars.color.info[600],
      },
      published: {
        bg: vars.color.success[50],
        text: vars.color.success[800],
        border: vars.color.success[600],
      },
      rejected: {
        bg: vars.color.danger[50],
        text: vars.color.danger[800],
        border: vars.color.danger[600],
      },
      /**
       * Brifingden sapma: `paused` info yerine nötr, `expired` nötr yerine
       * turuncu tonuna alındı.
       *
       * Brifingin paletinde 8 durum yalnızca 6 farklı zemin üretiyordu:
       * `changes` ile `paused` ikisi de info-50, `draft` ile `expired` ikisi de
       * neutral-100 idi. Rozetler metin taşıdığı için erişilebilirlik sorunu
       * değildi, ama moderasyon kuyruğunda 50 satırı tarayıp durum dağılımını
       * bir bakışta görmek rozetin varlık sebebi — iki çift karışınca o fayda
       * kayboluyordu. Brifingin "tüm ListingStatus değerleri ayrı görsel durumla
       * temsil edilmelidir" kriteri de bunu gerektiriyor.
       */
      paused: {
        bg: vars.color.neutral[200],
        text: vars.color.neutral[800],
        border: vars.color.neutral[600],
      },
      expired: {
        bg: vars.color.warning[100],
        text: vars.color.warning[900],
        border: vars.color.warning[700],
      },
      /** Arşiv en koyu gri: üç gri durum taslak → pasif → arşiv diye kademelenir. */
      archived: {
        bg: vars.color.neutral[300],
        text: vars.color.neutral[900],
        border: vars.color.neutral[600],
      },
    },
  },

  font: {
    family: {
      sans: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
    },
    size: {
      sm: '1rem',
      md: '1.0625rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    weight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
  },

  lineHeight: { tight: '1.25', heading: '1.35', body: '1.5', relaxed: '1.65' },

  space: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
  },

  radius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },

  shadow: {
    xs: '0 1px 2px rgb(15 23 42 / 0.06)',
    sm: '0 1px 3px rgb(15 23 42 / 0.1), 0 1px 2px rgb(15 23 42 / 0.06)',
    md: '0 4px 6px -1px rgb(15 23 42 / 0.1), 0 2px 4px -2px rgb(15 23 42 / 0.08)',
    lg: '0 10px 15px -3px rgb(15 23 42 / 0.12), 0 4px 6px -4px rgb(15 23 42 / 0.08)',
    xl: '0 20px 25px -5px rgb(15 23 42 / 0.14), 0 8px 10px -6px rgb(15 23 42 / 0.08)',
  },

  z: {
    base: '0',
    sticky: '100',
    dropdown: '300',
    drawer: '500',
    modal: '700',
    toast: '900',
    tooltip: '1000',
  },

  duration: { fast: '120ms', normal: '180ms', slow: '260ms' },
  ease: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    emphasized: 'cubic-bezier(0.2, 0, 0, 1.2)',
  },

  control: {
    height: { sm: '2.75rem', md: '3rem', lg: '3.5rem' },
    inlinePadding: { sm: vars.space[3], md: vars.space[4], lg: vars.space[5] },
  },

  container: { sm: '40rem', md: '48rem', lg: '64rem', xl: '80rem', '2xl': '96rem' },
})

/**
 * Nötr Slate: mavi vurgu yerine gri tonlu, sakin bir palet.
 * Yalnızca `primary` skalası değişir; nötrler corporate-blue ile aynıdır.
 */
globalStyle('[data-theme="neutral-slate"]', {
  vars: {
    ...assignVars(vars.color.neutral, slateNeutral),
    ...assignVars(vars.color.primary, slateScale),
  },
})

/** Sıcak Amber: taş tonlu nötrler ve amber vurgu. */
globalStyle('[data-theme="warm-amber"]', {
  vars: {
    ...assignVars(vars.color.neutral, stoneNeutral),
    ...assignVars(vars.color.primary, amberScale),
  },
})
