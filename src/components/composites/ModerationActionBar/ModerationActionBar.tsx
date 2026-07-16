import { useEffect, useState, type ReactNode } from 'react'
import { Archive, Check, Pause, PenLine, X } from 'lucide-react'
import type { RejectionReason } from '../../../types/domain'
import {
  MODERATION_ACTION_RULE,
  isModerationActionAllowedFrom,
  isModerationDecisionComplete,
  type ModerationAction,
} from '../../../domain/moderationActions'
import { Button } from '../../primitives/Button'
import { Modal } from '../../primitives/Modal'
import { Textarea } from '../../primitives/Textarea'
import { RejectionReasonPicker } from '../RejectionReasonPicker'
import type {
  ModerationActionBarProps,
  ModerationCapabilities,
  ModerationDecisionPayload,
} from '../../../types/component-props'
import * as css from './ModerationActionBar.css'

interface EylemSunumu {
  /** Butonun ve dialog'un metinleri. */
  label: string
  icon: ReactNode
  variant: 'primary' | 'secondary' | 'danger'
  /** Bu eylemi görmek için gereken yetki. */
  yetki: keyof ModerationCapabilities
  dialogTitle: string
  dialogDescription: string
  confirmLabel: string
}

/**
 * Eylemlerin görünüm bilgisi. Kural bilgisi burada **yok** — hangi durumda
 * görüneceği ve neyi zorunlu kıldığı `domain/moderationActions.ts`'te.
 *
 * Sıra sabit ve bilinçli: en olumlu karar solda, en yıkıcı sağda. Kuyrukta
 * saatte yüzlerce karar veren moderatör butonların yerini kas hafızasıyla
 * bulur; sıranın duruma göre değişmesi yanlış tuşa basılmasına yol açar.
 */
const EYLEM_SUNUMU = {
  approve: {
    label: 'Onayla',
    icon: <Check size={16} />,
    variant: 'primary',
    yetki: 'canApprove',
    dialogTitle: 'İlanı onayla ve yayına al',
    dialogDescription:
      'İlan onaylandığında herkese açık olarak yayınlanır ve arama sonuçlarında görünür.',
    confirmLabel: 'Onayla ve yayınla',
  },

  requestChanges: {
    label: 'Düzeltme iste',
    icon: <PenLine size={16} />,
    variant: 'secondary',
    yetki: 'canRequestChanges',
    dialogTitle: 'Düzeltme iste',
    dialogDescription:
      'İlan sahibinden düzeltme istenir. Seçtiğiniz gerekçe ve notunuz kendisine iletilir; ilan düzeltilip tekrar gönderilene kadar yayınlanmaz.',
    confirmLabel: 'Düzeltme iste',
  },

  reject: {
    label: 'Reddet',
    icon: <X size={16} />,
    variant: 'danger',
    yetki: 'canReject',
    dialogTitle: 'İlanı reddet',
    dialogDescription:
      'Reddedilen ilan yayınlanmaz. Seçtiğiniz gerekçe ve notunuz ilan sahibine iletilir.',
    confirmLabel: 'Reddet',
  },

  pause: {
    label: 'Pasife al',
    icon: <Pause size={16} />,
    variant: 'secondary',
    yetki: 'canPause',
    dialogTitle: 'İlanı pasife al',
    dialogDescription:
      'İlan yayından kaldırılır ama süresi işlemeye devam eder. Not, ilanın neden durdurulduğunu kayda geçirir.',
    confirmLabel: 'Pasife al',
  },

  archive: {
    label: 'Arşivle',
    icon: <Archive size={16} />,
    variant: 'secondary',
    yetki: 'canArchive',
    dialogTitle: 'İlanı arşivle',
    dialogDescription:
      'Arşivlenen ilan operasyonel akıştan çıkar. Yayına doğrudan dönemez; yalnızca taslak olarak geri yüklenebilir.',
    confirmLabel: 'Arşivle',
  },
} as const satisfies Record<ModerationAction, EylemSunumu>

