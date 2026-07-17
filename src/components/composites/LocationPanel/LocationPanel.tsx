import type { ReactNode } from 'react'
import { Eye, EyeOff, MapPin, MapPinOff } from 'lucide-react'
import type { Coordinates } from '../../../types/domain'
import { Badge } from '../../primitives/Badge'
import { EmptyState } from '../EmptyState'
import type { LocationPanelProps } from '../../../types/component-props'
import * as css from './LocationPanel.css'

/**
 * Koordinatın ondalık basamak sayısı. Altı basamak WGS84'te ~11 santimetre —
 * yerleşik kural bu; daha azı belge kontrolünde binayı bulmaya yetmez, fazlası
 * verinin taşımadığı bir kesinlik iddia eder.
 */
const KOORDINAT_BASAMAK = 6

/**
 * Koordinat **`Intl`'den geçmez.**
 *
 * `toLocaleString('tr-TR')` bu sayıyı `40,988800` yazardı: Türkçede ondalık
 * ayırıcı virgül. Ama koordinat çifti de virgülle ayrılıyor, yani sonuç
 * `40,988800, 29,027700` olurdu — hangi virgülün ayırıcı hangisinin ondalık
 * olduğu okunamaz. Üstelik hiçbir harita aracı bu metni kabul etmez; bu panelin
 * varlık sebebi tam da o metnin kopyalanıp bir haritaya yapıştırılması.
 *
 * `toFixed` yerel ayardan bağımsızdır ve her zaman nokta üretir. Repo'nun
 * `formatCurrency`/`formatDateTime` kuralı (kendi `Intl`'ini kurma) burada
 * ihlal edilmiyor: koordinat biçimlendirilmiş bir *sayı* değil, makine
 * tarafından okunacak bir *tanımlayıcı* — para veya tarih gibi yerelleşmez.
 *
 * Sabit basamak ayrıca `tabular-nums` ile hizalı bir kolon verir.
 */
function formatKoordinat(coordinates: Coordinates): string {
  return `${coordinates.latitude.toFixed(KOORDINAT_BASAMAK)}, ${coordinates.longitude.toFixed(KOORDINAT_BASAMAK)}`
}

/**
 * Ad–değer çifti. `<dl>`/`<dt>`/`<dd>` semantik olarak tam da bu; üçünün de
 * tarayıcı varsayılanı (özellikle `<dd>`'nin 40 piksellik `margin-inline-start`'ı)
 * `.css.ts`'te sıfırlanıyor.
 */
function Bilgi({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={css.fact}>
      <dt className={css.factLabel}>{label}</dt>
      <dd className={css.factValue}>{children}</dd>
    </div>
  )
}

/** Alan hiç doldurulmamış: bir veri eksiği, ilanın kusuru. */
function Girilmemis({ children }: { children: ReactNode }) {
  return <span className={css.missing}>{children}</span>
}

/**
 * Alan dolu ama gösterilmiyor: bir politika kararı.
 *
 * `Girilmemis`'ten ayrı olması şart — ikisini aynı metne indirmek, belge
 * kontrolü yapan moderatöre "adres var, açsam görürüm" ile "adres hiç
 * girilmemiş"i aynı gösterirdi. Birincisinde yetki istenir, ikincisinde ilan
 * sahibinden düzeltme.
 */
function Gizli() {
  return (
    <span className={css.concealed}>
      <EyeOff size={14} aria-hidden="true" />
      Kesin konum gizli
    </span>
  )
}

