import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { AuthScreen } from './AuthScreen'

/** Gerçek kullanıcı bilgisi girmez: e-posta `.invalid`, parola uydurma. */
const ORNEK_EPOSTA = 'admin@ilanadmin.example.invalid'
const ORNEK_PAROLA = 'Deneme-Parola-2026'

const GIRIS_HATASI = 'E-posta veya parola hatalı.'

/**
 * `fatalError` mesajı ve ona eşlik eden destek kodu. Kod sabit yazılır
 * (`new Date()` YASAK — her koşuda yeniden çizmek Chromatic'i titretirdi); harf
 * ve rakam karışık, mono yazının basamak ayrımını (0/O, 1/l) görünür kılar.
 */
const FATAL_HATASI = 'İşleminiz kaydedilirken beklenmeyen bir hata oluştu. Tekrar deneyin.'
const DESTEK_KODU = 'ERR-5F3A-2C7B'

/** Türkçe regex'i küçük harfle yazma tuzağı: buton "Giriş yap", `/giriş yap/` eşleşmez. */
const GIRIS_BUTONU = 'Giriş yap'
const MARKA_ADI = 'İlan Yönetim Paneli'

/**
 * Parola alanı `getByRole` ile bulunamaz: `<input type="password">`'ün implicit
 * ARIA rolü **yoktur** (`type="email"` textbox'tır, parola değildir). Etiketle
 * sorgulanır.
 *
 * Regex, düz metin değil: `required` alanın etiketine `<span aria-hidden>*</span>`
 * ekliyor ve `getByLabelText` etiketin **textContent**'ine bakıyor (erişilebilir
 * ada değil) — yani gördüğü dize "Parola*". Erişilebilir ad hesabı `*`'ı eler,
 * `getByLabelText` elemez. Türkçe büyük harfle: `/^parola/` "Parola" ile eşleşmez.
 */
const PAROLA_ETIKETI = /^Parola/

const meta = {
  title: 'Screens/AuthScreen',
  component: AuthScreen,

  tags: ['stable'],

  parameters: {
    /*
      Preview varsayılanı `centered`; bu ekran 100dvh'lik tam sayfadır ve
      ortalanmış dar bir canvas'ta ne marka paneli ne de dikey ortalama görünür.
    */
    layout: 'fullscreen',

    docs: {
      description: {
        component:
          'Kabuğun **dışında** yaşayan tam sayfa: giriş, oturum sonu, 403, 404 ve beklenmeyen ' +
          'hata tek component’in beş modu. Faz 3’ün diğer on ekranından farklı olarak kendi ' +
          '`<h1>`’ini basar — sidebar, üst çubuk ve PageHeader yoktur, başlığı basacak başka ' +
          'kimse de yoktur. Yalnız `login` form gösterir; diğer dördü mesaj + tek bir eylem. ' +
          '**Düzen prop’u yoktur**: "centered card" ve "split brand panel" bir tercih değil, ' +
          'aynı ekranın iki genişlikteki hâlidir (kırılım 64rem). `forbidden` ve `notFound` ' +
          '"tekrar dene" **sunmaz** — 403’ü tekrar denemek aynı 403’ü verir; bu, ' +
          '`AsyncState.unauthorized`’ın `retryable: false` sabitiyle aynı karardır.',
      },
    },

    ai: {
      project: 'admin-panel',
      role: 'auth-screen',
      useWhen: [
        'Admin panele giriş ekranı gösterilirken',
        'Oturum süresi dolduğunda kullanıcı tekrar girişe yönlendirilirken',
        'Kullanıcı yetkisi olmayan bir rotaya girdiğinde (tam sayfa 403)',
        'Var olmayan bir rotada (404) veya beklenmeyen bir hatada tam sayfa mesaj gösterilirken',
      ],
      doNotUseWhen: [
        'Bir veri panelinin 403’ünde — kabuk ayaktayken AsyncState.unauthorized kullanın',
        'Sayfa içi hata/boş durumda — ErrorState veya EmptyState kullanın',
        'Kabuğun içindeki bir sayfanın başlığı için — PageHeader kullanın',
        'Ziyaretçi (Front Pages) girişi için — bu repo yalnız admin panelidir',
      ],
    },
  },

  /*
    TUZAK: meta.args'a konan her prop o dosyada tipini sabitler ve
    `exactOptionalPropertyTypes` açıkken story onu `undefined` ile geri alamaz
    (TS2375). `error`, `loading`, `onSubmit` ve `onPrimaryAction`'ın **yokluğu
    birer durum** (handler yoksa buton yok), bu yüzden hiçbiri burada değil.
    `mode` her story'de dolu ve yokluğu bir durum değil — tek meta arg'ı o.
  */
  args: {
    mode: 'login',
  },

  argTypes: {
    mode: {
      control: 'select',
      options: ['login', 'sessionExpired', 'forbidden', 'notFound', 'fatalError'],
    },
    loading: { control: 'boolean' },
    error: { control: 'text' },
    errorCode: { control: 'text' },
  },
} satisfies Meta<typeof AuthScreen>

