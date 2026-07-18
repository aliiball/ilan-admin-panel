import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import {
  ALL_ADMIN_PERMISSIONS,
  AdminPermission,
  AdminRole,
  ROLE_PERMISSIONS,
} from '../../../types/domain'
import { ADMIN_PERMISSION_LABEL, ADMIN_ROLE_LABEL } from '../../../domain/labels'
import { RolePermissionMatrix } from './RolePermissionMatrix'

const VARYANTLAR = ['editable', 'readOnly', 'diff'] as const

const TUM_ROLLER: AdminRole[] = Object.values(AdminRole)
const TUM_IZINLER: AdminPermission[] = [...ALL_ADMIN_PERMISSIONS]

/**
 * Varsayılan izinler — matrisin tabanı.
 *
 * `ROLE_PERMISSIONS` doğrudan geçiliyor, elle bir kopyası yazılmıyor: brifing
 * 1.4'ün üç "Sınırlı" hücresi (`UserEditProfile`, `UserEditContact`,
 * `ReportTriageLimited`) domain'de yaşıyor ve story'ler onu kopyalarsa matris
 * değişip component'e yansımadığında hiçbir test düşmez.
 */
const VARSAYILAN: Record<AdminRole, readonly AdminPermission[]> = ROLE_PERMISSIONS

/**
 * Kaydedilmemiş bir taslak: moderatörden iki izin alınmış, bir izin verilmiş;
 * içerik denetçisine bir izin verilmiş. Dört değişen hücre.
 */
const TASLAK: Record<AdminRole, readonly AdminPermission[]> = {
  ...ROLE_PERMISSIONS,

  [AdminRole.Moderator]: [
    ...ROLE_PERMISSIONS[AdminRole.Moderator].filter(
      (izin) => izin !== AdminPermission.ListingArchive && izin !== AdminPermission.PromotionManage,
    ),
    AdminPermission.CategoryManage,
  ],

  [AdminRole.ContentReviewer]: [
    ...ROLE_PERMISSIONS[AdminRole.ContentReviewer],
    AdminPermission.ListingPause,
  ],
}

/** Brifing 1.4'ün "Sınırlı" hücrelerinin izin karşılıkları. */
const SINIRLI_IZINLER: AdminPermission[] = [
  AdminPermission.UserEdit,
  AdminPermission.UserEditProfile,
  AdminPermission.UserEditContact,
  AdminPermission.ReportTriage,
  AdminPermission.ReportTriageLimited,
]

/**
 * Bir rol × izin hücresini DOM'dan bulur.
 *
 * Satır başlığından satıra, satırdan sütun sırasına gidiyor: hücreyi metniyle
 * aramak ("Var" yazan hücre) 128 eşleşme döndürürdü. `getAllByRole('cell')`
 * yalnız `<td>`leri sayar, satır başlığı (`<th scope="row">`) sıraya girmez —
 * yani indeks doğrudan `roles` sırasıdır.
 *
 * Bulunamayan satır/sütun sessizce `undefined` dönüp testi "geçmiş" göstermesin
 * diye açıkça patlıyor: bu repoda testlerin yanlış elemanı ölçüp geçtiği görüldü.
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

const meta = {
  title: 'Composites/RolePermissionMatrix',
  component: RolePermissionMatrix,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Brifing 1.4 yetki tablosunun ekrandaki hâli. **Satır izin, sütun rol**: 33 izin ' +
          'dört sütuna sığar, tersi (32 sütun) hiçbir ekrana sığmaz ve bu yön şartnamenin kendi ' +
          'tablosuyla birebir kaldığı için ekran satır satır karşılaştırılabilir. Her kutunun ' +
          'erişilebilir adı **"rol + izin"** — 128 kutunun hepsi "Seç" deseydi ekran okuyucu ' +
          'kullanıcısı hangisinde olduğunu ayırt edemezdi. `readOnly` devre dışı kutu değil ' +
          'ikon gösterir: kilitli bir kutu tarlası "yetkin yok" diye okunur, oysa salt okunur ' +
          'matris çalışan bir cevaptır. `diff`in tabanını **`baseline`** söyler (Faz 3); ' +
          'verilmezse `ROLE_PERMISSIONS`a düşer. Ayarlar ekranı **kayıtlı** izinleri taban ' +
          'verir, böylece diff "kaydetmeden önce neyi değiştiriyorum" sorusunu cevaplar.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'permission-matrix',
      useWhen: [
        'Ayarlar ekranında rol izinleri düzenlenecekse (yalnız superAdmin)',
        'Kullanıcı detayında "bu rol ne yapabilir" gösterilecekse — readOnly varyantı',
        'Kaydetmeden önce izin değişikliği onaylatılacaksa — diff varyantı',
      ],
      doNotUseWhen: [
        'Tek bir kullanıcının rolü seçilecekse — Select kullanın',
        'Kullanıcının yetkisi yoksa: matrisi disabled vermeyin, sayfayı hiç render etmeyin',
        'Genel amaçlı tablo için — DataTable kullanın',
      ],
    },
  },

  args: {
    roles: TUM_ROLLER,
    permissions: TUM_IZINLER,
    value: VARSAYILAN,
    variant: 'editable',
  },

  argTypes: {
    variant: { control: 'inline-radio', options: VARYANTLAR },
    roles: { control: false },
    permissions: { control: false },
    value: { control: false },
  },
} satisfies Meta<typeof RolePermissionMatrix>

export default meta

type Story = StoryObj<typeof meta>

/*
  `onChange` meta.args'ta YOK ve bu bilinçli: handler'ın yokluğu bir durum
  (bkz. NoOnChangeFallsBackToReadOnly). exactOptionalPropertyTypes açıkken
  meta'daki `onChange: fn()` prop'un tipini Mock'a sabitler ve o story
  `onChange: undefined` yazamaz (TS2375). İhtiyacı olan story kendi verir.
*/

