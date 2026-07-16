import { Combobox } from '@base-ui/react/combobox'
import { Check, ChevronDown, X } from 'lucide-react'
import { FieldShell } from '../../internal/FieldShell'
import { Spinner } from '../Spinner'
import type { MultiSelectProps, SelectOption } from '../../../types/component-props'
import * as css from '../../internal/listbox.css'

/**
 * Çoklu seçim. İlan listesinde durum, kategori ve promosyon filtreleri için.
 *
 * Seçilenler çip olarak kutunun içinde görünür; her çip tek tek kaldırılabilir.
 * `maxVisibleTags` ile çip sayısı sınırlanır, fazlası "+3" şeklinde özetlenir —
 * aksi hâlde çok seçim yapıldığında kutu sayfayı aşağı iter.
 *
 * Tek seçim için `Select` kullanın.
 *
 * @example
 * <MultiSelect label="Durum" options={durumlar} values={secili} onValuesChange={setSecili} />
 */
export function MultiSelect({
  values,
  options,
  placeholder = 'Seçin',
  size = 'md',
  disabled = false,
  searchable = true,
  loading = false,
  maxVisibleTags,
  onValuesChange,
  label,
  helperText,
  error,
  required = false,
}: MultiSelectProps) {
  const hasError = error !== undefined && error !== ''
  const selectedOptions = options.filter((option) => values.includes(option.value))

  const visible =
    maxVisibleTags !== undefined ? selectedOptions.slice(0, maxVisibleTags) : selectedOptions
  const hiddenCount = selectedOptions.length - visible.length

  return (
    <FieldShell
      {...(label !== undefined && { label })}
      {...(helperText !== undefined && { helperText })}
      {...(error !== undefined && { error })}
      required={required}
      disabled={disabled}
    >
      <Combobox.Root
        multiple
        items={options}
        value={selectedOptions}
        itemToStringLabel={(item: SelectOption) => item.label}
        disabled={disabled}
        {...(onValuesChange !== undefined && {
          onValueChange: (next: SelectOption[]) => onValuesChange(next.map((item) => item.value)),
        })}
      >
        <Combobox.Chips
          className={css.trigger({ size })}
          data-invalid={hasError ? '' : undefined}
          data-disabled={disabled ? '' : undefined}
        >
          <span className={css.chips}>
            {visible.map((option) => (
              <Combobox.Chip key={option.value} className={css.chip}>
                {option.label}
                <Combobox.ChipRemove
                  className={css.chipRemove}
                  aria-label={`${option.label} seçimini kaldır`}
                >
                  <X size={12} aria-hidden="true" />
                </Combobox.ChipRemove>
              </Combobox.Chip>
            ))}

            {hiddenCount > 0 ? <span className={css.overflowCount}>+{hiddenCount}</span> : null}

            <Combobox.Input
              className={css.searchInput}
              placeholder={selectedOptions.length === 0 ? placeholder : ''}
              readOnly={!searchable}
            />
          </span>

          {loading ? <Spinner size="sm" label="Yükleniyor" /> : null}
          <Combobox.Icon className={css.icon}>
            <ChevronDown size={16} aria-hidden="true" />
          </Combobox.Icon>
        </Combobox.Chips>

        <Combobox.Portal>
          <Combobox.Positioner className={css.positioner} sideOffset={4}>
            <Combobox.Popup className={css.popup}>
              <Combobox.Empty className={css.empty}>Sonuç bulunamadı</Combobox.Empty>
              <Combobox.List>
                {(option: SelectOption) => (
                  <Combobox.Item
                    key={option.value}
                    value={option}
                    className={css.item}
                    disabled={option.disabled ?? false}
                  >
                    <span className={css.itemText}>
                      <span>{option.label}</span>
                      {option.description !== undefined ? (
                        <span className={css.itemDescription}>{option.description}</span>
                      ) : null}
                    </span>
                    <Combobox.ItemIndicator className={css.itemIndicator}>
                      <Check size={16} aria-hidden="true" />
                    </Combobox.ItemIndicator>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </FieldShell>
  )
}
