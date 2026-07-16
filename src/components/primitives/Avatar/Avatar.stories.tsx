import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar } from './Avatar'

/** Ağ bağlantısı gerektirmeyen, gömülü fixture görseli. */
const DEMO_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
       <rect width="128" height="128" fill="#1d4ed8"/>
       <circle cx="64" cy="48" r="24" fill="#dbeafe"/>
       <ellipse cx="64" cy="112" rx="40" ry="32" fill="#dbeafe"/>
     </svg>`,
  )

const meta = {
  title: 'Primitives/Avatar',
  component: Avatar,

  tags: ['stable'],

  parameters: {
    docs: {
      description: {
        component:
          'Görsel yüklenemezse baş harflere düşer — bozuk resim ikonu göstermez. Avatar ' +
          'dekoratiftir; yanında zaten ad yazdığı için `alt` boştur, aksi hâlde ekran okuyucu ' +
          'adı iki kez okur. Baş harfler Türkçe’ye uygun büyütülür (i → İ).',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'identity',
      useWhen: ['Kullanıcı veya ilan sahibi gösterilirken', 'Top bar’da profil gösterilirken'],
      doNotUseWhen: ['İlan fotoğrafı gösterilirken — ImageGallery kullanın'],
    },
  },

  args: {
    name: 'Ayşe Demir',
    size: 'md',
  },

  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
    status: { control: 'inline-radio', options: [undefined, 'online', 'offline', 'busy'] },
  },
} satisfies Meta<typeof Avatar>

export default meta

type Story = StoryObj<typeof meta>

export const WithImage: Story = {
  args: { src: DEMO_AVATAR },
}

/** Görsel yokken baş harfler. */
export const Fallback: Story = {}

/** Bozuk görselde de baş harflere düşer, kırık resim ikonu görünmez. */
export const BrokenImage: Story = {
  args: { src: '/bulunmayan-gorsel.png' },
}

export const SingleName: Story = {
  args: { name: 'Marmara' },
}

/** Türkçe büyütme: "ilker" → "İ", "ırmak" → "I". */
export const TurkishInitials: Story = {
  args: { name: 'ilker ırmak' },
}

export const Online: Story = {
  args: { src: DEMO_AVATAR, status: 'online' },
}

export const Busy: Story = {
  args: { src: DEMO_AVATAR, status: 'busy' },
}

export const Small: Story = {
  args: { size: 'sm' },
}

export const ExtraLarge: Story = {
  args: { size: 'xl', src: DEMO_AVATAR },
}

export const VariantsComparison: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Avatar {...args} size="sm" src={DEMO_AVATAR} />
        <Avatar {...args} size="md" src={DEMO_AVATAR} />
        <Avatar {...args} size="lg" src={DEMO_AVATAR} />
        <Avatar {...args} size="xl" src={DEMO_AVATAR} />
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Avatar {...args} name="Ayşe Demir" />
        <Avatar {...args} name="Marmara Emlak" />
        <Avatar {...args} name="ilker ırmak" />
        <Avatar {...args} name="Yapı Proje İnşaat" />
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Avatar {...args} src={DEMO_AVATAR} status="online" />
        <Avatar {...args} src={DEMO_AVATAR} status="offline" />
        <Avatar {...args} src={DEMO_AVATAR} status="busy" />
      </div>
    </div>
  ),
}