/**
 * İlanın konumu: yerleşim, açık adres ve koordinat.
 *
 * Veri çekmez — konum `listing.location`'dan gelir. Harita **karosu da
 * çekmez** (aşağıya bakın).
 *
 * ## İki bayrak, iki ayrı soru
 *
 * `location.showExactLocation` ilan sahibinin tercihidir ve *son kullanıcıya*
 * gösterimi yönetir (brifing 1.1). `revealExactLocation` ise moderatörün
 * yetkisidir ve *bu paneldeki* gösterimi yönetir. Panel ikisini **birbirine
 * bağlamaz**: sahibin tercihi paneli açmaz da kapatmaz da. Bağlasaydı "konum
 * tutarlılığı" otomatik kontrolü doğrulanamaz hâle gelirdi — o kontrolün
 * bulgusuna bakan moderatör adresi okumak zorunda ve ilanların çoğunda sahip
 * kesin konumu gizlemiş oluyor.
 *
 * **Ama tercihin ezildiği gösterilir.** `revealExactLocation` açıkken sahip
 * gizlemeyi seçmişse panel bunu bir bantla söyler. İki sebeple: (1) moderatör
 * ekranda gördüğü adresin kamuya açık sayfada **görünmediğini** bilmeli — yoksa
 * "adres yanlış yazılmış" diye son kullanıcının hiç görmediği bir metin
 * üzerinden karar verir; (2) kişisel veriye yakın bir alanı bir tercihi aşarak
 * okuduğunu bilmeli. Bant varyanta göre kısılmaz: en dar varyantta susmak, tam
 * da yanlış ekonomidir.
 *
 * Ters yön de kasıtlı: sahip kesin konumu **yayınlamış** olsa bile panel yine
 * kapalı açılır (`revealExactLocation` varsayılanı `false`). Sahibin bayrağını
 * sessizce okumak, prop'a iki anlam yüklerdi; kimin açabileceğine sayfa katmanı
 * karar verir.
 *
 * ## Gizliyken yerine ne konuyor
 *
 * **Mahallenin adı — uydurulmuş bir nokta değil.** Panelde mahalle sınırı veya
 * merkezi yok; elinde yalnızca kesin koordinat var. Onu yuvarlayıp "yaklaşık
 * konum" diye sunmak iki kere yanlış olurdu: iki basamak hâlâ ~1,1 kilometre
 * (üç basamak ~110 metre) yarıçapta binayı buldurur, yani gizlemez; üstelik
 * sırdan türetilmiş bir değeri bağımsız bir tahmin gibi gösterir. Yaklaşıklık
 * zaten elimizde ve dürüst: *Caferağa, Kadıköy / İstanbul*. Harita çerçevesi de
 * gizliyken iğne değil mahalle adını yazar.
 *
 * ## Yokluk gizlemeyi yener
 *
 * Boş bir alan için "gizli" yazılmaz. Koordinatın veya adresin **olmaması**
 * kişisel veri değil, ilanın kusurudur ve `revealExactLocation`'dan bağımsız
 * görünür: koordinatsız ilanda "konum tutarlılığı" kontrolü hiç çalışamaz, bunu
 * yetkisi olmayan moderatör de bilmeli. Tersi olsaydı kullanıcı, açacak bir şey
 * olmadığı hâlde yetki isterdi.
 *
 * `postalCode` kapının **dışında**: Türkiye'de posta kodu mahalle ölçeğinde
 * (34710 = Caferağa) ve "Caferağa, Kadıköy" zaten yazılıyken hiçbir bina
 * göstermiyor. Onu gizlemek koruma değil, koruma tiyatrosu olurdu — belge
 * kontrolünde ise kodun başlıkla eşleşmesi aranıyor.
 *
 * ## Harita yok
 *
 * `mapSplit`'in sol tarafı haritanın **yerini** tutar: kesik kenarlıklı bir
 * çerçeve, iğne ve koordinatın okunur, kopyalanabilir hâli. Karo çekilmiyor —
 * brifing story'lerin internet erişimi olmadan render edilmesini şart koşuyor ve
 * bir harita sağlayıcısı henüz seçilmedi. Sağlayıcı gelince **bu çerçevenin içi
 * doldurulacak**; çevresindeki düzen, adres kolonu ve gizlilik kuralları
 * değişmeyecek. Kesik kenarlık geçiciliğin işareti, dolu bir kutu "harita
 * yüklenemedi" sanılırdı.
 *
 * ## Bu panelde olmayanlar
 *
 * `loading`/`error` yok ve olmamalı: panel tek bir ilanın konumunu gösterir,
 * onu getiren istek sayfanındır (bkz. `UserSummaryCard`). Kopyalama butonu da
 * yok — sözleşmede kanalı yok; adres ve koordinat `user-select: all` ile
 * veriliyor, tek tıkla seçilip kopyalanıyor.
 *
 * Alan adları (`İl`, `İlçe`, `Mahalle`, `Açık adres`…) burada yazılı, çünkü
 * `domain/labels.ts`'te `Location` alanlarının sözlüğü **yok** — panel hiçbir
 * enum değeri göstermediği için oradan okuyacağı bir etiket de yok.
 * `LOCATION_FIELD_LABEL` eklenirse buradaki altı dize oraya taşınır.
 *
 * @example
 * <LocationPanel
 *   listing={listing}
 *   variant="mapSplit"
 *   revealExactLocation={yetkiler.canViewExactLocation}
 * />
 */
