import { AlertTriangle } from 'lucide-react'
import {
  PromotionStatus,
  PromotionType,
  type ListingPromotion,
  type PromotionFlags,
} from '../../../types/domain'
import {
  PROMOTION_SOURCE_LABEL,
  PROMOTION_STATUS_LABEL,
  PROMOTION_TYPE_LABEL,
} from '../../../domain/labels'
import { formatDateTime, machineDateTime } from '../../../utils/formatDateTime'
import { Badge } from '../../primitives/Badge'
import { Switch } from '../../primitives/Switch'
import { DataTable } from '../DataTable'
import { EmptyState } from '../EmptyState'
import type { ColumnDef, PromotionFlagsPanelProps } from '../../../types/component-props'
import * as css from './PromotionFlagsPanel.css'

type Ton = 'neutral' | 'info' | 'success' | 'warning'

/**
 * `PromotionType` değerleri `PromotionFlags` alan adlarıyla birebir aynı
 * (`Featured = 'oneCikan'`) ama eşleme yine de elle yazılıyor: TypeScript string
 * enum'ları **nominal** tutar — `PromotionType.Featured` değeri `'oneCikan'`
 * literal tipine atanamaz, dolayısıyla `flags[type]` derlenmez.
 *
 * `satisfies` bedava sigorta: enum'a altıncı bir doping eklenip bayrağı buraya
 * yazılmazsa derleme durur; yeni doping sessizce "kapalı" görünmez.
 */
const BAYRAK_ALANI = {
  [PromotionType.Featured]: 'oneCikan',
  [PromotionType.Urgent]: 'acil',
  [PromotionType.Showcase]: 'vitrin',
  [PromotionType.HomepageShowcase]: 'anasayfaVitrini',
  [PromotionType.CategoryFeatured]: 'kategoriOneCikan',
} as const satisfies Record<PromotionType, keyof PromotionFlags>

/**
 * Dopinglerin sabit gösterim sırası.
 *
 * Sıra `promotions` dizisinden **alınmıyor**: o dizi sunucunun satın alma
 * sırasıdır ve ilandan ilana değişir. Aynı doping listede, kartta ve tabloda hep
 * aynı yerde durmalı — panel yüzlerce ilan arasında gözle taranıyor ve yer
 * değiştiren bir satır her ilanda yeniden okutur.
 */
const SIRA: readonly PromotionType[] = [
  PromotionType.Featured,
  PromotionType.Urgent,
  PromotionType.Showcase,
  PromotionType.HomepageShowcase,
  PromotionType.CategoryFeatured,
]

/**
 * Bayrağı hangi kaydın açıkladığı. Aynı tipten birden çok kayıt olabilir
 * (haziranda alınıp bitmiş bir Vitrin + temmuzda alınmış aktif bir Vitrin);
 * yürürlükte olan, en güçlü durumdaki kayıttır.
 */
const DURUM_ONCELIGI = {
  [PromotionStatus.Active]: 0,
  [PromotionStatus.Scheduled]: 1,
  [PromotionStatus.Expired]: 2,
  [PromotionStatus.Cancelled]: 3,
} as const satisfies Record<PromotionStatus, number>

/** Durumun tonu. Ton tek başına gösterge değil — durumun metni her yerde yanında. */
const DURUM_TONU = {
  [PromotionStatus.Active]: 'success',
  [PromotionStatus.Scheduled]: 'info',
  [PromotionStatus.Expired]: 'neutral',
  [PromotionStatus.Cancelled]: 'neutral',
} as const satisfies Record<PromotionStatus, Ton>

/**
 * İki kaynağın çelişme **yönü**. İkisi de hatadır ama aynı hata değildir: biri
 * platformun bedava dağıttığı görünürlük, diğeri müşterinin ödeyip alamadığı
 * görünürlük. Ayrı adlandırılıyorlar çünkü ayrı ayrı düzeltiliyorlar.
 */
type Celiski =
  /** Bayrak açık ama onu haklı çıkaran aktif kayıt yok. */
  | 'karsiliksizBayrak'
  /** Aktif kayıt var ama bayrak kapalı. */
  | 'yansimamisKayit'

