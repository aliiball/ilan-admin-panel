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

Faz 2 bunun **handler'a özgü olmadığını** gösterdi; beş component bağımsız olarak
aynı duvara çarptı. Sebep `Mock` tipi değil: `StoryObj<typeof meta>` meta.args'ın
_çıkarılan_ tipini prop tipiyle kesiştiriyor, dolayısıyla meta.args'a konan
**her** prop — `title: 'Metin'`, `description`, `listing`, `searchValue` — o
dosyada geri alınamaz oluyor. Kural genel: **yokluğu bir durum olan hiçbir prop
meta.args'a konmaz, tipi ne olursa olsun.** PageHeader'da yalnız `title`,
TopBar'da yalnız `currentUser` meta'da. Prop'u `render` içinde args'tan ayıklamak
da bir çıkış (ChartCard → `WithoutDescription`).

**Etiketi `visibility: hidden` ile gizleme — erişilebilir ad kaybolur.**
Erişilebilir ad hesabı `visibility: hidden` alt ağacını yok sayar. Button'ın
yükleniyor durumu tam olarak bunu yapıyordu: buton `loading` iken **adsız**
kalıyor, ekran okuyucu "düğme, meşgul" deyip hangi düğme olduğunu söylemiyordu.
Testler geçiyordu, çünkü hiçbiri yüklenen butonu **adıyla** sorgulamıyordu.
Yerini koruyarak gizlemek gerekiyorsa `opacity: 0` kullan — metin erişilebilirlik
ağacında kalır. (IconButton etkilenmiyordu: adı `aria-label`'dan geliyor.)
Regresyon testi: `Button.stories.tsx` → `LoadingKeepsAccessibleName`.

Faz 2 bu tuzağın dört kardeşini daha ölçtü. Hepsi aynı soruya bakıyor —
**erişilebilir ad hesabına ne girer, ne girmez:**

- **`display: none` de alt ağacı addan siler**, ve responsive gizlemenin ilk
  refleksi tam olarak odur. Yeri boşaltıp adı korumanın tek yolu medya sorgusu
  içinde sr-only kalıbına (`clip-path` + 1 piksel) geçmek.
- **Base UI `Avatar.Fallback` baş harfleri ada sızdırıyor.** Kaynağında tek bir
  aria attribute'u yok (`avatar/fallback/AvatarFallback.js`): "EK"yi sıradan bir
  `<span>`'e yazıyor. Avatar adını içeriğinden hesaplayan bir kabın (tıklanabilir
  kart butonu, satır linki) içine konunca butonun adı **"EK Elif Kaya, Moderatör…"
  diye başlıyor**; ekran okuyucu kullanıcısı her satırda önce iki anlamsız harf
  duyuyor. `AvatarProps`'un JSDoc'u "dekoratiftir, `alt` boş bırakılır" diyor ama
  fallback `alt` değil düz metin — niyet doğru, uygulama eksik. TopBar ve
  UserSummaryCard Avatar'ı `aria-hidden="true"` sarmalayıcıya koydu (bilgi kaybı
  yok: ad zaten yanında yazılı) ve adın **başını** regex'le ölçüyor
  (`/^Ayşe Demir/`). Kalıcı çözüm `Avatar.tsx`'te Fallback'e `aria-hidden`
  koymak; SellerPanel ve DataTable'ın kullanıcı kolonu aynı tuzağa girecek.
  Dikkat: `AvatarProps.status` kullanılıyorsa sarmalayıcı onun `aria-label`'ını
  da yutar — nokta dışarıda bırakılmalı.
- **Base UI `Switch`'in `description`'ı adın İÇİNE karışıyor.** `SwitchRoot`
  `nativeButton = false` varsayılanıyla `<span role="switch">` + gizli input
  render ediyor; `useAriaLabelledBy(..., enableFallback = !nativeButton)` gizli
  input'un `.labels`'ından sarmalayan `<label>`'ı bulup `aria-labelledby`'yi ona
  bağlıyor (`internals/labelable-provider/useAriaLabelledBy.mjs`). Ad label'ın
  **tüm** metninden hesaplanıyor: `description` verilirse anahtarın adı "Öne
  Çıkan" değil "Öne Çıkan Aktif · Satın alındı · Bitiş: 24 Tem 2026 09:00" olur —
  yani **veri değiştikçe ad değişir**. PromotionFlagsPanel kayıt özetini bu yüzden
  `description`'a değil anahtarın yanındaki kendi elementine koydu;
  `SwitchNameIsJustTheLabel` beş anahtarı da adıyla sorguluyor. (Aynı kaynak
  `aria-disabled` tuzağını da doğruluyor: kontrol native `<button>` değil.)
- **`role="treeitem"`in adı alt ağacını yutar.** Adını "içerikten" hesaplıyor ve
  içine gömülü `role="group"`u da hesaba katıyor: açık "Konut" düğümü ekran
  okuyucuda "Konut Daire Rezidans Müstakil Ev Villa…" diye okunuyor. Çözüm:
  `aria-labelledby` satır kutusunu göstersin, grup o kutunun dışında kalsın. İç
  içe ARIA yapısı kuran her component'i ilgilendirir (ileride Accordion, iç içe
  DataTable). Ölçüm: `CategoryTree.stories.tsx` → `NodeNameExcludesSubtree`.

**Global reset yalnız `body`'nin margin'ini sıfırlıyor.** Yazdığın `<p>`,
`<h*>`, `<fieldset>` tarayıcı varsayılanlarını taşır; grid/flex kabında bu
margin `gap` token'ının üstüne biner ve dikey ritmi token'lar değil tarayıcı
belirler. EmptyState'te `compact` ile `default` arasındaki fark tamamen bu
yüzden kaybolmuştu — testler bunu görmez, ekran görüntüsü görür.

Faz 2'de aynı resetin dört uzantısı daha çıktı:

- **`<ul>`/`<ol>` ayrıca 40 piksel `padding-inline-start` taşır.** Yalnız
  margin'i sıfırlamak yetmez; liste sağa kaymış görünür. Semantik listeye
  ihtiyacın varsa (moderasyon geçmişi sıralıdır, `<ol>` doğru element)
  `listStyle: 'none'` + `margin: 0` + `padding: 0` üçünü birden yaz.
- **`<fieldset>`'in `min-inline-size: min-content` varsayılanı küçülmeyi
  reddeder.** Spec'ten gelir ve grid/flex kabında 320 pikselde en uzun
  çocuğu kadar genişleyip sayfayı yatay kaydırtır. `minInlineSize: 0` şart.
- **`<dd>` 40 piksel `margin-inline-start` taşır** — `<ul>`/`<ol>` ile aynı
  sayı, **farklı özellik**; yukarıdaki "padding'i sıfırla" reçetesi onu
  düzeltmez. `<dl>` de kendi margin'ini taşır. Ad-değer çifti için doğru
  element `<dl>`/`<dt>`/`<dd>` (ListingFacts, UserSummaryCard, LocationPanel
  üçü de kullanıyor), ama üçü birden sıfırlanmadan değerler terimlerinden
  40 piksel sağda başlar ve dikey ritmi `gap` değil tarayıcı belirler.
- **`<caption>` varsayılan olarak ortalıdır.** Bölüm başlığı olarak
  kullanılınca tablonun üstünde ortada durur; `textAlign: 'start'` gerekir.

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

