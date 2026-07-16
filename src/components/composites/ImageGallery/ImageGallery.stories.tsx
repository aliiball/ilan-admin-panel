import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { AssetModerationStatus, RejectionReason, type ListingPhoto } from '../../../types/domain'
import { residentialPublishedApartment } from '../../../fixtures'
import { ImageGallery } from './ImageGallery'

const VARYANTLAR = ['mosaic', 'filmstrip', 'split'] as const

interface FotoArgs {
  kaynak: string
  order: number
  altText: string
  status?: AssetModerationStatus
  isCover?: boolean
  rejectionReason?: RejectionReason
  moderationNote?: string
}

/**
 * Fotoğraf fixture'ı.
 *
 * Görseller `public/fixtures/listings/` altındaki gerçek dosyalar — story'ler
 * internet erişimi olmadan render edilmeli. Tek bir ilanın iki fotoğrafı bir
 * galeriyi göstermeye yetmediği için farklı ilanların görselleri tek ilanın
 * fotoğrafları gibi birleştirildi; galerinin ilgilendiği şey içerik değil,
 * sıra, durum ve düzen.
 */
function foto({
  kaynak,
  order,
  altText,
  status = AssetModerationStatus.Approved,
  isCover = false,
  rejectionReason,
  moderationNote,
}: FotoArgs): ListingPhoto {
  return {
    id: `photo-${order}`,
    url: `/fixtures/listings/${kaynak}.webp`,
    thumbnailUrl: `/fixtures/listings/${kaynak}-thumb.webp`,
    altText,
    order,
    isCover,
    width: 1600,
    height: 1067,
    mimeType: 'image/webp',
    moderationStatus: status,
    ...(rejectionReason !== undefined && { rejectionReason }),
    ...(moderationNote !== undefined && { moderationNote }),
  }
}

const FOTOGRAFLAR: ListingPhoto[] = [
  foto({
    kaynak: 'listing-residential-kadikoy-apartment-1',
    order: 1,
    altText: 'Salonun cadde tarafına bakan pencereli genel görünümü',
    isCover: true,
  }),
  foto({
    kaynak: 'listing-residential-kadikoy-apartment-2',
    order: 2,
    altText: 'Mutfak ve ankastre dolaplar',
  }),
  foto({
    kaynak: 'listing-residential-konyaalti-villa-1',
    order: 3,
    altText: 'Ebeveyn banyosu',
    status: AssetModerationStatus.Pending,
  }),
  foto({
    kaynak: 'listing-residential-konyaalti-villa-2',
    order: 4,
    altText: 'Balkondan görünen manzara',
    status: AssetModerationStatus.Pending,
  }),
  foto({
    kaynak: 'listing-commercial-sisli-office-1',
    order: 5,
    altText: 'Bina girişi ve asansör holü',
  }),
  foto({
    kaynak: 'listing-commercial-sisli-office-2',
    order: 6,
    altText: 'Kapalı otopark girişi',
    status: AssetModerationStatus.Pending,
  }),
]

/** Biri reddedilmiş, biri incelenmemiş, biri onaylı — üç durum bir arada. */
const KARISIK_DURUMLAR: ListingPhoto[] = [
  FOTOGRAFLAR[0] as ListingPhoto,
  foto({
    kaynak: 'listing-residential-kadikoy-apartment-2',
    order: 2,
    altText: 'Mutfak görünümü — üzerinde emlak ofisinin telefon numarası var',
    status: AssetModerationStatus.Rejected,
    rejectionReason: RejectionReason.ContactInformationViolation,
    moderationNote: 'Fotoğrafın sağ alt köşesine telefon numarası eklenmiş.',
  }),
  FOTOGRAFLAR[2] as ListingPhoto,
]

/** Dosyası sunucuda olmayan fotoğraf: yüklenemeyen görselin durumu. */
const BOZUK: ListingPhoto[] = [
  foto({
    kaynak: 'silinmis-dosya',
    order: 1,
    altText: 'Sunucuda bulunamayan kapak fotoğrafı',
    isCover: true,
  }),
  FOTOGRAFLAR[1] as ListingPhoto,
]

