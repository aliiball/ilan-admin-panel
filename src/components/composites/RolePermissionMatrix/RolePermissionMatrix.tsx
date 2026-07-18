import type { ReactNode } from 'react'
import { Check, CircleMinus, CirclePlus, Minus } from 'lucide-react'
import { ROLE_PERMISSIONS, type AdminPermission } from '../../../types/domain'
import { ADMIN_PERMISSION_LABEL, ADMIN_ROLE_LABEL } from '../../../domain/labels'
import { Checkbox } from '../../primitives/Checkbox'
import { Spinner } from '../../primitives/Spinner'
import type { RolePermissionMatrixProps } from '../../../types/component-props'
import * as css from './RolePermissionMatrix.css'

/** Hücrenin tabana (`baseline`) göre okunuşu. */
type HucreDurumu = 'granted' | 'denied' | 'added' | 'removed'

interface HucreSunumu {
  icon: ReactNode
  /** Ekran okuyucuya okunan hücre içeriği; işaret görsel, bu metin değil. */
  text: string
  /** `cell` recipe'inin zemin varyantı. */
  change: 'unchanged' | 'added' | 'removed'
}

const HUCRE_SUNUMU = {
  granted: {
    icon: <Check size={18} strokeWidth={3} aria-hidden="true" />,
    text: 'Var',
    change: 'unchanged',
  },
  denied: {
    icon: <Minus size={18} aria-hidden="true" />,
    text: 'Yok',
    change: 'unchanged',
  },
  added: {
    icon: <CirclePlus size={18} aria-hidden="true" />,
    text: 'Var (eklendi)',
    change: 'added',
  },
  removed: {
    icon: <CircleMinus size={18} aria-hidden="true" />,
    text: 'Yok (kaldırıldı)',
    change: 'removed',
  },
} as const satisfies Record<HucreDurumu, HucreSunumu>

/**
 * Hücreyi tabandaki karşılığıyla kıyaslar.
 *
 * Taban `baseline`'dan gelir; verilmezse `ROLE_PERMISSIONS`'a düşer (Faz 2'nin
 * davranışı, geriye dönük uyum için korundu).
 */
function hucreDurumu(
  taban: readonly AdminPermission[],
  permission: AdminPermission,
  isaretli: boolean,
): HucreDurumu {
  if (taban.includes(permission) === isaretli) return isaretli ? 'granted' : 'denied'
  return isaretli ? 'added' : 'removed'
}