**Koordinat hâli ise en kötüsü: değer yanlış okunmuyor, _ayrıştırılamıyor_.**
Para ve tarihte kullanıcı yanlış bir değer görür; koordinatta çiftin kendisi
bozulur — `40.9888, 29.0277` Türkçe biçimlendiricide `40,988800, 29,027700`
olur: üç virgül var ve hangisinin ondalık, hangisinin ayırıcı olduğu belirsiz.
Kural: **koordinat, kimlik ve teknik tanımlayıcılar `toFixed` ile yazılır,
`Intl`'e sokulmaz.** (LocationPanel.)

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

Faz 2 aynı hatanın — **matcher yanlış, component değil** — beş kardeşini daha
buldu. Hepsi "test geçiyor ama hiçbir şey ölçmüyor" biçiminde:

- **`toBeVisible()` kırpma tekniğini görmez.** `display`/`visibility`/`opacity`'ye
  bakar; `clip-path` + 1 piksel ile görsel olarak gizlenmiş etiketi "görünür"
  sayar. visuallyHidden iddiası ancak `getBoundingClientRect().width` ile ölçülür.
- **`queryByText` `aria-hidden` alt ağacını dışlamaz.** "Avatar baş harfleri
  erişilebilirlik ağacına sızmamalı" iddiası
  `expect(queryByText('AD')).not.toBeInTheDocument()` diye yazılırsa **her zaman
  düşer** — metin DOM'da duruyor, gizli olan erişilebilirlik ağacındaki hâli.
  Doğru ölçüm: elemanı bul, `closest('[aria-hidden="true"]')` ile gizli atasını
  doğrula.
- **`queryByRole` ise `aria-hidden` alt ağacını _dışlar_** — bu yüzden
  "aria-hidden içinde odaklanılabilir öğe yok" iddiası rol sorgusuyla ölçülemez,
  test sessizce dişsizleşir.
  `canvasElement.querySelector('[aria-hidden="true"] [tabindex]')` ile ölç.
- **`queryByRole('img')` dekoratif görseli (`alt=""`) hiçbir zaman bulamaz**;
  "görsel yok" iddiası her koşulda geçer. `canvasElement.querySelector('img')`.
- **`toHaveTextContent('Var')` alt dize arar** ve `'Var (eklendi)'` ile de
  eşleşir: "bu hücre değişmedi" iddiası tek başına bu matcher'la yalan söyler.
  Olumluyu olumsuzla birlikte yaz (`not.toHaveTextContent('eklendi')`).
- **Açık Base UI dialog'u sayfanın kalanını `aria-hidden` yapar**, dolayısıyla
  `within(canvasElement).getByRole(...)` çekmece açıkken arka plandaki
  element'leri **bulamaz**. Arka planı ve portalı aynı anda ölçen test rol
  sorgusu yerine `document.querySelectorAll` kullanmalı.

Lehimize çalışan bir davranış da var: **`getByText` yalnız DOĞRUDAN metin
çocuklarına bakar** (`getNodeText`), atayı bulmaz. "Konut" kökünü Arsa'nın
"Konut İmarlı"sından ayırmanın tek sağlam yolu bu — ad sorgusu ikisini
karıştırır. Sayıya dayalı iddialar (`getAllByText(...)` → `toHaveLength(2)`)
da bu yüzden güvenilir.

**Türkçe regex'i küçük harfle yazma.** `/açık şikayet$/` "Açık şikayet"
etiketiyle eşleşmez; iddiayı ona dayandıran test doğru sebeple geçmez.
`/\d+ açık şikayet/` gibi metnin gerçek hâlini yaz.

**Prop tipi olmayan import'larda da `.tsx` içinde göreli yol kullan.** Ev
kuralı: `@/` yalnız `.css.ts`'te (`@/tokens/contract.css`). Component
dosyalarının tamamı göreli yol kullanıyor; react-docgen'in `@/`'yi çözememesi
zaten bilinen tuzak, kuralı dosya bazında değil dizin bazında tutmak onu
tamamen ortadan kaldırıyor.

### Faz 2'de çıkan yerleşim tuzakları

**`position: sticky` en yakın kaydırma kabına yapışır — sayfaya değil.**
AppShell'in `<main>`'ini mobilde kaydırma kabına çevirmek ModerationActionBar'ı
_sessizce_ bozar: çubuk ekranın altına değil içeriğin sonuna oturur. Bu yüzden
`overflow` yalnız ≥48rem'de veriliyor; orada tam tersi isteniyor (çubuk main'in
kutusuna yapışsın). Testler bunu görmez, ekran görüntüsü görür.

**Kabuk slot'unu `display: none` ile gizleme — `display: contents` kullan.**
`none`, çekmecesini portal'sız (kendi içinde `position: fixed`) çizen bir menüyü
yok eder: menü DOM'da durur ama hiç boyanmaz. `contents` kutuyu siler, çocuğu
bırakır — düzenden çıkarmanın doğru aracı budur. (Adı da siler; yukarıdaki
erişilebilir ad ailesine bak.)

**`minWidth: 0`'ı metni saran tarafa yaz, sabit genişlikli kontrol taşıyan
tarafa asla.** Refleks `minWidth: 0`'ı eylem kutusuna yazmak, ama flex öğesinin
`min-width: auto` varsayılanı o kutuyu **en geniş butonun altına inmekten koruyan
şey**: sıfırlanınca uzun başlıklı sayfada shrink orantılı dağılır, eylem kutusu
butondan dar kalır ve buton dışarı taşar — yani `minWidth: 0` tam olarak
önlemeye çalıştığı yatay kaydırmayı üretir. Daralması gereken taraf başlık
bloğudur, çünkü metni sarabilen odur. Ölçüm: PageHeader → `LongContent` ve
`ActionsOverflow`, `scrollWidth <= clientWidth`.

**`overflow-wrap: anywhere` şart, `break-word` değil.** Flex öğesinin otomatik
minimum boyutu `min-content`'tir; `break-word` min-content'i değiştirmez,
`anywhere` değiştirir. Uzun bir değer dizgisi (`1.284.937.512 ₺`) flex kabında
ancak `anywhere` ile küçülüp sarar.

**`overflow: hidden` + kabı kaplayan `<button>` = kırpılmış odak halkası.**
Global `:focus-visible` outline'ı `outlineOffset: 0.125rem` ile kutunun dışına
taşıyor; atada `overflow: hidden` varsa onu yutuyor. **ListingCard'da bu
kombinasyon şu an duruyor** (card recipe'i `overflow: hidden` + `clickRegion`
butonu) — muhtemel bir Faz 1/2 hatası, ekran görüntüsüyle doğrulanmalı.

**Odak halkası, odaklanan elemanın TAMAMINI çevreler.** İç içe listede odaklanan
eleman `<li role="treeitem">` ise ve düğüm açıksa, li bütün alt ağacını kapsar:
halka "Konut"un değil "Konut + yedi çocuğunun" etrafına çizilir ve odaktaki satır
kaybolur. Halka li'de kapatılıp satır kutusuna taşınmalı. Ölçüm: CategoryTree →
`FocusRingIsOnTheRowNotTheSubtree`, li'nin kutusunun satırın en az beş katı
olduğunu piksel piksel doğruluyor.

**İç içe liste + satır tıklaması = ata sessizce seçilir.** `onClick` `<li>`'de
olursa çocuğun olayı bütün atalarına kabarır ve en dıştaki ata **en son** seçilen
olur: "Daire"ye basan kullanıcı "Konut" seçili bulur. Tıklama, alt listeyi
içermeyen satır kutusuna konmalı — kabarma orada biter. Ölçüm:
`ChildClickDoesNotSelectAncestor` çağrı **sayısını** ölçüyor.

