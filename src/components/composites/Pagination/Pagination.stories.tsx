import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Pagination } from './Pagination'
import { cokluKopyaLandmarkMuafiyeti } from '../../../storybook/a11y'

const BOYUTLAR = [10, 20, 50, 100]

const meta = {
  title: 'Composites/Pagination',
  component: Pagination,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '`page` **1-tabanlıdır** — kullanıcıya gösterilen sayı ile prop aynı olsun diye. ' +
          '`totalItems === 0` iken hiç render edilmez: sayfalanacak bir şey yoktur, mesajı ' +
          '`EmptyState` verir. Sayfa numaraları `<button>`’dır ve erişilebilir adları "Sayfa 3" ' +
          'şeklindedir; yalnız "3" duyan kullanıcı neyin üçü olduğunu bilemez. Geçerli sayfa ' +
          'yalnız renkle değil, dolu zemin ve kalın yazıyla da işaretlenir.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'navigation',
      useWhen: ['Sayfalanmış bir liste veya tablo gösterilirken'],
      doNotUseWhen: ['Kayıt sayısı sabit ve azsa — sayfalama gürültü olur'],
    },
  },

  args: {
    page: 3,
    pageSize: 20,
    totalItems: 240,
    variant: 'numbered',
    disabled: false,
    onPageChange: fn(),
  },

  argTypes: {
    variant: { control: 'inline-radio', options: ['numbered', 'compact', 'loadMore'] },
    page: { control: { type: 'number', min: 1 } },
    pageSize: { control: { type: 'number', min: 1 } },
    totalItems: { control: { type: 'number', min: 0 } },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Pagination>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** İlk sayfa: "önceki" gidilecek yer olmadığı için kapalı. */
export const FirstPage: Story = {
  args: { page: 1 },
}

/** Orta sayfa: iki yanda da `…` var, ilk ve son sayfa hep erişilebilir. */
export const MiddlePage: Story = {
  args: { page: 6 },
}

/** Son sayfa: "sonraki" kapalı, özet kalan kayıt sayısını doğru gösterir. */
export const LastPage: Story = {
  args: { page: 12 },
}

/** Tek sayfa: ileri/geri ikisi de kapalı, numara listesi tek elemanlı. */
export const SinglePage: Story = {
  args: { page: 1, totalItems: 12 },
}

/** Yeni sayfa yüklenirken tüm kontroller kapanır. */
export const Disabled: Story = {
  args: { disabled: true },
}

export const WithPageSizeSelect: Story = {
  args: { pageSizeOptions: BOYUTLAR, onPageSizeChange: fn() },
}

/** Dar ekranda numara dizisi sığmaz; ileri/geri ve konum yeter. */
export const Compact: Story = {
  args: { variant: 'compact' },
}

/** Sayfalar birikerek yüklenir; "önceki" kavramı yoktur. */
export const LoadMore: Story = {
  args: { variant: 'loadMore', page: 2 },
}

/** Son sayfada yüklenecek bir şey kalmadığı için buton hiç çıkmaz. */
export const LoadMoreExhausted: Story = {
  args: { variant: 'loadMore', page: 12 },
}

/** Çok sayfa: kısaltma olmasa 200 numara satırı taşırırdı. */
export const ManyPages: Story = {
  args: { page: 97, totalItems: 4000 },
}

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { variant: 'compact' },
}

export const MobileNumbered: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { page: 6 },
}

/**
 * Sayfalanacak kayıt yoksa component hiç render edilmez — boş bir sayfalama
 * çubuğu kullanıcıya yanlışlıkla "veri var ama boş" hissi verir.
 */
export const NoItemsRendersNothing: Story = {
  args: { totalItems: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('navigation')).not.toBeInTheDocument()
  },
}

/** Geçerli sayfa `aria-current="page"` taşımalı ve ilk sayfada "önceki" kapalı olmalı. */
export const CurrentPageIsAnnounced: Story = {
  args: { page: 1 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: 'Sayfa 1' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(canvas.getByRole('button', { name: 'Sayfa 2' })).not.toHaveAttribute(
      'aria-current',
    )
    await expect(canvas.getByRole('button', { name: 'Önceki sayfa' })).toBeDisabled()
  },
}

/** Numaraya tıklayınca o sayfa, "sonraki"ye tıklayınca bir sonraki bildirilmeli. */
export const PageChangeReportsNumber: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Sayfa 12' }))
    await expect(args.onPageChange).toHaveBeenCalledWith(12)

    await userEvent.click(canvas.getByRole('button', { name: 'Sonraki sayfa' }))
    await expect(args.onPageChange).toHaveBeenCalledWith(4)
  },
}

/** Son sayfada "sonraki" kapalı olmalı: olmayan sayfaya istek gitmemeli. */
export const LastPageDisablesNext: Story = {
  args: { page: 12 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: 'Sonraki sayfa' })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: 'Önceki sayfa' })).toBeEnabled()
  },
}

/**
 * Aralık dışı `page` kırpılır: sayfa boyutu büyüyünce eski sayfa numarası
 * geçersiz kalabilir, component bunu çökmeden son sayfaya indirir.
 */
export const OutOfRangePageIsClamped: Story = {
  args: { page: 99, totalItems: 40 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: 'Sayfa 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(canvas.getByRole('button', { name: 'Sonraki sayfa' })).toBeDisabled()
  },
}

export const Interactive: Story = {
  render: function Render(args) {
    const [sayfa, setSayfa] = useState(1)
    const [boyut, setBoyut] = useState(20)

    return (
      <Pagination
        {...args}
        page={sayfa}
        pageSize={boyut}
        pageSizeOptions={BOYUTLAR}
        onPageChange={setSayfa}
        onPageSizeChange={(next) => {
          setBoyut(next)
          // Sayfayı 1'e döndürmek üst katmanın işi: 10. sayfadayken boyut
          // 20'den 100'e çıkarsa o sayfa artık yok.
          setSayfa(1)
        }}
      />
    )
  },
}

export const VariantsComparison: Story = {
  /* Üç varyant = "Sayfalama" adlı üç `<nav>`. Uygulamada bir tane olur. */
  parameters: cokluKopyaLandmarkMuafiyeti,
  render: (args) => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {(['numbered', 'compact', 'loadMore'] as const).map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          <Pagination {...args} variant={variant} />
        </div>
      ))}
    </div>
  ),
}