export const Default: Story = {
  args: { onChange: fn() },
}

// --- Varyantlar -------------------------------------------------------------

/** Ayarlar ekranı: hücreler işaretlenebilir kutu. */
export const Editable: Story = {
  args: { variant: 'editable', onChange: fn() },
}

/** Kullanıcı detayı: "bu rol ne yapabilir". Kimse yanlışlıkla değiştiremez. */
export const ReadOnly: Story = {
  args: { variant: 'readOnly' },
}

/**
 * Kaydetmeden önce: taban `ROLE_PERMISSIONS`, değişen hücreler işaretli.
 * Yetki değişikliğinin geri alınması pahalı bir iştir; ne değiştiğini görmeden
 * kaydedilmemeli.
 */
export const Diff: Story = {
  args: { variant: 'diff', value: TASLAK },
}

/** Değişiklik yoksa bunu açıkça söyler — boş bir alan "diff hesaplanamadı" ile karışırdı. */
export const DiffWithoutChanges: Story = {
  args: { variant: 'diff', value: VARSAYILAN },
}

// --- Etkileşim durumları ----------------------------------------------------

/** Kaydetme sürerken hücreler kilitlenir ve sebebi söylenir: "yetkim mi yok?" dedirtmez. */
export const Saving: Story = {
  args: { saving: true, onChange: fn() },
}

/** Geçici olarak değiştirilemez. **Yetki için değil** — yetkisize `readOnly` verilir. */
export const Disabled: Story = {
  args: { disabled: true, onChange: fn() },
}

/** Kaydetme, `diff` ekranından tetiklenmiş olabilir: durum çubuğu orada da görünür. */
export const DiffSaving: Story = {
  args: { variant: 'diff', value: TASLAK, saving: true },
}

// --- Domain durumları -------------------------------------------------------

/**
 * Brifing 1.4'ün üç "Sınırlı" hücresi, kendi izinleriyle.
 *
 * Kademeler kapsayıcı: `superAdmin` hem tam hem daraltılmış izne sahip. Matris
 * bunu olduğu gibi gösterir, "tam yetkilide sınırlı satırı gizle" gibi bir yorum
 * yapmaz.
 */
export const LimitedTiers: Story = {
  args: { permissions: SINIRLI_IZINLER, variant: 'readOnly' },
}

/** Tek rol: kullanıcı detayında yalnız o kişinin rolü gösterilir. */
export const SingleRole: Story = {
  args: { roles: [AdminRole.Support], variant: 'readOnly' },
}

// --- Uzun içerik ve mobil ---------------------------------------------------

