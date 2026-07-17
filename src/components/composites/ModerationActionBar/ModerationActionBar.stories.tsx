import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import {
  AdminPermission,
  AdminRole,
  ListingStatus,
  RejectionReason,
  ROLE_PERMISSIONS,
} from '../../../types/domain'
import {
  ADMIN_ROLE_LABEL,
  LISTING_STATUS_LABEL,
  REJECTION_REASON_LABEL,
} from '../../../domain/labels'
import type { ModerationCapabilities } from '../../../types/component-props'
import { ModerationActionBar } from './ModerationActionBar'

const VARYANTLAR = ['stickyBottom', 'inline', 'sideRail'] as const

/**
 * Yetkileri rolün kendi izin listesinden türetir — elle yazılmaz.
 *
 * Böylece "destek rolü onay, red, pasif veya arşiv eylemi görememelidir" gibi
 * kabul kriterleri, uydurulmuş bir yetki nesnesine değil `ROLE_PERMISSIONS`'ın
 * kendisine karşı ölçülür. Matris değişir de bu component'e yansımazsa test
 * düşer.
 */
function yetkiler(role: AdminRole): ModerationCapabilities {
  const izinler: readonly AdminPermission[] = ROLE_PERMISSIONS[role]

  return {
    canApprove: izinler.includes(AdminPermission.ListingApprove),
    canReject: izinler.includes(AdminPermission.ListingReject),
    canRequestChanges: izinler.includes(AdminPermission.ListingRequestChanges),
    canPause: izinler.includes(AdminPermission.ListingPause),
    canArchive: izinler.includes(AdminPermission.ListingArchive),
  }
}

const meta = {
  title: 'Composites/ModerationActionBar',
  component: ModerationActionBar,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Bir eylem **iki kapıdan** geçmeden görünmez: kullanıcının yetkisi olacak ' +
          '(`capabilities`) ve ilanın durumu o geçişe izin verecek (`domain/moderationActions.ts`). ' +
          'İkisi de "kapalı buton" değil "yok" ile sonuçlanır — taslak ilanda "Onayla" görmek ' +
          'olmayan bir seçenek sunar. Hiçbir eylem kalmazsa çubuk hiç render edilmez. ' +
          'Kararı çubuk toplar: red ve düzeltme isteğinde gerekçe **ve** not zorunlu (brifing 1.2), ' +
          'onay ve arşivde alan yok ama dialog yine açılır — karar öncesi doğrulama zorunlu.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'action-bar',
      useWhen: [
        'İlan detayında veya moderasyon kuyruğunda karar verilecekse',
        'Tek bir ilanın durumu değiştirilecekse',
      ],
      doNotUseWhen: [
        'Birden çok kayda toplu işlem için — BulkActionBar kullanın',
        'Yalnız gerekçe formu gerekiyorsa — RejectionReasonPicker kullanın',
      ],
    },
  },

  args: {
    listingId: 'listing-residential-konyaalti-villa',
    status: ListingStatus.PendingReview,
    revision: 1,
    capabilities: yetkiler(AdminRole.Moderator),
    variant: 'inline',
    onApprove: fn(),
    onReject: fn(),
    onRequestChanges: fn(),
    onPause: fn(),
    onArchive: fn(),
  },

  argTypes: {
    variant: { control: 'inline-radio', options: VARYANTLAR },
    status: { control: 'select', options: Object.values(ListingStatus) },
    submittingAction: {
      control: 'select',
      options: [undefined, 'approve', 'reject', 'requestChanges', 'pause', 'archive'],
    },
    capabilities: { control: false },
  },
} satisfies Meta<typeof ModerationActionBar>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/**
 * Revizyon çakışması: karar verilirken ilan değişti.
 *
 * Çubuk çakışmayı **tespit etmiyor**, `expectedRevision` damgasıyla tespit
 * _edilebilir_ kılıyor; cevabı sunucu veriyor ve `decisionError` ile geri
 * geliyor. Uyarının **tekrar deneme butonu yok ve olmamalı**: aynı damga aynı
 * çakışmayı üretir, damgayı yenilemek ise görülmemiş bir içeriği onaylamak
 * olur. Doğru eylem ilanı yeniden yüklemek — o da sayfanın işi.
 *
 * `decisionError` meta.args'ta **yok**: yokluğu bir durum (karar gönderilmemiş
 * ya da başarılı) ve meta'ya konan prop bu dosyada geri alınamaz olurdu
 * (AGENTS.md, TS2375).
 */
