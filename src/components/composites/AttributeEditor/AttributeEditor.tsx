import { useId, type FormEvent, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import {
  AttributeDataType,
  type AttributeOption,
  type AttributeValidation,
  type CategoryAttributeDefinition,
} from '../../../types/domain'
import {
  ATTRIBUTE_DATA_TYPE_LABEL,
  LISTING_CATEGORY_LABEL,
  LISTING_SUB_CATEGORY_LABEL,
  TRANSACTION_TYPE_LABEL,
} from '../../../domain/labels'
import { formatDateTime } from '../../../utils/formatDateTime'
import { Badge } from '../../primitives/Badge'
import { Button } from '../../primitives/Button'
import { Checkbox } from '../../primitives/Checkbox'
import { IconButton } from '../../primitives/IconButton'
import { Input } from '../../primitives/Input'
import { NumberInput } from '../../primitives/NumberInput'
import { Select } from '../../primitives/Select'
import { Textarea } from '../../primitives/Textarea'
import type { AttributeEditorProps, SelectOption } from '../../../types/component-props'
import * as css from './AttributeEditor.css'

const VERI_TIPLERI = Object.values(AttributeDataType)

/** Etiketler domain'den; enum değeri (`singleSelect`) hiçbir ekranda gösterilemez. */
const VERI_TIPI_SECENEKLERI: SelectOption[] = VERI_TIPLERI.map((tip) => ({
  value: tip,
  label: ATTRIBUTE_DATA_TYPE_LABEL[tip],
}))

/** Seçenek listesi yalnız bu iki tipte anlamlı: metin alanının "seçeneği" olmaz. */
const secenekliMi = (tip: AttributeDataType | undefined): boolean =>
  tip === AttributeDataType.SingleSelect || tip === AttributeDataType.MultiSelect

/** Alt/üst sınır yalnız sayısal tiplerde anlamlı: "en az" bir Evet/Hayır'da yoktur. */
const sayisalMi = (tip: AttributeDataType | undefined): boolean =>
  tip === AttributeDataType.Number || tip === AttributeDataType.Money

/** Uzunluk ve desen yalnız serbest metinde anlamlı. */
const metinselMi = (tip: AttributeDataType | undefined): boolean => tip === AttributeDataType.Text

type BayrakAlani = 'required' | 'filterable' | 'visibleInList' | 'active'

/**
 * Dört ikili bayrak. Açıklamaları etikete sığmayan **sonucu** anlatıyor:
 * "Zorunlu" bir sıfat, "ilan sahibi bu alanı doldurmadan ilanı gönderemez" ise
 * kutunun ne yaptığı. İkisi de gerekli — biri seçtirir, öbürü sonucu gösterir.
 *
 * Her bayrak yamasını **kendi yazıyor** (`yaz`), tek bir `{ [alan]: next }`
 * yerine. Sebep ölçüldü: hesaplanmış anahtarın tipi bir birleşim olduğunda TS
 * değeri **hiç denetlemiyor** — `{ [alan]: 'metin' }` `Partial<...>`'a sessizce
 * geçiyor, ara bir `Partial<Record<BayrakAlani, boolean>>` tipiyle bile. Dört
 * küçük fonksiyon, dört alanın tipini geri kazandırıyor: yanlış alana yanlış
 * tip yazan `yaz` derlenmez (TS2322).
 */
const BAYRAKLAR: readonly {
  alan: BayrakAlani
  label: string
  description: string
  yaz: (next: boolean) => Partial<CategoryAttributeDefinition>
}[] = [
  {
    alan: 'required',
    label: 'Zorunlu',
    description: 'İlan sahibi bu alanı doldurmadan ilanı gönderemez.',
    yaz: (next) => ({ required: next }),
  },
  {
    alan: 'filterable',
    label: 'Filtrelenebilir',
    description: 'Arama ekranında bu özniteliğe göre filtre kutusu çıkar.',
    yaz: (next) => ({ filterable: next }),
  },
  {
    alan: 'visibleInList',
    label: 'Liste ekranında görünür',
    description: 'İlan kartında ve arama sonuçlarında değeri gösterilir.',
    yaz: (next) => ({ visibleInList: next }),
  },
  {
    alan: 'active',
    label: 'Aktif',
    description: 'Pasif öznitelik yeni ilanlarda sorulmaz; mevcut değerler silinmez.',
    yaz: (next) => ({ active: next }),
  },
]

/** Boş alanı sessizce atlamak yerine açıkça söyler: "yok" da bir bilgidir. */
function Bos() {
  return <span className={css.emptyValue}>Belirtilmedi</span>
}

function OkunurSatir({ terim, children }: { terim: string; children: ReactNode }) {
  return (
    <div className={css.readOnlyRow}>
      <dt className={css.readOnlyTerm}>{terim}</dt>
      <dd className={css.readOnlyValue}>{children}</dd>
    </div>
  )
}

/**
 * Özniteliğin kapsamı: hangi kategorinin, hangi alt kategorilerinin ve hangi
 * işlem türlerinin ilanlarında sorulacağı.
 *
 * **Okunur, düzenlenemez** — her üç modda da. İki sebebi var: kapsamı seçen
 * `CategoryTree`'dir (brifing 2.7'nin ayrı bir eylemi: "kategori düğümü
 * seçme"), ve alt kategori seçeneklerini kategoriye göre süzmek bir **iş
 * kuralı** — `domain/`'de böyle bir eşleme henüz yok. Onu buraya gömmek, altı
 * enum'un hangi kategoriye ait olduğunu görünüm katmanına saklardı; süzülmemiş
 * bir liste ise "Arsa" özniteliğine "Daire" seçtirirdi.
 */
function Kapsam({ value }: { value: Partial<CategoryAttributeDefinition> }) {
  const altKategoriler = value.appliesToSubCategories ?? []
  const islemTurleri = value.appliesToTransactionTypes ?? []

  return (
    <div className={css.scope}>
      <p className={css.sectionTitle}>Kapsam</p>
      <p className={css.note}>
        Kategori ağacından gelir; öznitelik seçili düğüme bağlıdır. Değiştirmek için ağaçtan başka
        bir düğüm seçin.
      </p>

      <div className={css.badgeRow}>
        {value.category !== undefined ? (
          <Badge tone="primary">{LISTING_CATEGORY_LABEL[value.category]}</Badge>
        ) : (
          <Bos />
        )}
      </div>

      <div className={css.badgeRow}>
        {altKategoriler.length === 0 ? (
          <span className={css.note}>Alt kategori: belirtilmedi</span>
        ) : (
          altKategoriler.map((alt) => (
            <Badge key={alt} tone="neutral">
              {LISTING_SUB_CATEGORY_LABEL[alt]}
            </Badge>
          ))
        )}
      </div>

      <div className={css.badgeRow}>
        {islemTurleri.length === 0 ? (
          <span className={css.note}>İşlem türü: belirtilmedi</span>
        ) : (
          islemTurleri.map((tur) => (
            <Badge key={tur} tone="info">
              {TRANSACTION_TYPE_LABEL[tur]}
            </Badge>
          ))
        )}
      </div>
    </div>
  )
}

/**
 * Kategori özniteliği tanımlama ve düzenleme formu.
 *
 * **`dataType` neyin görüneceğini belirler.** Seçenek listesi yalnız
 * `singleSelect`/`multiSelect`'te, en az/en çok yalnız `number`/`money`'de,
 * uzunluk ve desen yalnız `text`'te çıkar. Hepsini birden göstermek, "Evet/Hayır"
 * özniteliğine minimum değer sorardı: doldurulan her anlamsız alan sunucuya
 * anlamsız veri yazar. Görünmeyen alan **silinmez** — kullanıcı tipi yanlışlıkla
 * değiştirip geri dönerse yazdığı on seçeneği kaybetmemeli; taslağı kaydetmeden
 * önce ayıklamak (`options` boşaltmak) çağıranın işi.
 *
 * **`key` yalnız `create`'te düzenlenir.** Yayındaki ilanların verisi anahtara
 * bağlı; değiştirmek eski değerleri öksüz bırakır. `edit`'te kutu `disabled`
 * değil `readOnly`: anahtar okunması ve kopyalanması gereken bir tanımlayıcı,
 * `disabled` onu odak sırasından da çıkarıp klavye kullanıcısına okutmazdı.
 *
 * **`readOnly` modda kontrol yok, metin var.** Devre dışı bir form alanı
 * okunmak için değil, dokunulmamak için tasarlanmıştır: soluk kontrast, kayıp
 * odak, ekran okuyucunun atladığı kutular. Gösterim amaçlı olan şey bir `<dl>`
 * — terim ve değer, okunacak biçimde.
 *
 * **Doğrulama yapmaz, sonucunu gösterir.** `validationErrors` alan adına göre
 * ilgili kontrolün `error` prop'una bağlanır (`key`, `label`, `validation.min`,
 * `options.0.value` …); sayfanın tepesinde toplu bir hata listesi yok — kullanıcı
 * hangi kutuyu düzelteceğini o listeden bulmak zorunda kalırdı. Karşılığı olmayan
 * anahtar sessizce yok sayılır. "Benzersiz anahtar" gibi kurallar sunucuyu
 * gerektirir; editör onları bilmez.
 *
 * **Bayraklar `Switch` değil `Checkbox`.** `SwitchProps`'un kendi sözleşmesi
 * şunu söylüyor: switch "değişiklik anında uygulanır" varsayımıyla tasarlandı,
 * "Kaydet"e kadar bekleyen ayarda `Checkbox` kullanılmalı. Bu editör tam da
 * öyle: `dirty` + "Kaydet" akışı var, dolayısıyla anahtarı çeviren kullanıcı
 * özniteliğin o an pasife alındığını sanırdı.
 *
 * `dirty`'yi editör **hesaplamaz** ve "Kaydet" ona bağlıdır: değişiklik yokken
 * kaydetmek boş bir istek atar ve `updatedAt`'i sebepsiz ileri alır.
 *
 * @example
 * <AttributeEditor
 *   value={taslak}
 *   mode="edit"
 *   dirty={taslak !== sunucudakiHali}
 *   saving={mutation.isPending}
 *   validationErrors={mutation.error?.fieldErrors}
 *   onChange={setTaslak}
 *   onSave={() => mutation.mutate(taslak)}
 *   onCancel={() => setTaslak(sunucudakiHali)}
 * />
 */
export function AttributeEditor({
  value,
  mode,
  dirty = false,
  saving = false,
  validationErrors,
  onChange,
  onSave,
  onCancel,
}: AttributeEditorProps) {
  const baslikId = useId()

  /**
   * `onChange` yoksa yazılan hiçbir şey geri dönmez: kontrollü kutular ilk
   * değerlerinde donar ve kullanıcı klavyesinin bozulduğunu sanır. Sözleşme de
   * ("verilmezse editör salt okunur davranır") bunu söylüyor — o hâlde `readOnly`
   * moduyla aynı gösterim doğru olan.
   */
  const salt = mode === 'readOnly' || onChange === undefined

  const dataType = value.dataType
  const dogrulama: AttributeValidation = value.validation ?? {}
  const secenekler: AttributeOption[] = value.options ?? []

  /**
   * Alanın hatasını `error` prop'una bağlanabilir biçimde döndürür.
   *
   * Koşullu spread: `exactOptionalPropertyTypes` açıkken `error={undefined}`
   * yazılamaz (TS2375), `noUncheckedIndexedAccess` ise sözlükten dönen değeri
   * zaten `string | undefined` yapıyor — ikisi tam olarak burada buluşuyor.
   */
  const hataProp = (alan: string): { error?: string } => {
    const mesaj = validationErrors?.[alan]
    return mesaj !== undefined ? { error: mesaj } : {}
  }

  /**
   * Seçenek listesinin toplu hatası. Tek bir kutuya bağlanamaz ("en az bir aktif
   * seçenek gerekli" hangi satırın suçu değil), o yüzden kendi alanı var.
   */
  const secenekHatasi = validationErrors?.['options']

  const guncelle = (yama: Partial<CategoryAttributeDefinition>) => {
    onChange?.({ ...value, ...yama })
  }

  /**
   * Select `string` döndürür; enum'a `as` ile değil **arayarak** dönülüyor.
   * Listede olmayan bir değer sessizce `dataType`'a yazılmaz.
   */
  const veriTipiSec = (next: string | undefined) => {
    const secilen = VERI_TIPLERI.find((tip) => String(tip) === next)
    if (secilen !== undefined) guncelle({ dataType: secilen })
  }

  /**
   * Sayısal sınırı yazar; kutu boşaltılınca alanı **siler**.
   *
   * `min: undefined` yazmak `exactOptionalPropertyTypes` ile derlenmez (TS2375)
   * ve zaten "sınır yok" ile "sınır belirsiz" diye iki ayrı durum yok.
   */
  const dogrulamaSayisi = (alan: 'min' | 'max' | 'maxLength', next: number | undefined) => {
    const sonraki: AttributeValidation = { ...dogrulama }
    if (next === undefined) delete sonraki[alan]
    else sonraki[alan] = next
    guncelle({ validation: sonraki })
  }

  const dogrulamaDeseni = (next: string) => {
    const sonraki: AttributeValidation = { ...dogrulama }
    if (next === '') delete sonraki.pattern
    else sonraki.pattern = next
    guncelle({ validation: sonraki })
  }

  /**
   * `order`, dizideki sırayla yeniden numaralanıyor.
   *
   * Sıranın iki kaynağı olamaz: dizinin kendisi ile `order` alanı çelişirse
   * seçenekler ilan formunda başka, burada başka sırada görünür. Taşıma
   * butonları diziyi değiştirir, numarayı bu fonksiyon türetir.
   */
  const secenekleriYaz = (yeni: AttributeOption[]) => {
    guncelle({ options: yeni.map((secenek, indeks) => ({ ...secenek, order: indeks + 1 })) })
  }

  const secenekEkle = () => {
    secenekleriYaz([
      ...secenekler,
      { value: '', label: '', order: secenekler.length + 1, active: true },
    ])
  }

  const secenekYama = (indeks: number, yama: Partial<AttributeOption>) => {
    secenekleriYaz(
      secenekler.map((secenek, sira) => (sira === indeks ? { ...secenek, ...yama } : secenek)),
    )
  }

  const secenekSil = (indeks: number) => {
    secenekleriYaz(secenekler.filter((_, sira) => sira !== indeks))
  }

  const secenekTasi = (indeks: number, yon: -1 | 1) => {
    const hedef = indeks + yon
    const kopya = [...secenekler]
    const kaynakSecenek = kopya[indeks]
    const hedefSecenek = kopya[hedef]

    // noUncheckedIndexedAccess: sınırdaki satırda buton zaten kapalı, ama
    // indeks daralmadan takas yazılamaz.
    if (kaynakSecenek === undefined || hedefSecenek === undefined) return

    kopya[indeks] = hedefSecenek
    kopya[hedef] = kaynakSecenek
    secenekleriYaz(kopya)
  }

  const baslik =
    mode === 'create'
      ? 'Yeni öznitelik'
      : value.label !== undefined && value.label !== ''
        ? value.label
        : 'Öznitelik'

  const kaydetVar = onSave !== undefined && !salt
  const vazgecVar = onCancel !== undefined

  const gonder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Enter da butonla aynı kapılardan geçer; kilitli formu klavye açamamalı.
    if (saving || !dirty) return
    onSave?.()
  }

  const basliklar = (
    <header className={css.header}>
      <div className={css.headerMain}>
        <p className={css.title} id={baslikId}>
          {baslik}
        </p>
        {value.key !== undefined && value.key !== '' ? (
          <code className={css.keyChip}>{value.key}</code>
        ) : null}
      </div>

      {salt ? (
        <Badge tone="neutral">Salt okunur</Badge>
      ) : (
        <div className={css.statusSlot} role="status">
          {dirty ? <Badge tone="warning">Kaydedilmemiş değişiklik</Badge> : null}
        </div>
      )}
    </header>
  )

  const footer =
    kaydetVar || vazgecVar ? (
      <div className={css.footer}>
        {vazgecVar ? (
          <Button
            variant="secondary"
            // Kaydetme uçarken vazgeçmek, sunucuya giden isteği geri almaz —
            // yalnız kullanıcıya aldığını sandırır.
            disabled={saving}
            onClick={onCancel}
          >
            {salt ? 'Kapat' : 'Vazgeç'}
          </Button>
        ) : null}

        {kaydetVar ? (
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            // Zorunlu alanların doluluğunu denetlemez: gönderimi kapatan çağıran.
            // Buradaki tek kapı "değişiklik var mı".
            disabled={!dirty}
          >
            {mode === 'create' ? 'Özniteliği oluştur' : 'Kaydet'}
          </Button>
        ) : null}
      </div>
    ) : null

  if (salt) {
    const bayrakDegeri = (alan: BayrakAlani): ReactNode =>
      value[alan] === undefined ? <Bos /> : value[alan] ? 'Evet' : 'Hayır'

    return (
      <section className={css.root({ mode: 'readOnly' })} aria-labelledby={baslikId}>
        {basliklar}
        <Kapsam value={value} />

        <dl className={css.readOnlyList}>
          <OkunurSatir terim="Etiket">
            {value.label !== undefined && value.label !== '' ? value.label : <Bos />}
          </OkunurSatir>

          <OkunurSatir terim="Anahtar">
            {value.key !== undefined && value.key !== '' ? (
              <code className={css.keyChip}>{value.key}</code>
            ) : (
              <Bos />
            )}
          </OkunurSatir>

          <OkunurSatir terim="Açıklama">
            {value.description !== undefined && value.description !== '' ? (
              value.description
            ) : (
              <Bos />
            )}
          </OkunurSatir>

          <OkunurSatir terim="Veri tipi">
            {dataType !== undefined ? ATTRIBUTE_DATA_TYPE_LABEL[dataType] : <Bos />}
          </OkunurSatir>

          <OkunurSatir terim="Sıra">{value.order ?? <Bos />}</OkunurSatir>

          {BAYRAKLAR.map((bayrak) => (
            <OkunurSatir key={bayrak.alan} terim={bayrak.label}>
              {bayrakDegeri(bayrak.alan)}
            </OkunurSatir>
          ))}

          {sayisalMi(dataType) ? (
            <>
              <OkunurSatir terim="En az">{dogrulama.min ?? <Bos />}</OkunurSatir>
              <OkunurSatir terim="En çok">{dogrulama.max ?? <Bos />}</OkunurSatir>
            </>
          ) : null}

          {metinselMi(dataType) ? (
            <>
              <OkunurSatir terim="En fazla karakter">{dogrulama.maxLength ?? <Bos />}</OkunurSatir>
              <OkunurSatir terim="Desen">
                {dogrulama.pattern !== undefined && dogrulama.pattern !== '' ? (
                  <code className={css.keyChip}>{dogrulama.pattern}</code>
                ) : (
                  <Bos />
                )}
              </OkunurSatir>
            </>
          ) : null}

          {secenekliMi(dataType) ? (
            <OkunurSatir terim="Seçenekler">
              {secenekler.length === 0 ? (
                <Bos />
              ) : (
                <ul className={css.readOnlyOptions}>
                  {secenekler.map((secenek, indeks) => (
                    // Anahtar indeks: `value` taslakta boş ya da tekrar edebilir.
                    <li key={indeks} className={css.readOnlyOption}>
                      <span>{secenek.label}</span>
                      <span className={css.optionValueText}>{secenek.value}</span>
                      {secenek.active ? null : <Badge tone="neutral">Pasif</Badge>}
                    </li>
                  ))}
                </ul>
              )}
            </OkunurSatir>
          ) : null}

          {value.updatedAt !== undefined ? (
            <OkunurSatir terim="Son güncelleme">
              {/* Tarih `utils/formatDateTime`'dan: kendi Intl'ini kuran her yer
                  saat dilimini makineye bırakıp günü kaydırıyor. */}
              {formatDateTime(value.updatedAt)}
            </OkunurSatir>
          ) : null}
        </dl>

        {footer}
      </section>
    )
  }

  return (
    <form className={css.root({ mode })} aria-labelledby={baslikId} onSubmit={gonder}>
      {basliklar}
      <Kapsam value={value} />

      <div className={css.fields}>
        <Input
          label="Etiket"
          helperText="İlan formunda ve filtrelerde görünen ad. Örn. Oda Sayısı."
          value={value.label ?? ''}
          required
          disabled={saving}
          {...hataProp('label')}
          onChange={(event) => guncelle({ label: event.target.value })}
        />

        <Input
          label="Anahtar"
          helperText={
            mode === 'create'
              ? 'Kaydedildikten sonra değiştirilemez: ilanların verisi bu anahtara yazılır.'
              : 'Kilitli. Yayındaki ilanların verisi bu anahtara bağlı; değişirse eski değerler öksüz kalır.'
          }
          value={value.key ?? ''}
          required
          // `disabled` değil `readOnly`: anahtar okunması ve kopyalanması gereken
          // bir tanımlayıcı, devre dışı kutu onu odak sırasından çıkarırdı.
          readOnly={mode !== 'create'}
          disabled={saving}
          {...hataProp('key')}
          onChange={(event) => guncelle({ key: event.target.value })}
        />

        <Textarea
          label="Açıklama"
          helperText="İlan sahibine gösterilen yardım metni. Boş bırakılabilir."
          value={value.description ?? ''}
          rows={2}
          disabled={saving}
          {...hataProp('description')}
          onChange={(event) => guncelle({ description: event.target.value })}
        />

        <Select
          label="Veri tipi"
          helperText={
            mode === 'create'
              ? 'Hangi alanların sorulacağını belirler: seçenekler, sınırlar veya desen.'
              : 'Değiştirmek mevcut ilanlardaki değerleri geçersiz kılabilir.'
          }
          options={VERI_TIPI_SECENEKLERI}
          value={dataType}
          required
          disabled={saving}
          {...hataProp('dataType')}
          // Base UI'ın ikinci `eventDetails` argümanını Select zaten yutuyor;
          // yine de tek argümanlı sözleşmeye açıkça bağlanıyor.
          onValueChange={(next) => veriTipiSec(next)}
        />

        <NumberInput
          label="Sıra"
          helperText="İlan formunda kaçıncı sırada görüneceği. Küçük olan üstte."
          value={value.order}
          min={1}
          disabled={saving}
          {...hataProp('order')}
          onValueChange={(next) => {
            if (next !== undefined) guncelle({ order: next })
          }}
        />

        <fieldset className={css.section}>
          <legend className={css.legend}>Davranış</legend>

          <div className={css.flags}>
            {BAYRAKLAR.map((bayrak) => (
              <Checkbox
                key={bayrak.alan}
                label={bayrak.label}
                description={bayrak.description}
                checked={value[bayrak.alan] ?? false}
                disabled={saving}
                // Base UI ikinci bir eventDetails argümanı geçiyor; sarmalanmazsa
                // `yaz` onu ikinci parametresi sanardı.
                onCheckedChange={(next) => guncelle(bayrak.yaz(next))}
              />
            ))}
          </div>
        </fieldset>

        {sayisalMi(dataType) ? (
          <fieldset className={css.section}>
            <legend className={css.legend}>Doğrulama</legend>
            <p className={css.note}>
              Boş bırakılan sınır uygulanmaz. Negatif değer alamayan bir öznitelikte en azı açıkça
              yazın.
            </p>

            <div className={css.pair}>
              <NumberInput
                label="En az"
                value={dogrulama.min}
                disabled={saving}
                {...hataProp('validation.min')}
                onValueChange={(next) => dogrulamaSayisi('min', next)}
              />
              <NumberInput
                label="En çok"
                value={dogrulama.max}
                disabled={saving}
                {...hataProp('validation.max')}
                onValueChange={(next) => dogrulamaSayisi('max', next)}
              />
            </div>
          </fieldset>
        ) : null}

        {metinselMi(dataType) ? (
          <fieldset className={css.section}>
            <legend className={css.legend}>Doğrulama</legend>

            <div className={css.pair}>
              <NumberInput
                label="En fazla karakter"
                value={dogrulama.maxLength}
                min={1}
                disabled={saving}
                {...hataProp('validation.maxLength')}
                onValueChange={(next) => dogrulamaSayisi('maxLength', next)}
              />
              <Input
                label="Desen"
                helperText="Düzenli ifade. Örn. ^[0-9]{5}$"
                value={dogrulama.pattern ?? ''}
                disabled={saving}
                {...hataProp('validation.pattern')}
                onChange={(event) => dogrulamaDeseni(event.target.value)}
              />
            </div>
          </fieldset>
        ) : null}

        {secenekliMi(dataType) ? (
          <fieldset className={css.section}>
            <legend className={css.legend}>Seçenekler</legend>
            <p className={css.note}>
              İlan sahibinin seçebileceği değerler. Etiket görünen metin, değer ilanda saklanan
              anahtardır ve kaydedildikten sonra değiştirilmemelidir.
            </p>

            {secenekler.length === 0 ? (
              <p className={css.note}>
                Henüz seçenek yok. Seçeneksiz bir seçim alanı ilan formunda boş bir kutu olarak
                görünür.
              </p>
            ) : (
              <ul className={css.optionList}>
                {secenekler.map((secenek, indeks) => (
                  /*
                    Anahtar indeks: `secenek.value` yeni satırda boş, iki yeni
                    satırda da aynı ("") olur ve React'in anahtarı benzersiz
                    olmalı. Kutular tamamen kontrollü olduğu için satırların yeri
                    değişince de değerler prop'tan yeniden geliyor.
                  */
                  <li key={indeks} className={css.optionItem}>
                    {/*
                      Her satır kendi `<fieldset>`'i: dört satırda dört kere
                      "Etiket" duyan ekran okuyucu kullanıcısı hangisinde
                      olduğunu ancak grubun adından ("3. seçenek") bilir. Aynı
                      sebeple taşıma ve silme butonlarının adı da sıra numarasını
                      taşıyor — numarasız kalsalardı dört "sil" düğmesi aynı adı
                      paylaşırdı.
                    */}
                    <fieldset className={css.optionRow}>
                      <legend className={css.optionLegend}>{indeks + 1}. seçenek</legend>

                      <div className={css.optionBody}>
                        <div className={css.optionFields}>
                          <Input
                            label="Etiket"
                            size="sm"
                            value={secenek.label}
                            disabled={saving}
                            {...hataProp(`options.${indeks}.label`)}
                            onChange={(event) => secenekYama(indeks, { label: event.target.value })}
                          />
                          <Input
                            label="Değer"
                            size="sm"
                            value={secenek.value}
                            disabled={saving}
                            {...hataProp(`options.${indeks}.value`)}
                            onChange={(event) => secenekYama(indeks, { value: event.target.value })}
                          />
                          <Checkbox
                            label="Aktif"
                            checked={secenek.active}
                            disabled={saving}
                            onCheckedChange={(next) => secenekYama(indeks, { active: next })}
                          />
                        </div>

                        <div className={css.optionActions}>
                          <IconButton
                            icon={<ArrowUp size={16} />}
                            label={`${indeks + 1}. seçeneği yukarı taşı`}
                            size="sm"
                            disabled={saving || indeks === 0}
                            onClick={() => secenekTasi(indeks, -1)}
                          />
                          <IconButton
                            icon={<ArrowDown size={16} />}
                            label={`${indeks + 1}. seçeneği aşağı taşı`}
                            size="sm"
                            disabled={saving || indeks === secenekler.length - 1}
                            onClick={() => secenekTasi(indeks, 1)}
                          />
                          <IconButton
                            icon={<Trash2 size={16} />}
                            label={`${indeks + 1}. seçeneği sil`}
                            variant="danger"
                            size="sm"
                            disabled={saving}
                            onClick={() => secenekSil(indeks)}
                          />
                        </div>
                      </div>
                    </fieldset>
                  </li>
                ))}
              </ul>
            )}

            {secenekHatasi !== undefined ? (
              <p className={css.sectionError} role="alert">
                {secenekHatasi}
              </p>
            ) : null}

            <Button
              className={css.addOption}
              variant="secondary"
              size="sm"
              leadingIcon={<Plus size={16} />}
              disabled={saving}
              onClick={secenekEkle}
            >
              Seçenek ekle
            </Button>
          </fieldset>
        ) : null}
      </div>

      {footer}
    </form>
  )
}
