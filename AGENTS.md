# İlan Admin Panel — AI ajanları için kurallar

Bu repo gayrimenkul ilan platformunun **admin panelini** içerir. Public Front Pages
ayrı bir repository'dedir ve **component paylaşımı yoktur**.

## Şartname

Kaynak şartname: **`gayrimenkul-admin-panel-uygulama-brifingi.md`** (repo kökünde).

Faz 3'ün 11 ekran tanımı, dashboard fixture'ının kesin sayıları ve
`users.ts`/`reports.ts` fixture gereksinimleri **yalnızca orada** — sırası gelince oku.

Ama **körlemesine uygulama.** Aşağıda brifingin doğrulanmış hatalarını ve
kullanıcının onayladığı sapmaları listeledim; çelişki olursa **bu dosya üstündür.**
Brifing bu düzeltmelerden haberdar değil — kendi zorunlu kıldığı
`exactOptionalPropertyTypes` ile kendi kodu bile derlenmiyordu.

Dosyaya **dokunma ve biçimlendirme** — dış kaynaklı bir referans, `.prettierignore`'da
tutuluyor. (Bir kez Prettier'a yakalandı ve tabloları yeniden hizalandı.)

## Değişmez kurallar

- Front Pages component'i **import etme veya kopyalama**.
- Her yeni component için **story yaz**. En az: Default, Loading, Disabled, Long content.
  Veri gösteriyorsa ayrıca Empty ve Error.
- **Prop'lara JSDoc zorunlu.** Bu açıklamalar Storybook Controls paneline ve AI
  manifest'ine (`manifests/components.json`) doğrudan akar. Yazılmazsa o kanal boş kalır.
- Component'ler **ham renk/ölçü içermez**, yalnızca `vars` (bkz. `src/tokens/contract.css.ts`).
- Component'ler **veri çekmez**. Veri prop'tan gelir. Fetch, sayfa katmanının işidir.
- Storybook'a **gerçek API anahtarı, production verisi veya gerçek kullanıcı bilgisi
  girmez.** Telefonlar `555`, e-postalar `.invalid`.
- **İş kuralları `src/domain/` altında.** Etiketler `domain/labels.ts`'te — component
  içine gömme; aynı durum listede, kuyrukta ve detayda görünür.
- Formatlama yardımcıları `src/utils/`'te. Component içine kopyalama.
- Yetki kontrolü component'in işi değil: kullanıcının yetkisi yoksa butonu
  `disabled` verme, **hiç render etme**.

## Bu repoya özgü tuzaklar — hepsi yaşandı, hepsi ölçüldü

**`@/` alias'ını prop tipi import'unda kullanma.** Storybook'un react-docgen'i onu
çözemiyor ve çözemeyince **component'in tamamını atlıyor** — prop tablosu ve AI
manifest'i sessizce boş kalıyor. Prop tipleri için göreli yol kullan:
`import type { ButtonProps } from '../../../types/component-props'`. Kodun geri
kalanında `@/` serbest.

**Base UI handler'larını sarmala.** Base UI `onCheckedChange`/`onValueChange`/
`onOpenChange`'e **ikinci bir `eventDetails` argümanı** geçiyor; brifingin sözleşmesi
tek argümanlı. Doğrudan geçirilirse `onCheckedChange={setState}` yazan biri
`setState(true, {...})` çağırmış olur. Her zaman `(next) => handler(next)` diye sarmala.

**`data-invalid` / `data-disabled`'ı elle ver.** Base UI bunları `Field.Root`'a
koyuyor; senin kutun onun içindeki sıradan bir `span` ise **devralmaz** ve hatalı
kutu kırmızı kenarlık almaz.

**Field.Control olmayan kontrolde etiket kopar.** `Field.Label`'ın `for`'u yalnızca
Field'a kayıtlı control'e bağlanır. Çıplak `<textarea>` veya `Popover.Trigger`
kullanıyorsan ya `Field.Control` ile sar ya da `FieldShell`'in `labelId` prop'uyla
`aria-labelledby` bağını ters yönden kur.

**Yeni Base UI alt yolu eklersen `optimizeDeps`'e de ekle** (`vite.config.ts`).
Eklemezsen sıcak cache'te ilk test çalıştırması "Failed to fetch dynamically imported
module" ile patlar. CI etkilenmez (orada cache soğuktur), ama geliştirici deli olur.

**Testler her şeyi yakalamaz.** Bu oturumda testler geçerken şunlar bozuktu:
Input'un hata stilleri (test `closest()` ile **atayı** bulup "geçti" demişti),
tablodaki her satırda görünen "Satırı seç" metni, Checkbox'ın fazladan argüman
sızdırması. **Ekran görüntüsü al ve DOM'u ölç** — özellikle stil ve erişilebilirlik
iddialarında.

**Storybook'un `Meta` tipi generic'i sınırlamaya düşürür.** `DataTable<Listing>`
story'lerinde `renderMobileCard`/`rowLabel` gibi callback'leri `args` yerine `render`
içinde ver, yoksa `row` tipi `{ id: string }`de kalır.

**`meta.args`'a `fn()` koyman prop'u o story dosyasında zorunlu kılar.**
`exactOptionalPropertyTypes` açıkken meta'daki `onRetry: fn()` prop'un tipini
`Mock`'a sabitler; "bu handler yok" demek isteyen story `onRetry: undefined`
yazamaz (TS2375) ve `undefined` geçmenin başka yolu da yoktur. Handler'ın
**yokluğu bir durumsa** (ErrorState'in tekrar denenemeyen hatası, `onApply`'siz
FilterBar) meta'ya koyma — ihtiyacı olan story kendi versin.

**Etiketi `visibility: hidden` ile gizleme — erişilebilir ad kaybolur.**
Erişilebilir ad hesabı `visibility: hidden` alt ağacını yok sayar. Button'ın
yükleniyor durumu tam olarak bunu yapıyordu: buton `loading` iken **adsız**
kalıyor, ekran okuyucu "düğme, meşgul" deyip hangi düğme olduğunu söylemiyordu.
Testler geçiyordu, çünkü hiçbiri yüklenen butonu **adıyla** sorgulamıyordu.
Yerini koruyarak gizlemek gerekiyorsa `opacity: 0` kullan — metin erişilebilirlik
ağacında kalır. (IconButton etkilenmiyordu: adı `aria-label`'dan geliyor.)
Regresyon testi: `Button.stories.tsx` → `LoadingKeepsAccessibleName`.

**Global reset yalnız `body`'nin margin'ini sıfırlıyor.** Yazdığın `<p>`,
`<h*>`, `<fieldset>` tarayıcı varsayılanlarını taşır; grid/flex kabında bu
margin `gap` token'ının üstüne biner ve dikey ritmi token'lar değil tarayıcı
belirler. EmptyState'te `compact` ile `default` arasındaki fark tamamen bu
yüzden kaybolmuştu — testler bunu görmez, ekran görüntüsü görür.

Faz 2'de aynı resetin iki uzantısı daha çıktı:

- **`<ul>`/`<ol>` ayrıca 40 piksel `padding-inline-start` taşır.** Yalnız
  margin'i sıfırlamak yetmez; liste sağa kaymış görünür. Semantik listeye
  ihtiyacın varsa (moderasyon geçmişi sıralıdır, `<ol>` doğru element)
  `listStyle: 'none'` + `margin: 0` + `padding: 0` üçünü birden yaz.
- **`<fieldset>`'in `min-inline-size: min-content` varsayılanı küçülmeyi
  reddeder.** Spec'ten gelir ve grid/flex kabında 320 pikselde en uzun
  çocuğu kadar genişleyip sayfayı yatay kaydırtır. `minInlineSize: 0` şart.

**Base UI `NumberField`'ın yerel ayarı varsayılan olarak kullanıcının
makinesidir.** `locale` verilmezse aynı değer Türkçe makinede `2.000.000`,
İngilizce makinede `2,000,000` görünür — Türkçede virgül ondalık ayırıcı olduğu
için fiyat milyon katı yanlış okunabilir, üstelik CI/Chromatic çıktısı runner'ın
diline göre değişir. NumberInput ve CurrencyInput `locale="tr-TR"` sabitliyor;
yeni bir Intl tüketicisi eklersen aynısını yap (`formatCurrency` de `tr-TR`
sabitliyor — aynı ekranda iki biçim olmamalı).

**Aynı tuzağın tarih hâli daha kötü: saat dilimi de makinenin.** `Intl`'e
`timeZone` verilmezse `2026-05-03T12:00:00+03:00` İstanbul'da `12:00`, UTC
runner'da `09:00`, Los Angeles'ta **`2 May 23:00`** görünür — yalnız saat değil
_gün_ kayar. Moderasyon geçmişinde bu, "karar hangi gün verildi" sorusunu
makineye göre farklı cevaplar. `utils/formatDateTime.ts` hem `tr-TR` hem
`Europe/Istanbul` sabitliyor; tarih gösteren her yer oradan geçmeli.

**Göreli zaman ("3 gün önce") yazma.** Hesabı "şimdi"ye dayanır: aynı story
dün "3 gün önce", bugün "4 gün önce" yazar. Brifing fixture'ların
deterministik olmasını şart koşuyor ve göreli zaman bunu tek başına bozar —
Chromatic her gün fark üretir, gerçek regresyon o gürültüde kaybolur.
Gerekirse `now` prop'la dışarıdan verilmeli; component saati kendi okumamalı.

**`toBeDisabled()` Base UI kontrollerinde yalan söyler.** Checkbox bir
`<span role="checkbox">` render ediyor ve devre dışılığını `aria-disabled`
ile bildiriyor; `toBeDisabled()` yalnız native `disabled` attribute'unu tanır
ve kutu gerçekten kilitliyken de düşer. Yani matcher yanlıştır, component
değil — `toHaveAttribute('aria-disabled', 'true')` kullan. Gerçek
`<button>`/`<textarea>`'da (Button, Textarea) native matcher doğru araç.

**Prop tipi olmayan import'larda da `.tsx` içinde göreli yol kullan.** Ev
kuralı: `@/` yalnız `.css.ts`'te (`@/tokens/contract.css`). Component
dosyalarının tamamı göreli yol kullanıyor; react-docgen'in `@/`'yi çözememesi
zaten bilinen tuzak, kuralı dosya bazında değil dizin bazında tutmak onu
tamamen ortadan kaldırıyor.

## Brifingden onaylanmış sapmalar

Bunlar tartışıldı ve kullanıcı onayladı. Geri alma.

Ayrıksı satırlar: **`FilterValue`, `FilterDefinition` ve
`PHOTO_REJECTION_REASONS` kullanıcıya sorulmadan, Faz 2'de karar verildi** —
brifing ilk ikisinde kendi kendisiyle çelişiyordu ve FilterBar onlarsız
yazılamıyordu; üçüncüsünde ise hiç konuşmamıştı (gerekçeler tabloda). Geri
alma, ama kullanıcı görünce itiraz ederse tartışmaya açık; diğer satırlar gibi
kapanmış sayma.

| Konu                         | Sapma                                                         | Gerekçe                                                                                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `erasableSyntaxOnly`         | Kapatıldı                                                     | `domain.ts` enum kullanıyor, enum çalışma anında kod üretiyor (TS1294)                                                                                                                                                    |
| `value?: T`                  | `value?: T \| undefined`                                      | `onValueChange` `undefined` veriyordu ama `value` geri almıyordu — gidiş-dönüş kırıktı                                                                                                                                    |
| `CheckboxProps.onChange`     | `onCheckedChange`                                             | Switch ile tutarlı; Base UI zaten `ChangeEvent` üretmiyor                                                                                                                                                                 |
| `InputProps`                 | `ref` eklendi                                                 | SearchInput temizleme sonrası odağı geri vermeli                                                                                                                                                                          |
| `CheckboxProps`              | `hideLabel` eklendi                                           | Tablo satırında etiket her satırda tekrar edip tabloyu okunmaz yapıyordu                                                                                                                                                  |
| `DataTableProps`             | `rowLabel` eklendi                                            | Etiketsiz kullanıcı 12 satırda da aynı metni duyar                                                                                                                                                                        |
| `InputProps`/`TextareaProps` | `required` native'den çıkarıldı                               | `exactOptionalPropertyTypes` ile TS2320 çakışması                                                                                                                                                                         |
| `ListingFilterValues`        | `string[]` → `SellerType[]`/`PromotionType[]`                 | Brifingin kendi tip güvenliği kuralı                                                                                                                                                                                      |
| Fixture opsiyonel tarihleri  | Koşullu spread                                                | Brifingin kodu `exactOptionalPropertyTypes` ile derlenmiyordu (TS2375)                                                                                                                                                    |
| Durum renkleri               | `paused`→nötr-200, `expired`→warning-100, `archived`→nötr-300 | 8 durum yalnız 6 farklı zemin üretiyordu                                                                                                                                                                                  |
| `AdminPermission`            | `ThemeSetDefault` eklendi                                     | Matris tema seçimi ile sistem varsayılanını ayırmış, enum ayırmamıştı                                                                                                                                                     |
| `FilterValue`                | `NumberRange` eklendi                                         | Brifing `numberRange` filtre tipi tanımlamış ama birleşimde aralık üyesi yok; tek `number` "en az 500.000" ile "en çok 500.000"ü ayıramıyor. `dateRange`'in `DateRange`'i zaten vardı, bu onun simetriği                  |
| `FilterDefinition`           | `searchable` eklenmedi, 8 seçenek eşiği kondu                 | Brifing il/ilçe/mahalle'nin aranabilir olmasını şart koşuyor ama bayrak tanımlamamış; eşik (`ARAMA_ESIGI`) sözleşmeyi büyütmeden çözüyor                                                                                  |
| DTCG token JSON              | Eklenmedi                                                     | Tasarımcı/Figma yok; gelince Style Dictionary ile eklenir                                                                                                                                                                 |
| `Button.test.tsx`            | Yazılmıyor                                                    | addon-vitest story testleri aynı işi yapıyor                                                                                                                                                                              |
| `AutomatedCheckItem`         | Silindi; panel `AutomatedCheckResult[]` alıyor                | Kullanıcı onayladı. `ModerationSummary.automatedChecks` zaten o tip; ayrı DTO her ekrana elle çeviri yaptırıp `status`'ü enum'dan string'e düşürüyor ve `label`'ı domain'den component'e taşıyordu                        |
| `PHOTO_REJECTION_REASONS`    | Fotoğraf reddine 7 gerekçelik alt küme                        | **Sorulmadan karar verildi.** Brifing fotoğraf reddinde de `RejectionReason`'ı kullanıyor ama alt küme tanımlamamış; "Fiyat Hatası" veya "Yanlış Kategori" bir fotoğrafın suçu olamaz, 15 seçenek yanlış gerekçe seçtirir |
| `BaseFixtureArgs.revision`   | Eklendi (varsayılan 1)                                        | `moderationEvents.ts`'te `edited` olayı olan ilan revizyon 1'de kalamaz; fixture kendi geçmişiyle çelişemez                                                                                                               |

## Teknoloji

React 19 · TypeScript 6 (strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`)
· Vite 8 · **Base UI** (headless primitive'ler) · **vanilla-extract** (`.css.ts`)
· React Router 8 · TanStack Query/Table/Form/Virtual · Storybook 10 · react-day-picker
(takvim; Base UI'da tarih primitive'i yok) · Recharts + lucide-react.

## Component kalıbı

```
Button/
  Button.tsx         Component + JSDoc (props JSDoc'u component-props.ts'te)
  Button.css.ts      vanilla-extract
  Button.stories.tsx Story'ler
  index.ts           export
```

Props **`src/types/component-props.ts`**'te merkezi. Component kendi prop tipini
tanımlamaz, oradan import eder (göreli yolla!).

`src/components/internal/` katalog component'i değildir — `FieldShell` ve `listbox.css`
paylaşılan altyapıdır, doğrudan kullanılmaz.

## Doğrulama

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test-storybook --run && pnpm build-storybook
```

Hepsi geçmeden "bitti" deme. Ayrıca **gözle bak**: `pnpm storybook` (port 6007),
toolbar'dan üç temayı da dene.

## Durum ve sırada ne var

**Faz 1 bitti:** 26/26 primitive.
**Faz 2 sürüyor:** 14/29 composite (StatusBadge, ListingCard, DataTable, FilterBar,
Pagination, EmptyState, ErrorState, ConfirmDialog, BulkActionBar + moderasyon grubu:
ModerationActionBar, RejectionReasonPicker, ImageGallery, AutomatedChecksPanel,
ModerationHistory).

Sırada: `AppShell`/`SidebarNav`/`TopBar` → dashboard (`StatCard`, `ChartCard`) → kalanlar.

Eksik fixture'lar: `users.ts`, `reports.ts`, `dashboard.ts`.

### Moderasyon grubunda kurulan yapılar

- **`domain/moderationActions.ts`** — brifing 1.2'nin geçiş tablosunun beş
  moderasyon eylemine düşen kesiti: hangi eylem hangi durumda görünür
  (`allowedFrom`), hangisi gerekçe/not zorunlu kılar. Yetki boyutu burada
  **yok**; onu `ModerationCapabilities` taşıyor ve `ROLE_PERMISSIONS` ile
  birebir örtüşüyor. Bir eylem iki kapıdan (yetki + durum) geçmeden görünmez.
- **`utils/formatDateTime.ts`** — `tr-TR` + `Europe/Istanbul` sabit.
- **`fixtures/moderationEvents.ts`** — dört zincir, hepsi gerçek ilan
  fixture'larının kendi tarihlerine bağlı (`approved` olayı ilanın
  `publishedAt`'i ile aynı an). On beş `ModerationEventType` değerinin hepsi
  kapsanıyor; `EveryEventTypeRenders` story'si bunu ölçüyor.
- **ModerationActionBar kararı kendi topluyor.** `ModerationDecisionPayload`
  gerekçe ve not istiyor, dolayısıyla buton doğrudan handler'ı çağıramaz: dialog
  açar, `RejectionReasonPicker` ile toplar. Onay/arşivde alan yok ama dialog
  yine açılır (brifing 2.4: karar öncesi doğrulama zorunlu). Dialog onayla
  kapanır — sözleşmede hata kanalı yok, sonucu sayfanın toast'ı bildirir; taslak
  state'te kalır ki başarısız kararda not kaybolmasın.

### Faz 1'de düzeltilen üç hata (Faz 2 sırasında bulundu)

Üçü de testler geçerken bozuktu; ikisi ancak ekran görüntüsüyle görüldü.
Gerekçeleri "tuzaklar" bölümünde:

- `Button` — `loading` iken erişilebilir adı kayboluyordu (`visibility` → `opacity`).
- `NumberInput` / `CurrencyInput` — sayı biçimi kullanıcının makinesine göre
  değişiyordu (`locale="tr-TR"` sabitlendi).
- `Modal` — gövdesiz kullanımda başlıkla footer arasında boş bant kalıyordu
  (`body:empty` dolgusu sıfırlandı; ConfirmDialog'un ihtiyacı).

### Bilinen borç: prop JSDoc'ları — 144 prop, 24 component

"Prop JSDoc'u zorunlu" kuralı Faz 1'de sessizce delinmiş. Ölçmenin yolu:

```bash
pnpm build-storybook   # sonra manifest'i say (proplar `reactDocgen.props` altında)
node -e "const m=JSON.parse(require('fs').readFileSync('./storybook-static/manifests/components.json','utf8'));
for (const c of Object.values(m.components)) { const p=Object.entries(c.reactDocgen?.props ?? {});
if (!p.length) continue; const e=p.filter(([,x])=>(x.description??'')==='').map(([k])=>k);
if (e.length) console.log(c.name.padEnd(16), (p.length-e.length)+'/'+p.length, e.join(', ')) }"
```

**Tam olanlar (15):** Faz 2'nin altısı + `Badge`, `Button`, `DataTable`,
`StatusBadge` + moderasyon grubunun beşi.

**Kalan: 144 prop / 24 component — Faz 2'de değişmedi.** Moderasyon grubu borcu
büyütmedi (34 prop, hepsi belgeli) ama küçültmedi de: borç Faz 1
primitive'lerinde duruyor. En yüksek kaldıraç, sırasıyla:

1. **`FieldMetaProps`'a JSDoc yaz — dört yorum, dokuz component.** `label`,
   `helperText`, `error`, `required` dokuz component'te birden eksik görünüyor
   ama kaynak tek: o interface'in kendisi belgesiz. Tek dosyada dört yorum, 36
   prop kapanır.
2. **`disabled` 13 component'te eksik.** Her birinde aynı kural tekrarlanacak:
   yetki için kullanılmaz, yetkisiz kullanıcıya kontrol hiç render edilmez.
   `Button.disabled`'ın JSDoc'u örnek alınabilir.
3. Kalan tekil proplar (`size`, `variant`, callback'ler) component component.

**Native attribute'lar da sayılıyor.** `Button`/`IconButton`'da `disabled` ve
`type`, ButtonHTMLAttributes'tan geliyor ama component imzasında varsayılanları
olduğu için react-docgen onları prop sayıyor — belgelenmezse Controls'ta boş
görünüyorlar. Belgelemek için interface'te yeniden bildir; tipi native'le
birebir aynı yaz (`disabled?: boolean | undefined`), yoksa
`exactOptionalPropertyTypes` TS2320 verir (bkz. `InputProps.required` sapması).

## Karar bekleyenler — UYDURMA, SOR

**"Sınırlı" yetki kademesi.** Kullanıcı "ayrı izinler ekle" dedi ama **hangi alanların
sınırlı olduğunu söylemedi.** Brifingin matrisi üç yerde "Sınırlı" diyor:
`moderator`'un kullanıcı düzenlemesi, `destek`'in kullanıcı düzenlemesi,
`icerikDenetcisi`'nin şikayet triage'ı. `RolePermissionMatrix`'e gelmeden önce
"hangi alanlar?" diye sor.

**`AsyncState`** `partialSuccess` ve `unauthorized` ifade edemiyor ama Faz 3'ün story
matrisi ikisini de zorunlu tutuyor. Ekranlara gelince çözülmeli.

**Revizyon çakışması hâlâ ekranın sorunu.** ModerationActionBar çakışmayı
tespit etmiyor, tespit _edilebilir_ kılıyor: kararı `expectedRevision` ile
damgalıyor. Brifing "revision conflict ayrı bir UI durumu olmalıdır" diyor ama
ne çubuğun ne de `ListingReviewPanelProps`'un bir hata kanalı var — Faz 3'te
`AsyncState` ile birlikte çözülmeli.

**Chromatic** ücretsiz planla bu spesifikasyon **matematiksel olarak çalışmıyor**:
~500 story × 3 tema × 2 viewport = 3.000 snapshot/build, kota 5.000/ay. Org repo'su
gündeme gelince tema×viewport matrisi daraltılmalı ya da ücretli plana geçilmeli.

**Backend** en sona bırakıldı — bu yüzden `src/types/domain.ts` fiilen FastAPI'nin
şartnamesidir. Oradaki tipleri değiştirirken bunu hatırla.

## Git

Kullanıcı **tüm git işlemlerini kendi yapar.** Commit atma, push etme, remote ekleme.
İş bitince faz faz `git add` komutlarını ve commit mesajlarını **metin olarak ver**.