interface DopingSatiri {
  /** DataTable satır anahtarı; `PromotionType` değeri zaten benzersiz. */
  id: string
  type: PromotionType
  flag: boolean
  /** Yürürlükteki kayıt; bu tipten hiç kayıt yoksa `undefined`. */
  gecerli: ListingPromotion | undefined
  /** Aynı tipin geride kalan kayıtları. Sayısı gösterilir, kendileri değil. */
  eskiKayitSayisi: number
  celiski: Celiski | null
}

function satirlariTuret(flags: PromotionFlags, promotions: ListingPromotion[]): DopingSatiri[] {
  return SIRA.map((type) => {
    // `filter` yeni dizi üretiyor; `sort` onu sıralıyor, gelen prop'u değil.
    const kayitlar = promotions
      .filter((kayit) => kayit.type === type)
      .sort(
        (a, b) =>
          DURUM_ONCELIGI[a.status] - DURUM_ONCELIGI[b.status] ||
          /*
            Aynı durumdan iki kayıt: geç biten yürürlüktedir. Karşılaştırma ISO
            metni üzerinden değil zaman damgası üzerinden — aynı an farklı
            ofsetlerle (`+03:00` / `Z`) yazılabilir ve metin sırası yanıltır.
          */
          Date.parse(b.endsAt) - Date.parse(a.endsAt),
      )

    // noUncheckedIndexedAccess: kayıt yoksa bu `undefined` — tipi de öyle diyor.
    const gecerli = kayitlar[0]
    const flag = flags[BAYRAK_ALANI[type]]
    const aktif = gecerli?.status === PromotionStatus.Active

    return {
      id: type,
      type,
      flag,
      gecerli,
      eskiKayitSayisi: Math.max(kayitlar.length - 1, 0),
      celiski: flag && !aktif ? 'karsiliksizBayrak' : !flag && aktif ? 'yansimamisKayit' : null,
    }
  })
}

/** Şu an görünürlüğü etkileyen ya da etkilemek üzere olan doping. */
function suAnAcik(satir: DopingSatiri): boolean {
  return (
    satir.flag ||
    satir.gecerli?.status === PromotionStatus.Active ||
    satir.gecerli?.status === PromotionStatus.Scheduled
  )
}

/** Hakkında söylenecek bir şeyi olan doping: bayrak ya da herhangi bir kayıt. */
function iziVar(satir: DopingSatiri): boolean {
  return satir.flag || satir.gecerli !== undefined
}

/** Çelişkinin **yönünü** söyleyen cümle. Renk yalnız eşlik eder, anlatmaz. */
function celiskiMetni(satir: DopingSatiri): string {
  if (satir.celiski === 'karsiliksizBayrak') {
    return satir.gecerli === undefined
      ? 'Bayrak açık ama bu dopingin hiç promosyon kaydı yok. İlan, karşılığı olmayan bir görünürlük alıyor.'
      : `Bayrak açık ama yürürlükteki kaydın durumu "${PROMOTION_STATUS_LABEL[satir.gecerli.status]}". İlan, karşılığı olmayan bir görünürlük alıyor.`
  }

  return 'Aktif promosyon kaydı var ama bayrak kapalı. İlan sahibi ödediği görünürlüğü almıyor.'
}

/** Rozet metni: doping adı + (varsa) durumun kendisi. Çelişki yazıyla söylenir. */
function rozetMetni(satir: DopingSatiri): string {
  const etiket = PROMOTION_TYPE_LABEL[satir.type]

  if (satir.celiski === 'yansimamisKayit') return `${etiket} · Bayrak kapalı`

  /*
    "Karşılıksız": bayrak açık ama arkasında aktif kayıt yok. Tutarlı bir
    "Planlandı" rozetiyle aynı metni paylaşamaz — ikisini yalnız turuncu ile
    ayırmak durumu renge bindirmek olurdu.
  */
  if (satir.celiski === 'karsiliksizBayrak') return `${etiket} · Karşılıksız`

  if (satir.gecerli?.status === PromotionStatus.Scheduled) {
    return `${etiket} · ${PROMOTION_STATUS_LABEL[PromotionStatus.Scheduled]}`
  }

  return etiket
}

function rozetTonu(satir: DopingSatiri): Ton {
  if (satir.celiski !== null) return 'warning'
  if (satir.gecerli === undefined) return 'neutral'

  return DURUM_TONU[satir.gecerli.status]
}

