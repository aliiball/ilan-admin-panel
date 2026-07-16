import { createGlobalThemeContract } from '@vanilla-extract/css'

/**
 * Design token sözleşmesi.
 *
 * Burada yalnızca token'ların ADI ve ŞEKLİ tanımlıdır; değerleri `themes.css.ts`
 * içindedir. Sözleşme sayesinde bir temada eksik kalan token derleme hatası verir.
 *
 * Üretilen CSS değişken adları brifing 4.2 ile birebir aynıdır
 * (`--color-action-primary-bg`, `--space-4`, `--control-height-md` ...).
 */

/** camelCase yol parçalarını kebab-case'e çevirir: `linkHover` -> `link-hover`. */
const toKebab = (segment: string): string =>
  segment.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)

export const vars = createGlobalThemeContract(
  {
    color: {
      neutral: {
        0: null,
        50: null,
        100: null,
        200: null,
        300: null,
        400: null,
        500: null,
        600: null,
        700: null,
        800: null,
        900: null,
      },
      primary: {
        50: null,
        100: null,
        200: null,
        300: null,
        400: null,
        500: null,
        600: null,
        700: null,
        800: null,
        900: null,
      },
      success: { 50: null, 100: null, 600: null, 700: null, 800: null, 900: null },
      warning: { 50: null, 100: null, 600: null, 700: null, 800: null, 900: null },
      danger: { 50: null, 100: null, 600: null, 700: null, 800: null, 900: null },
      info: { 50: null, 100: null, 600: null, 700: null, 800: null, 900: null },

      bg: {
        canvas: null,
        surface: null,
        subtle: null,
        elevated: null,
        disabled: null,
        overlay: null,
      },

      text: {
        primary: null,
        secondary: null,
        muted: null,
        disabled: null,
        inverse: null,
        link: null,
        linkHover: null,
      },

      border: { default: null, strong: null, subtle: null },

      action: {
        primary: { bg: null, hover: null, active: null, text: null },
        secondary: { bg: null, hover: null, active: null, text: null, border: null },
        ghost: { hover: null, active: null, text: null },
        danger: { bg: null, hover: null, active: null, text: null },
      },

      focus: { ring: null },
      selection: { bg: null },
      table: { rowHover: null },

      /** Her ListingStatus için ayrı görsel durum — brifing kabul kriteri. */
      status: {
        draft: { bg: null, text: null, border: null },
        pending: { bg: null, text: null, border: null },
        changes: { bg: null, text: null, border: null },
        published: { bg: null, text: null, border: null },
        rejected: { bg: null, text: null, border: null },
        paused: { bg: null, text: null, border: null },
        expired: { bg: null, text: null, border: null },
        archived: { bg: null, text: null, border: null },
      },
    },

    font: {
      family: { sans: null, mono: null },
      /** Brifing kuralı: görünür metin `1rem` altına düşmez, bu yüzden sm = 1rem. */
      size: {
        sm: null,
        md: null,
        lg: null,
        xl: null,
        '2xl': null,
        '3xl': null,
        '4xl': null,
      },
      weight: { regular: null, medium: null, semibold: null, bold: null },
    },

    lineHeight: { tight: null, heading: null, body: null, relaxed: null },

    space: {
      0: null,
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
      6: null,
      8: null,
      10: null,
      12: null,
      16: null,
      20: null,
      24: null,
    },

    radius: {
      none: null,
      sm: null,
      md: null,
      lg: null,
      xl: null,
      '2xl': null,
      full: null,
    },

    shadow: { xs: null, sm: null, md: null, lg: null, xl: null },

    z: {
      base: null,
      sticky: null,
      dropdown: null,
      drawer: null,
      modal: null,
      toast: null,
      tooltip: null,
    },

    duration: { fast: null, normal: null, slow: null },
    ease: { standard: null, emphasized: null },

    /** Brifing kuralı: dokunma hedefi en az 44x44px, bu yüzden sm = 2.75rem. */
    control: {
      height: { sm: null, md: null, lg: null },
      inlinePadding: { sm: null, md: null, lg: null },
    },

    container: { sm: null, md: null, lg: null, xl: null, '2xl': null },
  },
  (_value, path) => path.map(toKebab).join('-'),
)