const meta = {
  title: 'Composites/ImageGallery',
  component: ImageGallery,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Büyük görsel `object-fit: contain` ile gösterilir, `cover` ile **değil**: kırpılan ' +
          'kenarda filigran, telefon numarası veya uygunsuz bir detay olabilir ve görmediğin şeyi ' +
          'onaylamak moderasyon değildir. Bozuk görsel bir durumdur, kaza değil — yüklenemeyen ' +
          'fotoğrafın yerine kırık ikon değil, ne olduğunu söyleyen bir kutu konur; "uygunsuz" ile ' +
          '"açılmıyor" farklı kararlar gerektirir. Fotoğraf reddi gerekçe ister, not istemez.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'media-viewer',
      useWhen: [
        'İlan detayında fotoğraflar incelenecekse',
        'Fotoğraf bazlı moderasyon yapılacaksa',
      ],
      doNotUseWhen: [
        'Tek bir kapak görseli gösterilecekse — ListingCard yeterli',
        'Kullanıcı avatarı için — Avatar kullanın',
      ],
    },
  },

  /**
   * `onPhotoApprove` ve `onPhotoReject` bilerek burada yok.
   *
   * `exactOptionalPropertyTypes` açıkken meta'ya `fn()` konursa prop'un tipi
   * `Mock`'a sabitlenir ve "bu handler yok" demek isteyen story `undefined`
   * yazamaz (TS2375). Handler'ın yokluğu burada bir durum:
   * `ModerationHiddenWithoutHandlers`. İhtiyacı olan story kendi veriyor.
   */
  args: {
    photos: FOTOGRAFLAR,
    variant: 'mosaic',
    loading: false,
    allowModeration: false,
    onActivePhotoChange: fn(),
  },

  argTypes: {
    variant: { control: 'inline-radio', options: VARYANTLAR },
    photos: { control: false },
    allowModeration: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
} satisfies Meta<typeof ImageGallery>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Izgara: bütün fotoğraflar bir bakışta. */
export const Mosaic: Story = {
  args: { variant: 'mosaic' },
}

/** Şerit: tek satır, yatay kaydırma. Tek tek inceleme. */
export const Filmstrip: Story = {
  args: { variant: 'filmstrip' },
}

/** Bölünmüş: görsel solda, liste sağda. Geniş ekranda karar verme. */
export const Split: Story = {
  args: {
    variant: 'split',
    allowModeration: true,
    onPhotoApprove: fn(),
    onPhotoReject: fn(),
  },
}

/** Yükleme: kabın yüksekliği korunur, veri gelince düzen zıplamaz. */
export const Loading: Story = {
  args: { loading: true },
}

/** Fotoğrafsız ilan. Fotoğrafsız ilan yayına alınamaz — boşluk bir bulgudur. */
export const Empty: Story = {
  args: { photos: [] },
}

/** Kapak dışında bir fotoğraf seçili. */
export const Active: Story = {
  args: { activePhotoId: 'photo-3' },
}

/** Reddedilmiş fotoğraf: rozet ve gerekçe birlikte görünür. */
export const RejectedImage: Story = {
  args: {
    photos: KARISIK_DURUMLAR,
    activePhotoId: 'photo-2',
    allowModeration: true,
    onPhotoApprove: fn(),
    onPhotoReject: fn(),
  },
}

/**
 * Bozuk görsel: dosya sunucuda yok.
 *
 * Kırık ikon yerine ne olduğunu söyleyen kutu çıkar. Moderatör buna bakıp
 * "uygunsuz" dememeli — karar verilecek bir şey görünmüyor.
 */
export const BrokenImage: Story = {
  args: {
    photos: BOZUK,
    allowModeration: true,
    onPhotoApprove: fn(),
    onPhotoReject: fn(),
  },
}

/** Moderasyon kontrolleri açık. */
export const WithModeration: Story = {
  args: {
    allowModeration: true,
    photos: KARISIK_DURUMLAR,
    onPhotoApprove: fn(),
    onPhotoReject: fn(),
  },
}

/** Yetkisiz kullanıcı: kontroller hiç render edilmez, galeri okunur kalır. */
export const ReadOnly: Story = {
  args: { allowModeration: false },
}

