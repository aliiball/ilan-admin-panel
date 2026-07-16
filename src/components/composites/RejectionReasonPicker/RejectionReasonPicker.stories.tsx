import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { RejectionReason } from '../../../types/domain'
import { RejectionReasonPicker } from './RejectionReasonPicker'

const VARYANTLAR = ['cards', 'list', 'compactSelect'] as const

const meta = {
  title: 'Composites/RejectionReasonPicker',
  component: RejectionReasonPicker,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Gerekçe ve notu **birlikte** toplar: gerekçe hangi kuralın çiğnendiğini, not bu ilanda ' +
          'tam olarak neyin yanlış olduğunu söyler. İlan sahibine giden mesaj ikisinin toplamıdır — ' +
          'tek başına "Yanıltıcı veya Eksik Bilgi" hiçbir şeyi düzeltmez. Zorunluluğu **denetlemez**: ' +
          '`required` yalnız işareti koyar, gönderimi kapatmak kararın sahibi olan üst katmanın işi ' +
          '(`isModerationDecisionComplete`).',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'form-group',
      useWhen: [
        'Red veya düzeltme kararında gerekçe ve not toplanacaksa',
        'ModerationActionBar dışında, karar formunun kendi ekranında',
      ],
      doNotUseWhen: [
        'Karar butonlarıyla birlikte tam akış gerekiyorsa — ModerationActionBar zaten bunu içeriyor',
        'Şikayet gerekçesi için — o ReportReason, ayrı bir enum',
      ],
    },
  },

  args: {
    value: [],
    note: '',
    variant: 'cards',
    required: false,
    disabled: false,
    onValueChange: fn(),
    onNoteChange: fn(),
  },

  argTypes: {
    variant: { control: 'inline-radio', options: VARYANTLAR },
    value: { control: false },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof RejectionReasonPicker>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Kararın asıl verildiği görünüm: her gerekçe açıklamasıyla birlikte. */
export const Cards: Story = {
  args: { variant: 'cards' },
}

/** Açıklamasız, sıkışık. Dialog içinde dikey alan pahalıdır. */
export const List: Story = {
  args: { variant: 'list' },
}

/** Tek satır: toolbar ve satır içi kullanım. */
export const CompactSelect: Story = {
  args: { variant: 'compactSelect' },
}

/** Hiçbir gerekçe seçilmemiş, not boş — dialog ilk açıldığındaki hâli. */
export const Empty: Story = {
  args: { value: [], note: '' },
}

export const Selected: Story = {
  args: {
    value: [RejectionReason.MisleadingOrIncompleteInfo, RejectionReason.PricingError],
    note: 'Net m² 128 yazılmış, tapu belgesinde 118 görünüyor. Fiyat da benzer ilanların yaklaşık on katı.',
  },
}

/** Gerekçe seçilmeden gönderilmeye çalışılmış. */
export const Error: Story = {
  args: {
    required: true,
    error: 'En az bir gerekçe seçin.',
    note: 'Açıklamadaki bilgiler tapu belgesiyle uyuşmuyor.',
  },
}

/** Karar gönderilirken alanlar kilitlenir; yarıda değiştirilen gerekçe yükü bozar. */
export const Disabled: Story = {
  args: {
    disabled: true,
    value: [RejectionReason.DuplicateListing],
    note: 'Aynı gayrimenkule ait aktif bir ilan bulundu.',
  },
}

/** Zorunlu işareti hem gerekçe grubunda hem notta görünür. */
export const Required: Story = {
  args: { required: true },
}

/**
 * Uzun içerik: on beş gerekçenin tamamı seçili, not sınıra dayanmış.
 *
 * Sayaç sınıra yaklaşınca renk değiştirir; kartlar sarar, taşmaz.
 */
export const LongContent: Story = {
  args: {
    value: Object.values(RejectionReason),
    required: true,
    error:
      'Bu ilan için seçilen gerekçelerin bir kısmı birbiriyle çelişiyor: "Mükerrer İlan" ile "Sahte İlan Şüphesi" aynı anda seçildiğinde ilan sahibine gönderilecek mesaj iki farklı düzeltme talimatı içerir.',
    note: 'İlanın başlığında "acil satılık" vurgusu tekrarlı büyük harfle yazılmış, açıklamada iki farklı telefon numarası ve bir yönlendirme bağlantısı bulunuyor. Fotoğrafların dördü başka bir ilandan alınmış, ikisi filigranlı. Net metrekare 128 yazılmış ancak tapu belgesinde 118 görünüyor. Fiyat aynı mahalledeki benzer ilanların yaklaşık on katı. Konum bilgisi Caferağa olarak girilmiş, koordinat Moda sınırlarında. Yetki belgesi yüklenmemiş.',
  },
}

/** Dar ekranda kartlar tek kolona iner ve fieldset küçülmeyi reddetmemeli. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { value: [RejectionReason.InappropriateImage] },
}

/**
 * Grubun erişilebilir adı `<legend>`'den gelmeli.
 *
 * DOM'dan ölçülüyor: on beş kutunun her biri kendi etiketini taşıyor ama ekran
 * okuyucu kullanıcısı gruba girdiğinde "Gerekçe, grup" duymazsa bunların neyin
 * seçenekleri olduğunu bilemez.
 */
export const GroupHasAccessibleName: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('group', { name: /Gerekçe/ })).toBeInTheDocument()
  },
}

