# İlan Admin Panel

Gayrimenkul ilan platformunun admin panel arayüzü. Bu repository yalnızca Admin
Panel'i içerir; public Front Pages ayrı bir repository'dedir ve component paylaşımı
yoktur.

Geliştirme component öncelikli yürür: her component önce Storybook'ta izole olarak
yazılır ve story'lenir.

## Gereksinimler

- Node.js 24 (`.nvmrc`)
- pnpm 11 (`corepack enable`)

## Kurulum

```bash
pnpm install
pnpm exec playwright install chromium   # story testleri browser mode'da çalışır
```

## Komutlar

| Komut                       | Ne yapar                                                   |
| --------------------------- | ---------------------------------------------------------- |
| `pnpm storybook`            | Storybook'u 6007 portunda açar (geliştirme burada yapılır) |
| `pnpm dev`                  | Uygulama kabuğunu açar (henüz iskelet)                     |
| `pnpm test-storybook --run` | Story'leri gerçek tarayıcıda çalıştırır                    |
| `pnpm typecheck`            | TypeScript kontrolü                                        |
| `pnpm format`               | Kodu Prettier ile biçimlendirir                            |
| `pnpm lint`                 | oxlint çalıştırır (uyarılar da hata sayılır)               |
| `pnpm build-storybook`      | Statik Storybook üretir                                    |
| `pnpm build`                | Uygulamayı derler                                          |

> Port 6007 bilinçli seçildi: front-pages repository'si 6006'yı kullanır, ikisi aynı
> anda lokalde çalışabilsin diye.

Her push'ta CI aynı kontrolleri çalıştırır: format, lint, typecheck, story testleri
ve Storybook build. Commit atmadan önce `pnpm format` çalıştırmak CI'ın format
adımında kırmızı yanmanı engeller.

## Teknoloji

| Katman               | Seçim                                           |
| -------------------- | ----------------------------------------------- |
| Runtime              | React 19                                        |
| Build                | Vite 8 + TypeScript 6                           |
| Routing              | React Router 8                                  |
| Component primitives | Base UI (headless, erişilebilirlik hazır)       |
| Stil                 | vanilla-extract (zero-runtime, tip güvenli CSS) |
| Veri / tablo / form  | TanStack Query, Table, Form, Virtual            |
| Component kataloğu   | Storybook 10 (docs, a11y, vitest, mcp)          |

## Yapı

```
.storybook/          Storybook yapılandırması (main, preview, manager, theme)
src/
  components/        Genel amaçlı UI component'leri
    actions/Button/  Component standardının referansı — yeni component'ler bunu kopyalar
  styles/
    theme.css.ts     Design token'ları (tek değişim noktası)
    global.css.ts    Reset ve temel stiller
```

### Component standardı

Her component kendi klasöründe dört dosyadan oluşur:

```
Button/
  Button.tsx         Component + prop'ların JSDoc'ları
  Button.css.ts      vanilla-extract stilleri
  Button.stories.tsx Story'ler
  index.ts           Public export
```

Kurallar:

- Component'ler ham renk/ölçü değeri içermez, yalnızca `vars` üzerinden token kullanır.
- Prop'lara JSDoc yazmak zorunludur: bu açıklamalar Storybook Controls paneline ve
  AI manifest'ine (`manifests/components.json`) doğrudan akar.
- Her component en az şu durumları story'lemelidir: Default, Loading, Disabled,
  Long content. Veri gösteren component'lerde ayrıca Empty ve Error.
- Storybook'a gerçek API anahtarı, production verisi veya gerçek kullanıcı bilgisi
  girmez — yalnızca temizlenmiş fixture'lar.

## Notlar

- Storybook'un varsayılan viewport'u masaüstüdür (Desktop 1440). Admin paneli
  moderasyon kuyruğu ve tablolarla ağırlıklı olarak geniş ekranda kullanılır.
- `theme.css.ts` içindeki renkler geçici başlangıç değerleridir, marka kararı
  değildir. Tasarım netleştiğinde tek dosyadan değiştirilir.