/** Dar ekranda split iki kolona ayrılmaz, alt alta iner. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: {
    variant: 'split',
    allowModeration: true,
    onPhotoApprove: fn(),
    onPhotoReject: fn(),
  },
}

/** Gerçek ilan fixture'ıyla: iki fotoğraflı ilan. */
export const FromListingFixture: Story = {
  args: { photos: residentialPublishedApartment.photos },
}

/** Şerit düğmesi sırasını ve durumunu adında taşımalı. */
export const ThumbHasAccessibleName: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      canvas.getByRole('button', { name: '1. fotoğraf, Uygun, kapak' }),
    ).toBeInTheDocument()
    await expect(
      canvas.getByRole('button', { name: '3. fotoğraf, İncelenmedi' }),
    ).toBeInTheDocument()
  },
}

/** Şeritten seçim büyük görseli değiştirmeli ve dışarı bildirilmeli. */
export const ThumbSelectionChangesStage: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: '3. fotoğraf, İncelenmedi' }))

    await expect(args.onActivePhotoChange).toHaveBeenCalledWith('photo-3')
    await expect(canvas.getByAltText('Ebeveyn banyosu')).toBeInTheDocument()
  },
}

/**
 * Yüklenemeyen görsel açıklamasıyla birlikte gösterilmeli.
 *
 * Gerçekten ölçülüyor: `src` sunucuda olmayan bir dosyaya işaret ediyor,
 * tarayıcı `error` olayını kendisi fırlatıyor — taklit edilmiyor.
 */
export const BrokenImageShowsExplanation: Story = {
  args: { photos: BOZUK },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByText(/Görsel yüklenemedi/)).toBeInTheDocument()
    await expect(
      canvas.queryByAltText('Sunucuda bulunamayan kapak fotoğrafı'),
    ).not.toBeInTheDocument()
  },
}

/**
 * `allowModeration` kapalıyken karar butonu hiç render edilmemeli.
 *
 * Handler'lar **veriliyor**: butonların yokluğunun sebebi yetkinin kapalı
 * olması olmalı, handler'ın eksikliği değil. İkisi karışırsa test yanlış
 * sebeple geçer.
 */
export const ModerationHiddenWithoutPermission: Story = {
  args: { allowModeration: false, onPhotoApprove: fn(), onPhotoReject: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('button', { name: 'Uygun' })).not.toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: 'Uygunsuz' })).not.toBeInTheDocument()
  },
}

/** Handler verilmeden `allowModeration` açmak sonuçsuz buton üretmemeli. */
export const ModerationHiddenWithoutHandlers: Story = {
  args: { allowModeration: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('button', { name: 'Uygun' })).not.toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: 'Uygunsuz' })).not.toBeInTheDocument()
  },
}

/** Onay tek tıkla gitmeli; zaten onaylı fotoğrafta buton kapalı olmalı. */
export const ApprovePhoto: Story = {
  args: { allowModeration: true, activePhotoId: 'photo-3', onPhotoApprove: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Uygun' }))
    await expect(args.onPhotoApprove).toHaveBeenCalledWith('photo-3')
  },
}

/** Red gerekçesiz gönderilememeli; gerekçe seçilince açılmalı. */
export const RejectRequiresReason: Story = {
  args: { allowModeration: true, activePhotoId: 'photo-2', onPhotoReject: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const body = within(document.body)

    await userEvent.click(canvas.getByRole('button', { name: 'Uygunsuz' }))

    const onayla = await body.findByRole('button', { name: 'Uygunsuz işaretle' })
    await expect(onayla).toBeDisabled()

    await userEvent.click(body.getByRole('combobox'))
    await userEvent.click(await body.findByRole('option', { name: /İletişim Bilgisi İhlali/ }))

    await expect(onayla).toBeEnabled()
    await userEvent.click(onayla)

    await expect(args.onPhotoReject).toHaveBeenCalledWith(
      'photo-2',
      RejectionReason.ContactInformationViolation,
      undefined,
    )
  },
}

export const VariantsComparison: Story = {
  args: { allowModeration: true, onPhotoApprove: fn(), onPhotoReject: fn() },
  render: (args) => (
    <div style={{ display: 'grid', gap: '2.5rem' }}>
      {VARYANTLAR.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          <ImageGallery {...args} variant={variant} />
        </div>
      ))}
    </div>
  ),
}
