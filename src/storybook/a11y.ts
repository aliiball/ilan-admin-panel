/**
 * Story seviyesinde axe muafiyetleri.
 *
 * Buradaki tek muafiyet **canvas artefaktı** içindir; bir component kusurunu
 * örtmek için asla kullanılmaz. Ayrım şu soruyla yapılır:
 *
 *   > İhlal uygulamada da doğar mı, yoksa yalnız story bir sayfanın yapamayacağı
 *   > şeyi yaptığı için mi doğuyor?
 *
 * Cevap "yalnız story"yse muafiyet doğru araçtır. Cevap "uygulamada da"ysa
 * component düzeltilir — Faz 2 kapanışında `scrollable-region-focusable`'ın
 * altısı da öyle çıktı (kaydırma kapları klavyeye kapalıydı) ve hiçbiri
 * muafiyet almadı.
 */

/**
 * Aynı landmark'ı tek canvas'ta birden çok kez çizen story'ler için.
 *
 * VariantsComparison ve "üç durumu yan yana göster" kalıbı bir component'in üç
 * kopyasını aynı anda çiziyor. Landmark sahibi bir component'te (AppShell'in
 * `<main>`'i, TopBar'ın `<header>`'ı, SidebarNav'ın `<nav aria-label="Ana
 * menü">`'sü, SellerPanel'in `<section aria-label="İlan sahibi">`'i) bu
 * kaçınılmaz olarak üç özdeş landmark üretir ve axe haklı olarak şikâyet eder.
 * Ama şikâyet ettiği şey **sayfa değil, katalog**: uygulamada bir AppShell, bir
 * TopBar, bir SidebarNav vardır. Landmark adları component'te sabit yazılı
 * olduğu için story kopyalara ayrı ad da veremez.
 *
 * **Bu muafiyet gerçek gerekliliği KAPATMAZ ve kapatmamalı.** Faz 3'ün
 * ekranlarında aynı sayfada gerçekten birden çok gezinme landmark'ı olacak
 * (SidebarNav'ın "Ana menü"sü + PageHeader'ın "Sayfa yolu" kırıntısı) ve
 * adlarının benzersizliği o ekranlarda GERÇEK bir gereklilik — ikisi bugün
 * farklı adlar taşıdığı için `landmark-unique` orada zaten geçiyor. Muafiyet
 * story bazında verildiği için Faz 3 ekranları kapıyı tam açık devralır:
 * **ekran story'lerine bunu eklemeyin.**
 *
 * @example
 * export const VariantsComparison: Story = {
 *   parameters: cokluKopyaLandmarkMuafiyeti,
 *   render: () => ...
 * }
 */
export const cokluKopyaLandmarkMuafiyeti = {
  a11y: {
    config: {
      rules: [
        { id: 'landmark-unique', enabled: false },
        { id: 'landmark-no-duplicate-banner', enabled: false },
        { id: 'landmark-no-duplicate-main', enabled: false },
      ],
    },
  },
} as const
