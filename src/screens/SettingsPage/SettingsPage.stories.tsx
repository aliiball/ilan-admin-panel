import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import {
  ALL_ADMIN_PERMISSIONS,
  AdminPermission,
  AdminRole,
  ROLE_PERMISSIONS,
} from '../../types/domain'
import { ADMIN_PERMISSION_LABEL, ADMIN_ROLE_LABEL } from '../../domain/labels'
import { SettingsPage } from './SettingsPage'

const TUM_ROLLER: AdminRole[] = Object.values(AdminRole)

/**
 * Sunucudaki **kayıtlı** izinler: fabrika ayarından bir hücre farklı — moderatöre
 * kategori yönetimi verilmiş ve bu kaydedilmiş.
 *
 * Bu tek fark `savedRolePermissions`'ın ölçülebilir olmasının şartı. Taban kayıtlı
 * hâl olduğunda o hücre "değişmedi", taban `ROLE_PERMISSIONS` olduğunda "eklendi"
 * görünür; ikisi aynı olsaydı prop'un varlığı hiçbir şeyi değiştirmez ve
 * `PermissionDiff` story'si ölçülmemiş bir iddia olurdu.
 *
 * `ROLE_PERMISSIONS`'tan türetiliyor, elle kopyalanmıyor: domain değişip buraya
 * yansımazsa testler yanlış bir tabana karşı geçerdi.
 */
const KAYITLI: Record<AdminRole, readonly AdminPermission[]> = {
  ...ROLE_PERMISSIONS,
  [AdminRole.Moderator]: [...ROLE_PERMISSIONS[AdminRole.Moderator], AdminPermission.CategoryManage],
}

/** Kaydedilmemiş taslak: kayıtlı hâlden tek fark — moderatörden ilan arşivleme alınmış. */
const TASLAK: Record<AdminRole, readonly AdminPermission[]> = {
  ...KAYITLI,
  [AdminRole.Moderator]: KAYITLI[AdminRole.Moderator].filter(
    (izin) => izin !== AdminPermission.ListingArchive,
  ),
}

/**
 * Bir rol × izin hücresini DOM'dan bulur.
 *
 * Satır başlığından satıra, satırdan sütun sırasına gidiyor: hücreyi metniyle
 * aramak ("Var" yazan hücre) 132 eşleşme döndürürdü. `getAllByRole('cell')` yalnız
 * `<td>`leri sayar, satır başlığı (`<th scope="row">`) sıraya girmez — yani indeks
 * doğrudan `roles` sırasıdır. RolePermissionMatrix'in kendi story'lerindeki
 * helper'ın aynısı; ölçülen DOM aynı.
 */
function hucre(
  canvasElement: HTMLElement,
  role: AdminRole,
  permission: AdminPermission,
): HTMLElement {
  const canvas = within(canvasElement)
  const satir = canvas
    .getByRole('rowheader', { name: ADMIN_PERMISSION_LABEL[permission] })
    .closest('tr')

  if (satir === null) throw new Error(`"${ADMIN_PERMISSION_LABEL[permission]}" satırı bulunamadı`)

  const sutunSirasi = TUM_ROLLER.indexOf(role)
  const bulunan = within(satir).getAllByRole('cell')[sutunSirasi]

  if (bulunan === undefined) {
    throw new Error(`"${ADMIN_ROLE_LABEL[role]}" sütunu (${sutunSirasi}) satırda yok`)
  }

  return bulunan
}