**`aspect-ratio` yer tutucuyu deli gömleğine çevirir.** `4/3` verilen bir harita
çerçevesi 320 pikselde ~216 piksele **kilitlenir** ve içindeki EmptyState (ikon +
başlık + üç satır açıklama) kesik kenarlığın dışına taşar — yer tutucunun içeriği
kendi çerçevesinden taşıyorsa yer tutmuyor demektir. `minBlockSize: 'fit-content'`
oranı **taban** yapar: küçük içerikte oran korunur, büyük içerikte kutu uzar.

**Skeleton'ın `height: 1em`'i gerçek metnin satır kutusundan kısadır.** Metin
`1em × line-height` kadar yer kaplarken (3xl + tight = 2.34rem) iskelet 1.875rem
kalır: "skeleton aynı yeri kaplar" varsayımı büyük fontlarda yanlış ve veri
gelince yarım satır zıplar. Kap `minBlockSize: calc(1em * var(--line-height-tight))`
ile sabitlenmeli. Skeleton'ı büyük bir metnin yerine koyan herkesi ilgilendirir.

**`borderCollapse: 'collapse'` ile yapışkan sütun birlikte çalışmıyor.**
Birleştirilmiş kenarlıkta kenarlık hücrenin değil **tablonun** mülkiyetindedir;
yapışkan sütun kaydırılırken kenarlığını beraberinde taşımaz ve altındaki
hücrelerin üstünde kenarlıksız yüzer. `'separate'` + `borderSpacing: 0` + hücre
başına kenarlık şart. (DataTable `'collapse'` kullanıyor ama onun yapışkan sütunu
yok — kopyalayan yanılır.)

**Yapışkan sütunun z-index'i sayfanın yapışkan çubuklarıyla yarışır.** Matrisin
`z.sticky`'si TopBar ve BulkActionBar'ın `floating` varyantıyla aynı yığın
bağlamındaydı; kaydırma kabına `isolation: 'isolate'` konunca matrisin z-index'i
matrisin içinde kalıyor.

**Zebra/hover ile diff çakışır — ikisini birden isteme.** Üçü de hücre zeminini
boyuyor, oysa `diff` varyantında zemin **tek bilgi taşıyıcısıdır**: şeridin
altında kalan "izin kaldırıldı" işareti varyantın tek işini yapamaz hâle getirir.
RolePermissionMatrix'te zebra ve hover bu yüzden **bilerek yazılmadı** (CSS'te
gerekçesiyle yorumlu); dört sütunda satırı izlemeye hücre kenarlıkları yetiyor.

**Ölçü token'ı boşluğu: `space[24]` (6rem) ile `container.sm` (40rem) arası boş.**
Bir matrisin satır-başlığı sütunu ~15-25rem ister ve arada token yok. Sütuna
`minWidth` uydurmak yerine **tabloya** `minWidth: container.sm` verildi: 320
pikselde etiketler kelime kelime kırılmak yerine kaydırma çubuğu çıkıyor, geniş
ekranda `width: 100%` devralıyor. Yeni token eklemeden çözüldü ama **boşluk
duruyor** — aynı ihtiyaç tekrarlarsa token eklemek doğru olabilir.

**Kart `<button>` olabiliyorsa bütün çocukları phrasing content olmak zorunda.**
Buton içine akış içeriği (`<p>`, `<div>`) koymak geçersiz HTML'dir ve tarayıcılar
sessizce farklı yorumlar. Bu, reset tuzağıyla kesişiyor: oradaki her zamanki
çözüm ("yazdığın `<p>`'nin margin'ini sıfırla") burada **uygulanamaz**, çünkü
element seçimi zorunlu — her şey `<span>` + `display: flex/grid`. `onClick`
alabilen her component'te tekrarlanacak (StatCard, ReportCard, ListingCard).

**Medya sorgusu viewport'a bağlıdır, kabın genişliğine değil.** Repoda container
query yok: "mobilde dikey sıralanır" iddiası dar bir decorator kabında play ile
**ölçülemez**. Dikey sıralamanın kendisi ekran görüntüsünün işi; play yalnız
yatay taşmayı ölçebilir.

### Faz 2'de çıkan diğer tuzaklar

**`[hidden]`'ın `display: none`'ı tarayıcı stil sayfasından gelir; yazar stili
HER ZAMAN onu ezer.** Alt listeye `display: grid` yazıp `hidden={!açık}` vermek
kapalı grubu **açık bırakır**: `aria-expanded="false"` derken içerik ekranda
durur ve ekran okuyucu kapalı grubun bağlantılarını gezmeye devam eder
(erişilebilirlik ağacı da CSS'e bakar). `selectors: { '&[hidden]': { display:
'none' } }` elle geri konmalı. SidebarNav.css.ts'te belgeli;
`NestedGroupTogglesWithKeyboard` ve `ActiveChildOpensParent` ölçüyor.

**`useId` tek başına yetmez: aynı ağacı iki kez render eden component kapsam
öneki ister.** SidebarNav rayı ve çekmeceyi aynı ağaçtan çiziyor; iki kopya aynı
`useId` değerini paylaşınca `aria-controls` id'leri çakışıyor ve çekmecedeki ok
**rayın görünmeyen listesini** işaret ediyor. Sessiz hata: ekranda her şey doğru,
yalnız ekran okuyucu yanlış yere bakıyor. `useId` + `'rail'`/`'drawer'` öneki
gerekiyor; `ToggleControlsItsOwnList` ölçüyor. Aynı sebeple **sabit `id`
yazma**: iki kabuklu bir story (VariantsComparison) sabit id'yi patlatır ama
hiçbir test düşmez — atlama bağlantısı "çalışmaya" devam eder, yalnız yanlış
kabuğa gider. (React 19.2'nin `useId`'si `_r_0_` biçiminde üretiyor, eski `:r0:`
değil — fragment ve CSS selector'da güvenli, sanitize gerekmiyor.)

**`globals.css`'in `a` kuralı `text-decoration`'ı sıfırlamıyor.** `color` ve
`textUnderlineOffset` veriyor, altı çizgiyi bırakıyor: menüde her satır altı
çizili çıkar. Link class'ında `textDecoration: 'none'` şart. Ayrıca `a:hover`
(0,1,1) bir recipe base class'ının (0,1,0) **üstüne biner** — bu yüzden hover
kuralı base'e değil `active` varyantlarının içine yazılmalı; base'e yazılırsa
aktif satırın zemini hover'da kaybolur.

**Hesaplanmış birleşim anahtarı TS denetimini sessizce atlıyor.**
`güncelle({ [alan]: next })` — `alan: 'required' | 'filterable' | …` —
`Partial<Def>`'e giderken **değer tipi hiç denetlenmiyor**: `{ [alan]: 'bu bir
string' }` bile temiz derleniyor (tsc 6.0.3 + strict + `exactOptionalPropertyTypes`
ile izole doğrulandı; ara `Partial<Record<K, boolean>>` tipi de kurtarmıyor).
Çözüm: her bayrak kendi yazıcı fonksiyonunu taşısın
(`yaz: (next) => ({ required: next })`) — yanlış alan/tip TS2322 verir. Kopya
alıp tek alanı yazan hâl de (`const yeni: Flags = { ...flags }; yeni[key] = next`)
tip güvenli. **Fixture ve domain sözlüklerinde de aynı kalıp olabilir, taranmaya
değer.**

