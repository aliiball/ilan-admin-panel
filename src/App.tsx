import { vars } from './tokens/contract.css'

/**
 * Uygulama kabuğu henüz kurulmadı.
 *
 * Bu aşamada geliştirme yüzeyi Storybook'tur (`pnpm storybook`).
 * Router, AppShell ve sayfalar brifingin Faz 3'ünde eklenecek.
 */
export function App() {
  return (
    <main
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: '100vh',
        padding: vars.space[8],
        textAlign: 'center',
      }}
    >
      <div>
        <h1 style={{ fontSize: vars.font.size['3xl'], marginBottom: vars.space[2] }}>
          İlan Admin Panel
        </h1>
        <p style={{ color: vars.color.text.secondary }}>
          Component geliştirme Storybook üzerinden yürüyor: <code>pnpm storybook</code>
        </p>
      </div>
    </main>
  )
}
