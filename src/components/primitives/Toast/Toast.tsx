import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import type { ToastProps } from '../../../types/component-props'
import {
  action as actionClass,
  close,
  content,
  description as descriptionClass,
  icon,
  title as titleClass,
  toast,
  viewport,
} from './Toast.css'

const TONE_ICON = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
} as const

/*
  Portal ayrı bir component olmak zorunda: `createPortal(...)` sonucunu doğrudan
  `return` eden fonksiyona react-docgen "No suitable component definition found"
  deyip **dosyanın tamamını atlıyor**. Toast'ın yedi prop'u belgeli olduğu hâlde
  ne Controls'ta ne AI manifest'inde görünüyordu — `@/` tuzağının aynısı, sebebi
  farklı. Toast artık gerçek JSX döndüğü için docgen onu buluyor.

  Story testiyle korunamaz: `__docgenInfo`'yu docgen plugin'i yalnız `storybook
  build`/`dev` sırasında iliştiriyor, vitest ortamında tanımsız. Ölçmenin yolu
  AGENTS.md'deki manifest sayım betiği — orada Toast'ın `error` alanı boş ve
  prop sayısı 7 olmalı.
*/
function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body)
}

/**
 * Geçici işlem geri bildirimi: kaydetme, onaylama, reddetme sonucu.
 *
 * Kalıcı uyarı için `Alert` kullanın — toast kaybolur, kullanıcı kaçırabilir.
 * Bu yüzden toast'a kritik bilgi veya tek çıkış yolu koymayın.
 *
 * `danger` tonu `role="alert"` ile anında duyurulur ve **otomatik kapanmaz**:
 * bir hata mesajını kullanıcı okumadan kaçırmamalıdır. Diğer tonlar
 * `role="status"` ile kibarca bildirilir ve süresi dolunca kapanır.
 *
 * Fareyle üzerine gelindiğinde sayaç durur — okurken kaybolması sinir bozucudur.
 *
 * NOT: Bu, brifingin sözleşmesi gereği tek ve kontrollü bir toast'tır. Üst üste
 * binen bildirimleri yönetecek kuyruk (ToastProvider) uygulama katmanında,
 * sayfa fazında kurulacak.
 *
 * @example
 * <Toast open={acik} tone="success" title="İlan onaylandı" onOpenChange={setAcik} />
 */
export function Toast({
  open,
  title,
  description,
  tone = 'info',
  action,
  durationMs = 5000,
  onOpenChange,
}: ToastProps) {
  const ToneIcon = TONE_ICON[tone]
  const isError = tone === 'danger'
  const pausedRef = useRef(false)

  useEffect(() => {
    // Hata toast'i otomatik kapanmaz: kullanici okumadan kaybolmamali.
    if (!open || isError || durationMs <= 0) return

    const timer = setTimeout(() => {
      if (!pausedRef.current) onOpenChange(false)
    }, durationMs)

    return () => clearTimeout(timer)
  }, [open, isError, durationMs, onOpenChange])

  if (!open || typeof document === 'undefined') return null

  return (
    <Portal>
      <div className={viewport}>
        <div
          className={toast({ tone })}
          role={isError ? 'alert' : 'status'}
          aria-live={isError ? 'assertive' : 'polite'}
          onMouseEnter={() => {
            pausedRef.current = true
          }}
          onMouseLeave={() => {
            pausedRef.current = false
          }}
        >
          <span className={icon} aria-hidden="true">
            <ToneIcon size={20} />
          </span>

          <div className={content}>
            <span className={titleClass}>{title}</span>
            {description !== undefined ? (
              <span className={descriptionClass}>{description}</span>
            ) : null}
            {action !== undefined ? (
              <button type="button" className={actionClass} onClick={action.onClick}>
                {action.label}
              </button>
            ) : null}
          </div>

          <button
            type="button"
            className={close}
            onClick={() => onOpenChange(false)}
            aria-label="Bildirimi kapat"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </Portal>
  )
}