/** Kayıt durumunun rozeti; kaydı olmayan satırda da bir şey yazmalı. */
function durumRozeti(satir: DopingSatiri) {
  return (
    <Badge
      size="sm"
      tone={satir.gecerli === undefined ? 'neutral' : DURUM_TONU[satir.gecerli.status]}
    >
      {satir.gecerli === undefined ? 'Kayıt yok' : PROMOTION_STATUS_LABEL[satir.gecerli.status]}
    </Badge>
  )
}

/** Bayrağın kendi rozeti: kaydın durumundan bağımsız, ilanın **şu anki** hâli. */
function bayrakRozeti(satir: DopingSatiri) {
  return (
    <Badge size="sm" tone={satir.flag ? 'success' : 'neutral'}>
      {satir.flag ? 'Açık' : 'Kapalı'}
    </Badge>
  )
}

/** Kaydın tek satırlık özeti; `badges` düzenleme kipinde anahtarın altında. */
function kayitOzeti(gecerli: ListingPromotion | undefined): string {
  if (gecerli === undefined) return 'Promosyon kaydı yok.'

  return `${PROMOTION_STATUS_LABEL[gecerli.status]} · ${PROMOTION_SOURCE_LABEL[gecerli.source]} · Bitiş: ${formatDateTime(gecerli.endsAt)}`
}

/**
 * İlanın doping görünürlüğü: hangi promosyon açık, neden açık, ne zamana kadar.
 *
 * **Panelin asıl işi iki kaynağı yüzleştirmek.** `flags` ilanın *şu anda* ne
 * gösterdiğini söyler (public tarafta rozet çıkıyor mu), `promotions` bunun
 * *neden* böyle olduğunu (kim ödedi, ne zaman bitiyor, admin mi açtı). Brifing
 * 1.1 ikisinin tutarlı olmasını şart koşar — yani tutarsızlık bir **hatadır**,
 * panelin gizleyeceği bir ayrıntı değil.
 *
 * **Bu yüzden panel iki kaynaktan birini seçmez.** "Bayrak doğrudur" demek
 * ödenmiş promosyonu görünmez yapardı; "kayda göre çiz" demek public tarafta
 * rozeti gerçekten gören kullanıcıyı yalanlardı. Sessizce birini seçmek en
 * kötüsü: hata, onu görebilecek tek ekrandan silinirdi. İkisi yan yana durur;
 * çeliştiklerinde satır uyarı tonuna geçer, ikonunu alır ve **çelişkinin yönü
 * cümleyle** söylenir — çünkü iki yön iki ayrı iştir:
 *
 * - **Karşılıksız bayrak** (bayrak açık, aktif kayıt yok): platform bedava
 *   görünürlük dağıtıyor. Faturanın konusu.
 * - **Bayrak kapalı** (aktif kayıt var, bayrak kapalı): müşteri ödediğini
 *   almıyor. Destek talebinin konusu.
 *
 * Panel hiçbirini kendiliğinden düzeltmez: bayrağı kaydına uydurmak da, kaydı
 * bayrağa uydurmak da sunucunun kararıdır.
 *
 * **Varyantlar farklı soru sorduğu için kapsamları da farklı:**
 *
 * - `badges` — "şu an ne açık?" Yalnız bayrağı açık ya da kaydı yürürlükte
 *   olanlar (planlı kayıt "Planlandı" yazısıyla görünür; yakında açılacak bir
 *   doping listede sürpriz olmamalı). Gösterecek bir şey yoksa **hiç render
 *   edilmez**: her dopingsiz ilan satırına "promosyon yok" kutusu koymak tabloyu
 *   okunmaz yapardı (BulkActionBar'ın `selectedCount === 0` kararıyla aynı
 *   gerekçe).
 * - `cards` — "bu dopingin hikâyesi ne?" Bayrağı ya da **herhangi bir** kaydı
 *   olanlar; süresi dolmuş kayıt da tarihleriyle görünür. Hiçbiri yoksa
 *   `EmptyState` — detay sayfasında boş alan "promosyon yok" ile "veri gelmedi"yi
 *   ayırt ettirmez.
 * - `table` — "hepsi ne durumda?" Beş dopingin **tamamı**, her zaman. Matrisin
 *   değeri kapalı olanı da göstermesinde; bu yüzden `table` hiç boşalmaz ve
 *   `EmptyState`'i yoktur.
 *
 * **`editable` her varyantta beşinin de çizilmesini zorunlu kılar** — görünmeyen
 * bir dopingi açmanın yolu yoktur, dolayısıyla düzenleme kipinde "kapsam"
 * tartışması biter. `onChange` verilmemişse `editable` yok sayılır: çevrildiğinde
 * hiçbir şey olmayan bir Switch, kapalı Switch'ten kötüdür — kullanıcı ayarı
 * değiştirdiğini sanır.
 *
 * `editable` **yetki kapısı değildir**: `promotion:manage` izni olmayan
 * kullanıcıya `editable={false}` verilmez, panelin düzenlenebilir hâli hiç
 * render edilmez.
 *
 * **Panel promosyon kaydı üretmez.** Admin bir bayrağı elle açtığında ona
 * karşılık gelen `manualAdmin` kaydını yazmak sunucunun işi; o kayıt gelene kadar
 * satır dürüstçe "Karşılıksız" görünür — panel kendi eylemini haklı çıkarmak için
 * gerçeği eğmez.
 *
 * Switch'e `description` **bilerek verilmiyor.** Base UI Switch bir
 * `<span role="switch">` render ediyor ve adını sarmalayan `<label>`'dan
 * `aria-labelledby` ile alıyor; ad, label'ın **tüm** metninden hesaplanır. Özet
 * `description`'a konsaydı anahtarın erişilebilir adı "Öne Çıkan" değil "Öne
 * Çıkan Aktif · Satın alındı · Bitiş: 24 Tem 2026 09:00" olur, üstelik veri
 * değiştikçe ad değişirdi. Özet bu yüzden anahtarın **yanında**, kendi
 * elementinde duruyor (ölçen story: `SwitchNameIsJustTheLabel`).
 *
 * `cards` ve `table` kaynağı da gösterir: `manualAdmin` bir vitrin, parası
 * ödenmiş bir vitrinden farklı bir denetim konusudur — birinin sorumlusu vardır
 * (`activatedByAdminId`), diğerinin faturası. Yönetici kimliği ham UUID olarak
 * yazılır; isme çevirmek veri çekmek olurdu, panel veri çekmez.
 *
 * Tarihler `utils/formatDateTime` ile mutlak yazılır ("3 gün önce" yok): göreli
 * zaman "şimdi"ye dayanır, aynı story dün "3 gün önce" bugün "4 gün önce" yazar
 * ve Chromatic her gün fark üretir.
 *
 * @example
 * // İlan listesinde: yalnız şu an açık olanlar, salt okunur.
 * <PromotionFlagsPanel flags={listing.promotionFlags} promotions={listing.promotions} />
 *
 * @example
 * // İlan detayında, promotion:manage yetkisi olan kullanıcıya:
 * <PromotionFlagsPanel
 *   flags={listing.promotionFlags}
 *   promotions={listing.promotions}
 *   variant="table"
 *   editable
 *   onChange={(flags) => bayraklariKaydet(listing.id, flags)}
 * />
 */