/**
 * En uzun etiketler dar bir kapta: "Kullanıcı bilgisi düzenleme (sınırlı: ad,
 * e-posta, telefon, avatar, firma adı)" sarmalı, tablo taban genişliğinin
 * altına düşmemeli, kap yatay kaydırmalı.
 */
export const LongContent: Story = {
  args: { variant: 'readOnly' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '26rem', border: '1px dashed var(--color-border-strong)' }}>
        <Story />
      </div>
    ),
  ],
}

/** 320 pikselde izin sütunu yapışkan kalır; rol sütunları kaydırılarak gezilir. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { onChange: fn() },
}

export const MobileReadOnly: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { variant: 'readOnly' },
}

// --- Ölçümler ---------------------------------------------------------------

/**
 * Gösterilecek satır ya da sütun yoksa hiç render edilmemeli.
 *
 * Başlıklı ama gövdesiz bir tablo "veri yüklenemedi" ile karışır; boş mesajı
 * sayfanın EmptyState'i verir.
 */
export const EmptyRendersNothing: Story = {
  args: { permissions: [], onChange: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('table')).not.toBeInTheDocument()
    await expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument()
  },
}

/**
 * Her kutunun erişilebilir adı rolü **ve** izni söylemeli.
 *
 * DOM'dan ölçülüyor: adın kaynağı sarmalayan `<label>` ve `hideLabel` onu
 * `clip` ile gizliyor. Biri bunu `visibility: hidden`'a çevirirse ad sessizce
 * kaybolur ve 128 kutu ayırt edilemez hale gelir — Button'ın `loading`
 * hatasının aynısı.
 */
export const CellsAreNamedByRoleAndPermission: Story = {
  args: { onChange: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const onayla = canvas.getByRole('checkbox', {
      name: `${ADMIN_ROLE_LABEL[AdminRole.Moderator]} — ${ADMIN_PERMISSION_LABEL[AdminPermission.ListingApprove]}`,
    })
    await expect(onayla).toBeChecked()

    /* Destek onaylayamaz: aynı izin, başka rol — ad ikisini ayırt etmeli. */
    const destekOnayla = canvas.getByRole('checkbox', {
      name: `${ADMIN_ROLE_LABEL[AdminRole.Support]} — ${ADMIN_PERMISSION_LABEL[AdminPermission.ListingApprove]}`,
    })
    await expect(destekOnayla).not.toBeChecked()

    /* Dört rol × 33 izin: hücre sayısı eksiksiz. */
    await expect(canvas.getAllByRole('checkbox')).toHaveLength(
      TUM_ROLLER.length * TUM_IZINLER.length,
    )
  },
}

/** Başlıklar gerçekten başlık hücresi olmalı: `<td>` ekran okuyucuda hücreyi bağlamsız bırakır. */
export const HeadersAreScopedTableHeaders: Story = {
  args: { variant: 'readOnly', permissions: SINIRLI_IZINLER },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const rolBasligi = canvas.getByRole('columnheader', {
      name: ADMIN_ROLE_LABEL[AdminRole.ContentReviewer],
    })
    await expect(rolBasligi).toHaveAttribute('scope', 'col')

    const izinBasligi = canvas.getByRole('rowheader', {
      name: ADMIN_PERMISSION_LABEL[AdminPermission.ReportTriageLimited],
    })
    await expect(izinBasligi).toHaveAttribute('scope', 'row')

    /* Köşe hücresi de bir başlık: izin sütununu adlandırır. */
    await expect(canvas.getByRole('columnheader', { name: 'İzin' })).toHaveAttribute('scope', 'col')

    /* Beş izin satırı, dört rol sütunu: rol başına bir sütun, fazlası eksiği yok. */
    await expect(canvas.getAllByRole('columnheader')).toHaveLength(TUM_ROLLER.length + 1)
    await expect(canvas.getAllByRole('rowheader')).toHaveLength(SINIRLI_IZINLER.length)

    /*
      Tablonun kendi adı `<caption>`'dan geliyor ve caption `clip` ile gizli.
      `toHaveAccessibleName` bunu ekran okuyucunun gördüğü yerden ölçüyor:
      biri caption'ı `display: none`'a çevirirse ad kaybolur ve bu iddia düşer.
    */
    await expect(canvas.getByRole('table')).toHaveAccessibleName(/5 izin satırı, 4 rol sütunu/)
  },
}

