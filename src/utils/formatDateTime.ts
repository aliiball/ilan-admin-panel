import type { ISODateTime } from '../types/domain'

/**
 * Panelin sabit yerel ayarı ve saat dilimi.
 *
 * İkisi de sabitleniyor, çünkü ikisinin de varsayılanı **çalıştıran makinedir**:
 *
 * - Yerel ayar verilmezse aynı tarih Türkçe makinede `14 Tem 2026`, İngilizce
 *   makinede `Jul 14, 2026` çıkar (bkz. NumberInput'un `locale="tr-TR"` sabiti —
 *   aynı tuzağın tarih hâli).
 * - Saat dilimi verilmezse `2026-07-14T09:05:00+03:00` İstanbul'da `09:05`,
 *   UTC runner'da `06:05`, Los Angeles'ta **`13 Tem 23:05`** görünür — yalnız
 *   saat değil *gün* de kayar. Moderasyon geçmişinde bu, kararın hangi gün
 *   verildiği sorusunu makineye göre farklı cevaplar; Chromatic çıktısı da
 *   runner'ın diline ve TZ'sine göre değişip her build'i "değişmiş" gösterir.
 *
 * Panel Türkiye operasyonu için: gösterilen saat her zaman İstanbul saatidir,
 * moderatörün nerede oturduğundan bağımsız. Çok bölgeli bir operasyon gerekirse
 * saat dilimi kullanıcı tercihinden gelmeli — ama makinenin varsayılanından asla.
 */
const LOCALE = 'tr-TR'
const TIME_ZONE = 'Europe/Istanbul'

const TARIH_SAAT = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: TIME_ZONE,
})

const TARIH = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: TIME_ZONE,
})

const SAAT = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: TIME_ZONE,
})

/** `2026-07-14T09:05:00+03:00` → `14 Tem 2026 09:05`. */
export function formatDateTime(value: ISODateTime): string {
  return TARIH_SAAT.format(new Date(value))
}

/** `2026-07-14T09:05:00+03:00` → `14 Tem 2026`. Saatin önemsiz olduğu yerlerde. */
export function formatDate(value: ISODateTime): string {
  return TARIH.format(new Date(value))
}

/** `2026-07-14T09:05:00+03:00` → `09:05`. Tarihi zaten yazan bir grubun içinde. */
export function formatTime(value: ISODateTime): string {
  return SAAT.format(new Date(value))
}

/**
 * `<time datetime="...">` için makine okunur değer.
 *
 * Ham ISO metni olduğu gibi döner: erişilebilirlik ağacına ve tarayıcıya giden
 * değer biçimlendirilmiş metin değil, kaynağın kendisidir.
 */
export function machineDateTime(value: ISODateTime): string {
  return value
}

/**
 * Göreli zaman (`3 gün önce`) **bilerek yok.**
 *
 * Hesabı "şimdi"ye dayanır; "şimdi" ise story'de her render'da değişir. Brifing
 * fixture'ların deterministik olmasını şart koşuyor ve göreli zaman bunu tek
 * başına bozar: aynı story dün "3 gün önce", bugün "4 gün önce" yazar, Chromatic
 * her gün fark üretir ve gerçek bir görsel regresyon bu gürültünün içinde
 * kaybolur. Gerekirse `now` prop'la dışarıdan verilmeli — component saati
 * kendisi okumamalı.
 */