/*
  ─────────────────────────────────────────────────────────────────────────────
  BULUNAN KUSUR — `RadioGroup` primitive'inde seçeneklerin erişilebilir adı
  bozuk. RAPOR EDİLDİ, bu turda DÜZELTİLMEDİ (ekran `src/components/`'e yazmıyor).

  `RadioGroup`, `label` verildiğinde FieldShell üzerinden bir `Field.Root` +
  `Field.Label` kuruyor. Base UI'da `Field.Root` bir `LabelableProvider` render
  ediyor ve `Field.Label` kendi id'sini oraya yazıyor (`useLabel` →
  `setContextLabelId`). `RadioGroup` ile `Radio` **kendi labelable kapsamlarını
  açmıyor** — ikisi de aynı context'i okuyor:

    RadioGroup.js:149  ariaLabelledby = elementProps['aria-labelledby'] ?? labelId ?? …
    RadioRoot.js:120   useAriaLabelledBy(ariaLabelledByProp, labelId, inputRef, …)
    useAriaLabelledBy  ariaLabelledBy = explicitAriaLabelledBy ?? labelId ?? fallback

  Yani grubun `labelId`'si her radyoya da iniyor ve **sarmalayan `<label>`
  fallback'ini eziyor**: "Kendi temam" grubundaki üç seçeneğin üçü de "Kendi
  temam" diye okunuyor — ekran okuyucu kullanıcısı temaları birbirinden ayırt
  edemiyor. Base UI'ın bu iş için beklediği yapı seçenek başına `Field.Item`
  (RadioRoot zaten `useFieldItemContext` okuyor); bizim primitive'imiz çıplak bir
  `<label>` kullanıyor.

  Neden bugüne kadar görülmedi: `RadioGroup.stories.tsx`'te hiç play testi yok ve
  bu ekran primitive'in **ilk gerçek tüketicisi**. axe de yakalamaz — ihlal "ad
  yok" değil, "ad yanlış". AGENTS.md'nin "ikisi ancak yeni bir tüketici geldiğinde
  görüldü" ailesinin aynısı.

  Bu yüzden aşağıdaki testler seçenekleri **adlarıyla aramıyor**: bozuk bir adı
  ölçen test, kusuru sabitler — primitive düzeltilince düşer ve düzelten kişi
  onu geri "düzeltmeye" çalışır. Doğru adı ölçen bir test ise bugün kırmızı
  olurdu. Üçüncü yol seçildi: ad iddiası hiç kurulmuyor, seçenek görünür
  metninden bulunuyor. Primitive düzeltilince buraya
  `toHaveAccessibleName(/^Sıcak Amber/)` eklenmeli.
  ─────────────────────────────────────────────────────────────────────────────
*/

/**
 * Bir tema seçeneğinin radyo düğmesini görünür metninden bulur.
 *
 * Erişilebilir adla aranmıyor — gerekçe yukarıdaki kusur notunda. Seçeneğin
 * görünür etiketinden kendi `<label>`'ına, oradan radyoya iniliyor; `getByText`
 * yalnız doğrudan metin çocuklarına baktığı için açıklama metni karışmıyor.
 */
function temaSecenegi(grup: HTMLElement, ad: string): HTMLElement {
  const etiket = within(grup).getByText(ad).closest('label')

  if (etiket === null) throw new Error(`"${ad}" tema seçeneğinin etiketi bulunamadı`)

  return within(etiket).getByRole('radio')
}

/**
 * Base UI popup'ının kapanış animasyonu bitene kadar bekler.
 *
 * a11y kapısı `'error'` ve play bittiğinde axe çalışıyor. Base UI popup açıkken
 * odak tuzağı için `aria-hidden="true"` + `tabindex="0"` taşıyan koruma span'leri
 * (`data-base-ui-focus-guard`) basıyor; kapanma animasyonu sürerken bitirilen
 * story'de bunlar DOM'da kalıyor ve axe `aria-hidden-focus` görüyor — story
 * yazı-tura düşüyor. `Select.stories.tsx`'in kalıbı. ConfirmDialog `Modal` →
 * Base UI `Dialog` → `FloatingFocusManager` zinciriyle aynı korumaları basıyor.
 */
async function popupKapanmasiniBekle(): Promise<void> {
  await waitFor(() =>
    expect(document.querySelector('[data-base-ui-focus-guard]')).not.toBeInTheDocument(),
  )
}