/**
 * Brifing 1.4'ün üç "Sınırlı" hücresi ekranda daraltılmış iznin kendisi olarak
 * görünmeli — tam izin olarak değil.
 *
 * Kaynak `ROLE_PERMISSIONS`: uydurulmuş bir değere değil domain'in kendisine
 * karşı ölçülüyor, matris değişip buraya yansımazsa test düşer.
 */
export const LimitedTiersRenderAsTheirOwnRows: Story = {
  args: { permissions: SINIRLI_IZINLER, variant: 'readOnly' },
  play: async ({ canvasElement }) => {
    /* Moderatör: sınırlı profil düzenleme var, tam düzenleme yok. */
    await expect(
      hucre(canvasElement, AdminRole.Moderator, AdminPermission.UserEditProfile),
    ).toHaveTextContent('Var')
    await expect(
      hucre(canvasElement, AdminRole.Moderator, AdminPermission.UserEdit),
    ).toHaveTextContent('Yok')

    /* Destek: yalnız iletişim alanları. */
    await expect(
      hucre(canvasElement, AdminRole.Support, AdminPermission.UserEditContact),
    ).toHaveTextContent('Var')
    await expect(
      hucre(canvasElement, AdminRole.Support, AdminPermission.UserEditProfile),
    ).toHaveTextContent('Yok')

    /* İçerik denetçisi: sınırlı triage var, tam triage yok. */
    await expect(
      hucre(canvasElement, AdminRole.ContentReviewer, AdminPermission.ReportTriageLimited),
    ).toHaveTextContent('Var')
    await expect(
      hucre(canvasElement, AdminRole.ContentReviewer, AdminPermission.ReportTriage),
    ).toHaveTextContent('Yok')

    /* Kademeler kapsayıcı: superAdmin beşine de sahip. */
    for (const izin of SINIRLI_IZINLER) {
      await expect(hucre(canvasElement, AdminRole.SuperAdmin, izin)).toHaveTextContent('Var')
    }
  },
}

/**
 * `readOnly` kutu sunmamalı — devre dışı kutu değil, hiç kutu.
 *
 * "Sunulmuyor" iddiası DOM'dan ölçülüyor: kutuyu `disabled` verip gizli
 * sanmak bu repoda yaşanmış bir hata sınıfı.
 */
export const ReadOnlyHasNoCheckboxes: Story = {
  args: { variant: 'readOnly' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryAllByRole('checkbox')).toHaveLength(0)
    await expect(canvas.getByRole('table')).toBeInTheDocument()
  },
}

/** `onChange` yoksa `editable` istense bile kutu sunulmamalı: sonuçsuz kutu yanıltır. */
export const NoOnChangeFallsBackToReadOnly: Story = {
  args: { variant: 'editable' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryAllByRole('checkbox')).toHaveLength(0)
    await expect(canvas.getByRole('table')).toBeInTheDocument()
  },
}

/** Değişen hücreler işaretlenmeli ve sayılmalı; değişmeyenler sessiz kalmalı. */
export const ChangedCellsAreMarked: Story = {
  args: { variant: 'diff', value: TASLAK },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Alınan iki izin. */
    await expect(
      hucre(canvasElement, AdminRole.Moderator, AdminPermission.ListingArchive),
    ).toHaveTextContent('Yok (kaldırıldı)')
    await expect(
      hucre(canvasElement, AdminRole.Moderator, AdminPermission.PromotionManage),
    ).toHaveTextContent('Yok (kaldırıldı)')

    /* Verilen iki izin. */
    await expect(
      hucre(canvasElement, AdminRole.Moderator, AdminPermission.CategoryManage),
    ).toHaveTextContent('Var (eklendi)')
    await expect(
      hucre(canvasElement, AdminRole.ContentReviewer, AdminPermission.ListingPause),
    ).toHaveTextContent('Var (eklendi)')

    /*
      Dokunulmamış hücre değişmiş görünmemeli. İki iddia birlikte gerekiyor:
      "Var" tek başına "Var (eklendi)" ile de eşleşir (alt dize araması).
    */
    const dokunulmamis = hucre(canvasElement, AdminRole.Moderator, AdminPermission.ListingApprove)
    await expect(dokunulmamis).toHaveTextContent('Var')
    await expect(dokunulmamis).not.toHaveTextContent('eklendi')

    await expect(canvas.getByText('4 hücre önceki hâlinden farklı')).toBeInTheDocument()
  },
}

