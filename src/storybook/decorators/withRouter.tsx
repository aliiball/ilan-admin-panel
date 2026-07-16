import type { Decorator } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

/**
 * Story'leri React Router context'i ile sarmalar.
 *
 * Bu olmadan `<Link>`, `useNavigate()` veya `useLocation()` kullanan her component
 * Storybook'ta "useNavigate() may be used only in the context of a Router" benzeri
 * bir hata ile patlar.
 *
 * Bellek içi router kullanılır — gerçek adres çubuğuna dokunmaz, story'ler
 * birbirinin gezinme geçmişini etkilemez.
 *
 * Başlangıç adresini story bazında değiştirmek için:
 *
 * ```ts
 * parameters: { router: { initialEntries: ['/ilanlar/42'] } }
 * ```
 */
export const withRouter: Decorator = (Story, context) => {
  const initialEntries = context.parameters.router?.initialEntries ?? ['/']

  return (
    <MemoryRouter initialEntries={initialEntries}>
      <Story />
    </MemoryRouter>
  )
}
