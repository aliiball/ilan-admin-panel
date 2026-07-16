import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import type { TabsProps } from '../../../types/component-props'
import { badge, list, panel, root, tab } from './Tabs.css'

/**
 * Görünüm gruplama: ilan detayında bilgi/moderasyon/geçmiş, ayarlarda roller/tema.
 *
 * Klavye davranışı **manuel aktivasyondur**: ok tuşu odağı taşır, seçimi Enter
 * veya Space yapar. Otomatik aktivasyon olsaydı 5 sekme arasında ok tuşuyla
 * gezinmek 5 ayrı veri isteği tetiklerdi — panelleri veri çeken sekmelerde
 * doğru olan budur. Gezinme ve panel bağlantısı Base UI'dan gelir.
 *
 * Seçili sekme yalnız renkle değil, alt çizgi veya dolgu ile de belli olur;
 * renk körü kullanıcı da hangi sekmede olduğunu görür.
 *
 * Sekmeler taşarsa yatay kaydırılır, kesilmez. Çok sayıda bölüm varsa mobilde
 * `Accordion` daha uygun olabilir.
 *
 * @example
 * <Tabs value={sekme} items={sekmeler} onValueChange={setSekme} />
 */
export function Tabs({
  value,
  items,
  variant = 'underline',
  orientation = 'horizontal',
  onValueChange,
}: TabsProps) {
  return (
    <BaseTabs.Root
      className={root({ orientation })}
      value={value}
      orientation={orientation}
      onValueChange={(next: unknown) => onValueChange(String(next))}
    >
      <BaseTabs.List className={list({ orientation, variant })}>
        {items.map((item) => (
          <BaseTabs.Tab
            key={item.id}
            value={item.id}
            className={tab({ variant })}
            disabled={item.disabled ?? false}
          >
            {item.label}
            {item.badge !== undefined ? <span className={badge}>{item.badge}</span> : null}
          </BaseTabs.Tab>
        ))}
      </BaseTabs.List>

      {items.map((item) => (
        <BaseTabs.Panel key={item.id} value={item.id} className={panel}>
          {item.content}
        </BaseTabs.Panel>
      ))}
    </BaseTabs.Root>
  )
}