export default meta

type Story = StoryObj<typeof meta>

/* ------------------------------------------------------------------ *
 * Brifing 3.5'in zorunlu durum story'leri
 * ------------------------------------------------------------------ */

export const Login: Story = {
  args: { onSubmit: fn() },
}

/** Kimlik doğrulanırken: alanlar kilitli, buton meşgul. */
export const LoginLoading: Story = {
  args: { loading: true, onSubmit: fn() },
}

export const LoginError: Story = {
  args: { error: GIRIS_HATASI, onSubmit: fn() },
}

export const SessionExpired: Story = {
  args: { mode: 'sessionExpired', onPrimaryAction: fn() },
}

/** 403. Tekrar deneme yok: aynı istek aynı 403'ü verir. */
export const Forbidden: Story = {
  args: { mode: 'forbidden', onPrimaryAction: fn() },
}

export const NotFound: Story = {
  args: { mode: 'notFound', onPrimaryAction: fn() },
}

/** Beklenmeyen hata — 403'ün aksine tekrar denemek **doğru** adımdır. */
export const FatalError: Story = {
  args: { mode: 'fatalError', onPrimaryAction: fn() },
}

/* ------------------------------------------------------------------ *
 * Düzen varyantları — prop değil, kırılım
 * ------------------------------------------------------------------ */

/**
 * Centered card: 64rem altında tek kolon, kart ortada, marka paneli yok.
 *
 * Marka paneline 320 pikselde yer yok; olsaydı kartı ya ezerdi ya da kullanıcıyı
 * giriş alanına ulaşmak için kaydırtırdı.
 */
export const CenteredCardMobile: Story = {
  args: { onSubmit: fn() },
  globals: { viewport: { value: 'mobile320' } },
}

/**
 * Split brand panel: 64rem üstünde iki kolon, solda dekoratif marka paneli.
 *
 * Panel `aria-hidden` — dar ekranda kaybolan bir metin bilgi taşıyamaz. Görsel
 * regresyonun ana yakalama noktası; `mobile320` ile yan yana bakılmalı.
 */
export const SplitBrandPanelDesktop: Story = {
  args: { onSubmit: fn() },
  globals: { viewport: { value: 'desktop1440' } },
}

/** Mesaj modu da aynı kırılımı paylaşır: kabuğun dışında, kartla aynı düzende. */
export const ForbiddenSplitBrandPanel: Story = {
  args: { mode: 'forbidden', onPrimaryAction: fn() },
  globals: { viewport: { value: 'desktop1440' } },
}

/* ------------------------------------------------------------------ *
 * Ölçümler
 * ------------------------------------------------------------------ */

/**
 * Gönderim `onSubmit`'i **bir kez** ve tam payload'la çağırmalı.
 *
 * Çağrı sayısı ölçülüyor: form gönderimi hem butonun `click`'i hem `<form>`'un
 * `submit`'i üzerinden iki kez bağlanabilir ve iki kez giriş denemesi göndermek
 * hesabı kilitleyebilecek bir hatadır.
 */
