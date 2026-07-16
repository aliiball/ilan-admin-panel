import { useId } from 'react'
import { AlertCircle } from 'lucide-react'
import { RejectionReason } from '../../../types/domain'
import { REJECTION_REASON_DESCRIPTION, REJECTION_REASON_LABEL } from '../../../domain/labels'
import { Checkbox } from '../../primitives/Checkbox'
import { MultiSelect } from '../../primitives/MultiSelect'
import { Textarea } from '../../primitives/Textarea'
import type { RejectionReasonPickerProps, SelectOption } from '../../../types/component-props'
import * as css from './RejectionReasonPicker.css'

/** Gerekçeler brifing 1.3'ün sırasıyla; enum'un kendi sırası zaten o sıradır. */
const GEREKCELER = Object.values(RejectionReason)

const SECENEKLER: SelectOption[] = GEREKCELER.map((reason) => ({
  value: reason,
  label: REJECTION_REASON_LABEL[reason],
  description: REJECTION_REASON_DESCRIPTION[reason],
}))

const NOT_SINIRI = 500

/**
 * Red ve düzeltme kararı için gerekçe ve not toplar.
 *
 * Gerekçe ile not **birlikte** alınır: gerekçe hangi kuralın çiğnendiğini,
 * not bu ilanda tam olarak neyin yanlış olduğunu söyler. İlan sahibine giden
 * mesaj ikisinin toplamıdır — tek başına "Yanıltıcı veya Eksik Bilgi" hiçbir
 * şeyi düzeltmez, "net m² 128 yazılmış, tapuda 118 görünüyor" düzeltir.
 *
 * `cards` varyantı gerekçelerin açıklamasını da gösterir; kararın asıl verildiği
 * yer orasıdır. `list` ve `compactSelect` yalnız etiketi gösterir ve zaten
 * kararını vermiş kullanıcının hızlı işaretlemesi içindir.
 *
 * **Zorunluluğu denetlemez.** `required` yalnız işareti koyar; "bu karar
 * gönderilebilir mi" sorusunun cevabı `domain/moderationActions.ts`'teki
 * `isModerationDecisionComplete`'te ve gönderimi kapatmak kararın sahibi olan
 * üst katmanın işi. Picker aynı anda hem red hem düzeltme isteği için
 * kullanılıyor; hangisinin neyi zorunlu kıldığını bilmesi gerekmiyor.
 *
 * @example
 * <RejectionReasonPicker
 *   value={gerekceler}
 *   note={not}
 *   required
 *   onValueChange={setGerekceler}
 *   onNoteChange={setNot}
 * />
 */
export function RejectionReasonPicker({
  value,
  note,
  variant = 'cards',
  required = false,
  disabled = false,
  error,
  onValueChange,
  onNoteChange,
}: RejectionReasonPickerProps) {
  const hataId = useId()
  const hataVar = error !== undefined && error !== ''

  const degistir = (reason: RejectionReason, secili: boolean) => {
    onValueChange(secili ? [...value, reason] : value.filter((mevcut) => mevcut !== reason))
  }

  return (
    <div className={css.root}>
      {variant === 'compactSelect' ? (
        <MultiSelect
          label="Gerekçe"
          placeholder="Gerekçe seçin"
          options={SECENEKLER}
          values={value}
          required={required}
          disabled={disabled}
          {...(error !== undefined && { error })}
          onValuesChange={(next) => onValueChange(next as RejectionReason[])}
        />
      ) : (
        /*
          `<fieldset>` + `<legend>`: birbirine bağlı seçim kutuları grubunun
          erişilebilir adı buradan gelir. Kutuların her biri kendi etiketini
          taşıyor ama ekran okuyucu kullanıcısı gruba girdiğinde "Gerekçe,
          grup" duymazsa on beş kutunun neyin seçenekleri olduğunu bilemez.
        */
        <fieldset
          className={css.group}
          disabled={disabled}
          aria-describedby={hataVar ? hataId : undefined}
        >
          <legend className={css.legend}>
            Gerekçe
            {required ? (
              <span className={css.requiredMark} aria-hidden="true">
                *
              </span>
            ) : null}
          </legend>

          <div className={css.options({ variant })}>
            {GEREKCELER.map((reason) => (
              <Checkbox
                key={reason}
                className={variant === 'cards' ? css.card : css.row}
                label={REJECTION_REASON_LABEL[reason]}
                {...(variant === 'cards' && {
                  description: REJECTION_REASON_DESCRIPTION[reason],
                })}
                checked={value.includes(reason)}
                disabled={disabled}
                onCheckedChange={(secili) => degistir(reason, secili)}
              />
            ))}
          </div>

          {hataVar ? (
            <p className={css.error} id={hataId}>
              <AlertCircle size={14} className={css.errorIcon} aria-hidden="true" />
              {error}
            </p>
          ) : null}
        </fieldset>
      )}

      <Textarea
        label="Moderasyon notu"
        helperText="İlan sahibine gerekçeyle birlikte iletilir. Neyin, nerede yanlış olduğunu yazın."
        placeholder="Örn. Net m² 128 yazılmış, tapu belgesinde 118 görünüyor."
        value={note}
        rows={3}
        required={required}
        disabled={disabled}
        maxLength={NOT_SINIRI}
        showCharacterCount
        onChange={(event) => onNoteChange(event.target.value)}
      />
    </div>
  )
}
