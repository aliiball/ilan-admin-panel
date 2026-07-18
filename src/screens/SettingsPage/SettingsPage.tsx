import { useState } from 'react'
import { ALL_ADMIN_PERMISSIONS, AdminRole, type AdminPermission } from '../../types/domain'
import { ConfirmDialog } from '../../components/composites/ConfirmDialog'
import { RolePermissionMatrix } from '../../components/composites/RolePermissionMatrix'
import { Button } from '../../components/primitives/Button'
import { RadioGroup } from '../../components/primitives/RadioGroup'
import { Switch } from '../../components/primitives/Switch'
import { Tabs } from '../../components/primitives/Tabs'
import type {
  RadioOption,
  SettingsPageProps,
  TabItem,
  ThemeName,
} from '../../types/component-props'
import * as css from './SettingsPage.css'

/**
 * Tema adları ve açıklamaları.
 *
 * **`domain/labels.ts`'te tema sözlüğü yok** ve bu turda eklenmedi (ekran
 * `src/domain/`'e yazmıyor). Şimdilik kural ihlali değil: `ThemeName` bir enum
 * değil, üç dizeden oluşan bir birleşim ve tek tüketicisi bu ekran —
 * `LOCATION_FIELD_LABEL`'ın gerekçesiyle birebir aynı durum. İkinci bir tüketici
 * çıkarsa (TopBar'a tema seçici gelirse) `THEME_LABEL` olarak taşınmalı.
 *
 * Adlar `.storybook/preview.tsx`'in tema toolbar'ıyla **birebir aynı**: aynı
 * paletin Storybook'ta "Kurumsal Mavi", ekranda başka bir ad taşıması kafa
 * karıştırırdı. Açıklamalar `tokens/themes.css.ts`'in kendi yorumlarından.
 *
 * `satisfies Record<ThemeName, …>` eksiksizliği derleme anında sınıyor: dördüncü
 * bir tema eklenip buraya yazılmazsa dosya derlenmez.
 */
const TEMA = {
  'corporate-blue': {
    label: 'Kurumsal Mavi',
    description: 'Varsayılan palet: mavi vurgu, nötr gri zeminler.',
  },
  'neutral-slate': {
    label: 'Nötr Slate',
    description: 'Mavi vurgu yerine gri tonlu, sakin bir palet.',
  },
  'warm-amber': {
    label: 'Sıcak Amber',
    description: 'Taş tonlu nötrler ve amber vurgu.',
  },
} as const satisfies Record<ThemeName, { label: string; description: string }>

/**
 * Seçenekler sözlükten **türetiliyor**, elle yazılmıyor: elle yazılmış bir liste
 * dördüncü tema eklendiğinde sessizce eksik kalırdı — `domain/categoryTree.ts`'in
 * `Object.values` ile türetme gerekçesinin aynısı.
 */
const TEMA_SECENEKLERI: RadioOption[] = Object.entries(TEMA).map(([value, tema]) => ({
  value,
  label: tema.label,
  description: tema.description,
}))

/**
 * `RadioGroupProps.onValueChange` `string` verir, `onThemeChange` `ThemeName`
 * ister. Kör bir `as ThemeName` cast'i sözleşmeyi tip düzeyinde delerdi; sözlüğün
 * kendisine sorulan bu daraltma delmez.
 */
function temaMi(value: string): value is ThemeName {
  return Object.hasOwn(TEMA, value)
}

/**
 * Sütun sırası — brifing 1.4 tablosunun kendi sırası.
 *
 * `Object.values` ile türetiliyor: elle yazılmış liste yeni bir `AdminRole`
 * eklendiğinde sessizce eksik kalır ve matris o rolü hiç göstermez.
 */
const ROL_SIRASI: AdminRole[] = Object.values(AdminRole)

/**
 * Satır sırası. Matrisin JSDoc'u sıranın çağıranın işi olduğunu ve konuya göre
 * gruplamanın "32 satırlık bir tabloyu okunur kılan tek şey" olduğunu söylüyor.
 *
 * `ALL_ADMIN_PERMISSIONS` **zaten konuya göre gruplu**: dashboard → ilan (13) →
 * kullanıcı (8) → kategori (2) → şikayet (4) → ayar/izin/tema (4) → audit.
 * Domain sabiti bu işi yaptığına göre elle ikinci bir sıra yazmak yalnız kopya
 * üretir ve 34'üncü izin eklendiğinde sessizce eksik kalır — sabiti geçmek hem
 * gruplamayı hem de eksiksizliği bedava veriyor. Kopya diziye alınıyor çünkü
 * sözleşme `readonly` değil `AdminPermission[]` istiyor.
 */