export function LocationPanel({
  listing,
  variant = 'summary',
  revealExactLocation = false,
}: LocationPanelProps) {
  const konum = listing.location
  const koordinat = konum.coordinates
  const acik = revealExactLocation
  const tercihEziliyor = acik && !konum.showExactLocation

  /*
    Değer üçlüsünün sırası önemli: önce "girilmemiş", sonra "gizli", sonra
    değerin kendisi. Yokluk gizlemeyi yener (component JSDoc'u).
  */
  const adresDegeri =
    konum.addressLine === undefined ? (
      <Girilmemis>Açık adres girilmemiş</Girilmemis>
    ) : !acik ? (
      <Gizli />
    ) : (
      <span className={css.copyable}>{konum.addressLine}</span>
    )

  const koordinatDegeri =
    koordinat === undefined ? (
      <Girilmemis>Koordinat girilmemiş</Girilmemis>
    ) : !acik ? (
      <Gizli />
    ) : (
      <span className={css.coordinate}>{formatKoordinat(koordinat)}</span>
    )

  /**
   * Sahibin tercihi. `summary`'de gösterilmiyor: o varyant liste satırında
   * duruyor ve her satırda tekrar eden rozet asıl sinyali bastırır
   * (`UserSummaryCard`'ın doğrulama rozetiyle aynı gerekçe).
   */
  const rozet =
    variant === 'summary' ? null : (
      <div className={css.badgeSlot}>
        <Badge
          tone={konum.showExactLocation ? 'info' : 'neutral'}
          variant="outline"
          size="sm"
          leadingIcon={konum.showExactLocation ? <Eye size={12} /> : <EyeOff size={12} />}
        >
          {konum.showExactLocation
            ? 'Kesin konum son kullanıcıya açık'
            : 'Kesin konum son kullanıcıya gizli'}
        </Badge>
      </div>
    )

  const uyari = tercihEziliyor ? (
    <p className={css.override}>
      <span className={css.overrideIcon} aria-hidden="true">
        <EyeOff size={16} />
      </span>
      İlan sahibi kesin konumu gizlemeyi seçti. Aşağıdaki adres ve koordinat yalnızca yönetim
      panelinde görünür; ilanın kamuya açık sayfasında {konum.neighborhoodName} mahallesinden
      fazlası yazmaz.
    </p>
  ) : null

  const yerlesim = (
    <p className={css.locality}>
      <span className={css.localityIcon} aria-hidden="true">
        <MapPin size={16} />
      </span>
      {konum.neighborhoodName}, {konum.districtName} / {konum.cityName}
    </p>
  )

  if (variant === 'summary') {
    return (
      <div className={css.root({ variant })}>
        {yerlesim}
        {uyari}

        {/*
          Kapalıyken ikinci satır hiç çıkmaz: yerleşim satırının kendisi zaten
          yaklaşıklıktır, altına "kesin konum gizli" yazmak liste satırında
          bilgi değil gürültü olurdu. Kapının kapalı olduğu, açılınca beliren
          satırdan anlaşılır.
        */}
        {acik ? (
          <p className={css.summaryExact}>
            {adresDegeri}
            <span className={css.separator} aria-hidden="true">
              ·
            </span>
            {koordinatDegeri}
          </p>
        ) : null}
      </div>
    )
  }

  if (variant === 'mapSplit') {
    return (
      <div className={css.root({ variant })}>
        <div className={css.mapFrame}>
          {koordinat === undefined ? (
            /*
              Koordinat yok: çerçeve boş bir kutu olarak kalmaz. Bu bir bulgu —
              "konum tutarlılığı" otomatik kontrolü noktasız çalışamaz, adres el
              ile doğrulanmalı. `revealExactLocation` bunu değiştirmez.
            */
            <EmptyState
              variant="compact"
              title="Koordinat girilmemiş"
              description="İlana harita üzerinde nokta işaretlenmemiş. Konum tutarlılığı otomatik kontrolü bu ilanda çalışamaz; adres alanları el ile doğrulanmalı."
              illustration={<MapPinOff size={24} />}
            />
          ) : acik ? (
            <>
              <span className={css.mapIcon} aria-hidden="true">
                <MapPin size={28} />
              </span>
              <p className={css.mapCoords}>{formatKoordinat(koordinat)}</p>
              <p className={css.mapNote}>
                Harita sağlayıcısı bağlanmadı; karo yerine koordinat metin olarak yazılıyor.
              </p>
            </>
          ) : (
            <>
              <span className={css.mapIcon} aria-hidden="true">
                <MapPinOff size={28} />
              </span>
              <p className={css.mapApprox}>
                {konum.neighborhoodName} Mahallesi, {konum.districtName}
              </p>
              <p className={css.mapNote}>
                Kesin konum gizli. Yaklaşık alan olarak mahalle adı yazılıyor — yuvarlanmış bir
                koordinat da gösterilmez.
              </p>
            </>
          )}
        </div>

        <div className={css.side}>
          {rozet}
          {yerlesim}
          {uyari}

          {/* Kolon dar: posta kodu ve plaka kodu burada değil, `addressDetail`'de. */}
          <dl className={css.facts}>
            <Bilgi label="Açık adres">{adresDegeri}</Bilgi>
            <Bilgi label="Koordinat">{koordinatDegeri}</Bilgi>
          </dl>
        </div>
      </div>
    )
  }

  return (
    <div className={css.root({ variant })}>
      {rozet}
      {yerlesim}
      {uyari}

      <dl className={css.facts}>
        <Bilgi label="İl">
          {konum.cityName} ({konum.cityCode})
        </Bilgi>
        <Bilgi label="İlçe">{konum.districtName}</Bilgi>
        <Bilgi label="Mahalle">{konum.neighborhoodName}</Bilgi>
        <Bilgi label="Açık adres">{adresDegeri}</Bilgi>
        <Bilgi label="Posta kodu">
          {konum.postalCode !== undefined ? (
            <span className={css.copyable}>{konum.postalCode}</span>
          ) : (
            <Girilmemis>Posta kodu girilmemiş</Girilmemis>
          )}
        </Bilgi>
        <Bilgi label="Koordinat">{koordinatDegeri}</Bilgi>
      </dl>
    </div>
  )
}