**Storybook'un viewport global'i ile test tarayıcısının gerçek viewport'u aynı
şey olmayabilir.** Vitest browser modunun varsayılan viewport'u 414×896 ve
`vite.config.ts`'te ezilmiyor; addon-vitest'in `globals.viewport`'u gerçekten
uygulayıp uygulamadığı **doğrulanamadı**. Bu yüzden medya sorgusuna bağlı play
iddiaları (hamburger masaüstünde `display: none`, fixed/collapsible geometrisi)
kırılgandır — yalnız viewport'tan bağımsız şeyleri ölç (landmark sayısı, dar
ekranda taşma yok, DOM'da var/yok). Sorguları `{ hidden: true }` ile yaz: iddia
"DOM'da var/yok" düzeyine iner ve yokluk iddiası güçlenir ("gizli değil, hiç
yok"). **Entegrasyon fazı viewport'un uygulandığını doğrularsa** geometrik
testler eklenebilir.

**`<header>` Storybook'ta banner sayılır, uygulamada sayılmaz.** AppShell'in
`<main>`'i içindeki `<header>` landmark üretmez (banner üst seviyede oluşur, o
TopBar'ındır); Storybook canvas'ında gövdeye doğrudan bağlı render edildiği için
banner olur. Kritik bir axe ihlali değil, ama `getByRole('banner')`e dayanan play
testi **uygulamada karşılığı olmayan bir şeyi** ölçer — testleri `h1`/`nav`
üzerinden yaz.

**Recharts 3'te `accessibilityLayer` varsayılan `true`** ve grafiğin `<svg>`'sine
`tabIndex=0` + `role="application"` koyuyor (`container/RootSurface.js` ile
doğrulandı). Grafiği `aria-hidden` bir kaba koyup bunu kapatmazsan axe
`aria-hidden-focus` ihlali doğar: klavye oraya gider, ekran okuyucu "burada bir
şey yok" der. Story helper'ı `accessibilityLayer={false}` veriyor. Grafik kabına
`role="img"` vermek de naif çözüm — alt ağacı erişilebilirlik ağacından **siler**,
yani prop JSDoc'unun `children`'a koyulmasını istediği tablo/özet alternatifini
tam da o gizler; ad `<section>` + `aria-labelledby` ile kurulmalı.

## Brifingden onaylanmış sapmalar

Bunlar tartışıldı ve kullanıcı onayladı. Geri alma.

Ayrıksı satırlar: **`FilterValue`, `FilterDefinition` ve
`PHOTO_REJECTION_REASONS` kullanıcıya sorulmadan, Faz 2'de karar verildi** —
brifing ilk ikisinde kendi kendisiyle çelişiyordu ve FilterBar onlarsız
yazılamıyordu; üçüncüsünde ise hiç konuşmamıştı (gerekçeler tabloda). Geri
alma, ama kullanıcı görünce itiraz ederse tartışmaya açık; diğer satırlar gibi
kapanmış sayma.

| Konu                         | Sapma                                                         | Gerekçe                                                                                                                                                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `erasableSyntaxOnly`         | Kapatıldı                                                     | `domain.ts` enum kullanıyor, enum çalışma anında kod üretiyor (TS1294)                                                                                                                                                                                                 |
| `value?: T`                  | `value?: T \| undefined`                                      | `onValueChange` `undefined` veriyordu ama `value` geri almıyordu — gidiş-dönüş kırıktı                                                                                                                                                                                 |
| `CheckboxProps.onChange`     | `onCheckedChange`                                             | Switch ile tutarlı; Base UI zaten `ChangeEvent` üretmiyor                                                                                                                                                                                                              |
| `InputProps`                 | `ref` eklendi                                                 | SearchInput temizleme sonrası odağı geri vermeli                                                                                                                                                                                                                       |
| `CheckboxProps`              | `hideLabel` eklendi                                           | Tablo satırında etiket her satırda tekrar edip tabloyu okunmaz yapıyordu                                                                                                                                                                                               |
| `DataTableProps`             | `rowLabel` eklendi                                            | Etiketsiz kullanıcı 12 satırda da aynı metni duyar                                                                                                                                                                                                                     |
| `InputProps`/`TextareaProps` | `required` native'den çıkarıldı                               | `exactOptionalPropertyTypes` ile TS2320 çakışması                                                                                                                                                                                                                      |
| `ListingFilterValues`        | `string[]` → `SellerType[]`/`PromotionType[]`                 | Brifingin kendi tip güvenliği kuralı                                                                                                                                                                                                                                   |
| Fixture opsiyonel tarihleri  | Koşullu spread                                                | Brifingin kodu `exactOptionalPropertyTypes` ile derlenmiyordu (TS2375)                                                                                                                                                                                                 |
| Durum renkleri               | `paused`→nötr-200, `expired`→warning-100, `archived`→nötr-300 | 8 durum yalnız 6 farklı zemin üretiyordu                                                                                                                                                                                                                               |
| `AdminPermission`            | `ThemeSetDefault` eklendi                                     | Matris tema seçimi ile sistem varsayılanını ayırmış, enum ayırmamıştı                                                                                                                                                                                                  |
| `AdminPermission`            | `UserEditProfile` eklendi                                     | Brifing 1.4 `moderator`'un kullanıcı düzenlemesine "Sınırlı" diyor ama enum yalnız tam yetkili `UserEdit`'i tanıyordu ve `ROLE_PERMISSIONS` moderator'a onu veriyordu: **matris sınırlarken kod tam yetki veriyordu.** Kapsam: ad, e-posta, telefon, avatar, firma adı |
| `AdminPermission`            | `UserEditContact` eklendi                                     | Aynı hücrenin `destek` hâli ("Sınırlı destek alanları"), daha dar kapsam: yalnız e-posta ve telefon. `UserEdit` artık tam yetki olarak yalnız `superAdmin`'de                                                                                                          |
| `AdminPermission`            | `ReportTriageLimited` eklendi                                 | Matris `icerikDenetcisi`'nin şikayet triage'ına "Sınırlı" diyor, `ROLE_PERMISSIONS` tam `ReportTriage` veriyordu. Kademe okur, sınıflandırır, eskale eder; `severity` ve `assignedAdminId` değiştiremez                                                                |
| `FilterValue`                | `NumberRange` eklendi                                         | Brifing `numberRange` filtre tipi tanımlamış ama birleşimde aralık üyesi yok; tek `number` "en az 500.000" ile "en çok 500.000"ü ayıramıyor. `dateRange`'in `DateRange`'i zaten vardı, bu onun simetriği                                                               |
| `FilterDefinition`           | `searchable` eklenmedi, 8 seçenek eşiği kondu                 | Brifing il/ilçe/mahalle'nin aranabilir olmasını şart koşuyor ama bayrak tanımlamamış; eşik (`ARAMA_ESIGI`) sözleşmeyi büyütmeden çözüyor                                                                                                                               |
| DTCG token JSON              | Eklenmedi                                                     | Tasarımcı/Figma yok; gelince Style Dictionary ile eklenir                                                                                                                                                                                                              |
| `Button.test.tsx`            | Yazılmıyor                                                    | addon-vitest story testleri aynı işi yapıyor                                                                                                                                                                                                                           |
| `AutomatedCheckItem`         | Silindi; panel `AutomatedCheckResult[]` alıyor                | Kullanıcı onayladı. `ModerationSummary.automatedChecks` zaten o tip; ayrı DTO her ekrana elle çeviri yaptırıp `status`'ü enum'dan string'e düşürüyor ve `label`'ı domain'den component'e taşıyordu                                                                     |
| `PHOTO_REJECTION_REASONS`    | Fotoğraf reddine 7 gerekçelik alt küme                        | **Sorulmadan karar verildi.** Brifing fotoğraf reddinde de `RejectionReason`'ı kullanıyor ama alt küme tanımlamamış; "Fiyat Hatası" veya "Yanlış Kategori" bir fotoğrafın suçu olamaz, 15 seçenek yanlış gerekçe seçtirir                                              |
| `BaseFixtureArgs.revision`   | Eklendi (varsayılan 1)                                        | `moderationEvents.ts`'te `edited` olayı olan ilan revizyon 1'de kalamaz; fixture kendi geçmişiyle çelişemez                                                                                                                                                            |

## Teknoloji

React 19 · TypeScript 6 (strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`)
· Vite 8 · **Base UI** (headless primitive'ler) · **vanilla-extract** (`.css.ts`)
· React Router 8 · TanStack Query/Table/Form/Virtual · Storybook 10 · react-day-picker
(takvim; Base UI'da tarih primitive'i yok) · Recharts + lucide-react.

Faz 2'den iki not:

- **`SidebarNav` Router context'i gerektiren ilk component** (`Link` kullanıyor).
  Storybook'ta global `withRouter` var, ama SidebarNav'ı — ve onu saran
  AppShell'i — kullanan her yeni test/ekran bir Router içinde olmalı.
- **Recharts `Cell` 3.9'da deprecated** (4.0'da kalkacak, yerine `shape`/`content`).
  3.x'te çalışıyor; yalnız story kodunda kullanılıyor ve borç olarak notlanıyor.

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
**Faz 2 bitti:** 29/29 composite. Son turda kalan 15'i yazıldı — kabuk
(`AppShell`, `SidebarNav`, `TopBar`, `PageHeader`), dashboard (`StatCard`,
`ChartCard`), yönetim (`RolePermissionMatrix`, `CategoryTree`, `AttributeEditor`)
ve detay panelleri (`UserSummaryCard`, `ReportCard`, `ListingFacts`,
`LocationPanel`, `SellerPanel`, `PromotionFlagsPanel`).

**Fixture'lar tamam:** `listings.ts`, `moderationEvents.ts`, `users.ts`,
`reports.ts`, `dashboard.ts`. Eksik yok.

**Sırada: Faz 3'ün 11 ekranı.** Ekran tanımları brifingde (sırası gelince oku).
Ama önce aşağıdaki **sözleşme boşlukları** bölümüne bak: Faz 2'nin component'leri
on yedi boşluk raporladı ve hiçbirini uydurarak kapatmadı — ekranlar o prop'ları
arayacak.

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

### Faz 2'nin son turunda kurulan yapılar

- **Üç yeni izin kademesi** (`UserEditProfile`, `UserEditContact`,
  `ReportTriageLimited`) ve `ROLE_PERMISSIONS`'ın brifing 1.4'e uydurulması —
  gerekçeler sapmalar tablosunda. Kademeler **dışlayıcı değil kapsayıcıdır**:
  `superAdmin` hem tamına hem sınırlısına sahip. Dolayısıyla "bu kullanıcı sınırlı
  mı?" sorusu `includes(UserEditContact)` ile **cevaplanamaz** — yetki sınayan kod
  önce tamını (`UserEdit` / `ReportTriage`) sorsun, sınırlı kademeye ondan sonra
  düşsün.
- **`fixtures/users.ts`** — altı hesap (bireysel, emlak ofisi, inşaat firması,
  doğrulama bekleyen, askıya alınmış, banlanmış) + dört admin (her `AdminRole`
  bir kez) + iki `UserSanction` (`activeSuspensionSanction`,
  `permanentBanSanction`) ve `userByStatus`/`userByRole`/`userByType` indeksleri.
- **`fixtures/reports.ts`** — yedi şikayet; `reportByStatus`/`reportBySeverity`
  indeksleri. `kadikoyApartmentReports` aynı ilana bağlı üç şikayet taşıyor
  ("benzer şikayet" senaryosu için), `emptyReportFixtures` boş durum için.
- **`fixtures/dashboard.ts`** — beş sayı brifing 5.2'den **birebir**, ikisi
  (`publishedListingCount`, `rejectedListingCount`) türetilmiş. Sayılar
  birbirini tutuyor ve bunun gerekçesi dosyanın başında yazılı: red oranı
  281/3.381 = 0,083, kategori dağılımının toplamı yayın sayısına eşit, oranların
  toplamı kayan noktada da tam 1. Pencere sabit (2026-06-17 → 2026-07-16), seri
  elle yazılmış — `new Date()` yok. **Bu ilişkileri bozmadan sayı değiştirme.**
- **`domain/labels.ts` enum etiketleri tamamlandı** — 61 sözlük; `AdminPermission`
  32 iznin hepsini, üç "sınırlı" kademeyi parantezli kapsamıyla birlikte
  etiketliyor.

### Faz 1'de düzeltilen beş hata (Faz 2 sırasında bulundu)

Beşi de testler geçerken bozuktu; ikisi ancak ekran görüntüsüyle, ikisi ancak
yeni bir tüketici geldiğinde görüldü. Gerekçeleri "tuzaklar" bölümünde:

- `Button` — `loading` iken erişilebilir adı kayboluyordu (`visibility` → `opacity`).
- `NumberInput` / `CurrencyInput` — sayı biçimi kullanıcının makinesine göre
  değişiyordu (`locale="tr-TR"` sabitlendi).
- `Modal` — gövdesiz kullanımda başlıkla footer arasında boş bant kalıyordu
  (`body:empty` dolgusu sıfırlandı; ConfirmDialog'un ihtiyacı).
- `Select` — `value` koşullu spread ile geçiliyordu; Base UI kontrollülüğe **ilk
  render'daki** değere bakarak karar verdiği için `undefined` ile başlayan her
  çağıran Select'i önce kontrolsüz kuruyor, ilk seçimde kontrollüye çeviriyordu
  ve Base UI her seçimde console.error basıyordu. `value={value ?? null}`
  kontrollülüğü component'in ömrü boyunca sabitliyor. **Koşullu spread her yerde
  doğru değil:** `error`/`label`'da yokluk ile `undefined` aynı şeydir, `value`'da
  değildir — orada yokluk "kontrolsüz" demektir. Tetikleyen ilk tüketici
  ImageGallery'nin fotoğraf reddiydi; testler geçiyordu çünkü hiçbiri konsolu
  dinlemiyordu.
- `Toast` — `createPortal(...)` sonucunu doğrudan `return` ediyordu ve
  react-docgen "No suitable component definition found" deyip **dosyanın tamamını
  atlıyordu**: yedi prop'u belgeli olduğu hâlde ne Controls'ta ne AI
  manifest'inde görünüyordu. `@/` tuzağının aynısı, sebebi farklı. Portal ayrı
  bir component'e alındı. Story testiyle korunamaz (`__docgenInfo` yalnız
  `storybook build`/`dev` sırasında iliştiriliyor, vitest'te tanımsız) —
  koruyan şey aşağıdaki manifest sayım betiği.

### Prop JSDoc borcu — KAPANDI (144 → 0), ölçüm betiği duruyor

Faz 1'de sessizce delinen "Prop JSDoc'u zorunlu" kuralının borcu son turda
kapatıldı: **katalogdaki 55 component'in (26 primitive + 29 composite) prop'ları
belgeli.** En büyük kaldıraç beklendiği yerdeydi — `FieldMetaProps`'un dört
yorumu tek başına dokuz component'te 36 prop kapattı.

**Manifest'ten doğrulandı** (Faz 2 kapanışı): 55 component, **388 prop, 0'ı
açıklamasız**, react-docgen'in atladığı component yok. Kapatma turunun kendi
sayısı statikti; kanonik ölçüm aşağıdaki betiktir ve o da 0 diyor.

**Kural duruyor: yeni component eklerken boş bırakma.** Bu açıklamalar Storybook
Controls paneline ve `manifests/components.json`'a doğrudan akıyor; yazılmazsa o
kanal sessizce boşalır ve kimse fark etmez. Borç bir kez ödendi, ikinci kez
ödenmesin.

**Ölçüm betiği — regresyon için sakla, faz sonlarında çalıştır.** Kanonik ölçüm
manifest üzerinden yapılır, çünkü **miras alınan prop'ları da sayar**
(`FieldMetaProps`, native attribute'lar):

```bash
pnpm build-storybook   # sonra manifest'i say (proplar `reactDocgen.props` altında)
node -e "const m=JSON.parse(require('fs').readFileSync('./storybook-static/manifests/components.json','utf8'));
for (const c of Object.values(m.components)) { const p=Object.entries(c.reactDocgen?.props ?? {});
if (!p.length) continue; const e=p.filter(([,x])=>(x.description??'')==='').map(([k])=>k);
if (e.length) console.log(c.name.padEnd(16), (p.length-e.length)+'/'+p.length, e.join(', ')) }"
```

Manifest hiç üretilemiyorsa (`build-storybook` yasaklı bir turdaysan) kaba
statik sayım da sinyal verir: `component-props.ts`'te `export interface`
gövdelerinde JSDoc'suz üye ara. Son statik ölçüm: **554 bildirilen prop, 150'si
belgesiz — hepsi Faz 3'ün henüz yazılmamış ekran tipleri** (11 `*PageProps` +
`*FilterValues` + `*Data`, 134 prop) **ve component prop'u olmayan yardımcı
tipler** (`UiError`, `DateRange`, `NumberRange`, `ColumnDef`; 16 prop —
manifest'te prop olarak görünmezler ama `ColumnDef`'i elle yazan çağıranı
ilgilendirirler). **Faz 3 ekranları bu 134 prop'u yazarken belgelesin, borç
yeniden doğmasın.**

**Native attribute'lar da sayılıyor.** `Button`/`IconButton`'da `disabled` ve
`type`, ButtonHTMLAttributes'tan geliyor ama component imzasında varsayılanları
olduğu için react-docgen onları prop sayıyor — belgelenmezse Controls'ta boş
görünüyorlar. Belgelemek için interface'te yeniden bildir; tipi native'le
birebir aynı yaz (`disabled?: boolean | undefined`), yoksa
`exactOptionalPropertyTypes` TS2320 verir (bkz. `InputProps.required` sapması).

## Faz 3'e girmeden çözülmesi gerekenler — sözleşme boşlukları

Faz 2'nin son 15 component'i bunları **raporladı, uydurmadı**: hiçbiri
`component-props.ts`/`domain.ts`/`labels.ts`'e dokunmadı; boşluğu görünür bir
kararla doldurup gerekçesini JSDoc'a yazdı. Hiçbiri Faz 2'yi bloke etmedi —
hepsi Faz 3'ü bloke edebilir, çünkü ekranlar bu prop'ları arayacak.

### `domain/labels.ts`

- **`USER_VERIFICATION_LABEL` yok — iki çağıranlı borç, tek satırlık iş.**
  `UserAccount.verified` iki değerli bir bayrak ama etiketi yok; UserSummaryCard
  ve SellerPanel şu an **dört değerli** `SELLER_VERIFICATION_STATUS_LABEL`'dan
  (`SellerSummary.verificationStatus` için yazılmış) köprü kuruyor ve köprülüğü
  JSDoc'ta açıkça yazıyor. Yanlışlık tipte görünüyor; üstelik `USER_TYPE_LABEL`'ın
  kendi JSDoc'u tam da "`SELLER_TYPE_LABEL` ile karıştırılmamalı" diye uyarıyor.
  Önerilen: `USER_VERIFICATION_LABEL = { true: 'Doğrulanmış', false: 'Doğrulanmamış' }`.
  Eklenince iki köprü fonksiyonunun **gövdesi** değişir, çağrı yerleri değişmez.
- **Boolean değer sözlükleri yok.** ListingFacts iki yerel yardımcı tutuyor:
  `varYok()` ("Var"/"Yok" — `hasBalcony`, `hasElevator`, `hasOperatingLicense`
  gibi "sahip mi" alanları) ve `evetHayir()` ("Evet"/"Hayır" — `furnished`,
  `swapAccepted`, `inComplex`, `transferIncluded` gibi "öyle mi" alanları). Aynı
  metinler filtre ve karşılaştırma tablosunda da görünecek; tek yerde durdukları
  için taşımak şimdi ucuz (`BOOLEAN_HAS_LABEL` / `BOOLEAN_IS_LABEL`).
- **Metrik alan etiketleri yok.** `LISTING_FIELD_LABEL` yalnız "Metrikler" diyor;
  `viewCount`/`favoriteCount`/`messageCount`/`reportCount` etiketsiz. Brifing 2.5
  metrikleri gösterilecek veri sayıyor ama 3.4'te **sahibi bir composite yok** —
  ListingFacts bilerek almadı (işi "kategoriye göre alanları göstermek"). Sahibi
  ekran fazında kararlaştırılmalı.
- **`LOCATION_FIELD_LABEL` yok** — şimdilik kural ihlali değil: `Location`'ın
  alanları düz string/number, ortada enum yok ve tek tüketici LocationPanel. Altı
  dize component içinde, JSDoc'ta belirtilmiş. ListingFacts veya AttributeEditor
  aynı adlara ihtiyaç duyarsa taşınmalı; `USER_VERIFICATION_LABEL` köprüsüyle
  aynı desen.

### `types/component-props.ts`

- **`onRetry` kanalı yok: `ChartCardProps` _ve_ `DataTableProps`.** İkisi de
  `error?: UiError` alıyor ve `retryable`'ın JSDoc'u "tekrar denenip
  denenemeyeceğini söyler" diyor — ama eyleme dönüştürecek kanal yok. ChartCard
  ErrorState'i `onRetry`'siz çağırıyor, yani buton hiç çıkmıyor (basınca bir şey
  yapmayan buton koymaktansa doğrusu bu; `ErrorHasNoRetryButton` ölçüyor).
  **İkisi birlikte çözülmeli.**
- **`ChartCardProps.empty` yalnız bayrak** — boş durumun metni ve eylemi
  dışarıdan verilemiyor, kart brifing 2.2'nin genel metnini gömmek zorunda kaldı.
  Filtre sonucu boşluğunda "filtreleri temizle" gerekirse
  `DataTableProps.emptyState` ile simetrik bir `emptyState?: ReactNode` lazım.
- **`RolePermissionMatrixProps.baseline`** — `diff` varyantı "değişen hücreler"
  göstermek zorunda ama sözleşme **neye göre** değiştiğini söylemiyor. Şimdilik
  taban `ROLE_PERMISSIONS` varsayıldı (JSDoc'ta ve story'lerde açıkça yazılı) ve
  bu varsayım yalnızca kayıtlı izinler domain sabitiyle aynı kaldığı sürece doğru:
  superAdmin bir izni değiştirip **kaydettiği an** backend'in gerçeği sabitten
  ayrılır ve matris o tarihten sonra her açılışta "değişmiş" hücreler göstermeye
  başlar — diff sessizce yalan söyler. Backend gelince kesinlikle olacak.
  `baseline?: Record<AdminRole, readonly AdminPermission[]>`: verilirse ondan,
  verilmezse `ROLE_PERMISSIONS`'tan okumak geriye dönük uyumlu bir düzeltme.
- **`StatCardProps.sparkline`** — `variant` JSDoc'u `trend` için "mini bir eğri
  için yer açar" diyor ama eğrinin verisini taşıyan alan yok. StatCard yer
  **ayırmıyor**: veri kanalı olmayan bir şey için boşluk ayırmak her kartta kalıcı
  bir delik demek. `TimeSeriesPoint` domain'de zaten var ve `fixtures/dashboard.ts`
  iki seriyi (`dailyNewListings`, `dailyModerationCount`) tam o biçimde veriyor —
  **veri hazır, taşıyıcı yok.** Alternatif: JSDoc'tan o cümleyi çıkarıp eğriyi
  ChartCard'a bırakmak. İkisi aynı ekranda; karar dashboard yazılırken netleşir.
- **`TopBarProps`'ta bildirim kanalı yok.** Brifing 3.4 TopBar'ı "global arama,
  profil ve **bildirim**" diye tanımlıyor; sayaç okunabiliyor ama listeye gitmenin
  hiçbir yolu yok. Gösterge olarak bırakıldı — basınca hiçbir şey yapmayan zil,
  kapalı zilden kötü. `onNotificationsClick` (veya `notificationsHref`) eklenirse
  değişecek tek yer: göstergeyi saran `<span role="status">` bir `IconButton`'a
  döner, rozet ve gizli metin aynen kalır.
- **`PageHeaderProps.secondaryActions`'ın JSDoc'u gerçekleştirilemez şey vaat
  ediyor:** "dar ekranda taşarsa bir '…' menüsüne toplanır". Prop `ReactNode`
  olduğu sürece bu **imkânsız** — component kaç eylem olduğunu sayamaz, hangisini
  menüye alacağını seçemez (`Children.toArray` fragment/dizi/tek düğüm ayrımını
  tahmine bırakır) ve repoda menü primitive'i de yok (Select/MultiSelect var,
  DropdownMenu yok). Ya JSDoc "taşarsa alt satıra sarar; menü gerekiyorsa sayfa
  kurup hazır geçer" olmalı (yazılan bu, gerekçesi JSDoc'ta), ya da prop
  `PageHeaderAction[]` gibi **sayılabilir** bir sözleşmeye çevrilmeli — o zaman
  menü primitive'i de gerekir. Aynı dosyada **`BreadcrumbItem.label`** "dar
  ekranda kısalır" diyor; kısaltma uygulanmadı, çünkü kısaltılmış yol bilgi
  kaybettirir, sarma kaybettirmez — JSDoc "sarar" olmalı.
- **`UserSummaryCardProps` yaptırım kaydını göremiyor.** Yalnız
  `user: UserAccount` alıyor: `status` yaptırımın **olduğunu** söylüyor ama
  `UserSanction` (gerekçe, `startsAt`, `endsAt`, `revokedAt`) sözleşmede yok.
  Brifing 2.6 "aktif yaptırım"ı gösterilecek veri sayıyor ve `fixtures/users.ts`
  `activeSuspensionSanction`'ı `endsAt` ile yazdı — "askı 29 Tem'de bitiyor"
  yaptırım kararı verirken tam olarak bakılan bilgi. Kart bugün yaptırımın
  **tipini** durumdan türetiyor, "neden" ve "ne zamana kadar"ı susarak geçiyor
  (uydurmaktansa doğrusu bu). Önerilen: `activeSanction?: UserSanction`.
- **`SellerPanelProps`: `activeListingCount?` ve `sanctions?`.** Panel
  `user.activeListingCount`'u okumuyor (süzülmüş prop ile hesabın toplamı yan yana
  çelişkili çıkardı), dolayısıyla "yayında kaç ilanı var" — brifing 2.6'nın görünen
  verisi — bu panelde cevapsız; `listingCount`/`openReportCount` ile aynı bağlamdan
  gelen bir prop tutarlı olur. `risk` varyantı da brifing 3.4'ün istediği "yaptırım
  geçmişi"ni gösteremiyor: `UserStatus`'ten yalnız **yürürlükteki** yaptırımın tipi
  türetilebiliyor, gerekçe ve kaldırılmış geçmiş yaptırımlar görünmüyor.
  `allUserSanctionFixtures` hazır bekliyor.
- **`ReportCardProps`: üç boşluk.** (1) `now?: ISODateTime` — `variant` JSDoc'u
  "queue: şiddet ve **bekleme süresi** öne çıkar" diyor ama yaş hesabı "şimdi"yi
  gerektiriyor ve component saati kendi okuyamaz (göreli zaman tuzağı); kart şu an
  açılış anını mutlak tarih olarak gösteriyor. (2) **Ad çözümleme** — brifing 2.8
  "şikayet eden kullanıcı" ve "atanan admin" göstermeyi şart koşuyor ama sözleşme
  yalnız `reporterUserId`/`assignedAdminId` (UUID) veriyor ve kart veri çekemez;
  ham kimlik basılıyor. İsim isteniyorsa `reporter?: UserAccount` +
  `assignedAdmin?: AdminUser`. (3) `relatedReportCount?: number` — brifing 2.8'in
  "benzer şikayet sayısı" verisi sözleşmede hiç yok; `kadikoyApartmentReports`'un
  üç şikayeti bunu kart üzerinde gösteremiyor, yalnız yan yana üç kart olarak
  (`SameListingReports`) görünüyor.
- **`ListingFactsProps.headingLevel`** — `sections` varyantı bölüm başlıklarını
  `<h3>` basıyor; panel bir detay sayfasının içinde yaşadığı için bu bir
  **varsayım**. Sayfa katmanı gelince `headingLevel?: 2 | 3 | 4` gerekebilir
  (kodda yorumla işaretli).

### `types/domain.ts` (dikkat: fiilen FastAPI'nin şartnamesi)

- **Kategori → alt kategori / işlem türü eşlemesi yok.** `labels.ts` altı ayrı alt
  kategori sözlüğü tutuyor ama "hangi alt kategori hangi kategoriye ait" bilgisi
  hiçbir yerde yok. Bu bir **iş kuralı**; AttributeEditor onu `.tsx`'e gömmeyi
  reddetti (süzülmemiş liste "Arsa" özniteliğine "Daire" seçtirir, eşlemeyi görünüm
  katmanına saklamak kuralı kaçırır) ve kapsamı üç modda da okunur rozet olarak
  gösterip düzenlemeyi CategoryTree'ye bıraktı (brifing 2.7 "kategori düğümü
  seçme"yi zaten ayrı bir eylem sayıyor). Gereken: `domain/categoryTree.ts` →
  `CATEGORY_SUB_CATEGORIES: Record<ListingCategory, ListingSubCategory[]>` +
  `CATEGORY_TRANSACTION_TYPES: Record<ListingCategory, ListingTransactionType[]>`.
  Gelirse kapsam MultiSelect'e çevrilebilir.
- **`CategoryAttributeDefinition.updatedBy` yok.** Brifing 2.7 "son güncelleyen
  admin ve tarih" istiyor ama tipte yalnız `createdAt`/`updatedAt` var; editör
  `readOnly`'de yalnız tarihi gösteriyor. Admin adı da istenecekse
  `updatedBy: UUID` (veya `AdminSummary`) eklenmeli — **backend sözleşmesi olduğu
  için bilerek dokunulmadı.**
- **"Kesin konumu görme" izni yok** (aday, karar bekliyor).
  `LocationPanelProps.revealExactLocation` bir **gösterim** kapısıdır, yetki kapısı
  değil — kimin açabileceğine sayfa katmanı karar veriyor (prop JSDoc'u ve
  story'nin `doNotUseWhen`'i böyle diyor). Ama `AdminPermission`'da karşılığı yok.
  Bu turda eklenen kademeli izinlerin mantığıyla `ListingViewExactLocation` gibi
  bir izin gerekebilir; `ListingReviewPanel`'e gelince karar verilmeli. Uydurulmadı.

### `vite.config.ts` — kapandı

- **`recharts` `optimizeDeps.include`'a eklendi** (Faz 2 kapanışı). ChartCard
  reponun ilk recharts tüketicisiydi ve bildirilmemişti; oradaki yorumun
  anlattığı sıcak-cache "Failed to fetch dynamically imported module" hatası bu
  bağımlılıkta da bekleniyordu. Kural aynen duruyor: **yeni bir Base UI alt yolu
  ya da story'lerin dolaylı yüklediği yeni bir paket eklersen bu listeye de ekle.**

### Boşluk değil, kasıt — karıştırma

- **`SidebarNav` yetkiye göre süzmüyor.** `NavigationItem.requiredPermission` var
  ama `SidebarNavProps`'ta kullanıcının izin listesi yok. Bu **eksik değil**,
  "yetki kontrolü component'in işi değil" kuralının doğal sonucu: alan, süzmeyi
  yapan sayfa katmanına bırakılmış bir _bildirimdir_ ve menü tanımını tek yerde
  tutar. Uydurma prop (`permissions`) eklenmedi; boşluğu component JSDoc'u ve
  `doNotUseWhen` açıkça yazıyor, `RequiredPermissionIsNotAGate` regresyon testi
  olarak duruyor (yetkisiz satır `items`'a konursa component onu olduğu gibi
  gösterir) ve süzmeyi örnekleyen `yetkiyeGöreSüz` story dosyasında,
  `ROLE_PERMISSIONS`'tan okuyor. **Faz 3'te AppShell/sayfa katmanı bu süzgeci
  gerçek yerine taşımalı; oraya kadar sözleşme değişmesin.**
- **Panellerde `loading`/`error` kanalı yok** (PromotionFlagsPanel, ReportCard,
  SellerPanel) ve bu yüzden Loading/Error story'si yazılmadı; gerekçe story
  dosyalarında yorumlu. Panel veri çekmiyor: ilan detayının yükleme/hata durumu
  **sayfanın işi** (bkz. açık `AsyncState` maddesi). Panelin kendi iskeletini
  uydurması, veri gelmediğinde "promosyon yok" demekle aynı yalanı söylerdi.
- **`AppShellProps.sidebarMode` bir düzen bildirimidir, düğme anahtarı değil.**
  JSDoc'u "collapsible: daralt/genişlet düğmesi görünür" diyor ama o düğmeyi
  AppShell render etmiyor, edemez de — sözleşmesinde `onCollapsedChange` yok.
  Düğme SidebarNav'ındır (`onCollapsedChange` verilmezse hiç görünmüyor, ki bu
  `SidebarNavProps`'un JSDoc'unda "AppShell'in fixed hâli" diye yazılı). Zinciri
  sayfa katmanı kurar. İki JSDoc tutarlı; ekleme gerekmiyor.
- **`CategoryTree`'de sayaç/rozet okuması.** `variant` JSDoc'u "panel: … sayaçlar
  ve pasiflik rozeti görünür" diyor; düz okunursa sayaçlar yalnız panel'de
  görünürdü. Ama `CategoryTreeNode.count`'un kendi JSDoc'u "verilmezse sayaç
  gösterilmez" diyor ve varyanttan hiç bahsetmiyor. Kurulan tutarlı okuma: **sayaç
  verilen her varyantta görünür** (count sözleşmesi), **pasiflik rozeti yalnız
  panel'de** (variant sözleşmesi) — dar varyantlarda ikon + gizli metin. Panel'in
  tarifi hâlâ doğru, sadece münhasır değil. Başka bir şey kastedildiyse tek
  satırlık netleştirme yeter.
- **`SearchInput` kontrollü kullanımda kendini temizlemez.** `onClear` yalnız haber
  verir; değerin sahibi çağırandır. Bağlanmazsa temizleme düğmesi görünür ama
  hiçbir şey yapmaz — sessiz bozukluk. TopBar
  `onClear={() => onSearchChange('')}` bağlıyor, `SearchActive` ölçüyor. Aynısını
  her yeni tüketici yapmalı.
- **`mobileOpen` zorunlu değil ama `onMobileOpenChange` olmadan anlamsız.**
  Çekmeceyi açıp kapatamamak klavye tuzağı olurdu, bu yüzden SidebarNav handler
  yoksa çekmeceyi **hiç render etmiyor**; aynı asimetri `collapsed`/
  `onCollapsedChange` ikilisinde de var. Sözleşme bunu tip düzeyinde ifade
  edemiyor (discriminated union gerekirdi); davranış JSDoc'ta ve
  `DrawerNeedsAHandler` ölçüyor.

## Karar bekleyenler — UYDURMA, SOR

**`destek`'in kullanıcı GÖRÜNTÜLEME'si de "Sınırlı" — ve bu sorulmadı.** Brifing
1.4 matrisi **dört** hücrede "Sınırlı" diyor; üçü çözüldü (sapmalar tablosuna
bak), dördüncüsü açıkta: satır 304, "Kullanıcı görüntüleme" × `destek`.
`ROLE_PERMISSIONS` şu an oraya **tam `UserView`** veriyor — yani matris
sınırlarken kod tam yetki veriyor; çözülen üç hücrenin hatasının aynısı, bilerek
bırakıldı (`domain.ts`'te yorumla işaretli). `UserViewLimited` uydurma:
**hangi alanların gizleneceği** kararı verilmedi (kimlik/vergi numarası? adres?
ödeme geçmişi? diğer kullanıcıların şikayetleri?). `UserManagementPage` /
`UserDetailPage`'e gelmeden **sor** — o ekranlar sütun sütun bu cevaba dayanacak.

**`AsyncState`** `partialSuccess` ve `unauthorized` ifade edemiyor ama Faz 3'ün story
matrisi ikisini de zorunlu tutuyor. Ekranlara gelince çözülmeli.

**Revizyon çakışması hâlâ ekranın sorunu.** ModerationActionBar çakışmayı
tespit etmiyor, tespit _edilebilir_ kılıyor: kararı `expectedRevision` ile
damgalıyor. Brifing "revision conflict ayrı bir UI durumu olmalıdır" diyor ama
ne çubuğun ne de `ListingReviewPanelProps`'un bir hata kanalı var — Faz 3'te
`AsyncState` ile birlikte çözülmeli.

**Chromatic** ücretsiz planla bu spesifikasyon **matematiksel olarak çalışmıyor**
ve Faz 2 bitince tahminden kötüleşti: **ölçülen 908 story** × 3 tema × 2 viewport
= **5.448 snapshot/build**, kota **5.000/ay** — yani tek bir build aylık kotayı
tek başına aşıyor (Faz 3'ün 11 ekranı daha eklenecek). Org repo'su gündeme
gelince tema×viewport matrisi daraltılmalı ya da ücretli plana geçilmeli.

**Backend** en sona bırakıldı — bu yüzden `src/types/domain.ts` fiilen FastAPI'nin
şartnamesidir. Oradaki tipleri değiştirirken bunu hatırla.

## Git

Kullanıcı **tüm git işlemlerini kendi yapar.** Commit atma, push etme, remote ekleme.
İş bitince faz faz `git add` komutlarını ve commit mesajlarını **metin olarak ver**.