export const SubmitReportsCredentialsOnce: Story = {
  args: { onSubmit: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.type(canvas.getByRole('textbox', { name: 'E-posta' }), ORNEK_EPOSTA)
    await userEvent.type(canvas.getByLabelText(PAROLA_ETIKETI), ORNEK_PAROLA)
    await userEvent.click(canvas.getByRole('button', { name: GIRIS_BUTONU }))

    await expect(args.onSubmit).toHaveBeenCalledTimes(1)
    await expect(args.onSubmit).toHaveBeenCalledWith({
      email: ORNEK_EPOSTA,
      password: ORNEK_PAROLA,
    })
  },
}

/**
 * Hata duyurulmalı ve **iki alan da** kırmızı (geçersiz) işaretlenmeli.
 *
 * `role="alert"`: mesaj ekran okuyucuya **anında** gider, kullanıcı sekmeyle
 * oraya varana kadar beklemez. Alanın kendi `error` prop'u bunu yapamaz —
 * `Field.Error` düz bir `<div>` ve yalnız `aria-describedby` ile bağlı (Base UI
 * `FieldError.js` ile doğrulandı), yani ancak odak alana gelince okunur.
 *
 * Boşluk **KAPANDI**: eskiden yalnız `aria-invalid` ölçülebiliyordu çünkü
 * `data-invalid` yalnız `error` prop'u doluyken doğuyordu — ve o prop mesajı
 * kutunun altına da yazıp aynı cümleyi üç kez okuturdu. `InputProps.invalid`
 * (mesajsız geçersiz) eklendikten sonra kutular **kırmızı kenarlık** alıyor;
 * artık kenarlığın kaynağı olan `data-invalid` DOM'dan gerçekten ölçülebiliyor.
 *
 * İki alan da işaretli, yalnız biri değil: yalnız parolayı kırmızı yapmak "bu
 * e-posta kayıtlı"yı sızdırırdı. Alan altında metin YOK (mesaj yalnız Alert'te).
 */
export const LoginErrorAnnouncesAndMarksFields: Story = {
  args: { error: GIRIS_HATASI, onSubmit: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('alert')).toHaveTextContent(GIRIS_HATASI)

    const eposta = canvas.getByRole('textbox', { name: 'E-posta' })
    const parola = canvas.getByLabelText(PAROLA_ETIKETI)

    /* aria-invalid: ekran okuyucuya geçersizliği bildiren işaret. */
    await expect(eposta).toHaveAttribute('aria-invalid', 'true')
    await expect(parola).toHaveAttribute('aria-invalid', 'true')

    /*
      Kırmızı kenarlık artık DOM'dan ölçülebiliyor: kenarlığı çizen kural
      `&[data-invalid]` ve o işaret kutudadır (input'un atası). İki kutuda da
      bulunması, "iki alan da kırmızı" iddiasının görsel karşılığıdır.
    */
    await expect(eposta.closest('[data-invalid]')).not.toBeNull()
    await expect(parola.closest('[data-invalid]')).not.toBeNull()

    /* Mesaj yalnız Alert'te: alanların altında ikinci/üçüncü kopya YOK. */
    await expect(eposta).not.toHaveAttribute('aria-describedby')
    await expect(parola).not.toHaveAttribute('aria-describedby')
  },
}

/**
 * `loading` iken buton **adını korumalı**.
 *
 * Etiket bir kez `visibility: hidden` ile gizleniyordu; erişilebilir ad hesabı o
 * alt ağacı yok saydığı için buton adsız kalıyor, ekran okuyucu "düğme, meşgul"
 * deyip hangi düğme olduğunu söylemiyordu (Faz 1'de `opacity: 0`'a çevrildi).
 * Buton **adıyla** sorgulanıyor: gizleme yöntemi geri alınırsa bu test kırılır.
 *
 * `toBeDisabled()` burada **doğru araç**: Button gerçek bir `<button>` render
 * ediyor ve native `disabled` taşıyor — Base UI'ın `<span role="checkbox">`i
 * değil.
 */
