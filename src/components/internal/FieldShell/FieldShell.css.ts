import { style } from '@vanilla-extract/css'
import { vars } from '@/tokens/contract.css'

/**
 * `gridTemplateColumns: 'minmax(0, 1fr)'` — örtük `auto` iz DEĞİL. Faz 3'te
 * ölçüldü ve `Tabs.root` ile **aynı hatanın** dokuz component'e dağılmış hâli.
 *
 * Kolon izi bildirilmeyince örtük iz `auto` olur ve tabanı `min-content`'tir;
 * `FieldShell` kullanan her kontrol, kendi min-content'inden dar bir kapta kabını
 * taşırır. `ListingListPage`'in fiyat filtresi 320 pikselde tam bunu yapıyordu:
 * `FilterBar.rangeInputs`'ın izleri düzeltilince taşma 587'den 445'e düştü ama
 * **sıfırlanmadı** — kalanı buydu.
 *
 * `width: 100%` yetmiyor: genişliği sabitler, ama grid öğesinin otomatik minimum
 * boyutunu (min-content) **tavanlamaz**.
 */
export const root = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: vars.space[1],
  width: '100%',
})

export const label = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space[1],
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  color: vars.color.text.primary,

  selectors: {
    '&[data-disabled]': {
      color: vars.color.text.disabled,
    },
  },
})

/**
 * Zorunluluk yıldızı `aria-hidden`'dır: ekran okuyucu zorunluluğu control'ün
 * `required` attribute'undan zaten duyurur, yıldız tekrar okunursa gürültü olur.
 */
export const requiredMark = style({
  color: vars.color.danger[700],
})

/**
 * `margin: 0` ŞART — Faz 3'te ekran görüntüsüyle ölçüldü.
 *
 * Base UI `Field.Description` bir **`<p>`** basıyor ve global reset yalnız
 * `body`'nin margin'ini sıfırlıyor: `<p>` tarayıcının varsayılan `1em`
 * (16 piksel) alt-üst margin'iyle geliyordu. `root` bir grid ve `gap`'i
 * `space[1]` (4 piksel) — yani alanın dikey ritmini token değil **tarayıcı**
 * belirliyordu, üstelik dört katı. Yardımcı metni olan her form alanı
 * etkileniyordu; `FieldShell` dokuz component'in altyapısı olduğu için sızıntı
 * dokuz yere birden gidiyordu.
 *
 * Testler bunu görmez, ekran görüntüsü görür — `EmptyState`'te `compact` ile
 * `default` farkının kaybolduğu hatanın birebir aynısı.
 */
export const description = style({
  margin: 0,
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
})

export const error = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: vars.space[1],
  fontSize: vars.font.size.sm,
  color: vars.color.danger[800],
})

export const errorIcon = style({
  flexShrink: 0,
  marginTop: '0.1875rem',
})
