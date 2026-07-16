import type { Meta, StoryObj } from '@storybook/react-vite'
import { Skeleton } from './Skeleton'

const meta = {
  title: 'Primitives/Skeleton',
  component: Skeleton,

  tags: ['stable'],

  parameters: {
    docs: {
      description: {
        component:
          'İçeriğin ölçüsünü koruyan yükleme göstergesi. Veri geldiğinde sayfa zıplamaz. ' +
          'Boş ekran + spinner yerine bu tercih edilir. Tamamı `aria-hidden`’dır.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'loading-indicator',
      useWhen: ['Tablo, kart veya sayfa yüklenirken', 'İçeriğin ölçüsü önceden biliniyorken'],
      doNotUseWhen: ['Buton içi kısa işlemde — Spinner kullanın'],
    },
  },

  args: {
    variant: 'text',
  },

  argTypes: {
    variant: { control: 'inline-radio', options: ['text', 'circle', 'rectangle'] },
    width: { control: 'text' },
    height: { control: 'text' },
    lines: { control: { type: 'number', min: 1, max: 8 } },
  },
} satisfies Meta<typeof Skeleton>

export default meta

type Story = StoryObj<typeof meta>

export const Text: Story = {
  args: { width: '20rem' },
}

export const MultilineText: Story = {
  args: { lines: 3, width: '20rem' },
}

export const Circle: Story = {
  args: { variant: 'circle', width: '3rem' },
}

export const Rectangle: Story = {
  args: { variant: 'rectangle', width: '20rem', height: '8rem' },
}

/** Gerçek bir ilan kartının yükleme hali — ölçüler içerikle aynı. */
export const ListingCardPlaceholder: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '8rem 1fr',
        gap: '1rem',
        width: '28rem',
        padding: '1rem',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-surface)',
      }}
      aria-busy="true"
    >
      <Skeleton variant="rectangle" height="6rem" />
      <div style={{ display: 'grid', gap: '0.75rem', alignContent: 'start' }}>
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="55%" />
        <Skeleton variant="rectangle" width="7rem" height="1.75rem" />
      </div>
    </div>
  ),
}

export const VariantsComparison: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1.5rem', width: '22rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Skeleton variant="circle" width="2.5rem" />
        <Skeleton variant="text" width="10rem" />
      </div>
      <Skeleton variant="text" lines={3} />
      <Skeleton variant="rectangle" height="5rem" />
    </div>
  ),
}