const meta = {
  title: 'Screens/SettingsPage',
  component: SettingsPage,

  parameters: {
    /*
      Ekran bir kabuk değil, `AppShell`'in `<main>`'ine konan gövde: kendi sayfa
      dolgusunu vermiyor. `padded` kabuğun vereceği dolguyu taklit ediyor;
      `fullscreen` matrisin kenarlığını canvas'ın kenarına yapıştırırdı.
    */
    layout: 'padded',
    docs: {
      description: {
        component:
          'Rol izin matrisi ve tema seçimini birleştirir. **`ThemeSelector` yok**: brifing 2.9 ' +
          'onu "türetilen componentler" arasında sayıyor ama brifingin kendi kataloğunda ' +
          '(3.3 + 3.4) yok ve repoda da yok — tema seçimi `RadioGroup` ile kuruldu. ' +
          '`diff`in tabanı `savedRolePermissions`: diff "kaydetmeden önce neyi değiştiriyorum" ' +
          'sorusunu cevaplar, "fabrika ayarından farkım ne" sorusunu değil. Yetki `disabled` ile ' +
          'anlatılmıyor — `permission:manage` yoksa matris `readOnly`, `theme:setDefault` yoksa ' +
          'sistem varsayılanı kontrolü hiç render edilmiyor (değeri okunur kalıyor).',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'settings-screen',
      useWhen: [
        'Rol izinleri ve tema ayarları tek ekranda birleştirilecekse',
        'İzin taslağı kaydedilmeden önce gözden geçirilecekse — diff görünümü',
      ],
      doNotUseWhen: [
        'Kullanıcının settings:view izni yoksa — sayfayı hiç render etmeyin',
        'Tek bir kullanıcının rolü atanacaksa — UserDetailPage kullanın',
      ],
    },
  },

  /*
    `savedRolePermissions`, `saving` ve `dirty` meta.args'ta YOK ve bu bilinçli:
    üçünün de **yokluğu bir durum**. `exactOptionalPropertyTypes` açıkken
    StoryObj<typeof meta> meta.args'ın çıkarılan tipini prop tipiyle kesiştiriyor,
    dolayısıyla meta'ya konan her prop o dosyada geri alınamaz olur (TS2375) —
    `savedRolePermissions: undefined` yazamayan bir dosyada
    `PermissionDiffWithoutSavedBaseline` yazılamazdı. Faz 2'de beş component bu
    duvara çarptı. Zorunlu prop'ların (handler'lar dahil) yokluğu bir durum
    olamaz, onlar meta'da.
  */
  args: {
    rolePermissions: KAYITLI,
    currentTheme: 'corporate-blue',
    systemDefaultTheme: 'corporate-blue',
    canManagePermissions: true,
    canManageDefaultTheme: true,
    onPermissionChange: fn(),
    onThemeChange: fn(),
    onSystemDefaultThemeChange: fn(),
    onSave: fn(),
    onReset: fn(),
  },

  argTypes: {
    rolePermissions: { control: false },
    savedRolePermissions: { control: false },
  },
} satisfies Meta<typeof SettingsPage>

export default meta

type Story = StoryObj<typeof meta>

/*
  ─────────────────────────────────────────────────────────────────────────────
  `Loading` story'si YAZILAMADI — brifing 3.5 onu SettingsPage için zorunlu
  sayıyor ama `SettingsPageProps`'ta yükleme kanalı YOK.

  Sözleşmede `state: AsyncState<…>` yok; `saving` ve `dirty` var, ikisi de
  "veri geldi mi" sorusunu değil "gönderdiğim değişiklik uçuyor mu" sorusunu
  cevaplıyor. `rolePermissions`, `currentTheme` ve `systemDefaultTheme` zorunlu
  prop: ekran onlarsız render edilemez, dolayısıyla "henüz yüklenmedi" hâlini
  ifade edecek bir değer de yok.

  Uydurma prop eklenmedi (`state`, `loading`) — sözleşmeye dokunmak bu turun
  kapsamı dışında ve iskeletini kendi uyduran bir ekran, veri gelmediğinde
  "izin yok" demekle aynı yalanı söylerdi. Emsal: PromotionFlagsPanel ve
  SellerPanel'in yazılmayan Loading/Error story'lerinin gerekçesi de kendi story
  dosyalarında yorumlu duruyor.

  Aynı sebeple brifing 2.9'un `error`, `saved` ve `permissionConflict` ekran
  durumları da yok. (3.5 bunları SettingsPage için zaten istemiyor; 2.9 istiyor.)
  Kanal açılırsa story tek satırla eklenir.
  ─────────────────────────────────────────────────────────────────────────────
*/

// --- Zorunlu state story'leri -----------------------------------------------

/** Yüklendi, yetkili, taslak kayıtlıyla aynı: kaydedilecek bir şey yok. */
export const Success: Story = {
  args: { savedRolePermissions: KAYITLI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /*
      Düzenlenebilir matris: 4 rol × 33 izin. Sayı domain'den okunuyor, elle
      yazılmıyor — 34'üncü izin eklendiğinde bu iddia da onunla birlikte büyür.
    */
    await expect(canvas.getAllByRole('checkbox')).toHaveLength(
      TUM_ROLLER.length * ALL_ADMIN_PERMISSIONS.length,
    )

    /* Değişiklik yokken Kaydet sonuçsuz kalırdı — "şu an yapılamaz", yetki değil. */
    await expect(canvas.getByRole('button', { name: 'Kaydet' })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: 'Varsayılana dön' })).toBeEnabled()
  },
}

