import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import type { AlertProps } from '../../../types/component-props'
import {
  actions,
  alert,
  content,
  description as descriptionClass,
  dismiss,
  icon,
  title as titleClass,
} from './Alert.css'

const TONE_ICON = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
} as const

/**
 * Kalıcı veya kapatılabilir bildirim: hata, uyarı ve bayat veri durumları için.
 *
 * `danger` ve `warning` tonları `role="alert"` ile duyurulur; ekran okuyucu
 * kullanıcısı bunları anında duyar. `success` ve `info` ise `role="status"` ile
 * kibarca bildirilir, kullanıcının işini bölmez.
 *
 * Her ton kendi ikonunu taşır: brifing kuralı gereği renk tek başına gösterge
 * olamaz, renk körü kullanıcı hatayı ikondan ve metinden ayırt eder.
 *
 * Geçici işlem geri bildirimi için `Toast` kullanın — Alert kalıcıdır.
 *
 * @example
 * <Alert tone="danger" title="İlan yüklenemedi" description="Bağlantı koptu." />
 */
export function Alert({
  tone,
  title,
  description,
  variant = 'soft',
  action,
  dismissible = false,
  onDismiss,
}: AlertProps) {
  const ToneIcon = TONE_ICON[tone]
  const isUrgent = tone === 'danger' || tone === 'warning'

  return (
    <div className={alert({ tone, variant })} role={isUrgent ? 'alert' : 'status'}>
      <span className={icon} aria-hidden="true">
        <ToneIcon size={20} />
      </span>

      <div className={content}>
        <span className={titleClass}>{title}</span>
        {description !== undefined ? <span className={descriptionClass}>{description}</span> : null}
        {action !== undefined ? <div className={actions}>{action}</div> : null}
      </div>

      {dismissible ? (
        <button type="button" className={dismiss} onClick={onDismiss} aria-label="Bildirimi kapat">
          <X size={16} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}
