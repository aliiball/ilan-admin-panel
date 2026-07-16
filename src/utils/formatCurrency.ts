import { CURRENCY_SYMBOL } from '../domain/labels'
import { PricePeriod, type Money } from '../types/domain'

const PERIOD_SUFFIX = {
  [PricePeriod.OneTime]: '',
  [PricePeriod.Monthly]: ' / ay',
  [PricePeriod.Daily]: ' / gün',
  [PricePeriod.Yearly]: ' / yıl',
} satisfies Record<PricePeriod, string>

/**
 * `Money` değerini Türkçe biçimde metne çevirir: `18.750.000 ₺`, `65.000 ₺ / ay`.
 *
 * Component'lerin içine kopyalanmaz: aynı fiyat listede, kartta ve detayda
 * görünür; üç yerde ayrı biçimlendirilse biri kuruş gösterip diğeri göstermez
 * ve tablo hizası bozulur.
 *
 * Kuruş bilerek gizlenir — gayrimenkul fiyatları tam sayıdır ve `18.750.000,00 ₺`
 * okumayı zorlaştırır. m² fiyatı gibi ondalıklı değerlerde `maximumFractionDigits`
 * ile açılır.
 */
export function formatCurrency(money: Money, options?: { maximumFractionDigits?: number }): string {
  const tutar = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(money.amount)

  return `${tutar} ${CURRENCY_SYMBOL[money.currency]}${PERIOD_SUFFIX[money.period]}`
}

/** Pazarlık payı varsa fiyatın yanında gösterilecek ek metin. */
export function negotiableSuffix(money: Money): string {
  return money.negotiable ? ' (pazarlıklı)' : ''
}
