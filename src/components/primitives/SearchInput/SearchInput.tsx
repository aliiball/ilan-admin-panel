import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Search, X } from 'lucide-react'
import { IconButton } from '../IconButton'
import { Input } from '../Input'
import type { SearchInputProps } from '../../../types/component-props'

/**
 * Arama kutusu: sol tarafta büyüteç, değer varken sağda temizleme butonu.
 *
 * `onSearch` geciktirilerek (debounce) çağrılır — kullanıcı her harfte değil,
 * yazmayı bıraktığında aranır. Bu, ilan listesi gibi büyük sorgularda gereksiz
 * istek yağmurunu engeller. `onChange` ise anında çalışır, kontrollü kullanımda
 * değeri o taşır.
 *
 * Temizleme butonu yalnızca değer varken görünür; boş kutuda yer kaplamaz.
 *
 * @example
 * <SearchInput label="İlan ara" onSearch={setSorgu} debounceMs={300} />
 */
export function SearchInput({
  onSearch,
  onClear,
  debounceMs = 300,
  value,
  defaultValue,
  onChange,
  ...rest
}: SearchInputProps) {
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(String(defaultValue ?? ''))
  const currentValue = isControlled ? String(value) : internalValue

  const inputRef = useRef<HTMLInputElement>(null)
  const onSearchRef = useRef(onSearch)
  onSearchRef.current = onSearch

  /**
   * Debounce'u ilk render'da tetiklemiyoruz: aksi hâlde sayfa açılır açılmaz
   * boş bir arama isteği giderdi.
   */
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }

    const timer = setTimeout(() => {
      onSearchRef.current?.(currentValue)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [currentValue, debounceMs])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalValue(event.target.value)
    }
    onChange?.(event)
  }

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue('')
    }
    onClear?.()
    inputRef.current?.focus()
  }

  return (
    <Input
      type="search"
      leadingIcon={<Search size={16} />}
      trailingAction={
        currentValue !== '' ? (
          <IconButton
            icon={<X size={16} />}
            label="Aramayı temizle"
            size="sm"
            variant="ghost"
            onClick={handleClear}
          />
        ) : undefined
      }
      ref={inputRef}
      onChange={handleChange}
      {...(isControlled ? { value } : { defaultValue })}
      {...rest}
    />
  )
}