export function PromotionFlagsPanel({
  flags,
  promotions,
  editable = false,
  variant = 'badges',
  onChange,
}: PromotionFlagsPanelProps) {
  const duzenlenebilir = editable && onChange !== undefined
  const satirlar = satirlariTuret(flags, promotions)

  /**
   * Sözleşme tek alanı değil **tüm nesneyi** istiyor: değişen bayrak yenisiyle,
   * diğer dördü olduğu gibi geçer. Çağıran taraf birleştirme yapmak zorunda
   * kalmasın diye.
   */
  const bayrakDegistir = (type: PromotionType, next: boolean) => {
    if (onChange === undefined) return

    /*
      Kopya alıp tek alanı yazıyoruz; `{ ...flags, [BAYRAK_ALANI[type]]: next }`
      da çalışırdı ama birleşim tipli hesaplanmış anahtar sonucu indeks
      imzasına genişletir ve `PromotionFlags`'e atanabilirliği tesadüfe kalır.
    */
    const yeni: PromotionFlags = { ...flags }
    yeni[BAYRAK_ALANI[type]] = next
    onChange(yeni)
  }

  const anahtar = (satir: DopingSatiri) => (
    <Switch
      size="sm"
      label={PROMOTION_TYPE_LABEL[satir.type]}
      checked={satir.flag}
      /*
        Sarmalama zorunlu: Base UI `onCheckedChange`'e ikinci bir `eventDetails`
        argümanı geçiyor. Switch primitive'i onu kendi içinde de sarmalıyor, bu
        köprü de tek argümanlı kalıyor.
      */
      onCheckedChange={(next) => bayrakDegistir(satir.type, next)}
    />
  )

  /*
    `<span>`, `<p>` değil: uyarı hem kartın `<li>`'sinde hem tablo hücresinin
    `<span>`'ı içinde görünüyor ve phrasing content'in içine flow content
    konamaz. Cümle görünümünü element tipi değil `display: flex` veriyor —
    dolayısıyla sıfırlanacak bir tarayıcı margin'i de yok.
  */
  const uyari = (satir: DopingSatiri) =>
    satir.celiski !== null ? (
      <span className={css.warning}>
        <AlertTriangle size={16} aria-hidden="true" className={css.warningIcon} />
        {celiskiMetni(satir)}
      </span>
    ) : null

  const eskiKayitlar = (satir: DopingSatiri) =>
    satir.eskiKayitSayisi > 0 ? (
      <span className={css.muted}>+{satir.eskiKayitSayisi} önceki kayıt</span>
    ) : null

  if (variant === 'table') {
    /*
      Bayrak sütunu yalnız salt okunur kipte var: düzenlenebilir kipte anahtarın
      kendisi bayrağın durumudur, ikinci bir sütun aynı bilgiyi tekrarlar.
    */
    const bayrakSutunu: ColumnDef<DopingSatiri> = {
      id: 'flag',
      header: 'Bayrak',
      width: '7rem',
      cell: bayrakRozeti,
    }

    const columns: ColumnDef<DopingSatiri>[] = [
      {
        id: 'type',
        header: 'Doping',
        width: duzenlenebilir ? '16rem' : '14rem',
        /*
          Düzenleme kipinde ad sütunu Switch'in **kendisi**: etiketi zaten
          dopingin adı. Ayrı bir ad sütunu + etiketli anahtar aynı metni her
          satırda iki kez yazardı.
        */
        cell: (row) =>
          duzenlenebilir ? (
            anahtar(row)
          ) : (
            <span className={css.label}>{PROMOTION_TYPE_LABEL[row.type]}</span>
          ),
      },
      ...(duzenlenebilir ? [] : [bayrakSutunu]),
      {
        id: 'status',
        header: 'Kayıt durumu',
        cell: (row) => (
          <span className={css.stack}>
            {durumRozeti(row)}
            {uyari(row)}
            {eskiKayitlar(row)}
          </span>
        ),
      },
      {
        id: 'purchasedAt',
        /*
          `purchasedAt` "Satın alma" diye adlandırılmıyor: `manualAdmin`
          satırlarında satın alınan bir şey yok, o an kaydın açıldığı andır.
        */
        header: 'Kayıt tarihi',
        width: '11rem',
        cell: (row) =>
          row.gecerli === undefined ? (
            <span className={css.muted}>—</span>
          ) : (
            <time className={css.time} dateTime={machineDateTime(row.gecerli.purchasedAt)}>
              {formatDateTime(row.gecerli.purchasedAt)}
            </time>
          ),
      },
      {
        id: 'period',
        header: 'Yürürlük',
        width: '12rem',
        cell: (row) =>
          row.gecerli === undefined ? (
            <span className={css.muted}>—</span>
          ) : (
            <span className={css.stack}>
              <time className={css.time} dateTime={machineDateTime(row.gecerli.startsAt)}>
                {formatDateTime(row.gecerli.startsAt)}
              </time>
              <time className={css.time} dateTime={machineDateTime(row.gecerli.endsAt)}>
                {formatDateTime(row.gecerli.endsAt)}
              </time>
            </span>
          ),
      },
      {
        id: 'source',
        header: 'Kaynak',
        width: '12rem',
        cell: (row) =>
          row.gecerli === undefined ? (
            <span className={css.muted}>—</span>
          ) : (
            <span className={css.stack}>
              <span className={css.sourceText}>{PROMOTION_SOURCE_LABEL[row.gecerli.source]}</span>
              {/*
                Yöneticinin kimliği denetimin tek ipucu: parası ödenmiş vitrinin
                sorumlusu yok, elle açılanın var.
              */}
              {row.gecerli.activatedByAdminId !== undefined ? (
                <span className={css.muted}>Yönetici: {row.gecerli.activatedByAdminId}</span>
              ) : null}
            </span>
          ),
      },
    ]

    /*
      `density` sıkıştırılmıyor: tabloda en fazla beş satır var, sıkıştıracak bir
      şey yok — üstelik düzenleme kipinde hücrenin içindeki anahtar bir dokunma
      hedefi. `mobileMode="scroll"`: sütunların kendisi bilgi (tarih, kaynak),
      karta dönüştürülürse karşılaştırma kaybolur. `selectable` verilmediği için
      `rowLabel` de verilmiyor — seçim kutusu yoksa etiketleyecek bir şey yok.
    */
    return (
      <DataTable rows={satirlar} columns={columns} visualStyle="bordered" mobileMode="scroll" />
    )
  }

  /*
    Düzenleme kipinde filtre yok: görünmeyen dopingi açmanın yolu olmadığı için
    beşi de çizilir. Salt okunur kipte varyant kendi sorusuna göre daraltır.
  */
  const gorunur = duzenlenebilir
    ? satirlar
    : satirlar.filter(variant === 'badges' ? suAnAcik : iziVar)

  if (gorunur.length === 0) {
    /*
      Rozetler ilan satırında yaşıyor: orada boşluğun kendisi mesajdır. Kartlar
      detay sayfasında bir panel; orada sessizlik bilgi vermez, arıza gibi durur.
    */
    if (variant === 'badges') return null

    return (
      <EmptyState
        variant="compact"
        title="Promosyon yok"
        description="Bu ilanda açık bir doping bayrağı ve promosyon kaydı bulunmuyor."
      />
    )
  }

  if (variant === 'badges') {
    return (
      <ul className={css.badgeList({ editable: duzenlenebilir })}>
        {gorunur.map((satir) => (
          <li key={satir.id} className={duzenlenebilir ? css.switchRow : undefined}>
            {duzenlenebilir ? (
              <>
                {anahtar(satir)}
                {satir.celiski !== null ? (
                  uyari(satir)
                ) : (
                  <p className={css.switchMeta}>{kayitOzeti(satir.gecerli)}</p>
                )}
              </>
            ) : (
              <Badge
                size="sm"
                tone={rozetTonu(satir)}
                // Koşullu spread: exactOptionalPropertyTypes açıkken
                // `leadingIcon: undefined` yazılamaz (TS2375).
                {...(satir.celiski !== null && { leadingIcon: <AlertTriangle size={14} /> })}
              >
                {rozetMetni(satir)}
              </Badge>
            )}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul className={css.cardList}>
      {gorunur.map((satir) => (
        <li key={satir.id} className={css.card({ celiskili: satir.celiski !== null })}>
          <div className={css.cardHeader}>
            {duzenlenebilir ? (
              anahtar(satir)
            ) : (
              <>
                <span className={css.label}>{PROMOTION_TYPE_LABEL[satir.type]}</span>
                {bayrakRozeti(satir)}
              </>
            )}
          </div>

          <div className={css.cardMeta}>
            {durumRozeti(satir)}

            {satir.gecerli !== undefined ? (
              <>
                <span className={css.meta}>
                  <span className={css.metaKey}>Yürürlük</span>
                  <span className={css.metaValue}>
                    <time dateTime={machineDateTime(satir.gecerli.startsAt)}>
                      {formatDateTime(satir.gecerli.startsAt)}
                    </time>
                    {' – '}
                    <time dateTime={machineDateTime(satir.gecerli.endsAt)}>
                      {formatDateTime(satir.gecerli.endsAt)}
                    </time>
                  </span>
                </span>

                <span className={css.meta}>
                  <span className={css.metaKey}>Kayıt tarihi</span>
                  <span className={css.metaValue}>
                    <time dateTime={machineDateTime(satir.gecerli.purchasedAt)}>
                      {formatDateTime(satir.gecerli.purchasedAt)}
                    </time>
                  </span>
                </span>

                <span className={css.meta}>
                  <span className={css.metaKey}>Kaynak</span>
                  <span className={css.metaValue}>
                    {PROMOTION_SOURCE_LABEL[satir.gecerli.source]}
                  </span>
                </span>

                {satir.gecerli.activatedByAdminId !== undefined ? (
                  <span className={css.meta}>
                    <span className={css.metaKey}>Yönetici</span>
                    <span className={css.metaValue}>{satir.gecerli.activatedByAdminId}</span>
                  </span>
                ) : null}
              </>
            ) : null}

            {eskiKayitlar(satir)}
          </div>

          {uyari(satir)}
        </li>
      ))}
    </ul>
  )
}
