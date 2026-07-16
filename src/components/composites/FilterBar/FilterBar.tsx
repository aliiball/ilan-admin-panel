import { useState } from 'react'
import { Bookmark, BookmarkPlus, SlidersHorizontal, X } from 'lucide-react'
import { Badge } from '../../primitives/Badge'
import { Button } from '../../primitives/Button'
import { DateRangePicker } from '../../primitives/DateRangePicker'
import { Drawer } from '../../primitives/Drawer'
import { Input } from '../../primitives/Input'
import { MultiSelect } from '../../primitives/MultiSelect'
import { NumberInput } from '../../primitives/NumberInput'
import { Select } from '../../primitives/Select'
import { Switch } from '../../primitives/Switch'
import type {
  DateRange,
  FilterBarProps,
  FilterDefinition,
  FilterValue,
  NumberRange,
} from '../../../types/component-props'
import * as css from './FilterBar.css'

/**
 * Bu sayıdan fazla seçeneği olan `select` alanı aramalı açılır.
 *
 * `FilterDefinition`'da `searchable` bayrağı yok, ama brifing il/ilçe/mahalle
 * filtrelerinin aranabilir olmasını şart koşuyor — 900 ilçeyi kaydırarak bulmak
 * kullanılabilir değil. Eşik bunu bayrak eklemeden çözer: kısa listeler klasik
 * açılır kalır, uzun olanlar kendiliğinden arama kutusu kazanır.
 */
const ARAMA_ESIGI = 8

/* ── Değer daraltma ──────────────────────────────────────────────────────────
 * `FilterValue` altı şeklin birleşimi; hangi şeklin geleceğini `definition.type`
 * söyler. Yanlış şekilli bir değer geldiğinde (kaydedilmiş eski görünüm, elle
 * yazılmış URL parametresi) alan boş kabul edilir — component çökmez.
 */

const metin = (deger: FilterValue): string => (typeof deger === 'string' ? deger : '')

const dizi = (deger: FilterValue): string[] => (Array.isArray(deger) ? deger : [])

/** Yalnız `true` filtre sayılır: kapalı bir anahtar hiçbir şeyi elemez. */
const mantiksal = (deger: FilterValue): boolean => deger === true

const nesneMi = (deger: FilterValue): deger is DateRange | NumberRange =>
  typeof deger === 'object' && deger !== null && !Array.isArray(deger)

/**
 * `DateRange` ve `NumberRange` ikisi de tamamı opsiyonel nesne; TypeScript
 * onları kendiliğinden ayıramaz. `in` ile hangi alanları taşıdığına bakılıyor.
 */
const tarihAraligi = (deger: FilterValue): DateRange =>
  nesneMi(deger) && ('from' in deger || 'to' in deger) ? deger : {}

const sayiAraligi = (deger: FilterValue): NumberRange =>
  nesneMi(deger) && ('min' in deger || 'max' in deger) ? deger : {}

/**
 * Aralığın tek ucunu günceller.
 *
 * `{ ...aralik, min: next }` yazılamıyor: `exactOptionalPropertyTypes` açıkken
 * `min?: number` alanına `number | undefined` atanamaz (TS2375). Uç
 * temizlendiğinde alan `undefined` yapılmaz, silinir.
 */
function aralikGuncelle(
  mevcut: NumberRange,
  uc: 'min' | 'max',
  deger: number | undefined,
): NumberRange {
  const sonraki: NumberRange = { ...mevcut }
  if (deger === undefined) delete sonraki[uc]
  else sonraki[uc] = deger
  return sonraki
}

/**
 * Bir filtrenin gerçekten bir şey eleyip elemediği.
 *
 * Ham değere değil, **alanın tipine göre daraltılmış** değere bakar; kontrolü
 * render eden daraltma fonksiyonlarının aynısını kullanır. Böylece "aktif
 * sayılan" ile "kutuda dolu görünen" aynı şey olur: şekli bozuk bir değer
 * (`text` alanında sayı) kutuda boş görünüyorsa sayaçta da boş sayılır. Ham
 * değere bakılsaydı sayaç "7 aktif" der, kullanıcı yedi boş kutu görürdü.
 */
