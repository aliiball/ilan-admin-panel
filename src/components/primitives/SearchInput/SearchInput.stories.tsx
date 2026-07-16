import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { SearchInput } from './SearchInput'

const meta = {
  title: 'Primitives/SearchInput',
  component: SearchInput,

  tags: ['stable'],

  parameters: {
    docs: {
      description: {
        component:
          '`onSearch` geciktirilerek çağrılır — kullanıcı her harfte değil, yazmayı bıraktığında ' +
          'aranır; ilan listesi gibi büyük sorgularda istek yağmurunu engeller. Temizleme butonu ' +
          'yalnızca değer varken görünür ve basıldığında odağı input’a geri verir.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'form-control',
      useWhen: ['İlan, kullanıcı veya rapor listesi filtrelenirken'],
      doNotUseWhen: ['Form alanı olarak değer alınıyorsa — Input kullanın'],
    },
  },

  args: {
    label: 'İlan ara',
    placeholder: 'İlan no, başlık veya kullanıcı',
    debounceMs: 300,
    disabled: false,
    onSearch: fn(),
    onClear: fn(),
  },

  argTypes: {
    debounceMs: { control: 'number' },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
  },

  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchInput>

export default meta

type Story = StoryObj<typeof meta>

export const Empty: Story = {}

/** Değer varken temizleme butonu belirir. */
export const Filled: Story = {
  args: { defaultValue: 'Kadıköy 3+1' },
}

export const WithResultCount: Story = {
  args: { defaultValue: 'Kadıköy', helperText: '47 ilan bulundu' },
}

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Aranamaz' },
}

export const Small: Story = {
  args: { size: 'sm' },
}

/** Mobilde tam genişlik. */
export const MobileFullWidth: Story = {
  globals: { viewport: { value: 'mobile320' } },
  decorators: [
    (Story) => (
      <div style={{ width: '100%' }}>
        <Story />
      </div>
    ),
  ],
}

export const Interactive: Story = {
  render: function Render(args) {
    const [sorgu, setSorgu] = useState('')
    return (
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <SearchInput {...args} onSearch={setSorgu} />
        <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>
          Aranan: {sorgu === '' ? '(boş)' : sorgu}
        </span>
      </div>
    )
  },
}

/** Debounce gerçekten çalışıyor mu: yazarken değil, durunca aranmalı. */
export const DebouncesSearch: Story = {
  args: { debounceMs: 200 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('searchbox')

    await userEvent.type(input, 'Kadıköy')

    // Yazma sirasinda henuz aranmamis olmali.
    await expect(args.onSearch).not.toHaveBeenCalled()

    // Debounce suresi gecince tek sefer aranir.
    await new Promise((resolve) => setTimeout(resolve, 400))
    await expect(args.onSearch).toHaveBeenCalledWith('Kadıköy')
  },
}
