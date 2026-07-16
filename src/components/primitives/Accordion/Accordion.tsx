import { Accordion as BaseAccordion } from '@base-ui/react/accordion'
import { ChevronDown } from 'lucide-react'
import type { AccordionProps } from '../../../types/component-props'
import {
  icon,
  item,
  panel,
  panelContent,
  root,
  trigger,
  triggerDescription,
  triggerText,
} from './Accordion.css'

/**
 * Açılır içerik bölümleri: mobil ilan detayı, kategori öznitelik grupları.
 *
 * Mobilde `Tabs`'a tercih edilir — dar ekranda sekme başlıkları sığmaz, ama
 * açılır bölümler dikey akışa doğal uyar.
 *
 * Açık/kapalı durumu yalnız renkle değil, dönen okla da anlatılır.
 *
 * `allowMultiple=false` iken tek bölüm açık kalır; uzun içeriklerde kullanıcının
 * kaybolmasını engeller.
 *
 * @example
 * <Accordion items={bolumler} expandedIds={acik} onExpandedIdsChange={setAcik} />
 */
export function Accordion({
  items,
  expandedIds,
  allowMultiple = true,
  variant = 'separated',
  onExpandedIdsChange,
}: AccordionProps) {
  return (
    <BaseAccordion.Root
      className={root({ variant })}
      value={expandedIds}
      multiple={allowMultiple}
      onValueChange={(next: unknown[]) => onExpandedIdsChange(next.map(String))}
    >
      {items.map((entry) => (
        <BaseAccordion.Item key={entry.id} value={entry.id} className={item({ variant })}>
          <BaseAccordion.Header>
            <BaseAccordion.Trigger className={trigger} disabled={entry.disabled ?? false}>
              <span className={triggerText}>
                <span>{entry.title}</span>
                {entry.description !== undefined ? (
                  <span className={triggerDescription}>{entry.description}</span>
                ) : null}
              </span>
              <span className={icon}>
                <ChevronDown size={18} aria-hidden="true" />
              </span>
            </BaseAccordion.Trigger>
          </BaseAccordion.Header>

          <BaseAccordion.Panel className={panel}>
            <div className={panelContent}>{entry.content}</div>
          </BaseAccordion.Panel>
        </BaseAccordion.Item>
      ))}
    </BaseAccordion.Root>
  )
}