const IZIN_SIRASI: AdminPermission[] = [...ALL_ADMIN_PERMISSIONS]

const SEKME_ROLLER = 'roller'
const SEKME_GORUNUM = 'gorunum'

/**
 * Ayarlar ekranı — rol izin matrisi ve tema seçimi.
 *
 * Veri **prop'tan gelir, çekilmez**. Ekran bir kabuk değildir: `AppShell`,
 * `TopBar` ve `PageHeader` render edilmez, dolayısıyla sayfanın `<h1>`'i burada
 * yok ve en üst başlık seviyesi `<h2>`.
 *
 * **`ThemeSelector` yazılmadı — tema seçimi `RadioGroup` ile kuruldu.** Brifing
 * 2.9'un "türetilen componentler" listesi bir `ThemeSelector` sayıyor, ama
 * brifingin kendi yetkili katalogunda (3.3 primitive'ler + 3.4 composite'ler) öyle
 * bir component **yok** ve repoda da yok — 26 primitive ile 29 composite'in ikisi
 * de onu listelemiyor. Faz 3'ün kapsamı 11 ekran component'i; kataloğa yeni bir
 * component eklemek kapsam dışı. Üç seçenek, hepsi aynı anda görünmeli, biri
 * seçili: `RadioGroup`'un tanımı bu ("hepsinin aynı anda görünmesi gereken az
 * sayıda seçenek"). Dikkat: `RadioGroupProps`'ta `cards` diye bir varyant
 * **yoktur** — brifing 3.3'ün "Horizontal, vertical, cards" sütunu RadioGroup'un
 * kendi story'lerinin düzen listesi, bir prop değil. Seçeneklerin açıklamaları
 * `RadioOption.description` ile veriliyor.
 *
 * **`diff`in tabanı `savedRolePermissions`.** `rolePermissions` düzenlenmekte
 * olan taslak, `savedRolePermissions` sunucudaki kayıtlı hâl; ikisinin farkı
 * "kaydetmeden önce neyi değiştiriyorum" sorusunun cevabıdır. Verilmezse matris
 * `ROLE_PERMISSIONS`'a düşer ve diff "fabrika ayarından farkı" gösterir —
 * anlamlı ama **başka bir soru**, ve ilk kayıttan sonra yanlış cevap: superAdmin
 * bir izni kaydettiği an sunucunun gerçeği sabitten ayrılır, matris o günden
 * sonra hiçbir şey değişmemişken "değişmiş" hücreler gösterir. İpucu metni hangi
 * sorunun sorulduğunu prop'un varlığına göre söylüyor.
 *
 * **Yetki `disabled` ile anlatılmaz.** `permission:manage` izni olmayan
 * kullanıcıya kilitli matris değil `readOnly` matris veriliyor: brifing 2.9 rol
 * izin matrisini **görünen veri** sayıyor, kısıtladığı tek şey değiştirme
 * eylemi. Kilitli 128 kutuluk bir tarla "yetkin yok" ya da "bozuk" diye okunur;
 * salt okunur matris ise çalışan bir cevaptır — "bu rol ne yapabilir". Aynı
 * ilkenin tema tarafındaki karşılığı: `theme:setDefault` yoksa sistem varsayılanı
 * **kontrolü hiç render edilmez**, ama değeri okunur bir ad–değer çifti olarak
 * durur (yine brifing 2.9'un görünen verisi). Kaydet/Varsayılana dön çubuğu da
 * yalnız `canManagePermissions` ile görünür: kaydedilecek tek şey izin taslağı.
 *
 * **`saving` `disabled`'dan ayrı.** Sebebi geçici ve söylenebilir: kullanıcı
 * beklediğini bilmeli, yetkisini sorgulamamalı. Matrisin kendi `saving` prop'una
 * geçiyor.
 *
 * **Yerel state yalnız görünüm state'i**, veri değil: hangi sekme açık, diff
 * gözden geçiriliyor mu, onay dialog'u açık mı. Sözleşmede kanalları yok ve
 * olmamalı da — hiçbiri sunucuya sorulacak bir şey değil.
 *
 * **Kendi teması ve sistem varsayılanı anında uygulanır**, "Kaydet" beklemez:
 * `savedRolePermissions`'ın JSDoc'u `dirty`yi izin taslağının kayıtlıdan farkı
 * diye tanımlıyor, yani tema değişikliğini taşıyan bir kirlilik kanalı yok.
 * Anında uygulama bu sözleşmenin tek tutarlı okuması.
 *
 * **Kanalı olmayan brifing gereksinimleri** (uydurulmadı, raporlandı): 2.9'un
 * moderasyon tercihleri, ilan süreleri, sayfalama varsayılanları ve audit özeti
 * verileri; `loading`, `error`, `saved` ve `permissionConflict` ekran durumları.
 * `SettingsPageProps`'ta ne `state: AsyncState` ne de bunlara karşılık gelen bir
 * alan var. Brifing 2.9'un `Select`'i de bu yüzden yok: süreleri ve sayfalama
 * varsayılanlarını taşıyan prop olmadan seçtirecek bir şey yok.
 *
 * @example
 * <SettingsPage
 *   rolePermissions={taslak}
 *   savedRolePermissions={kayitli}
 *   currentTheme={tema}
 *   systemDefaultTheme={varsayilanTema}
 *   canManagePermissions={izinler.includes(AdminPermission.PermissionManage)}
 *   canManageDefaultTheme={izinler.includes(AdminPermission.ThemeSetDefault)}
 *   dirty={taslakKirli}
 *   onPermissionChange={izniDegistir}
 *   onThemeChange={setTema}
 *   onSystemDefaultThemeChange={setVarsayilanTema}
 *   onSave={kaydet}
 *   onReset={varsayilanaDon}
 * />
 */