/** Hata mesajı gruba `aria-describedby` ile bağlanmalı — görsel değil, programatik bağ. */
export const ErrorIsBoundToGroup: Story = {
  args: { required: true, error: 'En az bir gerekçe seçin.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const grup = canvas.getByRole('group', { name: /Gerekçe/ })
    const hataId = grup.getAttribute('aria-describedby')

    await expect(hataId).not.toBeNull()
    await expect(canvasElement.querySelector(`#${CSS.escape(hataId ?? '')}`)).toHaveTextContent(
      'En az bir gerekçe seçin.',
    )
  },
}

/** Seçim, listenin tamamıyla bildirilmeli — picker kendi kopyasını tutmaz. */
export const SelectingReportsWholeList: Story = {
  args: { value: [RejectionReason.WrongCategory] },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('checkbox', { name: /Fiyat Hatası/ }))

    await expect(args.onValueChange).toHaveBeenCalledWith([
      RejectionReason.WrongCategory,
      RejectionReason.PricingError,
    ])
  },
}

/** Seçili bir gerekçeye tekrar basmak onu listeden çıkarmalı. */
export const DeselectingRemovesFromList: Story = {
  args: { value: [RejectionReason.WrongCategory, RejectionReason.PricingError] },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('checkbox', { name: /Fiyat Hatası/ }))

    await expect(args.onValueChange).toHaveBeenCalledWith([RejectionReason.WrongCategory])
  },
}

/** Not her tuş vuruşunda bildirilmeli; geciktirme çağıranın işi. */
export const NoteReportsEveryKeystroke: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.type(canvas.getByRole('textbox', { name: /Moderasyon notu/ }), 'Tapu')

    await expect(args.onNoteChange).toHaveBeenCalledTimes(4)
  },
}

/**
 * `disabled` iken hem kutular hem not kilitli olmalı.
 *
 * Kutularda `toBeDisabled()` **kullanılmıyor**: Base UI'ın Checkbox'ı bir
 * `<span role="checkbox">` render ediyor ve devre dışılığını `aria-disabled`
 * ile bildiriyor. `toBeDisabled()` yalnız native `disabled` attribute'unu
 * tanır, span'de onu bulamaz ve kutu gerçekten kilitliyken de düşer —
 * yani yanlış olan matcher'dır, component değil. Notta ise gerçek bir
 * `<textarea disabled>` var, orada native matcher doğru araç.
 */
export const DisabledLocksEveryControl: Story = {
  args: { disabled: true, value: [RejectionReason.DuplicateListing] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    for (const kutu of canvas.getAllByRole('checkbox')) {
      await expect(kutu).toHaveAttribute('aria-disabled', 'true')
    }

    await expect(canvas.getByRole('textbox', { name: /Moderasyon notu/ })).toBeDisabled()
  },
}

/** Gerçek seçimle: kartlar işaretlendikçe vurgulanır, not sayacı işler. */
export const Interactive: Story = {
  render: function Render(args) {
    const [gerekceler, setGerekceler] = useState<RejectionReason[]>([])
    const [not, setNot] = useState('')

    return (
      <RejectionReasonPicker
        {...args}
        value={gerekceler}
        note={not}
        onValueChange={setGerekceler}
        onNoteChange={setNot}
      />
    )
  },
}

export const VariantsComparison: Story = {
  args: { value: [RejectionReason.MisleadingOrIncompleteInfo, RejectionReason.PricingError] },
  render: (args) => (
    <div style={{ display: 'grid', gap: '2.5rem' }}>
      {VARYANTLAR.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          <RejectionReasonPicker {...args} variant={variant} />
        </div>
      ))}
    </div>
  ),
}
