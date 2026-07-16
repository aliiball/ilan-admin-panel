import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../../primitives/Button'
import { IconButton } from '../../primitives/IconButton'
import { Select } from '../../primitives/Select'
import type { PaginationProps } from '../../../types/component-props'
import * as css from './Pagination.css'

/** Kısaltmasız gösterilebilecek en fazla sayfa. Üstünde `…` devreye girer. */
const KISALTMASIZ_SINIR = 7

type SayfaOgesi = number | 'bosluk'

/**
 * Gösterilecek sayfa numaraları: ilk, son, geçerli sayfa ve komşuları; aradaki
 * boşluklar `…` ile kısaltılır. 200 sayfayı yan yana dizmek satırı taşırır.
 */
function sayfaListesi(gecerli: number, toplam: number): SayfaOgesi[] {
  if (toplam <= KISALTMASIZ_SINIR) {
    return Array.from({ length: toplam }, (_, i) => i + 1)
  }

  const ogeler: SayfaOgesi[] = [1]
  const bas = Math.max(2, gecerli - 1)
  const son = Math.min(toplam - 1, gecerli + 1)

  if (bas > 2) ogeler.push('bosluk')
  for (let sayfa = bas; sayfa <= son; sayfa += 1) ogeler.push(sayfa)
  if (son < toplam - 1) ogeler.push('bosluk')

  ogeler.push(toplam)
  return ogeler
}

const bicimle = (sayi: number) => sayi.toLocaleString('tr-TR')

/**
 * Sayfalama.
 *
 * `page` **1-tabanlıdır**: kullanıcıya gösterilen sayı ile prop aynı olsun diye.
 * Aralık dışı bir `page` gelirse (boyut değişince eski sayfa yok olabilir)
 * gösterim sırasında kırpılır — component çökmez, ama üst katman sayfa boyutu
 * değişince sayfayı 1'e döndürmelidir.
 *
 * `totalItems === 0` iken hiç render edilmez: sayfalanacak bir şey yoktur ve
 * mesajı `EmptyState` verir.
 *
 * Sayfa numaraları `<button>`'dır ve geçerli olan `aria-current="page"` taşır;
 * erişilebilir adları "Sayfa 3" şeklindedir — ekran okuyucuda yalnız "3" duyan
 * kullanıcı neyin üçü olduğunu bilemez.
 *
 * Veri çekmez: sayfa değişimini bildirir, veriyi sayfa katmanı getirir.
 *
 * @example
 * <Pagination page={sayfa} pageSize={20} totalItems={240} onPageChange={setSayfa} />
 */
export function Pagination({
  page,
  pageSize,
  totalItems,
  pageSizeOptions,
  variant = 'numbered',
  disabled = false,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  if (totalItems <= 0) return null

  const toplamSayfa = Math.max(1, Math.ceil(totalItems / pageSize))
  const gecerliSayfa = Math.min(Math.max(page, 1), toplamSayfa)

  const ilkKayit = (gecerliSayfa - 1) * pageSize + 1
  const sonKayit = Math.min(gecerliSayfa * pageSize, totalItems)

  const ilkSayfada = gecerliSayfa <= 1
  const sonSayfada = gecerliSayfa >= toplamSayfa

  const boyutSecici =
    pageSizeOptions !== undefined && onPageSizeChange !== undefined ? (
      <div className={css.pageSize}>
        {/*
          Etiket görünür kalıyor: Select'in `hideLabel`'ı yok ve etiketsiz
          bırakılırsa kutunun erişilebilir adı kalmaz. Görünür etiket, uydurma
          bir `aria-label`'dan dürüsttür.
        */}
        <Select
          label="Sayfa boyutu"
          size="sm"
          value={String(pageSize)}
          options={pageSizeOptions.map((boyut) => ({
            value: String(boyut),
            label: bicimle(boyut),
          }))}
          disabled={disabled}
          onValueChange={(next) => {
            if (next !== undefined) onPageSizeChange(Number(next))
          }}
        />
      </div>
    ) : null

  /* ── Daha fazla göster: sayfalar birikir, "önceki" kavramı yoktur ── */

  if (variant === 'loadMore') {
    return (
      <nav className={css.root({ variant })} aria-label="Sayfalama">
        <span className={css.summary}>
          {bicimle(sonKayit)} / {bicimle(totalItems)} kayıt gösteriliyor
        </span>

        {!sonSayfada ? (
          <Button
            variant="secondary"
            disabled={disabled}
            onClick={() => onPageChange(gecerliSayfa + 1)}
          >
            Daha fazla göster
          </Button>
        ) : null}
      </nav>
    )
  }

  const onceki = (
    <IconButton
      icon={<ChevronLeft size={18} />}
      label="Önceki sayfa"
      variant="ghost"
      size="sm"
      disabled={disabled || ilkSayfada}
      onClick={() => onPageChange(gecerliSayfa - 1)}
    />
  )

  const sonraki = (
    <IconButton
      icon={<ChevronRight size={18} />}
      label="Sonraki sayfa"
      variant="ghost"
      size="sm"
      disabled={disabled || sonSayfada}
      onClick={() => onPageChange(gecerliSayfa + 1)}
    />
  )

  /* ── Kısa: dar ekranda numara dizisi sığmaz ── */

  if (variant === 'compact') {
    return (
      <nav className={css.root({ variant })} aria-label="Sayfalama">
        {onceki}
        <span className={css.compactLabel}>
          Sayfa {bicimle(gecerliSayfa)} / {bicimle(toplamSayfa)}
        </span>
        {sonraki}
        {boyutSecici}
      </nav>
    )
  }

  /* ── Numaralı ── */

  return (
    <nav className={css.root({ variant })} aria-label="Sayfalama">
      <span className={css.summary}>
        {bicimle(ilkKayit)}–{bicimle(sonKayit)} / {bicimle(totalItems)} kayıt
      </span>

      <div className={css.pages}>
        {onceki}

        {sayfaListesi(gecerliSayfa, toplamSayfa).map((oge, sira) =>
          oge === 'bosluk' ? (
            // Boşluk etkileşimli değil; ekran okuyucuya "üç nokta" diye okunması
            // bilgi katmaz, atlanan sayfaları zaten ilk/son numaralar anlatır.
            <span key={`bosluk-${sira}`} className={css.ellipsis} aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={oge}
              type="button"
              className={css.pageButton}
              // Görünen metin "3", erişilebilir ad "Sayfa 3": görünür metin adın
              // içinde geçtiği için sesle kontrol eden kullanıcı da "üç" diyebilir.
              aria-label={`Sayfa ${oge}`}
              aria-current={oge === gecerliSayfa ? 'page' : undefined}
              disabled={disabled}
              onClick={() => onPageChange(oge)}
            >
              {bicimle(oge)}
            </button>
          ),
        )}

        {sonraki}
      </div>

      {boyutSecici}
    </nav>
  )
}