export const LoadingKeepsButtonNameAndLocksFields: Story = {
  args: { loading: true, onSubmit: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const buton = canvas.getByRole('button', { name: GIRIS_BUTONU })
    await expect(buton).toBeDisabled()
    await expect(buton).toHaveAttribute('aria-busy', 'true')

    await expect(canvas.getByRole('textbox', { name: 'E-posta' })).toBeDisabled()
    await expect(canvas.getByLabelText(PAROLA_ETIKETI)).toBeDisabled()
  },
}

/**
 * `onSubmit` yoksa gönderilemeyen form için buton sunulmaz.
 *
 * `ErrorState`'in `onRetry`'siyle aynı kural: basınca hiçbir şey olmayan buton,
 * olmayan butondan kötüdür. Alanlar duruyor — kullanıcı yazabilir, ama ekran
 * ona sonuçsuz bir eylem vaat etmez.
 */
export const LoginWithoutHandlerHasNoSubmitButton: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('textbox', { name: 'E-posta' })).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { hidden: true })).not.toBeInTheDocument()
  },
}

/** Aynı kural mesaj modlarında: `onPrimaryAction` yoksa eylem yok. */
export const ForbiddenWithoutHandlerHasNoAction: Story = {
  args: { mode: 'forbidden' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('heading', { level: 1 })).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { hidden: true })).not.toBeInTheDocument()
  },
}

/**
 * 403 tekrar denemeyi **önermez**; tek eylemi yetkisi olan yere dönmektir.
 *
 * `AsyncState.unauthorized`'ın `retryable: false` sabitiyle aynı karar, farklı
 * kanal: o bir veri panelinin 403'ü, bu sayfanın 403'ü.
 *
 * Olumlu iddia olumsuzla birlikte yazılıyor: yalnız "Panele dön var" demek,
 * yanına bir "Tekrar dene" eklendiğinde de geçerdi.
 */
export const ForbiddenOffersNoRetry: Story = {
  args: { mode: 'forbidden', onPrimaryAction: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: 'Panele dön' })).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: /Tekrar dene/ })).not.toBeInTheDocument()
  },
}

/**
 * Ekranın `<h1>`'i tektir ve kabuğun dışındadır.
 *
 * Diğer on ekran `<h2>` ile başlar (onların `<h1>`'i PageHeader'ındır); bu ekran
 * kendi başlığını basar. Sayı da ölçülüyor: marka panelinin `<p>`'si başlığa
 * dönerse ya da mesaj bloğu ikinci bir `<h1>` eklerse test kırılır.
 */
export const ScreenOwnsTheSingleH1: Story = {
  args: { onSubmit: fn() },
  globals: { viewport: { value: 'desktop1440' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Sayı ayrı, kimlik ayrı: "bir tane var" ile "doğru olan var" iki iddiadır. */
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Yönetim paneline giriş' }),
    ).toBeInTheDocument()

    /*
      Marka paneli dekoratiftir. İddia `queryByText(...).not.toBeInTheDocument()`
      diye YAZILAMAZ: `queryByText` `aria-hidden` alt ağacını dışlamaz — metin
      DOM'da duruyor ve iddia her koşulda düşerdi. Gizli olan erişilebilirlik
      ağacındaki hâli, ölçüm de o yönden yapılır: elemanı bul, gizli atasını
      doğrula.
    */
    const markaAdi = canvas.getByText(MARKA_ADI)
    await expect(markaAdi.closest('[aria-hidden="true"]')).not.toBeNull()
  },
}

/**
 * Marka paneli `aria-hidden` ve içinde odaklanılabilir öğe **yok**.
 *
 * Rol/metin sorgusuyla ölçülemez: `queryByRole` `aria-hidden` alt ağacını zaten
 * dışlar, yani iddia sessizce dişsizleşirdi. Doğru ölçüm DOM sorgusudur.
 */