/**
 * `saving` bütün kutuları kilitlemeli ve sebebini söylemeli.
 *
 * `toBeDisabled()` **kullanılmıyor**: Base UI kutusu bir `<span role="checkbox">`
 * ve kilidini `aria-disabled` ile bildiriyor; native matcher kutu gerçekten
 * kilitliyken de düşer. Matcher yanlıştır, component değil.
 */
export const SavingLocksCells: Story = {
  args: { saving: true, permissions: SINIRLI_IZINLER, onChange: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    for (const kutu of canvas.getAllByRole('checkbox')) {
      await expect(kutu).toHaveAttribute('aria-disabled', 'true')
    }

    await expect(canvas.getByRole('table')).toHaveAttribute('aria-busy', 'true')
    /* Beklenen şey söylenmeli: dönen halka tek başına ne beklendiğini anlatmaz. */
    await expect(canvas.getByRole('status')).toHaveTextContent('İzinler kaydediliyor')
  },
}

/** `disabled` de kilitler ama ilerleme göstermez: sebep geçici değil. */
export const DisabledLocksCells: Story = {
  args: { disabled: true, permissions: SINIRLI_IZINLER, onChange: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    for (const kutu of canvas.getAllByRole('checkbox')) {
      await expect(kutu).toHaveAttribute('aria-disabled', 'true')
    }

    await expect(canvas.getByRole('table')).toHaveAttribute('aria-busy', 'false')
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument()
  },
}

/**
 * Değişiklik rol, izin ve yeni değerle bildirilmeli — fazladan argümansız.
 *
 * Base UI `onCheckedChange`'e ikinci bir `eventDetails` argümanı geçiyor;
 * sarmalanmazsa sözleşme sızar. `toHaveBeenCalledWith` fazladan argümanı
 * yakalar.
 */
export const ToggleReportsRolePermissionAndNextValue: Story = {
  args: { onChange: fn(), permissions: SINIRLI_IZINLER },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    /* İşaretliyi kaldır: moderatörün sınırlı profil düzenlemesi. */
    await userEvent.click(
      canvas.getByRole('checkbox', {
        name: `${ADMIN_ROLE_LABEL[AdminRole.Moderator]} — ${ADMIN_PERMISSION_LABEL[AdminPermission.UserEditProfile]}`,
      }),
    )
    await expect(args.onChange).toHaveBeenCalledWith(
      AdminRole.Moderator,
      AdminPermission.UserEditProfile,
      false,
    )

    /* Boşu işaretle: içerik denetçisine tam triage. */
    await userEvent.click(
      canvas.getByRole('checkbox', {
        name: `${ADMIN_ROLE_LABEL[AdminRole.ContentReviewer]} — ${ADMIN_PERMISSION_LABEL[AdminPermission.ReportTriage]}`,
      }),
    )
    await expect(args.onChange).toHaveBeenLastCalledWith(
      AdminRole.ContentReviewer,
      AdminPermission.ReportTriage,
      true,
    )
  },
}

/** Kontrollü: matris kendi kopyasını tutmaz, işaretlilik `value`'dan gelir. */
export const Interactive: Story = {
  args: { permissions: SINIRLI_IZINLER },
  render: function Render(args) {
    const [izinler, setIzinler] =
      useState<Record<AdminRole, readonly AdminPermission[]>>(VARSAYILAN)

    return (
      <RolePermissionMatrix
        {...args}
        value={izinler}
        onChange={(role, permission, enabled) =>
          setIzinler((onceki) => ({
            ...onceki,
            [role]: enabled
              ? [...onceki[role], permission]
              : onceki[role].filter((izin) => izin !== permission),
          }))
        }
      />
    )
  },
}

export const VariantsComparison: Story = {
  args: { permissions: SINIRLI_IZINLER },
  render: (args) => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {VARYANTLAR.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          <RolePermissionMatrix
            {...args}
            variant={variant}
            /* `diff` taslağı gösterir, diğer ikisi varsayılanı: yan yana ancak böyle anlamlı. */
            value={variant === 'diff' ? TASLAK : VARSAYILAN}
            onChange={fn()}
          />
        </div>
      ))}
    </div>
  ),
}