/** Taslak kayıtlıdan farklı: Kaydet açılır ve fark söylenir. */
export const Dirty: Story = {
  args: { rolePermissions: TASLAK, savedRolePermissions: KAYITLI, dirty: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: 'Kaydet' })).toBeEnabled()
    await expect(canvas.getByText('Kaydedilmemiş değişiklikler var.')).toBeInTheDocument()
  },
}

/**
 * Kaydetme sürüyor: hücreler kilitli, sebebi söyleniyor.
 *
 * `toBeDisabled()` kutularda **kullanılmıyor**: Base UI Checkbox bir
 * `<span role="checkbox">` ve kilidini `aria-disabled` ile bildiriyor; native
 * matcher kutu gerçekten kilitliyken de düşer. Matcher yanlıştır, component değil.
 * Kaydet gerçek bir `<button>` olduğu için orada native matcher doğru araç.
 */
export const Saving: Story = {
  args: { rolePermissions: TASLAK, savedRolePermissions: KAYITLI, dirty: true, saving: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    for (const kutu of canvas.getAllByRole('checkbox')) {
      await expect(kutu).toHaveAttribute('aria-disabled', 'true')
    }

    await expect(canvas.getByRole('table')).toHaveAttribute('aria-busy', 'true')
    /* Beklenen şey söylenmeli: kullanıcı beklediğini bilmeli, yetkisini sorgulamamalı. */
    await expect(canvas.getByRole('status')).toHaveTextContent('İzinler kaydediliyor')

    await expect(canvas.getByRole('button', { name: 'Kaydet' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    await expect(canvas.getByRole('button', { name: 'Varsayılana dön' })).toBeDisabled()
  },
}

/**
 * Destek / moderatör hâli: ne `permission:manage` ne `theme:setDefault` var.
 *
 * **`AsyncState.unauthorized` DEĞİL** — o kanal bu sözleşmede yok ve olsaydı da
 * başka bir şeyi anlatırdı: `unauthorized` "veriyi göremezsin" der, buradaki
 * durum "veriyi görürsün, değiştiremezsin". Brifing 2.9 rol matrisini ve sistem
 * varsayılanını **görünen veri** sayıyor; kısıtladığı şey yalnızca eylemler.
 *
 * Yetki `disabled` ile anlatılmıyor: matris `readOnly`, sistem varsayılanı
 * kontrolü hiç yok (değeri okunur duruyor), Kaydet/Varsayılana dön hiç yok.
 */
export const Unauthorized: Story = {
  args: {
    savedRolePermissions: KAYITLI,
    canManagePermissions: false,
    canManageDefaultTheme: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Kilitli kutu değil, hiç kutu. Tablo ise duruyor: "bu rol ne yapabilir" cevabı. */
    await expect(canvas.queryAllByRole('checkbox')).toHaveLength(0)
    await expect(canvas.getByRole('table')).toBeInTheDocument()

    /* Yetkisiz eylem `disabled` verilmez, hiç render edilmez. */
    await expect(canvas.queryByRole('button', { name: 'Kaydet' })).not.toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: 'Varsayılana dön' })).not.toBeInTheDocument()
    await expect(canvas.queryByRole('switch')).not.toBeInTheDocument()

    await userEvent.click(canvas.getByRole('tab', { name: 'Görünüm' }))

    /* Kendi teması her rolde var (`theme:manage`). */
    await expect(await canvas.findByRole('radiogroup', { name: 'Kendi temam' })).toBeInTheDocument()

    /* Sistem varsayılanı: kontrol yok, değer okunur. */
    await expect(
      canvas.queryByRole('radiogroup', { name: 'Sistem varsayılan teması' }),
    ).not.toBeInTheDocument()

    /*
      Değer, terimin `<dd>` kardeşinden okunuyor. Düz `getByText('Kurumsal Mavi')`
      **iki** eşleşme döndürürdü: ad–değer çiftinin değeri ve "Kendi temam"
      grubundaki aynı adlı seçenek. Aynı metnin iki kez göründüğü yerde metin
      sorgusu tek başına neyi ölçtüğünü söylemez.
    */
    const terim = canvas.getByText('Sistem varsayılan teması')
    await expect(terim.tagName).toBe('DT')
    await expect(terim.nextElementSibling).toHaveTextContent('Kurumsal Mavi')
  },
}