export const RevisionConflictIsSurfaced: Story = {
  args: {
    revision: 3,
    decisionError: { kind: 'revisionConflict', expectedRevision: 3, currentRevision: 5 },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const uyari = canvas.getByRole('alert')
    await expect(uyari).toHaveTextContent(/İlan siz incelerken değişti/)

    /*
      İki revizyon da yazılmalı: "ilan değişti" tek başına moderatöre neyi
      kaçırdığını söylemez, "3 -> 5" iki düzenleme geçtiğini söyler.
    */
    await expect(uyari).toHaveTextContent(/3\. revizyona verdiniz/)
    await expect(uyari).toHaveTextContent(/5\. revizyonda/)

    /* Çakışmada tekrar denemek çözüm değil — buton sunulmamalı. */
    await expect(canvas.queryByRole('button', { name: /Tekrar dene/ })).not.toBeInTheDocument()

    /* Kararlar duruyor: çakışma eylemleri kaldırmaz, yeniden bakmayı gerektirir. */
    await expect(canvas.getByRole('button', { name: 'Onayla' })).toBeInTheDocument()
  },
}

/** Çakışma değil, uygulanamayan karar: içerik hâlâ moderatörün gördüğü içerik. */
export const FailedDecisionIsSurfaced: Story = {
  args: {
    decisionError: {
      kind: 'failed',
      error: {
        title: 'Karar uygulanamadı',
        message: 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip kararı tekrar verin.',
        retryable: true,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('alert')).toHaveTextContent('Karar uygulanamadı')
    /* `failed`'de revizyon numarası yok: sorun içerik değil, iletim. */
    await expect(canvas.getByRole('alert')).not.toHaveTextContent(/revizyon/)
  },
}

/** Hata yokken uyarı da yok — sessiz çubuk varsayılan hâl. */
export const NoDecisionErrorNoAlert: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
  },
}

/**
 * Çakışmadan sonra taslak **kaybolmaz**: moderatörün yazdığı not yerinde durur.
 *
 * Sözleşmenin bu sözü ölçülmeden duruyordu. Dialog karar gönderilince kapanıyor
 * ama gerekçe ve not state'te kalıyor; çakışma haberi geldiğinde kullanıcı
 * dialog'u tekrar açtığında baştan yazmak zorunda değil — uzun bir red
 * gerekçesini ikinci kez yazdırmak, çakışmanın bedelini moderatöre ödetirdi.
 */
export const DraftSurvivesRevisionConflict: Story = {
  args: { revision: 3 },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    /*
      Gerekçe adı sözlükten okunuyor, elle yazılmıyor: "Yanıltıcı Bilgi" diye
      yazmak etiketin gerçek hâliyle ("Yanıltıcı veya Eksik Bilgi")
      eşleşmiyordu. Sözlükten okuyunca etiket değişse de test doğru sebeple
      geçer.
    */
    const gerekceAdi = REJECTION_REASON_LABEL[RejectionReason.MisleadingOrIncompleteInfo]
    const NOT = 'Metrekare ilan başlığıyla çelişiyor.'

    await step('Red gerekçesi ve notu yazılır, karar gönderilir', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Reddet' }))

      /* Dialog portalda: canvas'ta değil, gövdede aranmalı. */
      const dialog = within(document.body)
      await userEvent.click(await dialog.findByRole('checkbox', { name: gerekceAdi }))
      await userEvent.type(dialog.getByRole('textbox', { name: /Moderasyon notu/ }), NOT)
      await userEvent.click(dialog.getByRole('button', { name: 'Reddet' }))
    })

    await step('Dialog tekrar açılır: gerekçe ve not yerinde', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Reddet' }))

      const dialog = within(document.body)
      await expect(await dialog.findByRole('checkbox', { name: gerekceAdi })).toBeChecked()
      await expect(dialog.getByRole('textbox', { name: /Moderasyon notu/ })).toHaveValue(NOT)
    })
  },
}

/** Ekranın altına yapışır; mobilde safe-area boşluğunu bırakır. */
export const StickyBottom: Story = {
  args: { variant: 'stickyBottom' },
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ height: '22rem', overflowY: 'auto' }}>
        <div style={{ display: 'grid', gap: '0.75rem', padding: '1rem' }}>
          {Array.from({ length: 12 }, (_, index) => (
            <p key={index} style={{ margin: 0, color: 'var(--color-text-muted)' }}>
              İlan açıklamasının {index + 1}. paragrafı. Çubuk aşağı kaydırınca kaybolmaz.
            </p>
          ))}
        </div>
        <Story />
      </div>
    ),
  ],
}

export const Inline: Story = {
  args: { variant: 'inline' },
}

/** Dikey kolon: geniş ekranda yan panelde. Butonlar tam genişlik. */
export const SideRail: Story = {
  args: { variant: 'sideRail' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '16rem' }}>
        <Story />
      </div>
    ),
  ],
}