const SIRA: readonly ModerationAction[] = [
  'approve',
  'requestChanges',
  'reject',
  'pause',
  'archive',
]

/**
 * İlan üzerindeki moderasyon kararları ve kararın toplandığı akış.
 *
 * **Bir eylem iki kapıdan geçmeden görünmez:** kullanıcının yetkisi olacak
 * (`capabilities`) ve ilanın durumu o geçişe izin verecek
 * (`domain/moderationActions.ts`). İkisi de "kapalı buton" değil "yok" ile
 * sonuçlanır — brifingin "UI yalnız izin verilen transition eylemlerini
 * göstermelidir" kriteri. Taslak ilanda "Onayla" görmek, moderatöre olmayan
 * bir seçenek sunar; `destek` rolüne kapalı bir "Reddet" göstermek ise
 * yetkisini merak ettirir. Hiçbir eylem kalmazsa çubuk hiç render edilmez.
 *
 * **Kararı çubuk toplar.** `ModerationDecisionPayload` gerekçe ve not
 * istiyor; red ve düzeltme isteğinde ikisi de zorunlu (brifing 1.2). Bu yüzden
 * karar butonu doğrudan handler'ı çağırmaz, önce dialog açar: gerekçe
 * `RejectionReasonPicker` ile, not onun içindeki alanla toplanır. Onay ve
 * arşivde alan yoktur ama dialog yine açılır — brifing 2.4 karar öncesi
 * doğrulamayı zorunlu tutuyor ve tek tıkla yayına alınan ilan geri
 * döndürülemez.
 *
 * **Dialog onayla birlikte kapanır.** Sözleşmede hata kanalı yok; istek
 * başarısız olursa çubuğun dialog içinde gösterebileceği bir şey de yok —
 * sonucu sayfanın toast'ı bildirir. Taslak (gerekçe + not) state'te kalır:
 * karar reddedilirse (örneğin revizyon çakışması) kullanıcı dialog'u tekrar
 * açtığında yazdığı not yerinde durur, baştan yazmaz. Taslak yalnız `listingId`
 * değişince temizlenir — bir sonraki ilana geçen moderatör önceki ilanın
 * notunu miras almamalı.
 *
 * Çubuk revizyon **çakışmasını görmez**, görünür kılar: kararı moderatörün
 * gördüğü `revision` ile damgalar (`expectedRevision`), çakışmayı sunucu tespit
 * eder, sonucu sayfa gösterir.
 *
 * @example
 * <ModerationActionBar
 *   listingId={listing.id}
 *   status={listing.status}
 *   revision={listing.revision}
 *   capabilities={yetkiler}
 *   onApprove={onayla}
 *   onReject={reddet}
 *   onRequestChanges={duzeltmeIste}
 * />
 */