// --- Zorunlu düzen varyantları ----------------------------------------------

/**
 * Düzen: salt okunur.
 *
 * Args'ı `Unauthorized` ile aynı — bu ekranda "salt okunur düzen" ile "yetkisiz
 * durum" aynı koşuldan doğuyor. İkisi ayrı story çünkü işleri ayrı: brifing 3.5
 * ikisini de ayrı ayrı zorunlu kılıyor, bu story düzene bakılan yer,
 * `Unauthorized` ise iddiaları ölçen yer.
 */
export const ReadOnly: Story = {
  args: {
    savedRolePermissions: KAYITLI,
    canManagePermissions: false,
    canManageDefaultTheme: false,
  },
}

/** Düzen: düzenlenebilir. superAdmin, taslak temiz. */
export const Editable: Story = {
  args: { savedRolePermissions: KAYITLI },
}

/**
 * Düzen: izin farkı — taban **kayıtlı** izinler.
 *
 * İddia ölçülüyor: moderatörün kategori yönetimi `KAYITLI`'da var, dolayısıyla
 * "değişmedi" görünmeli; taslakta alınan ilan arşivleme ise "kaldırıldı".
 * Aynı kurulumun `savedRolePermissions`'sız hâli için
 * `PermissionDiffWithoutSavedBaseline`'a bakın — **farklı** sonuç verir, prop'un
 * varlığı böylece ölçülmüş olur.
 */
export const PermissionDiff: Story = {
  args: { rolePermissions: TASLAK, savedRolePermissions: KAYITLI, dirty: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('switch', { name: 'Değişiklikleri gözden geçir' }))

    /*
      Kayıtlıda zaten olan izin değişmiş görünmemeli. İki iddia birlikte
      gerekiyor: "Var" tek başına "Var (eklendi)" ile de eşleşir (alt dize araması).
    */
    const kategori = await waitFor(() =>
      hucre(canvasElement, AdminRole.Moderator, AdminPermission.CategoryManage),
    )
    await expect(kategori).toHaveTextContent('Var')
    await expect(kategori).not.toHaveTextContent('eklendi')

    /* Taslakta alınan tek izin. */
    await expect(
      hucre(canvasElement, AdminRole.Moderator, AdminPermission.ListingArchive),
    ).toHaveTextContent('Yok (kaldırıldı)')

    /* Tek hücre farklı: taban kayıtlı hâl. */
    await expect(canvas.getByText(/^1 hücre/)).toBeInTheDocument()

    /* `diff` düzenlenemez: karar verilen yer, düzeltilen yer değil. */
    await expect(canvas.queryAllByRole('checkbox')).toHaveLength(0)
  },
}

/**
 * Aynı taslak, `savedRolePermissions` **verilmeden**: matris `ROLE_PERMISSIONS`'a
 * düşer ve diff "fabrika ayarından farkım ne" sorusunu cevaplar.
 *
 * `PermissionDiff` ile yan yana okunmalı: aynı `rolePermissions` iki farklı sonuç
 * veriyor (1 hücre yerine 2), çünkü moderatörün kayıtlı kategori yönetimi burada
 * "eklendi" sayılıyor. Faz 2'de taban domain sabitine gömülüydü ve bu, ilk
 * kayıttan sonra "hiçbir şey değişmemişken değişmiş hücreler" gösteriyordu — diff
 * sessizce yalan söylüyordu. Bu story o yalanın nasıl göründüğünü sabitliyor.
 */
export const PermissionDiffWithoutSavedBaseline: Story = {
  args: { rolePermissions: TASLAK, dirty: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('switch', { name: 'Değişiklikleri gözden geçir' }))

    /* Kayıtlı olan izin burada "eklendi" görünüyor — taban artık fabrika ayarı. */
    const kategori = await waitFor(() =>
      hucre(canvasElement, AdminRole.Moderator, AdminPermission.CategoryManage),
    )
    await expect(kategori).toHaveTextContent('Var (eklendi)')

    await expect(
      hucre(canvasElement, AdminRole.Moderator, AdminPermission.ListingArchive),
    ).toHaveTextContent('Yok (kaldırıldı)')

    /* İki hücre farklı: `PermissionDiff` bir tane diyordu. Prop ölçüldü. */
    await expect(canvas.getByText(/^2 hücre/)).toBeInTheDocument()
  },
}