/**
 * Rol × izin matrisi — brifing 1.4 yetki tablosunun ekrandaki hâli.
 *
 * **Satır izin, sütun rol.** 33 izin dört role karşı geliyor ve ters çevrilmiş
 * hâli (33 sütun) hiçbir ekrana sığmaz: başlıklar döndürülür ya da kırpılır,
 * ikisi de okunmaz. Bu yönde izin etiketi bir cümle uzunluğunda olabilir
 * ("Kullanıcı bilgisi düzenleme (sınırlı: ad, e-posta, telefon…)") ve satır
 * başlığı sarabildiği için sorun çıkarmaz. Yön ayrıca brifing 1.4'ün kendi
 * tablosuyla birebir: ekran şartnameyle satır satır karşılaştırılabilir kalır.
 *
 * **Her kutunun erişilebilir adı "rol + izin".** Ekranda 128 kutu var ve hepsi
 * "Seç" deseydi ekran okuyucu kullanıcısı hangisinde olduğunu ayırt edemezdi —
 * DataTable'ın her satırda "Satırı seç" okutan sapmasının aynısı, 32 katı. Ad
 * `hideLabel` ile gizleniyor (`clip`, `visibility` değil: `visibility: hidden`
 * adı erişilebilirlik ağacından siler).
 *
 * **`readOnly` kutu göstermez, işaret gösterir.** Devre dışı bırakılmış 128
 * kutuluk bir tarla "yetkin yok" ya da "bozuk" diye okunur; oysa salt okunur
 * matris çalışan bir cevaptır: "bu rol ne yapabilir". Onun yerine ikon artı
 * gizli metin ("Var" / "Yok") — renk tek başına durum taşımaz.
 *
 * **`diff`'in tabanını `baseline` söyler** (Faz 3'te eklendi); verilmezse
 * `ROLE_PERMISSIONS`'a düşer. Faz 2'de taban domain sabitine **gömülüydü** ve bu
 * yalnız kayıtlı izinler sabitle aynı kaldığı sürece doğruydu: `superAdmin` bir
 * izni kaydettiği an sunucunun gerçeği sabitten ayrılır ve matris o günden sonra
 * hiçbir şey değişmemişken "değişmiş" hücreler gösterirdi. Ayarlar ekranı artık
 * **kayıtlı** hâli taban veriyor, dolayısıyla diff "kaydetmeden önce neyi
 * değiştiriyorum" sorusunu cevaplıyor. `diff` düzenlenemez: orada karar verilir,
 * düzeltme için `editable`'a dönülür.
 *
 * **`disabled` yetki anlatmaz.** `permission:manage` izni olmayan kullanıcıya
 * kilitli matris değil `readOnly` matris verilir, ya da sayfa hiç render
 * edilmez. `saving` ayrı bir prop çünkü sebebi geçici ve söylenebilir: kullanıcı
 * beklediğini bilmeli, yetkisini sorgulamamalı.
 *
 * `onChange` verilmezse `editable` istense bile salt okunur davranır — sonuçsuz
 * kutu sunmanın anlamı yok. Gösterilecek satır ya da sütun yoksa hiç render
 * edilmez; "izin yok" mesajı sayfanın EmptyState'inin işi.
 *
 * @example
 * <RolePermissionMatrix
 *   roles={Object.values(AdminRole)}
 *   permissions={ALL_ADMIN_PERMISSIONS}
 *   value={taslakIzinler}
 *   onChange={(role, permission, enabled) => izniDegistir(role, permission, enabled)}
 * />
 */
