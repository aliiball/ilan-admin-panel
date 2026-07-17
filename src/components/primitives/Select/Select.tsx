import { Combobox } from '@base-ui/react/combobox'
import { Select as BaseSelect } from '@base-ui/react/select'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { FieldShell } from '../../internal/FieldShell'
import { Spinner } from '../Spinner'
import type { SelectOption, SelectProps } from '../../../types/component-props'
import * as css from '../../internal/listbox.css'

function OptionRow({ option }: { option: SelectOption }) {
  return (
    <>
      <span className={css.itemText}>
        <span>{option.label}</span>
        {option.description !== undefined ? (
          <span className={css.itemDescription}>{option.description}</span>
        ) : null}
      </span>
      <span className={css.itemIndicator}>
        <Check size={16} aria-hidden="true" />
      </span>
    </>
  )
}

/**
 * Tekli seçim.
 *
 * İki farklı etkileşim modeli sunar ve `searchable` hangisinin kullanılacağını
 * belirler:
 *
 * - `searchable=false`: klasik açılır liste. Az sayıda seçenek için.
 * - `searchable=true`: yazarak filtrelenen liste. İl/ilçe/mahalle gibi uzun
 *   listelerde zorunludur — 900 ilçeyi kaydırarak bulmak kullanılabilir değildir.
 *
 * İkisi Base UI'ın farklı primitive'leri üzerine kuruludur (Select ve Combobox);
 * klavye davranışları da bu yüzden farklıdır ve her biri kendi modeli için doğrudur.
 *
 * 2-4 seçenek varsa ve hepsi görünmeliyse `RadioGroup` daha uygun olabilir.
 *
 * @example
 * <Select label="İl" options={iller} searchable value={il} onValueChange={setIl} />
 */
export function Select({
  value,
  options,
  placeholder = 'Seçin',
  size = 'md',
  disabled = false,
  searchable = false,
  clearable = false,
  loading = false,
  onValueChange,
  label,
  helperText,
  error,
  required = false,
}: SelectProps) {
  const hasError = error !== undefined && error !== ''
  const selected = options.find((option) => option.value === value)

  /*
    `value` aşağıda koşullu spread ile geçilmez: sözleşmenin `undefined`'ı
    ("seçim yok") Base UI'a `null` diye çevrilir.

    Base UI kontrollü olup olmadığına **ilk render'daki** `value`'ya bakarak karar
    veriyor ve `undefined`'ı "kontrolsüz" sayıyor. Koşullu spread seçim yokken
    prop'u hiç geçirmediğinden, `useState<string | undefined>(undefined)` ile
    başlayan her çağıran (ImageGallery'nin fotoğraf reddi, aşağıdaki Interactive
    story) Select'i önce kontrolsüz kuruyor, ilk seçimde kontrollüye çeviriyor ve
    Base UI her seçimde console.error basıyordu. `null` geçmek kontrollülüğü
    component'in ömrü boyunca sabitler.

    Repodaki diğer koşullu spread'ler (`error`, `label`) doğrudur: onlar
    `exactOptionalPropertyTypes` içindir ve orada yokluk ile `undefined` aynı
    şeydir. `value`'da değildir — yokluk "kontrolsüz" demektir.
  */

  const shell = (children: React.ReactNode) => (
    <FieldShell
      {...(label !== undefined && { label })}
      {...(helperText !== undefined && { helperText })}
      {...(error !== undefined && { error })}
      required={required}
      disabled={disabled}
    >
      {children}
    </FieldShell>
  )

  if (searchable) {
    return shell(
      <Combobox.Root
        items={options}
        itemToStringLabel={(item: SelectOption) => item.label}
        value={selected ?? null}
        {...(onValueChange !== undefined && {
          onValueChange: (next: SelectOption | null) => onValueChange(next?.value),
        })}
        disabled={disabled}
      >
        <Combobox.InputGroup
          className={css.trigger({ size })}
          data-invalid={hasError ? '' : undefined}
          data-disabled={disabled ? '' : undefined}
        >
          <span className={css.icon}>
            <Search size={16} aria-hidden="true" />
          </span>
          <Combobox.Input className={css.searchInput} placeholder={placeholder} />
          {clearable ? (
            <Combobox.Clear className={css.chipRemove} aria-label="Seçimi temizle">
              <X size={16} aria-hidden="true" />
            </Combobox.Clear>
          ) : null}
          <Combobox.Icon className={css.icon}>
            <ChevronDown size={16} aria-hidden="true" />
          </Combobox.Icon>
        </Combobox.InputGroup>

        <Combobox.Portal>
          <Combobox.Positioner className={css.positioner} sideOffset={4}>
            <Combobox.Popup className={css.popup}>
              {loading ? (
                <div className={css.empty}>
                  <Spinner size="sm" label="Seçenekler yükleniyor" />
                </div>
              ) : (
                <>
                  <Combobox.Empty className={css.empty}>Sonuç bulunamadı</Combobox.Empty>
                  <Combobox.List>
                    {(option: SelectOption) => (
                      <Combobox.Item
                        key={option.value}
                        value={option}
                        className={css.item}
                        disabled={option.disabled ?? false}
                      >
                        <OptionRow option={option} />
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                </>
              )}
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    )
  }

  return shell(
    <BaseSelect.Root
      value={value ?? null}
      {...(onValueChange !== undefined && {
        onValueChange: (next: string | null) => onValueChange(next ?? undefined),
      })}
      disabled={disabled}
      required={required}
    >
      <BaseSelect.Trigger
        className={css.trigger({ size })}
        data-invalid={hasError ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
      >
        <BaseSelect.Value className={css.value}>
          {selected?.label ?? <span className={css.placeholder}>{placeholder}</span>}
        </BaseSelect.Value>
        {loading ? <Spinner size="sm" label="Yükleniyor" /> : null}
        <BaseSelect.Icon className={css.icon}>
          <ChevronDown size={16} aria-hidden="true" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>

      <BaseSelect.Portal>
        <BaseSelect.Positioner className={css.positioner} sideOffset={4}>
          <BaseSelect.Popup className={css.popup}>
            {options.length === 0 ? (
              <div className={css.empty}>Seçenek yok</div>
            ) : (
              options.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  className={css.item}
                  disabled={option.disabled ?? false}
                >
                  <OptionRow option={option} />
                </BaseSelect.Item>
              ))
            )}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>,
  )
}