export function SettingsPage({
  rolePermissions,
  savedRolePermissions,
  currentTheme,
  systemDefaultTheme,
  canManagePermissions,
  canManageDefaultTheme,
  saving = false,
  dirty = false,
  onPermissionChange,
  onThemeChange,
  onSystemDefaultThemeChange,
  onSave,
  onReset,
}: SettingsPageProps) {
  const [sekme, setSekme] = useState<string>(SEKME_ROLLER)
  const [gozdenGecir, setGozdenGecir] = useState(false)
  const [sifirlamaAcik, setSifirlamaAcik] = useState(false)

  /*
    Üç kapı sırayla: yetkisi yoksa salt okunur (kilitli değil), gözden geçirirken
    diff (matrisin JSDoc'u: "diff düzenlenemez — orada karar verilir, düzeltme
    için editable'a dönülür"), aksi halde düzenlenebilir.
  */
  const matrisVaryanti = !canManagePermissions ? 'readOnly' : gozdenGecir ? 'diff' : 'editable'

  /*
    İpucu, tabanın ne olduğunu prop'un varlığına göre söylüyor. İkisi farklı
    soru: "kaydetmeden önce neyi değiştiriyorum" ile "fabrika ayarından farkım
    ne". Hangisini sorduğunu kullanıcıdan saklamak diff'i okunmaz yapardı.
  */
  const gozdenGecirIpucu =
    savedRolePermissions !== undefined
      ? 'Açıkken taslağınız kayıtlı izinlerle karşılaştırılır; hücreler düzenlenemez.'
      : 'Açıkken taslağınız varsayılan izinlerle karşılaştırılır; hücreler düzenlenemez.'

  const rollerPaneli = (
    <div className={css.section}>
      <h2 className={css.heading}>Rol izinleri</h2>

      <p className={css.sectionDescription}>
        {canManagePermissions
          ? 'Her rolün hangi işlemi yapabileceğini buradan değiştirin. Değişiklikler siz kaydedene kadar uygulanmaz.'
          : 'Her rolün hangi işlemi yapabileceği. Değiştirmek için sistem yöneticisi yetkisi gerekir.'}
      </p>

      {canManagePermissions ? (
        <div className={css.reviewToggle}>
          <Switch
            checked={gozdenGecir}
            label="Değişiklikleri gözden geçir"
            /*
              Sarmalanıyor: Base UI onCheckedChange'e ikinci bir eventDetails
              argümanı geçiyor. `description` bilerek verilmiyor — anahtarın adına
              karışır; ipucu aşağıda kendi elementinde.
            */
            onCheckedChange={(next) => setGozdenGecir(next)}
          />
          <p className={css.reviewHint}>{gozdenGecirIpucu}</p>
        </div>
      ) : null}

      <RolePermissionMatrix
        roles={ROL_SIRASI}
        permissions={IZIN_SIRASI}
        value={rolePermissions}
        /*
          Koşullu spread: `exactOptionalPropertyTypes` açıkken `baseline={undefined}`
          yazmak TS2375 verir, üstelik "verilmedi" ile "undefined verildi" burada
          aynı şey — matris verilmeyince ROLE_PERMISSIONS'a düşüyor.
        */
        {...(savedRolePermissions !== undefined && { baseline: savedRolePermissions })}
        variant={matrisVaryanti}
        saving={saving}
        /* Yetkisi olmayana handler bağlanmaz: matris onsuz zaten salt okunura düşer. */
        {...(canManagePermissions && { onChange: onPermissionChange })}
      />
    </div>
  )

  const gorunumPaneli = (
    <div className={css.section}>
      <h2 className={css.heading}>Tema</h2>

      <div className={css.themeGroups}>
        <RadioGroup
          label="Kendi temam"
          helperText="Yalnız sizin oturumunuzu etkiler. Seçim hemen uygulanır, kaydetmeye gerek yoktur."
          value={currentTheme}
          options={TEMA_SECENEKLERI}
          /* Daraltma cast değil: sözlükte olmayan bir değer handler'a hiç ulaşmaz. */
          onValueChange={(next) => {
            if (temaMi(next)) onThemeChange(next)
          }}
        />

        {canManageDefaultTheme ? (
          <RadioGroup
            label="Sistem varsayılan teması"
            helperText="Kendi temasını seçmemiş adminler bunu görür. Seçim hemen uygulanır."
            value={systemDefaultTheme}
            options={TEMA_SECENEKLERI}
            onValueChange={(next) => {
              if (temaMi(next)) onSystemDefaultThemeChange(next)
            }}
          />
        ) : (
          /*
            Kilitli bir radyo grubu değil, okunur bir değer: brifing 2.9 sistem
            varsayılanını görünen veri sayıyor, yalnız değiştirmeyi superAdmin'e
            bırakıyor. Kilitli kontrol "yetkin yok"u anlatmanın yanlış yolu.
          */
          <dl className={css.fact}>
            <dt className={css.factTerm}>Sistem varsayılan teması</dt>
            <dd className={css.factValue}>{TEMA[systemDefaultTheme].label}</dd>
          </dl>
        )}
      </div>
    </div>
  )

  const sekmeler: TabItem[] = [
    { id: SEKME_ROLLER, label: 'Roller', content: rollerPaneli },
    { id: SEKME_GORUNUM, label: 'Görünüm', content: gorunumPaneli },
  ]

  return (
    <div className={css.root}>
      {/* Sekme etiketleri kısa, panel başlıkları açıklayıcı: "Roller" → "Rol izinleri". */}
      <Tabs value={sekme} items={sekmeler} onValueChange={(next) => setSekme(next)} />

      {canManagePermissions ? (
        <>
          {/*
            Çubuk sekmelerin dışında: taslağı düzenleyip Görünüm sekmesine geçen
            kullanıcının Kaydet'i kaybolmamalı.
          */}
          <div className={css.actions}>
            <p className={css.dirtyNote}>
              {dirty ? 'Kaydedilmemiş değişiklikler var.' : 'Kaydedilmemiş değişiklik yok.'}
            </p>

            <div className={css.actionButtons}>
              <Button variant="secondary" disabled={saving} onClick={() => setSifirlamaAcik(true)}>
                Varsayılana dön
              </Button>
              {/*
                `disabled` yetki değil "şu an yapılamaz" anlatıyor: kaydedilecek
                bir fark yokken Kaydet sonuçsuz kalırdı.
              */}
              <Button variant="primary" loading={saving} disabled={!dirty} onClick={onSave}>
                Kaydet
              </Button>
            </div>
          </div>

          {/*
            Varsayılana dönme geri alınamaz, bu yüzden onaydan geçiyor. `requireText`
            verilmedi: metin yazdırmak "tek tıkla dönülemeyecek" toplu silme içindir,
            burada kayıp taslakla sınırlı. Dialog'u kapatmak çağıranın işi — hata
            kanalı olmadığı için onayla birlikte kapanıyor.
          */}
          <ConfirmDialog
            open={sifirlamaAcik}
            tone="danger"
            title="Rol izinlerini varsayılana döndür"
            description="Bütün roller fabrika ayarındaki izinlerine döner ve kaydedilmemiş değişiklikleriniz kaybolur. Bu işlem geri alınamaz."
            confirmLabel="Varsayılana dön"
            onConfirm={() => {
              onReset()
              setSifirlamaAcik(false)
            }}
            onCancel={() => setSifirlamaAcik(false)}
          />
        </>
      ) : null}
    </div>
  )
}
