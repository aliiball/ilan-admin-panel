import type { Meta, StoryObj } from '@storybook/react-vite'
import { Divider } from './Divider'

const meta = {
  title: 'Primitives/Divider',
  component: Divider,

  tags: ['stable'],

  parameters: {
    docs: {
      description: {
        component:
          'Form ve detay bölümlerini ayırır. Etiketli hâlde metin ayırıcının parçasıdır, ' +
          'bölüm başlığı değildir — başlık gerekiyorsa `PageHeader` veya bir `<h*>` kullanın.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'layout',
      useWhen: ['Form bölümleri ayrılırken', 'Toolbar’da eylem grupları ayrılırken'],
      doNotUseWhen: ['Bölüm başlığı gerekiyorsa'],
    },
  },

  args: {
    orientation: 'horizontal',
  },

  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    label: { control: 'text' },
  },
} satisfies Meta<typeof Divider>

export default meta

type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: (args) => (
    <div style={{ width: '24rem' }}>
      <Divider {...args} />
    </div>
  ),
}

export const WithLabel: Story = {
  args: { label: 'Moderasyon bilgileri' },
  render: (args) => (
    <div style={{ width: '24rem' }}>
      <Divider {...args} />
    </div>
  ),
}

export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'stretch', height: '2rem' }}>
      <span>Onayla</span>
      <Divider {...args} />
      <span>Reddet</span>
      <Divider {...args} />
      <span>Arşivle</span>
    </div>
  ),
}

export const VariantsComparison: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1.5rem', width: '24rem' }}>
      <Divider />
      <Divider label="Etiketli" />
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'stretch', height: '1.5rem' }}>
        <span>Sol</span>
        <Divider orientation="vertical" />
        <span>Sağ</span>
      </div>
    </div>
  ),
}