function doluMu(tanim: FilterDefinition, deger: FilterValue): boolean {
  switch (tanim.type) {
    case 'text':
    case 'select':
      return metin(deger) !== ''

    case 'multiSelect':
      return dizi(deger).length > 0

    /** Yalnız `true` eler; kapalı anahtar filtre değildir. */
    case 'boolean':
      return mantiksal(deger)

    case 'numberRange': {
      // `0` geçerli bir sınırdır ("en az 0"), boş sayılmaz.
      const aralik = sayiAraligi(deger)
      return aralik.min !== undefined || aralik.max !== undefined
    }

    case 'dateRange': {
      const aralik = tarihAraligi(deger)
      return aralik.from !== undefined || aralik.to !== undefined
    }
  }
}

/**
 * Liste ekranlarının filtre çubuğu.
 *
 * Kontrollüdür ve kendi değer kopyasını tutmaz: `values` içeriden gelir,
 * değişiklik `onChange(id, value)` ile dışarı bildirilir. Veri çekmez ve
 * geciktirmez — metin alanı her tuşta `onChange` çağırır; isteği ne zaman
 * atacağına sayfa katmanı karar verir, çünkü fetch onun işidir.
 *
 * `definitions` hangi alanın hangi kontrole dönüşeceğini söyler; `values[id]`
 * beklenen şekli taşımıyorsa alan boş kabul edilir ve çubuk çökmez. Bu, eski
 * kaydedilmiş görünümler ve elle yazılmış URL parametreleri için gereklidir.
 *
 * `activeFilterCount` verilmezse `definitions` üzerinden hesaplanır — `values`
 * içinde kalmış, artık tanımı olmayan bayat anahtarlar sayılmaz.
 *
 * Seçeneği {@link ARAMA_ESIGI}'nden fazla olan `select` alanları kendiliğinden
 * aranabilir açılır; il ve ilçe listeleri kaydırılarak taranamaz.
 *
 * `variant="drawer"` mobil içindir: dışarıda yalnız sayaçlı bir tetikleyici
 * durur, alanlar Drawer'da açılır. Açık/kapalı durumu component'in kendi işidir;
 * dışarıdan yönetilmesi gereken bir şey değil.
 *
 * @example
 * <FilterBar
 *   definitions={ILAN_FILTRELERI}
 *   values={filtreler}
 *   activeFilterCount={aktif}
 *   onChange={(id, value) => setFiltreler((o) => ({ ...o, [id]: value }))}
 *   onClear={() => setFiltreler({})}
 * />
 */
