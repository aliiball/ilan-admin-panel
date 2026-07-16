import { vars } from './styles/theme.css'

/**
 * Uygulama kabuğu henüz kurulmadı.
 *
 * Bu aşamada geliştirme yüzeyi Storybook'tur (`pnpm storybook`).
 * Router, layout ve sayfalar component katmanı oturduktan sonra eklenecek.
 */
export function App() {
  return (
    <main
      style={{
        display: 'grid',
        placeItems: 'center',
        height: '100%',
        padding: vars.space['2xl'],
        textAlign: 'center',
      }}
    >
      <div>
        <h1 style={{ fontSize: vars.font.size['2xl'], marginBottom: vars.space.sm }}>
          İlan Admin Panel
        </h1>
        <p style={{ color: vars.color.text.secondary }}>
          Component geliştirme Storybook üzerinden yürüyor: <code>pnpm storybook</code>
        </p>
      </div>
    </main>
  )
}