// --- Viewport ---------------------------------------------------------------

/** 320 pikselde izin sütunu yapışkan kalır; rol sütunları kaydırılarak gezilir. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { savedRolePermissions: KAYITLI },
}

export const Tablet: Story = {
  globals: { viewport: { value: 'tablet768' } },
  args: { savedRolePermissions: KAYITLI },
}

export const Desktop: Story = {
  globals: { viewport: { value: 'desktop1440' } },
  args: { savedRolePermissions: KAYITLI },
}

// --- Ölçümler ---------------------------------------------------------------

/**
 * Matris 40rem taban genişliğinde ve sayfa 320 pikselde yatay kaydırmamalı:
 * taşan tablo kendi kabında kaydırılır, sayfayı taşırmaz.
 *
 * Yalnız yatay taşma ölçülüyor — dikey sıralamanın kendisi ekran görüntüsünün
 * işi, çünkü medya sorgusu viewport'a bağlıdır, kabın genişliğine değil.
 */
export const NoHorizontalOverflow: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { savedRolePermissions: KAYITLI },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
  },
}

/**
 * Anahtarın erişilebilir adı yalnız etiketi olmalı.
 *
 * Base UI Switch `<span role="switch">` + gizli input render ediyor ve gizli
 * input'un `.labels`'ından sarmalayan `<label>`'ı bulup `aria-labelledby`'yi ona
 * bağlıyor: ad label'ın **tüm** metninden hesaplanıyor. İpucu
 * `SwitchProps.description`'a konsaydı anahtarın adı "Değişiklikleri gözden geçir
 * Açıkken taslağınız kayıtlı izinlerle karşılaştırılır…" olurdu — bu story ipucunun
 * anahtarın kardeşi olarak kaldığını sabitliyor.
 */
export const ReviewSwitchNameIsJustTheLabel: Story = {
  args: { rolePermissions: TASLAK, savedRolePermissions: KAYITLI, dirty: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('switch')).toHaveAccessibleName('Değişiklikleri gözden geçir')

    /* İpucu ekranda duruyor, sadece adın içinde değil. */
    await expect(
      canvas.getByText(/Açıkken taslağınız kayıtlı izinlerle karşılaştırılır/),
    ).toBeInTheDocument()
  },
}

/**
 * İpucu, diff'in tabanını prop'un varlığına göre söylemeli.
 *
 * `savedRolePermissions` yokken "kayıtlı izinlerle" demek yalan olurdu: taban
 * `ROLE_PERMISSIONS`, yani fabrika ayarı. İki cümlenin karışması diff'i okunmaz
 * yapardı — kullanıcı hangi soruyu sorduğunu bilmeli.
 */
export const ReviewHintNamesItsBaseline: Story = {
  args: { rolePermissions: TASLAK, dirty: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      canvas.getByText(/Açıkken taslağınız varsayılan izinlerle karşılaştırılır/),
    ).toBeInTheDocument()
    await expect(canvas.queryByText(/kayıtlı izinlerle/)).not.toBeInTheDocument()
  },
}

/**
 * Tema seçimi yalnız tema adını bildirmeli — fazladan argümansız.
 *
 * Base UI `onValueChange`'e ikinci bir `eventDetails` argümanı geçiyor;
 * sarmalanmazsa `onValueChange={setTema}` yazan biri `setTema(x, {...})` çağırmış
 * olur. `toHaveBeenCalledWith` fazladan argümanı yakalar.
 *
 * İki grup birbirinden ayrılıyor: aynı üç seçenek iki kez render ediliyor.
 * Grupların **kendi** adları doğru (`RadioGroup` grubun `aria-labelledby`'sini
 * doğru kuruyor); bozuk olan seçeneklerin adı — bkz. dosyanın başındaki kusur
 * notu. Bu yüzden seçenek `temaSecenegi` ile görünür metninden bulunuyor.
 */
export const ThemeChangeReportsOnlyTheThemeName: Story = {
  args: { savedRolePermissions: KAYITLI },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('tab', { name: 'Görünüm' }))

    const kendiTemam = await canvas.findByRole('radiogroup', { name: 'Kendi temam' })
    await userEvent.click(temaSecenegi(kendiTemam, 'Sıcak Amber'))
    await expect(args.onThemeChange).toHaveBeenCalledWith('warm-amber')

    const sistemVarsayilani = canvas.getByRole('radiogroup', { name: 'Sistem varsayılan teması' })
    await userEvent.click(temaSecenegi(sistemVarsayilani, 'Nötr Slate'))
    await expect(args.onSystemDefaultThemeChange).toHaveBeenCalledWith('neutral-slate')

    /* İki grup ayrı: kendi teması değişince sistem varsayılanı çağrılmamalı. */
    await expect(args.onThemeChange).toHaveBeenCalledTimes(1)
    await expect(args.onSystemDefaultThemeChange).toHaveBeenCalledTimes(1)
  },
}