export function FilterBar({
  definitions,
  values,
  variant = 'inline',
  activeFilterCount,
  loading = false,
  disabled = false,
  savedViewName,
  onChange,
  onClear,
  onApply,
  onSaveView,
}: FilterBarProps) {
  const [drawerAcik, setDrawerAcik] = useState(false)
  const [kaydetAcik, setKaydetAcik] = useState(false)
  const [gorunumAdi, setGorunumAdi] = useState('')

  const aktifSayi =
    activeFilterCount ?? definitions.filter((tanim) => doluMu(tanim, values[tanim.id])).length

  /** Alanların düzeni drawer içinde de stacked'dır: dar kapta yan yana sığmaz. */
  const alanDuzeni = variant === 'drawer' ? 'drawer' : variant

  const alanRender = (tanim: FilterDefinition) => {
    const deger = values[tanim.id]

    switch (tanim.type) {
      case 'text':
        return (
          <Input
            label={tanim.label}
            value={metin(deger)}
            placeholder={tanim.placeholder}
            disabled={disabled}
            onChange={(event) => onChange(tanim.id, event.target.value)}
          />
        )

      case 'select':
        return (
          <Select
            label={tanim.label}
            value={metin(deger) === '' ? undefined : metin(deger)}
            options={tanim.options ?? []}
            {...(tanim.placeholder !== undefined && { placeholder: tanim.placeholder })}
            searchable={(tanim.options?.length ?? 0) > ARAMA_ESIGI}
            clearable
            loading={loading}
            disabled={disabled}
            onValueChange={(next) => onChange(tanim.id, next)}
          />
        )

      case 'multiSelect':
        return (
          <MultiSelect
            label={tanim.label}
            values={dizi(deger)}
            options={tanim.options ?? []}
            {...(tanim.placeholder !== undefined && { placeholder: tanim.placeholder })}
            maxVisibleTags={2}
            loading={loading}
            disabled={disabled}
            onValuesChange={(next) => onChange(tanim.id, next)}
          />
        )

      case 'numberRange': {
        const aralik = sayiAraligi(deger)
        return (
          /*
            Grup fieldset/legend ile kuruluyor: iki kutunun etiketi "En az" ve
            "En çok"; hangi alanın en azı olduğunu legend söyler. Etiketleri
            "Fiyat en az" diye uzatmak her satırı gereksiz tekrar ettirirdi.
          */
          <fieldset className={css.rangeGroup} disabled={disabled}>
            <legend className={css.rangeLegend}>{tanim.label}</legend>
            <div className={css.rangeInputs}>
              <NumberInput
                label="En az"
                value={aralik.min}
                disabled={disabled}
                onValueChange={(next) => onChange(tanim.id, aralikGuncelle(aralik, 'min', next))}
              />
              <NumberInput
                label="En çok"
                value={aralik.max}
                disabled={disabled}
                onValueChange={(next) => onChange(tanim.id, aralikGuncelle(aralik, 'max', next))}
              />
            </div>
          </fieldset>
        )
      }

      case 'dateRange':
        return (
          <DateRangePicker
            label={tanim.label}
            value={tarihAraligi(deger)}
            disabled={disabled}
            onValueChange={(next) => onChange(tanim.id, next)}
          />
        )

      case 'boolean':
        return (
          <Switch
            label={tanim.label}
            checked={mantiksal(deger)}
            disabled={disabled}
            onCheckedChange={(next) => onChange(tanim.id, next)}
          />
        )
    }
  }

  const alanSinifi = (tanim: FilterDefinition) => {
    if (tanim.type === 'boolean') return css.switchField
    if (tanim.type === 'numberRange' && variant === 'inline') return css.fieldWide
    return css.field
  }

  const alanlar = (
    <div className={css.fields({ variant: alanDuzeni })}>
      {definitions.map((tanim) => (
        <div key={tanim.id} className={alanSinifi(tanim)}>
          {alanRender(tanim)}
        </div>
      ))}
    </div>
  )

  const gorunumKaydet = () => {
    const ad = gorunumAdi.trim()
    if (ad === '') return
    onSaveView?.(ad)
    setKaydetAcik(false)
    setGorunumAdi('')
  }

  /**
   * Görünüm kaydetme, temizle/uygula ile aynı yerde durmaz: drawer varyantında
   * temizle/uygula footer'a, bu ise alanların altına iner.
   */
  const gorunumBolumu = (
    <div className={css.actions}>
      {onSaveView !== undefined && !kaydetAcik ? (
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<BookmarkPlus size={16} />}
          disabled={disabled}
          onClick={() => {
            setGorunumAdi(savedViewName ?? '')
            setKaydetAcik(true)
          }}
        >
          Görünümü kaydet
        </Button>
      ) : null}

      {onSaveView !== undefined && kaydetAcik ? (
        /*
          `<form>` değil: FilterBar bir sayfa formunun içinde durabilir ve iç içe
          form geçersiz HTML'dir. Enter, kutunun kendi tuş dinleyicisiyle karşılanır.
        */
        <div className={css.saveView}>
          <div className={css.saveViewInput}>
            <Input
              label="Görünüm adı"
              size="sm"
              value={gorunumAdi}
              placeholder="Örn. Şikayetli ilanlar"
              onChange={(event) => setGorunumAdi(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') gorunumKaydet()
              }}
            />
          </div>
          <Button size="sm" disabled={gorunumAdi.trim() === ''} onClick={gorunumKaydet}>
            Kaydet
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setKaydetAcik(false)}>
            Vazgeç
          </Button>
        </div>
      ) : null}
    </div>
  )

  /** Temizle yalnız temizlenecek bir şey varken: her zaman duran ölü buton gürültüdür. */
  const temizleButonu =
    aktifSayi > 0 ? (
      <Button
        variant="ghost"
        size="sm"
        leadingIcon={<X size={16} />}
        disabled={disabled}
        onClick={onClear}
      >
        Temizle
      </Button>
    ) : null

  const rozetVar = aktifSayi > 0 || savedViewName !== undefined

  const rozetler = (
    <>
      {aktifSayi > 0 ? (
        <Badge tone="primary" variant="soft" size="sm">
          {aktifSayi} aktif
        </Badge>
      ) : null}

      {savedViewName !== undefined ? (
        <Badge tone="neutral" variant="outline" size="sm" leadingIcon={<Bookmark size={12} />}>
          {savedViewName}
        </Badge>
      ) : null}
    </>
  )

  const baslik = (
    <div className={css.header}>
      <span className={css.heading}>Filtreler</span>
      {rozetler}
    </div>
  )

  /* ── Drawer: dışarıda yalnız tetikleyici durur ── */

  if (variant === 'drawer') {
    return (
      <>
        <Button
          variant="secondary"
          leadingIcon={<SlidersHorizontal size={16} />}
          disabled={disabled}
          onClick={() => setDrawerAcik(true)}
        >
          Filtreler
          {aktifSayi > 0 ? (
            <Badge tone="primary" variant="solid" size="sm">
              {aktifSayi}
            </Badge>
          ) : null}
        </Button>

        <Drawer
          open={drawerAcik}
          title="Filtreler"
          side="bottom"
          size="lg"
          onOpenChange={(next) => setDrawerAcik(next)}
          footer={
            <div className={css.drawerFooter}>
              {temizleButonu}
              {/*
                Uygula drawer'ı da kapatır: mobilde filtreyi uygulayıp sonucu
                görmek isteyen kullanıcıya ikinci bir kapatma adımı attırmak
                gereksiz. `onApply` yoksa filtreler zaten canlıdır, buton
                yalnızca kapatır.
              */}
              <Button
                disabled={disabled}
                onClick={() => {
                  onApply?.()
                  setDrawerAcik(false)
                }}
              >
                {onApply !== undefined ? 'Uygula' : 'Bitti'}
              </Button>
            </div>
          }
        >
          {/*
            Drawer'ın başlığı zaten "Filtreler"; içeride ikinci bir landmark ve
            ikinci bir "Filtreler" başlığı tekrar olurdu. Yalnız rozetler,
            alanlar ve görünüm kaydetme kalıyor.
          */}
          <div className={css.root({ variant })} aria-busy={loading || undefined}>
            {rozetVar ? <div className={css.header}>{rozetler}</div> : null}
            {alanlar}
            {gorunumBolumu}
          </div>
        </Drawer>
      </>
    )
  }

  return (
    <section
      className={css.root({ variant })}
      aria-label="Filtreler"
      aria-busy={loading || undefined}
    >
      {baslik}
      {alanlar}

      <div className={css.actions}>
        {temizleButonu}
        {onApply !== undefined ? (
          <Button size="sm" disabled={disabled} onClick={onApply}>
            Uygula
          </Button>
        ) : null}
        {gorunumBolumu}
      </div>
    </section>
  )
}
