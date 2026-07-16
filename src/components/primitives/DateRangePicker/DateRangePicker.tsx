import { useId, useState } from 'react'
import { Popover } from '@base-ui/react/popover'
import { CalendarDays } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import type { DateRange as DayPickerRange } from 'react-day-picker'
import { tr } from 'react-day-picker/locale'
import 'react-day-picker/style.css'
import { FieldShell } from '../../internal/FieldShell'
import type { DateRange, DateRangePickerProps } from '../../../types/component-props'
import type { ISODate } from '../../../types/domain'
import {
  calendar,
  icon,
  popup,
  positioner,
  preset,
  presets,
  trigger,
  triggerPlaceholder,
  triggerValue,
} from './DateRangePicker.css'

/** `Date` <-> `ISODate` çevrimi; saat dilimi kaymasın diye yerel bileşenlerden kurulur. */
function toISODate(date: Date): ISODate {
  const yil = date.getFullYear()
  const ay = String(date.getMonth() + 1).padStart(2, '0')
  const gun = String(date.getDate()).padStart(2, '0')
  return `${yil}-${ay}-${gun}` as ISODate
}

function fromISODate(value: ISODate | undefined): Date | undefined {
  if (value === undefined) return undefined
  const [yil, ay, gun] = value.split('-').map(Number)
  if (yil === undefined || ay === undefined || gun === undefined) return undefined
  return new Date(yil, ay - 1, gun)
}

const bicimle = (value: ISODate | undefined): string => {
  const date = fromISODate(value)
  return date === undefined ? '' : date.toLocaleDateString('tr-TR')
}

/**
 * Tarih aralığı seçimi: dashboard tarih filtresi, ilan ve güncellenme tarihi aralıkları.
 *
 * Takvimin davranışı (klavye gezinme, ay navigasyonu, aralık seçimi, ekran
 * okuyucu duyuruları, Türkçe yerelleştirme) `react-day-picker`'dan gelir —
 * Base UI'da tarih primitive'i yok ve bunları sıfırdan doğru yazmak günler
 * sürerdi. Görünüm tamamen bizim token'larımıza bağlıdır.
 *
 * `presets` ile "Son 7 gün" gibi hazır aralıklar sunulur; en sık kullanılan
 * aralıkları tıklayarak seçmek takvimde gezinmekten çok daha hızlıdır.
 *
 * @example
 * <DateRangePicker label="İlan tarihi" value={aralik} onValueChange={setAralik} />
 */
export function DateRangePicker({
  value,
  min,
  max,
  disabled = false,
  presets: presetList,
  onValueChange,
  label,
  helperText,
  error,
  required = false,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const hasError = error !== undefined && error !== ''

  /**
   * Popover.Trigger bir Field.Control değil, bu yüzden Field.Label'ın `for`'u ona
   * bağlanamıyor ve boşa düşüyordu. Bağ ters yönden kuruluyor: etikete id verilip
   * tetikleyici `aria-labelledby` ile ona işaret ediyor.
   */
  const labelId = useId()

  const from = bicimle(value.from)
  const to = bicimle(value.to)
  const etiket = from === '' && to === '' ? '' : `${from || '…'} – ${to || '…'}`

  // react-day-picker'in kendi DateRange tipi kullaniliyor: bizimki
  // `from?: ISODate` iken onunki `from: Date | undefined` ve
  // exactOptionalPropertyTypes acikken ikisi ayni sayilmiyor.
  const handleSelect = (range: DayPickerRange | undefined) => {
    const next: DateRange = {
      ...(range?.from !== undefined && { from: toISODate(range.from) }),
      ...(range?.to !== undefined && { to: toISODate(range.to) }),
    }
    onValueChange?.(next)
  }

  return (
    <FieldShell
      {...(label !== undefined && { label })}
      {...(helperText !== undefined && { helperText })}
      {...(error !== undefined && { error })}
      required={required}
      disabled={disabled}
      {...(label !== undefined && { labelId })}
    >
      <Popover.Root open={open} onOpenChange={(next: boolean) => setOpen(next)}>
        <Popover.Trigger
          className={trigger({ size: 'md' })}
          disabled={disabled}
          data-invalid={hasError ? '' : undefined}
          data-disabled={disabled ? '' : undefined}
          {...(label !== undefined && { 'aria-labelledby': labelId })}
        >
          <span className={icon}>
            <CalendarDays size={16} aria-hidden="true" />
          </span>
          <span className={triggerValue}>
            {etiket === '' ? (
              <span className={triggerPlaceholder}>Tarih aralığı seçin</span>
            ) : (
              etiket
            )}
          </span>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Positioner className={positioner} sideOffset={4} align="start">
            <Popover.Popup className={popup}>
              {presetList !== undefined && presetList.length > 0 ? (
                <div className={presets}>
                  {presetList.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className={preset}
                      onClick={() => {
                        onValueChange?.(item.value)
                        setOpen(false)
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className={calendar}>
                <DayPicker
                  mode="range"
                  locale={tr}
                  numberOfMonths={1}
                  selected={{
                    from: fromISODate(value.from),
                    to: fromISODate(value.to),
                  }}
                  onSelect={handleSelect}
                  {...(min !== undefined || max !== undefined
                    ? {
                        disabled: [
                          ...(min !== undefined ? [{ before: fromISODate(min) as Date }] : []),
                          ...(max !== undefined ? [{ after: fromISODate(max) as Date }] : []),
                        ],
                      }
                    : {})}
                />
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </FieldShell>
  )
}