/** Karar uçarken o butonda spinner, diğerleri kapalı. */
export const Submitting: Story = {
  args: { submittingAction: 'approve' },
}

/**
 * `destek` rolü hiçbir karar veremez — çubuk hiç render edilmez.
 *
 * Brifingin kabul kriteri: "`destek` rolü onay, red, pasif veya arşiv eylemi
 * görememelidir." Kapalı buton da göstermez; yetkisi olmayan eylem yoktur.
 */
export const NoPermission: Story = {
  args: { capabilities: yetkiler(AdminRole.Support) },
}

/** İncelemedeki ilan: üç karar da açık. Pasife alma ve arşivleme bu durumda yok. */
export const PendingReview: Story = {
  args: { status: ListingStatus.PendingReview },
}

/** Yayındaki ilan onaylanamaz — zaten onaylı. Geriye pasife alma ve arşivleme kalır. */
export const Published: Story = {
  args: { status: ListingStatus.Published },
}

/** Taslak: moderasyon başlamadı, tek yapılabilecek arşivlemek. */
export const Draft: Story = {
  args: { status: ListingStatus.Draft },
}

/** Reddedilmiş ilan: karar verilmiş. Arşivden başka yol yok. */
export const Rejected: Story = {
  args: { status: ListingStatus.Rejected },
}

/** Arşiv son durak: hiçbir eylem kalmaz, çubuk render edilmez. */
export const Archived: Story = {
  args: { status: ListingStatus.Archived },
}

/**
 * `icerikDenetcisi` karar verir ama pasife alamaz, arşivleyemez.
 *
 * Yayındaki bir ilanda bu rolün yapabileceği hiçbir şey kalmaz — çubuk yok.
 */
export const ContentReviewerOnPublished: Story = {
  args: {
    capabilities: yetkiler(AdminRole.ContentReviewer),
    status: ListingStatus.Published,
  },
}

/**
 * Revizyon çakışması.
 *
 * Çubuk çakışmayı **tespit etmez**, tespit edilebilir kılar: kararı moderatörün
 * gördüğü revizyonla damgalar (`expectedRevision`). Sunucu kendi revizyonu ile
 * karşılaştırır; ilan bu arada düzenlenmişse karar reddedilir ve sayfa hatayı
 * gösterir. Olmasaydı, iki dakika önceki içeriğe bakarak verilen "onayla"
 * kararı o arada değişmiş bir ilanı yayına almış olurdu.
 *
 * Burada moderatör 7. revizyona bakıyor; yükte giden değer de 7 olmalı.
 */
export const RevisionConflict: Story = {
  args: { revision: 7 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const body = within(document.body)

    await userEvent.click(canvas.getByRole('button', { name: 'Onayla' }))
    await userEvent.click(await body.findByRole('button', { name: 'Onayla ve yayınla' }))

    await expect(args.onApprove).toHaveBeenCalledWith(
      expect.objectContaining({ expectedRevision: 7 }),
    )
  },
}

/** Dar ekranda butonlar sarar; sticky çubuk safe-area'yı hesaba katar. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
}

/** `destek` rolüne hiçbir buton çıkmamalı. */
export const SupportRoleSeesNothing: Story = {
  args: { capabilities: yetkiler(AdminRole.Support) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}

/** İncelemedeki ilan yalnız karar eylemlerini sunmalı — pasife alma/arşivleme yok. */
export const PendingReviewOffersOnlyDecisions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: 'Onayla' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Düzeltme iste' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Reddet' })).toBeInTheDocument()

    await expect(canvas.queryByRole('button', { name: 'Pasife al' })).not.toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: 'Arşivle' })).not.toBeInTheDocument()
  },
}

/** Taslakta onay/red görünmemeli: moderasyon atlanamaz (brifing 1.2). */
export const DraftOffersOnlyArchive: Story = {
  args: { status: ListingStatus.Draft },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: 'Arşivle' })).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: 'Onayla' })).not.toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: 'Reddet' })).not.toBeInTheDocument()
  },
}

/** Arşivlenmiş ilanda hiçbir eylem kalmaz; çubuk hiç render edilmemeli. */
export const ArchivedRendersNothing: Story = {
  args: { status: ListingStatus.Archived },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}

/**
 * Red kararı gerekçe **ve** not olmadan gönderilememeli.
 *
 * Brifingin kabul kriteri: "Red ve düzeltme kararında en az bir gerekçe ve not
 * zorunlu olmalıdır." Üç aşama da ölçülüyor — yalnız sonuncusu açar.
 */
