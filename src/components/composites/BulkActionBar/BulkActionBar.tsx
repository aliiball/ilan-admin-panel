import { X } from 'lucide-react'
import { Button } from '../../primitives/Button'
import type { BulkActionBarProps } from '../../../types/component-props'
import * as css from './BulkActionBar.css'

/**
 * Seçili kayıtlar üzerindeki toplu eylemler.
 *
 * `selectedCount === 0` iken hiç render edilmez: seçim yokken toplu eylem
 * çubuğu boş yer kaplar ve tıklanacak bir şey sunmaz.
 *
 * Bir eylem sürerken **diğerleri kapanır**. Aynı seçim üzerinde iki toplu işlemin
 * yarışması (12 ilanı onayla + aynı 12 ilanı reddet) sunucuda hangisinin son
 * yazdığına bağlı, tahmin edilemez bir sonuç üretir.
 *
 * Sayaç `role="status"` içindedir; seçim büyüyüp küçüldükçe ekran okuyucu yeni
 * sayıyı duyurur. Çubuğun ilk belirdiği an (0 → 1) duyurulmayabilir — canlı
 * bölge DOM'a içeriğiyle birlikte eklendiğinde okuyucular tutarsız davranır.
 * O anda bilgi zaten kaybolmuyor: kullanıcı kutuyu kendisi işaretlemiştir ve
 * kutunun kendi "işaretlendi" duyurusunu duyar.
 *
 * Yetki kontrolü buranın işi değil: kullanıcının yapamayacağı eylem `disabled`
 * verilmez, `actions` listesine hiç konmaz. `disabled` yalnız eylemin bu seçim
 * için geçersiz olduğu durumlar içindir (arşivlenmiş ilanı yayına alamazsın).
 *
 * @example
 * <BulkActionBar
 *   selectedCount={secili.length}
 *   actions={[{ id: 'approve', label: 'Onayla' }, { id: 'reject', label: 'Reddet', tone: 'danger' }]}
 *   onAction={(id) => topluIslem(id, secili)}
 *   onClearSelection={() => setSecili([])}
 * />
 */
export function BulkActionBar({
  selectedCount,
  actions,
  variant = 'floating',
  loadingActionId,
  onAction,
  onClearSelection,
}: BulkActionBarProps) {
  if (selectedCount <= 0) return null

  const islemSuruyor = loadingActionId !== undefined

  return (
    <div className={css.root({ variant })}>
      <span className={css.count} role="status">
        {selectedCount.toLocaleString('tr-TR')} kayıt seçildi
      </span>

      <div className={css.actions}>
        {actions.map((eylem) => (
          <Button
            key={eylem.id}
            variant={eylem.tone === 'danger' ? 'danger' : 'secondary'}
            size="sm"
            {...(eylem.icon !== undefined && { leadingIcon: eylem.icon })}
            loading={loadingActionId === eylem.id}
            disabled={eylem.disabled === true || (islemSuruyor && loadingActionId !== eylem.id)}
            onClick={() => onAction(eylem.id)}
          >
            {eylem.label}
          </Button>
        ))}
      </div>

      <div className={css.clear}>
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<X size={16} />}
          disabled={islemSuruyor}
          onClick={onClearSelection}
        >
          Seçimi temizle
        </Button>
      </div>
    </div>
  )
}
