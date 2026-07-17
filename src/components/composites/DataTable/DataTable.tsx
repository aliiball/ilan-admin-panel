import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { Checkbox } from '../../primitives/Checkbox'
import { Skeleton } from '../../primitives/Skeleton'
import { Spinner } from '../../primitives/Spinner'
import { ErrorState } from '../ErrorState'
import type { ColumnDef, DataTableProps } from '../../../types/component-props'
import * as css from './DataTable.css'

/**
 * Sıralama, seçim ve yoğun veri gösterimi.
 *
 * Generic'tir ve satır tipini korur: `DataTable<Listing>` içinde `cell` fonksiyonu
 * `Listing` alır, `unknown` değil — brifingin "generic DataTable satır tipini
 * korumalıdır" kriteri budur.
 *
 * `mobileMode` dar ekranda ne olacağını belirler:
 * - `scroll`: tablo yatay kaydırılır. Sütunlar önemliyse (audit log) uygundur.
 * - `cards`: her satır karta dönüşür. Okunabilirlik önemliyse (ilan listesi) uygundur;
 *   `renderMobileCard` ile satırın kart görünümü verilir.
 *
 * Sıralanabilir başlıklar `<button>`'dır — `<th onClick>` klavyeyle erişilemez.
 *
 * Veri çekmez: satırlar `rows` prop'undan gelir.
 *
 * @example
 * <DataTable<Listing> rows={ilanlar} columns={sutunlar} selectable onSelectionChange={setSecili} />
 */
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  rowKey,
  rowLabel,
  density = 'comfortable',
  visualStyle = 'plain',
  mobileMode = 'scroll',
  loading = false,
  error,
  onRetry,
  emptyState,
  selectable = false,
  selectedIds = [],
  sort,
  stickyHeader = false,
  onSelectionChange,
  onSortChange,
  onRowClick,
  renderMobileCard,
}: DataTableProps<T>) {
  const anahtar = (row: T) => rowKey?.(row) ?? row.id
  const sutunSayisi = columns.length + (selectable ? 1 : 0)

  const tumuSecili = rows.length > 0 && rows.every((r) => selectedIds.includes(anahtar(r)))
  const bazisiSecili = rows.some((r) => selectedIds.includes(anahtar(r))) && !tumuSecili

  const tumunuSec = (secili: boolean) => {
    onSelectionChange?.(secili ? rows.map(anahtar) : [])
  }

  const satirSec = (id: string, secili: boolean) => {
    onSelectionChange?.(secili ? [...selectedIds, id] : selectedIds.filter((x) => x !== id))
  }

  const siralamayiDegistir = (sutun: ColumnDef<T>) => {
    if (sutun.sortable !== true) return
    const yon = sort?.columnId === sutun.id && sort.direction === 'asc' ? 'desc' : 'asc'
    onSortChange?.({ columnId: sutun.id, direction: yon })
  }

  const hucreIcerigi = (row: T, sutun: ColumnDef<T>) => {
    if (sutun.cell !== undefined) return sutun.cell(row)
    if (sutun.accessor !== undefined) return String(row[sutun.accessor] ?? '')
    return null
  }

  /* ── Durum blokları: veri yerine ne gösterileceği ── */

  if (error !== undefined) {
    return (
      <div className={css.wrapper({ visualStyle })}>
        <div className={css.stateBlock}>
          {/*
            Hata bloğu elle çizilmiyor, `ErrorState`'e veriliyor: eskiden burada
            `<strong>` + iki `<span>`'lik bir kopya vardı ve `onRetry` kanalı
            eklenince o kopyanın butonu, odak halkasını ve `role="alert"`'ü de
            yeniden üretmesi gerekecekti — `ErrorState`'in zaten yaptığı işi
            ikinci kez, sapma riskiyle. Kopya ayrıca ham renk taşıyordu
            (`style={{ color: 'var(--color-text-muted)' }}`).

            `section`: tablo düştü, sayfanın kalanı ayakta.
          */}
          <ErrorState
            variant="section"
            title={error.title}
            description={error.message}
            {...(error.code !== undefined && { code: error.code })}
            {...(error.retryable && onRetry !== undefined && { onRetry })}
          />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={css.wrapper({ visualStyle })} aria-busy="true">
        {/*
          Yükleme hâlinde de `tabIndex={0}`: iskelet satırlarda hiçbir kontrol
          yok, yani kap tam da burada klavyeye kapalı kalırdı. Gerekçe aşağıdaki
          tablo dalında ve Drawer.tsx'te.
        */}
        <div className={css.scroller} tabIndex={0}>
          <table className={css.table}>
            {/* Başlık korunur, satırlar skeleton olur: veri gelince düzen zıplamaz. */}
            <thead className={css.thead({ sticky: stickyHeader })}>
              <tr>
                {selectable ? (
                  <th className={`${css.th({ density })} ${css.selectionCell}`} />
                ) : null}
                {columns.map((sutun) => (
                  <th
                    key={sutun.id}
                    className={css.th({ density, align: sutun.align ?? 'start' })}
                    style={sutun.width !== undefined ? { width: sutun.width } : undefined}
                  >
                    {sutun.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }, (_, i) => (
                <tr key={i} className={css.tr({ striped: visualStyle === 'striped' })}>
                  {Array.from({ length: sutunSayisi }, (_, j) => (
                    <td key={j} className={css.td({ density })}>
                      <Skeleton variant="text" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
          <Spinner size="sm" label="Veriler yükleniyor" />
        </span>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className={css.wrapper({ visualStyle })}>
        <div className={css.stateBlock}>{emptyState ?? <span>Kayıt bulunamadı</span>}</div>
      </div>
    )
  }

  /* ── Mobil kart görünümü ── */

  if (mobileMode === 'cards' && renderMobileCard !== undefined) {
    return (
      <div className={css.cards}>
        {rows.map((row) => {
          const id = anahtar(row)
          const secili = selectedIds.includes(id)
          return (
            <div key={id} className={css.cardRow} data-selected={secili ? '' : undefined}>
              {renderMobileCard(row)}
            </div>
          )
        })}
      </div>
    )
  }

  /* ── Tablo ── */

  return (
    <div className={css.wrapper({ visualStyle })}>
      {/*
        `tabIndex={0}`: tablo dar ekranda yatay kaydırılır. Seçilebilir veya
        linkli tabloda kutular/linkler kabı klavyeye açıyordu, ama salt okunur
        bir tabloda (PromotionFlagsPanel'in özet tablosu) içeride odaklanılacak
        hiçbir şey yok ve sütunların yarısı fare olmadan görülemiyordu.
        Gerekçenin uzunu Drawer.tsx'te.
      */}
      <div className={css.scroller} tabIndex={0}>
        <table className={css.table}>
          <thead className={css.thead({ sticky: stickyHeader })}>
            <tr>
              {selectable ? (
                <th className={`${css.th({ density })} ${css.selectionCell}`}>
                  {/*
                    Etiket gizli: görünürse her satırda tekrar eder, yatay alan
                    yer ve tabloyu okunmaz hale getirir. Ama kaldırılamaz —
                    ekran okuyucu kullanıcısı kutunun neyi seçtiğini ondan öğrenir.
                  */}
                  <Checkbox
                    label={`Tümünü seç (${rows.length} kayıt)`}
                    hideLabel
                    checked={tumuSecili}
                    indeterminate={bazisiSecili}
                    onCheckedChange={tumunuSec}
                  />
                </th>
              ) : null}

              {columns.map((sutun) => {
                const sirali = sort?.columnId === sutun.id
                const SiralamaIkonu = !sirali
                  ? ChevronsUpDown
                  : sort.direction === 'asc'
                    ? ArrowUp
                    : ArrowDown

                return (
                  <th
                    key={sutun.id}
                    className={css.th({ density, align: sutun.align ?? 'start' })}
                    style={sutun.width !== undefined ? { width: sutun.width } : undefined}
                    data-sorted={sirali ? '' : undefined}
                    aria-sort={
                      sirali ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined
                    }
                  >
                    {sutun.sortable === true ? (
                      <button
                        type="button"
                        className={css.sortButton}
                        onClick={() => siralamayiDegistir(sutun)}
                      >
                        {sutun.header}
                        <SiralamaIkonu size={14} className={css.sortIcon} aria-hidden="true" />
                      </button>
                    ) : (
                      sutun.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => {
              const id = anahtar(row)
              const secili = selectedIds.includes(id)

              return (
                <tr
                  key={id}
                  className={css.tr({ striped: visualStyle === 'striped' })}
                  data-selected={secili ? '' : undefined}
                  data-clickable={onRowClick !== undefined ? '' : undefined}
                  onClick={onRowClick !== undefined ? () => onRowClick(row) : undefined}
                >
                  {selectable ? (
                    <td
                      className={`${css.td({ density })} ${css.selectionCell}`}
                      /* Seçim kutusuna tıklamak satır tıklamasını tetiklemesin. */
                      onClick={(event) => event.stopPropagation()}
                    >
                      {/*
                        Etiket satırı tanımlar, "Satırı seç" demez: ekran okuyucu
                        kullanıcısı 12 kez aynı metni duyarsa hangisini seçtiğini
                        anlamaz. Ayırt edici metin `rowLabel` ile verilir; yoksa
                        satır numarasına düşülür.
                      */}
                      <Checkbox
                        label={rowLabel?.(row) ?? `${index + 1}. satırı seç`}
                        hideLabel
                        checked={secili}
                        onCheckedChange={(next) => satirSec(id, next)}
                      />
                    </td>
                  ) : null}

                  {columns.map((sutun) => (
                    <td
                      key={sutun.id}
                      className={css.td({ density, align: sutun.align ?? 'start' })}
                    >
                      {hucreIcerigi(row, sutun)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