export const RejectRequiresReasonAndNote: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(document.body)

    await userEvent.click(canvas.getByRole('button', { name: 'Reddet' }))

    const onayla = await body.findByRole('button', { name: 'Reddet' })
    await expect(onayla).toBeDisabled()

    // Yalnız gerekçe: not hâlâ boş, karar eksik.
    await userEvent.click(body.getByRole('checkbox', { name: /Mükerrer İlan/ }))
    await expect(onayla).toBeDisabled()

    // Gerekçe + not: karar tamam.
    await userEvent.type(
      body.getByRole('textbox', { name: /Moderasyon notu/ }),
      'Aynı gayrimenkule ait aktif ilan var.',
    )
    await expect(onayla).toBeEnabled()
  },
}

/** Boşluktan ibaret not "not girildi" sayılmamalı. */
export const WhitespaceNoteIsNotANote: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(document.body)

    await userEvent.click(canvas.getByRole('button', { name: 'Reddet' }))
    await userEvent.click(body.getByRole('checkbox', { name: /Fiyat Hatası/ }))
    await userEvent.type(body.getByRole('textbox', { name: /Moderasyon notu/ }), '   ')

    await expect(await body.findByRole('button', { name: 'Reddet' })).toBeDisabled()
  },
}

/** Onay kararı: alan yok ama dialog yine de açılmalı — karar öncesi doğrulama zorunlu. */
export const ApproveStillConfirms: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const body = within(document.body)

    await userEvent.click(canvas.getByRole('button', { name: 'Onayla' }))

    await expect(await body.findByRole('dialog')).toBeInTheDocument()
    await expect(args.onApprove).not.toHaveBeenCalled()

    await userEvent.click(body.getByRole('button', { name: 'Onayla ve yayınla' }))

    await expect(args.onApprove).toHaveBeenCalledWith({
      listingId: 'listing-residential-konyaalti-villa',
      expectedRevision: 1,
      reasons: [],
    })
  },
}

/** Pasife alma not ister ama gerekçe istemez — picker çıkmamalı. */
export const PauseAsksForNoteOnly: Story = {
  args: { status: ListingStatus.Published },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const body = within(document.body)

    await userEvent.click(canvas.getByRole('button', { name: 'Pasife al' }))

    await expect(body.queryByRole('group', { name: /Gerekçe/ })).not.toBeInTheDocument()

    const onayla = await body.findByRole('button', { name: 'Pasife al' })
    await expect(onayla).toBeDisabled()

    await userEvent.type(body.getByRole('textbox', { name: /Not/ }), 'Şikayet incelemesi sürüyor.')
    await userEvent.click(onayla)

    await expect(args.onPause).toHaveBeenCalledWith(
      expect.objectContaining({ note: 'Şikayet incelemesi sürüyor.', reasons: [] }),
    )
  },
}

/** Bir karar uçarken diğer butonlar gerçekten kapanmalı. */
export const SubmittingLocksOtherActions: Story = {
  args: { submittingAction: 'approve' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: 'Onayla' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    await expect(canvas.getByRole('button', { name: 'Reddet' })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: 'Düzeltme iste' })).toBeDisabled()
  },
}

/** Vazgeçmek kararı göndermemeli. */
export const CancelSendsNothing: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const body = within(document.body)

    await userEvent.click(canvas.getByRole('button', { name: 'Onayla' }))
    await userEvent.click(await body.findByRole('button', { name: 'Vazgeç' }))

    await expect(args.onApprove).not.toHaveBeenCalled()
  },
}

/**
 * Her durumda hangi eylemlerin çıktığı — brifing 1.2'nin geçiş tablosunun
 * görünür hâli. Boş kalan hücreler kural: o durumda o rol için eylem yok.
 */
export const VariantsComparison: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {VARYANTLAR.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          <div style={{ maxWidth: variant === 'sideRail' ? '16rem' : undefined }}>
            <ModerationActionBar {...args} variant={variant} />
          </div>
        </div>
      ))}
    </div>
  ),
}

/** Durum × rol matrisi: hangi kombinasyonda ne görünüyor. */
export const StatusMatrix: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.5rem', padding: '1rem' }}>
      {[AdminRole.SuperAdmin, AdminRole.ContentReviewer, AdminRole.Support].map((role) => (
        <section key={role} style={{ display: 'grid', gap: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>{ADMIN_ROLE_LABEL[role]}</h3>

          {Object.values(ListingStatus).map((status) => (
            <div
              key={status}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(10rem, 12rem) 1fr',
                gap: '0.75rem',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '1rem', opacity: 0.6 }}>{LISTING_STATUS_LABEL[status]}</span>
              <ModerationActionBar {...args} status={status} capabilities={yetkiler(role)} />
            </div>
          ))}
        </section>
      ))}
    </div>
  ),
}