/**
 * Varsayılana dönme geri alınamaz: onaydan geçmeden çalışmamalı.
 *
 * Dialog portal'a gidiyor ve açıkken Base UI sayfanın kalanını `aria-hidden`
 * yapıyor — bu yüzden dialog `document.body` içinde aranıyor,
 * `within(canvasElement)` onu bulamazdı.
 *
 * Play, DOM'u **oturmuş** bırakıyor: dialog kapanış animasyonu sürerken bitirilen
 * story'de Base UI'ın odak korumaları DOM'da kalıyor ve axe `aria-hidden-focus`
 * görüyor (kapı `'error'`).
 */
export const ResetIsConfirmedBeforeItRuns: Story = {
  args: { rolePermissions: TASLAK, savedRolePermissions: KAYITLI, dirty: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Varsayılana dön' }))

    const dialog = within(await within(document.body).findByRole('dialog'))
    await expect(args.onReset).not.toHaveBeenCalled()

    /* Vazgeçmek hiçbir şey yapmamalı. */
    await userEvent.click(dialog.getByRole('button', { name: 'Vazgeç' }))
    await popupKapanmasiniBekle()
    await expect(args.onReset).not.toHaveBeenCalled()

    /* İkinci turda onayla. */
    await userEvent.click(canvas.getByRole('button', { name: 'Varsayılana dön' }))
    const ikinciDialog = within(await within(document.body).findByRole('dialog'))
    await userEvent.click(ikinciDialog.getByRole('button', { name: 'Varsayılana dön' }))

    await expect(args.onReset).toHaveBeenCalledTimes(1)
    await popupKapanmasiniBekle()
  },
}

/**
 * Değişiklik rol, izin ve yeni değerle bildirilmeli — fazladan argümansız.
 *
 * Her kutunun erişilebilir adı "rol + izin": 132 kutunun hepsi "Seç" deseydi
 * ekran okuyucu kullanıcısı hangisinde olduğunu ayırt edemezdi.
 */
export const PermissionToggleReportsRolePermissionAndNextValue: Story = {
  args: { savedRolePermissions: KAYITLI },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(
      canvas.getByRole('checkbox', {
        name: `${ADMIN_ROLE_LABEL[AdminRole.Moderator]} — ${ADMIN_PERMISSION_LABEL[AdminPermission.ListingArchive]}`,
      }),
    )

    await expect(args.onPermissionChange).toHaveBeenCalledWith(
      AdminRole.Moderator,
      AdminPermission.ListingArchive,
      false,
    )
  },
}

/**
 * Kontrollü tur: ekran kendi kopyasını tutmaz, işaretlilik `rolePermissions`'tan
 * gelir ve `dirty` ile diff tabanı çağıranın hesabıdır.
 *
 * `savedRolePermissions` sabit (`KAYITLI`), taslak değişiyor: gerçek bir sayfanın
 * yapacağı şeyin aynısı. Kutuyu işaretleyip "Değişiklikleri gözden geçir"i açmak
 * diff'i canlı gösterir.
 */
export const Interactive: Story = {
  args: { savedRolePermissions: KAYITLI },
  render: function Render(args) {
    const [taslak, setTaslak] = useState<Record<AdminRole, readonly AdminPermission[]>>(KAYITLI)

    const kirli = TUM_ROLLER.some(
      (role) =>
        taslak[role].length !== KAYITLI[role].length ||
        taslak[role].some((izin) => !KAYITLI[role].includes(izin)),
    )

    return (
      <SettingsPage
        {...args}
        rolePermissions={taslak}
        dirty={kirli}
        onPermissionChange={(role, permission, enabled) =>
          setTaslak((onceki) => ({
            ...onceki,
            [role]: enabled
              ? [...onceki[role], permission]
              : onceki[role].filter((izin) => izin !== permission),
          }))
        }
        onReset={() => setTaslak(ROLE_PERMISSIONS)}
      />
    )
  },
}