export function RolePermissionMatrix({
  roles,
  permissions,
  value,
  baseline = ROLE_PERMISSIONS,
  variant = 'editable',
  disabled = false,
  saving = false,
  onChange,
}: RolePermissionMatrixProps) {
  if (roles.length === 0 || permissions.length === 0) return null

  /** Sonuçsuz kutu sunma: handler yoksa `editable` isteği salt okunura düşer. */
  const etkinVaryant = variant === 'editable' && onChange === undefined ? 'readOnly' : variant
  const kilitli = disabled || saving

  const degisenSayisi =
    etkinVaryant === 'diff'
      ? permissions.reduce(
          (toplam, permission) =>
            toplam +
            roles.filter((role) => {
              const durum = hucreDurumu(
                baseline[role],
                permission,
                value[role].includes(permission),
              )
              return durum === 'added' || durum === 'removed'
            }).length,
          0,
        )
      : 0

  /*
    Tablonun erişilebilir adı ve boyutu. Görsel kullanıcı sütun başlıklarını
    tek bakışta sayar; ekran okuyucu kullanıcısı matrise girmeden önce neyle
    karşılaşacağını yalnız buradan öğrenir.
  */
  const captionMetni =
    `Rol ve izin matrisi: ${permissions.length} izin satırı, ${roles.length} rol sütunu. ` +
    (etkinVaryant === 'editable'
      ? 'Her hücre işaretlenebilir bir kutudur.'
      : etkinVaryant === 'readOnly'
        ? 'Salt okunur.'
        : `Salt okunur; ${degisenSayisi} hücre önceki hâlinden farklı.`)

  return (
    <div className={css.root}>
      {etkinVaryant === 'diff' ? (
        <div className={css.diffBar}>
          <span className={css.diffCount}>
            {/*
              "Önceki hâli" bilerek belirsiz: tabanı `baseline` söylüyor ve ne
              olduğunu yalnız çağıran bilir — ayarlar ekranı **kayıtlı** izinleri
              veriyor, verilmeyen çağıranda taban `ROLE_PERMISSIONS`'a düşüyor.
              Faz 2'de burada "varsayılan izinlerden farklı" yazıyordu; `baseline`
              eklenince o cümle kayıtlı hâle göre kıyaslarken "varsayılan" demeye
              devam ediyordu — yani ekrandaki tek görünür açıklama yalan
              söylüyordu. Tabanı adlandırmak çağıranın işi (SettingsPage matrisin
              üstünde hangi soruyu sorduğunu yazıyor).
            */}
            {degisenSayisi === 0
              ? 'Önceki hâline göre değişiklik yok'
              : `${degisenSayisi.toLocaleString('tr-TR')} hücre önceki hâlinden farklı`}
          </span>

          <ul className={css.legend}>
            <li className={css.legendItem}>
              <span className={css.mark({ state: 'added' })}>{HUCRE_SUNUMU.added.icon}</span>
              İzin verildi
            </li>
            <li className={css.legendItem}>
              <span className={css.mark({ state: 'removed' })}>{HUCRE_SUNUMU.removed.icon}</span>
              İzin kaldırıldı
            </li>
          </ul>
        </div>
      ) : null}

      {saving ? (
        <p className={css.savingBar}>
          {/* Spinner'ın kendi `role="status"`'ü duyuruyu yapar; görünür metin onu tekrarlamasın. */}
          <Spinner size="sm" label="İzinler kaydediliyor" />
          <span aria-hidden="true">İzinler kaydediliyor…</span>
        </p>
      ) : null}

      {/*
        `tabIndex={0}`: matris dar ekranda yatay kaydırılır ve `readOnly`'de
        içinde **hiç** odaklanılabilir öğe yoktur — kutular okunur rozete
        dönüşür. Düzenleme modunda kutular kabı klavyeye zaten açıyordu, salt
        okunur modda tablo yalnız fareyle kaydırılabiliyordu: aynı component,
        yetkisi olmayan kullanıcı için erişilemez. Gerekçenin uzunu Drawer.tsx'te.
      */}
      <div className={css.scroller} tabIndex={0}>
        <table className={css.table} aria-busy={saving}>
          <caption className={css.visuallyHidden}>{captionMetni}</caption>

          <thead>
            <tr>
              {/* Köşe hücresi: altındaki satır başlıkları sütununu adlandırır, o yüzden `col`. */}
              <th scope="col" className={css.cornerHeader}>
                İzin
              </th>

              {roles.map((role) => (
                <th key={role} scope="col" className={css.roleHeader}>
                  {ADMIN_ROLE_LABEL[role]}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {permissions.map((permission) => (
              <tr key={permission}>
                <th scope="row" className={css.permissionHeader}>
                  {ADMIN_PERMISSION_LABEL[permission]}
                </th>

                {roles.map((role) => {
                  const isaretli = value[role].includes(permission)

                  if (etkinVaryant === 'editable') {
                    return (
                      <td key={role} className={css.cell({ change: 'unchanged' })}>
                        <Checkbox
                          /*
                            Ad hem rolü hem izni söyler. Gizli, çünkü görünseydi
                            her hücrede tekrar edip tabloyu okunmaz yapardı —
                            ama kaldırılamaz: sütun başlığına güvenmek, kutuya
                            klavyeyle doğrudan gelen kullanıcıyı bağlamsız bırakır.
                          */
                          label={`${ADMIN_ROLE_LABEL[role]} — ${ADMIN_PERMISSION_LABEL[permission]}`}
                          hideLabel
                          checked={isaretli}
                          disabled={kilitli}
                          // Sarmalanıyor: Base UI onCheckedChange'e ikinci bir
                          // eventDetails argümanı geçiyor, sözleşme üç argümanlı.
                          onCheckedChange={(next) => onChange?.(role, permission, next)}
                        />
                      </td>
                    )
                  }

                  const gosterim: HucreDurumu =
                    etkinVaryant === 'diff'
                      ? hucreDurumu(baseline[role], permission, isaretli)
                      : isaretli
                        ? 'granted'
                        : 'denied'
                  const sunum = HUCRE_SUNUMU[gosterim]

                  return (
                    <td key={role} className={css.cell({ change: sunum.change })}>
                      <span className={css.mark({ state: gosterim })}>
                        {sunum.icon}
                        <span className={css.visuallyHidden}>{sunum.text}</span>
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