export const BrandPanelHasNoFocusableContent: Story = {
  args: { onSubmit: fn() },
  globals: { viewport: { value: 'desktop1440' } },
  play: async ({ canvasElement }) => {
    const gizliOdak = canvasElement.querySelector(
      '[aria-hidden="true"] a, [aria-hidden="true"] button, [aria-hidden="true"] input, [aria-hidden="true"] [tabindex]',
    )
    await expect(gizliOdak).toBeNull()
  },
}

/**
 * 320 pikselde yatay taşma olmamalı — uzun bir hata cümlesi ve uzun bir başlıkla.
 *
 * Dikey sıralamanın kendisi ekran görüntüsünün işi (medya sorgusu viewport'a
 * bağlıdır, dar bir decorator kabında play ile ölçülemez); play yalnız taşmayı
 * ölçebilir.
 */
export const NoHorizontalOverflowOnNarrowScreen: Story = {
  args: {
    error:
      'Bu e-posta adresiyle ilişkilendirilmiş yönetici hesabı bulunamadı veya parola son ' +
      'değiştirmeden sonra güncellenmemiş olabilir.',
    onSubmit: fn(),
  },
  globals: { viewport: { value: 'mobile320' } },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
  },
}

/**
 * Mesaj modlarında `error`, modun sabit açıklamasının **yerine geçer**.
 *
 * Sunucunun somut sebebi ("Bu ilanı görme yetkiniz yok") genel cümleden iyidir;
 * sessizce yutulması ise sözleşmenin verdiği bilgiyi çöpe atardı.
 *
 * Olumlu iddia olumsuzla birlikte: genel cümlenin *gitmiş* olduğu da ölçülüyor.
 */
export const ForbiddenErrorReplacesDefaultDescription: Story = {
  args: {
    mode: 'forbidden',
    error: 'Bu ilanı görme yetkiniz yok: ilan başka bir bölgenin moderasyon kuyruğunda.',
    onPrimaryAction: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText(/başka bir bölgenin moderasyon kuyruğunda/)).toBeInTheDocument()
    await expect(canvas.queryByText(/Hesabınızın rolü bu sayfayı/)).not.toBeInTheDocument()
  },
}

/**
 * `fatalError`'da destek kodu, hata mesajının yanında görünür ve **seçilebilir**.
 *
 * Faz 3'te bu kanalsızdı: `error` düz `string` olduğu için `UiError.code`
 * karşılığı yoktu ve destek kodu gösterilemiyordu (AGENTS'ta açık madde).
 * Ayrı `errorCode` alanı boşluğu kapattı.
 *
 * İki şey ölçülüyor: kod DOM'da (hata mesajıyla birlikte) ve `user-select: all`
 * ile tek tıkla seçilebilir — kullanıcı kodu kopyalayıp destek ekibine
 * okuyabilmeli. Seçilebilirlik `getComputedStyle` ile ölçülür (StatusBadge'in
 * hesaplanmış stil emsali); mono yazı gibi görsel iddiaların play'de karşılığı
 * budur.
 */
export const FatalErrorWithSupportCode: Story = {
  args: {
    mode: 'fatalError',
    error: FATAL_HATASI,
    errorCode: DESTEK_KODU,
    onPrimaryAction: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Hata mesajı ve kod bir arada: kod, mesajın yerine değil yanına gelir. */
    await expect(canvas.getByText(FATAL_HATASI)).toBeInTheDocument()

    /* getByText kodu saran <span>'i döndürür (p'nin textContent'i etiketi de içerir). */
    const kod = canvas.getByText(DESTEK_KODU)
    await expect(kod).toBeInTheDocument()

    /* Seçilebilir: `user-select: all` — kopyalanıp destek ekibine okunabilmeli. */
    await expect(getComputedStyle(kod).userSelect).toBe('all')
  },
}