export function ModerationActionBar({
  listingId,
  status,
  revision,
  capabilities,
  variant = 'inline',
  submittingAction,
  onApprove,
  onReject,
  onRequestChanges,
  onPause,
  onArchive,
}: ModerationActionBarProps) {
  const [acikEylem, setAcikEylem] = useState<ModerationAction | null>(null)
  const [gerekceler, setGerekceler] = useState<RejectionReason[]>([])
  const [not, setNot] = useState('')

  /** Yeni ilana geçildi: önceki ilanın gerekçesi ve notu bu ilana taşınmamalı. */
  useEffect(() => {
    setAcikEylem(null)
    setGerekceler([])
    setNot('')
  }, [listingId])

  /**
   * Handler'lar eylem adına eşleniyor. `onPause`/`onArchive` opsiyonel: yoksa
   * eylem hiç listelenmez — basıldığında hiçbir şey yapmayan buton, kapalı
   * butondan daha kötüdür.
   */
  const handlers: Record<
    ModerationAction,
    ((payload: ModerationDecisionPayload) => void | Promise<void>) | undefined
  > = {
    approve: onApprove,
    reject: onReject,
    requestChanges: onRequestChanges,
    pause: onPause,
    archive: onArchive,
  }

  const gorunurEylemler = SIRA.filter(
    (action) =>
      capabilities[EYLEM_SUNUMU[action].yetki] &&
      isModerationActionAllowedFrom(action, status) &&
      handlers[action] !== undefined,
  )

  if (gorunurEylemler.length === 0) return null

  const islemSuruyor = submittingAction !== undefined
  const kural = acikEylem !== null ? MODERATION_ACTION_RULE[acikEylem] : null
  const sunum = acikEylem !== null ? EYLEM_SUNUMU[acikEylem] : null
  const tamamlandi = acikEylem !== null && isModerationDecisionComplete(acikEylem, gerekceler, not)

  const kararGonder = () => {
    if (acikEylem === null || !tamamlandi) return

    const temizNot = not.trim()
    const payload: ModerationDecisionPayload = {
      listingId,
      expectedRevision: revision,
      reasons: gerekceler,
      // Koşullu spread: exactOptionalPropertyTypes açıkken `note: undefined`
      // yazılamaz (TS2375). Not ya vardır ya yoktur.
      ...(temizNot !== '' && { note: temizNot }),
    }

    setAcikEylem(null)
    void handlers[acikEylem]?.(payload)
  }

  return (
    <>
      <div className={css.root({ variant })}>
        {gorunurEylemler.map((action) => (
          <Button
            key={action}
            variant={EYLEM_SUNUMU[action].variant}
            size="sm"
            leadingIcon={EYLEM_SUNUMU[action].icon}
            fullWidth={variant === 'sideRail'}
            loading={submittingAction === action}
            /*
              Bir karar uçarken diğerleri kapanır: aynı ilana aynı anda "onayla"
              ve "reddet" göndermek, sunucuda hangisinin son yazdığına bağlı,
              tahmin edilemez bir sonuç üretir.
            */
            disabled={islemSuruyor && submittingAction !== action}
            onClick={() => setAcikEylem(action)}
          >
            {EYLEM_SUNUMU[action].label}
          </Button>
        ))}
      </div>

      {acikEylem !== null && kural !== null && sunum !== null ? (
        <Modal
          open
          size={kural.requiresReason ? 'lg' : 'sm'}
          title={sunum.dialogTitle}
          description={sunum.dialogDescription}
          onOpenChange={(next) => {
            if (!next) setAcikEylem(null)
          }}
          footer={
            <div className={css.footer}>
              <Button variant="secondary" onClick={() => setAcikEylem(null)}>
                Vazgeç
              </Button>
              <Button
                variant={sunum.variant === 'primary' ? 'primary' : 'danger'}
                disabled={!tamamlandi}
                onClick={kararGonder}
              >
                {sunum.confirmLabel}
              </Button>
            </div>
          }
        >
          <div className={css.dialogBody}>
            {kural.requiresReason ? (
              /*
                Dialog dar: `list` varyantı açıklamaları göstermez. Gerekçelerin
                açıklamasına ihtiyaç duyan kullanıcı picker'ı `cards` ile ekranın
                kendisinde kullanır; burada karar zaten verilmiş, yapılan işaretleme.
              */
              <RejectionReasonPicker
                variant="list"
                required
                value={gerekceler}
                note={not}
                onValueChange={setGerekceler}
                onNoteChange={setNot}
              />
            ) : kural.requiresNote ? (
              <Textarea
                label="Not"
                helperText="Bu kararın neden alındığını kayda geçirir."
                value={not}
                rows={3}
                required
                maxLength={500}
                showCharacterCount
                onChange={(event) => setNot(event.target.value)}
              />
            ) : null}
          </div>
        </Modal>
      ) : null}
    </>
  )
}
