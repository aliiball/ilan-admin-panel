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

      /**
       * Her ListingStatus için ayrı görsel durum — brifing kabul kriteri.
       *
       * Dört slot, üç farklı kontrast borcu taşır ve **birbirinin yerine
       * geçmez:**
       *
       * - `bg` + `text`: açık zemin üstünde koyu metin (soft rozet). Metin
       *   olduğu için 4.5:1 borçlu (WCAG 1.4.3).
       * - `border`: yalnız **kenarlık ve nokta**. Metin değil, grafik sınır —
       *   yalnız 3:1 borçlu (WCAG 1.4.11).
       * - `solid`: koyu zemin üstünde **beyaz metin** (solid rozet). Metin
       *   zemini olduğu için 4.5:1 borçlu.
       *
       * `solid` ayrı bir slot çünkü `border`'ı zemin olarak kullanmak tam da
       * bu iki borcu karıştırıyordu: 3:1'lik bir kenarlık rengi 4.5:1'lik bir
       * metin zemini yerine geçince dört durum (draft/pending/changes/
       * published) AA'dan düşüyordu. Ölçüm ve gerekçe AGENTS.md'de.
       */
      status: {
        draft: { bg: null, text: null, border: null, solid: null },
        pending: { bg: null, text: null, border: null, solid: null },
        changes: { bg: null, text: null, border: null, solid: null },
        published: { bg: null, text: null, border: null, solid: null },
        rejected: { bg: null, text: null, border: null, solid: null },
        paused: { bg: null, text: null, border: null, solid: null },
        expired: { bg: null, text: null, border: null, solid: null },
        archived: { bg: null, text: null, border: null, solid: null },
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
